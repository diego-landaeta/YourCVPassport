// Prueba de 20261104_pagos_stripe.sql (pagos con Stripe) sobre PGlite con el estado REAL de
// producción (stub-base.sql, prod-funcs.sql, stub-triggers.sql) y la cadena 20261028 -> 20261036
// ya aplicada. Nada de esto toca una base real.
//   node supabase/tests/fase7.test.mjs
//
// Comprueba: que se aplica y se reaplica sin cambiar el catálogo; RLS de billing_customers /
// billing_subscriptions / processed_webhook_events (cada titular ve lo suyo, nadie escribe desde
// el cliente, anon nada); companies.plan protegido por trg_companies_proteger_campos (y que el
// resto de la protección sigue igual); add_company_credits_from_payment (solo service_role,
// idempotente por referencia, valida la entrada, suma saldo y total comprado, registra PURCHASE).
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const MIGDIR = HERE + '../migrations/';
const CHAIN = ['20261028_cerrar_email_queue', '20261029_legal_aceptaciones_idioma', '20261030_ofertas_fase2', '20261031_candidaturas_fase3', '20261032_correcciones_auditoria', '20261033_pendientes_bolsa', '20261034_programacion_cron', '20261035_cierre_final', '20261036_moneda_perfil_sin_defecto'];
const PAGOS = '20261104_pagos_stripe';
const SQL = Object.fromEntries([...CHAIN, PAGOS].map((n) => [n, fs.readFileSync(MIGDIR + n + '.sql', 'utf8')]));

let pass = 0, fail = 0;
const out = (s) => console.log(s);
const ok = (c, m, extra) => { if (c) { pass++; out('  OK     ' + m); } else { fail++; out('  FALLO  ' + m + (extra !== undefined ? '  => ' + String(extra).slice(0, 400) : '')); } };
const sec = (t) => out('\n== ' + t + ' ==');
process.on('uncaughtException', (e) => { out('ERROR NO CAPTURADO: ' + String(e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });
process.on('unhandledRejection', (e) => { out('ERROR NO CAPTURADO: ' + String(e && e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });

const U = {
  admin: '00000000-0000-0000-0000-0000000000ad', ana: '00000000-0000-0000-0000-0000000000a1',
  bea: '00000000-0000-0000-0000-0000000000b1', owner: '00000000-0000-0000-0000-0000000000c1',
  member: '00000000-0000-0000-0000-0000000000c2', other: '00000000-0000-0000-0000-0000000000d1',
};
const CO = 'c0000000-0000-0000-0000-000000000001';
const CO2 = 'c0000000-0000-0000-0000-000000000002';

// ---------------------------------------------------------------- base (igual que integrado35)
async function buildDb() {
  const db = new PGlite();
  await db.exec(fs.readFileSync(HERE + 'stub-base.sql', 'utf8'));
  const pf = fs.readFileSync(HERE + 'prod-funcs.sql', 'utf8');
  await db.exec(pf);
  await db.exec(fs.readFileSync(HERE + 'stub-triggers.sql', 'utf8'));
  const parseAcl = (s) => s.slice(1, -1).split(',').map((x) => x.split('=')[0]).map((g) => (g === '' ? 'PUBLIC' : g)).filter((g) => g !== 'postgres');
  const aclMap = {};
  for (const m of pf.matchAll(/^-- (\w+)  ACL real: (\{.*\})$/gm)) aclMap[m[1]] = parseAcl(m[2]);
  Object.assign(aclMap, {
    current_user_is_admin: ['authenticated', 'service_role'], is_company_member: ['authenticated', 'service_role'],
    is_admin: ['PUBLIC', 'anon', 'authenticated', 'service_role'], is_managed_profile: ['anon', 'authenticated', 'service_role'],
    assert_caller_is_admin: ['service_role'], approve_company: ['authenticated', 'service_role'], reject_company: ['authenticated', 'service_role'],
    company_owner_signup_allowed: ['authenticated', 'service_role'], company_users_insert_allowed: ['authenticated', 'service_role'],
    companies_proteger_campos: ['service_role'], create_default_company_settings: ['service_role'], job_postings_proteger_publicacion: ['service_role'],
    notify_company_approved: ['service_role'], notify_company_rejected: ['service_role'], notify_low_credits: ['service_role'], notify_team_member_added: ['service_role'],
    send_email_notification: ['service_role'], queue_email_notification: ['PUBLIC', 'anon', 'authenticated', 'service_role'],
  });
  for (const [name, gr] of Object.entries(aclMap)) {
    const g = gr.map((x) => (x === 'PUBLIC' ? 'public' : x)).join(', ');
    await db.exec(`do $$ declare r regprocedure; begin for r in select p.oid::regprocedure from pg_proc p where p.proname='${name}' and p.pronamespace='public'::regnamespace loop
      execute format('revoke all on function %s from public, anon, authenticated, service_role', r);
      ${g ? `execute format('grant execute on function %s to ${g}', r);` : ''} end loop; end $$;`);
  }
  await db.exec(`
    create schema cron;
    create table cron.job (jobid bigserial primary key, schedule text not null, command text not null, nodename text default 'localhost',
      nodeport int default 5432, database text default 'postgres', username text default current_user, active boolean default true, jobname text unique);
    create function cron.schedule(job_name text, schedule text, command text) returns bigint language sql as
      $$ insert into cron.job(jobname, schedule, command) values (job_name, schedule, command)
         on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command returning jobid $$;
    create function cron.unschedule(job_name text) returns boolean language plpgsql as
      $$ begin delete from cron.job where jobname = job_name; return found; end $$;
    create schema net;
    create table net.calls (id bigserial primary key, url text, body jsonb, params jsonb, headers jsonb, timeout_ms int);
    create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
      headers jsonb default '{"Content-Type": "application/json"}'::jsonb, timeout_milliseconds int default 5000) returns bigint language sql as
      $$ insert into net.calls(url, body, params, headers, timeout_ms) values (url, body, params, headers, timeout_milliseconds) returning id $$;
    create schema vault;
    create table vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text, created_at timestamptz default now(), updated_at timestamptz default now());
    create view vault.decrypted_secrets as select id, name, secret as decrypted_secret, created_at, updated_at from vault.secrets;
  `);
  return db;
}
async function applyMig(db, name) { try { await db.exec(SQL[name]); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } }

function H(db) {
  const as = async (role, uid) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false)", [uid ?? '', role === 'postgres' ? '' : role]);
    if (role !== 'postgres') await db.exec(`set role ${role}`);
  };
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const err = async (sql, params) => { try { await db.query(sql, params); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } };
  return { as, q, err };
}
const isDenied = (e) => !!e && (e.code === '42501' || /permission denied|row-level security|violates row-level/i.test(String(e.message)));

async function catalog(db) {
  const R = async (s) => (await db.query(s)).rows.map((r) => JSON.stringify(r));
  return [
    ...(await R(`select c.relname, c.relrowsecurity, c.relacl::text from pg_class c where c.relnamespace='public'::regnamespace and c.relname in ('billing_customers','billing_subscriptions','processed_webhook_events','companies','company_credits_history') order by 1`)),
    ...(await R(`select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies where schemaname='public' and tablename like 'billing_%' order by 1,2`)),
    ...(await R(`select p.oid::regprocedure::text, p.proacl::text, md5(p.prosrc) from pg_proc p where p.pronamespace='public'::regnamespace and p.proname in ('add_company_credits_from_payment','companies_proteger_campos') order by 1`)),
    ...(await R(`select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid in ('public.companies'::regclass) and conname = 'companies_plan_check'`)),
    ...(await R(`select indexname, indexdef from pg_indexes where schemaname='public' and (tablename like 'billing_%' or indexname like '%stripe%') order by 1`)),
    ...(await R(`select tgname from pg_trigger where tgrelid='public.companies'::regclass and not tgisinternal order by 1`)),
  ];
}

// =====================================================================================================
sec('0. Base real + cadena 20261028 -> 20261036');
const db = await buildDb();
const { as, q, err } = H(db);
await as('postgres');
let chainOk = true;
for (const n of CHAIN) { const e = await applyMig(db, n); if (e) { chainOk = false; ok(false, `cadena: ${n}`, e.message); } }
ok(chainOk, 'la cadena de producción 28 -> 36 se aplica');
if (!chainOk) { out(`\nRESULTADO: ${pass} OK, ${fail} FALLO`); process.exit(1); }

// Datos anteriores a la migración: una empresa con saldo y miembros
for (const [id, email] of Object.entries({ [U.admin]: 'admin@t.dev', [U.ana]: 'ana@t.dev', [U.bea]: 'bea@t.dev', [U.owner]: 'owner@t.dev', [U.member]: 'member@t.dev', [U.other]: 'other@t.dev' })) {
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3::jsonb)', [id, email, '{}']);
}
await db.query("update public.profiles set role='admin' where id=$1", [U.admin]);
await db.query("insert into public.companies(id, company_name, legal_name, tax_id, company_email, status, credit_balance, total_credits_purchased, created_by) values ($1,'Acme SL','Acme SL','B1','rrhh@acme.test','APPROVED',10,0,$2)", [CO, U.owner]);
await db.query("insert into public.companies(id, company_name, legal_name, tax_id, company_email, status, created_by) values ($1,'Otra SL','Otra SL','B2','otra@otra.test','APPROVED',$2)", [CO2, U.other]);
await db.query("insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER'), ($1,$3,'MEMBER'), ($4,$5,'OWNER')", [CO, U.owner, U.member, CO2, U.other]);

// =====================================================================================================
sec('1. Aplicar y reaplicar 20261104_pagos_stripe');
const e1 = await applyMig(db, PAGOS);
ok(!e1, 'primera aplicación', e1 && e1.message);
const cat1 = await catalog(db);
const e2 = await applyMig(db, PAGOS);
ok(!e2, 'segunda aplicación (reaplicable)', e2 && e2.message);
const cat2 = await catalog(db);
ok(JSON.stringify(cat1) === JSON.stringify(cat2), 'reaplicar no cambia el catálogo (tablas, ACL, políticas, funciones, CHECK, índices, triggers)');
ok((await q("select count(*)::int n from pg_class where relname in ('billing_customers','billing_subscriptions','processed_webhook_events') and relrowsecurity"))[0].n === 3, 'RLS activada en las tres tablas');
ok((await q('select plan from public.companies where id=$1', [CO]))[0].plan === 'none', 'empresa existente: plan none');
ok((await q('select credit_balance from public.companies where id=$1', [CO]))[0].credit_balance === 10, 'el saldo existente no cambia');

{
  const d0 = await buildDb();
  const { as: as0 } = H(d0);
  await as0('postgres');
  await d0.exec("drop function public.is_company_member(uuid, text[]) cascade");
  const e = await applyMig(d0, PAGOS);
  ok(!!e && /ABORTADO: falta public.is_company_member/.test(e.message), 'sin 20261007 (is_company_member) aborta con un mensaje claro', e && e.message);
  await d0.close?.();
}

// =====================================================================================================
sec('2. Datos de pago (como los escribiría el webhook con service_role)');
await as('service_role');
await db.query("insert into public.billing_customers(owner_type, owner_id, stripe_customer_id) values ('profile',$1,'cus_Ana'), ('profile',$2,'cus_Bea'), ('company',$3,'cus_Acme'), ('company',$4,'cus_Otra')", [U.ana, U.bea, CO, CO2]);
await db.query(`insert into public.billing_subscriptions(stripe_subscription_id, owner_type, owner_id, product_key, price_id, status, trial_end)
  values ('sub_Ana','profile',$1,'pro_monthly','price_ProMes','trialing', now() + interval '14 days'),
         ('sub_Bea','profile',$2,'pro_annual','price_ProAno','active', null),
         ('sub_Acme','company',$3,'starter_monthly','price_StarterMes','active', null),
         ('sub_Otra','company',$4,'growth_monthly','price_GrowthMes','active', null)`, [U.ana, U.bea, CO, CO2]);
await db.query("insert into public.processed_webhook_events(event_id, type) values ('evt_1','invoice.paid')");
ok((await q('select count(*)::int n from public.billing_subscriptions'))[0].n === 4, 'service_role escribe suscripciones');
const dup = await err("insert into public.processed_webhook_events(event_id, type) values ('evt_1','invoice.paid')");
ok(dup && dup.code === '23505', 'evento repetido -> 23505 (lo que usa el webhook para descartarlo)', dup && dup.message);
ok(!!(await err("insert into public.billing_customers(owner_type, owner_id, stripe_customer_id) values ('profile',$1,'cus_Otro')", [U.ana])), 'un solo cliente por titular (PK owner_type, owner_id)');
ok(!!(await err("insert into public.billing_customers(owner_type, owner_id, stripe_customer_id) values ('company',$1,'no-es-un-cliente')", [U.other])), 'CHECK del formato de stripe_customer_id');
ok(!!(await err("insert into public.billing_subscriptions(stripe_subscription_id, owner_type, owner_id, status) values ('sub_X','admin',$1,'active')", [U.ana])), 'CHECK de owner_type');

// =====================================================================================================
sec('3. RLS: cada titular lee lo suyo; nadie escribe desde el cliente');
await as('authenticated', U.ana);
let rows = await q('select stripe_subscription_id from public.billing_subscriptions order by 1');
ok(rows.length === 1 && rows[0].stripe_subscription_id === 'sub_Ana', 'Ana solo ve su suscripción', JSON.stringify(rows));
rows = await q('select stripe_customer_id from public.billing_customers');
ok(rows.length === 1 && rows[0].stripe_customer_id === 'cus_Ana', 'Ana solo ve su cliente', JSON.stringify(rows));
ok(isDenied(await err("insert into public.billing_subscriptions(stripe_subscription_id, owner_type, owner_id, product_key, status) values ('sub_Fake','profile',$1,'pro_monthly','active')", [U.ana])), 'Ana NO puede crearse una suscripción');
ok(isDenied(await err("update public.billing_subscriptions set status='active', trial_end=null where stripe_subscription_id='sub_Ana'")), 'Ana NO puede cambiar el estado de su suscripción');
ok(isDenied(await err("delete from public.billing_customers where owner_id=$1", [U.ana])), 'Ana NO puede borrar su cliente');
ok(isDenied(await err('select * from public.processed_webhook_events')), 'authenticated no lee processed_webhook_events');

await as('authenticated', U.member);
rows = await q('select stripe_subscription_id from public.billing_subscriptions order by 1');
ok(rows.length === 1 && rows[0].stripe_subscription_id === 'sub_Acme', 'un MEMBER de Acme ve la suscripción de su empresa (y no la de Otra)', JSON.stringify(rows));
await as('authenticated', U.owner);
rows = await q("select owner_type from public.billing_customers");
ok(rows.length === 1 && rows[0].owner_type === 'company', 'el OWNER ve el cliente de su empresa');
ok(isDenied(await err("update public.billing_customers set stripe_customer_id='cus_Robado' where owner_id=$1", [CO])), 'el OWNER NO cambia el cliente de su empresa');

await as('anon');
ok(isDenied(await err('select * from public.billing_subscriptions')), 'anon no lee billing_subscriptions');
ok(isDenied(await err('select * from public.billing_customers')), 'anon no lee billing_customers');
ok(isDenied(await err('select * from public.processed_webhook_events')), 'anon no lee processed_webhook_events');

// =====================================================================================================
sec('4. companies.plan protegido (y el resto de la protección intacta)');
// En producción ningún miembro tiene política UPDATE sobre companies (solo admins): el UPDATE
// del cliente no toca filas. Se comprueba eso y, además, el trigger con una política de
// propietario temporal (el caso que 20261007 dejó cubierto «si existe en la BD»).
await as('authenticated', U.owner);
const sinPolitica = await db.query("update public.companies set plan='growth' where id=$1", [CO]).catch((e) => e);
ok(sinPolitica instanceof Error ? isDenied(sinPolitica) : sinPolitica.affectedRows === 0, 'sin política de propietario: el UPDATE del OWNER no toca la fila');
await as('postgres');
await db.exec("create policy \"prueba propietario edita\" on public.companies for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid())");
await as('authenticated', U.owner);
const ePlan = await err("update public.companies set plan='growth' where id=$1", [CO]);
ok(isDenied(ePlan) && /PROTECTED_FIELD: el plan/.test(ePlan.message), 'con política de propietario: cambiar plan -> 42501 PROTECTED_FIELD (trigger)', ePlan && ePlan.message);
ok(isDenied(await err("update public.companies set credit_balance=99999 where id=$1", [CO])), 'el OWNER sigue sin poder cambiar créditos');
ok(isDenied(await err("update public.companies set status='SUSPENDED' where id=$1", [CO])), 'ni el estado');
const eNombre = await err("update public.companies set company_name='Acme Renombrada' where id=$1", [CO]);
ok(!eNombre, 'pero sí los datos normales (nombre)', eNombre && eNombre.message);
await as('postgres');
await db.exec('drop policy "prueba propietario edita" on public.companies');
await as('authenticated', U.owner);
const ins = await err("insert into public.companies(id, company_name, legal_name, tax_id, company_email, plan, credit_balance) values ('c0000000-0000-0000-0000-000000000009','Nueva','Nueva SL','B9','n@n.test','enterprise',500)");
ok(!ins, 'el alta de empresa sigue funcionando', ins && ins.message);
await as('postgres');
const nueva = (await q("select plan, credit_balance, status from public.companies where id='c0000000-0000-0000-0000-000000000009'"))[0];
ok(nueva && nueva.plan === 'none' && nueva.credit_balance === 0 && nueva.status === 'PENDING', 'alta de cliente: plan forzado a none (y créditos 0, PENDING)', JSON.stringify(nueva));
await as('service_role');
ok(!(await err("update public.companies set plan='starter' where id=$1", [CO])), 'service_role (webhook) sí cambia el plan');
await as('authenticated', U.admin);
ok(!(await err("update public.companies set plan='enterprise' where id=$1", [CO2])), 'un admin sí puede poner enterprise');
await as('postgres');
const planes = (await q('select id, plan from public.companies where id in ($1, $2) order by id', [CO, CO2])).map((x) => x.plan);
ok(planes[0] === 'starter' && planes[1] === 'enterprise', 'planes guardados (starter por service_role, enterprise por admin)', JSON.stringify(planes));
ok(!!(await err("update public.companies set plan='premium' where id=$1", [CO])), 'CHECK: plan fuera de none/starter/growth/enterprise rechazado');
// profiles.plan (ya protegido desde 20261005): el webhook (service_role) lo cambia; el usuario no.
await as('authenticated', U.ana);
ok(isDenied(await err("update public.profiles set plan='pro' where id=$1", [U.ana])), 'perfil: el usuario NO puede ponerse plan pro');
await as('service_role');
ok(!(await err("update public.profiles set plan='pro' where id=$1", [U.ana])), 'perfil: service_role (webhook) sí');
await as('postgres');
ok((await q('select plan, is_premium from public.profiles where id=$1', [U.ana]))[0].plan === 'pro', 'perfil: plan pro guardado');

// =====================================================================================================
sec('5. add_company_credits_from_payment');
const RPC = 'select public.add_company_credits_from_payment($1::uuid, $2::int, $3::text, $4::jsonb) r';
for (const [role, uid] of [['anon', null], ['authenticated', U.owner], ['authenticated', U.admin]]) {
  await as(role, uid);
  ok(isDenied(await err(RPC, [CO, 1000, 'cs_robo', '{}'])), `${role}${uid === U.admin ? ' (admin)' : ''} NO puede ejecutar la RPC`);
}
await as('service_role');
let r = (await q(RPC, [CO, 150, 'cs_test_1', JSON.stringify({ product_key: 'credits_150', description: 'Pack de 150 créditos (Stripe)', price: '129.00' })]))[0].r;
ok(r.applied === true && r.balance === 160, 'abona 150 créditos (10 + 150)', JSON.stringify(r));
r = (await q(RPC, [CO, 150, 'cs_test_1', '{}']))[0].r;
ok(r.applied === false && r.reason === 'already_processed' && r.balance === 160, 'misma referencia otra vez: no suma (idempotente)', JSON.stringify(r));
r = (await q(RPC, [CO, 100, 'in_test_1', JSON.stringify({ price: 'no-numérico', description: '' })]))[0].r;
ok(r.applied === true && r.balance === 260, 'otra referencia (factura) sí suma', JSON.stringify(r));
await as('postgres');
const co = (await q('select credit_balance, total_credits_purchased from public.companies where id=$1', [CO]))[0];
ok(co.credit_balance === 260 && co.total_credits_purchased === 250, 'saldo y total comprado actualizados', JSON.stringify(co));
const hist = await q("select amount, balance_after, transaction_type, description, metadata from public.company_credits_history where company_id=$1 order by balance_after", [CO]);
ok(hist.length === 2 && hist.every((h) => h.transaction_type === 'PURCHASE'), 'dos filas PURCHASE en el historial', JSON.stringify(hist));
ok(hist[0].metadata.stripe_reference === 'cs_test_1' && hist[0].metadata.source === 'stripe' && hist[0].description === 'Pack de 150 créditos (Stripe)' && hist[0].metadata.price === '129.00', 'referencia, origen, descripción y precio guardados', JSON.stringify(hist[0]));
ok(!('price' in hist[1].metadata) && hist[1].description === 'Compra de créditos', 'precio no numérico descartado y descripción por defecto', JSON.stringify(hist[1]));
ok(!!(await err("insert into public.company_credits_history(company_id, amount, balance_after, transaction_type, metadata) values ($1, 1, 1, 'PURCHASE', '{\"stripe_reference\":\"cs_test_1\"}')", [CO])), 'índice único: la referencia no se puede repetir ni a mano');
await as('service_role');
for (const [label, args] of [
  ['cantidad 0', [CO, 0, 'x1', '{}']], ['cantidad negativa', [CO, -5, 'x2', '{}']], ['sin referencia', [CO, 5, '', '{}']],
  ['referencia null', [CO, 5, null, '{}']], ['empresa inexistente', ['c0000000-0000-0000-0000-0000000000ff', 5, 'x3', '{}']],
]) {
  ok(!!(await err(RPC, args)), `rechaza ${label}`);
}
await as('postgres');
ok((await q('select credit_balance from public.companies where id=$1', [CO]))[0].credit_balance === 260, 'las llamadas rechazadas no cambian el saldo');

out(`\nRESULTADO: ${pass} OK, ${fail} FALLO`);
process.exit(fail ? 1 : 0);
