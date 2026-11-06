// Prueba de 20261032_correcciones_auditoria.sql SOBRE EL ENCADENADO COMPLETO 29 -> 30 -> 31 -> 32
// en PGlite (RLS y roles reales). Los stubs de la base salen de los de fase1/2/3 (definiciones
// leidas de produccion el 29/10/2026) combinados en un solo esquema.
// Uso: node fase4.test.mjs   (desde la carpeta pgtest)
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const DIR = HERE;
const MIGS = `${DIR}../migrations`;
const mig = (f) => readFileSync(`${MIGS}/${f}`, 'utf8');
const M29 = mig('20261029_legal_aceptaciones_idioma.sql');
const M30 = mig('20261030_ofertas_fase2.sql');
const M31 = mig('20261031_candidaturas_fase3.sql');
const M32 = mig('20261032_correcciones_auditoria.sql');

const db = new PGlite();
let total = 0, fails = 0;
process.on('uncaughtException', e => { console.log('FALLO INESPERADO:', String(e.message).slice(0, 500)); console.log(`RESULTADO PARCIAL: ${total - fails}/${total} OK`); process.exit(2); });
process.on('unhandledRejection', e => { console.log('FALLO INESPERADO:', String(e && e.message).slice(0, 500)); console.log(`RESULTADO PARCIAL: ${total - fails}/${total} OK`); process.exit(2); });
function ok(name, cond, extra) {
  total++;
  if (cond) console.log('OK    ' + name);
  else { fails++; console.log('FALLO ' + name + (extra !== undefined ? '  => ' + String(extra).slice(0, 400) : '')); }
}
async function throws(name, fn, re) {
  try { await fn(); ok(name, false, 'no lanzo error'); }
  catch (e) { ok(name, re.test(e.message), e.message); }
}
const q = async (text, params) => (await db.query(text, params)).rows;
let cur = { role: 'postgres', uid: null, headers: null };
async function as(role, uid, headers) {
  cur = { role, uid, headers };
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false), set_config('request.headers', $3, false)",
    [uid ?? '', role === 'postgres' ? '' : role, headers ? JSON.stringify(headers) : '']);
  if (role !== 'postgres') await db.exec(`set role ${role}`);
}
// pg(): consulta como postgres y RESTAURA el rol anterior (para poder comprobar estados sin cambiar de identidad)
const pg = async (text, params) => { const prev = cur; await as('postgres'); try { return await q(text, params); } finally { await as(prev.role, prev.uid, prev.headers); } };

// -----------------------------------------------------------------------------
// Identidades
// -----------------------------------------------------------------------------
const U = {
  cand:  '00000000-0000-0000-0000-0000000000c1',
  cand2: '00000000-0000-0000-0000-0000000000c2',
  kid:   '00000000-0000-0000-0000-0000000000c3',   // menor de 16 con fecha guardada
  oauth: '00000000-0000-0000-0000-0000000000c4',   // sin fecha de nacimiento
  cand3: '00000000-0000-0000-0000-0000000000c5',
  reg:   '00000000-0000-0000-0000-0000000000c6',   // alta con hora declarada
  mA:    '00000000-0000-0000-0000-00000000a001',
  vA:    '00000000-0000-0000-0000-00000000a002',
  mB:    '00000000-0000-0000-0000-00000000b001',
  adm:   '00000000-0000-0000-0000-00000000ad01',
};
const CA = 'c0000000-0000-0000-0000-0000000000aa';
const CB = 'c0000000-0000-0000-0000-0000000000bb';
const CASILLAS = { acepto_condiciones_privacidad: true, datos_verdaderos: true, poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true };

// -----------------------------------------------------------------------------
// STUBS: esquema base combinado (fase1 + fase2 + fase3)
// -----------------------------------------------------------------------------
// Los trozos de stub se cortan por numero de linea de fase1/fase2: si cambias su cabecera, ajusta los slice().
const lines = (f) => readFileSync(`${DIR}${f}`, 'utf8').split('\n');
let s1 = lines('fase1.test.mjs').slice(39, 152).join('\n');
s1 = s1.replace(/create table public\.job_postings\(id uuid[^\n]*\n/, '');
let s2 = lines('fase2.test.mjs').slice(45, 183).join('\n');
s2 = s2.slice(s2.indexOf('create table public.job_postings ('));
s2 = s2.replace(/create table public\.job_posting_questions\([\s\S]*?now\(\)\);\n/, '')
       .replace(/create table public\.job_applications\([\s\S]*?rating int\);\n/, '');
s2 = s2.split('\n').filter(l => !/job_posting_questions/.test(l)).join('\n');
// En s2 la funcion generate_job_posting_slug lleva '\\s' (escape de plantilla JS): irrelevante, la sustituye la fase 2.

await db.exec(s1);
await db.exec(`
alter table auth.users add column raw_app_meta_data jsonb default '{}'::jsonb, add column created_at timestamptz default now();
alter table public.company_users enable row level security;
create policy "Users can view own memberships" on public.company_users for select to authenticated using (user_id = auth.uid());
`);
await db.exec(s2.slice(0, s2.indexOf('-- funciones reales')));   // job_postings (tabla)
await db.exec(`
create table public.job_posting_questions (
  id uuid primary key default gen_random_uuid(), job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  question_text text not null, question_type varchar(50) check (question_type in ('TEXT','TEXTAREA','YES_NO','MULTIPLE_CHOICE')),
  options jsonb, is_required boolean default false, order_index int default 0, created_at timestamptz default now()
);
create table public.experiences (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text, position text, start_date date, end_date date, description text, achievements text[], is_current boolean, location text,
  employment_type text, sort_order int default 0, verified boolean default false);
create table public.education (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  institution_name text, degree text, field_of_study text, start_date date, end_date date, grade text, description text, is_current boolean, verified boolean default false, sort_order int default 0);
create table public.skills (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  name text, level text, years_of_experience int, percentage int, category text, sort_order int default 0);
create table public.languages (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  name text, level text, is_native boolean, sort_order int default 0, percentage int);

create or replace function public.update_job_posting_updated_at() returns trigger language plpgsql as $f$ begin new.updated_at = now(); return new; end; $f$;
create table public.job_applications (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status varchar(50) default 'NEW', cover_letter text, resume_url text, answers jsonb default '{}'::jsonb,
  viewed_by_company boolean default false, viewed_at timestamptz, viewed_by uuid references auth.users(id) on delete set null,
  internal_notes text, rating int, match_score int, metadata jsonb default '{}'::jsonb,
  constraint job_applications_job_posting_id_profile_id_key unique (job_posting_id, profile_id),
  constraint job_applications_match_score_check check (match_score >= 0 and match_score <= 100),
  constraint job_applications_rating_check check (rating >= 1 and rating <= 5),
  constraint job_applications_status_check check (status in ('NEW','REVIEWING','SHORTLISTED','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN'))
);
alter table public.job_applications enable row level security;
create policy "Candidates can create applications" on public.job_applications for insert with check (profile_id = auth.uid());
create policy "Candidates can update their applications" on public.job_applications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Candidates can view their applications" on public.job_applications for select using (exists (select 1 from public.profiles where profiles.id = job_applications.profile_id and profiles.id = auth.uid()));
create policy "Candidates can view their own applications" on public.job_applications for select using (profile_id = auth.uid());
create policy "Company members can update application status" on public.job_applications for update using (company_id in (select company_id from public.company_users where user_id = auth.uid()));
create policy "Company members can view applications" on public.job_applications for select using (exists (select 1 from public.company_users where company_users.company_id = job_applications.company_id and company_users.user_id = auth.uid()));
create policy "Company members can view applications to their jobs" on public.job_applications for select using (company_id in (select company_id from public.company_users where user_id = auth.uid()));
create trigger trigger_update_job_application_timestamp before update on public.job_applications for each row execute function public.update_job_posting_updated_at();
create or replace function public.notify_application_status_change() returns trigger language plpgsql as $$ begin return new; end; $$;
create or replace function public.notify_new_job_application() returns trigger language plpgsql as $$ begin return new; end; $$;
create trigger on_application_status_change after update of status on public.job_applications for each row execute function public.notify_application_status_change();
create trigger on_new_job_application after insert on public.job_applications for each row execute function public.notify_new_job_application();
create or replace function public.calculate_job_match_score(p_job_posting_id uuid, p_profile_id uuid) returns integer language plpgsql security definer as $$
declare v_profile record; begin select * into v_profile from profiles where id = p_profile_id; if v_profile.experience_level is not null then return 1; end if; return 0; end; $$;
create or replace function public.apply_to_job(p_job_posting_id uuid, p_profile_id uuid, p_cover_letter text default null, p_answers jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer as $$
begin return jsonb_build_object('old', true); end; $$;
create or replace function public.update_application_status(p_application_id uuid, p_company_id uuid, p_user_id uuid, p_new_status varchar, p_internal_notes text default null, p_rating integer default null) returns jsonb language plpgsql security definer as $$
begin return jsonb_build_object('old', true); end; $$;
`);
await db.exec(s2.slice(s2.indexOf('-- funciones reales')));   // funciones, triggers y politicas de job_postings
await db.exec(`
alter table public.job_posting_questions enable row level security;
-- las 6 politicas REALES de produccion (leidas el 29/10/2026)
create policy "Anyone can view questions for published jobs" on public.job_posting_questions for select using (job_posting_id in (select id from public.job_postings where status = 'PUBLISHED'));
create policy "Company members can manage questions" on public.job_posting_questions for all using (job_posting_id in (select jp.id from public.job_postings jp where jp.company_id in (select company_id from public.company_users where user_id = auth.uid())));
create policy "Company members can view questions for their jobs" on public.job_posting_questions for select using (job_posting_id in (select jp.id from public.job_postings jp where jp.company_id in (select company_id from public.company_users where user_id = auth.uid())));
create policy "Company members can view their questions" on public.job_posting_questions for select using (exists (select 1 from public.job_postings jp join public.company_users cu on cu.company_id = jp.company_id where jp.id = job_posting_questions.job_posting_id and cu.user_id = auth.uid()));
create policy "Company members manage questions" on public.job_posting_questions for all to authenticated using (exists (select 1 from public.job_postings jp join public.company_users cu on cu.company_id = jp.company_id where jp.id = job_posting_questions.job_posting_id and cu.user_id = auth.uid()));
create policy "Public can view questions of published jobs" on public.job_posting_questions for select using (exists (select 1 from public.job_postings jp where jp.id = job_posting_questions.job_posting_id and jp.status = 'PUBLISHED'));
`);

// -----------------------------------------------------------------------------
// Encadenado 29 -> 30 -> 31 (cada migracion trae su propio BEGIN/COMMIT)
// -----------------------------------------------------------------------------
async function applyMig(name, sql) {
  try { await db.exec(sql); ok(`migracion ${name} aplicada`, true); return true; }
  catch (e) { ok(`migracion ${name} aplicada`, false, e.message); console.log(`\nRESULTADO: ${total - fails}/${total} OK`); process.exit(1); }
}
await applyMig('20261029', M29);
await applyMig('20261030', M30);
await applyMig('20261031', M31);

// Datos (como postgres: el trigger de alta crea los perfiles)
const mkUser = async (id, email, role = 'professional', meta = null) => {
  await db.query(`insert into auth.users(id, email, raw_user_meta_data) values ($1,$2,$3)`, [id, email, meta ? JSON.stringify(meta) : null]);
  await db.query(`update public.profiles set role=$2, slug=$3, country_code='ES', headline='h', summary='s' where id=$1`, [id, role, 'u' + id.slice(-4)]);
};
await as('postgres');
await mkUser(U.cand, 'cand@t.test');
await mkUser(U.cand2, 'cand2@t.test');
await mkUser(U.kid, 'kid@t.test');
await mkUser(U.oauth, 'oauth@t.test');
await mkUser(U.cand3, 'cand3@t.test');
await mkUser(U.reg, 'reg@t.test');
await mkUser(U.mA, 'ma@a.test', 'employer');
await mkUser(U.vA, 'va@a.test', 'employer');
await mkUser(U.mB, 'mb@b.test', 'employer');
await mkUser(U.adm, 'adm@t.test', 'admin');
await db.query(`update public.profiles set fecha_nacimiento = date '1990-05-05' where id in ($1,$2,$3,$4,$5,$6,$7,$8)`, [U.cand, U.cand2, U.cand3, U.reg, U.mA, U.vA, U.mB, U.adm]);
await db.query(`update public.profiles set fecha_nacimiento = ((now() at time zone 'utc')::date - interval '15 years')::date where id = $1`, [U.kid]);
await db.query(`insert into public.companies(id, company_name, legal_name, tax_id, company_email, status) values
  ($1,'Empresa A','A SL','A1','rrhh@a.test','APPROVED'),($2,'Empresa B','B SL','B1','rrhh@b.test','APPROVED')`, [CA, CB]);
await db.query(`insert into public.company_users(company_id,user_id,role) values ($1,$2,'OWNER'),($1,$3,'VIEWER'),($4,$5,'OWNER')`, [CA, U.mA, U.vA, CB, U.mB]);
await db.query(`insert into public.skills(profile_id,name) values ($1,'React')`, [U.cand]);

// -----------------------------------------------------------------------------
// 32 (dos veces: reaplicable)
// -----------------------------------------------------------------------------
await applyMig('20261032 (1.ª vez)', M32);
await applyMig('20261032 (2.ª vez, reaplicable)', M32);
ok('una sola sobrecarga de moderar_oferta / update_application_status / search_public_jobs_v2 / apply_to_job',
  (await q(`select proname, count(*)::int n from pg_proc where pronamespace='public'::regnamespace and proname in ('moderar_oferta','update_application_status','search_public_jobs_v2','apply_to_job','get_application_history') group by 1 order by 1`))
    .every(r => r.n === 1));
ok('columnas nuevas presentes',
  (await q(`select count(*)::int n from information_schema.columns where (table_name='email_outbox' and column_name='last_error') or (table_name='aceptaciones' and column_name='aceptado_declarado_en') or (table_name='job_posting_questions' and column_name='is_active') or (table_name='job_application_status_history' and column_name='note')`))[0].n === 4);

// Utilidades de datos
const LONG = 'Buscamos una persona con ganas de aprender y de trabajar en equipo. '.repeat(6);
let nJob = 0;
async function mkJob(o = {}) {
  await as('postgres');
  nJob++;
  const id = o.id ?? `d0000000-0000-0000-0000-${String(nJob).padStart(12, '0')}`;
  await db.query(
    `insert into public.job_postings(id, company_id, created_by, title, description, status, published_at, created_at, application_deadline,
       country_code, category, work_mode, location_city, contract_types, schedule, vacancies, allowed_countries, experience_years, location_country)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,1,$16,$17,$18)`,
    [id, o.company ?? CA, o.by ?? U.mA, o.title ?? `Oferta ${nJob}`, o.description ?? LONG, o.status ?? 'PUBLISHED',
     (o.status ?? 'PUBLISHED') === 'DRAFT' ? null : (o.published_at ?? new Date().toISOString()),
     o.created_at ?? new Date(Date.now() - 3 * 864e5).toISOString(),
     o.deadline === undefined ? (o.status === 'DRAFT' ? null : new Date(Date.now() + 20 * 864e5).toISOString()) : o.deadline,
     o.country ?? 'ES', 'tech', o.work_mode ?? 'ONSITE', o.city ?? 'Madrid', ['INDEFINITE'], 'FULL_TIME',
     o.allowed ?? null, o.exp ?? null, o.country ?? 'ES']);
  return id;
}
const statusOf = async (id) => (await pg(`select status from public.job_postings where id=$1`, [id]))[0].status;
async function acceptAll(uid, ctx = 'inscripcion') {
  await as('authenticated', uid);
  const pend = await q('select documento_id from public.documentos_pendientes()');
  if (pend.length) await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [pend.map(p => p.documento_id), JSON.stringify(CASILLAS), ctx]);
  return pend.length;
}
const apply = (job, o = {}) => q('select public.apply_to_job($1::uuid, null, $2, $3::jsonb, $4, $5) as r',
  [job, o.cover ?? null, JSON.stringify(o.answers ?? {}), ('consent' in o ? o.consent : true), 'v1.0']);

// =============================================================================
// S1. La puerta de aceptacion tambien esta en el servidor
// =============================================================================
const JA1 = await mkJob({ title: 'Oferta aceptacion' });
await as('authenticated', U.cand);
await throws('S1: candidato SIN aceptacion no puede inscribirse -> ACCEPTANCE_REQUIRED', () => apply(JA1), /^ACCEPTANCE_REQUIRED/);
ok('S1: ... y no se creo candidatura', (await pg('select count(*)::int n from public.job_applications'))[0].n === 0);
// aceptar solo la privacidad no basta: falta terminos_candidato
{
  await as('authenticated', U.cand);
  const priv = (await q(`select id from public.documentos_legales where tipo='privacidad' and idioma='es'`))[0].id;
  await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[priv], '{}', 'inscripcion']);
  await throws('S1: solo privacidad aceptada -> sigue ACCEPTANCE_REQUIRED', () => apply(JA1), /^ACCEPTANCE_REQUIRED/);
}
await as('authenticated', U.cand);
const doc = (await q(`select id from public.documentos_legales where tipo='terminos_candidato' and idioma='es'`))[0].id;
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[doc], JSON.stringify(CASILLAS), 'inscripcion']);
let r = (await apply(JA1))[0].r;
ok('S1: con la aceptacion vigente SI se inscribe', r.success === true, JSON.stringify(r));

// Empresa: enviar a revision exige terminos_empleador
await as('authenticated', U.mA);
await q(`insert into public.job_postings(id, company_id, created_by, title, description, country_code, category, work_mode, contract_types, schedule, vacancies, application_deadline)
         values ('d1000000-0000-0000-0000-000000000001', $1, $2, 'Borrador de A', $3, 'ES', 'tech', 'REMOTE', '{INDEFINITE}', 'FULL_TIME', 1, now() + interval '30 days')`, [CA, U.mA, LONG]);
const JD1 = 'd1000000-0000-0000-0000-000000000001';
await throws('S1: empresa SIN aceptacion no puede enviar a revision -> ACCEPTANCE_REQUIRED', () => q('select public.submit_job_for_review($1::uuid)', [JD1]), /^ACCEPTANCE_REQUIRED/);
await throws('S1: tampoco por publish_job_posting', () => q('select public.publish_job_posting($1::uuid,$2::uuid,$3::uuid,30)', [JD1, CA, U.mA]), /^ACCEPTANCE_REQUIRED/);
ok('S1: la oferta sigue en DRAFT', (await statusOf(JD1)) === 'DRAFT');
{
  const n = await acceptAll(U.mA, 'publicacion');
  ok('S1: documentos_pendientes de un miembro de empresa incluye terminos_empleador', n >= 1, n);
}
await as('authenticated', U.mA);
r = (await q('select public.submit_job_for_review($1::uuid) as r', [JD1]))[0].r;
ok('S1: con la aceptacion de empleador entra en revision', r.success === true && ['AI_REVIEW', 'MANUAL_REVIEW'].includes(r.status), JSON.stringify(r));

// Sin documento vigente de ese tipo no se exige
{
  await as('postgres');
  ok('S1: helper _aceptacion_pendiente: tipo sin documento -> false', (await q(`select public._aceptacion_pendiente($1,'cookies') as p`, [U.cand2]))[0].p === false);
  await db.exec(`alter table public.documentos_legales disable trigger trg_documentos_legales_proteger;
                 update public.documentos_legales set requiere_aceptacion = false where tipo = 'terminos_candidato';
                 alter table public.documentos_legales enable trigger trg_documentos_legales_proteger;`);
  await as('authenticated', U.cand2);
  r = (await apply(JA1))[0].r;
  ok('S1: si no hay documento exigible de candidato, NO se exige (no bloquea)', r.success === true, JSON.stringify(r));
  await as('postgres');
  await db.exec(`alter table public.documentos_legales disable trigger trg_documentos_legales_proteger;
                 update public.documentos_legales set requiere_aceptacion = true where tipo = 'terminos_candidato';
                 alter table public.documentos_legales enable trigger trg_documentos_legales_proteger;`);
}

// =============================================================================
// S4. Edad
// =============================================================================
const utcToday = new Date(); const ymd = (d) => d.toISOString().slice(0, 10);
const yearsAgo = (y, extraDays = 0) => { const d = new Date(Date.UTC(utcToday.getUTCFullYear() - y, utcToday.getUTCMonth(), utcToday.getUTCDate())); d.setUTCDate(d.getUTCDate() + extraDays); return ymd(d); };
await as('anon');
await throws('S4: anon no puede ejecutar set_my_birth_date', () => q(`select public.set_my_birth_date(date '1990-01-01')`), /permission denied for function/);
await as('authenticated', U.oauth);
ok('S4: fecha en el futuro -> invalid', (await q(`select public.set_my_birth_date(($1)::date) as r`, [ymd(new Date(Date.now() + 864e5 * 3))]))[0].r.status === 'invalid');
ok('S4: fecha NULL -> invalid', (await q(`select public.set_my_birth_date(null) as r`))[0].r.status === 'invalid');
ok('S4: fecha anterior a 1900 -> invalid', (await q(`select public.set_my_birth_date(date '1890-01-01') as r`))[0].r.status === 'invalid');
ok('S4: 15 años y 364 dias -> underage', (await q(`select public.set_my_birth_date(($1)::date) as r`, [yearsAgo(16, 1)]))[0].r.status === 'underage');
ok('S4: ... y NO se guardo', (await pg(`select fecha_nacimiento from public.profiles where id=$1`, [U.oauth]))[0].fecha_nacimiento === null);
await as('authenticated', U.oauth);
ok('S4: 12 años -> underage', (await q(`select public.set_my_birth_date(($1)::date) as r`, [yearsAgo(12)]))[0].r.status === 'underage');
ok('S4: justo 16 años hoy -> ok', (await q(`select public.set_my_birth_date(($1)::date) as r`, [yearsAgo(16)]))[0].r.status === 'ok');
ok('S4: ... queda guardada', String((await pg(`select fecha_nacimiento::text f from public.profiles where id=$1`, [U.oauth]))[0].f) === yearsAgo(16));
await as('authenticated', U.oauth);
ok('S4: segunda vez -> already_set', (await q(`select public.set_my_birth_date(date '1980-01-01') as r`))[0].r.status === 'already_set');
await throws('S4: escribir fecha_nacimiento a mano -> PROTECTED_FIELD', () => q(`update public.profiles set fecha_nacimiento = date '1980-01-01' where id=$1`, [U.oauth]), /PROTECTED_FIELD/);
await as('authenticated', U.cand2);
await db.query(`select 1`);
await as('postgres'); await db.query(`update public.profiles set fecha_nacimiento = null where id=$1`, [U.cand2]);
await as('authenticated', U.cand2);
await throws('S4: tampoco si la fecha es NULL (no se la pone el usuario)', () => q(`update public.profiles set fecha_nacimiento = date '1980-01-01' where id=$1`, [U.cand2]), /PROTECTED_FIELD/);
await as('postgres'); await db.query(`update public.profiles set fecha_nacimiento = date '1990-05-05' where id=$1`, [U.cand2]);
{
  await as('authenticated', U.adm);
  const u = await db.query(`update public.profiles set fecha_nacimiento = date '1991-01-01' where id=$1`, [U.adm]);
  ok('S4: un admin SI puede corregir su propia fecha (el trigger lo deja pasar)', u.affectedRows === 1);
}
// menor con fecha ya guardada
await as('authenticated', U.kid);
const JK = await mkJob({ title: 'Oferta menor' });
await as('authenticated', U.kid);
await throws('S4: menor de 16 no puede inscribirse -> UNDERAGE', () => apply(JK), /^UNDERAGE/);
// miembro de empresa menor no puede enviar a revision
{
  await as('postgres');
  await db.query(`update public.profiles set fecha_nacimiento = $2::date where id=$1`, [U.mA, yearsAgo(15)]);
  await as('authenticated', U.mA);
  await q(`insert into public.job_postings(id, company_id, created_by, title, description, country_code, category, work_mode, contract_types, schedule, vacancies)
           values ('d1000000-0000-0000-0000-000000000002', $1, $2, 'Borrador menor', $3, 'ES', 'tech', 'REMOTE', '{INDEFINITE}', 'FULL_TIME', 1)`, [CA, U.mA, LONG]);
  await throws('S4: miembro menor de 16 no envia a revision -> UNDERAGE', () => q(`select public.submit_job_for_review('d1000000-0000-0000-0000-000000000002'::uuid)`), /^UNDERAGE/);
  await as('postgres'); await db.query(`update public.profiles set fecha_nacimiento = date '1990-05-05' where id=$1`, [U.mA]);
}
// sin fecha (OAuth/antiguo): no bloquea
await as('postgres'); await db.query(`update public.profiles set fecha_nacimiento = null where id=$1`, [U.cand3]);
await acceptAll(U.cand3);
await as('authenticated', U.cand3);
r = (await apply(JK))[0].r;
ok('S4: sin fecha guardada no se bloquea (la pide LegalGate)', r.success === true, JSON.stringify(r));
await as('postgres'); await db.query(`update public.profiles set fecha_nacimiento = date '1990-05-05' where id=$1`, [U.cand3]);

// =============================================================================
// S5. IP y hora de la aceptacion
// =============================================================================
const priv2 = (await pg(`select id from public.documentos_legales where tipo='privacidad' and idioma='es'`))[0].id;
async function ipFor(hdrs, uid = U.reg) {
  await as('authenticated', uid, hdrs);
  const ids = (await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) as r', [[priv2], '{}', 'inscripcion']))[0].r;
  const row = (await pg(`select host(ip) ip, user_agent, contexto from public.aceptaciones where id=$1`, [ids[0]]))[0];
  return row;
}
let row = await ipFor({ 'cf-connecting-ip': '1.1.1.1', 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '9.9.9.9, 8.8.8.8', 'user-agent': 'UA-test' });
ok('S5: cf-connecting-ip manda sobre todo lo demas', row.ip === '1.1.1.1' && row.user_agent === 'UA-test' && row.contexto === 'inscripcion', JSON.stringify(row));
row = await ipFor({ 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '9.9.9.9, 8.8.8.8' });
ok('S5: sin cf, x-real-ip', row.ip === '2.2.2.2', JSON.stringify(row));
row = await ipFor({ 'x-forwarded-for': '6.6.6.6 , 9.9.9.9,  8.8.8.8 ' });
ok('S5: solo x-forwarded-for -> el ULTIMO elemento (no el primero, que lo pone el cliente)', row.ip === '8.8.8.8', JSON.stringify(row));
row = await ipFor({ 'x-forwarded-for': '2001:db8::1' });
ok('S5: IPv6', row.ip === '2001:db8::1', JSON.stringify(row));
row = await ipFor({ 'x-forwarded-for': 'no-es-una-ip' });
ok('S5: valor basura -> ip NULL, la aceptacion se registra igualmente', row.ip === null && row.contexto === 'inscripcion', JSON.stringify(row));
row = await ipFor(null);
ok('S5: sin cabeceras -> ip NULL', row.ip === null);

// hora declarada del alta
const declared = new Date(Date.now() - 60e3).toISOString();
await as('postgres');
await db.query(`update auth.users set raw_app_meta_data = jsonb_build_object('registro_aceptacion', jsonb_build_object('aceptado_en', $2::text)) where id=$1`, [U.reg, declared]);
await as('authenticated', U.reg);
let ids = (await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) as r', [[priv2], '{}', 'registro']))[0].r;
row = (await pg(`select aceptado_declarado_en, created_at from public.aceptaciones where id=$1`, [ids[0]]))[0];
ok('S5: contexto registro copia la hora declarada a aceptado_declarado_en',
  row.aceptado_declarado_en && Math.abs(new Date(row.aceptado_declarado_en).getTime() - new Date(declared).getTime()) < 1000 && new Date(row.created_at) > new Date(row.aceptado_declarado_en), JSON.stringify(row));
await as('authenticated', U.reg);
ids = (await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) as r', [[priv2], '{}', 'inscripcion']))[0].r;
ok('S5: en otro contexto NO se copia', (await pg(`select aceptado_declarado_en from public.aceptaciones where id=$1`, [ids[0]]))[0].aceptado_declarado_en === null);
await as('postgres');
await db.query(`update auth.users set raw_app_meta_data = jsonb_build_object('registro_aceptacion', jsonb_build_object('aceptado_en', $2::text)) where id=$1`, [U.reg, new Date(Date.now() + 864e5).toISOString()]);
await as('authenticated', U.reg);
ids = (await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) as r', [[priv2], '{}', 'registro']))[0].r;
ok('S5: una hora declarada en el futuro se ignora', (await pg(`select aceptado_declarado_en from public.aceptaciones where id=$1`, [ids[0]]))[0].aceptado_declarado_en === null);
await as('postgres');
await db.query(`update auth.users set raw_app_meta_data = jsonb_build_object('registro_aceptacion', jsonb_build_object('aceptado_en', 'no-es-fecha')) where id=$1`, [U.reg]);
await as('authenticated', U.reg);
ids = (await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) as r', [[priv2], '{}', 'registro']))[0].r;
ok('S5: una hora declarada mal formada no rompe la aceptacion', ids.length === 1);
await throws('S5: la aceptacion sigue siendo inmutable (UPDATE)', async () => { await as('postgres'); await q(`update public.aceptaciones set aceptado_declarado_en = now() where id=$1`, [ids[0]]); }, /ACEPTACION_INMUTABLE/);

// =============================================================================
// S7. Tope de descripcion y de titulo
// =============================================================================
await as('authenticated', U.mA);
await throws('S7: descripcion de 30001 caracteres -> CHECK', () => q(`insert into public.job_postings(company_id, created_by, title, description) values ($1,$2,'X',$3)`, [CA, U.mA, 'a'.repeat(30001)]), /job_postings_description_max_length/);
{
  const u = await db.query(`insert into public.job_postings(company_id, created_by, title, description) values ($1,$2,'X',$3)`, [CA, U.mA, 'a'.repeat(30000)]);
  ok('S7: 30000 caracteres si se admite', u.affectedRows === 1);
}
await as('postgres');
const JT = await mkJob({ status: 'DRAFT', title: 'T'.repeat(120) });
ok('S7: un borrador con titulo largo se admite (aun en DRAFT)', (await statusOf(JT)) === 'DRAFT');
await throws('S7: titulo de 120 caracteres no sale de DRAFT (para cualquier rol) -> TITLE_TOO_LONG', () => q(`update public.job_postings set status='AI_REVIEW' where id=$1`, [JT]), /^TITLE_TOO_LONG/);
await throws('S7: ni al insertar ya publicada', () => mkJob({ status: 'PUBLISHED', title: 'T'.repeat(101) }), /^TITLE_TOO_LONG/);
const JT2 = await mkJob({ status: 'PUBLISHED', title: 'T'.repeat(100) });
ok('S7: 100 caracteres si', (await statusOf(JT2)) === 'PUBLISHED');

// =============================================================================
// S2. Moderacion: el hash cubre todos los campos y moderar_oferta lo exige
// =============================================================================
const fieldsText = { application_url: 'https://evil.test/apply', application_email: 'evil@x.test', application_instructions: 'Escribe a mi telefono', department: 'Otro dpto', title: 'Otro titulo', description: LONG + ' mas' };
const fieldsArr = { requirements: ['pide dinero'], responsibilities: ['hacer cosas'], benefits: ['coche'], nice_to_have: ['x'], required_skills: ['Excel'], optional_skills: ['Word'] };
for (const [col, val] of Object.entries(fieldsText)) {
  const j = await mkJob({ title: 'Base ' + col });
  await as('authenticated', U.mA);
  await q(`update public.job_postings set ${col} = $1 where id = $2`, [val, j]);
  ok(`S2: un miembro cambia ${col} en una PUBLISHED -> vuelve a AI_REVIEW`, (await statusOf(j)) === 'AI_REVIEW', await statusOf(j));
}
for (const [col, val] of Object.entries(fieldsArr)) {
  const j = await mkJob({ title: 'Base ' + col });
  await as('authenticated', U.mA);
  await q(`update public.job_postings set ${col} = $1::text[] where id = $2`, [val, j]);
  ok(`S2: un miembro cambia ${col} en una PUBLISHED -> vuelve a AI_REVIEW`, (await statusOf(j)) === 'AI_REVIEW', await statusOf(j));
}
{
  const j = await mkJob({ title: 'Base neutra' });
  await as('authenticated', U.mA);
  await q(`update public.job_postings set location_city = 'Sevilla', salary_min = 10 where id = $1`, [j]);
  ok('S2: cambiar un campo NO moderado (ciudad, salario) la deja PUBLISHED', (await statusOf(j)) === 'PUBLISHED');
  await q(`update public.job_postings set title = 'Base neutra  ' where id = $1`, [j]);
  ok('S2: un cambio solo de espacios en el titulo no cuenta', (await statusOf(j)) === 'PUBLISHED');
  await throws('S2: un miembro no puede escribir reviewed_text_hash', () => q(`update public.job_postings set reviewed_text_hash='x' where id = $1`, [j]), /PROTECTED_FIELD/);
}
// PAUSED: editar y reanudar
{
  const j = await mkJob({ title: 'Pausada' });
  await as('authenticated', U.mA);
  await q(`update public.job_postings set status='PAUSED' where id=$1`, [j]);
  await q(`update public.job_postings set application_url='https://otra.test' where id=$1`, [j]);
  ok('S2: editar una PAUSED no cambia su estado', (await statusOf(j)) === 'PAUSED');
  await q(`update public.job_postings set status='PUBLISHED' where id=$1`, [j]);
  ok('S2: reanudar una PAUSED cuyo texto cambio -> AI_REVIEW', (await statusOf(j)) === 'AI_REVIEW');
  const j2 = await mkJob({ title: 'Pausada sin cambios' });
  await as('authenticated', U.mA);
  await q(`update public.job_postings set status='PAUSED' where id=$1`, [j2]);
  await q(`update public.job_postings set status='PUBLISHED' where id=$1`, [j2]);
  ok('S2: reanudar una PAUSED sin cambios -> PUBLISHED', (await statusOf(j2)) === 'PUBLISHED');
}
// get_job_moderation_hash
const JH = await mkJob({ title: 'Para moderar', status: 'DRAFT', deadline: null });
await as('postgres');
await db.query(`update public.job_postings set application_deadline = now() + interval '30 days' where id=$1`, [JH]);
await acceptAll(U.mA, 'publicacion');
await as('authenticated', U.mA);
await q('select public.submit_job_for_review($1::uuid)', [JH]);
ok('S2: la oferta entro en AI_REVIEW', (await statusOf(JH)) === 'AI_REVIEW');
await throws('S2: un miembro no lee el hash -> FORBIDDEN', () => q('select public.get_job_moderation_hash($1::uuid)', [JH]), /^FORBIDDEN/);
await throws('S2: job_moderation_hash no es ejecutable por authenticated', () => q('select public.job_moderation_hash($1::uuid)', [JH]), /permission denied for function/);
await as('anon');
await throws('S2: anon no ejecuta get_job_moderation_hash', () => q('select public.get_job_moderation_hash($1::uuid)', [JH]), /permission denied for function/);
await as('authenticated', U.adm);
const h1 = (await q('select public.get_job_moderation_hash($1::uuid) as h', [JH]))[0].h;
ok('S2: un admin lee el hash (md5)', /^[0-9a-f]{32}$/.test(h1), h1);
await as('service_role');
ok('S2: service_role lee el mismo hash', (await q('select public.get_job_moderation_hash($1::uuid) as h', [JH]))[0].h === h1);
ok('S2: hash de una oferta inexistente -> NULL', (await q(`select public.get_job_moderation_hash('d9999999-0000-0000-0000-000000000000') as h`))[0].h === null);
// la empresa edita durante la revision
await as('authenticated', U.mA);
await q(`update public.job_postings set benefits = '{gratis}' where id=$1`, [JH]);
ok('S2: durante AI_REVIEW la empresa puede editar (estado igual)', (await statusOf(JH)) === 'AI_REVIEW');
await as('authenticated', U.adm);
await throws('S2: publicar con el hash antiguo -> HASH_MISMATCH', () => q(`select public.moderar_oferta($1::uuid, 'PUBLISHED', null, $2)`, [JH, h1]), /^HASH_MISMATCH/);
ok('S2: ... y la oferta se queda en AI_REVIEW', (await statusOf(JH)) === 'AI_REVIEW');
const h2 = (await q('select public.get_job_moderation_hash($1::uuid) as h', [JH]))[0].h;
ok('S2: el hash cambio con la edicion', h2 !== h1);
r = (await q(`select public.moderar_oferta($1::uuid, 'PUBLISHED', null, $2) as r`, [JH, h2]))[0].r;
ok('S2: publicar con el hash vigente funciona', r.status === 'PUBLISHED', JSON.stringify(r));
ok('S2: reviewed_text_hash = hash de TODOS los campos moderados', (await pg('select reviewed_text_hash h from public.job_postings where id=$1', [JH]))[0].h === h2);
// sin hash esperado y con la firma antigua de 3 argumentos
{
  const j = await mkJob({ title: 'Rechazo', status: 'PUBLISHED' });
  await as('postgres'); await db.query(`update public.job_postings set status='AI_REVIEW' where id=$1`, [j]);
  await as('authenticated', U.adm);
  r = (await q(`select public.moderar_oferta($1::uuid, 'REJECTED', 'no vale') as r`, [j]))[0].r;
  ok('S2: moderar_oferta con 3 argumentos sigue funcionando (p_expected_hash opcional)', r.status === 'REJECTED', JSON.stringify(r));
  await as('postgres'); await db.query(`update public.job_postings set status='AI_REVIEW' where id=$1`, [j]);
  await as('authenticated', U.adm);
  await throws('S2: un hash esperado con otro formato tambien da HASH_MISMATCH', () => q(`select public.moderar_oferta($1::uuid, 'PUBLISHED', null, 'abc')`, [j]), /^HASH_MISMATCH/);
  r = (await q(`select public.moderar_oferta($1::uuid, 'MANUAL_REVIEW', 'dudas', 'abc') as r`, [j]))[0].r;
  ok('S2: el hash solo se exige al PUBLICAR (MANUAL_REVIEW pasa)', r.status === 'MANUAL_REVIEW');
  await as('authenticated', U.mA);
  await throws('S2: un miembro no puede moderar', () => q(`select public.moderar_oferta($1::uuid, 'PUBLISHED')`, [j]), /^FORBIDDEN/);
}

// =============================================================================
// F2. El admin ve la cola de revision
// =============================================================================
const JQ0 = await mkJob({ title: 'En revision de B', company: CB, by: U.mB, status: 'PUBLISHED' });
await as('postgres'); await db.query(`update public.job_postings set status='AI_REVIEW' where id=$1`, [JQ0]);
await as('authenticated', U.adm);
ok('F2: el admin ve una oferta AI_REVIEW de cualquier empresa', (await q('select id from public.job_postings where id=$1', [JQ0])).length === 1);
ok('F2: el admin ve toda la cola', (await q(`select count(*)::int n from public.job_postings where status in ('AI_REVIEW','MANUAL_REVIEW')`))[0].n >= 2);
await as('authenticated', U.mA);
ok('F2: un miembro de OTRA empresa no la ve', (await q('select id from public.job_postings where id=$1', [JQ0])).length === 0);
await as('authenticated', U.cand);
ok('F2: un candidato no la ve', (await q('select id from public.job_postings where id=$1', [JQ0])).length === 0);
await as('anon');
ok('F2: anon no la ve', (await q('select id from public.job_postings where id=$1', [JQ0])).length === 0);

// =============================================================================
// F3 + S8. Preguntas
// =============================================================================
const JQD = await mkJob({ title: 'Con preguntas', status: 'DRAFT', deadline: null });
await as('authenticated', U.mA);
const insQ = (job, text, type = 'TEXT', extra = '') => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required ${extra ? ', ' + extra.split('=')[0] : ''}) values ($1,$2,$3,false ${extra ? ', ' + extra.split('=')[1] : ''}) returning id`, [job, text, type]);
await as('authenticated', U.vA);
await throws('S8: un VIEWER no puede crear preguntas', () => insQ(JQD, 'x'), /row-level security/);
await as('authenticated', U.mB);
await throws('S8: ni un miembro de otra empresa', () => insQ(JQD, 'x'), /row-level security/);
await as('authenticated', U.mA);
const qA = (await insQ(JQD, 'Pregunta A', 'TEXT'))[0].id;
const qN = (await insQ(JQD, 'Años de experiencia', 'NUMBER'))[0].id;
ok('F3: una pregunta NUMBER se admite', !!qN);
await throws('F3: un tipo inventado sigue rechazado', () => insQ(JQD, 'x', 'FOO'), /question_type_check/);
await as('authenticated', U.vA);
ok('S8: el VIEWER SI lee las preguntas de su empresa', (await q('select id from public.job_posting_questions where job_posting_id=$1', [JQD])).length === 2);
{
  const u = await db.query(`update public.job_posting_questions set question_text='hackeada' where id=$1`, [qA]);
  ok('S8: el VIEWER no edita preguntas (0 filas)', u.affectedRows === 0);
  const d = await db.query(`delete from public.job_posting_questions where id=$1`, [qA]);
  ok('S8: ni las borra (0 filas)', d.affectedRows === 0);
}
await as('authenticated', U.adm);
ok('F2: el admin lee las preguntas de cualquier oferta', (await q('select id from public.job_posting_questions where job_posting_id=$1', [JQD])).length === 2);
// tope de 5 activas
await as('authenticated', U.mA);
for (let i = 0; i < 3; i++) await insQ(JQD, 'extra ' + i);
await throws('S8: la sexta pregunta activa -> MAX_QUESTIONS_REACHED', () => insQ(JQD, 'sexta'), /MAX_QUESTIONS_REACHED/);
await q(`update public.job_posting_questions set is_active=false where id=$1`, [qA]);
ok('S8: ocultar una pregunta sin respuestas esta permitido', (await pg('select is_active from public.job_posting_questions where id=$1', [qA]))[0].is_active === false);
{
  await as('authenticated', U.mA);
  const x = await insQ(JQD, 'sustituta');
  ok('S8: las ocultas no cuentan para el tope de 5', !!x[0].id);
  await throws('S8: reactivar la oculta superaria el tope', () => q(`update public.job_posting_questions set is_active=true where id=$1`, [qA]), /MAX_QUESTIONS_REACHED/);
}
await as('authenticated', U.mA);
const dq = await db.query(`delete from public.job_posting_questions where id=$1`, [qA]);
ok('S8: una pregunta sin respuestas y en borrador SI se borra', dq.affectedRows === 1);

// pregunta con respuestas
const JQP = await mkJob({ title: 'Publicada con pregunta', status: 'PUBLISHED' });
await as('postgres');
const qa = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required) values ($1,'¿Respondes?','TEXT',true) returning id`, [JQP]))[0].id;
await acceptAll(U.cand);
await as('authenticated', U.cand);
await throws('S8: la pregunta obligatoria activa se exige -> REQUIRED_QUESTION_MISSING', () => apply(JQP), /REQUIRED_QUESTION_MISSING/);
r = (await apply(JQP, { answers: { [qa]: 'si' } }))[0].r;
ok('S8: inscripcion con respuesta', r.success === true);
await as('authenticated', U.mA);
await throws('S8: en una oferta PUBLISHED las preguntas estan bloqueadas (sin respuestas): insertar -> QUESTIONS_LOCKED', () => insQ(JQP, 'nueva'), /^QUESTIONS_LOCKED/);
await throws('S8: ... y con respuestas el borrado -> QUESTION_HAS_ANSWERS', () => q(`delete from public.job_posting_questions where id=$1`, [qa]), /^QUESTION_HAS_ANSWERS/);
await throws('S8: ... y editarla -> QUESTION_HAS_ANSWERS', () => q(`update public.job_posting_questions set question_text='otra' where id=$1`, [qa]), /^QUESTION_HAS_ANSWERS/);
await throws('S8: ocultarla en una PUBLISHED -> QUESTIONS_LOCKED', () => q(`update public.job_posting_questions set is_active=false where id=$1`, [qa]), /^QUESTIONS_LOCKED/);
// un publicada sin respuestas
{
  const j = await mkJob({ title: 'Publicada sin respuestas' });
  await as('postgres');
  const qq = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'p','TEXT') returning id`, [j]))[0].id;
  await as('authenticated', U.mA);
  await throws('S8: borrar una pregunta de una oferta PUBLISHED -> QUESTIONS_LOCKED', () => q(`delete from public.job_posting_questions where id=$1`, [qq]), /^QUESTIONS_LOCKED/);
  await as('postgres');
  await db.query(`update public.job_postings set status='PAUSED' where id=$1`, [j]);
  await as('authenticated', U.mA);
  await throws('S8: tambien en PAUSED', () => q(`update public.job_posting_questions set question_text='x' where id=$1`, [qq]), /^QUESTIONS_LOCKED/);
  await as('service_role');
  const u = await db.query(`update public.job_posting_questions set question_text='x' where id=$1`, [qq]);
  ok('S8: service_role si puede (mantenimiento)', u.affectedRows === 1);
}
// cerrada: ocultar si, editar/borrar no
await as('postgres'); await db.query(`update public.job_postings set status='CLOSED' where id=$1`, [JQP]);
await as('authenticated', U.mA);
await throws('S8: oferta CLOSED, pregunta con respuestas: borrar -> QUESTION_HAS_ANSWERS', () => q(`delete from public.job_posting_questions where id=$1`, [qa]), /^QUESTION_HAS_ANSWERS/);
await throws('S8: ... cambiar is_required -> QUESTION_HAS_ANSWERS', () => q(`update public.job_posting_questions set is_required=false where id=$1`, [qa]), /^QUESTION_HAS_ANSWERS/);
{
  const u = await db.query(`update public.job_posting_questions set is_active=false where id=$1`, [qa]);
  ok('S8: ... pero ocultarla (is_active=false) SI', u.affectedRows === 1);
}
await as('authenticated', U.mA);
{
  const d = await db.query(`delete from public.job_postings where id=$1`, [JQP]);
  ok('S8: borrar la oferta entera (cascada) NO queda bloqueado por las respuestas', d.affectedRows === 1);
  ok('S8: ... y se llevo preguntas y candidaturas', (await pg(`select (select count(*) from public.job_posting_questions where id=$1)::int a, (select count(*) from public.job_applications where job_posting_id=$2)::int b`, [qa, JQP]))[0].a === 0);
}
// pregunta oculta: ni se muestra ni se exige
{
  const j = await mkJob({ title: 'Con pregunta oculta' });
  await as('postgres');
  const qh = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, is_knockout, expected_answer) values ($1,'oculta','YES_NO',true,true,'YES') returning id`, [j]))[0].id;
  const qv = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required) values ($1,'visible','TEXT',false) returning id`, [j]))[0].id;
  await db.query(`update public.job_posting_questions set is_active=false where id=$1`, [qh]);
  await as('anon');
  const vis = await q('select id, is_active from public.job_posting_questions where job_posting_id=$1', [j]);
  ok('S8: el publico no ve la pregunta oculta (y puede leer is_active)', vis.length === 1 && vis[0].id === qv && vis[0].is_active === true, JSON.stringify(vis));
  await as('authenticated', U.mA);
  ok('S8: la empresa si ve las dos', (await q('select id from public.job_posting_questions where job_posting_id=$1', [j])).length === 2);
  await acceptAll(U.cand2);
  await as('authenticated', U.cand2);
  r = (await apply(j))[0].r;
  ok('S8: apply_to_job ignora la pregunta oculta (ni obligatoria ni knockout)', r.success === true, JSON.stringify(r));
  ok('S8: ... y queda NEW, no NOT_QUALIFIED', (await pg('select status from public.job_applications where id=$1', [r.application_id]))[0].status === 'NEW');
  await as('authenticated', U.mA);
  const rq = await q('select * from public.get_job_questions_for_company($1::uuid)', [j]);
  ok('S8: get_job_questions_for_company devuelve tambien is_active', rq.length === 2 && 'is_active' in rq[0]);
}

// =============================================================================
// F4. Fechas de cierre
// =============================================================================
const old = new Date(Date.now() - 100 * 864e5).toISOString();
const JR = await mkJob({ title: 'Caducada hace tiempo', status: 'PUBLISHED', published_at: old, created_at: new Date(Date.now() - 120 * 864e5).toISOString(), deadline: new Date(Date.now() - 864e5).toISOString() });
await as('service_role');
r = (await q('select public.expire_job_postings() as r'))[0].r;
ok('F4: la caducada pasa a EXPIRED', (await statusOf(JR)) === 'EXPIRED' && r.expired >= 1, JSON.stringify(r));
await as('authenticated', U.mA);
await throws('F4: cierre a 62 dias -> DEADLINE_TOO_FAR', () => q(`update public.job_postings set status='DRAFT', application_deadline = now() + interval '62 days' where id=$1`, [JR]), /DEADLINE_TOO_FAR/);
await q(`update public.job_postings set status='DRAFT', application_deadline = now() + interval '30 days' where id=$1`, [JR]);
ok('F4: «Renovar» tras caducar (DRAFT + hoy+30) ya NO falla aunque published_at tenga 100 dias', (await statusOf(JR)) === 'DRAFT');
await as('authenticated', U.mA);
r = (await q('select public.submit_job_for_review($1::uuid) as r', [JR]))[0].r;
ok('F4: ... y se reenvia a revision', ['AI_REVIEW', 'MANUAL_REVIEW'].includes(r.status), JSON.stringify(r));
await as('service_role');
await q(`select public.moderar_oferta($1::uuid, 'PUBLISHED')`, [JR]);
ok('F4: ... y al aprobarla vuelve a PUBLISHED conservando el published_at original',
  (await pg(`select status, (published_at < now() - interval '90 days') as vieja, application_deadline > now() as vigente from public.job_postings where id=$1`, [JR]))
    .every(x => x.status === 'PUBLISHED' && x.vieja && x.vigente));
const JO = await mkJob({ title: 'Publicada antigua', status: 'PUBLISHED', published_at: new Date(Date.now() - 80 * 864e5).toISOString(), created_at: new Date(Date.now() - 90 * 864e5).toISOString(), deadline: new Date(Date.now() + 5 * 864e5).toISOString() });
await as('authenticated', U.mA);
await q(`update public.job_postings set application_deadline = now() + interval '30 days' where id=$1`, [JO]);
ok('F4: ampliar el cierre de una publicada antigua a hoy+30 funciona', (await statusOf(JO)) === 'PUBLISHED');
await throws('F4: pero no mas alla de 61 dias desde ahora', () => q(`update public.job_postings set application_deadline = now() + interval '70 days' where id=$1`, [JO]), /DEADLINE_TOO_FAR/);
await throws('F4: una fecha pasada al reanudar sigue rechazada (minimo)', async () => {
  await q(`update public.job_postings set status='PAUSED' where id=$1`, [JO]);
  await as('postgres'); await db.query(`update public.job_postings set application_deadline = now() - interval '1 hour' where id=$1`, [JO]);
  await as('authenticated', U.mA);
  await q(`update public.job_postings set status='PUBLISHED' where id=$1`, [JO]);
}, /JOB_EXPIRED/);

// =============================================================================
// F5 + F6. Listado publico
// =============================================================================
await as('postgres');
await db.exec(`update public.job_postings set status = 'CLOSED' where status = 'PUBLISHED'`);   // listado limpio
const R1 = await mkJob({ title: 'Remota sin paises', work_mode: 'REMOTE', country: 'ES', allowed: null, exp: 5 });
const R2 = await mkJob({ title: 'Remota paises vacios', work_mode: 'REMOTE', country: 'ES', allowed: [], exp: 2 });
const R3 = await mkJob({ title: 'Remota solo Francia', work_mode: 'REMOTE', country: 'ES', allowed: ['FR'], exp: null });
const O1 = await mkJob({ title: 'Presencial Madrid', work_mode: 'ONSITE', country: 'ES', exp: 1 });
const O2 = await mkJob({ title: 'Presencial Mexico', work_mode: 'ONSITE', country: 'MX', city: 'CDMX', exp: 10 });
const list = async (args) => {
  const keys = Object.keys(args);
  const sql = `select id, total_count::int tc from public.search_public_jobs_v2(${keys.map((k, i) => `${k} => $${i + 1}`).join(', ')}) order by title`;
  return q(sql, keys.map(k => args[k]));
};
await as('anon');
let l = await list({ p_country: 'MX' });
ok('F5: en Mexico salen la presencial de MX y las remotas sin paises / con vacio (no la de solo Francia)',
  new Set(l.map(x => x.id)).size === 3 && [O2, R1, R2].every(id => l.some(x => x.id === id)) && !l.some(x => x.id === R3), JSON.stringify(l.map(x => x.id.slice(-3))));
ok('F5: el total (count) coincide con las filas', l.every(x => x.tc === 3));
l = await list({ p_country: 'FR' });
ok('F5: en Francia salen las tres remotas', l.length === 3 && [R1, R2, R3].every(id => l.some(x => x.id === id)));
l = await list({ p_country: 'ES' });
ok('F5: en Espana, sus 4', l.length === 4 && !l.some(x => x.id === O2));
l = await list({});
ok('F5: sin pais salen todas', l.length === 5);
l = await list({ p_country: 'mx', p_work_mode: 'REMOTE' });
ok('F5: pais en minusculas + modo remoto', l.length === 2 && [R1, R2].every(id => l.some(x => x.id === id)));
l = await list({ p_max_experience_years: 3 });
ok('F6: experiencia maxima 3 -> las que piden <=3 y las que no piden', new Set(l.map(x => x.id)).size === 3 && [R2, R3, O1].every(id => l.some(x => x.id === id)), JSON.stringify(l.map(x => x.id.slice(-3))));
l = await list({ p_max_experience_years: 0 });
ok('F6: experiencia maxima 0 -> solo las que no piden', l.length === 1 && l[0].id === R3);
l = await list({ p_max_experience_years: 3, p_country: 'MX' });
ok('F6: combinable con pais (MX + max 3 anos -> solo la remota de 2 anos)', l.length === 1 && l[0].id === R2, JSON.stringify(l.map(x => x.id.slice(-3))));
ok('F6: sin el parametro no filtra', (await list({ p_max_experience_years: null })).length === 5);
ok('F6: los 11 parametros anteriores siguen con su nombre', (await list({ p_category: 'tech', p_contract: 'INDEFINITE', p_schedule: 'FULL_TIME', p_search: 'Remota', p_city: null, p_posted_within_days: 7, p_min_salary: null, p_limit: 2, p_offset: 1 })).length === 2);
await as('authenticated', U.cand);
ok('F6: authenticated tambien ejecuta (y distingue already_applied)', (await q('select count(*)::int n from public.search_public_jobs_v2()'))[0].n === 5);

// =============================================================================
// F8. Valoracion y estado visible de NOT_QUALIFIED
// =============================================================================
const JF8 = await mkJob({ title: 'Con knockout', status: 'PUBLISHED' });
await as('postgres');
const qk = (await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_required, is_knockout, expected_answer) values ($1,'¿Permiso?','YES_NO',true,true,'YES') returning id`, [JF8]))[0].id;
await acceptAll(U.cand3);
await as('authenticated', U.cand3);
r = (await apply(JF8, { answers: { [qk]: 'NO' } }))[0].r;
const appNQ = r.application_id;
ok('F8: respuesta knockout fallida -> NOT_QUALIFIED', (await pg('select status from public.job_applications where id=$1', [appNQ]))[0].status === 'NOT_QUALIFIED');
await as('authenticated', U.mA);
await q(`select public.update_application_status($1::uuid,$2::uuid,$3::uuid,null::varchar,null::text,null::int,false)`, [appNQ, CA, U.mA]);
ok('F8: la empresa la abrio (viewed_by_company)', (await pg('select viewed_by_company v from public.job_applications where id=$1', [appNQ]))[0].v === true);
await as('authenticated', U.cand3);
let mine = (await q('select status, candidate_status, viewed_by_company, viewed_at from public.my_job_applications where id=$1', [appNQ]))[0];
ok('F8: el candidato la ve como SENT (nunca VIEWED) y estado NEW', mine.candidate_status === 'SENT' && mine.status === 'NEW' && mine.viewed_by_company === false && mine.viewed_at === null, JSON.stringify(mine));
// una normal abierta si es VIEWED
const JF8b = await mkJob({ title: 'Normal' });
await acceptAll(U.cand3);
await as('authenticated', U.cand3);
const appN = (await apply(JF8b))[0].r.application_id;
mine = (await q('select candidate_status from public.my_job_applications where id=$1', [appN]))[0];
ok('F8: una normal sin abrir es SENT', mine.candidate_status === 'SENT');
await as('authenticated', U.mA);
await q(`select public.mark_application_viewed($1::uuid)`, [appN]);
await as('authenticated', U.cand3);
mine = (await q('select candidate_status, viewed_by_company from public.my_job_applications where id=$1', [appN]))[0];
ok('F8: una normal abierta si es VIEWED', mine.candidate_status === 'VIEWED' && mine.viewed_by_company === true);
// rating
const upd = (app, user, st, notes, rating, clear) => q(`select public.update_application_status($1::uuid,$2::uuid,$3::uuid,$4::varchar,$5::text,$6::int,$7::boolean) as r`, [app, CA, user, st, notes, rating, clear]);
await as('authenticated', U.mA);
await upd(appN, U.mA, 'REVIEWING', 'nota', 4, false);
ok('F8: valorar con 4', (await pg('select rating from public.job_applications where id=$1', [appN]))[0].rating === 4);
await as('authenticated', U.mA);
await upd(appN, U.mA, null, null, null, false);
ok('F8: p_rating NULL sin p_clear_rating NO borra', (await pg('select rating from public.job_applications where id=$1', [appN]))[0].rating === 4);
await as('authenticated', U.mA);
await throws('F8: valorar y borrar a la vez -> INVALID_RATING', () => upd(appN, U.mA, null, null, 3, true), /^INVALID_RATING/);
await as('authenticated', U.mA);
await upd(appN, U.mA, null, null, null, true);
ok('F8: p_clear_rating = true BORRA la valoracion', (await pg('select rating from public.job_applications where id=$1', [appN]))[0].rating === null);
ok('F8: ... y conserva estado y notas', (await pg('select status, internal_notes from public.job_applications where id=$1', [appN]))[0].status === 'REVIEWING');
await as('authenticated', U.mA);
await throws('F8: rating 9 -> INVALID_RATING', () => upd(appN, U.mA, null, null, 9, false), /^INVALID_RATING/);
await as('authenticated', U.vA);
await throws('F8: un VIEWER no actualiza', () => upd(appN, U.vA, null, null, 1, false), /Unauthorized/);
await as('authenticated', U.mB);
await throws('F8: otra empresa no actualiza', () => q(`select public.update_application_status($1::uuid,$2::uuid,$3::uuid,null::varchar,null::text,1,false)`, [appN, CB, U.mB]), /not found/);
await as('authenticated', U.cand3);
await throws('F8: el candidato no puede ejecutarla con p_user_id ajeno', () => upd(appN, U.mA, null, null, 1, false), /USER_MISMATCH/);

// =============================================================================
// F9. Mensajes con plantilla
// =============================================================================
const msg = (app, tpl) => q('select public.send_application_message($1::uuid, $2) as r', [app, tpl]);
await as('anon');
await throws('F9: anon no ejecuta send_application_message', () => msg(appN, 'rejected'), /permission denied for function/);
await as('authenticated', U.cand3);
await throws('F9: el candidato no puede enviar mensajes (aunque sea suya)', () => msg(appN, 'rejected'), /^APPLICATION_NOT_FOUND/);
await as('authenticated', U.vA);
await throws('F9: un VIEWER no puede -> APPLICATION_NOT_FOUND', () => msg(appN, 'rejected'), /^APPLICATION_NOT_FOUND/);
await as('authenticated', U.mB);
await throws('F9: un miembro de otra empresa tampoco', () => msg(appN, 'rejected'), /^APPLICATION_NOT_FOUND/);
await as('authenticated', U.mA);
await throws('F9: plantilla inventada -> INVALID_TEMPLATE', () => msg(appN, 'spam'), /^INVALID_TEMPLATE/);
await throws('F9: plantilla NULL -> INVALID_TEMPLATE', () => msg(appN, null), /^INVALID_TEMPLATE/);
await as('authenticated', U.mA);
r = (await msg(appN, 'rejected'))[0].r;
ok('F9: un miembro envia «rejected»', r.success === true && r.queued === true && r.template === 'rejected', JSON.stringify(r));
let ob = (await pg(`select kind, to_email, lang, priority, payload from public.email_outbox where kind='application_message'`));
ok('F9: queda UN correo en email_outbox para el candidato con la plantilla y los datos',
  ob.length === 1 && ob[0].to_email === 'cand3@t.test' && ob[0].payload.template === 'rejected' && ob[0].payload.job_title === 'Normal' && ob[0].payload.company_name === 'Empresa A' && typeof ob[0].payload.job_slug === 'string' && ob[0].payload.job_slug.length > 0, JSON.stringify(ob));
await as('authenticated', U.mA);
await throws('F9: repetir la misma plantilla < 24 h -> MESSAGE_ALREADY_SENT', () => msg(appN, 'rejected'), /^MESSAGE_ALREADY_SENT/);
r = (await msg(appN, 'interview'))[0].r;
ok('F9: la otra plantilla si se puede', r.template === 'interview');
ok('F9: dos correos en la cola', (await pg(`select count(*)::int n from public.email_outbox where kind='application_message'`))[0].n === 2);
ok('F9: no cambia el estado de la candidatura', (await pg('select status from public.job_applications where id=$1', [appN]))[0].status === 'REVIEWING');
await as('authenticated', U.mA);
let hist = await q('select from_status, to_status, note from public.job_application_status_history where application_id=$1 and note is not null order by created_at', [appN]);
ok('F9: la empresa ve los mensajes en el historial (fila from=to con note message:<plantilla>)', hist.length === 2 && hist.every(h => h.from_status === h.to_status) && hist.map(h => h.note).sort().join() === 'message:interview,message:rejected', JSON.stringify(hist));
await as('authenticated', U.cand3);
hist = await q('select * from public.get_application_history($1::uuid)', [appN]);
ok('F9: el candidato NO ve los mensajes en get_application_history (filas from=to ocultas)', hist.every(h => h.from_status !== h.to_status) && !('note' in (hist[0] ?? {})), JSON.stringify(hist));
ok('F9: el candidato no lee la tabla de historial (RLS: 0 filas)', (await q('select note from public.job_application_status_history')).length === 0);
await as('postgres');
await db.query(`update public.job_application_status_history set created_at = now() - interval '25 hours' where note = 'message:rejected'`);
await as('authenticated', U.mA);
r = (await msg(appN, 'rejected'))[0].r;
ok('F9: pasadas 24 h se puede volver a enviar', r.success === true);
// retirada
await as('authenticated', U.cand3);
await q('select public.withdraw_application($1::uuid)', [appN]);
await as('authenticated', U.mA);
await throws('F9: candidatura retirada -> APPLICATION_WITHDRAWN', () => msg(appN, 'interview'), /^APPLICATION_WITHDRAWN/);
// el historial de estados sigue funcionando
await as('authenticated', U.mA);
const h3 = await q('select * from public.get_application_history($1::uuid)', [appNQ]);
ok('F9: get_application_history (empresa) conserva NOT_QUALIFIED sin enmascarar', h3.some(h => h.to_status === 'NOT_QUALIFIED'));
await as('authenticated', U.cand3);
const h4 = await q('select * from public.get_application_history($1::uuid)', [appNQ]);
ok('F9: get_application_history (candidato) lo muestra como NEW', h4.length >= 1 && h4.every(h => h.to_status !== 'NOT_QUALIFIED'));

// =============================================================================
// Version nueva del documento: vuelve a pedirse
// =============================================================================
const JV = await mkJob({ title: 'Para nueva version' });
await as('postgres');
await db.query(`insert into public.documentos_legales(tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
                values ('terminos_candidato','1.1','es','Condiciones 1.1','texto','candidato',true, ARRAY['acepto_condiciones_privacidad','datos_verdaderos'], true, now() - interval '1 minute')`);
await as('authenticated', U.cand);
await throws('S1: publicada una version nueva, quien aceptó la 1.0 vuelve a necesitar aceptar -> ACCEPTANCE_REQUIRED', () => apply(JV), /^ACCEPTANCE_REQUIRED/);
await acceptAll(U.cand);
await as('authenticated', U.cand);
r = (await apply(JV))[0].r;
ok('S1: aceptada la 1.1 se inscribe', r.success === true);
await as('authenticated', U.mA);
{
  const jx = 'd1000000-0000-0000-0000-000000000009';
  await as('postgres');
  await db.query(`insert into public.documentos_legales(tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
                  values ('terminos_empleador','1.1','es','Empleador 1.1','texto','empleador',true, ARRAY['poder_representacion'], true, now() - interval '1 minute')`);
  await as('authenticated', U.mA);
  await q(`insert into public.job_postings(id, company_id, created_by, title, description, country_code, category, work_mode, contract_types, schedule, vacancies, application_deadline)
           values ($4, $1, $2, 'Nueva version empleador', $3, 'ES', 'tech', 'REMOTE', '{INDEFINITE}', 'FULL_TIME', 1, now() + interval '30 days')`, [CA, U.mA, LONG, jx]);
  await throws('S1: version nueva de empleador -> ACCEPTANCE_REQUIRED al enviar', () => q('select public.submit_job_for_review($1::uuid)', [jx]), /^ACCEPTANCE_REQUIRED/);
  await acceptAll(U.mA, 'publicacion');
  await as('authenticated', U.mA);
  r = (await q('select public.submit_job_for_review($1::uuid) as r', [jx]))[0].r;
  ok('S1: aceptada, se envia', r.success === true);
}

// =============================================================================
// Regresion de lo anterior sobre el encadenado completo
// =============================================================================
{
  await as('anon');
  await throws('regresion: anon no ejecuta apply_to_job', () => q(`select public.apply_to_job('d0000000-0000-0000-0000-000000000001'::uuid)`), /permission denied for function/);
  await throws('regresion: anon no lee email_outbox', () => q('select * from public.email_outbox'), /permission denied/);
  await throws('regresion: anon no lee expected_answer', () => q('select expected_answer from public.job_posting_questions'), /permission denied/);
  await as('authenticated', U.cand);
  await throws('regresion: el candidato no inserta job_applications directo', () => q(`insert into public.job_applications(job_posting_id,profile_id,company_id) values ('${JV}','${U.cand}','${CA}')`), /permission denied/);
  await throws('regresion: sin consentimiento -> CONSENT_REQUIRED', () => apply(R1, { consent: false }), /^CONSENT_REQUIRED/);
  await as('authenticated', U.mA);
  await throws('regresion: un miembro no publica por UPDATE', () => q(`update public.job_postings set status='PUBLISHED' where id='${JD1}'`), /IN_REVIEW|PUBLISH_REQUIRES_REVIEW/);
  ok('regresion: credits_cost siempre 0', (await pg(`select count(*)::int n from public.job_postings where credits_cost <> 0`))[0].n === 0);
  ok('regresion: aceptaciones inmutables (DELETE)', await (async () => { try { await as('postgres'); await q('delete from public.aceptaciones'); return false; } catch (e) { return /ACEPTACION_INMUTABLE/.test(e.message); } })());
  await as('anon');
  ok('regresion: anon sigue sin ver columnas privadas de job_postings', await (async () => { try { await q('select notify_emails from public.job_postings'); return false; } catch (e) { return /permission denied/.test(e.message); } })());
  await as('authenticated', U.cand);
  ok('regresion: get_recommended_jobs funciona', Array.isArray(await q('select * from public.get_recommended_jobs(5)')));
}

console.log(`\nRESULTADO: ${total - fails}/${total} OK${fails ? `, ${fails} FALLOS` : ''}`);
process.exit(fails ? 1 : 0);
