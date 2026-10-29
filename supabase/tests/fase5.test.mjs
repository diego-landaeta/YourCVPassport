// Prueba de 20261033_pendientes_bolsa.sql y 20261034_programacion_cron.sql SOBRE EL ENCADENADO COMPLETO 28 -> 34,
// en PGlite con la base REAL de produccion (stub-base.sql, prod-funcs.sql, stub-triggers.sql: leidos con prodsql.mjs, solo lectura).
// pg_cron, pg_net y vault NO existen en PGlite: se crean stubs minimos (cron.schedule/unschedule/job, net.http_post, vault.decrypted_secrets).
// Uso: node fase5.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const ROOT = HERE;
const MIGDIR = ROOT + '../migrations/';
const PG = ROOT;
const MIGS = ['20261028_cerrar_email_queue', '20261029_legal_aceptaciones_idioma', '20261030_ofertas_fase2', '20261031_candidaturas_fase3', '20261032_correcciones_auditoria', '20261033_pendientes_bolsa', '20261034_programacion_cron'];
const SQL = Object.fromEntries(MIGS.map((n) => [n, fs.readFileSync(MIGDIR + n + '.sql', 'utf8')]));

let pass = 0, fail = 0;
const out = (s) => console.log(s);
const ok = (c, m, extra) => { if (c) { pass++; out('  OK     ' + m); } else { fail++; out('  FALLO  ' + m + (extra !== undefined ? '  => ' + String(extra).slice(0, 400) : '')); } };
const sec = (t) => out('\n== ' + t + ' ==');
process.on('uncaughtException', (e) => { out('ERROR NO CAPTURADO: ' + String(e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });
process.on('unhandledRejection', (e) => { out('ERROR NO CAPTURADO: ' + String(e && e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });

const U = {
  admin: '00000000-0000-0000-0000-0000000000ad',
  cand: '00000000-0000-0000-0000-0000000000c1',   // candidata, idioma en
  candB: '00000000-0000-0000-0000-0000000000c2',  // candidato es
  candC: '00000000-0000-0000-0000-0000000000c3',  // candidato es, ya aceptó una version
  inact: '00000000-0000-0000-0000-0000000000c4',  // candidato inactivo
  emp: '00000000-0000-0000-0000-00000000a001',    // miembro de empresa
  mgr: '00000000-0000-0000-0000-00000000a0aa',    // gestor de cand
};
const CO = 'c0000000-0000-0000-0000-00000000001e';
const DAY = 86400000;
const iso = (days) => new Date(Date.now() + days * DAY).toISOString();

function H(db) {
  const as = async (role, uid, headers) => {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false), set_config('request.headers', $3, false)",
      [uid ?? '', role === 'postgres' ? '' : role, headers ? JSON.stringify(headers) : '']);
    if (role !== 'postgres') await db.exec(`set role ${role}`);
  };
  const q = async (sql, params) => (await db.query(sql, params)).rows;
  const run = async (sql, params) => db.query(sql, params);
  const err = async (sql, params) => { try { await db.query(sql, params); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } };
  return { as, q, run, err };
}
const isDenied = (e) => !!e && (e.code === '42501' || /permission denied|row-level security|must be owner|violates row-level/i.test(String(e.message)));

async function buildDb() {
  const db = new PGlite();
  await db.exec(fs.readFileSync(PG + 'stub-base.sql', 'utf8'));
  const pf = fs.readFileSync(PG + 'prod-funcs.sql', 'utf8');
  await db.exec(pf);
  await db.exec(fs.readFileSync(PG + 'stub-triggers.sql', 'utf8'));
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
  return db;
}
// Stubs minimos de lo que en Supabase traen pg_cron, pg_net y vault (PGlite no los incluye).
async function infraStubs(db) {
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
}
async function applyMig(db, name) { try { await db.exec(SQL[name]); return null; } catch (e) { try { await db.exec('rollback'); } catch {} return e; } }

const db = await buildDb();
await infraStubs(db);
const { as, q, run, err } = H(db);
const expDenied = async (name, sql, params) => { const e = await err(sql, params); ok(isDenied(e), name, e ? e.message : 'no hubo error'); };
const expErr = async (name, re, sql, params) => { const e = await err(sql, params); ok(!!e && re.test(String(e.message)), name, e ? e.message : 'no hubo error'); };

// ------------------------------------------------------------------ cadena
sec('0. Cadena 28 -> 34 (primera y segunda aplicacion)');
await as('postgres');
for (const n of MIGS) { const e = await applyMig(db, n); ok(!e, `primera aplicacion de ${n}`, e && (e.message + (e.where ? ' | ' + String(e.where).split('\n')[0] : ''))); if (e) { out(`RESULTADO: ${pass} OK, ${fail} FALLO`); process.exit(1); } }
for (const n of MIGS.slice(5)) { const e = await applyMig(db, n); ok(!e, `segunda aplicacion de ${n}`, e && e.message); }

// ------------------------------------------------------------------ datos
const mkUser = (id, email, meta) => db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3::jsonb)', [id, email, JSON.stringify(meta)]);
await mkUser(U.admin, 'admin@test.dev', { full_name: 'Admin', registro_idioma: 'es' });
await mkUser(U.cand, 'cand@test.dev', { full_name: 'Ana', registro_idioma: 'en' });
await mkUser(U.candB, 'candb@test.dev', { full_name: 'Beto', registro_idioma: 'es' });
await mkUser(U.candC, 'candc@test.dev', { full_name: 'Carla', registro_idioma: 'es' });
await mkUser(U.inact, 'inact@test.dev', { full_name: 'Inactivo', registro_idioma: 'es' });
await mkUser(U.emp, 'emp@acme.test', { full_name: 'Marta', registro_idioma: 'es' });
await mkUser(U.mgr, 'mgr@test.dev', { full_name: 'Gestora', registro_idioma: 'es' });
await as('service_role');
await run("update public.profiles set role='admin' where id=$1", [U.admin]);
await run("update public.profiles set role='employer' where id=$1", [U.emp]);
await run("update public.profiles set is_active=false where id=$1", [U.inact]);
await run("update public.profiles set managed_by=$1 where id=$2", [U.mgr, U.cand]);
await as('postgres');
await run("insert into public.companies(id, company_name, legal_name, tax_id, company_email, company_size, status, created_by) values ($1,'Acme','Acme SL','A1','rrhh@acme.test','11-50','APPROVED',$2)", [CO, U.emp]);
await run("insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER')", [CO, U.emp]);
// candC ya aceptó candidato/privacidad v1.0 es (como haria la puerta de aceptacion)
await as('authenticated', U.candC);
{
  const pend = await q('select documento_id from public.documentos_pendientes()');
  await run('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [pend.map((x) => x.documento_id), JSON.stringify({ acepto_condiciones_privacidad: true, datos_verdaderos: true }), 'registro']);
}
const outboxN = async (kind) => { await as('postgres'); return (await q('select count(*)::int n from public.email_outbox where kind=$1', [kind]))[0].n; };
const T_ES = 'Nuevas condiciones de uso';

// ================================================================== A. AVISO DE 15 DIAS
sec('A1. legal_publicar_version: permisos y validaciones');
await as('anon');
await expDenied('anon: no ejecuta legal_publicar_version', `select public.legal_publicar_version('terminos_candidato','2.0','es','t','x',$1)`, [iso(20)]);
await expDenied('anon: no ejecuta legal_encolar_aviso', `select public.legal_encolar_aviso('terminos_candidato','1.0')`);
await expDenied('anon: no ejecuta legal_aviso_proximo', `select * from public.legal_aviso_proximo()`);
await expDenied('anon: no ejecuta save_consent_prefs', `select public.save_consent_prefs('{"perfil_publico":true}')`);
await as('authenticated', U.candB);
await expErr('usuario normal: NO publica una version (FORBIDDEN)', /FORBIDDEN/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','x',$1)`, [iso(20)]);
await expErr('usuario normal: NO encola avisos (FORBIDDEN)', /FORBIDDEN/, `select public.legal_encolar_aviso('terminos_candidato','1.0')`);
await expDenied('usuario normal: no inserta en documentos_legales a mano', `insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde,borrador) values ('privacidad','9.9','es','t','x',now()+interval '30 days',false)`);
await as('authenticated', U.admin);
await expErr('admin: antelacion < 15 dias rechazada (ANTELACION_INSUFICIENTE)', /ANTELACION_INSUFICIENTE/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','texto',$1)`, [iso(5)]);
await expErr('admin: antelacion justo por debajo de 15 dias rechazada', /ANTELACION_INSUFICIENTE/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','texto',$1)`, [iso(14.9)]);
await expErr('admin: tipo invalido', /LEGAL_INVALIDO/, `select public.legal_publicar_version('otra_cosa','2.0','es','t','texto',$1)`, [iso(20)]);
await expErr('admin: idioma invalido', /LEGAL_INVALIDO/, `select public.legal_publicar_version('terminos_candidato','2.0','ESP!','t','texto',$1)`, [iso(20)]);
await expErr('admin: texto vacio', /LEGAL_INVALIDO/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','   ',$1)`, [iso(20)]);
await expErr('admin: casilla con clave invalida', /LEGAL_INVALIDO/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','texto',$1, array['Mal Nombre'])`, [iso(20)]);
await expErr('admin: version duplicada (ya existe 1.0)', /VERSION_DUPLICADA/, `select public.legal_publicar_version('terminos_candidato','1.0','es','t','texto',$1)`, [iso(20)]);
await expErr('admin: p_urgente NO lo puede usar un admin con sesion', /FORBIDDEN/, `select public.legal_publicar_version('terminos_candidato','2.0','es','t','texto',$1, null, true)`, [iso(2)]);
await as('postgres');
ok((await q("select count(*)::int n from public.documentos_legales where version <> '1.0'"))[0].n === 0, 'nada se ha publicado tras los intentos rechazados');

sec('A2. Trigger de antelacion (camino directo)');
await as('authenticated', U.admin);
await expErr('admin: INSERT directo < 15 dias -> trigger ANTELACION_INSUFICIENTE', /ANTELACION_INSUFICIENTE/, `insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde,borrador) values ('privacidad','2.0','es','t','x',now()+interval '3 days',false)`);
await as('service_role');
await expErr('service_role: INSERT directo < 15 dias SIN marcar urgencia -> rechazado', /ANTELACION_INSUFICIENTE/, `insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde,borrador) values ('privacidad','2.0','es','t','x',now()+interval '3 days',false)`);
await as('postgres');
await expErr('postgres (sin rol de API): INSERT < 15 dias tampoco', /ANTELACION_INSUFICIENTE/, `insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde,borrador) values ('privacidad','2.0','es','t','x',now()+interval '3 days',false)`);
await as('authenticated', U.admin);
ok(!(await err(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,vigente_desde,borrador) values ('cookies','2.0','es','Cookies 2','x','todos',false,now()+interval '1 day',false)`)), 'admin: un documento informativo (cookies, requiere_aceptacion=false) no necesita antelacion');
ok(!(await err(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde,borrador) values ('privacidad','1.0','fr','Politique','x',now()+interval '1 day',false)`)), 'admin: la PRIMERA version de un tipo/idioma nuevo (fr) no necesita antelacion');
// la semilla de la fase 1 se puede reaplicar con el trigger puesto (INSERT ... ON CONFLICT DO NOTHING de filas ya existentes)
await as('postgres');
{
  const f1 = SQL[MIGS[1]]; const i0 = f1.indexOf('INSERT INTO public.documentos_legales'); const endMark = 'ON CONFLICT (tipo, version, idioma) DO NOTHING;'; const seed = f1.slice(i0, f1.indexOf(endMark, i0) + endMark.length);
  const e = await err(seed);
  ok(!e, 'reaplicar la semilla de 20261029 con el trigger de antelacion puesto (ON CONFLICT DO NOTHING no falla)', e && e.message);
  ok((await q("select count(*)::int n from public.documentos_legales where version='1.0' and idioma in ('es','en')"))[0].n === 8, 'la semilla no duplica filas (8)');
  // 20261029 COMPLETA no se puede reaplicar despues de 20261033: su CREATE OR REPLACE VIEW profiles_full no puede quitar las columnas consent_prefs*. Limitacion conocida (ver informe).
  const e29 = await applyMig(db, MIGS[1]);
  if (e29) out('  AVISO  reaplicar 20261029 completa DESPUES de 20261033 falla (conocido): ' + e29.message);
  else ok(true, 'reaplicar 20261029 completa despues de 20261033');
}

sec('A3. Publicar la version 2.0 de terminos_candidato (es) y avisos solo a los afectados');
// Estado: candidatos activos = cand (en), candB (es), candC (es, aceptó v1.0 pero NO la 2.0); inact inactivo; emp empleador; admin; mgr (es, professional por defecto)
await as('authenticated', U.admin);
const r1 = (await q(`select public.legal_publicar_version('terminos_candidato','2.0','es','Condiciones 2.0','Texto nuevo 2.0',$1, null) r`, [iso(20)]))[0].r;
// afectados es: candB, candC, mgr (professional activos con idioma es o sin texto en su idioma)  [cand es 'en': tiene texto en en -> espera a la version en]
ok(r1.tipo === 'terminos_candidato' && r1.version === '2.0' && r1.idioma === 'es', 'admin: publica 2.0 (es) con 20 dias', JSON.stringify(r1));
await as('postgres');
let box = await q(`select to_email, lang, priority, payload from public.email_outbox where kind='legal_version_notice' order by to_email`);
ok(box.map((x) => x.to_email).join() === 'candb@test.dev,candc@test.dev,mgr@test.dev' && r1.encolados === 3, 'solo los afectados: candidatos activos en espanol (no el de idioma en sin traduccion, ni el inactivo, ni el empleador ni el admin)', box.map((x) => x.to_email).join() + ' / ' + r1.encolados);
ok(box.every((x) => x.lang === 'es' && x.priority === 6 && x.payload.tipo === 'terminos_candidato' && x.payload.version === '2.0' && x.payload.titulo === 'Condiciones 2.0' && x.payload.dedupe_key === 'legal:terminos_candidato:2.0' && /^\d{4}-\d\d-\d\dT/.test(x.payload.vigente_desde)), 'cada correo: kind legal_version_notice, lang es, prioridad 6, payload con tipo/version/titulo/vigente_desde/dedupe_key', JSON.stringify(box[0]));
ok((await q("select documento_id from public.documentos_pendientes() limit 0")) !== null, 'sanity');
await as('authenticated', U.admin);
ok((await q(`select public.legal_encolar_aviso('terminos_candidato','2.0') n`))[0].n === 0, 'idempotente: repetir legal_encolar_aviso no duplica (0)');
await as('postgres');
ok((await outboxN('legal_version_notice')) === 3, 'tras repetir siguen 3 filas');
// segunda tanda: se publica la traduccion en y se avisa a la candidata en
await as('authenticated', U.admin);
const r2 = (await q(`select public.legal_publicar_version('terminos_candidato','2.0','en','Terms 2.0','New text 2.0',$1) r`, [iso(20)]))[0].r;
ok(r2.encolados === 1, 'publicar la traduccion en avisa solo a la candidata en (no repite a los demas)', JSON.stringify(r2));
await as('postgres');
box = await q(`select to_email, lang from public.email_outbox where kind='legal_version_notice' and lang='en'`);
ok(box.length === 1 && box[0].to_email === 'cand@test.dev', 'el correo en va a cand@test.dev con lang en');
const cas = (await q(`select casillas_obligatorias c, audiencia, requiere_aceptacion r, borrador b from public.documentos_legales where tipo='terminos_candidato' and version='2.0' and idioma='es'`))[0];
ok(cas.c.join() === 'acepto_condiciones_privacidad,datos_verdaderos' && cas.audiencia === 'candidato' && cas.r === true && cas.b === false, 'p_casillas NULL hereda las de la version anterior; audiencia candidato; no borrador', JSON.stringify(cas));

// Una version ya publicada no se puede "acortar": adelantar su fecha por UPDATE se rechaza
await as('authenticated', U.admin);
await expErr('admin: no puede ADELANTAR a < 15 dias la fecha de una version futura por UPDATE', /ANTELACION_INSUFICIENTE/, `update public.documentos_legales set vigente_desde = now()+interval '2 days' where tipo='terminos_candidato' and version='2.0' and idioma='es'`);
ok(!(await err(`update public.documentos_legales set titulo = 'Condiciones 2.0 (corregido)' where tipo='terminos_candidato' and version='2.0' and idioma='es'`)), 'admin: corregir el titulo de una version futura SI se puede');
ok(!(await err(`update public.documentos_legales set vigente_desde = now()+interval '25 days' where tipo='terminos_candidato' and version='2.0' and idioma='es'`)), 'admin: RETRASAR la fecha si se puede');
await as('postgres');
await run(`update public.documentos_legales set vigente_desde = now()+interval '20 days' where tipo='terminos_candidato' and version='2.0' and idioma='es'`);
// antes de que lleguen a la ventana de 15 dias, nadie ve aviso ni la fila
await as('authenticated', U.candB);
ok((await q('select count(*)::int n from public.legal_aviso_proximo()'))[0].n === 0, 'con 20 dias por delante todavia NO hay aviso en la app (la ventana es de 15 dias)');
ok((await q("select count(*)::int n from public.documentos_legales where version='2.0' and tipo='terminos_candidato'"))[0].n === 0, 'con 20 dias por delante authenticated tampoco lee la fila');
// "pasan" 6 dias: se mueven las fechas (como postgres y con el trigger de antelacion apartado: se simula el reloj, no un acortamiento)
await as('postgres');
await db.exec('alter table public.documentos_legales disable trigger trg_documentos_legales_antelacion');
await run(`update public.documentos_legales set vigente_desde = vigente_desde - interval '6 days' where version = '2.0'`);

// audiencia 'todos' y exclusion de quien ya aceptó: version 2.0 de privacidad (a +12 dias), candC ya la aceptó
await as('postgres');
await run(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,casillas_obligatorias,borrador,vigente_desde) values ('privacidad','2.0','es','Privacidad 2.0','x','todos',true,'{}',false,now()+interval '12 days')`);
await run(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,casillas_obligatorias,borrador,vigente_desde) values ('privacidad','2.0','en','Privacy 2.0','x','todos',true,'{}',false,now()+interval '12 days')`);
await db.exec('alter table public.documentos_legales enable trigger trg_documentos_legales_antelacion');
{ // aceptacion simulada de candC de la 2.0 (insert como postgres: el trigger de inmutabilidad solo frena UPDATE/DELETE)
  const d = (await q(`select id from public.documentos_legales where tipo='privacidad' and version='2.0' and idioma='es'`))[0].id;
  await run(`insert into public.aceptaciones(user_id,user_email,documento_id,tipo,version,contexto) values ($1,'candc@test.dev',$2,'privacidad','2.0','nueva_version')`, [U.candC, d]);
}
await as('service_role');
const nPriv = (await q(`select public.legal_encolar_aviso('privacidad','2.0') n`))[0].n;
await as('postgres');
box = await q(`select to_email, lang from public.email_outbox where kind='legal_version_notice' and payload->>'tipo'='privacidad' order by to_email`);
ok(nPriv === box.length && box.map((x) => x.to_email).join() === 'admin@test.dev,cand@test.dev,candb@test.dev,emp@acme.test,mgr@test.dev', 'privacidad (audiencia todos): candidatos y empleadores activos que NO la aceptaron (sin candC ni el inactivo)', box.map((x) => x.to_email).join());
ok(box.find((x) => x.to_email === 'cand@test.dev').lang === 'en', 'privacidad: la candidata en recibe el aviso en ingles');
ok((await outboxN('legal_version_notice')) === 3 + 1 + box.length, 'total de avisos = 3 + 1 + privacidad');

sec('A4. Empleador y urgencia (service_role)');
await as('service_role');
const r3 = (await q(`select public.legal_publicar_version('terminos_empleador','2.0','es','Empleadores 2.0','texto',$1, null, true) r`, [iso(10)]))[0].r;
ok(r3.version === '2.0' && r3.encolados === 1, 'service_role con p_urgente=true: publica con 10 dias y avisa solo al miembro de empresa', JSON.stringify(r3));
await as('postgres');
box = await q(`select to_email from public.email_outbox where kind='legal_version_notice' and payload->>'tipo'='terminos_empleador'`);
ok(box.length === 1 && box[0].to_email === 'emp@acme.test', 'terminos_empleador: el aviso va a emp@acme.test y no a ningun candidato');
ok((await q(`select current_setting('app.legal_urgente', true) v`))[0].v !== 'on', 'la marca de urgencia no queda puesta en la sesion');
await as('service_role');
await expErr('service_role: una segunda version < 15 dias SIN p_urgente se rechaza', /ANTELACION_INSUFICIENTE/, `select public.legal_publicar_version('terminos_empleador','3.0','es','E3','texto',$1)`, [iso(4)]);
await as('authenticated', U.admin);
await expErr('admin: sigue sin poder tras la urgencia de service_role (la marca no se filtra)', /ANTELACION_INSUFICIENTE/, `select public.legal_publicar_version('terminos_empleador','3.0','es','E3','texto',$1)`, [iso(4)]);
ok((await q(`select public.legal_publicar_version('cookies','3.0','es','Cookies 3','x',$1) r`, [iso(1)]))[0].r.encolados === 0, 'cookies: se publica sin antelacion y no encola avisos (informativo)');

sec('A5. legal_aviso_proximo() y lectura de versiones proximas');
await as('authenticated', U.candB);
let av = await q('select * from public.legal_aviso_proximo()');
const tiposB = av.map((x) => x.tipo + ':' + x.version).join();
ok(tiposB === 'privacidad:2.0,terminos_candidato:2.0' && av.every((x) => x.idioma === 'es'), 'candB: ve privacidad 2.0 (12 dias) y terminos_candidato 2.0 (14 dias), en es', tiposB);
const dB = Object.fromEntries(av.map((x) => [x.tipo, x.dias_restantes]));
ok(dB.terminos_candidato === 14 && dB.privacidad === 12, 'dias_restantes correcto (14 y 12)', JSON.stringify(dB));
ok(Object.keys(av[0]).join() === 'tipo,version,idioma,titulo,vigente_desde,dias_restantes', 'columnas: tipo, version, idioma, titulo, vigente_desde, dias_restantes', Object.keys(av[0]).join());
await as('authenticated', U.candC);
av = await q('select tipo, version from public.legal_aviso_proximo()');
ok(av.map((x) => x.tipo).join() === 'terminos_candidato', 'candC: ya aceptó privacidad 2.0 -> solo ve terminos_candidato', JSON.stringify(av));
await as('authenticated', U.cand);
av = await q('select tipo, idioma from public.legal_aviso_proximo() order by tipo');
ok(av.map((x) => x.tipo + '/' + x.idioma).join() === 'privacidad/en,terminos_candidato/en', 'cand (en): sus avisos salen en ingles', JSON.stringify(av));
await as('authenticated', U.emp);
av = await q('select tipo, dias_restantes from public.legal_aviso_proximo() order by tipo');
ok(av.map((x) => x.tipo).join() === 'privacidad,terminos_empleador', 'empleador: privacidad y terminos_empleador (no los de candidato)', JSON.stringify(av));
await as('authenticated', U.admin);
av = await q('select tipo from public.legal_aviso_proximo()');
ok(av.map((x) => x.tipo).join() === 'privacidad', 'admin: solo privacidad (audiencia todos)', JSON.stringify(av));
// RLS: authenticated lee futuras <= 15 dias, no borrador; no las de 20 dias ni los borradores
await as('postgres');
await db.exec('alter table public.documentos_legales disable trigger trg_documentos_legales_antelacion');
await run(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,borrador,vigente_desde) values ('privacidad','2.5','es','Borrador','x','todos',true,true,now()+interval '10 days')`);
await as('authenticated', U.candB);
const vis = [...new Set((await q(`select tipo || ':' || version v from public.documentos_legales where vigente_desde > now() order by 1`)).map((x) => x.v))];
ok(vis.join() === 'cookies:3.0,privacidad:1.0,privacidad:2.0,terminos_candidato:2.0,terminos_empleador:2.0', 'authenticated lee las futuras <= 15 dias y no borrador (NO el borrador privacidad:2.5)', vis.join());
await as('postgres');
await run(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,borrador,vigente_desde) values ('terminos_candidato','9.0','es','Lejana','x','candidato',true,false,now()+interval '40 days')`);
await as('authenticated', U.candB);
ok((await q(`select count(*)::int n from public.documentos_legales where version='9.0'`))[0].n === 0, 'authenticated NO lee una version a 40 dias (fuera de la ventana de 15)');
await as('postgres');
await run(`delete from public.documentos_legales where version in ('9.0','2.5')`);
await db.exec('alter table public.documentos_legales enable trigger trg_documentos_legales_antelacion');
await as('anon');
ok((await q(`select count(*)::int n from public.documentos_legales where vigente_desde > now()`))[0].n === 0, 'anon no ve ninguna version futura');

sec('A6. Lote maximo de 5000 por llamada');
await as('postgres');
await run(`insert into auth.users(id,email,raw_user_meta_data) select ('10000000-0000-0000-0000-' || lpad(g::text,12,'0'))::uuid, 'masa' || g || '@test.dev', '{"registro_idioma":"es"}'::jsonb from generate_series(1,5100) g`);
await run(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,audiencia,requiere_aceptacion,casillas_obligatorias,borrador,vigente_desde) values ('terminos_candidato','4.0','es','Masivo','x','candidato',true,'{}',false,now()+interval '30 days')`);
await as('service_role');
const l1 = (await q(`select public.legal_encolar_aviso('terminos_candidato','4.0') n`))[0].n;
const l2 = (await q(`select public.legal_encolar_aviso('terminos_candidato','4.0') n`))[0].n;
const l3 = (await q(`select public.legal_encolar_aviso('terminos_candidato','4.0') n`))[0].n;
ok(l1 === 5000 && l2 > 0 && l2 < 5000 && l3 === 0, 'primera llamada 5000, segunda el resto, tercera 0 (idempotente por lotes)', `${l1}/${l2}/${l3}`);
await as('postgres');
await run(`delete from public.email_outbox where payload->>'dedupe_key' = 'legal:terminos_candidato:4.0'`);
await run(`delete from public.documentos_legales where version='4.0'`);
await run(`delete from auth.users where email like 'masa%@test.dev'`);

// ================================================================== B. CASILLAS OPCIONALES
sec('B. consent_prefs y save_consent_prefs');
await as('authenticated', U.cand);
let sv = (await q(`select public.save_consent_prefs('{"alertas_novedades": true, "perfil_publico": false}') r`))[0].r;
ok(sv.alertas_novedades === true && sv.perfil_publico === false, 'save_consent_prefs guarda y devuelve el objeto', JSON.stringify(sv));
sv = (await q(`select public.save_consent_prefs('{"alertas_novedades": false, "aparecer_google": true}') r`))[0].r;
ok(JSON.stringify(sv) === JSON.stringify({ alertas_novedades: false, aparecer_google: true, perfil_publico: false }) || (sv.alertas_novedades === false && sv.aparecer_google === true && sv.perfil_publico === false && Object.keys(sv).length === 3), 'fusiona con lo anterior (3 claves)', JSON.stringify(sv));
await expErr('clave no permitida (is_admin)', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"is_admin": true}')`);
await expErr('clave no permitida (profile_hidden): no se puede tocar por aqui', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"profile_hidden": true}')`);
await expErr('clave valida mezclada con una no permitida: se rechaza TODO', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"perfil_publico": true, "role": "admin"}')`);
await expErr('valor que no es booleano (cadena)', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"perfil_publico": "si"}')`);
await expErr('valor que no es booleano (numero)', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"perfil_publico": 1}')`);
await expErr('valor null', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{"perfil_publico": null}')`);
await expErr('no es un objeto (array)', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('[true]')`);
await expErr('objeto vacio', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs('{}')`);
await expErr('NULL', /CONSENT_PREFS_INVALID/, `select public.save_consent_prefs(null)`);
await as('postgres');
const pr = (await q(`select consent_prefs, consent_prefs_updated_at is not null f, profile_hidden, search_blocked from public.profiles where id=$1`, [U.cand]))[0];
ok(pr.f && pr.consent_prefs.aparecer_google === true && pr.profile_hidden === false && pr.search_blocked === false, 'registra la fecha y NO cambia profile_hidden ni search_blocked', JSON.stringify(pr));
ok(!('is_admin' in pr.consent_prefs) && !('profile_hidden' in pr.consent_prefs), 'los intentos rechazados no dejaron nada');
// lectura
await as('authenticated', U.cand);
ok((await q(`select consent_prefs->>'aparecer_google' g from public.profiles_full where id=$1`, [U.cand]))[0].g === 'true', 'el dueno lee sus casillas por profiles_full');
await expDenied('el dueno NO lee consent_prefs directo de profiles (columna privada)', `select consent_prefs from public.profiles where id=$1`, [U.cand]);
await as('authenticated', U.candB);
ok((await q(`select count(*)::int n from public.profiles_full where id=$1`, [U.cand]))[0].n === 0, 'otro usuario: profiles_full no le devuelve la fila de cand');
await expDenied('otro usuario: no lee consent_prefs de profiles', `select consent_prefs from public.profiles`);
await expDenied('otro usuario: no lee consent_prefs_updated_at de profiles', `select consent_prefs_updated_at from public.profiles`);
await expDenied('otro usuario: no sondea con WHERE sobre consent_prefs', `select id from public.profiles where consent_prefs ? 'aparecer_google'`);
await as('anon');
await expDenied('anon: no lee consent_prefs', `select consent_prefs from public.profiles`);
await expDenied('anon: no lee profiles_full', `select consent_prefs from public.profiles_full`);
await as('authenticated', U.mgr);
const m = await q(`select id, consent_prefs, consent_prefs_updated_at from public.profiles_full where id=$1`, [U.cand]);
ok(m.length === 1 && m[0].consent_prefs === null && m[0].consent_prefs_updated_at === null, 'el gestor ve la fila (como antes) pero consent_prefs sale NULL', JSON.stringify(m));
await as('authenticated', U.admin);
ok((await q(`select consent_prefs->>'aparecer_google' g from public.profiles_full where id=$1`, [U.cand]))[0].g === 'true', 'admin lee consent_prefs por profiles_full');
// escritura directa
await as('authenticated', U.candB);
await expErr('un usuario no escribe consent_prefs con UPDATE directo (PROTECTED_FIELD)', /PROTECTED_FIELD/, `update public.profiles set consent_prefs = '{"perfil_publico": true, "x": 1}' where id=$1`, [U.candB]);
await expErr('un usuario no toca consent_prefs_updated_at', /PROTECTED_FIELD/, `update public.profiles set consent_prefs_updated_at = now() where id=$1`, [U.candB]);
{ const r = await db.query(`update public.profiles set headline='sigue pudiendo editar su perfil' where id=$1`, [U.candB]); ok(r.affectedRows === 1, 'el resto de su perfil se sigue pudiendo editar'); }
await as('authenticated', U.cand);
{ const e = await err(`update public.profiles set consent_prefs='{}' where id=$1`, [U.cand]); ok(!!e, 'ni siquiera para borrar las suyas (la RPC es el camino)', e && e.message); }
await as('service_role');
ok(!(await err(`update public.profiles set consent_prefs='{"perfil_publico": true}' where id=$1`, [U.candB])), 'service_role sí puede escribirla (Edge Functions)');
await as('authenticated', U.candB);
ok((await q(`select consent_prefs r from public.profiles_full where id=$1`, [U.candB]))[0].r.perfil_publico === true, 'sanity: candB lee lo que escribio service_role');

// ================================================================== C. PROGRAMACION
sec('C1. cron.job tras 20261034');
await as('postgres');
ok((await q("select count(*)::int n from cron.job where jobname = 'expire-job-postings'"))[0].n === 0, "el trabajo directo 'expire-job-postings' que creaba 20261030 ya no esta (lo sustituye bolsa-caducidad)");
let jobs = await q(`select jobname, schedule, command, active from cron.job order by jobname`);
const exp = {
  'bolsa-alertas': ['0 7 * * *', 'send-outbox', true],
  'bolsa-caducidad': ['10 3 * * *', 'expire-job-postings', false],
  'bolsa-correos': ['*/5 * * * *', 'send-outbox', false],
  'bolsa-moderacion': ['*/5 * * * *', 'moderate-job-posting', false],
};
ok(jobs.length === 4 && jobs.map((j) => j.jobname).join() === Object.keys(exp).join(), '4 trabajos programados con su nombre', jobs.map((j) => j.jobname).join());
for (const j of jobs) {
  const [sch, fn, alerts] = exp[j.jobname];
  ok(j.schedule === sch && j.active && j.command.includes(`public.bolsa_llamar_funcion('${fn}'`) && (alerts ? j.command.includes('{"alerts":true}') : !j.command.includes('alerts')), `${j.jobname}: ${sch} -> ${fn}${alerts ? ' {"alerts":true}' : ''}`, j.schedule + ' | ' + j.command);
}
ok(jobs.every((j) => !/[0-9a-f]{32}|secret|eyJ/i.test(j.command)), 'ningun comando programado contiene un secreto');
{ const e = await applyMig(db, MIGS[6]); ok(!e, 'reaplicar 20261034', e && e.message); }
ok((await q('select count(*)::int n from cron.job'))[0].n === 4, 'reaplicar no duplica los trabajos (siguen 4)');

sec('C2. bolsa_llamar_funcion: permisos');
const acl = (await q(`select has_function_privilege('anon', p.oid, 'EXECUTE') a, has_function_privilege('authenticated', p.oid, 'EXECUTE') u, has_function_privilege('service_role', p.oid, 'EXECUTE') s,
  exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x where x.grantee = 0 and x.privilege_type='EXECUTE') pub, p.prosecdef sd, p.proconfig::text cfg
  from pg_proc p where p.proname='bolsa_llamar_funcion'`))[0];
ok(!acl.a && !acl.u && !acl.pub && acl.sd && /search_path/.test(acl.cfg), 'ni anon ni authenticated ni PUBLIC ejecutan; es SECURITY DEFINER con search_path', JSON.stringify(acl));
await as('anon');
await expDenied('anon: no puede llamarla', `select public.bolsa_llamar_funcion('send-outbox')`);
await as('authenticated', U.admin);
await expDenied('authenticated (ni siquiera admin): no puede llamarla', `select public.bolsa_llamar_funcion('send-outbox')`);
await as('service_role');
await expDenied('service_role: tampoco (solo el cron / quien administra la base)', `select public.bolsa_llamar_funcion('send-outbox')`);
await as('authenticated', U.candB);
await expDenied('authenticated: tampoco lee vault.decrypted_secrets', `select * from vault.decrypted_secrets`);

sec('C3. Sin secreto no llama; con secreto, la peticion correcta');
await as('postgres');
const calls = async () => (await q('select count(*)::int n from net.calls'))[0].n;
await expErr('sin secreto en el vault: falla con BOLSA_CRON_SECRET_AUSENTE', /BOLSA_CRON_SECRET_AUSENTE/, `select public.bolsa_llamar_funcion('send-outbox')`);
ok((await calls()) === 0, 'sin secreto NO se llama a net.http_post');
for (const j of jobs) { const e = await err(j.command); ok(!!e && /BOLSA_CRON_SECRET_AUSENTE/.test(e.message), `${j.jobname}: sin secreto el trabajo falla visible y no llama`, e && e.message); }
ok((await calls()) === 0, 'ningun trabajo llamo sin secreto');
await run(`insert into vault.secrets(name, secret) values ('bolsa_cron_secret', 'corto')`);
await expErr('secreto demasiado corto (< 16): tampoco llama', /BOLSA_CRON_SECRET_AUSENTE/, `select public.bolsa_llamar_funcion('send-outbox')`);
ok((await calls()) === 0, 'secreto corto: no se llama');
await run(`update vault.secrets set secret = 'secreto-de-prueba-solo-test-0123456789' where name='bolsa_cron_secret'`);
const TEST_SECRET = 'secreto-de-prueba-solo-test-0123456789';
await expErr('nombre de funcion no permitido', /BOLSA_FUNCION_NO_PERMITIDA/, `select public.bolsa_llamar_funcion('signup')`);
await expErr('nombre con ruta (../) no permitido', /BOLSA_FUNCION_NO_PERMITIDA/, `select public.bolsa_llamar_funcion('send-outbox/../signup')`);
ok((await calls()) === 0, 'nombres no permitidos: no se llama');
for (const j of jobs) await run(j.command);
const cl = await q('select url, body, headers from net.calls order by id');
ok(cl.length === 4, 'con secreto, cada uno de los 4 trabajos hace exactamente 1 llamada', String(cl.length));
const byUrl = cl.map((c) => c.url.replace('https://djehzlzombqrzzuchcef.supabase.co/functions/v1/', '')).sort().join();
ok(byUrl === 'expire-job-postings,moderate-job-posting,send-outbox,send-outbox', 'URLs: https://djehzlzombqrzzuchcef.supabase.co/functions/v1/<funcion>', byUrl);
ok(cl.every((c) => c.url.startsWith('https://djehzlzombqrzzuchcef.supabase.co/functions/v1/') && c.headers['x-cron-secret'] === TEST_SECRET && c.headers['Content-Type'] === 'application/json'), 'cabecera x-cron-secret con el valor del vault y Content-Type json');
ok(cl.filter((c) => c.body && c.body.alerts === true).length === 1 && cl.filter((c) => c.body && c.body.alerts === true)[0].url.endsWith('/send-outbox'), 'solo la llamada de alertas lleva {"alerts":true}, y va a send-outbox', JSON.stringify(cl.map((c) => c.body)));
const mig34 = SQL[MIGS[6]];
ok(!mig34.includes(TEST_SECRET) && !/eyJ[A-Za-z0-9_-]{10,}|sb_secret|service_role_key/i.test(mig34), 'la migracion 20261034 no contiene ningun secreto');
ok(!/[0-9a-f]{40,}/.test(mig34), 'la migracion 20261034 no contiene cadenas hexadecimales largas');

out(`\nRESULTADO: ${pass} OK, ${fail} FALLO`);
process.exit(fail ? 1 : 0);
