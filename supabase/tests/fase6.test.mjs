// Prueba de 20261035_cierre_final.sql (S-1..S-9) SOBRE EL ENCADENADO COMPLETO 28 -> 35,
// en PGlite con la base REAL de produccion (stub-base.sql, prod-funcs.sql, stub-triggers.sql: leidos con prodsql.mjs, solo lectura).
// pg_cron, pg_net y vault NO existen en PGlite: se crean stubs minimos (cron.schedule/unschedule/job, net.http_post, vault.decrypted_secrets).
// Uso: node fase6.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const ROOT = HERE;
const MIGDIR = ROOT + '../migrations/';
const PG = ROOT;
const MIGS = ['20261028_cerrar_email_queue', '20261029_legal_aceptaciones_idioma', '20261030_ofertas_fase2', '20261031_candidaturas_fase3', '20261032_correcciones_auditoria', '20261033_pendientes_bolsa', '20261034_programacion_cron', '20261035_cierre_final'];
const SQL = Object.fromEntries(MIGS.map((n) => [n, fs.readFileSync(MIGDIR + n + '.sql', 'utf8')]));

let pass = 0, fail = 0;
const out = (s) => console.log(s);
const ok = (c, m, extra) => { if (c) { pass++; out('  OK     ' + m); } else { fail++; out('  FALLO  ' + m + (extra !== undefined ? '  => ' + String(extra).slice(0, 400) : '')); } };
const sec = (t) => out('\n== ' + t + ' ==');
process.on('uncaughtException', (e) => { out('ERROR NO CAPTURADO: ' + String(e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });
process.on('unhandledRejection', (e) => { out('ERROR NO CAPTURADO: ' + String(e && e.message).slice(0, 500)); out(`PARCIAL: ${pass} OK, ${fail} FALLO`); process.exit(2); });

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
sec('0. Cadena 28 -> 35 (primera y segunda aplicacion)');
await as('postgres');
for (const n of MIGS) { const e = await applyMig(db, n); ok(!e, `primera aplicacion de ${n}`, e && (e.message + (e.where ? ' | ' + String(e.where).split('\n')[0] : ''))); if (e) { out(`RESULTADO: ${pass} OK, ${fail} FALLO`); process.exit(1); } }
for (const n of MIGS.slice(5)) { const e = await applyMig(db, n); ok(!e, `segunda aplicacion de ${n}`, e && e.message); }

// ------------------------------------------------------------------ datos
const U = {
  admin: '00000000-0000-0000-0000-0000000000ad',
  cand: '00000000-0000-0000-0000-0000000000c1',
  candB: '00000000-0000-0000-0000-0000000000c2',
  candC: '00000000-0000-0000-0000-0000000000c3',
  candD: '00000000-0000-0000-0000-0000000000c4',
  emp: '00000000-0000-0000-0000-00000000a001',
  emp2: '00000000-0000-0000-0000-00000000b001',
};
const CO = 'c0000000-0000-0000-0000-00000000001e';
const CO2 = 'c0000000-0000-0000-0000-00000000002e';
const DAY = 86400000;
const iso = (days) => new Date(Date.now() + days * DAY).toISOString();
const LONG = 'Buscamos una persona para coordinar proyectos de software con equipos multidisciplinares y clientes internacionales, con foco en la calidad y la mejora continua. '.repeat(4);
const CAS = { acepto_condiciones_privacidad: true, datos_verdaderos: true, poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true };
const SECRET = 'secreto-de-prueba-0123456789abcdef';
const mkUser = (id, email, meta) => db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3::jsonb)', [id, email, JSON.stringify(meta)]);
await as('postgres');
await mkUser(U.admin, 'admin@test.dev', { full_name: 'Admin', registro_idioma: 'es' });
await mkUser(U.cand, 'cand@test.dev', { full_name: 'Ana Candidata', registro_idioma: 'es' });
await mkUser(U.candB, 'candb@test.dev', { full_name: 'Beto Candidato', registro_idioma: 'es' });
await mkUser(U.candC, 'candc@test.dev', { full_name: 'candc@test.dev', registro_idioma: 'es' });
await mkUser(U.candD, 'candd@test.dev', { full_name: 'Dani Candidato', registro_idioma: 'es' });
await mkUser(U.emp, 'emp@acme.test', { full_name: 'Marta Owner', registro_idioma: 'es' });
await mkUser(U.emp2, 'emp2@beta.test', { full_name: 'Bea Owner', registro_idioma: 'es' });
await as('service_role');
await run("update public.profiles set role='admin' where id=$1", [U.admin]);
await run("update public.profiles set role='employer' where id = any($1::uuid[])", [[U.emp, U.emp2]]);
await as('postgres');
await run("update public.profiles set country_code='ES' where id=$1", [U.cand]);
await run("insert into public.skills(profile_id, name) values ($1,'React'),($1,'SQL'),($1,'TypeScript')", [U.cand]);
await run("insert into public.companies(id, company_name, legal_name, tax_id, company_email, company_size, status, created_by, country_code, idioma) values ($1,'Acme','Acme SL','A1','rrhh@acme.test','11-50','APPROVED',$2,'ES','es')", [CO, U.emp]);
await run("insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER')", [CO, U.emp]);
await run("insert into public.companies(id, company_name, legal_name, tax_id, company_email, company_size, status, created_by, country_code, idioma) values ($1,'Beta','Beta SL','B2','rrhh@beta.test','11-50','APPROVED',$2,'ES','es')", [CO2, U.emp2]);
await run("insert into public.company_users(company_id, user_id, role) values ($1,$2,'OWNER')", [CO2, U.emp2]);

const accept = async (only) => {
  const p = await q('select documento_id, tipo from public.documentos_pendientes()');
  const ids = p.filter((x) => !only || only.includes(x.tipo)).map((x) => x.documento_id);
  if (ids.length) await run('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [ids, JSON.stringify(CAS), 'inscripcion']);
  return ids.length;
};
const jobIns = `insert into public.job_postings(company_id, created_by, title, description, location_city, location_country, work_mode, employment_type, experience_level, country_code, category, contract_types, schedule, vacancies, required_skills, optional_skills, salary_min, salary_max, salary_currency, salary_period, salary_mode, show_salary, notify_emails, notify_frequency, cover_letter_mode, languages, education_min, experience_years)
 values ($1,$2,$3,$4,'Madrid','ES','ONSITE','FULL_TIME','MID','ES',$7,ARRAY['INDEFINITE'],'FULL_TIME',2,ARRAY['React','SQL'],ARRAY['TypeScript'],30000,40000,'EUR','YEARLY','RANGE',true,$5::text[],$6,'OPTIONAL','[{"language":"en","level":"B2"}]'::jsonb,'Grado',2) returning id`;
const MAILS = ['rrhh@acme.test', 'jefe@acme.test'];
const mkJob = async (title, freq = 'EACH', cat = 'Tecnología') => (await q(jobIns, [CO, U.emp, title, LONG + ' ' + title, MAILS, freq, cat]))[0].id;
const netCalls = async () => { await as('postgres'); return (await q('select count(*)::int n from net.calls'))[0].n; };
const outboxRows = async (kind) => { await as('postgres'); return q('select * from public.email_outbox where kind=$1 order by id', [kind]); };
const setSecret = async () => { await as('postgres'); await run("delete from vault.secrets where name='bolsa_cron_secret'"); await run("insert into vault.secrets(name, secret) values ('bolsa_cron_secret', $1)", [SECRET]); };

// ================================================================== S-7 (parte 1) y S-1 (sin secreto)
sec('S-7a. condiciones_publicacion: sembrada, pedida en la puerta del empleador, y NO exigida si no hay versión vigente');
await as('postgres');
{
  const d = await q("select idioma, audiencia, requiere_aceptacion, borrador, casillas_obligatorias from public.documentos_legales where tipo='condiciones_publicacion' order by idioma");
  ok(d.length === 2 && d.map((x) => x.idioma).join() === 'en,es' && d.every((x) => x.audiencia === 'empleador' && x.requiere_aceptacion && x.borrador), 'semilla condiciones_publicacion v1.0 es/en: audiencia empleador, exige aceptación, borrador', JSON.stringify(d));
  const e = await err("insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('tipo_raro','1.0','es','t','x',now())");
  ok(!!e && /check/i.test(String(e.message)), 'el CHECK de tipo rechaza un tipo desconocido', e && e.message);
}
await as('authenticated', U.emp);
{
  const p = (await q('select tipo from public.documentos_pendientes() order by tipo')).map((x) => x.tipo).join();
  ok(p === 'condiciones_publicacion,privacidad,terminos_empleador', 'empleador: documentos_pendientes incluye condiciones_publicacion', p);
  await accept(['terminos_empleador', 'privacidad']);
}
const J_A = await mkJob('Analista de datos', 'EACH');
ok(!!J_A, 'empleador crea la oferta J_A (notify_frequency EACH)');
// Quitamos las condiciones de publicación (con el trigger de inmutabilidad desactivado, solo en este banco de pruebas)
await as('postgres');
await db.exec("alter table public.documentos_legales disable trigger trg_documentos_legales_proteger; delete from public.documentos_legales where tipo='condiciones_publicacion'; alter table public.documentos_legales enable trigger trg_documentos_legales_proteger;");
ok((await q("select count(*)::int n from public.documentos_legales where tipo='condiciones_publicacion'"))[0].n === 0, '(preparación) sin documento condiciones_publicacion vigente');
await as('authenticated', U.emp);
ok(!(await q('select tipo from public.documentos_pendientes()')).some((x) => x.tipo === 'condiciones_publicacion'), 'sin documento, la puerta no lo pide');
{
  const n0 = await netCalls();
  await as('authenticated', U.emp);
  const r = (await q('select public.submit_job_for_review($1) r', [J_A]))[0].r;
  ok(r.status === 'AI_REVIEW', 'S-7: sin documento condiciones_publicacion vigente, el envío a revisión NO lo exige', JSON.stringify(r));
  const n1 = await netCalls();
  ok(n1 === n0, 'S-1: sin secreto en el vault el envío funciona y no se llama a nadie (la red de seguridad es el cron)', `${n0} -> ${n1}`);
}
// Se vuelve a aplicar la 35: resiembra la v1.0 (ON CONFLICT DO NOTHING) y deja el trabajo intacto
{
  await as('postgres');
  const e = await applyMig(db, MIGS[7]);
  ok(!e, 'reaplicar 20261035 tras borrar la semilla (la resiembra)', e && e.message);
  await as('postgres');
  ok((await q("select count(*)::int n from public.documentos_legales where tipo='condiciones_publicacion'"))[0].n === 2, 'la reaplicación vuelve a sembrar condiciones_publicacion es/en (2 filas, sin duplicar)');
  const e2 = await applyMig(db, MIGS[7]);
  await as('postgres');
  ok(!e2 && (await q("select count(*)::int n from public.documentos_legales where tipo='condiciones_publicacion'"))[0].n === 2, 'y una tercera aplicación no duplica nada', e2 && e2.message);
}
await setSecret();

sec('S-7b. Con documento vigente: _job_submit EXIGE aceptar condiciones_publicacion');
await as('authenticated', U.admin);
await run(`select public.moderar_oferta($1,'PUBLISHED')`, [J_A]);
await as('authenticated', U.emp);
const J_B = await mkJob('Desarrollador Full Stack', 'DAILY');
const QS = {};
QS.q1 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index) values ($1,'¿Por qué quieres este puesto?','TEXTAREA',true,1) returning id`, [J_B]))[0].id;
QS.q2 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index, is_knockout, expected_answer) values ($1,'¿Tienes permiso de trabajo?','YES_NO',true,2,true,'YES') returning id`, [J_B]))[0].id;
QS.q3 = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index) values ($1,'Comentario opcional','TEXT',false,3) returning id`, [J_B]))[0].id;
await expErr('empleador sin aceptar condiciones_publicacion: submit rechazado (ACCEPTANCE_REQUIRED)', /ACCEPTANCE_REQUIRED.*publicaci/i, 'select public.submit_job_for_review($1)', [J_B]);
await as('authenticated', U.emp2);
await accept(); // emp2 acepta todo (otra empresa: no afecta a emp)
await as('authenticated', U.emp);
const nBefore = await netCalls();
await as('authenticated', U.emp);
await accept(['condiciones_publicacion']);
{
  const r = (await q('select public.submit_job_for_review($1) r', [J_B]))[0].r;
  ok(r.status === 'AI_REVIEW', 'tras aceptar condiciones_publicacion el envío a revisión funciona', JSON.stringify(r));
}

sec('S-1. Moderación inmediata al pasar a AI_REVIEW');
{
  await as('postgres');
  const calls = await q('select url, body, headers from net.calls order by id desc');
  ok(calls.length === nBefore + 1, 'una llamada a pg_net al enviar la oferta', `${calls.length} vs ${nBefore}`);
  const c = calls[0];
  ok(/\/functions\/v1\/moderate-job-posting$/.test(c.url) && c.body.job_id === J_B, 'llama a moderate-job-posting con {"job_id": ...}', JSON.stringify(c.body) + ' ' + c.url);
  ok(c.headers['x-cron-secret'] === SECRET, 'con la cabecera x-cron-secret del vault');
  await as('authenticated', U.admin);
  await run(`select public.moderar_oferta($1,'PUBLISHED')`, [J_B]);
  ok((await netCalls()) === nBefore + 1, 'pasar a PUBLISHED no vuelve a llamar (solo AI_REVIEW)');
}
{
  await as('postgres');
  const n0 = await netCalls();
  const id = (await q(jobIns, [CO, U.emp, 'Oferta de prueba de estados', LONG + ' directa', MAILS, 'EACH', 'Tecnología']))[0].id;
  await run("update public.job_postings set status='MANUAL_REVIEW' where id=$1", [id]);
  ok((await netCalls()) === n0, 'pasar a MANUAL_REVIEW no llama');
  await run("update public.job_postings set status='AI_REVIEW' where id=$1", [id]);
  ok((await netCalls()) === n0 + 1, 'cualquier camino a AI_REVIEW (no solo el RPC) llama');
  await run("update public.job_postings set title=title || ' ' where id=$1", [id]);
  ok((await netCalls()) === n0 + 1, 'un UPDATE que no cambia el estado no vuelve a llamar');
  const idIns = (await q(`insert into public.job_postings(company_id, created_by, title, description, location_city, location_country, work_mode, employment_type, experience_level, country_code, category, contract_types, schedule, vacancies, status)
    values ($1,$2,'Oferta insertada en revision',$3,'Madrid','ES','ONSITE','FULL_TIME','MID','ES','Tecnología',ARRAY['INDEFINITE'],'FULL_TIME',1,'AI_REVIEW') returning id`, [CO, U.emp, LONG]))[0].id;
  ok((await netCalls()) === n0 + 2, 'un INSERT que nace en AI_REVIEW también llama');
  // falta el secreto: no rompe
  await run("update public.job_postings set status='MANUAL_REVIEW' where id=$1", [id]);
  await run("delete from vault.secrets where name='bolsa_cron_secret'");
  const e = await err("update public.job_postings set status='AI_REVIEW' where id=$1", [id]);
  ok(!e, 'sin el secreto del vault el cambio a AI_REVIEW NO falla', e && e.message);
  await as('postgres');
  ok((await q('select status from public.job_postings where id=$1', [id]))[0].status === 'AI_REVIEW' && (await netCalls()) === n0 + 2, 'y la oferta queda en AI_REVIEW sin llamada');
  await setSecret();
  await run('delete from public.job_postings where id = any($1::uuid[])', [[id, idIns]]);
}
await as('authenticated', U.emp);
await expDenied('un usuario no puede llamar a bolsa_llamar_funcion', `select public.bolsa_llamar_funcion('moderate-job-posting')`);
await as('anon');
await expDenied('anon tampoco', `select public.bolsa_llamar_funcion('moderate-job-posting')`);

// ================================================================== S-3
sec('S-3. country_code en el payload de los correos de oferta');
{
  const pub = await outboxRows('job_published');
  ok(pub.length >= 2 && pub.every((r) => r.payload.country_code === 'es'), 'job_published lleva country_code "es" (minúsculas)', JSON.stringify(pub.map((r) => r.payload.country_code)));
  const man = await outboxRows('job_manual_review');
  ok(man.every((r) => r.payload.country_code === 'es'), 'job_manual_review también', JSON.stringify(man.map((r) => r.payload.country_code)));
  await as('postgres');
  await run(`insert into public.email_outbox(kind,to_email,payload) values ('x_job','a@b.test', jsonb_build_object('job_id',$1::text,'country_code','MX'))`, [J_A]);
  await run(`insert into public.email_outbox(kind,to_email,payload) values ('x_job2','a@b.test', jsonb_build_object('job_posting_id',$1::text))`, [J_A]);
  await run(`insert into public.email_outbox(kind,to_email,payload) values ('x_sin','a@b.test', jsonb_build_object('foo','bar'))`);
  await run(`insert into public.email_outbox(kind,to_email,payload) values ('x_mal','a@b.test', jsonb_build_object('job_id','no-es-un-uuid'))`);
  ok((await outboxRows('x_job'))[0].payload.country_code === 'mx', 'un country_code que ya viene se respeta y se pasa a minúsculas');
  ok((await outboxRows('x_job2'))[0].payload.country_code === 'es', 'con job_posting_id también se resuelve');
  ok(!('country_code' in (await outboxRows('x_sin'))[0].payload), 'un correo sin oferta no recibe country_code');
  ok(!('country_code' in (await outboxRows('x_mal'))[0].payload), 'un job_id que no es uuid no rompe el encolado');
}

// ================================================================== S-4
sec('S-4. Candidaturas: aviso individual solo si la frecuencia es EACH; resumen diario para DAILY');
await as('authenticated', U.cand);
await accept();
const app = (jobId, o = {}) => q('select public.apply_to_job($1::uuid, null, $2, $3::jsonb, true, $4) r', [jobId, null, JSON.stringify(o.answers ?? {}), 'v1.0']);
const rA1 = (await app(J_A))[0].r;
const rB1 = (await app(J_B, { answers: { [QS.q1]: 'Me encanta', [QS.q2]: 'YES' } }))[0].r;
await as('authenticated', U.candB);
await accept();
const rA2 = (await app(J_A))[0].r;
const rB2 = (await app(J_B, { answers: { [QS.q1]: 'Quiero', [QS.q2]: 'YES' } }))[0].r;
ok(rA1.success && rB1.success && rA2.success && rB2.success, 'dos candidatos se inscriben en la oferta EACH y en la DAILY');
{
  const ind = await outboxRows('application_received_company');
  const forA = ind.filter((r) => r.payload.job_posting_id === J_A), forB = ind.filter((r) => r.payload.job_posting_id === J_B);
  ok(forA.length === 4, 'EACH: aviso individual a cada destinatario por candidatura (2 destinatarios x 2 candidaturas)', forA.length);
  ok(forB.length === 0, 'DAILY: NO se encola aviso individual (lo recoge el resumen)', forB.length);
  ok(forA.every((r) => r.payload.country_code === 'es'), 'y llevan country_code');
}
await as('postgres');
// Tramo del resumen: el último 08:00 UTC ya pasado y las 24 h anteriores
const win = (await q(`select (case when (date_trunc('day', now() at time zone 'utc') + interval '8 hours') > (now() at time zone 'utc')
     then date_trunc('day', now() at time zone 'utc') - interval '16 hours' else date_trunc('day', now() at time zone 'utc') + interval '8 hours' end) at time zone 'utc' as v_end`))[0].v_end;
const winEnd = new Date(win).getTime();
const inWin = new Date(winEnd - 3 * 3600 * 1000).toISOString();
const outWin = new Date(winEnd + 1000).toISOString();
await run('update public.job_applications set created_at=$1 where job_posting_id=any($2::uuid[]) and profile_id=any($3::uuid[])', [inWin, [J_A, J_B], [U.cand, U.candB]]);
// una descartada automáticamente, en el tramo: no cuenta
await run(`insert into public.job_applications(job_posting_id, profile_id, company_id, status, descartada_auto, created_at) values ($1,$2,$3,'NOT_QUALIFIED',true,$4)`, [J_B, U.candC, CO, inWin]);
// una de la EACH, también en el tramo (no entra en ningún resumen)
await run(`insert into public.job_applications(job_posting_id, profile_id, company_id, status, created_at) values ($1,$2,$3,'NEW',$4)`, [J_A, U.candC, CO, inWin]);
await as('authenticated', U.cand);
await expDenied('authenticated no ejecuta queue_application_digests', 'select public.queue_application_digests()');
await as('anon');
await expDenied('anon no ejecuta queue_application_digests', 'select public.queue_application_digests()');
await as('service_role');
{
  const n = (await q('select public.queue_application_digests() n'))[0].n;
  ok(n === 2, 'queue_application_digests encola 2 correos (1 oferta DAILY x 2 destinatarios)', n);
  const d = await outboxRows('application_digest');
  ok(d.length === 2 && d.every((r) => r.payload.job_id === J_B), 'solo la oferta DAILY tiene resumen (la EACH no)', JSON.stringify(d.map((r) => r.payload.job_id)));
  const p = d[0].payload;
  ok(p.total === 2 && p.applications.length === 2, 'el total cuenta las 2 candidaturas del tramo (la descartada automáticamente no entra)', `${p.total}/${p.applications.length}`);
  ok(p.applications.every((a) => 'name' in a && 'date' in a && 'match_score' in a && /^\d{4}-\d{2}-\d{2}$/.test(a.date)), 'cada candidatura lleva nombre, fecha y afinidad', JSON.stringify(p.applications));
  const txt = JSON.stringify(d.map((r) => r.payload)).toLowerCase();
  ok(!txt.includes('cand@test.dev') && !txt.includes('candb@test.dev') && !txt.includes('candc@test.dev') && !/"email"/.test(txt), 'el payload NO contiene el correo de ningún candidato');
  ok(p.country_code === 'es' && p.panel_path === '/company/jobs/applications' && /^application_digest:/.test(p.dedupe_key) && p.company_name === 'Acme', 'country_code, enlace al panel, dedupe_key y empresa en el payload', JSON.stringify({ cc: p.country_code, pp: p.panel_path, dk: p.dedupe_key }));
  ok(d.map((r) => r.to_email).sort().join() === MAILS.slice().sort().join(), 'a los destinatarios de la oferta (notify_emails)');
  await as('service_role');
  const n2 = (await q('select public.queue_application_digests() n'))[0].n;
  ok(n2 === 0 && (await outboxRows('application_digest')).length === 2, 'idempotente: una segunda llamada no duplica', `${n2}`);
}
// Una candidatura posterior al corte queda para el tramo siguiente
await as('postgres');
await run(`insert into public.job_applications(job_posting_id, profile_id, company_id, status, created_at) values ($1,$2,$3,'NEW',$4)`, [J_B, U.candD, CO, outWin]);
// El nombre guardado como correo (altas antiguas) no se publica
await run(`update public.job_applications set descartada_auto=false, status='NEW' where job_posting_id=$1 and profile_id=$2`, [J_B, U.candC]);
await run('delete from public.email_outbox where kind=$1', ['application_digest']);
await as('service_role');
await run('select public.queue_application_digests()');
await as('postgres');
{
  const p = (await outboxRows('application_digest'))[0].payload;
  ok(p.total === 3 && p.applications.some((a) => a.name === '') && !JSON.stringify(p).includes('candc@test.dev'), 'un nombre guardado como correo sale vacío, nunca el correo; la posterior al corte no entra', JSON.stringify(p.applications));
}

// ================================================================== S-2
sec('S-2. Preguntas de una oferta publicada: un UPDATE sin cambios no lanza QUESTIONS_LOCKED');
await as('postgres');
ok((await q('select status from public.job_postings where id=$1', [J_B]))[0].status === 'PUBLISHED', '(preparación) J_B está PUBLISHED y tiene preguntas con respuestas');
await as('authenticated', U.emp);
{
  // El asistente reenvía cada pregunta con sus valores (el empleador no tiene SELECT sobre expected_answer/is_knockout: va con literales)
  const e1 = await err(`update public.job_posting_questions set question_text='¿Por qué quieres este puesto?', question_type='TEXTAREA', options=null, is_required=true, order_index=1 where id=$1`, [QS.q1]);
  ok(!e1, 'UPDATE de una pregunta CON respuestas a los MISMOS valores en una oferta PUBLISHED no lanza QUESTIONS_LOCKED ni QUESTION_HAS_ANSWERS', e1 && e1.message);
  const e2 = await err(`update public.job_posting_questions set question_text='¿Tienes permiso de trabajo?', question_type='YES_NO', is_required=true, is_knockout=true, expected_answer='YES', order_index=2, is_active=true where id=$1`, [QS.q2]);
  ok(!e2, 'ídem con la eliminatoria (is_knockout y expected_answer incluidos)', e2 && e2.message);
  const r3 = await run(`update public.job_posting_questions set question_text='Comentario opcional', is_required=false, order_index=3 where id=$1`, [QS.q3]);
  ok(r3.affectedRows === 1, 'y la opcional (la fila se actualiza: 1 fila)', r3.affectedRows);
  await expErr('un cambio REAL de texto sigue bloqueado (QUESTIONS_LOCKED)', /QUESTIONS_LOCKED/, `update public.job_posting_questions set question_text='otro' where id=$1`, [QS.q3]);
  await expErr('cambiar si es obligatoria sigue bloqueado', /QUESTIONS_LOCKED/, `update public.job_posting_questions set is_required=true where id=$1`, [QS.q3]);
  await expErr('ocultar una pregunta (is_active) sigue bloqueado', /QUESTIONS_LOCKED/, `update public.job_posting_questions set is_active=false where id=$1`, [QS.q1]);
  await expErr('reordenar sigue bloqueado', /QUESTIONS_LOCKED/, `update public.job_posting_questions set order_index=order_index+5 where id=$1`, [QS.q3]);
  await expErr('borrar sigue bloqueado', /QUESTIONS_LOCKED/, `delete from public.job_posting_questions where id=$1`, [QS.q3]);
  await expErr('añadir una nueva sigue bloqueado', /QUESTIONS_LOCKED/, `insert into public.job_posting_questions(job_posting_id, question_text, question_type, order_index) values ($1,'nueva','TEXT',9)`, [J_B]);
  await expErr('cambiar el texto de una pregunta CON respuestas: QUESTION_HAS_ANSWERS', /QUESTION_HAS_ANSWERS/, `update public.job_posting_questions set question_text='otro' where id=$1`, [QS.q1]);
}
await as('authenticated', U.emp2);
{
  const r = await run(`update public.job_posting_questions set order_index=1 where id=$1`, [QS.q1]);
  ok(r.affectedRows === 0, 'un miembro de OTRA empresa no toca nada (RLS: 0 filas) ni siquiera con el no-op', r.affectedRows);
}
await as('service_role');
{
  const e0 = await err('update public.job_posting_questions set question_text=question_text where id=$1', [QS.q1]);
  ok(!e0, 'service_role: no-op sobre una pregunta con respuestas, sin error', e0 && e0.message);
  await expErr('service_role: cambiar el texto de una pregunta CON respuestas sigue dando QUESTION_HAS_ANSWERS', /QUESTION_HAS_ANSWERS/, `update public.job_posting_questions set question_text='cambio' where id=$1`, [QS.q1]);
}
await as('authenticated', U.emp);
{
  const e1 = await err(`update public.job_postings set salary_max=45000, application_deadline=application_deadline + interval '1 day' where id=$1`, [J_B]);
  ok(!e1, 'editar salario/cierre de la oferta publicada funciona', e1 && e1.message);
  const e2 = await err(`update public.job_posting_questions set question_text='¿Por qué quieres este puesto?', question_type='TEXTAREA', options=null, is_required=true, order_index=1 where id=$1`, [QS.q1]);
  ok(!e2, 'y reenviar las preguntas sin cambios después tampoco falla (flujo real del asistente)', e2 && e2.message);
}

// ================================================================== S-5
sec('S-5. Alertas: hasta 5 por perfil, país por defecto, token y baja');
await as('authenticated', U.cand);
const insAl = (o = {}) => run('insert into public.job_alert_subscriptions(profile_id, categories, country, keywords, frequency, active) values ($1,$2::text[],$3,$4::text[],$5,true)', [o.profile ?? U.cand, o.cats ?? [], o.country ?? null, o.kw ?? [], o.freq ?? 'WEEKLY']);
await insAl();
{
  const a = await q('select country, frequency, categories from public.job_alert_subscriptions where profile_id=$1', [U.cand]);
  ok(a.length === 1 && a[0].country === 'ES' && a[0].frequency === 'WEEKLY', 'la alerta sin filtros (casilla alertas_novedades) toma el país del perfil y es semanal', JSON.stringify(a));
}
await insAl({ cats: ['Tecnología'] });
await insAl({ cats: ['Salud'], country: 'MX', freq: 'DAILY' });
await insAl({ kw: ['react'] });
await insAl({ cats: ['Legal'] });
ok((await q('select count(*)::int n from public.job_alert_subscriptions where profile_id=$1', [U.cand]))[0].n === 5, 'se pueden tener 5 alertas por perfil (ya no hay UNIQUE por perfil)');
{
  const a = await q(`select country from public.job_alert_subscriptions where profile_id=$1 and categories=ARRAY['Salud']`, [U.cand]);
  ok(a[0].country === 'MX', 'una alerta con filtros conserva el país que se le dio (no se pisa)');
}
await expErr('la sexta alerta se rechaza (ALERT_LIMIT)', /ALERT_LIMIT/, `insert into public.job_alert_subscriptions(profile_id, categories, country, keywords, frequency, active) values ($1,'{}',null,'{}','WEEKLY',true)`, [U.cand]);
await expDenied('no se crea una alerta a nombre de otro perfil (RLS)', `insert into public.job_alert_subscriptions(profile_id, categories, country, keywords, frequency, active) values ($1,'{}',null,'{}','WEEKLY',true)`, [U.candB]);
await expDenied('el dueño no puede escribir unsubscribe_token al insertar', 'insert into public.job_alert_subscriptions(profile_id, unsubscribe_token) values ($1, gen_random_uuid())', [U.cand]);
await expDenied('ni modificarlo', 'update public.job_alert_subscriptions set unsubscribe_token=gen_random_uuid() where profile_id=$1', [U.cand]);
const tokens = await q('select id, unsubscribe_token t, active from public.job_alert_subscriptions where profile_id=$1 order by created_at, id', [U.cand]);
ok(tokens.length === 5 && new Set(tokens.map((t) => t.t)).size === 5 && tokens.every((t) => /^[0-9a-f-]{36}$/.test(t.t)), 'cada alerta tiene su propio token uuid');
await as('authenticated', U.candB);
ok((await q('select count(*)::int n from public.job_alert_subscriptions'))[0].n === 0, 'otro candidato no ve las alertas ni los tokens ajenos');
await insAl({ profile: U.candB, cats: ['alertacat'] });
await as('anon');
await expDenied('anon no lee la tabla de alertas', 'select unsubscribe_token from public.job_alert_subscriptions');
{
  const ok1 = (await q('select public.unsubscribe_job_alerts($1::uuid) r', [tokens[0].t]))[0].r;
  ok(ok1 === true, 'baja con token válido y SIN sesión (anon): true');
  const bad = (await q('select public.unsubscribe_job_alerts(gen_random_uuid()) r'))[0].r;
  ok(bad === false, 'token inventado: false');
  const nul = (await q('select public.unsubscribe_job_alerts(null) r'))[0].r;
  ok(nul === false, 'token nulo: false');
  await as('postgres');
  const st = await q('select id, active from public.job_alert_subscriptions where profile_id=$1', [U.cand]);
  ok(st.find((x) => x.id === tokens[0].id).active === false && st.filter((x) => x.active).length === 4, 'solo se desactivó la alerta del token; las otras 4 siguen activas', JSON.stringify(st.map((x) => x.active)));
  await as('anon');
  ok((await q('select public.unsubscribe_job_alerts($1::uuid) r', [tokens[0].t]))[0].r === true, 'repetir la baja es inofensivo (true)');
  await as('authenticated', U.candB);
  ok((await q('select public.unsubscribe_job_alerts($1::uuid) r', [tokens[1].t]))[0].r === true, 'un usuario con sesión también puede usar el enlace de baja');
  await as('postgres');
  ok((await q('select active from public.job_alert_subscriptions where id=$1', [tokens[1].id]))[0].active === false, '(y desactiva esa alerta)');
}
{
  // queue_job_alerts: 10 ofertas publicadas -> hasta 8 en el payload, con token y country_code
  await as('postgres');
  for (let i = 0; i < 10; i++) {
    await run(`insert into public.job_postings(company_id, created_by, title, description, location_city, location_country, work_mode, employment_type, experience_level, country_code, category, contract_types, schedule, vacancies, status, published_at, application_deadline, notify_emails)
      values ($1,$2,$3,$4,'Madrid','ES','ONSITE','FULL_TIME','MID','ES','AlertaCat',ARRAY['INDEFINITE'],'FULL_TIME',1,'PUBLISHED', now() - ($5 || ' minutes')::interval, now() + interval '20 days', ARRAY['rrhh@acme.test'])`,
      [CO, U.emp, 'Puesto de alerta ' + i, LONG, String(i + 1)]);
  }
  await run("update public.job_alert_subscriptions set opted_in_at = now() - interval '3 days' where profile_id=$1", [U.candB]);
  await as('authenticated', U.candB);
  await expDenied('un candidato no ejecuta queue_job_alerts', 'select public.queue_job_alerts()');
  await as('service_role');
  const n = (await q('select public.queue_job_alerts() n'))[0].n;
  const rows = (await outboxRows('job_alert')).filter((r) => r.to_email === 'candb@test.dev');
  ok(n >= 1 && rows.length === 1, 'queue_job_alerts encola el aviso de la alerta de candB', `${n}/${rows.length}`);
  const p = rows[0].payload;
  ok(p.total === 10 && p.jobs.length === 8, 'total 10 y máximo 8 ofertas en el payload', `${p.total}/${p.jobs.length}`);
  ok(p.jobs.every((j) => j.title && j.slug && j.country_code === 'es' && j.company_name === 'Acme'), 'cada oferta lleva title, slug, country_code (es) y company_name', JSON.stringify(p.jobs[0]));
  const tk = (await q('select unsubscribe_token t from public.job_alert_subscriptions where profile_id=$1', [U.candB]))[0].t;
  ok(p.unsubscribe_token === tk, 'y el unsubscribe_token de ESA alerta');
  await as('service_role');
  await run('select public.queue_job_alerts()');
  ok((await outboxRows('job_alert')).filter((r) => r.to_email === 'candb@test.dev').length === 1, 'idempotente: no repite el aviso');
  ok((await outboxRows('job_alert')).every((r) => r.payload.jobs.length <= 8), 'ninguna alerta supera 8 ofertas');
}

// ================================================================== S-6
sec('S-6. search_public_jobs_v2 con p_sort');
await as('postgres');
{
  const ins = (title, skills, ago) => run(`insert into public.job_postings(company_id, created_by, title, description, location_city, location_country, work_mode, employment_type, experience_level, country_code, category, contract_types, schedule, vacancies, required_skills, status, published_at, application_deadline, notify_emails)
      values ($1,$2,$3,$4,'Madrid','ES','ONSITE','FULL_TIME','MID','ES','Afinidad',ARRAY['INDEFINITE'],'FULL_TIME',1,$5::text[],'PUBLISHED', now() - ($6 || ' days')::interval, now() + interval '20 days', ARRAY['rrhh@acme.test'])`, [CO, U.emp, title, LONG, skills, ago]);
  await ins('Reciente poco afin', ['Rust', 'Go', 'Erlang'], '1');
  await ins('Antigua muy afin', ['React', 'SQL', 'TypeScript'], '6');
  await ins('Media afin', ['React', 'Cobol', 'Fortran'], '3');
}
const titles = (rows) => rows.map((r) => r.title).join(' | ');
const sp = (sort, extra = '') => q(`select title, total_count from public.search_public_jobs_v2(p_category => 'Afinidad'${sort === undefined ? '' : `, p_sort => '${sort}'`}${extra})`);
await as('anon');
{
  const rec = await sp('recent'), aff = await sp('affinity'), def = await sp(undefined);
  ok(titles(rec) === 'Reciente poco afin | Media afin | Antigua muy afin', 'anon, recent: por fecha', titles(rec));
  ok(titles(aff) === titles(rec), 'anon con p_sort=affinity cae a recent (sin sesión)', titles(aff));
  ok(titles(def) === titles(rec), 'sin p_sort (clientes antiguos): recent');
}
await as('authenticated', U.cand);
{
  const rec = await sp('recent'), aff = await sp('affinity');
  ok(titles(rec) === 'Reciente poco afin | Media afin | Antigua muy afin', 'candidato, recent: por fecha', titles(rec));
  ok(titles(aff) === 'Antigua muy afin | Media afin | Reciente poco afin', 'candidato, affinity: primero la más afín a sus habilidades', titles(aff));
  ok(aff.every((r) => Number(r.total_count) === 3), 'total_count es el total real');
  const pg = await q(`select title from public.search_public_jobs_v2(p_category => 'Afinidad', p_sort => 'affinity', p_limit => 1, p_offset => 1)`);
  ok(pg.length === 1 && pg[0].title === 'Media afin', 'paginación con affinity (limit 1, offset 1 = la segunda)', titles(pg));
  const inv = await sp('loquesea');
  ok(titles(inv) === titles(rec), 'un p_sort desconocido se trata como recent');
  const up = await sp(' AFFINITY ');
  ok(titles(up) === titles(aff), 'mayúsculas/espacios no importan');
  const filt = await q(`select title from public.search_public_jobs_v2(p_category => 'Afinidad', p_sort => 'affinity', p_search => 'poco')`);
  ok(titles(filt) === 'Reciente poco afin', 'los filtros siguen funcionando con affinity');
  const nm = await q(`select count(*)::int n from pg_proc where proname='search_public_jobs_v2' and pronamespace='public'::regnamespace`);
  ok(nm[0].n === 1, 'solo existe una firma de search_public_jobs_v2');
}
await as('authenticated', U.candB);
{
  const aff = await sp('affinity');
  ok(aff.length === 3, 'candidato sin habilidades: affinity devuelve las ofertas igualmente', titles(aff));
}

// ================================================================== S-7 (parte 3): publicar versión nueva del tipo
sec('S-7c. condiciones_publicacion en legal_publicar_version / legal_encolar_aviso');
await as('authenticated', U.admin);
await expErr('antelación < 15 días rechazada también para el tipo nuevo', /ANTELACION_INSUFICIENTE/, `select public.legal_publicar_version('condiciones_publicacion','2.0','es','Condiciones 2','texto',$1)`, [iso(5)]);
await as('authenticated', U.cand);
await expErr('un candidato no publica versiones', /FORBIDDEN/, `select public.legal_publicar_version('condiciones_publicacion','2.0','es','t','x',$1)`, [iso(20)]);
await as('authenticated', U.admin);
{
  const r = (await q(`select public.legal_publicar_version('condiciones_publicacion','2.0','es','Condiciones de publicación 2','texto nuevo',$1) r`, [iso(20)]))[0].r;
  ok(r.tipo === 'condiciones_publicacion' && r.encolados === 2, 'el admin publica la v2.0 con 20 días y se avisa a los 2 empleadores (emp, emp2)', JSON.stringify(r));
  await as('postgres');
  const d = await q("select audiencia, requiere_aceptacion from public.documentos_legales where tipo='condiciones_publicacion' and version='2.0'");
  ok(d[0].audiencia === 'empleador' && d[0].requiere_aceptacion === true, 'audiencia empleador y exige aceptación');
  const n = await outboxRows('legal_version_notice');
  const mine = n.filter((x) => x.payload.tipo === 'condiciones_publicacion');
  ok(mine.length === 2 && mine.map((x) => x.to_email).sort().join() === 'emp2@beta.test,emp@acme.test', 'avisos solo a los empleadores, no a los candidatos', mine.map((x) => x.to_email).join());
  await as('authenticated', U.admin);
  ok((await q(`select public.legal_encolar_aviso('condiciones_publicacion','2.0') n`))[0].n === 0, 'legal_encolar_aviso es idempotente');
  await expErr('un tipo inventado sigue rechazado', /LEGAL_INVALIDO/, `select public.legal_publicar_version('otra_cosa','2.0','es','t','x',$1)`, [iso(20)]);
}

// ================================================================== S-8
sec('S-8. Programación: bolsa-empresas y bolsa-resumenes');
await as('postgres');
{
  const jobs = await q("select jobname, schedule, command from cron.job where jobname like 'bolsa-%' order by jobname");
  ok(jobs.map((j) => j.jobname).join() === 'bolsa-alertas,bolsa-caducidad,bolsa-correos,bolsa-empresas,bolsa-moderacion,bolsa-resumenes', '6 trabajos bolsa-* programados', jobs.map((j) => j.jobname).join());
  const emp = jobs.find((j) => j.jobname === 'bolsa-empresas'), res = jobs.find((j) => j.jobname === 'bolsa-resumenes');
  ok(emp.schedule === '*/10 * * * *' && /company-review-ai/.test(emp.command) && /"sweep":true/.test(emp.command), 'bolsa-empresas: cada 10 min, company-review-ai con {"sweep":true}', JSON.stringify(emp));
  ok(res.schedule === '0 8 * * *' && /send-outbox/.test(res.command) && /"digests":true/.test(res.command), 'bolsa-resumenes: 08:00 UTC, send-outbox con {"digests":true}', JSON.stringify(res));
  const n0 = await netCalls();
  await run(`select public.bolsa_llamar_funcion('company-review-ai', '{"sweep":true}'::jsonb)`);
  const last = (await q('select url, body from net.calls order by id desc limit 1'))[0];
  ok((await netCalls()) === n0 + 1 && /\/functions\/v1\/company-review-ai$/.test(last.url) && last.body.sweep === true, 'bolsa_llamar_funcion acepta company-review-ai y envía el cuerpo');
  await run(`select public.bolsa_llamar_funcion('send-outbox', '{"digests":true}'::jsonb)`);
  ok((await q('select body from net.calls order by id desc limit 1'))[0].body.digests === true, 'y send-outbox con digests');
  const e = await err(`select public.bolsa_llamar_funcion('otra-funcion')`);
  ok(!!e && /BOLSA_FUNCION_NO_PERMITIDA/.test(e.message), 'una función fuera de la lista se rechaza (BOLSA_FUNCION_NO_PERMITIDA)', e && e.message);
  await as('postgres');
  const before = (await q("select count(*)::int n from cron.job where jobname like 'bolsa-%'"))[0].n;
  const e2 = await applyMig(db, MIGS[7]);
  await as('postgres');
  ok(!e2 && (await q("select count(*)::int n from cron.job where jobname like 'bolsa-%'"))[0].n === before, 'reaplicar la 35 no duplica trabajos programados', e2 && e2.message);
}
await as('service_role');
await expDenied('service_role tampoco ejecuta bolsa_llamar_funcion (solo el cron y los triggers)', `select public.bolsa_llamar_funcion('send-outbox')`);

// ================================================================== S-9
sec('S-9. company_duplicate_hint');
await as('anon');
await expDenied('anon no ejecuta company_duplicate_hint', `select public.company_duplicate_hint('A1','x@y.z')`);
await as('authenticated', U.candB);
{
  const h = (await q(`select public.company_duplicate_hint('A1','rrhh@acme.test') h`))[0].h;
  ok(h.tax_id_taken === true && h.email_taken === true, 'NIF y correo ya registrados: ambos true', JSON.stringify(h));
  ok(Object.keys(h).sort().join() === 'email_taken,tax_id_taken' && Object.values(h).every((v) => typeof v === 'boolean'), 'devuelve solo dos booleanos');
  ok(!JSON.stringify(h).includes('Acme') && !JSON.stringify(h).includes(CO), 'sin revelar de quién');
  const h2 = (await q(`select public.company_duplicate_hint('  a-1. ','RRHH@Acme.TEST ') h`))[0].h;
  ok(h2.tax_id_taken === true && h2.email_taken === true, 'normaliza mayúsculas, espacios, puntos y guiones');
  const h3 = (await q(`select public.company_duplicate_hint('ZZ999','nadie@nuevo.test') h`))[0].h;
  ok(h3.tax_id_taken === false && h3.email_taken === false, 'datos nuevos: ambos false');
  const h4 = (await q(`select public.company_duplicate_hint('A1','nadie@nuevo.test') h`))[0].h;
  ok(h4.tax_id_taken === true && h4.email_taken === false, 'solo el NIF repetido');
  const h5 = (await q(`select public.company_duplicate_hint(null,'') h`))[0].h;
  ok(h5.tax_id_taken === false && h5.email_taken === false, 'vacíos y nulos: false');
  const es = await err(`select public.company_duplicate_hint($1,'a@b.c')`, ['x'.repeat(60)]);
  ok(!!es && /INVALID_INPUT/.test(es.message), 'valores desmesurados se rechazan');
}

// ================================================================== S-1/S-3: denuncias
sec('S-1/S-3. Tres denuncias devuelven la oferta a revisión (llama a moderate-job-posting); job_reported y application_message llevan country_code');
{
  const n0 = await netCalls();
  for (const u of [U.cand, U.candB, U.candC]) {
    await as('authenticated', u);
    await run(`insert into public.job_reports(job_id, reason) values ($1,'SCAM')`, [J_A]);
  }
  await as('postgres');
  ok((await q('select status from public.job_postings where id=$1', [J_A]))[0].status === 'AI_REVIEW', 'la oferta vuelve a AI_REVIEW tras 3 denuncias');
  ok((await netCalls()) === n0 + 1, 'y se llama a la moderación inmediatamente');
  const rep = await outboxRows('job_reported');
  ok(rep.length === 3 && rep.every((r) => r.payload.country_code === 'es'), 'job_reported lleva country_code', JSON.stringify(rep.map((r) => r.payload.country_code)));
}
{
  await as('postgres');
  const aid = (await q('select id from public.job_applications where job_posting_id=$1 and profile_id=$2', [J_B, U.cand]))[0].id;
  await as('authenticated', U.emp);
  await run('select public.send_application_message($1::uuid, $2)', [aid, 'interview']);
  const m = await outboxRows('application_message');
  ok(m.length === 1 && m[0].payload.country_code === 'es', 'application_message lleva country_code (resuelto por application_id)', JSON.stringify(m[0] && m[0].payload));
  await as('authenticated', U.emp);
  await run(`select public.update_application_status($1::uuid, $2::uuid, $3::uuid, 'SHORTLISTED')`, [aid, CO, U.emp]);
  const st = await outboxRows('application_status_candidate');
  ok(st.length > 0 && st.every((x) => x.payload.country_code === 'es'), 'application_status_candidate lleva country_code', JSON.stringify(st.map((x) => x.payload.country_code)));
}

// ================================================================== Sin pg_net ni pg_cron
sec('Sin pg_net / sin pg_cron');
await as('postgres');
{
  await db.exec('drop schema net cascade');
  await as('authenticated', U.emp);
  const J_C = await mkJob('Analista de calidad', 'EACH');
  const r = await err('select public.submit_job_for_review($1)', [J_C]);
  ok(!r, 'S-1: sin pg_net el envío a revisión funciona', r && r.message);
  await as('postgres');
  ok((await q('select status from public.job_postings where id=$1', [J_C]))[0].status === 'AI_REVIEW', 'y la oferta queda en AI_REVIEW (la recogerá el cron)');
  await db.exec('drop schema cron cascade');
  const e = await applyMig(db, MIGS[7]);
  ok(!e, 'S-8: sin pg_cron la migración se aplica igual (avisa y no programa)', e && e.message);
}

out(`\nRESULTADO: ${pass} OK, ${fail} FALLO`);
process.exit(fail ? 1 : 0);
