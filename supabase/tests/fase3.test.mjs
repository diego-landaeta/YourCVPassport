// Prueba de 20261031_candidaturas_fase3.sql en PGlite con stubs de la base real.
// Uso: node fase3.test.mjs
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const MIGRATION = HERE + '../migrations/20261031_candidaturas_fase3.sql';
const sql = readFileSync(MIGRATION, 'utf8');
const db = new PGlite();

let total = 0, fails = 0;
process.on('uncaughtException', e => { console.log('FALLO INESPERADO:', String(e.message).slice(0, 400)); console.log(`RESULTADO PARCIAL: ${total - fails}/${total} OK`); process.exit(2); });
process.on('unhandledRejection', e => { console.log('FALLO INESPERADO:', String(e && e.message).slice(0, 400)); console.log(`RESULTADO PARCIAL: ${total - fails}/${total} OK`); process.exit(2); });
function ok(name, cond, extra) {
  total++;
  if (cond) console.log('PASS', name);
  else { fails++; console.log('FAIL', name, extra !== undefined ? '=> ' + String(extra).slice(0, 300) : ''); }
}
async function throws(name, fn, re) {
  try { await fn(); ok(name, false, 'no lanzó error'); }
  catch (e) { ok(name, re.test(e.message), e.message); }
}
const q = async (text, params) => (await db.query(text, params)).rows;
async function as(role, uid) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false), set_config('request.jwt.claim.role', '${role === 'postgres' ? '' : role}', false)`);
  if (role !== 'postgres') await db.exec(`set role ${role}`);
}

// Identidades
const A = '00000000-0000-0000-0000-00000000000a';   // candidato A
const B = '00000000-0000-0000-0000-00000000000b';   // candidato B
const MA = '00000000-0000-0000-0000-0000000000a1';  // miembro (OWNER) empresa A
const VA = '00000000-0000-0000-0000-0000000000a2';  // VIEWER empresa A
const MB = '00000000-0000-0000-0000-0000000000b1';  // miembro (OWNER) empresa B
const ADM = '00000000-0000-0000-0000-0000000000ad'; // admin
const CA = 'c0000000-0000-0000-0000-00000000000a';  // empresa A (APPROVED)
const CB = 'c0000000-0000-0000-0000-00000000000b';  // empresa B (APPROVED)
const CP = 'c0000000-0000-0000-0000-0000000000f0';  // empresa PENDING
const J1 = 'd0000000-0000-0000-0000-000000000001';  // CA, preguntas
const J2 = 'd0000000-0000-0000-0000-000000000002';  // CA, sin preguntas, avisos a 2 correos, resumen diario
const J3 = 'd0000000-0000-0000-0000-000000000003';  // CA, CLOSED
const J4 = 'd0000000-0000-0000-0000-000000000004';  // CP (empresa no verificada)
const J5 = 'd0000000-0000-0000-0000-000000000005';  // CB
const J6 = 'd0000000-0000-0000-0000-000000000006';  // CA, plazo vencido
const J7 = 'd0000000-0000-0000-0000-000000000007';  // CA, para alertas
const J8 = 'd0000000-0000-0000-0000-000000000008';  // CA, carta obligatoria
const J9 = 'd0000000-0000-0000-0000-000000000009';  // CA, DRAFT
const JR1 = 'd0000000-0000-0000-0000-0000000000a1'; // muy afín
const JR2 = 'd0000000-0000-0000-0000-0000000000a2'; // nada afín
const JR3 = 'd0000000-0000-0000-0000-0000000000a3'; // CB, pide máster, 10 años, inglés C1
const Q1 = 'e0000000-0000-0000-0000-000000000001';
const Q2 = 'e0000000-0000-0000-0000-000000000002';
const Q3 = 'e0000000-0000-0000-0000-000000000003';

// -----------------------------------------------------------------------------
// STUBS (definiciones reales de producción leídas con prodsql.mjs, en lo que importa)
// -----------------------------------------------------------------------------
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
grant usage on schema public, auth to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '')::text $$;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, headline text, summary text, slug text, avatar_url text, location text,
  country_code text, linkedin_url text, github_url text, portfolio_url text, website_url text,
  job_seeking_status text, availability text, job_type text[], work_mode text,
  open_to_remote boolean, willing_to_relocate boolean, preferred_locations text[],
  email text, phone text, role text default 'professional', managed_by uuid, is_active boolean default true
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

create table public.companies (id uuid primary key default gen_random_uuid(), company_name varchar(255), company_email varchar(255), logo_url text,
  status varchar(20) not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','SUSPENDED')), created_by uuid);
create table public.company_users (id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, role varchar(20) not null check (role in ('OWNER','ADMIN','MEMBER','VIEWER')));

create or replace function public.current_user_is_admin() returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select lower(p.role) = 'admin' from public.profiles p where p.id = auth.uid()), false); $$;
create or replace function public.is_company_member(p_company_id uuid, p_roles text[] default null) returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.company_users cu where cu.company_id = p_company_id and cu.user_id = auth.uid() and (p_roles is null or cu.role = any (p_roles))); $$;
create or replace function public.assert_caller_matches_user(p_user_id uuid, p_allow_admin boolean default false, p_allow_manager boolean default false)
 returns void language plpgsql stable security definer set search_path to 'public' as $$
declare v_role text := auth.role(); v_uid uuid := auth.uid();
begin
  if v_role = 'service_role' then return; end if;
  if v_role = 'anon' then raise exception 'ANON_NOT_ALLOWED' using errcode = '42501'; end if;
  if v_role = 'authenticated' then
    if v_uid is not null and p_user_id is not distinct from v_uid then return; end if;
    raise exception 'USER_MISMATCH' using errcode = '42501';
  end if;
  return;
end; $$;

create table public.job_postings (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
  company_id uuid not null references public.companies(id) on delete cascade, created_by uuid,
  title varchar(255) not null, slug varchar(255), department varchar(100),
  employment_type varchar(50), work_mode varchar(20), experience_level varchar(20),
  location_city varchar(100), location_state varchar(100), location_country varchar(100), is_remote boolean default false,
  description text, required_skills text[], optional_skills text[],
  salary_min int, salary_max int, salary_currency varchar(3), application_deadline timestamptz,
  status varchar(20) default 'DRAFT', published_at timestamptz, views_count int default 0, applications_count int default 0, credits_cost int default 0, metadata jsonb default '{}'::jsonb,
  constraint job_postings_status_check check (status in ('DRAFT','PUBLISHED','PAUSED','CLOSED','FILLED')),
  constraint job_postings_experience_level_check check (experience_level in ('ENTRY','JUNIOR','MID','SENIOR','LEAD','EXECUTIVE')),
  constraint valid_deadline check (application_deadline is null or application_deadline > created_at)
);
alter table public.job_postings enable row level security;
create policy "Public read access to published jobs" on public.job_postings for select using (status = 'PUBLISHED' and published_at is not null and (application_deadline is null or application_deadline > now()));
create policy "Company members view their own jobs" on public.job_postings for select to authenticated using (exists (select 1 from public.company_users cu where cu.company_id = job_postings.company_id and cu.user_id = auth.uid()));
-- trigger real de 20261007 (publicación)
create or replace function public.job_postings_proteger_publicacion() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon','authenticated') then return new; end if;
  if current_user = 'authenticated' and public.current_user_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'PUBLISHED' then raise exception 'PUBLISH_REQUIRES_CREDITS' using errcode = '42501'; end if;
    return new;
  end if;
  if new.applications_count is distinct from old.applications_count then raise exception 'PROTECTED_FIELD' using errcode = '42501'; end if;
  return new;
end; $$;
create trigger trg_job_postings_proteger_publicacion before insert or update on public.job_postings for each row execute function public.job_postings_proteger_publicacion();

alter table public.company_users enable row level security;
create policy "Users can view own memberships" on public.company_users for select to authenticated using (user_id = auth.uid());

create table public.job_posting_questions (
  id uuid primary key default gen_random_uuid(), job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  question_text text not null, question_type varchar(50) check (question_type in ('TEXT','TEXTAREA','YES_NO','MULTIPLE_CHOICE')),
  options jsonb, is_required boolean default false, order_index int default 0, created_at timestamptz default now()
);
alter table public.job_posting_questions enable row level security;
create policy "Anyone can view questions for published jobs" on public.job_posting_questions for select using (job_posting_id in (select id from public.job_postings where status = 'PUBLISHED'));
create policy "Company members manage questions" on public.job_posting_questions for all to authenticated using (exists (select 1 from public.job_postings jp join public.company_users cu on cu.company_id = jp.company_id where jp.id = job_posting_questions.job_posting_id and cu.user_id = auth.uid()));
create policy "Company members can view questions for their jobs" on public.job_posting_questions for select using (job_posting_id in (select jp.id from public.job_postings jp where jp.company_id in (select company_id from public.company_users where user_id = auth.uid())));

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
create or replace function public.update_job_posting_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger trigger_update_job_application_timestamp before update on public.job_applications for each row execute function public.update_job_posting_updated_at();
create or replace function public.notify_application_status_change() returns trigger language plpgsql as $$ begin return new; end; $$;
create or replace function public.notify_new_job_application() returns trigger language plpgsql as $$ begin return new; end; $$;
create trigger on_application_status_change after update of status on public.job_applications for each row execute function public.notify_application_status_change();
create trigger on_new_job_application after insert on public.job_applications for each row execute function public.notify_new_job_application();

-- funciones antiguas reales (la antigua apply_to_job tiene 4 argumentos y calculate_job_match_score está rota)
create or replace function public.calculate_job_match_score(p_job_posting_id uuid, p_profile_id uuid) returns integer language plpgsql security definer as $$
declare v_profile record; begin select * into v_profile from profiles where id = p_profile_id; if v_profile.experience_level is not null then return 1; end if; return 0; end; $$;
create or replace function public.apply_to_job(p_job_posting_id uuid, p_profile_id uuid, p_cover_letter text default null, p_answers jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer as $$
begin return jsonb_build_object('old', true); end; $$;
create or replace function public.update_application_status(p_application_id uuid, p_company_id uuid, p_user_id uuid, p_new_status varchar, p_internal_notes text default null, p_rating integer default null) returns jsonb language plpgsql security definer as $$
begin return jsonb_build_object('old', true); end; $$;
`);

// Datos
await db.exec(`
insert into auth.users(id) values ('${A}'),('${B}'),('${MA}'),('${VA}'),('${MB}'),('${ADM}');
insert into public.profiles(id, full_name, headline, summary, slug, email, phone, role, country_code, open_to_remote) values
 ('${A}','Ana Candidata','Desarrolladora full stack','Resumen de Ana','ana','ana@test.dev','+34600000001','professional','ES', true),
 ('${B}','Beto Candidato',null,null,'beto','beto@test.dev',null,'professional','MX', false),
 ('${MA}','Miembro A',null,null,'ma','ma@a.test',null,'employer',null,null),
 ('${VA}','Viewer A',null,null,'va','va@a.test',null,'employer',null,null),
 ('${MB}','Miembro B',null,null,'mb','mb@b.test',null,'employer',null,null),
 ('${ADM}','Admin',null,null,'adm','adm@x.test',null,'admin',null,null);
insert into public.companies(id, company_name, company_email, status) values
 ('${CA}','Empresa A','rrhh@a.test','APPROVED'),('${CB}','Empresa B','rrhh@b.test','APPROVED'),('${CP}','Empresa Pendiente','p@p.test','PENDING');
insert into public.company_users(company_id, user_id, role) values ('${CA}','${MA}','OWNER'),('${CA}','${VA}','VIEWER'),('${CB}','${MB}','OWNER');
-- perfil de A: 2 + ~3,8 años de experiencia, grado, habilidades e idiomas
insert into public.experiences(profile_id, company_name, position, start_date, end_date, is_current) values
 ('${A}','X','Dev','2020-01-01','2022-01-01', false), ('${A}','Y','Senior Dev','2023-01-01', null, true);
insert into public.education(profile_id, institution_name, degree, field_of_study) values ('${A}','Univ','Grado en Ingeniería Informática','Informática');
insert into public.skills(profile_id, name) values ('${A}','React'),('${A}','SQL'),('${A}','TypeScript');
insert into public.languages(profile_id, name, level, is_native) values ('${A}','Español','Nativo', true),('${A}','Inglés','B2', false);

insert into public.job_postings(id, company_id, title, status, published_at, required_skills, experience_level, is_remote, location_country, department, description, created_at) values
 ('${J1}','${CA}','Oferta con preguntas','PUBLISHED', now() - interval '2 days', '{React}', 'MID', false, 'ES', 'Tecnología', 'Buscamos developer React', now() - interval '3 days'),
 ('${J2}','${CA}','Oferta sin preguntas','PUBLISHED', now() - interval '2 days', null, null, false, 'ES', 'Tecnología', 'otra', now() - interval '3 days'),
 ('${J3}','${CA}','Oferta cerrada','CLOSED', now() - interval '9 days', null, null, false, 'ES', null, 'x', now() - interval '10 days'),
 ('${J4}','${CP}','Oferta de empresa sin verificar','PUBLISHED', now() - interval '2 days', null, null, false, 'ES', null, 'x', now() - interval '3 days'),
 ('${J5}','${CB}','Oferta de B','PUBLISHED', now() - interval '2 days', null, null, false, 'MX', null, 'x', now() - interval '3 days'),
 ('${J6}','${CA}','Oferta vencida','PUBLISHED', now() - interval '9 days', null, null, false, 'ES', null, 'x', now() - interval '10 days'),
 ('${J8}','${CA}','Oferta con carta obligatoria','PUBLISHED', now() - interval '2 days', null, null, false, 'ES', null, 'x', now() - interval '3 days'),
 ('${J9}','${CA}','Borrador','DRAFT', null, null, null, false, 'ES', null, 'x', now() - interval '3 days');
update public.job_postings set application_deadline = now() - interval '1 day' where id = '${J6}';
insert into public.job_posting_questions(id, job_posting_id, question_text, question_type, is_required, order_index) values
 ('${Q1}','${J1}','¿Por qué quieres este puesto?','TEXTAREA', true, 1),
 ('${Q3}','${J1}','Comentario opcional','TEXT', false, 3);
`);

// -----------------------------------------------------------------------------
// 1. La migración se aplica dos veces (y con columnas de la fase 2 presentes la 2.ª)
// -----------------------------------------------------------------------------
let applied1 = true, applied2 = true, e1 = '', e2 = '';
try { await db.exec(sql); } catch (e) { applied1 = false; e1 = e.message; }
ok('migración: primera aplicación sin error', applied1, e1);
if (!applied1) { console.log(`\nRESULTADO: ${total - fails}/${total} OK`); process.exit(1); }

// Columnas que añadirá la fase 2 (las funciones las leen con to_jsonb: antes no hacían falta)
await db.exec(`
alter table public.job_postings add column category text, add column country_code text, add column languages jsonb,
  add column education_min text, add column experience_years int, add column notify_emails text[],
  add column notify_frequency text, add column cover_letter_mode text;
update public.job_postings set country_code = location_country;
`);
try { await db.exec(sql); } catch (e) { applied2 = false; e2 = e.message; }
ok('migración: segunda aplicación (reaplicable, ya con columnas de fase 2)', applied2, e2);
if (!applied2) { console.log(`\nRESULTADO: ${total - fails}/${total} OK`); process.exit(1); }
ok('apply_to_job: solo queda la versión nueva (6 args)', (await q(`select count(*)::int n from pg_proc where proname='apply_to_job' and pronamespace='public'::regnamespace`))[0].n === 1);
ok('triggers notify_* retirados', (await q(`select count(*)::int n from pg_trigger where tgrelid='public.job_applications'::regclass and tgname in ('on_new_job_application','on_application_status_change')`))[0].n === 0);
ok('funciones notify_* eliminadas', (await q(`select count(*)::int n from pg_proc where proname like 'notify_%job%' or proname='notify_application_status_change'`))[0].n === 0);
ok('job_applications: 4 políticas (2 lectura + 2 update), ninguna de INSERT/DELETE',
  JSON.stringify((await q(`select cmd, count(*)::int n from pg_policies where tablename='job_applications' group by cmd order by cmd`))) === JSON.stringify([{ cmd: 'SELECT', n: 2 }, { cmd: 'UPDATE', n: 2 }]));
const gr = await q(`select grantee, privilege_type from information_schema.role_table_grants where table_name='job_applications' and grantee in ('anon','authenticated') order by 1,2`);
ok('grants job_applications (detalle)', JSON.stringify(gr.map(g => `${g.grantee}:${g.privilege_type}`)) === JSON.stringify(['authenticated:SELECT']), JSON.stringify(gr));
const colUpd = await q(`select column_name from information_schema.column_privileges where table_name='job_applications' and grantee='authenticated' and privilege_type='UPDATE' order by 1`);
ok('UPDATE por columnas de authenticated = status, internal_notes, rating, updated_at',
  JSON.stringify(colUpd.map(c => c.column_name)) === JSON.stringify(['internal_notes', 'rating', 'status', 'updated_at']), JSON.stringify(colUpd));

// Preguntas de J1 (Q2 knockout, tras la migración que añade las columnas)
await q(`insert into public.job_posting_questions(id, job_posting_id, question_text, question_type, is_required, order_index, is_knockout, expected_answer)
         values ($1,$2,'¿Tienes permiso de trabajo en España?','YES_NO', true, 2, true, 'YES')`, [Q2, J1]);

// -----------------------------------------------------------------------------
// 2. anon
// -----------------------------------------------------------------------------
await as('anon');
await throws('anon: no lee job_applications', () => q('select count(*) from public.job_applications'), /permission denied/);
await throws('anon: no inserta job_applications', () => q(`insert into public.job_applications(job_posting_id,profile_id,company_id) values ('${J1}','${A}','${CA}')`), /permission denied/);
await throws('anon: no puede ejecutar apply_to_job', () => q(`select public.apply_to_job('${J2}'::uuid)`), /permission denied for function/);
await throws('anon: no puede ejecutar get_recommended_jobs', () => q('select * from public.get_recommended_jobs(5)'), /permission denied for function/);
await throws('anon: no puede ejecutar queue_job_alerts', () => q('select public.queue_job_alerts()'), /permission denied for function/);
await throws('anon: no puede ejecutar calculate_job_match_score', () => q(`select public.calculate_job_match_score('${J1}','${A}')`), /permission denied for function/);
await throws('anon: no lee email_outbox', () => q('select * from public.email_outbox'), /permission denied/);
await throws('anon: no lee my_job_applications', () => q('select * from public.my_job_applications'), /permission denied/);
await throws('anon: no lee el historial', () => q('select * from public.job_application_status_history'), /permission denied/);
await throws('anon: no lee las alertas', () => q('select * from public.job_alert_subscriptions'), /permission denied/);
let rows = await q(`select id, is_knockout, is_required from public.job_posting_questions where job_posting_id='${J1}'`);
ok('anon: sí ve las preguntas públicas (con is_knockout)', rows.length === 3 && rows.some(r => r.is_knockout), JSON.stringify(rows));
await throws('anon: NO lee expected_answer', () => q('select expected_answer from public.job_posting_questions'), /permission denied/);
await throws('anon: select * de preguntas falla (hay que pedir columnas)', () => q('select * from public.job_posting_questions'), /permission denied/);

// -----------------------------------------------------------------------------
// 3. Candidato A: inscripción
// -----------------------------------------------------------------------------
await as('authenticated', A);
const apply = (job, over = {}) => q(
  'select public.apply_to_job($1::uuid, $2::uuid, $3, $4::jsonb, $5, $6) as r',
  [job, over.pid ?? null, over.cover ?? null, JSON.stringify(over.answers ?? {}), ('consent' in over ? over.consent : true), over.ver ?? 'v1.0']);

await throws('A: sin consentimiento -> CONSENT_REQUIRED', () => apply(J2, { consent: false }), /CONSENT_REQUIRED/);
await throws('A: consentimiento null -> CONSENT_REQUIRED', () => apply(J2, { consent: null }), /CONSENT_REQUIRED/);
await throws('A: pregunta obligatoria vacía -> REQUIRED_QUESTION_MISSING', () => apply(J1, { answers: { [Q2]: 'YES' } }), /REQUIRED_QUESTION_MISSING/);
await throws('A: pregunta obligatoria con espacios -> REQUIRED_QUESTION_MISSING', () => apply(J1, { answers: { [Q1]: '   ', [Q2]: 'YES' } }), /REQUIRED_QUESTION_MISSING/);
await throws('A: pregunta knockout sin responder -> REQUIRED_QUESTION_MISSING', () => apply(J1, { answers: { [Q1]: 'porque sí' } }), /REQUIRED_QUESTION_MISSING/);
await throws('A: oferta cerrada -> JOB_NOT_AVAILABLE', () => apply(J3), /JOB_NOT_AVAILABLE/);
await throws('A: oferta con plazo vencido -> JOB_NOT_AVAILABLE', () => apply(J6), /JOB_NOT_AVAILABLE/);
await throws('A: oferta en borrador -> JOB_NOT_AVAILABLE', () => apply(J9), /JOB_NOT_AVAILABLE/);
await throws('A: empresa no APPROVED -> JOB_NOT_AVAILABLE', () => apply(J4), /JOB_NOT_AVAILABLE/);
await throws('A: oferta inexistente -> JOB_NOT_AVAILABLE', () => apply('d0000000-0000-0000-0000-0000000000ff'), /JOB_NOT_AVAILABLE/);
await throws('A: perfil ajeno en p_profile_id -> UNAUTHORIZED', () => apply(J2, { pid: B }), /UNAUTHORIZED/);
await throws('A: carta obligatoria vacía -> COVER_LETTER_REQUIRED', async () => {
  await as('postgres'); await db.exec(`update public.job_postings set cover_letter_mode='REQUIRED' where id='${J8}'`); await as('authenticated', A);
  await apply(J8);
}, /COVER_LETTER_REQUIRED/);
rows = await q('select count(*)::int n from public.my_job_applications');
ok('A: ningún intento fallido dejó candidatura', rows[0].n === 0, JSON.stringify(rows));

// Aviso de resumen diario y dos destinatarios en J2
await as('postgres');
await db.exec(`update public.job_postings set notify_emails='{rrhh@a.test,jefe@a.test}', notify_frequency='DAILY' where id='${J2}'`);
await as('authenticated', A);

let r = (await apply(J1, { answers: { [Q1]: 'Me encanta', [Q2]: 'Yes' }, cover: 'Hola' }))[0].r;
ok('A: apply_to_job OK en J1', r.success === true && !!r.application_id, JSON.stringify(r));
const appA = r.application_id;
ok('A: devuelve match_score y warnings', Number.isInteger(r.match_score) && Array.isArray(r.warnings), JSON.stringify(r));
await throws('A: duplicado -> ALREADY_APPLIED', () => apply(J1, { answers: { [Q1]: 'x', [Q2]: 'YES' } }), /ALREADY_APPLIED.*Already applied/);
r = (await apply(J2))[0].r;
const appA2 = r.application_id;
ok('A: apply_to_job OK en J2 (sin preguntas)', r.success === true);

// Lo que A ve de lo suyo
rows = await q('select * from public.my_job_applications order by created_at');
ok('A: ve sus 2 candidaturas por la vista', rows.length === 2, rows.length);
const mine = rows.find(x => x.id === appA);
ok('A: vista sin internal_notes, rating, perfil_copia ni descartada_auto',
  !('internal_notes' in mine) && !('rating' in mine) && !('perfil_copia' in mine) && !('descartada_auto' in mine) && !('metadata' in mine));
ok('A: estado visible NEW / SENT, con título y empresa', mine.status === 'NEW' && mine.candidate_status === 'SENT' && mine.job_title === 'Oferta con preguntas' && mine.company_name === 'Empresa A', JSON.stringify(mine));
ok('A: consentimiento guardado', mine.consent_at !== null && mine.consent_doc_version === 'v1.0');
await throws('A: internal_notes no existe en su vista', () => q('select internal_notes from public.my_job_applications'), /does not exist/);
rows = await q('select count(*)::int n from public.job_applications');
ok('A: la tabla base no devuelve filas al candidato (sin política de lectura)', rows[0].n === 0, JSON.stringify(rows));

// Seguridad directa de A
await throws('A: INSERT directo en job_applications denegado', () => q(`insert into public.job_applications(job_posting_id,profile_id,company_id) values ('${J5}','${A}','${CB}')`), /permission denied/);
for (const [col, val] of [['status', "'HIRED'"], ['rating', '5'], ['internal_notes', "'yo'"]]) {
  const u = await db.query(`update public.job_applications set ${col}=${val} where id='${appA}'`);
  ok(`A: UPDATE de ${col} no afecta ninguna fila (sin política de UPDATE para el candidato)`, u.affectedRows === 0, u.affectedRows);
}
await throws('A: UPDATE de perfil_copia denegado', () => q(`update public.job_applications set perfil_copia='{}' where id='${appA}'`), /permission denied/);
await throws('A: UPDATE de profile_id denegado', () => q(`update public.job_applications set profile_id='${B}' where id='${appA}'`), /permission denied/);
await throws('A: DELETE denegado', () => q(`delete from public.job_applications where id='${appA}'`), /permission denied/);
await throws('A: TRUNCATE denegado', () => q('truncate public.job_applications'), /permission denied/);
await throws('A: no escribe en el historial', () => q(`insert into public.job_application_status_history(application_id,to_status) values ('${appA}','HIRED')`), /permission denied/);
await throws('A: no escribe en email_outbox', () => q(`insert into public.email_outbox(kind,to_email) values ('x','a@b.c')`), /permission denied/);
await throws('A: no puede ejecutar queue_job_alerts', () => q('select public.queue_job_alerts()'), /permission denied for function/);
await throws('A: no puede ejecutar jobs_enqueue_email', () => q(`select public.jobs_enqueue_email('x','a@b.c','{}')`), /permission denied for function/);
await throws('A: NO lee expected_answer', () => q('select expected_answer from public.job_posting_questions'), /permission denied/);
await throws('A: no inserta preguntas en ofertas ajenas (RLS)', () => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ('${J1}','hack','TEXT')`), /row-level security/);

// preview
r = (await q('select public.preview_application_profile() as r'))[0].r;
ok('A: preview_application_profile devuelve copia + huecos', r.profile.experiences.length === 2 && r.gaps.includes('NO_EDUCATION') === false && r.gaps.includes('NO_EXPERIENCE') === false, JSON.stringify(r.gaps));

// B: knockout falla -> NOT_QUALIFIED
await as('authenticated', B);
r = (await apply(J1, { answers: { [Q1]: 'Quiero', [Q2]: 'No' } }))[0].r;
const appB = r.application_id;
ok('B: apply con knockout fallido devuelve success (no revela el descarte)', r.success === true && !('status' in r) && !('auto_discarded' in r), JSON.stringify(r));
rows = await q('select status, candidate_status from public.my_job_applications');
ok('B: ve su candidatura como NEW / SENT (no ve NOT_QUALIFIED)', rows.length === 1 && rows[0].status === 'NEW' && rows[0].candidate_status === 'SENT', JSON.stringify(rows));
rows = await q('select * from public.get_application_history($1)', [appB]);
ok('B: su historial enmascara NOT_QUALIFIED', rows.length === 1 && rows[0].to_status === 'NEW' && rows[0].from_status === null, JSON.stringify(rows));
await throws('B: no ve la candidatura de A (historial)', () => q('select * from public.get_application_history($1)', [appA]), /APPLICATION_NOT_FOUND/);
await throws('B: no retira la candidatura de A', () => q('select public.withdraw_application($1)', [appA]), /APPLICATION_NOT_FOUND/);
r = (await apply(J5, {}))[0].r;
ok('B: puede inscribirse en la oferta de la empresa B (sin preguntas)', r.success === true);
const appB5 = r.application_id;

await as('postgres');
rows = await q(`select id, status, descartada_auto from public.job_applications where id = $1`, [appB]);
ok('B: la candidatura quedó NOT_QUALIFIED con descartada_auto = true', rows[0].status === 'NOT_QUALIFIED' && rows[0].descartada_auto === true, JSON.stringify(rows));
rows = await q(`select to_status, changed_by_role from public.job_application_status_history where application_id=$1`, [appB]);
ok('historial de B: NOT_QUALIFIED por SYSTEM', rows.length === 1 && rows[0].to_status === 'NOT_QUALIFIED' && rows[0].changed_by_role === 'SYSTEM', JSON.stringify(rows));
rows = await q(`select applications_count from public.job_postings where id=$1`, [J1]);
ok('contador applications_count de J1 = 2 (A y B)', rows[0].applications_count === 2, JSON.stringify(rows));

// Copia del perfil
rows = await q(`select perfil_copia from public.job_applications where id=$1`, [appA]);
const pc = rows[0].perfil_copia;
ok('perfil_copia de A: perfil, contacto, 2 experiencias, 1 formación, 3 habilidades, 2 idiomas',
  pc.profile.full_name === 'Ana Candidata' && pc.contact.email === 'ana@test.dev' && pc.experiences.length === 2 && pc.education.length === 1 && pc.skills.length === 3 && pc.languages.length === 2, JSON.stringify(Object.keys(pc)));
await db.exec(`update public.profiles set headline='CAMBIADO', full_name='Otro Nombre' where id='${A}'; delete from public.skills where profile_id='${A}'; insert into public.experiences(profile_id, company_name, position) values ('${A}','Z','Nuevo');`);
rows = await q(`select perfil_copia from public.job_applications where id=$1`, [appA]);
ok('perfil_copia NO cambia al editar el CV después', rows[0].perfil_copia.profile.full_name === 'Ana Candidata' && rows[0].perfil_copia.skills.length === 3 && rows[0].perfil_copia.experiences.length === 2);
await db.exec(`update public.profiles set headline='Desarrolladora full stack', full_name='Ana Candidata' where id='${A}'; delete from public.experiences where company_name='Z'; insert into public.skills(profile_id, name) values ('${A}','React'),('${A}','SQL'),('${A}','TypeScript');`);

// Cola de correos
rows = await q(`select kind, to_email, send_after > now() + interval '1 hour' as later, (payload->>'digest') as digest, priority from public.email_outbox order by kind, to_email`);
const cand = rows.filter(x => x.kind === 'application_received_candidate').map(x => x.to_email).sort();
const comp = rows.filter(x => x.kind === 'application_received_company');
ok('outbox: avisos al candidato (A en J1, A en J2, B en J1, B en J5)', cand.join() === 'ana@test.dev,ana@test.dev,beto@test.dev,beto@test.dev', cand.join());
ok('outbox: J1 -> 1 aviso a la empresa (A); B quedó NOT_QUALIFIED y no avisa a la empresa; J2 -> 2 destinatarios en resumen diario; J5 -> 1',
  comp.length === 1 + 2 + 1 && comp.filter(x => x.to_email === 'rrhh@a.test').length === 2 && comp.some(x => x.to_email === 'jefe@a.test' && x.later && x.digest === 'true') && comp.some(x => x.to_email === 'rrhh@b.test'), JSON.stringify(comp));
ok('outbox: 2 avisos exactos por inscripción normal en J1 (candidato + empresa) para A',
  (await q(`select count(*)::int n from public.email_outbox where payload->>'application_id' = $1`, [appA]))[0].n === 2);
ok('outbox: nada se marca como enviado', (await q(`select count(*)::int n from public.email_outbox where sent_at is not null`))[0].n === 0);

// -----------------------------------------------------------------------------
// 4. Empresa A
// -----------------------------------------------------------------------------
await as('authenticated', MA);
rows = await q('select id, internal_notes, rating, perfil_copia is not null as tiene_copia from public.job_applications order by created_at');
ok('MA (empresa A): ve las 3 candidaturas de su empresa con perfil_copia', rows.length === 3 && rows.every(x => x.tiene_copia), rows.length);
r = (await q('select public.mark_application_viewed($1) as r', [appA]))[0].r;
ok('MA: mark_application_viewed', r.viewed === true);
rows = await q(`select viewed_by_company, viewed_at is not null v, viewed_by, status from public.job_applications where id=$1`, [appA]);
ok('MA: queda vista por MA y el estado no cambia', rows[0].viewed_by_company && rows[0].v && rows[0].viewed_by === MA && rows[0].status === 'NEW', JSON.stringify(rows));
await throws('MA: UPDATE directo de viewed_by_company denegado (solo RPC)', () => q(`update public.job_applications set viewed_by_company=false where id='${appA}'`), /permission denied/);
await throws('MA: UPDATE de profile_id denegado', () => q(`update public.job_applications set profile_id='${B}' where id='${appA}'`), /permission denied/);
await throws('MA: UPDATE de job_posting_id denegado', () => q(`update public.job_applications set job_posting_id='${J2}' where id='${appA}'`), /permission denied/);
await throws('MA: UPDATE de company_id denegado', () => q(`update public.job_applications set company_id='${CB}' where id='${appA}'`), /permission denied/);
await throws('MA: no puede forzar WITHDRAWN', () => q(`update public.job_applications set status='WITHDRAWN' where id='${appA}'`), /WITHDRAW_ONLY_BY_CANDIDATE/);
await throws('MA: no puede insertar candidaturas', () => q(`insert into public.job_applications(job_posting_id,profile_id,company_id) values ('${J2}','${MA}','${CA}')`), /permission denied/);
await throws('MA: no puede borrar candidaturas', () => q(`delete from public.job_applications where id='${appA}'`), /permission denied/);
r = (await q(`select public.update_application_status($1,$2,$3,'INTERVIEW','Muy buena',4) as r`, [appA, CA, MA]))[0].r;
ok('MA: update_application_status NEW -> INTERVIEW', r.success && r.old_status === 'NEW' && r.new_status === 'INTERVIEW', JSON.stringify(r));
await throws('MA: estado no permitido (NOT_QUALIFIED) por RPC', () => q(`select public.update_application_status($1,$2,$3,'NOT_QUALIFIED')`, [appA, CA, MA]), /INVALID_STATUS/);
await throws('MA: estado WITHDRAWN por RPC', () => q(`select public.update_application_status($1,$2,$3,'WITHDRAWN')`, [appA, CA, MA]), /INVALID_STATUS/);
await throws('MA: p_user_id de otro -> USER_MISMATCH', () => q(`select public.update_application_status($1,$2,$3,'REJECTED')`, [appA, CA, MB]), /USER_MISMATCH/);
await q(`update public.job_applications set status='SHORTLISTED', rating=5, internal_notes='nota directa' where id=$1`, [appA]);
rows = await q('select status, rating, internal_notes from public.job_applications where id=$1', [appA]);
ok('MA: UPDATE directo de status, rating y notas permitido', rows[0].status === 'SHORTLISTED' && rows[0].rating === 5 && rows[0].internal_notes === 'nota directa');
r = (await q('select * from public.get_job_questions_for_company($1)', [J1]));
ok('MA: get_job_questions_for_company devuelve expected_answer', r.length === 3 && r.find(x => x.id === Q2).expected_answer === 'YES', JSON.stringify(r.map(x => x.expected_answer)));
rows = await q('select * from public.get_application_history($1)', [appA]);
ok('MA: historial completo de A (NEW, INTERVIEW, SHORTLISTED)', rows.map(x => x.to_status).join() === 'NEW,INTERVIEW,SHORTLISTED' && rows[1].changed_by_role === 'COMPANY', JSON.stringify(rows.map(x => x.to_status + ':' + x.changed_by_role)));
rows = await q('select count(*)::int n from public.job_application_status_history');
ok('MA: lee el historial de sus candidaturas por la tabla', rows[0].n >= 3, JSON.stringify(rows));
// preguntas: tope y knockout
await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'p4','TEXT')`, [J1]);
await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'p5','TEXT')`, [J1]);
await throws('MA: 6.ª pregunta -> MAX_QUESTIONS_REACHED', () => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'p6','TEXT')`, [J1]), /MAX_QUESTIONS_REACHED/);
await throws('MA: knockout sin respuesta esperada rechazado', () => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_knockout) values ($1,'k','YES_NO', true)`, [J2]), /violates check constraint/);
await q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type, is_knockout, expected_answer) values ($1,'k','YES_NO', true, 'NO')`, [J2]);
await q(`delete from public.job_posting_questions where job_posting_id=$1 and question_text='k'`, [J2]);
await throws('MA: mover una pregunta a una oferta llena también se frena', () => q(`update public.job_posting_questions set job_posting_id=$1 where question_text='Comentario opcional'`, [J1]).then(() => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ($1,'z','TEXT')`, [J1])), /MAX_QUESTIONS_REACHED/);
await q(`delete from public.job_posting_questions where question_text in ('p4','p5','z')`);

// VIEWER
await as('authenticated', VA);
rows = await q('select count(*)::int n from public.job_applications');
ok('VA (viewer): puede leer las candidaturas de su empresa', rows[0].n === 3);
r = await db.query(`update public.job_applications set rating=1 where id='${appA}'`);
ok('VA (viewer): UPDATE directo no afecta ninguna fila', r.affectedRows === 0, r.affectedRows);
await throws('VA (viewer): update_application_status -> Unauthorized', () => q(`select public.update_application_status($1,$2,$3,'REJECTED')`, [appA, CA, VA]), /Unauthorized/);

// -----------------------------------------------------------------------------
// 5. Empresa B no ve ni toca las de A
// -----------------------------------------------------------------------------
await as('authenticated', MB);
rows = await q('select id from public.job_applications');
ok('MB (empresa B): solo ve la candidatura de su empresa (1)', rows.length === 1 && rows[0].id === appB5, rows.length);
r = await db.query(`update public.job_applications set status='REJECTED', rating=1, internal_notes='sabotaje' where id='${appA}'`);
ok('MB: UPDATE directo sobre candidatura de A no afecta filas', r.affectedRows === 0);
await throws('MB: update_application_status con company A -> Unauthorized', () => q(`select public.update_application_status($1,$2,$3,'REJECTED')`, [appA, CA, MB]), /Unauthorized/);
await throws('MB: update_application_status con company B sobre candidatura de A -> no pertenece', () => q(`select public.update_application_status($1,$2,$3,'REJECTED')`, [appA, CB, MB]), /does not belong/);
await throws('MB: mark_application_viewed ajena -> APPLICATION_NOT_FOUND', () => q('select public.mark_application_viewed($1)', [appA]), /APPLICATION_NOT_FOUND/);
await throws('MB: historial ajeno -> APPLICATION_NOT_FOUND', () => q('select * from public.get_application_history($1)', [appA]), /APPLICATION_NOT_FOUND/);
await throws('MB: preguntas (con respuesta esperada) de A -> UNAUTHORIZED', () => q('select * from public.get_job_questions_for_company($1)', [J1]), /UNAUTHORIZED/);
rows = await q('select count(*)::int n from public.job_application_status_history');
ok('MB: solo ve el historial de su candidatura', rows[0].n === 1, JSON.stringify(rows));
await throws('MB: no inserta preguntas en ofertas de A', () => q(`insert into public.job_posting_questions(job_posting_id, question_text, question_type) values ('${J1}','x','TEXT')`), /row-level security/);

// WITH CHECK de la política de UPDATE (aislado de los grants y del trigger)
await as('postgres');
await db.exec(`grant update (profile_id, job_posting_id, company_id) on public.job_applications to authenticated; alter table public.job_applications disable trigger trg_job_applications_proteger;`);
await as('authenticated', MA);
await throws('WITH CHECK: MA no puede cambiar profile_id aunque tuviera el grant', () => q(`update public.job_applications set profile_id='${B}' where id='${appA}'`), /row-level security/);
await throws('WITH CHECK: MA no puede cambiar job_posting_id', () => q(`update public.job_applications set job_posting_id='${J2}' where id='${appA}'`), /row-level security/);
await throws('WITH CHECK: MA no puede mover la candidatura a la empresa B', () => q(`update public.job_applications set company_id='${CB}' where id='${appA}'`), /row-level security/);
r = await db.query(`update public.job_applications set rating=3 where id='${appA}'`);
ok('WITH CHECK: un cambio legítimo sí pasa', r.affectedRows === 1);
await as('postgres');
await db.exec(`revoke update (profile_id, job_posting_id, company_id) on public.job_applications from authenticated; alter table public.job_applications enable trigger trg_job_applications_proteger;`);

// -----------------------------------------------------------------------------
// 6. Retirarse
// -----------------------------------------------------------------------------
await as('authenticated', A);
r = (await q('select public.withdraw_application($1) as r', [appA]))[0].r;
ok('A: withdraw_application sobre la propia', r.status === 'WITHDRAWN');
await throws('A: retirarse otra vez -> ALREADY_WITHDRAWN', () => q('select public.withdraw_application($1)', [appA]), /ALREADY_WITHDRAWN/);
rows = await q('select candidate_status from public.my_job_applications where id=$1', [appA]);
ok('A: candidate_status = WITHDRAWN', rows[0].candidate_status === 'WITHDRAWN');
rows = await q('select to_status, changed_by_role from public.get_application_history($1)', [appA]);
ok('A: su historial acaba en WITHDRAWN por CANDIDATE', rows.at(-1).to_status === 'WITHDRAWN' && rows.at(-1).changed_by_role === 'CANDIDATE', JSON.stringify(rows));
await throws('A: no reaplica tras retirarse -> ALREADY_APPLIED', () => apply(J1, { answers: { [Q1]: 'x', [Q2]: 'YES' } }), /ALREADY_APPLIED/);
await as('authenticated', MA);
await throws('MA: no puede mover una candidatura retirada (RPC)', () => q(`select public.update_application_status($1,$2,$3,'REJECTED')`, [appA, CA, MA]), /APPLICATION_WITHDRAWN/);
await throws('MA: no puede mover una candidatura retirada (directo)', () => q(`update public.job_applications set status='REJECTED' where id='${appA}'`), /APPLICATION_WITHDRAWN/);
// oferta cerrada -> no se puede retirar
await as('postgres');
await db.exec(`update public.job_postings set status='CLOSED' where id='${J2}'`);
await as('authenticated', A);
await throws('A: retirarse de una oferta cerrada -> JOB_CLOSED', () => q('select public.withdraw_application($1)', [appA2]), /JOB_CLOSED/);
await as('postgres');
await db.exec(`update public.job_postings set status='PUBLISHED' where id='${J2}'; update public.job_applications set status='HIRED' where id='${appA2}'`);
await as('authenticated', A);
await throws('A: retirarse tras ser contratada -> CANNOT_WITHDRAW', () => q('select public.withdraw_application($1)', [appA2]), /CANNOT_WITHDRAW/);

// Avisos de cambio de estado y su cola
await as('postgres');
rows = await q(`select kind, to_email, payload->>'new_status' ns from public.email_outbox where kind='application_status_candidate' order by created_at`);
ok('outbox: aviso al candidato por INTERVIEW y por SHORTLISTED (directo), ninguno por HIRED hecho por postgres/SYSTEM ni por retirada',
  rows.length === 2 && rows.map(x => x.ns).join() === 'INTERVIEW,SHORTLISTED' && rows.every(x => x.to_email === 'ana@test.dev'), JSON.stringify(rows));
rows = await q(`select changed_by_role from public.job_application_status_history where application_id=$1 order by created_at, id`, [appA]);
ok('historial de A: CANDIDATE, COMPANY, COMPANY, CANDIDATE', rows.map(x => x.changed_by_role).join() === 'CANDIDATE,COMPANY,COMPANY,CANDIDATE', rows.map(x => x.changed_by_role).join());

// Admin
await as('authenticated', ADM);
rows = await q('select count(*)::int n from public.job_applications');
ok('ADM: el admin lee todas las candidaturas (4)', rows[0].n === 4, JSON.stringify(rows));

// -----------------------------------------------------------------------------
// 7. Alertas
// -----------------------------------------------------------------------------
await as('authenticated', A);
await q(`insert into public.job_alert_subscriptions(profile_id, categories, country, keywords, frequency) values ($1, '{Tecnología}', 'ES', '{react}', 'DAILY')`, [A]);
rows = await q('select count(*)::int n from public.job_alert_subscriptions');
ok('A: crea su suscripción', rows[0].n === 1);
await throws('A: una sola suscripción por perfil', () => q(`insert into public.job_alert_subscriptions(profile_id) values ($1)`, [A]), /duplicate key/);
await throws('A: no puede fijar last_sent_at', () => q(`update public.job_alert_subscriptions set last_sent_at = now()`), /permission denied/);
await throws('A: no crea una suscripción a nombre de B', () => q(`insert into public.job_alert_subscriptions(profile_id) values ($1)`, [B]), /row-level security/);
await as('authenticated', B);
await q(`insert into public.job_alert_subscriptions(profile_id, categories, frequency) values ($1, '{Cocina}', 'WEEKLY')`, [B]);
rows = await q('select profile_id from public.job_alert_subscriptions');
ok('B: solo ve la suya', rows.length === 1 && rows[0].profile_id === B);
r = await db.query(`update public.job_alert_subscriptions set active=false where profile_id='${A}'`);
ok('B: no modifica la de A', r.affectedRows === 0);
await as('authenticated', MA);
rows = await q('select count(*)::int n from public.job_alert_subscriptions');
ok('MA: no ve ninguna suscripción ajena', rows[0].n === 0);

await as('postgres');
await db.exec(`
update public.job_alert_subscriptions set opted_in_at = now() - interval '5 days';
update public.job_postings set category='Tecnología' where id='${J1}';
insert into public.job_postings(id, company_id, title, status, published_at, category, country_code, location_country, description, created_at)
 values ('${J7}','${CA}','Nueva de tecnología','PUBLISHED', now() - interval '1 hour','Tecnología','ES','ES','Trabajo con React y TypeScript', now() - interval '1 day');
`);
await as('authenticated', A);
await throws('A: no ejecuta queue_job_alerts', () => q('select public.queue_job_alerts()'), /permission denied for function/);
await as('service_role');
let n1 = (await q('select public.queue_job_alerts() n'))[0].n;
ok('queue_job_alerts (service_role): encola 1 aviso (A coincide, B no)', n1 === 1, n1);
let n2 = (await q('select public.queue_job_alerts() n'))[0].n;
ok('queue_job_alerts: idempotente (2.ª llamada no encola nada)', n2 === 0, n2);
await as('postgres');
rows = await q(`select to_email, priority, payload->>'total' total, payload->'jobs'->0->>'title' t from public.email_outbox where kind='job_alert'`);
ok('outbox: 1 job_alert para A con las 2 ofertas que casan (categoría Tecnología, país ES, palabra react), la más nueva primero', rows.length === 1 && rows[0].to_email === 'ana@test.dev' && rows[0].total === '2' && rows[0].t === 'Nueva de tecnología', JSON.stringify(rows));
// con otra oferta publicada pero antes del último envío no repite; tras 24 h y una nueva sí
await db.exec(`update public.job_alert_subscriptions set last_sent_at = now() - interval '25 hours' where profile_id='${A}'; update public.job_postings set published_at = now() - interval '30 hours' where id in ('${J1}','${J7}')`);
n2 = (await q('select public.queue_job_alerts() n'))[0].n;
ok('queue_job_alerts: tras 25 h sin ofertas nuevas desde el último envío no encola', n2 === 0, n2);
await db.exec(`update public.job_alert_subscriptions set active=false where profile_id='${A}'`);
await db.exec(`update public.job_alert_subscriptions set last_sent_at = null, opted_in_at = now() - interval '5 days' where profile_id='${A}'`);
n2 = (await q('select public.queue_job_alerts() n'))[0].n;
ok('queue_job_alerts: una suscripción inactiva no recibe nada', n2 === 0, n2);
await db.exec(`set session authorization default; select set_config('request.jwt.claim.role','authenticated',false)`);
await throws('queue_job_alerts: aunque se llegue con rol authenticated, la propia función lo rechaza', () => q('select public.queue_job_alerts()'), /FORBIDDEN|permission denied/);
await as('postgres');

// -----------------------------------------------------------------------------
// 8. Recomendadas
// -----------------------------------------------------------------------------
await db.exec(`
insert into public.job_postings(id, company_id, title, status, published_at, required_skills, experience_level, is_remote, location_country, country_code, description, created_at) values
 ('${JR1}','${CA}','React Developer','PUBLISHED', now() - interval '3 days', '{React,sql}', 'MID', true, 'ES','ES','x', now() - interval '4 days'),
 ('${JR2}','${CA}','Programador COBOL','PUBLISHED', now() - interval '3 days', '{COBOL,JCL}', 'SENIOR', false, 'FR','FR','x', now() - interval '4 days'),
 ('${JR3}','${CB}','Dirección técnica','PUBLISHED', now() - interval '3 days', '{React}', null, false, 'DE','DE','x', now() - interval '4 days');
update public.job_postings set languages = '[{"language":"en","level":"C1"},{"language":"de","level":"B2"}]'::jsonb, education_min='MASTER', experience_years=10 where id='${JR3}';
update public.job_postings set languages = '[{"language":"Inglés","level":"B1"}]'::jsonb, education_min='Grado' where id='${JR1}';
`);
await as('authenticated', A);
rows = await q('select job_posting_id, title, match_score, match_breakdown, already_applied from public.get_recommended_jobs(50)');
const elegibles = (await (async () => { await as('postgres'); const x = await q(`select count(*)::int n from public.job_postings jp join public.companies c on c.id=jp.company_id where jp.status='PUBLISHED' and jp.published_at is not null and (jp.application_deadline is null or jp.application_deadline > now()) and c.status='APPROVED'`); await as('authenticated', A); return x[0].n; })());
ok('A: get_recommended_jobs devuelve solo ofertas publicadas, vigentes y de empresa APPROVED', rows.length === elegibles && !rows.some(x => [J3, J4, J6, J9].includes(x.job_posting_id)), `${rows.length} vs ${elegibles}`);
const sc = rows.map(x => x.match_score);
ok('A: ordenadas por afinidad descendente', sc.every((v, i) => i === 0 || sc[i - 1] >= v), sc.join());
ok('A: la más afín es React Developer; la menos, COBOL', rows[0].title === 'React Developer' && rows.at(-1).match_score <= rows.find(x => x.title === 'React Developer').match_score && rows.findIndex(x => x.title === 'Programador COBOL') > rows.findIndex(x => x.title === 'React Developer'), rows.map(x => x.title + ':' + x.match_score).join(' | '));
const jr3 = rows.find(x => x.title === 'Dirección técnica'), jr2 = rows.find(x => x.title === 'Programador COBOL');
ok('A: pesan estudios, años e idiomas (máster y 10 años pedidos puntúan menos que la oferta vacía en esos apartados)', jr3.match_breakdown.education < 15 && jr3.match_breakdown.experience < 20 && jr3.match_breakdown.languages > 0 && jr3.match_breakdown.languages < 15, JSON.stringify(jr3.match_breakdown));
ok('A: COBOL sin habilidades en común puntúa 0 en habilidades', jr2.match_breakdown.skills === 0, JSON.stringify(jr2.match_breakdown));
ok('A: ya inscrita marcado (J1 y J2)', rows.find(x => x.job_posting_id === J1).already_applied === true && rows.find(x => x.job_posting_id === JR1).already_applied === false);
rows = await q('select * from public.get_recommended_jobs(2)');
ok('A: p_limit se respeta', rows.length === 2);
ok('A: calculate_job_match_score arreglada (entero 0..100 para sí misma)', (await q(`select public.calculate_job_match_score('${JR1}','${A}') s`))[0].s > 50);
ok('A: calculate_job_match_score de otro perfil devuelve 0', (await q(`select public.calculate_job_match_score('${JR1}','${B}') s`))[0].s === 0);
// B (sin datos) también obtiene lista y puntuaciones válidas
await as('authenticated', B);
rows = await q('select match_score from public.get_recommended_jobs(50)');
ok('B (perfil vacío): lista válida con puntuaciones 0..100', rows.length === elegibles && rows.every(x => x.match_score >= 0 && x.match_score <= 100));

// -----------------------------------------------------------------------------
console.log(`\nRESULTADO: ${total - fails}/${total} OK${fails ? `, ${fails} FALLOS` : ''}`);
process.exit(fails ? 1 : 0);
