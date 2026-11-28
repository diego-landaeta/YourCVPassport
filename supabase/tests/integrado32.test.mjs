// Prueba INTEGRADA del encadenado de migraciones de la bolsa de empleo (YourCVPassport):
//   20261028_cerrar_email_queue -> 20261029_legal_aceptaciones_idioma -> 20261030_ofertas_fase2 -> 20261031_candidaturas_fase3
// sobre UNA base PGlite con el estado REAL de producción (stub-base.sql, stub-triggers.sql y prod-funcs.sql,
// leídos con prodsql.mjs, solo lectura). Nada de esto toca producción.
// Uso: node integrado.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const ROOT = HERE;
const MIGDIR = ROOT + '../migrations/';
const PG = ROOT;
const MIGS = ['20261028_cerrar_email_queue', '20261029_legal_aceptaciones_idioma', '20261030_ofertas_fase2', '20261031_candidaturas_fase3', '20261032_correcciones_auditoria'];
const SQL = Object.fromEntries(MIGS.map((n) => [n, fs.readFileSync(MIGDIR + n + '.sql', 'utf8')]));

let pass = 0, fail = 0, warns = 0;
const out = (s) => console.log(s);
const ok = (c, m, extra) => { if (c) { pass++; out('  OK     ' + m); } else { fail++; out('  FALLO  ' + m + (extra !== undefined ? '  => ' + String(extra).slice(0, 400) : '')); } };
const warn = (m) => { warns++; out('  AVISO  ' + m); };
const sec = (t) => out('\n== ' + t + ' ==');
process.on('uncaughtException', (e) => { out('ERROR NO CAPTURADO: ' + String(e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });
process.on('unhandledRejection', (e) => { out('ERROR NO CAPTURADO: ' + String(e && e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });

// ---------------------------------------------------------------- identidades
const U = {
  viejo: '00000000-0000-0000-0000-0000000000e1', admin: '00000000-0000-0000-0000-0000000000ad',
  cand: '00000000-0000-0000-0000-0000000000c1', candB: '00000000-0000-0000-0000-0000000000c2',
  mA: '00000000-0000-0000-0000-00000000a001', vA: '00000000-0000-0000-0000-00000000a002',
  mB: '00000000-0000-0000-0000-00000000b001', out: '00000000-0000-0000-0000-0000000000f0',
};
const CO_LEG = 'c0000000-0000-0000-0000-00000000001e';
const JOB_LEG = 'd0000000-0000-0000-0000-00000000001e';
const LONG = 'Buscamos una persona para coordinar proyectos de software con equipos multidisciplinares y clientes internacionales, con foco en la calidad y la mejora continua. '.repeat(4);

// ---------------------------------------------------------------- helpers
const CAS = { acepto_condiciones_privacidad: true, datos_verdaderos: true, poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true };
// (20261032, S1) apply_to_job y _job_submit exigen haber aceptado los documentos vigentes: antes de esas
// llamadas el llamador autenticado registra su aceptacion, como hara el frontend. AUTOACC=false lo desactiva.
globalThis.AUTOACC = true;
function H(db) {
  const accept = async () => {
    try {
      const p = (await db.query('select documento_id from public.documentos_pendientes()')).rows;
      if (p.length) await db.query('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [p.map((x) => x.documento_id), JSON.stringify(CAS), 'inscripcion']);
    } catch { /* anon / sin sesion / funcion aun inexistente */ }
  };
  const pre = async (sql) => { if (globalThis.AUTOACC && /apply_to_job|submit_job_for_review|publish_job_posting/.test(sql)) await accept(); };
  const as = async (role, uid, headers) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false), set_config('request.headers', $3, false)",
      [uid ?? '', role === 'postgres' ? '' : role, headers ? JSON.stringify(headers) : '']);
    if (role !== 'postgres') await db.exec(`set role ${role}`);
  };
  const q = async (sql, params) => { await pre(sql); return (await db.query(sql, params)).rows; };
  const run = async (sql, params) => { await pre(sql); return db.query(sql, params); };
  const err = async (sql, params) => { try { await pre(sql); await db.query(sql, params); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } };
  return { as, q, run, err };
}
const isDenied = (e) => !!e && (e.code === '42501' || /permission denied|row-level security|must be owner|violates row-level/i.test(String(e.message)));

async function buildDb(legacySize = '11-50') {
  const db = new PGlite();
  await db.exec(fs.readFileSync(PG + 'stub-base.sql', 'utf8'));
  const pf = fs.readFileSync(PG + 'prod-funcs.sql', 'utf8');
  await db.exec(pf);
  await db.exec(fs.readFileSync(PG + 'stub-triggers.sql', 'utf8'));
  // ACL REALES de las funciones (pg_proc.proacl de producción)
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
  // Datos anteriores a las migraciones: un usuario antiguo, una empresa con el tamaño antiguo y un borrador con slug antiguo
  await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'viejo@test.dev','{\"full_name\":\"Usuario Anterior\"}'::jsonb)", [U.viejo]);
  await db.query("insert into public.companies(id, company_name, legal_name, tax_id, company_email, company_size, status, created_by) values ($1,'Legacy SL','Legacy SL','L1','legacy@test.dev',$3,'APPROVED',$2)", [CO_LEG, U.viejo, legacySize]);
  await db.query("insert into public.job_postings(id, company_id, created_by, title, slug, description, location_city, status) values ($1,$2,$3,'Gestión de Compras','gestin-de-compras-mlaga','Borrador heredado','Málaga','DRAFT')", [JOB_LEG, CO_LEG, U.viejo]);
  return db;
}
async function applyMig(db, name) { try { await db.exec(SQL[name]); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } }

// ---------------------------------------------------------------- instantánea del catálogo
async function snapshot(db) {
  const S = new Map();
  const R = async (s) => (await db.query(s)).rows;
  const nacl = (a) => (a == null ? 'NULL' : String(a).replace(/^\{|\}$/g, '').split(',').sort().join(','));
  for (const r of await R(`select c.relname n, c.relkind k, c.relrowsecurity rls, c.relacl::text acl, coalesce(c.reloptions::text,'') opt from pg_class c where c.relnamespace='public'::regnamespace and c.relkind in ('r','v','p','m')`))
    S.set(`rel|${r.n}`, `${r.k}|rls=${r.rls}|opt=${r.opt}|acl=${nacl(r.acl)}`);
  for (const r of await R(`select c.relname n, a.attname a, a.attacl::text acl from pg_attribute a join pg_class c on c.oid=a.attrelid where c.relnamespace='public'::regnamespace and a.attacl is not null and a.attnum>0 and not a.attisdropped`))
    S.set(`colacl|${r.n}.${r.a}`, nacl(r.acl));
  for (const r of await R(`select table_name t, column_name c, data_type d, is_nullable nl, coalesce(column_default,'') df from information_schema.columns where table_schema='public'`))
    S.set(`col|${r.t}.${r.c}`, `${r.d}|${r.nl}|${r.df}`);
  for (const r of await R(`select p.oid::regprocedure::text sig, p.prosecdef sd, coalesce(p.proconfig::text,'') cfg, p.proacl::text acl, md5(p.prosrc) src, pg_get_function_result(p.oid) res, p.provolatile v from pg_proc p where p.pronamespace='public'::regnamespace`))
    S.set(`fn|${r.sig}`, `sd=${r.sd}|cfg=${r.cfg}|vol=${r.v}|res=${r.res}|acl=${nacl(r.acl)}|src=${r.src}`);
  for (const r of await R(`select tablename t, policyname p, cmd, roles::text r, coalesce(qual,'') q, coalesce(with_check,'') w, permissive pm from pg_policies where schemaname='public'`))
    S.set(`pol|${r.t}|${r.p}`, `${r.cmd}|${r.pm}|${r.r}|${r.q}|${r.w}`);
  for (const r of await R(`select c.relname t, t.tgname n, pg_get_triggerdef(t.oid) d, t.tgenabled en from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and c.relnamespace='public'::regnamespace`))
    S.set(`trg|${r.t}|${r.n}`, `${r.en}|${r.d}`);
  for (const r of await R(`select c.relname t, k.conname n, pg_get_constraintdef(k.oid) d from pg_constraint k join pg_class c on c.oid=k.conrelid where c.relnamespace='public'::regnamespace`))
    S.set(`con|${r.t}|${r.n}`, r.d);
  for (const r of await R(`select indexname n, indexdef d from pg_indexes where schemaname='public'`)) S.set(`idx|${r.n}`, r.d);
  for (const r of await R(`select c.relname n, pg_get_viewdef(c.oid) d from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='v'`)) S.set(`view|${r.n}`, r.d);
  return S;
}
function diffSnap(a, b) {
  const ch = [];
  for (const [k, v] of b) { if (!a.has(k)) ch.push({ k, t: 'new', after: v }); else if (a.get(k) !== v) ch.push({ k, t: 'chg', before: a.get(k), after: v }); }
  for (const [k, v] of a) if (!b.has(k)) ch.push({ k, t: 'del', before: v });
  return ch;
}

// =====================================================================================================
// 0. Base real + comprobaciones de fidelidad del stub (estado ANTERIOR a las migraciones)
// =====================================================================================================
sec('0. Base real (estado previo) y fidelidad del stub');
const db = await buildDb();
const { as, q, run, err } = H(db);
const expDenied = async (name, sql, params) => { const e = await err(sql, params); ok(isDenied(e), name, e ? e.message : 'no hubo error'); };
const expErr = async (name, re, sql, params) => { const e = await err(sql, params); ok(!!e && re.test(String(e.message)), name, e ? e.message : 'no hubo error'); };
const expOk = async (name, sql, params) => { const e = await err(sql, params); ok(!e, name, e && e.message); };
const expZero = async (name, sql, params) => {
  try { const r = await run(sql, params); ok(r.affectedRows === 0, name, 'afectó ' + r.affectedRows + ' filas'); }
  catch (e) { try { await db.exec('rollback'); } catch {} ok(isDenied(e) || /PROTECTED_FIELD|WITHDRAW|APPLICATION_WITHDRAWN/.test(e.message), name + ' (bloqueado)', e.message); }
};

await as('anon');
ok((await q('select count(*)::int n from public.email_queue'))[0].n === 0 && !(await err('select * from public.email_queue')), 'previo: anon LEE email_queue (el hueco real que cierra 20261028)');
await as('postgres');
ok((await q('select count(*)::int n from public.profiles where id=$1', [U.viejo]))[0].n === 1, 'previo: handle_new_user real creó el perfil del usuario antiguo');
await as('authenticated', U.viejo);
ok(!(await err(`insert into public.job_applications(job_posting_id, profile_id, company_id) values ($1,$2,$3)`, [JOB_LEG, U.viejo, CO_LEG])), 'previo: el candidato PUEDE insertar directo en job_applications (hueco real que cierra la fase 3)');
await as('postgres');
await db.query('delete from public.job_applications');
await as('anon');
ok(!(await err('select * from public.job_postings')), 'previo: anon podía select * de job_postings');
await as('authenticated', U.viejo);
ok(isDenied(await err('select email from public.profiles')), 'stub: authenticated NO lee profiles.email (cierre por columnas real)');
ok(isDenied(await err('select company_email from public.companies')), 'stub: authenticated NO lee companies.company_email (cierre por columnas real)');

// =====================================================================================================
// 1. Aplicar las cuatro EN ORDEN, y otra vez las cuatro
// =====================================================================================================
sec('1. Aplicar las cuatro migraciones en orden');
await as('postgres');
const snaps = [await snapshot(db)];
let chainOk = true;
for (const n of MIGS) {
  const e = await applyMig(db, n);
  ok(!e, `primera aplicación de ${n}`, e && (e.message + (e.where ? ' | ' + String(e.where).split('\n')[0] : '')));
  if (e) chainOk = false;
  snaps.push(await snapshot(db));
}
if (!chainOk) { out(`\nRESULTADO: ${pass} OK, ${fail} FALLO (la cadena falló: se detiene)`); process.exit(1); }

sec('1b. Reaplicar las cuatro (segunda vez)');
for (const n of MIGS) { const e = await applyMig(db, n); ok(!e, `segunda aplicación de ${n}`, e && e.message); }
const snapRe = await snapshot(db);
const dRe = diffSnap(snaps[MIGS.length], snapRe);
ok(dRe.length === 0, 'la reaplicación no cambia NADA del catálogo (columnas, ACL, funciones, políticas, triggers, CHECK, índices, vistas)', dRe.slice(0, 8).map((x) => x.t + ' ' + x.k).join(' ; '));

sec('1c. Datos antiguos: empresa con company_size 51-200 / 201-500 / 1000+ (la fase 1 dice convertirlos)');
for (const old of ['51-200', '201-500', '1000+']) {
  const d3 = await buildDb(old);
  const e = await applyMig(d3, MIGS[1]);
  ok(!e, `fase 1 con una empresa existente de tamaño ${old} (UPDATE a 51-250/250+ antes de cambiar el CHECK)`, e && e.message);
  await d3.close?.();
}

sec('1d. Arreglo propuesto para la fase 1 (DROP CONSTRAINT antes del UPDATE), verificado sobre una copia en memoria; el fichero NO se toca');
{
  const f1 = SQL[MIGS[1]];
  const at = f1.indexOf('UPDATE public.companies SET company_size');
  SQL.__fase1_corregida = f1.slice(0, at) + 'ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_company_size_check;' + String.fromCharCode(10) + f1.slice(at);
  const expect = { '51-200': '51-250', '201-500': '250+', '501-1000': '250+', '1000+': '250+', '11-50': '11-50' };
  for (const [old, nuevo] of Object.entries(expect)) {
    const d4 = await buildDb(old);
    const e = await applyMig(d4, '__fase1_corregida');
    const r4 = e ? null : (await d4.query('select company_size from public.companies where id=$1', [CO_LEG])).rows[0].company_size;
    ok(!e && r4 === nuevo, `con el DROP antes del UPDATE, una empresa de tamaño ${old} se convierte en ${nuevo}`, e ? e.message : r4);
    await d4.close?.();
  }
}

// Estado de datos tras migrar
await as('postgres');
ok((await q('select count(*)::int n from public.documentos_legales'))[0].n === 8, 'documentos_legales: 8 filas sin duplicar tras 2 aplicaciones');
ok((await q('select count(*)::int n from public.countries'))[0].n === 40, 'countries: 40 países (fase 1 y fase 2 la siembran: sin duplicar)');
ok((await q('select company_size from public.companies where id=$1', [CO_LEG]))[0].company_size === '11-50', 'empresa antigua con tamaño válido en ambos CHECK: se conserva');
const leg = (await q('select slug, credits_cost from public.job_postings where id=$1', [JOB_LEG]))[0];
ok(/^gestion-de-compras-malaga-[0-9a-f]{8}$/.test(leg.slug) && leg.credits_cost === 0, 'borrador antiguo: slug regenerado sin tildes con id corto y credits_cost = 0', JSON.stringify(leg));
ok((await q("select count(*)::int n from public.aceptaciones"))[0].n === 0, 'aceptaciones: 0 (la semilla no se aplica a nadie)');

// =====================================================================================================
// 2. Recorrido de negocio completo con roles reales
// =====================================================================================================
sec('2a. Altas de usuario (handle_new_user de la fase 1) y puerta legal');
const mkUser = (id, email, meta) => db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3::jsonb)', [id, email, JSON.stringify(meta)]);
await as('postgres');
await mkUser(U.admin, 'admin@test.dev', { full_name: 'Admin Plataforma', registro_idioma: 'es' });
await mkUser(U.cand, 'cand@test.dev', { full_name: 'Ana Candidata', registro_idioma: 'en', fecha_nacimiento: '1990-05-17' });
await mkUser(U.candB, 'candb@test.dev', { full_name: 'Beto Candidato', registro_idioma: 'es' });
await mkUser(U.mA, 'ma@acme.test', { full_name: 'Marta Owner', registro_idioma: 'es' });
await mkUser(U.vA, 'va@acme.test', { full_name: 'Victor Viewer', registro_idioma: 'es' });
await mkUser(U.mB, 'mb@beta.test', { full_name: 'Bea Owner B', registro_idioma: 'es' });
await mkUser(U.out, 'out@test.dev', { full_name: 'Persona Ajena' });
await as('service_role');
await run("update public.profiles set role='admin' where id=$1", [U.admin]);
await run("update public.profiles set role='employer' where id = any($1::uuid[])", [[U.mA, U.vA, U.mB]]);
await as('postgres');
const pcand = (await q('select registro_idioma, fecha_nacimiento::text f, email, role from public.profiles where id=$1', [U.cand]))[0];
ok(pcand.registro_idioma === 'en' && pcand.f === '1990-05-17' && pcand.email === 'cand@test.dev' && pcand.role === 'professional', 'candidato: idioma y fecha de nacimiento guardados por el trigger; sigue siendo professional/free', JSON.stringify(pcand));

await as('authenticated', U.viejo);
let pend = await q('select tipo, idioma from public.documentos_pendientes()');
ok(pend.map((r) => r.tipo).join() === 'privacidad,terminos_candidato' && pend.every((r) => r.idioma === 'es'), 'usuario antiguo: la puerta le pide privacidad + términos de candidato en es', JSON.stringify(pend));
await as('authenticated', U.cand);
pend = await q('select documento_id, tipo, idioma from public.documentos_pendientes() order by tipo');
ok(pend.map((r) => r.tipo + '/' + r.idioma).join() === 'privacidad/en,terminos_candidato/en', 'candidato (en): términos y privacidad en inglés', JSON.stringify(pend));
const HDR = { 'cf-connecting-ip': '203.0.113.7', 'user-agent': 'UA-Integrado/1.0' };
await as('authenticated', U.cand, HDR);
await run('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [pend.map((r) => r.documento_id), JSON.stringify({ acepto_condiciones_privacidad: true, datos_verdaderos: true }), 'registro']);
ok((await q('select count(*)::int n from public.documentos_pendientes()'))[0].n === 0, 'candidato: tras aceptar no tiene pendientes');
await as('postgres');
const acc = await q("select host(ip) ip, user_agent, user_email, contexto from public.aceptaciones where user_id=$1", [U.cand]);
ok(acc.length === 2 && acc.every((a) => a.ip === '203.0.113.7' && a.user_agent === 'UA-Integrado/1.0' && a.user_email === 'cand@test.dev' && a.contexto === 'registro'), 'aceptaciones: IP, navegador y correo salen del servidor', JSON.stringify(acc));

sec('2b. Alta de empresa A (PENDING) -> aprobación por admin');
await as('authenticated', U.mA, HDR);
const insCo = (name, tax, mail) => q(`insert into public.companies(company_name, legal_name, tax_id, company_email, company_size, country_code, idioma, contact_name, contact_position, industry)
  values ($1,$1,$2,$3,'11-50','ES','es','Contacto','RRHH','Tecnología') returning id`, [name, tax, mail]);
const CA = (await insCo('Acme', 'B111', 'rrhh@acme.test'))[0].id;
await run(`insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER')`, [CA, U.mA]);
await run(`insert into public.company_users(company_id, user_id, role, invited_by) values ($1,$2,'VIEWER',$3)`, [CA, U.vA, U.mA]);
await as('postgres');
const caRow = (await q('select status, created_by, credit_balance from public.companies where id=$1', [CA]))[0];
ok(caRow.status === 'PENDING' && caRow.created_by === U.mA && caRow.credit_balance === 0, 'empresa A: nace PENDING, created_by lo fija el servidor', JSON.stringify(caRow));
ok((await q('select count(*)::int n from public.company_users where company_id=$1', [CA]))[0].n === 2, 'empresa A: OWNER y VIEWER dados de alta (política de altas real)');
await as('authenticated', U.mA);
pend = await q('select documento_id, tipo from public.documentos_pendientes() order by tipo');
ok(pend.map((r) => r.tipo).join() === 'privacidad,terminos_empleador', 'empleador: la puerta pide privacidad + términos de empleador', JSON.stringify(pend));
await as('authenticated', U.mA, HDR);
await run('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, null, $4)', [pend.map((r) => r.documento_id), JSON.stringify({ poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true }), 'registro', CA]);
ok((await q('select count(*)::int n from public.documentos_pendientes()'))[0].n === 0, 'empleador: aceptó con company_id y no le queda nada pendiente');
await as('service_role');
await run(`insert into public.company_ai_reviews(company_id, resultado, motivos, proveedor) values ($1,'dudosa','["web sin dominio propio"]'::jsonb,'pendiente')`, [CA]);
await as('authenticated', U.mA);
await expZero('empresa A: el dueño no puede auto-aprobarse (sin política de UPDATE para miembros: 0 filas)', `update public.companies set status='APPROVED' where id=$1`, [CA]);
await expZero('empresa A: el dueño no puede subirse créditos (0 filas)', `update public.companies set credit_balance=999 where id=$1`, [CA]);
ok((await q('select count(*)::int n from public.company_ai_reviews'))[0].n === 0, 'miembro de la empresa NO ve company_ai_reviews');
await as('authenticated', U.mA);
await expErr('un miembro NO puede ejecutar approve_company (NOT_ADMIN)', /NOT_ADMIN/, `select public.approve_company($1,$2,'x')`, [CA, U.mA]);

// Borrador de empresa PENDING y primer intento de enviar a revisión
const jobIns = `insert into public.job_postings(company_id, created_by, title, description, location_city, location_country, work_mode, employment_type, experience_level, country_code, category, contract_types, schedule, vacancies, required_skills, optional_skills, salary_min, salary_max, salary_currency, salary_period, salary_mode, show_salary, notify_emails, notify_frequency, cover_letter_mode, languages, education_min, experience_years)
 values ($1,$2,$3,$4,'Madrid','ES','ONSITE','FULL_TIME','MID','ES','Tecnología',ARRAY['INDEFINITE'],'FULL_TIME',2,ARRAY['React','SQL'],ARRAY['TypeScript'],30000,40000,'EUR','YEARLY','RANGE',true,$5::text[],'EACH','OPTIONAL','[{"language":"en","level":"B2"}]'::jsonb,'Grado',2) returning id, slug, status, credits_cost`;
await as('authenticated', U.mA);
const jr = (await q(jobIns, [CA, U.mA, 'Desarrollador Full Stack', LONG, ['rrhh@acme.test', 'jefe@acme.test']]))[0];
const J = jr.id;
ok(jr.status === 'DRAFT' && jr.credits_cost === 0 && /^desarrollador-full-stack-madrid-[0-9a-f]{8}$/.test(jr.slug), 'oferta: nace DRAFT, credits_cost 0 y slug limpio con id corto', JSON.stringify(jr));
const QS = {};
QS.q1 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index) values ($1,'¿Por qué quieres este puesto?','TEXTAREA',true,1) returning id`, [J]))[0].id;
QS.q2 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index, is_knockout, expected_answer) values ($1,'¿Tienes permiso de trabajo en España?','YES_NO',true,2,true,'YES') returning id`, [J]))[0].id;
QS.q3 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index) values ($1,'Comentario opcional','TEXT',false,3) returning id`, [J]))[0].id;
ok(!!QS.q1 && !!QS.q2 && !!QS.q3, 'preguntas: obligatoria, eliminatoria (expected_answer) y opcional creadas por la empresa');
await expErr('empresa PENDING: submit_job_for_review rechazado', /COMPANY_NOT_APPROVED/, 'select public.submit_job_for_review($1)', [J]);

await as('authenticated', U.admin);
const ap = (await q(`select public.approve_company($1,$2,'verificada') r`, [CA, U.admin]))[0].r;
ok(ap.success === true, 'admin: approve_company (real) aprueba la empresa A');
await as('postgres');
const caAp = (await q('select status, verified_by, credit_balance from public.companies where id=$1', [CA]))[0];
ok(caAp.status === 'APPROVED' && caAp.verified_by === U.admin && caAp.credit_balance === 10, 'empresa A: APPROVED, verified_by y 10 créditos de bienvenida (trigger real)', JSON.stringify(caAp));
await as('authenticated', U.mA);
ok((await q('select status, contact_name, country_code from public.companies_full where id=$1', [CA]))[0].status === 'APPROVED', 'miembro lee su empresa por companies_full (con columnas de la fase 1)');

// Empresa B
await as('authenticated', U.mB);
const CB = (await insCo('Beta', 'B222', 'rrhh@beta.test'))[0].id;
await run(`insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER')`, [CB, U.mB]);
await as('authenticated', U.admin);
await run(`select public.approve_company($1,$2,'ok')`, [CB, U.admin]);

sec('2c. Oferta: DRAFT -> submit_job_for_review -> moderar_oferta -> PUBLISHED');
await as('authenticated', U.mA);
const sub = (await q('select public.submit_job_for_review($1) r', [J]))[0].r;
ok(sub.status === 'AI_REVIEW' && sub.credits_used === 0, 'submit_job_for_review: AI_REVIEW sin cobro', JSON.stringify(sub));
await as('authenticated', U.vA);
const hist1 = (await q('select from_status, to_status, source from public.job_posting_status_history where job_id=$1 order by id', [J])).map((x) => `${x.from_status}>${x.to_status}:${x.source}`).join(' | ');
ok(hist1 === 'null>DRAFT:direct | DRAFT>AI_REVIEW:submit', 'historial de la oferta (lo lee el VIEWER de la empresa)', hist1);
await as('anon');
ok((await q('select count(*)::int n from public.job_postings where id=$1', [J]))[0].n === 0, 'anon NO ve la oferta mientras está en revisión');
await as('authenticated', U.admin);
const mod = (await q(`select public.moderar_oferta($1,'PUBLISHED') r`, [J]))[0].r;
ok(mod.status === 'PUBLISHED' && !!mod.published_at, 'admin: moderar_oferta -> PUBLISHED', JSON.stringify(mod));
await as('postgres');
const jpub = (await q('select slug, reviewed_by, reviewed_text_hash is not null h, application_deadline > now() + interval \'29 days\' d30 from public.job_postings where id=$1', [J]))[0];
ok(jpub.reviewed_by === U.admin && jpub.h && jpub.d30, 'oferta publicada: reviewed_by, hash del texto aprobado y cierre a 30 días');
const SLUG = jpub.slug;
const ob1 = await q(`select to_email from public.email_outbox where kind='job_published' and payload->>'job_id'=$1 order by 1`, [J]);
ok(ob1.map((x) => x.to_email).join() === 'jefe@acme.test,rrhh@acme.test', 'outbox: aviso «oferta publicada» a los 2 destinatarios de la oferta', JSON.stringify(ob1));

// Oferta sospechosa -> MANUAL_REVIEW -> rechazada
await as('authenticated', U.mA);
const JS = (await q(jobIns, [CA, U.mA, 'Vendedor con inversión', LONG + ' Se requiere una inversión inicial de 200 euros y contactar por WhatsApp.', null]))[0].id;
const sub2 = (await q('select public.submit_job_for_review($1) r', [JS]))[0].r;
ok(sub2.status === 'MANUAL_REVIEW' && sub2.flags.includes('DINERO') && sub2.flags.includes('CONTACTO_EXTERNO'), 'oferta sospechosa: filtro previo -> MANUAL_REVIEW', JSON.stringify(sub2));
await as('postgres');
ok((await q(`select count(*)::int n from public.email_outbox where kind='job_manual_review' and to_email='support@yourcvpassport.com'`))[0].n === 1, 'outbox: aviso a support@yourcvpassport.com (nunca info@)');
ok((await q(`select count(*)::int n from public.email_outbox where to_email ilike 'info@%'`))[0].n === 0, 'outbox: ningún correo a info@');
await as('authenticated', U.admin);
await run(`select public.moderar_oferta($1,'REJECTED','Pide dinero al candidato')`, [JS]);
await as('authenticated', U.mA);
ok((await q('select status, review_reason from public.job_postings where id=$1', [JS]))[0].review_reason === 'Pide dinero al candidato', 'miembro ve el motivo del rechazo de su oferta');

sec('2d. Lo que ve anon (listado, ficha, preguntas)');
await as('anon');
let r = await q(`select id, title, company_name, salary_min, show_salary, total_count::int tc, already_applied from public.search_public_jobs_v2(p_country=>'ES')`);
ok(r.length === 1 && r[0].id === J && r[0].salary_min === 30000 && r[0].show_salary === true && r[0].already_applied === false && r[0].tc === 1, 'anon: search_public_jobs_v2(ES) devuelve solo la oferta aprobada (no la rechazada ni el borrador antiguo)', JSON.stringify(r));
r = await q('select title, status, accepting_applications, category, company_name from public.get_job_posting_detail($1)', [SLUG]);
ok(r.length === 1 && r[0].status === 'PUBLISHED' && r[0].accepting_applications === true && r[0].company_name === 'Acme', 'anon: get_job_posting_detail de la oferta publicada', JSON.stringify(r));
ok((await q('select count(*)::int n from public.get_job_posting_detail($1)', [(await (async () => { await as('postgres'); const x = (await q('select slug from public.job_postings where id=$1', [JS]))[0].slug; await as('anon'); return x; })())]))[0].n === 0, 'anon: la ficha de una oferta REJECTED no se sirve');
r = await q('select id, question_text, is_knockout from public.job_posting_questions where job_posting_id=$1 order by order_index', [J]);
ok(r.length === 3 && r[1].is_knockout === true, 'anon: ve las 3 preguntas públicas (con is_knockout)', JSON.stringify(r));
r = await q('select slug, title, applications_count from public.job_postings');
ok(r.length === 1 && r[0].slug === SLUG, 'anon: select directo solo devuelve la oferta publicada y las columnas de la lista blanca', JSON.stringify(r));

sec('2e. Candidato: perfil, vista previa e inscripción (con eliminatoria)');
await as('authenticated', U.cand);
await run(`update public.profiles set headline='Desarrolladora full stack', summary='Seis años de experiencia', country_code='ES', location='Madrid', open_to_remote=true where id=$1`, [U.cand]);
await run(`insert into public.experiences(profile_id, company_name, position, start_date, end_date, is_current) values ($1,'X','Dev','2020-01-01','2022-01-01',false),($1,'Y','Senior Dev','2023-01-01',null,true)`, [U.cand]);
await run(`insert into public.education(profile_id, institution_name, degree, field_of_study, start_date) values ($1,'Univ','Grado en Ingeniería Informática','Informática','2014-09-01')`, [U.cand]);
await run(`insert into public.skills(profile_id, name) values ($1,'React'),($1,'SQL'),($1,'TypeScript')`, [U.cand]);
await run(`insert into public.languages(profile_id, name, level, is_native) values ($1,'Español','Native',true),($1,'Inglés','B2',false)`, [U.cand]);
const prev = (await q('select public.preview_application_profile() r'))[0].r;
ok(prev.profile.experiences.length === 2 && prev.profile.skills.length === 3 && Array.isArray(prev.gaps), 'preview_application_profile: copia con 2 experiencias, 3 habilidades y huecos', JSON.stringify(prev.gaps));
const rec = await q('select job_posting_id, match_score from public.get_recommended_jobs(10)');
ok(rec.length === 1 && rec[0].job_posting_id === J && rec[0].match_score > 50, 'get_recommended_jobs: la oferta publicada con afinidad alta', JSON.stringify(rec));
const app = (jobId, o = {}) => q('select public.apply_to_job($1::uuid, null, $2, $3::jsonb, $4, $5) r', [jobId, o.cover ?? null, JSON.stringify(o.answers ?? {}), 'consent' in o ? o.consent : true, 'v1.0']);
const aerr = async (name, re, jobId, o) => { const e = await err('select public.apply_to_job($1::uuid, null, $2, $3::jsonb, $4, $5) r', [jobId, o?.cover ?? null, JSON.stringify(o?.answers ?? {}), o && 'consent' in o ? o.consent : true, 'v1.0']); ok(!!e && re.test(e.message), name, e ? e.message : 'no hubo error'); };
await aerr('apply_to_job sin consentimiento -> CONSENT_REQUIRED', /CONSENT_REQUIRED/, J, { consent: false, answers: { [QS.q1]: 'x', [QS.q2]: 'YES' } });
await aerr('apply_to_job sin pregunta obligatoria -> REQUIRED_QUESTION_MISSING', /REQUIRED_QUESTION_MISSING/, J, { answers: { [QS.q2]: 'YES' } });
await aerr('apply_to_job a oferta REJECTED -> JOB_NOT_AVAILABLE', /JOB_NOT_AVAILABLE/, JS);
await as('authenticated', U.cand, HDR);
await run(`select public.registrar_aceptacion($1::uuid[], '{}'::jsonb, 'inscripcion', $2)`, [[(await (async () => { await as('postgres'); const x = (await q("select id from public.documentos_legales where tipo='privacidad' and idioma='en'"))[0].id; await as('authenticated', U.cand, HDR); return x; })())], J]);
const rA = (await app(J, { cover: 'Hola, me interesa', answers: { [QS.q1]: 'Me encanta el equipo', [QS.q2]: 'Yes', [QS.q3]: 'Nada' } }))[0].r;
const APP_A = rA.application_id;
ok(rA.success === true && Number.isInteger(rA.match_score) && Array.isArray(rA.warnings), 'candidato: apply_to_job con consentimiento y respuestas', JSON.stringify(rA));
await aerr('candidato: segunda inscripción -> ALREADY_APPLIED', /ALREADY_APPLIED/, J, { answers: { [QS.q1]: 'x', [QS.q2]: 'YES' } });
await as('authenticated', U.candB);
await run(`update public.profiles set headline=null, summary=null where id=$1`, [U.candB]);
const rB = (await app(J, { answers: { [QS.q1]: 'Quiero', [QS.q2]: 'No' } }))[0].r;
const APP_B = rB.application_id;
ok(rB.success === true && !('status' in rB) && !('auto_discarded' in rB), 'candidato B (falla la eliminatoria): la respuesta NO revela el descarte', JSON.stringify(rB));
let mine = await q('select status, candidate_status from public.my_job_applications');
ok(mine.length === 1 && mine[0].status === 'NEW' && mine[0].candidate_status === 'SENT', 'candidato B: ve su candidatura como NEW/SENT (nunca NOT_QUALIFIED)', JSON.stringify(mine));
let hb = await q('select from_status, to_status from public.get_application_history($1)', [APP_B]);
ok(hb.length === 1 && hb[0].to_status === 'NEW', 'candidato B: historial con NOT_QUALIFIED enmascarado', JSON.stringify(hb));
await as('postgres');
const bRow = (await q('select status, descartada_auto from public.job_applications where id=$1', [APP_B]))[0];
ok(bRow.status === 'NOT_QUALIFIED' && bRow.descartada_auto === true, 'descarte automático: la fila de B queda NOT_QUALIFIED + descartada_auto', JSON.stringify(bRow));
ok((await q('select applications_count from public.job_postings where id=$1', [J]))[0].applications_count === 2, 'contador applications_count = 2 (lo sube la RPC pese al trigger de protección de la fase 2)');
const obc = await q(`select kind, to_email from public.email_outbox where payload->>'application_id' = any($1::text[]) order by kind, to_email`, [[APP_A, APP_B]]);
const cands = obc.filter((x) => x.kind === 'application_received_candidate').map((x) => x.to_email).join();
const comps = obc.filter((x) => x.kind === 'application_received_company').map((x) => x.to_email).join();
ok(cands === 'cand@test.dev,candb@test.dev' && comps === 'jefe@acme.test,rrhh@acme.test', 'outbox: avisos al candidato (2) y a la empresa solo por A (B descartada no avisa)', cands + ' / ' + comps);
const snapA = (await q('select perfil_copia from public.job_applications where id=$1', [APP_A]))[0].perfil_copia;
ok(snapA.profile.full_name === 'Ana Candidata' && snapA.contact.email === 'cand@test.dev' && snapA.education.length === 1 && snapA.languages.length === 2, 'perfil_copia: perfil, contacto, formación e idiomas congelados');

sec('2f. Empresa: ve la candidatura con perfil_copia y cambia el estado');
await as('authenticated', U.mA);
let apps = await q('select id, status, descartada_auto, perfil_copia is not null pc, internal_notes, rating from public.job_applications order by created_at');
ok(apps.length === 2 && apps.every((x) => x.pc), 'empresa A: ve las 2 candidaturas con perfil_copia', JSON.stringify(apps.map((x) => x.status)));
ok(apps.find((x) => x.id === APP_B).descartada_auto === true, 'empresa A: ve que B fue descartada automáticamente');
const qs = await q('select id, expected_answer from public.get_job_questions_for_company($1)', [J]);
ok(qs.find((x) => x.id === QS.q2).expected_answer === 'YES', 'empresa A: get_job_questions_for_company devuelve expected_answer');
ok((await q('select public.mark_application_viewed($1) r', [APP_A]))[0].r.viewed === true, 'empresa A: mark_application_viewed');
const upd = (await q(`select public.update_application_status($1,$2,$3,'INTERVIEW','Muy buena candidata',4) r`, [APP_A, CA, U.mA]))[0].r;
ok(upd.success && upd.old_status === 'NEW' && upd.new_status === 'INTERVIEW', 'empresa A: update_application_status NEW -> INTERVIEW', JSON.stringify(upd));
await as('authenticated', U.vA);
ok((await q('select count(*)::int n from public.job_applications'))[0].n === 2, 'VIEWER: puede leer las candidaturas');
await expErr('VIEWER: update_application_status -> Unauthorized', /Unauthorized/, `select public.update_application_status($1,$2,$3,'REJECTED')`, [APP_A, CA, U.vA]);
await as('authenticated', U.mB);
ok((await q('select count(*)::int n from public.job_applications'))[0].n === 0, 'empresa B: no ve ninguna candidatura de A');
await expErr('empresa B: update_application_status sobre candidatura de A -> Unauthorized', /Unauthorized/, `select public.update_application_status($1,$2,$3,'REJECTED')`, [APP_A, CA, U.mB]);
await as('authenticated', U.out);
ok((await q('select count(*)::int n from public.job_applications'))[0].n === 0, 'usuario ajeno: no ve candidaturas');

sec('2g. Candidato ve lo suyo SIN notas internas ni valoración');
await as('authenticated', U.cand);
mine = await q('select * from public.my_job_applications');
const cols = Object.keys(mine[0] || {});
ok(mine.length === 1 && mine[0].status === 'INTERVIEW' && mine[0].candidate_status === 'IN_PROGRESS' && mine[0].job_title === 'Desarrollador Full Stack', 'candidato: my_job_applications -> INTERVIEW / IN_PROGRESS', JSON.stringify(mine[0] && { s: mine[0].status, c: mine[0].candidate_status }));
ok(!['internal_notes', 'rating', 'perfil_copia', 'descartada_auto', 'metadata'].some((c) => cols.includes(c)), 'candidato: la vista NO contiene internal_notes, rating, perfil_copia, descartada_auto ni metadata', cols.join(','));
await expErr('candidato: select internal_notes de la vista -> no existe', /does not exist/, 'select internal_notes from public.my_job_applications');
ok((await q('select count(*)::int n from public.job_applications'))[0].n === 0, 'candidato: la tabla base no le devuelve filas');
const hA = await q('select to_status, changed_by_role from public.get_application_history($1)', [APP_A]);
ok(hA.map((x) => x.to_status).join() === 'NEW,INTERVIEW' && hA[1].changed_by_role === 'COMPANY', 'candidato: historial NEW,INTERVIEW (por la empresa)', JSON.stringify(hA));
await as('postgres');
ok((await q(`select count(*)::int n from public.email_outbox where kind='application_status_candidate' and to_email='cand@test.dev' and payload->>'new_status'='INTERVIEW'`))[0].n === 1, 'outbox: aviso al candidato por INTERVIEW');

sec('2h. Alertas y recomendadas; retirar candidatura; caducidad');
await as('authenticated', U.cand);
await run(`insert into public.job_alert_subscriptions(profile_id, categories, country, keywords, frequency) values ($1,'{Tecnología}','ES','{react}','DAILY')`, [U.cand]);
await as('postgres');
await run(`update public.job_alert_subscriptions set opted_in_at = now() - interval '2 hours'`);
// segunda oferta publicada por el flujo normal (para la alerta)
await as('authenticated', U.mA);
const J2 = (await q(jobIns, [CA, U.mA, 'Ingeniera de Datos React', LONG + ' Trabajo con React y SQL.', null]))[0].id;
await run('select public.submit_job_for_review($1)', [J2]);
await as('authenticated', U.admin);
await run(`select public.moderar_oferta($1,'PUBLISHED')`, [J2]);
await as('service_role');
const nq = (await q('select public.queue_job_alerts() n'))[0].n;
const nq2 = (await q('select public.queue_job_alerts() n'))[0].n;
ok(nq === 1 && nq2 === 0, 'service_role: queue_job_alerts encola 1 aviso y es idempotente', nq + '/' + nq2);
await as('postgres');
const al = (await q(`select to_email, payload->>'total' t from public.email_outbox where kind='job_alert'`));
ok(al.length === 1 && al[0].to_email === 'cand@test.dev' && Number(al[0].t) === 1, 'outbox: 1 job_alert para la candidata solo con la oferta que casa por categoría, país y palabra «react» (la otra no contiene la palabra)', JSON.stringify(al));

await as('authenticated', U.cand);
const wd = (await q('select public.withdraw_application($1) r', [APP_A]))[0].r;
ok(wd.status === 'WITHDRAWN', 'candidato: withdraw_application');
await expErr('candidato: retirarse otra vez -> ALREADY_WITHDRAWN', /ALREADY_WITHDRAWN/, 'select public.withdraw_application($1)', [APP_A]);
mine = await q('select candidate_status from public.my_job_applications where id=$1', [APP_A]);
ok(mine[0].candidate_status === 'WITHDRAWN', 'candidato: ve WITHDRAWN');
await aerr('candidato: no reaplica tras retirarse -> ALREADY_APPLIED', /ALREADY_APPLIED/, J, { answers: { [QS.q1]: 'x', [QS.q2]: 'YES' } });
await as('authenticated', U.mA);
await expErr('empresa: no mueve una candidatura retirada (RPC)', /APPLICATION_WITHDRAWN/, `select public.update_application_status($1,$2,$3,'REJECTED')`, [APP_A, CA, U.mA]);
await expErr('empresa: no mueve una candidatura retirada (UPDATE directo)', /APPLICATION_WITHDRAWN/, `update public.job_applications set status='REJECTED' where id=$1`, [APP_A]);

// expire_job_postings: se envejece la oferta J (como postgres) y la ejecuta service_role
await as('postgres');
await run(`update public.job_postings set created_at = now() - interval '40 days' where id=$1`, [J]);
await run(`update public.job_postings set application_deadline = now() - interval '1 day' where id=$1`, [J]);
await as('authenticated', U.mA);
await expDenied('expire_job_postings: ni un miembro ni un admin con sesión pueden', 'select public.expire_job_postings()');
await as('service_role');
const ex = (await q('select public.expire_job_postings() r'))[0].r;
ok(ex.expired === 1, 'service_role: expire_job_postings cierra la oferta vencida', JSON.stringify(ex));
ok((await q('select public.expire_job_postings() r'))[0].r.expired === 0, 'expire_job_postings: segunda ejecución idempotente');
await as('postgres');
ok((await q('select status from public.job_postings where id=$1', [J]))[0].status === 'EXPIRED', 'oferta J: EXPIRED');
ok((await q(`select count(*)::int n from public.email_outbox where kind='job_expired' and payload->>'job_id'=$1`, [J]))[0].n === 2, 'outbox: aviso de caducidad a los 2 destinatarios');
ok((await q(`select count(*)::int n from public.job_posting_status_history where job_id=$1 and source='expire'`, [J]))[0].n === 1, 'historial de la oferta registra «expire»');
await as('anon');
r = await q(`select id from public.search_public_jobs_v2(p_country=>'ES')`);
ok(r.length === 1 && r[0].id === J2, 'anon: la oferta caducada ya no sale en el listado; sigue la 2.ª');
r = await q('select status, accepting_applications from public.get_job_posting_detail($1)', [SLUG]);
ok(r.length === 1 && r[0].status === 'EXPIRED' && r[0].accepting_applications === false, 'anon: la ficha de la caducada sigue visible pero sin inscripción');
await as('authenticated', U.candB);
await aerr('candidato: inscribirse en una oferta caducada -> JOB_NOT_AVAILABLE', /JOB_NOT_AVAILABLE/, J, { answers: { [QS.q1]: 'x', [QS.q2]: 'YES' } });
await as('authenticated', U.cand);
ok((await q('select job_status from public.my_job_applications where id=$1', [APP_A]))[0].job_status === 'EXPIRED', 'candidato: su candidatura muestra job_status EXPIRED');

// =====================================================================================================
// 3. ATAQUES: los bloqueos probados por separado SIGUEN tras el encadenado
// =====================================================================================================
sec('3. Ataques de seguridad tras el encadenado');
const attacks = async (label) => {
  // candidato B (tiene una candidatura NOT_QUALIFIED) y candidato A (retirada): ninguno puede tocar status/rating/notas
  for (const [who, uid, appId] of [['A', U.cand, APP_A], ['B', U.candB, APP_B]]) {
    await as('authenticated', uid);
    for (const [col, val] of [['status', "'HIRED'"], ['rating', '5'], ['internal_notes', "'yo mismo'"]])
      await expZero(`${label} candidato ${who}: UPDATE directo de ${col} sobre su candidatura`, `update public.job_applications set ${col}=${val} where id=$1`, [appId]);
    await expDenied(`${label} candidato ${who}: UPDATE de perfil_copia`, `update public.job_applications set perfil_copia='{}' where id=$1`, [appId]);
    await expDenied(`${label} candidato ${who}: INSERT directo en job_applications`, `insert into public.job_applications(job_posting_id, profile_id, company_id) values ($1,$2,$3)`, [J2, uid, CA]);
    await expDenied(`${label} candidato ${who}: DELETE directo`, 'delete from public.job_applications where id=$1', [appId]);
  }
  await as('authenticated', U.cand);
  await expDenied(label + ' candidato: TRUNCATE job_applications', 'truncate public.job_applications');
  await expDenied(label + ' candidato: escribir en el historial de candidaturas', `insert into public.job_application_status_history(application_id,to_status) values ($1,'HIRED')`, [APP_A]);
  ok((await q('select count(*)::int n from public.job_application_status_history'))[0].n === 0, label + ' candidato: no lee la tabla de historial (solo por get_application_history)');
  await expDenied(label + ' candidato: no lee email_outbox', 'select * from public.email_outbox');
  await expDenied(label + ' candidato: no lee email_queue', 'select * from public.email_queue');
  await expDenied(label + ' candidato: no ejecuta queue_email_notification', `select public.queue_email_notification('a','b','c','{}'::jsonb)`);
  await expDenied(label + ' candidato: no escribe en email_queue', `insert into public.email_queue(template_name, recipient_email) values ('x','y')`);
  await as('anon');
  await expDenied(label + ' anon: no lee email_queue', 'select * from public.email_queue');
  await expDenied(label + ' anon: no escribe/vacía email_queue', 'delete from public.email_queue');
  await expDenied(label + ' anon: no lee email_outbox', 'select * from public.email_outbox');
  await expDenied(label + ' anon: no ejecuta queue_email_notification', `select public.queue_email_notification('a','b','c','{}'::jsonb)`);
  await as('service_role');
  await expOk(label + ' service_role: sí encola en email_queue', `select public.queue_email_notification('a','b','c','{}'::jsonb)`);
  // aceptaciones ajenas
  await as('authenticated', U.candB);
  ok((await q('select count(*)::int n from public.aceptaciones where user_id=$1', [U.cand]))[0].n === 0, label + ' candidato B: NO lee las aceptaciones de A');
  ok((await q('select count(*)::int n from public.aceptaciones where user_id is distinct from auth.uid()'))[0].n === 0, label + ' candidato B: ve solo las suyas (ninguna ajena)');
  await expDenied(label + ' candidato B: INSERT en aceptaciones', `insert into public.aceptaciones(user_id,documento_id,tipo,version,contexto) select $1, id, tipo, version, 'registro' from public.documentos_legales limit 1`, [U.cand]);
  await expDenied(label + ' candidato B: UPDATE de aceptaciones ajenas', `update public.aceptaciones set ip='1.1.1.1'`);
  await as('authenticated', U.cand);
  await expDenied(label + ' candidato A: DELETE de sus aceptaciones', 'delete from public.aceptaciones');
  await as('anon');
  await expDenied(label + ' anon: no lee aceptaciones', 'select * from public.aceptaciones');
  await as('service_role');
  await expDenied(label + ' service_role: no actualiza aceptaciones (inmutables)', `update public.aceptaciones set ip='1.1.1.1'`);
  // pasar la oferta a PUBLISHED sin revisión
  await as('authenticated', U.mA);
  const jd = (await q(jobIns, [CA, U.mA, 'Oferta de ataque ' + label, LONG, null]))[0].id;
  await expErr(label + ' miembro: DRAFT -> PUBLISHED directo', /PUBLISH_REQUIRES_REVIEW/, `update public.job_postings set status='PUBLISHED' where id=$1`, [jd]);
  await expErr(label + ' miembro: INSERT con status PUBLISHED', /PUBLISH_REQUIRES_REVIEW/, `insert into public.job_postings(company_id, created_by, title, description, status) values ($1,$2,'x','y','PUBLISHED')`, [CA, U.mA]);
  await expErr(label + ' miembro: DRAFT -> AI_REVIEW / MANUAL_REVIEW directo', /STATUS_RESERVED/, `update public.job_postings set status='MANUAL_REVIEW' where id=$1`, [jd]);
  await expErr(label + ' miembro: fijar published_at', /PROTECTED_FIELD/, `update public.job_postings set published_at=now() where id=$1`, [jd]);
  const viaPub = (await q('select public.publish_job_posting($1,$2,$3,30) r', [jd, CA, U.mA]))[0].r;
  ok(viaPub.status === 'AI_REVIEW' && viaPub.credits_used === 0, label + ' publish_job_posting solo deja la oferta en AI_REVIEW y sin cobro', JSON.stringify(viaPub));
  await expErr(label + ' miembro: AI_REVIEW -> PUBLISHED directo', /IN_REVIEW/, `update public.job_postings set status='PUBLISHED' where id=$1`, [jd]);
  await expErr(label + ' miembro: moderar_oferta', /FORBIDDEN/, `select public.moderar_oferta($1,'PUBLISHED')`, [jd]);
  await expErr(label + ' miembro: reabre su cierre (reviewed_text_hash)', /PROTECTED_FIELD/, `update public.job_postings set reviewed_text_hash='x' where id=$1`, [jd]);
  await as('authenticated', U.cand);
  await expZero(label + ' candidato (no miembro): UPDATE de una oferta ajena', `update public.job_postings set status='PUBLISHED' where id=$1`, [jd]);
  await expErr(label + ' candidato: moderar_oferta', /FORBIDDEN/, `select public.moderar_oferta($1,'PUBLISHED')`, [jd]);
  await as('authenticated', U.mB);
  await expZero(label + ' empresa B: UPDATE sobre oferta de A', `update public.job_postings set title='robada' where id=$1`, [jd]);
  ok((await q('select count(*)::int n from public.job_postings where id=$1', [jd]))[0].n === 0, label + ' empresa B: no ve el borrador de A');
  await as('anon');
  ok((await q('select count(*)::int n from public.job_postings where id=$1', [jd]))[0].n === 0, label + ' anon: no ve la oferta en revisión');
  // columnas privadas de job_postings como anon
  for (const c of ['notify_emails', 'notify_frequency', 'review_reason', 'reviewed_at', 'reviewed_by', 'reviewed_text_hash', 'created_by', 'credits_cost', 'metadata', 'closed_by', 'expires_notice_sent_at'])
    await expDenied(`${label} anon: no lee job_postings.${c}`, `select ${c} from public.job_postings`);
  await expDenied(label + ' anon: select * de job_postings', 'select * from public.job_postings');
  await expDenied(label + ' anon: INSERT en job_postings', `insert into public.job_postings(company_id,created_by,title,description) values ($1,$2,'x','y')`, [CA, U.mA]);
  ok(!(await err('select id, slug, title, published_at, updated_at from public.job_postings')), label + ' anon: sí lee las columnas de la lista blanca (sitemap)');
  // expected_answer
  await expDenied(label + ' anon: no lee job_posting_questions.expected_answer', 'select expected_answer from public.job_posting_questions');
  await expDenied(label + ' anon: select * de job_posting_questions', 'select * from public.job_posting_questions');
  await expDenied(label + ' anon: no filtra por expected_answer (sondeo)', `select id from public.job_posting_questions where expected_answer='YES'`);
  await as('authenticated', U.cand);
  await expDenied(label + ' candidato: no lee expected_answer', 'select expected_answer from public.job_posting_questions');
  await expDenied(label + ' candidato: select * de job_posting_questions', 'select * from public.job_posting_questions');
  await expDenied(label + ' candidato: no sondea expected_answer con WHERE', `select id from public.job_posting_questions where expected_answer='YES'`);
  await expErr(label + ' candidato: get_job_questions_for_company -> UNAUTHORIZED', /UNAUTHORIZED/, 'select * from public.get_job_questions_for_company($1)', [J]);
  await expDenied(label + ' candidato: no inserta preguntas en ofertas ajenas', `insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'hack','TEXT')`, [J]);
  await as('authenticated', U.mB);
  await expErr(label + ' empresa B: get_job_questions_for_company de A -> UNAUTHORIZED', /UNAUTHORIZED/, 'select * from public.get_job_questions_for_company($1)', [J]);
  // privilegios sobre RPC internas
  await as('anon');
  for (const f of ['public.apply_to_job($1::uuid)', 'public.withdraw_application($1::uuid)', 'public.update_application_status($1::uuid,$1::uuid,$1::uuid,\'NEW\')', 'public.moderar_oferta($1::uuid,\'PUBLISHED\')', 'public.submit_job_for_review($1::uuid)', 'public.expire_job_postings()', 'public.queue_job_alerts()', 'public.get_recommended_jobs(5)', 'public.calculate_job_match_score($1::uuid,$1::uuid)', 'public.registrar_aceptacion(ARRAY[$1::uuid])', 'public.documentos_pendientes()', 'public._outbox_enqueue(\'x\',\'a@b.c\',\'{}\')', 'public.jobs_enqueue_email(\'x\',\'a@b.c\',\'{}\')', 'public.jobs_profile_snapshot($1::uuid)'])
    await expDenied(`${label} anon: no ejecuta ${f.split('(')[0]}`, `select ${f}`, f.includes('$1') ? [J] : undefined);
  await as('authenticated', U.cand);
  for (const f of ['public.expire_job_postings()', 'public.queue_job_alerts()', 'public._outbox_enqueue(\'x\',\'a@b.c\',\'{}\')', 'public.jobs_enqueue_email(\'x\',\'a@b.c\',\'{}\')', 'public.jobs_profile_snapshot($1::uuid)', 'public._job_submit($1::uuid,$1::uuid,30)', 'public.jobs_score_job(\'{}\'::jsonb,\'{}\'::jsonb)'])
    await expDenied(`${label} candidato: no ejecuta ${f.split('(')[0]}`, `select ${f}`, f.includes('$1') ? [J] : undefined);
  ok((await q('select public.calculate_job_match_score($1,$2) s', [J2, U.candB]))[0].s === 0, label + ' candidato: calculate_job_match_score de OTRO perfil devuelve 0');
  // datos privados de profiles / companies
  await as('anon');
  await expDenied(label + ' anon: profiles.fecha_nacimiento', 'select fecha_nacimiento from public.profiles');
  await expDenied(label + ' anon: profiles.registro_idioma', 'select registro_idioma from public.profiles');
  await expDenied(label + ' anon: profiles_full', 'select * from public.profiles_full');
  await expDenied(label + ' anon: companies.contact_name', 'select contact_name from public.companies');
  await as('authenticated', U.candB);
  await expDenied(label + ' candidato B: profiles.fecha_nacimiento', 'select fecha_nacimiento from public.profiles');
  ok((await q('select count(*)::int n from public.profiles_full where id=$1', [U.cand]))[0].n === 0, label + ' candidato B: no ve la fila de A en profiles_full');
  await expDenied(label + ' candidato B: companies.contact_name', 'select contact_name from public.companies');
  await expDenied(label + ' candidato B: companies.company_email', 'select company_email from public.companies');
  // escalada
  await as('authenticated', U.cand);
  await expErr(label + ' candidato: se hace admin (profiles.role)', /PROTECTED_FIELD/, `update public.profiles set role='admin' where id=$1`, [U.cand]);
  await expDenied(label + ' candidato: se mete como OWNER en la empresa A', `insert into public.company_users(company_id,user_id,role) values ($1,$2,'OWNER')`, [CA, U.cand]);
  await expDenied(label + ' candidato: se mete como MEMBER en la empresa A', `insert into public.company_users(company_id,user_id,role) values ($1,$2,'MEMBER')`, [CA, U.cand]);
  await expDenied(label + ' candidato: escribe en countries', `insert into public.countries values ('ZZ','a','b','USD')`);
  await expDenied(label + ' candidato: escribe en documentos_legales', `insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('cookies','9','es','t','x',now())`);
  await expDenied(label + ' candidato: escribe en job_reports a nombre de otro', `insert into public.job_reports(job_id, reporter_id, reason) values ($1,$2,'SCAM')`, [J2, U.mB]);
  await as('authenticated', U.cand);
  await expDenied(label + ' candidato A: no crea alerta a nombre de B', `insert into public.job_alert_subscriptions(profile_id) values ($1)`, [U.candB]);
};
await attacks('[tras encadenado]');

// Hueco conocido y documentado de la fase 2: authenticated conserva SELECT de tabla en job_postings
await as('authenticated', U.cand);
const leak = await err(`select notify_emails, review_reason, created_by, credits_cost from public.job_postings where id=$1`, [J2]);
if (!leak) warn('authenticated (cualquier usuario con sesión, p. ej. un candidato) LEE notify_emails/review_reason/created_by/credits_cost de ofertas PUBLISHED (fase 2 lo deja documentado como seguimiento; anon sí está cerrado)');
else ok(true, 'authenticated tampoco lee columnas privadas de job_postings');

sec('3b. Reaplicar las cuatro CON DATOS y repetir los ataques');
const polBefore = (await (async () => { await as('postgres'); return q('select count(*)::int n from pg_policies'); })())[0].n;
const snapPre = await snapshot(db);
for (const n of MIGS) { const e = await applyMig(db, n); ok(!e, `tercera aplicación (con datos) de ${n}`, e && e.message); }
await as('postgres');
const snapPost = await snapshot(db);
const dPost = diffSnap(snapPre, snapPost);
ok(dPost.length === 0, 'reaplicar con datos no cambia nada del catálogo', dPost.slice(0, 6).map((x) => x.t + ' ' + x.k).join(' ; '));
ok((await q('select count(*)::int n from pg_policies'))[0].n === polBefore, 'reaplicar con datos no duplica políticas');
ok((await q('select count(*)::int n from public.job_applications'))[0].n === 2 && (await q('select status from public.job_postings where id=$1', [J]))[0].status === 'EXPIRED', 'reaplicar con datos conserva candidaturas y estados');
await attacks('[tras reaplicar]');

sec('3c. Acoplamiento entre fases y huecos funcionales');
globalThis.AUTOACC = false;   // aqui se comprueba justo que SIN aceptar el servidor rechaza
await as('authenticated', U.out);
const rOut = await err(`select public.apply_to_job($1::uuid, null, null, '{}'::jsonb, true, 'version-inventada')`, [J2]);
await as('postgres');
const cvOut = (await q('select consent_doc_version from public.job_applications where profile_id=$1', [U.out]))[0];
if (!rOut && cvOut && cvOut.consent_doc_version === 'version-inventada') warn('apply_to_job (fase 3) acepta a un candidato que NO ha aceptado los términos vigentes (documentos_pendientes() no vacío) y guarda como «versión» el texto libre que manda el cliente; la prueba legal inmutable (aceptaciones, fase 1) no se enlaza con la candidatura');
else ok(true, 'apply_to_job exige los términos vigentes aceptados');
await as('authenticated', U.mB);
const jb = (await q(jobIns, [CB, U.mB, 'Oferta de B sin aceptar términos', LONG, null]))[0].id;
const nPendB = (await q('select count(*)::int n from public.documentos_pendientes()'))[0].n;
const eSubB = await err('select public.submit_job_for_review($1)', [jb]);
if (!eSubB && nPendB > 0) warn(`submit_job_for_review (fase 2) deja enviar a revisión a una empresa con ${nPendB} documento(s) legal(es) pendiente(s) (fase 1); el texto de terminos_empleador dice que sin aceptar «no podrá publicar», pero hoy solo lo impondría el frontend`);
else ok(true, 'submit_job_for_review exige los documentos legales de empleador aceptados');
globalThis.AUTOACC = true;
await as('authenticated', U.mA);
const eSel = await err('select * from public.job_posting_questions where job_posting_id=$1', [J2]);
if (isDenied(eSel)) warn('la empresa ya no puede hacer select * de job_posting_questions (expected_answer cerrada también para sus miembros): el panel debe usar get_job_questions_for_company; INSERT ... RETURNING * tampoco funciona (fase 3, documentado)');
await as('authenticated', U.vA);
await expZero('VIEWER: no edita ofertas (se retiró la política redundante)', `update public.job_postings set title='viewer' where id=$1`, [J2]);
await as('anon');
await expDenied('anon: no lee my_job_applications', 'select * from public.my_job_applications');
ok((await q('select count(*)::int n from public.search_public_jobs()'))[0].n >= 1, 'anon: la search_public_jobs antigua sigue funcionando (SECURITY DEFINER, no depende de los grants cerrados)');
await as('postgres');
try {
  const mt = (await q("select has_table_privilege('anon','public.job_postings','MAINTAIN') a, has_table_privilege('authenticated','public.job_postings','MAINTAIN') u"))[0];
  if (mt.a) warn('anon conserva el privilegio MAINTAIN (PG17: VACUUM/ANALYZE/REINDEX/LOCK) sobre job_postings: la fase 2 revoca TRUNCATE/REFERENCES/TRIGGER pero no MAINTAIN. PostgREST no lo expone: riesgo nulo por la API, pero conviene incluirlo en el REVOKE');
} catch (e) { /* PG < 17 */ }

sec('3d. Borrar una cuenta y una empresa recorre las claves foráneas de las tres fases');
await as('postgres');
const accN = (await q('select count(*)::int n from public.aceptaciones'))[0].n;
const eDelU = await err('delete from auth.users where id=$1', [U.cand]);
ok(!eDelU, 'borrar la cuenta de la candidata (cascada: perfil, candidaturas, historial, alertas; SET NULL: aceptaciones)', eDelU && eDelU.message);
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === accN && (await q("select count(*)::int n from public.aceptaciones where user_email='cand@test.dev' and user_id is null"))[0].n === 3, 'sus 3 aceptaciones (2 de registro + 1 de inscripción) se conservan con user_id NULL y el correo copiado');
ok((await q('select count(*)::int n from public.job_applications where profile_id=$1', [U.cand]))[0].n === 0 && (await q('select count(*)::int n from public.job_alert_subscriptions'))[0].n === 0, 'su candidatura y su alerta desaparecen con la cuenta');
const eDelC = await err('delete from public.companies where id=$1', [CA]);
ok(!eDelC, 'borrar la empresa A (cascada: miembros, ofertas, preguntas, candidaturas, historiales, denuncias; SET NULL: aceptaciones)', eDelC && eDelC.message);
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === accN && (await q('select count(*)::int n from public.job_postings where company_id=$1', [CA]))[0].n === 0 && (await q('select count(*)::int n from public.job_applications'))[0].n === 0 && (await q('select count(*)::int n from public.aceptaciones where company_id=$1 or oferta_id is not null', [CA]))[0].n === 0, 'las aceptaciones se conservan (company_id/oferta_id a NULL) y no queda ninguna candidatura huérfana');

// =====================================================================================================
// 4. CONFLICTOS ENTRE MIGRACIONES
// =====================================================================================================
sec('4a. Cambios de cada migración sobre objetos que otra migración del paquete ya había tocado');
const names = ['(base)', ...MIGS];
const touched = new Map(); // key -> migración que lo creó/cambió
const report = [];
let diffTxt = '';
for (let i = 1; i < snaps.length; i++) {
  const d = diffSnap(snaps[i - 1], snaps[i]);
  diffTxt += `\n##### ${names[i]}: ${d.filter((x) => x.t === 'new').length} nuevos, ${d.filter((x) => x.t === 'chg').length} cambiados, ${d.filter((x) => x.t === 'del').length} eliminados\n`;
  for (const x of d) {
    diffTxt += `${x.t} ${x.k}${x.t === 'chg' ? '\n   antes:   ' + String(x.before).slice(0, 300) + '\n   despues: ' + String(x.after).slice(0, 300) : ''}\n`;
    if ((x.t === 'chg' || x.t === 'del') && touched.has(x.k) && !/^col\|/.test(x.k)) report.push({ mig: names[i], prev: touched.get(x.k), ...x });
    if (x.t !== 'del') touched.set(x.k, names[i]);
  }
}
fs.writeFileSync(PG + 'integrado.diff.txt', diffTxt);
for (const x of report) out(`  AVISO  ${x.mig} vuelve a tocar ${x.k} (antes: ${x.prev}) [${x.t}]\n           antes:   ${String(x.before).slice(0, 220)}\n           despues: ${String(x.after ?? '').slice(0, 220)}`);
ok(true, `análisis de ${snaps.length - 1} migraciones (detalle completo en integrado.diff.txt); objetos retocados por una segunda migración: ${report.length}`);
// ¿alguna migración REABRE un privilegio que una anterior del paquete había quitado? (se compara por grantee y letra de privilegio)
const aclOf = (k, v) => (k.startsWith('colacl|') ? String(v) : ((String(v).match(/acl=(.*?)(?:\|src=.*)?$/) || [])[1] ?? 'NULL'));
const parseAcl = (a) => { const m = new Map(); if (a === 'NULL' || !a) { m.set('PUBLIC', new Set(['X'])); m.set('postgres', new Set(['X'])); return m; } for (const it of a.split(',').filter(Boolean)) { const [g, rest] = it.split('='); const letters = (rest || '').split('/')[0].split('*').join(''); m.set(g || 'PUBLIC', new Set(letters.split(''))); } return m; };
const reopened = [];
for (let i = 2; i < snaps.length; i++) for (const x of diffSnap(snaps[i - 1], snaps[i])) {
  if (x.t !== 'chg' || !/^(rel|colacl|fn)|/.test(x.k) || !touched.has(x.k)) continue;
  const b = parseAcl(aclOf(x.k, x.before)), a = parseAcl(aclOf(x.k, x.after));
  for (const [g, set] of a) { const prev = b.get(g) || new Set(); const added = [...set].filter((l) => !prev.has(l)); if (added.length) reopened.push(`${names[i]} añade ${added.join('')} a ${g} en ${x.k}`); }
}
ok(reopened.length === 0, 'ninguna migración REABRE privilegios que otra migración del paquete había cerrado', reopened.join(' ; '));

sec('4b. Funciones: firmas redefinidas, sobrecargas y exposición');
{
  const defs = {};
  // 20261032 es la migracion CORRECTIVA: redefine a proposito funciones de 29/30/31 (se excluye de esta comprobacion)
  for (const n of MIGS.filter((x) => !x.startsWith('20261032'))) for (const m of SQL[n].matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:public\.)?(\w+)\s*\(/gi)) (defs[m[1].toLowerCase()] ||= new Set()).add(n.slice(0, 8));
  const multi = Object.entries(defs).filter(([, s]) => s.size > 1);
  ok(multi.length === 0, 'ninguna función definida en dos migraciones distintas del paquete', multi.map(([f, s]) => f + ':' + [...s].join('+')).join(' ; '));
  await as('postgres');
  const ov = await q(`select proname, count(*)::int n, string_agg(oid::regprocedure::text, ' | ') s from pg_proc where pronamespace='public'::regnamespace group by proname having count(*) > 1`);
  const ovNew = ov.filter((o) => !snaps[0].has('fn|' + o.s.split(' | ')[0]) || true);
  ok(ov.length === 0, 'ninguna función de public queda con sobrecargas (PostgREST no sabría cuál llamar)', ov.map((o) => o.s).join(' ;; '));
  const fn = await q(`select p.oid::regprocedure::text sig, p.proname, p.prosecdef sd, coalesce(p.proconfig::text,'') cfg,
      has_function_privilege('anon', p.oid, 'EXECUTE') a, has_function_privilege('authenticated', p.oid, 'EXECUTE') u,
      exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x where x.grantee = 0 and x.privilege_type='EXECUTE') pub
    from pg_proc p where p.pronamespace='public'::regnamespace order by 1`);
  const isNew = (f) => !snaps[0].has('fn|' + f.sig);
  const nuevas = fn.filter(isNew);
  const sdSinPath = nuevas.filter((f) => f.sd && !/search_path/.test(f.cfg));
  ok(sdSinPath.length === 0, 'todas las funciones SECURITY DEFINER nuevas llevan SET search_path', sdSinPath.map((f) => f.sig).join(' ; '));
  const pubNew = nuevas.filter((f) => f.pub);
  const pubOk = pubNew.filter((f) => !f.sd);
  ok(pubNew.filter((f) => f.sd).length === 0, 'ninguna función SECURITY DEFINER nueva es ejecutable por PUBLIC', pubNew.filter((f) => f.sd).map((f) => f.sig).join(' ; '));
  if (pubOk.length) warn('funciones NO definer nuevas ejecutables por PUBLIC (utilidades puras, sin riesgo): ' + pubOk.map((f) => f.proname).join(', '));
  const anonNew = nuevas.filter((f) => f.a).map((f) => f.proname).sort();
  ok(anonNew.includes('search_public_jobs_v2') && anonNew.every((f) => ['documento_legal_vigente', 'job_slugify', 'search_public_jobs_v2'].includes(f)), 'de las funciones nuevas, anon solo ejecuta search_public_jobs_v2 (+ documento_legal_vigente que usa la política y job_slugify, pura)', anonNew.join(', '));
  const anonBase = fn.filter((f) => !isNew(f) && f.a).map((f) => f.proname);
  out('  INFO   funciones ya existentes en producción que anon sigue pudiendo ejecutar: ' + anonBase.join(', '));
  const authNew = nuevas.filter((f) => f.u && f.sd).map((f) => f.proname).sort();
  out('  INFO   funciones definer nuevas ejecutables por authenticated: ' + authNew.join(', '));
}

sec('4c. CHECK que una migración amplía y otra estrecha');
{
  const cons = {};
  for (const n of MIGS) for (const m of SQL[n].matchAll(/ADD\s+CONSTRAINT\s+(\w+)/gi)) (cons[m[1]] ||= new Set()).add(n.slice(0, 8));
  const multi = Object.entries(cons).filter(([, s]) => s.size > 1);
  ok(multi.length === 0, 'ningún CONSTRAINT con nombre se redefine en dos migraciones del paquete', multi.map(([c, s]) => c + ':' + [...s].join('+')).join(' ; '));
  const vals = (s) => new Set([...String(s).matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((v) => !/^(text|character)/.test(v)));
  const sub = (a, b) => [...a].every((x) => b.has(x));
  const get = (S, k) => vals(S.get(k) || '');
  const fin = snapPost;
  ok(sub(get(snaps[0], 'con|job_postings|job_postings_status_check'), get(fin, 'con|job_postings|job_postings_status_check')) && get(fin, 'con|job_postings|job_postings_status_check').size === 9, 'job_postings.status: los 5 valores actuales se conservan (+4 nuevos = 9)');
  ok(sub(get(snaps[0], 'con|job_applications|job_applications_status_check'), get(fin, 'con|job_applications|job_applications_status_check')) && get(fin, 'con|job_applications|job_applications_status_check').size === 9, 'job_applications.status: los 8 valores actuales se conservan (+ NOT_QUALIFIED = 9)');
  const cs = get(fin, 'con|companies|companies_company_size_check');
  ok(['1-10', '11-50', '51-250', '250+'].every((x) => cs.has(x)) && cs.size === 4, 'companies.company_size: queda con los 4 tramos nuevos (ESTRECHA a propósito: 51-200/201-500/501-1000/1000+ ya no entran; los datos se convierten)', [...cs].join());
  // ninguna otra migración re-estrecha lo que la fase 2/3 amplían: los valores del CHECK final de cada paso coinciden con el del paso donde se amplió
  ok(JSON.stringify([...get(snaps[3], 'con|job_postings|job_postings_status_check')]) === JSON.stringify([...get(fin, 'con|job_postings|job_postings_status_check')]) && JSON.stringify([...get(snaps[4], 'con|job_applications|job_applications_status_check')]) === JSON.stringify([...get(fin, 'con|job_applications|job_applications_status_check')]), 'los CHECK ampliados no se vuelven a tocar después de ampliarse');
  // la fase 3 añade NOT_QUALIFIED a job_applications; ¿algún sitio de la fase 2 (search_public_jobs_v2) distingue estados?
  await as('postgres');
  const bad = await q(`select p.proname from pg_proc p where p.pronamespace='public'::regnamespace and p.prosrc ilike '%job_applications%' and p.prosrc ilike '%<> ''WITHDRAWN''%'`);
  out('  INFO   funciones que cuentan la candidatura como «ya inscrito» salvo WITHDRAWN: ' + bad.map((x) => x.proname).join(', ') + ' (una NOT_QUALIFIED cuenta como inscrita: correcto, no se revela el descarte)');
}

sec('4d. Políticas duplicadas');
{
  await as('postgres');
  const dup = await q(`select tablename t, cmd, roles::text r, permissive pm, coalesce(qual,'') q, coalesce(with_check,'') w, array_agg(policyname order by policyname) names from pg_policies where schemaname='public' group by 1,2,3,4,5,6 having count(*) > 1 order by 1`);
  const nuevasDup = dup.filter((d) => d.names.some((n) => !snaps[0].has(`pol|${d.t}|${n}`)));
  ok(nuevasDup.length === 0, 'ninguna política CREADA por las migraciones duplica otra idéntica', nuevasDup.map((d) => d.t + ':' + d.names.join('+')).join(' ; '));
  for (const d of dup.filter((x) => !nuevasDup.includes(x))) warn(`política duplicada ya existente en producción (no la crean las migraciones): ${d.t} ${d.cmd}: ${d.names.join(' + ')}`);
  const perTable = await q(`select tablename t, cmd, count(*)::int n from pg_policies where schemaname='public' and tablename in ('job_applications','job_postings','job_posting_questions','email_outbox','countries','aceptaciones') group by 1,2 order by 1,2`);
  out('  INFO   políticas por tabla/comando: ' + perTable.map((x) => `${x.t}.${x.cmd}=${x.n}`).join(' '));
  const noRls = await q(`select relname from pg_class where relnamespace='public'::regnamespace and relkind='r' and not relrowsecurity order by 1`);
  ok(noRls.length === 0, 'todas las tablas de public tienen RLS activada (incluida email_queue tras 20261028)', noRls.map((x) => x.relname).join(','));
  const noPol = await q(`select c.relname from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' and c.relrowsecurity and not exists (select 1 from pg_policy p where p.polrelid=c.oid) order by 1`);
  out('  INFO   tablas con RLS y SIN políticas (solo service_role/definer): ' + noPol.map((x) => x.relname).join(', '));
  // escritura directa: privilegios de tabla de anon/authenticated sobre las tablas nuevas
  const tw = await q(`select c.relname t, has_table_privilege('anon', c.oid, 'INSERT') ai, has_table_privilege('anon', c.oid, 'UPDATE') au, has_table_privilege('anon', c.oid, 'DELETE') ad, has_table_privilege('anon', c.oid, 'TRUNCATE') at,
      has_table_privilege('authenticated', c.oid, 'INSERT') ui, has_table_privilege('authenticated', c.oid, 'UPDATE') uu, has_table_privilege('authenticated', c.oid, 'DELETE') ud, has_table_privilege('authenticated', c.oid, 'TRUNCATE') ut
    from pg_class c where c.relnamespace='public'::regnamespace and c.relkind='r' and c.relname in ('documentos_legales','aceptaciones','countries','company_ai_reviews','email_outbox','email_queue','job_posting_status_history','job_reports','job_application_status_history','job_alert_subscriptions','job_applications','job_postings','job_posting_questions') order by 1`);
  const bad = tw.filter((x) => x.ai || x.au || x.ad || x.at || x.ut);
  ok(bad.length === 0, 'anon sin escritura ni TRUNCATE y authenticated sin TRUNCATE en todas las tablas de la bolsa', bad.map((x) => x.t).join(','));
  const wr = tw.filter((x) => x.ui || x.uu || x.ud).map((x) => `${x.t}[${x.ui ? 'I' : ''}${x.uu ? 'U' : ''}${x.ud ? 'D' : ''}]`);
  out('  INFO   tablas donde authenticated conserva escritura de tabla (la limita RLS/columna/trigger): ' + wr.join(' '));
}

sec('4e. Orden de aplicación: countries, email_outbox y el resto (fases en otro orden)');
{
  const orders = { '29-30-31': [1, 2, 3], '31-30-29': [3, 2, 1], '30-29-31': [2, 1, 3], '30-31-29': [2, 3, 1], '31-29-30': [3, 1, 2] };
  const base = snapPre; // referencia (orden normal, tras 4 aplicaciones; sin datos de negocio en el catálogo)
  const shared = (S) => [...S.entries()].filter(([k]) => /(^|[|.])(countries|email_outbox|email_queue)([|.]|$)|email_outbox_|countries_/.test(k)).sort(([a], [b]) => a.localeCompare(b));
  for (const [label, idx] of Object.entries(orders)) {
    const d2 = await buildDb();
    let failed = null;
    const e0 = await applyMig(d2, MIGS[0]); if (e0) failed = MIGS[0] + ': ' + e0.message;
    for (const i of idx) { if (failed) break; const e = await applyMig(d2, MIGS[i]); if (e) failed = MIGS[i] + ': ' + e.message; }
    if (failed) { ok(false, `orden ${label}: las tres migraciones se aplican`, failed); await d2.close?.(); continue; }
    const S = await snapshot(d2);
    const dif = diffSnap(snaps[4], S);
    const sh = diffSnap(new Map(shared(snaps[4])), new Map(shared(S)));
    ok(sh.length === 0, `orden ${label}: countries y email_outbox quedan idénticos (columnas, ACL, políticas, índices)`, sh.map((x) => x.t + ' ' + x.k).join(' ; '));
    const rest = dif.filter((x) => !sh.includes(x));
    if (rest.length) warn(`orden ${label}: el catálogo final difiere del orden normal en ${rest.length} objetos: ` + rest.slice(0, 6).map((x) => x.t + ' ' + x.k).join(' ; '));
    else ok(true, `orden ${label}: el catálogo final completo es idéntico al del orden normal`);
    await d2.close?.();
  }
  const outbox = [...snaps[4].entries()].filter(([k]) => /email_outbox/.test(k)).map(([k, v]) => `${k}`);
  out('  INFO   objetos de email_outbox: ' + outbox.join(' ; '));
  const idx = outbox.filter((k) => k.startsWith('idx|'));
  const idxDefs = idx.map((k) => snaps[4].get(k));
  if (idx.length > 2) warn(`email_outbox tiene ${idx.length} índices: ${idx.join(', ')} (email_outbox_pending_idx y email_outbox_pendientes_idx indexan lo mismo (send_after) WHERE sent_at IS NULL: redundante, uno sobra)`);
}

out(`\nRESULTADO: ${pass} OK, ${fail} FALLO, ${warns} AVISO`);
process.exit(fail ? 1 : 0);
