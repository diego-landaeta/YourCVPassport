// Prueba de la migracion 20261030_ofertas_fase2.sql sobre PGlite con RLS y roles.
// Uso: node fase2.test.mjs   (desde la carpeta pgtest)
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
process.on('uncaughtException', (e) => { console.log('ERROR NO CAPTURADO: ' + String(e.message).slice(0, 400) + (e.where ? ' | ' + String(e.where).split(String.fromCharCode(10))[0] : '')); process.exit(2); });

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const MIG = HERE + '../migrations/20261030_ofertas_fase2.sql';
const migSql = fs.readFileSync(MIG, 'utf8');

const db = new PGlite();
let pass = 0, fail = 0;
const ok = (c, name, extra = '') => { if (c) { pass++; console.log('ok   - ' + name); } else { fail++; console.log('FAIL - ' + name + (extra ? '  ' + extra : '')); } };

const U = {
  cand: '00000000-0000-0000-0000-0000000000c1',
  mA: '00000000-0000-0000-0000-00000000a001',
  vA: '00000000-0000-0000-0000-00000000a002',
  mB: '00000000-0000-0000-0000-00000000b001',
  mC: '00000000-0000-0000-0000-00000000c001',
  admin: '00000000-0000-0000-0000-00000000ad01',
};
const CO = { A: '00000000-0000-0000-0000-0000000000aa', B: '00000000-0000-0000-0000-0000000000bb', C: '00000000-0000-0000-0000-0000000000cc' };

// Ejecuta sql con un rol y un sub de JWT; devuelve el resultado de PGlite.
async function as(role, sub, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub','${sub || ''}',false), set_config('request.jwt.claim.role','${role === 'postgres' ? '' : role}',false)`);
  if (role !== 'postgres') await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role'); }
}
async function err(role, sub, sql, params) {
  try { await as(role, sub, sql, params); return null; } catch (e) { return String(e.message || e); }
}
const rows = async (...a) => (await as(...a)).rows;
const one = async (...a) => (await as(...a)).rows[0];
const expectErr = async (name, re, ...a) => {
  const m = await err(...a);
  ok(m !== null && re.test(m), name, m === null ? '(no hubo error)' : m);
};

// ---------------------------------------------------------------------------
// STUBS con las definiciones reales de produccion (29/10/2026)
// ---------------------------------------------------------------------------
await db.exec(`
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true),'') $$;
grant usage on schema auth, public to anon, authenticated, service_role;
-- Como en Supabase: todo lo que se cree en public queda concedido a anon/authenticated/service_role
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create table public.profiles(id uuid primary key references auth.users(id), role text default 'professional', country_code text);
create table public.companies(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
  company_name varchar not null, legal_name varchar, tax_id varchar unique, company_email varchar unique, status varchar default 'PENDING',
  credit_balance integer default 0, total_credits_used integer default 0, website text, description text, logo_url text, admin_notes text,
  constraint companies_status_check check (status in ('PENDING','APPROVED','REJECTED','SUSPENDED')));
revoke select on public.companies from anon, authenticated;
grant select (id, company_name, logo_url) on public.companies to anon, authenticated;
create table public.company_users(
  id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, role varchar,
  unique(company_id,user_id), constraint company_users_role_check check (role in ('OWNER','ADMIN','MEMBER','VIEWER')));
create table public.company_credits_history(id uuid primary key default gen_random_uuid(), company_id uuid, amount int, balance_after int, transaction_type text, reference_id uuid, description text, created_by uuid);

create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete set null,
  title varchar not null, slug varchar, department varchar,
  employment_type varchar, work_mode varchar, experience_level varchar,
  location_city varchar, location_state varchar, location_country varchar, is_remote boolean default false,
  description text not null, responsibilities text[], requirements text[], nice_to_have text[], benefits text[],
  required_skills varchar[], optional_skills varchar[],
  salary_min integer, salary_max integer, salary_currency varchar default 'USD', salary_period varchar, show_salary boolean default false,
  application_deadline timestamptz, application_email varchar, application_url text, application_instructions text,
  status varchar default 'DRAFT', published_at timestamptz, closed_at timestamptz,
  meta_title varchar, meta_description text, views_count integer default 0, applications_count integer default 0,
  metadata jsonb default '{}'::jsonb, credits_cost integer default 30,
  constraint job_postings_employment_type_check check (employment_type in ('FULL_TIME','PART_TIME','CONTRACT','TEMPORARY','INTERNSHIP','FREELANCE')),
  constraint job_postings_experience_level_check check (experience_level in ('ENTRY','JUNIOR','MID','SENIOR','LEAD','EXECUTIVE')),
  constraint job_postings_salary_period_check check (salary_period in ('HOURLY','MONTHLY','YEARLY')),
  constraint job_postings_slug_key unique (slug),
  constraint job_postings_status_check check (status in ('DRAFT','PUBLISHED','PAUSED','CLOSED','FILLED')),
  constraint job_postings_work_mode_check check (work_mode in ('REMOTE','ONSITE','HYBRID')),
  constraint valid_deadline check (application_deadline is null or application_deadline > created_at),
  constraint valid_salary_range check (salary_max is null or salary_min is null or salary_max >= salary_min));
create table public.job_posting_questions(id uuid primary key default gen_random_uuid(), job_posting_id uuid references public.job_postings(id) on delete cascade,
  question_text text, question_type varchar, options jsonb, is_required boolean, order_index int, created_at timestamptz default now());
create table public.job_applications(id uuid primary key default gen_random_uuid(), job_posting_id uuid references public.job_postings(id) on delete cascade,
  profile_id uuid, company_id uuid, status varchar default 'NEW', internal_notes text, rating int);

-- funciones reales
CREATE OR REPLACE FUNCTION public.current_user_is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$ SELECT COALESCE((SELECT lower(p.role) = 'admin' FROM public.profiles p WHERE p.id = auth.uid()), false); $f$;
CREATE OR REPLACE FUNCTION public.assert_caller_matches_user(p_user_id uuid, p_allow_admin boolean DEFAULT false, p_allow_manager boolean DEFAULT false)
 RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $f$
DECLARE v_role TEXT := auth.role(); v_uid UUID := auth.uid();
BEGIN
  IF v_role = 'service_role' THEN RETURN; END IF;
  IF v_role = 'anon' THEN RAISE EXCEPTION 'ANON_NOT_ALLOWED: esta función requiere un usuario autenticado' USING ERRCODE = '42501'; END IF;
  IF v_role = 'authenticated' THEN
    IF v_uid IS NOT NULL AND p_user_id IS NOT DISTINCT FROM v_uid THEN RETURN; END IF;
    RAISE EXCEPTION 'USER_MISMATCH: p_user_id no corresponde al usuario autenticado' USING ERRCODE = '42501';
  END IF;
  RETURN;
END; $f$;
CREATE OR REPLACE FUNCTION public.update_job_posting_updated_at() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $f$;
CREATE OR REPLACE FUNCTION public.generate_job_posting_slug() RETURNS trigger LANGUAGE plpgsql AS $f$
DECLARE base_slug TEXT; final_slug TEXT; counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g'));
        IF NEW.location_city IS NOT NULL THEN base_slug := base_slug || '-' || lower(regexp_replace(NEW.location_city, '\\s+', '-', 'g')); END IF;
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM job_postings WHERE slug = final_slug AND id != NEW.id) LOOP counter := counter + 1; final_slug := base_slug || '-' || counter; END LOOP;
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END; $f$;
CREATE OR REPLACE FUNCTION public.job_postings_proteger_publicacion() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $f$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'PUBLISHED' THEN RAISE EXCEPTION 'PUBLISH_REQUIRES_CREDITS' USING ERRCODE = '42501'; END IF;
    NEW.published_at := NULL; NEW.views_count := 0; NEW.applications_count := 0; NEW.credits_cost := 30; RETURN NEW;
  END IF;
  IF NEW.credits_cost IS DISTINCT FROM OLD.credits_cost OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.views_count IS DISTINCT FROM OLD.views_count OR NEW.applications_count IS DISTINCT FROM OLD.applications_count THEN
    RAISE EXCEPTION 'PROTECTED_FIELD' USING ERRCODE = '42501'; END IF;
  IF NEW.status = 'PUBLISHED' AND OLD.status IS DISTINCT FROM 'PUBLISHED' AND NOT (OLD.status = 'PAUSED' AND OLD.published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'PUBLISH_REQUIRES_CREDITS' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END; $f$;
CREATE TRIGGER trg_job_postings_proteger_publicacion BEFORE INSERT OR UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION job_postings_proteger_publicacion();
CREATE TRIGGER trigger_generate_job_posting_slug BEFORE INSERT OR UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION generate_job_posting_slug();
CREATE TRIGGER trigger_update_job_posting_timestamp BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION update_job_posting_updated_at();

CREATE OR REPLACE FUNCTION public.get_job_posting_detail(p_slug character varying)
 RETURNS TABLE(id uuid, title character varying, slug character varying, company_id uuid, department character varying, employment_type character varying, work_mode character varying, experience_level character varying, location_city character varying, location_state character varying, location_country character varying, is_remote boolean, description text, responsibilities text[], requirements text[], nice_to_have text[], benefits text[], required_skills character varying[], optional_skills character varying[], salary_min integer, salary_max integer, salary_currency character varying, salary_period character varying, show_salary boolean, application_deadline timestamp with time zone, application_email character varying, application_url text, application_instructions text, published_at timestamp with time zone, company_name character varying, company_logo_url text, company_website text, company_description text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
    RETURN QUERY
    SELECT jp.id, jp.title, jp.slug, jp.company_id, jp.department, jp.employment_type, jp.work_mode, jp.experience_level, jp.location_city, jp.location_state, jp.location_country, jp.is_remote, jp.description, jp.responsibilities, jp.requirements, jp.nice_to_have, jp.benefits, jp.required_skills, jp.optional_skills, jp.salary_min, jp.salary_max, jp.salary_currency, jp.salary_period, jp.show_salary, jp.application_deadline, jp.application_email, jp.application_url, jp.application_instructions, jp.published_at, c.company_name, c.logo_url, c.website, c.description
    FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
    WHERE jp.slug = p_slug AND jp.status = 'PUBLISHED' AND jp.published_at IS NOT NULL AND c.status = 'APPROVED';
END; $f$;
CREATE OR REPLACE FUNCTION public.search_public_jobs(p_search_term text DEFAULT NULL, p_location text DEFAULT NULL, p_employment_type text DEFAULT NULL, p_work_mode text DEFAULT NULL, p_experience_level text DEFAULT NULL, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title character varying, slug character varying, company_id uuid, company_name character varying, company_logo_url text, employment_type character varying, work_mode character varying, experience_level character varying, location_city character varying, location_country character varying, is_remote boolean, description text, required_skills character varying[], salary_min integer, salary_max integer, salary_currency character varying, show_salary boolean, published_at timestamp with time zone, application_deadline timestamp with time zone, views_count integer, applications_count integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
    RETURN QUERY
    SELECT jp.id, jp.title, jp.slug, jp.company_id, c.company_name, c.logo_url, jp.employment_type, jp.work_mode, jp.experience_level, jp.location_city, jp.location_country, jp.is_remote, jp.description, jp.required_skills, jp.salary_min, jp.salary_max, jp.salary_currency, jp.show_salary, jp.published_at, jp.application_deadline, jp.views_count, jp.applications_count
    FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
    WHERE jp.status = 'PUBLISHED' AND jp.published_at IS NOT NULL AND (jp.application_deadline IS NULL OR jp.application_deadline > NOW()) AND c.status = 'APPROVED'
      AND (p_search_term IS NULL OR jp.title ILIKE '%' || p_search_term || '%' OR jp.description ILIKE '%' || p_search_term || '%' OR c.company_name ILIKE '%' || p_search_term || '%')
    ORDER BY jp.published_at DESC LIMIT p_limit OFFSET p_offset;
END; $f$;
CREATE OR REPLACE FUNCTION public.publish_job_posting(p_job_posting_id uuid, p_company_id uuid, p_user_id uuid, p_duration_days integer DEFAULT 30)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$ BEGIN RAISE EXCEPTION 'legacy: cobraba creditos'; END; $f$;

-- RLS y politicas reales de job_postings / job_posting_questions
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posting_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company admins can delete job postings" ON public.job_postings FOR DELETE USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN')));
CREATE POLICY "Company members can create job postings" ON public.job_postings FOR INSERT WITH CHECK (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE POLICY "Company members can update job postings" ON public.job_postings FOR UPDATE USING (EXISTS (SELECT 1 FROM company_users WHERE company_users.company_id = job_postings.company_id AND company_users.user_id = auth.uid() AND role IN ('OWNER','ADMIN','MEMBER')));
CREATE POLICY "Company members can update their job postings" ON public.job_postings FOR UPDATE USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
CREATE POLICY "Company members view their own jobs" ON public.job_postings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = job_postings.company_id AND cu.user_id = auth.uid()));
CREATE POLICY "Public read access to published jobs" ON public.job_postings FOR SELECT USING (status = 'PUBLISHED' AND published_at IS NOT NULL AND (application_deadline IS NULL OR application_deadline > now()));
CREATE POLICY "Anyone can view questions for published jobs" ON public.job_posting_questions FOR SELECT USING (job_posting_id IN (SELECT id FROM job_postings WHERE status = 'PUBLISHED'));
CREATE POLICY "Company members manage questions" ON public.job_posting_questions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM job_postings jp JOIN company_users cu ON cu.company_id = jp.company_id WHERE jp.id = job_posting_questions.job_posting_id AND cu.user_id = auth.uid()));
`);

// Datos de arranque (como postgres)
for (const [k, id] of Object.entries(U)) await db.query(`insert into auth.users(id,email) values ($1,$2)`, [id, k + '@test.local']);
await db.query(`insert into profiles(id, role, country_code) values ($1,'professional','ES'),($2,'professional','ES'),($3,'professional','ES'),($4,'professional','ES'),($5,'professional','ES'),($6,'admin','ES')`,
  [U.cand, U.mA, U.vA, U.mB, U.mC, U.admin]);
await db.query(`insert into companies(id, company_name, company_email, status, credit_balance, tax_id) values
  ($1,'Empresa A','a@a.test','APPROVED',100,'A1'),($2,'Empresa B','b@b.test','APPROVED',100,'B1'),($3,'Empresa C','c@c.test','PENDING',100,'C1')`, [CO.A, CO.B, CO.C]);
await db.query(`insert into company_users(company_id,user_id,role) values ($1,$2,'OWNER'),($1,$3,'VIEWER'),($4,$5,'OWNER'),($6,$7,'OWNER')`,
  [CO.A, U.mA, U.vA, CO.B, U.mB, CO.C, U.mC]);

// Ofertas heredadas ANTES de la migracion (slug antiguo roto)
await db.query(`insert into job_postings(id, company_id, created_by, title, slug, description, location_city, status, published_at, credits_cost)
  values ('11111111-aaaa-aaaa-aaaa-000000000001', $1, $2, 'Gestión de Proyectos', 'gestin-de-proyectos', 'Descripcion heredada', 'Madrid', 'PUBLISHED', now(), 30)`, [CO.A, U.mA]);
await db.query(`insert into job_postings(id, company_id, created_by, title, slug, description, location_city, status, credits_cost)
  values ('11111111-aaaa-aaaa-aaaa-000000000002', $1, $2, 'Gestión de Compras', 'gestin-de-compras-mlaga', 'Borrador heredado', 'Málaga', 'DRAFT', 30)`, [CO.A, U.mA]);
await db.query(`insert into job_posting_questions(job_posting_id, question_text, question_type, is_required, order_index) values ('11111111-aaaa-aaaa-aaaa-000000000001','¿Experiencia?','TEXT',true,1)`);

// ---------------------------------------------------------------------------
// 1. Aplicar la migracion DOS veces
// ---------------------------------------------------------------------------
let e1 = null, e2 = null;
try { await db.exec(migSql); } catch (e) { e1 = e.message; }
ok(e1 === null, 'migracion: primera aplicacion', e1 || '');
try { await db.exec(migSql); } catch (e) { e2 = e.message; }
ok(e2 === null, 'migracion: segunda aplicacion (idempotente)', e2 || '');
if (e1 || e2) { console.log(`\n${pass} ok, ${fail} fallos`); process.exit(1); }

// ---------------------------------------------------------------------------
// 2. Heredadas, slug, countries
// ---------------------------------------------------------------------------
const L1 = '11111111-aaaa-aaaa-aaaa-000000000001', L2 = '11111111-aaaa-aaaa-aaaa-000000000002';
let r = await one('postgres', null, `select slug, credits_cost, status from job_postings where id=$1`, [L1]);
ok(r.slug === 'gestin-de-proyectos', 'slug ya publicado se conserva', r.slug);
ok(r.credits_cost === 0, 'credits_cost heredado pasa a 0');
r = await one('postgres', null, `select slug from job_postings where id=$1`, [L2]);
ok(/^gestion-de-compras-malaga-[0-9a-f]{8}$/.test(r.slug), 'slug de borrador heredado se regenera sin tildes y con id corto', r.slug);
r = await one('postgres', null, `select public.job_slugify('ÁÉÍÓÚÑ áéíóúñ Ç ü Ñandú — ¿Qué tal? ß') s`);
ok(r.s === 'aeioun-aeioun-c-u-nandu-que-tal-ss', 'job_slugify transliteracion', r.s);
r = await one('anon', null, `select count(*)::int n from countries`);
ok(r.n >= 40, 'countries: anon lee la lista', String(r.n));
r = await one('postgres', null, `select currency from countries where code='MX'`);
ok(r.currency === 'MXN', 'countries: moneda local');
await expectErr('countries: anon no escribe', /permission denied/, 'anon', null, `insert into countries values ('XX','x','x','EUR')`);
await expectErr('countries: candidato no escribe', /row-level security|permission denied/, 'authenticated', U.cand, `insert into countries values ('XX','x','x','EUR')`);
r = await as('authenticated', U.admin, `insert into countries values ('XX','Prueba','Test','EUR')`);
ok(r.affectedRows === 1, 'countries: admin escribe');
await as('postgres', null, `delete from countries where code='XX'`);

// ---------------------------------------------------------------------------
// 3. anon
// ---------------------------------------------------------------------------
r = await rows('anon', null, `select slug, title from job_postings`);
ok(r.length === 1 && r[0].slug === 'gestin-de-proyectos', 'anon: solo ve ofertas publicadas (columnas publicas)', JSON.stringify(r));
await expectErr('anon: no lee notify_emails', /permission denied/, 'anon', null, `select notify_emails from job_postings`);
await expectErr('anon: no lee review_reason', /permission denied/, 'anon', null, `select review_reason from job_postings`);
await expectErr('anon: no lee credits_cost', /permission denied/, 'anon', null, `select credits_cost from job_postings`);
await expectErr('anon: no lee created_by', /permission denied/, 'anon', null, `select created_by from job_postings`);
await expectErr('anon: select * cerrado', /permission denied/, 'anon', null, `select * from job_postings`);
await expectErr('anon: no inserta ofertas', /permission denied/, 'anon', null, `insert into job_postings(company_id,created_by,title,description) values ('${CO.A}','${U.mA}','x','y')`);
r = await rows('anon', null, `select question_text from job_posting_questions`);
ok(r.length === 1, 'anon: preguntas de oferta publicada siguen visibles (politica con subconsulta)');
r = await rows('anon', null, `select title from search_public_jobs()`);
ok(r.length === 1, 'anon: search_public_jobs (heredada) sigue funcionando');
r = await rows('anon', null, `select title, status, accepting_applications from get_job_posting_detail('gestin-de-proyectos')`);
ok(r.length === 1 && r[0].accepting_applications === true, 'anon: get_job_posting_detail sigue funcionando', JSON.stringify(r));
await expectErr('anon: no llama submit_job_for_review', /permission denied|AUTH_REQUIRED/, 'anon', null, `select submit_job_for_review('${L2}')`);
await expectErr('anon: no llama moderar_oferta', /permission denied/, 'anon', null, `select moderar_oferta('${L2}','PUBLISHED')`);
await expectErr('anon: no llama expire_job_postings', /permission denied/, 'anon', null, `select expire_job_postings()`);
await expectErr('anon: no lee email_outbox', /permission denied/, 'anon', null, `select * from email_outbox`);
await expectErr('anon: no lee historial', /permission denied/, 'anon', null, `select * from job_posting_status_history`);
await expectErr('anon: no lee denuncias', /permission denied/, 'anon', null, `select * from job_reports`);
await expectErr('anon: no llama helpers internos', /permission denied/, 'anon', null, `select _outbox_enqueue('x','a@b.c','{}')`);
await expectErr('authenticated: no llama helpers internos', /permission denied/, 'authenticated', U.mA, `select _job_submit('${L2}','${U.mA}',30)`);

// ---------------------------------------------------------------------------
// 4. Candidato (sin empresa)
// ---------------------------------------------------------------------------
r = await rows('authenticated', U.cand, `select id from job_postings`);
ok(r.length === 1, 'candidato: solo ve la publicada, no borradores ajenos', String(r.length));
await expectErr('candidato: no inserta en empresa A', /row-level security/, 'authenticated', U.cand, `insert into job_postings(company_id,created_by,title,description) values ('${CO.A}','${U.cand}','x','y')`);
r = await as('authenticated', U.cand, `update job_postings set title='hack' where id=$1`, [L2]);
ok(r.affectedRows === 0, 'candidato: no actualiza ofertas ajenas');
await expectErr('candidato: submit_job_for_review rechazado', /Unauthorized/, 'authenticated', U.cand, `select submit_job_for_review('${L2}')`);
await expectErr('candidato: moderar_oferta rechazado', /FORBIDDEN/, 'authenticated', U.cand, `select moderar_oferta('${L2}','PUBLISHED')`);
await expectErr('candidato: no lee email_outbox', /permission denied/, 'authenticated', U.cand, `select * from email_outbox`);
await expectErr('candidato: no escribe historial', /permission denied/, 'authenticated', U.cand, `insert into job_posting_status_history(job_id,to_status) values ('${L1}','PUBLISHED')`);

// ---------------------------------------------------------------------------
// 5. Miembro de empresa A
// ---------------------------------------------------------------------------
const longDesc = 'Buscamos una persona para coordinar proyectos con equipos multidisciplinares y clientes. '.repeat(5);
const baseIns = (title, extra = '') => `insert into job_postings(company_id, created_by, title, description, location_city, work_mode, country_code, category, contract_types, schedule, ${extra ? extra.split('|')[0] + ',' : ''} credits_cost)
  values ('${CO.A}', '${U.mA}', $1, $2, 'Madrid', 'ONSITE', 'ES', 'IT', ARRAY['INDEFINITE'], 'FULL_TIME', ${extra ? extra.split('|')[1] + ',' : ''} 30) returning id, slug, status, credits_cost, published_at`;
r = await one('authenticated', U.mA, baseIns('Analista de Datos Sénior'), ['Analista de Datos Sénior', longDesc]);
const J1 = r.id;
ok(r.status === 'DRAFT' && r.credits_cost === 0, 'miembro: inserta borrador y credits_cost se fuerza a 0', JSON.stringify(r));
ok(/^analista-de-datos-senior-madrid-[0-9a-f]{8}$/.test(r.slug), 'slug nuevo: sin tildes, ciudad e id corto', r.slug);
await expectErr('miembro: NO puede insertar PUBLISHED', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `insert into job_postings(company_id,created_by,title,description,status) values ('${CO.A}','${U.mA}','x','y','PUBLISHED')`);
await expectErr('miembro: NO puede insertar AI_REVIEW', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `insert into job_postings(company_id,created_by,title,description,status) values ('${CO.A}','${U.mA}','x','y','AI_REVIEW')`);
await expectErr('miembro: NO puede insertar MANUAL_REVIEW', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `insert into job_postings(company_id,created_by,title,description,status) values ('${CO.A}','${U.mA}','x','y','MANUAL_REVIEW')`);
r = await one('authenticated', U.mA, `insert into job_postings(company_id,created_by,title,description,published_at,views_count) values ('${CO.A}','${U.mA}','Otro','y', now(), 99) returning published_at, views_count`);
ok(r.published_at === null && r.views_count === 0, 'miembro: published_at y contadores se anulan al insertar');
await expectErr('miembro: DRAFT -> PUBLISHED directo prohibido', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1`, [J1]);
await expectErr('miembro: DRAFT -> AI_REVIEW directo prohibido', /STATUS_RESERVED/, 'authenticated', U.mA, `update job_postings set status='AI_REVIEW' where id=$1`, [J1]);
await expectErr('miembro: DRAFT -> MANUAL_REVIEW directo prohibido', /STATUS_RESERVED/, 'authenticated', U.mA, `update job_postings set status='MANUAL_REVIEW' where id=$1`, [J1]);
await expectErr('miembro: no cambia published_at', /PROTECTED_FIELD/, 'authenticated', U.mA, `update job_postings set published_at=now() where id=$1`, [J1]);
await expectErr('miembro: no cambia review_reason', /PROTECTED_FIELD/, 'authenticated', U.mA, `update job_postings set review_reason='ok' where id=$1`, [J1]);
await expectErr('miembro: no cambia reviewed_text_hash', /PROTECTED_FIELD/, 'authenticated', U.mA, `update job_postings set reviewed_text_hash='x' where id=$1`, [J1]);
await expectErr('miembro: no mueve la oferta a otra empresa', /PROTECTED_FIELD|row-level security/, 'authenticated', U.mA, `update job_postings set company_id='${CO.B}' where id=$1`, [J1]);
r = await one('authenticated', U.mA, `update job_postings set credits_cost=99 where id=$1 returning credits_cost`, [J1]);
ok(r.credits_cost === 0, 'miembro: credits_cost siempre 0');
r = await as('authenticated', U.vA, `update job_postings set title='viewer' where id=$1`, [J1]);
ok(r.affectedRows === 0, 'VIEWER no edita ofertas (politica redundante eliminada)');
await expectErr('VIEWER no envia a revision', /Unauthorized/, 'authenticated', U.vA, `select submit_job_for_review($1)`, [J1]);

// submit con datos invalidos
const J2 = (await one('authenticated', U.mA, `insert into job_postings(company_id,created_by,title,description) values ('${CO.A}','${U.mA}','TITULO TODO EN MAYUSCULAS',$1) returning id`, ['corta'])).id;
let m = await err('authenticated', U.mA, `select submit_job_for_review($1)`, [J2]);
ok(m && /JOB_INVALID/.test(m) && /description_too_short/.test(m) && /country_required/.test(m) && /category_required/.test(m) && /title_all_caps/.test(m), 'submit: valida descripcion/pais/categoria/mayusculas', m);
function repeat(s, n) { return s.repeat(n); }
await as('authenticated', U.mA, `update job_postings set title=$2, description=$3, country_code='ES', category='IT', work_mode='REMOTE', contract_types=ARRAY['TEMPORARY'], schedule='PART_TIME' where id=$1`, [J2, 'Titulo ' + repeat('largo ', 20), longDesc]);
m = await err('authenticated', U.mA, `select submit_job_for_review($1)`, [J2]);
ok(m && /title_too_long/.test(m), 'submit: titulo > 100 caracteres', m);
await expectErr('miembro: cierre a mas de 60 dias rechazado por el trigger', /DEADLINE_TOO_FAR/, 'authenticated', U.mA, `update job_postings set application_deadline = now() + interval '90 days' where id=$1`, [J2]);
// Empresa PENDING (C): oferta propia
const JC = (await one('authenticated', U.mC, `insert into job_postings(company_id,created_by,title,description,location_city,work_mode,country_code,category,contract_types,schedule) values ('${CO.C}','${U.mC}','Oferta de C',$1,'Sevilla','ONSITE','ES','IT',ARRAY['INDEFINITE'],'FULL_TIME') returning id`, [longDesc])).id;
await expectErr('empresa PENDING: submit rechazado', /COMPANY_NOT_APPROVED/, 'authenticated', U.mC, `select submit_job_for_review($1)`, [JC]);

// submit valido -> AI_REVIEW, sin aviso a support
r = await one('authenticated', U.mA, `select submit_job_for_review($1) r`, [J1]);
ok(r.r.status === 'AI_REVIEW' && r.r.credits_used === 0, 'submit valido: pasa a AI_REVIEW sin cobro', JSON.stringify(r.r));
r = await one('postgres', null, `select count(*)::int n from email_outbox where payload->>'job_id' = $1`, [J1]);
ok(r.n === 0, 'submit limpio: no encola aviso a support (solo si procede)');
r = await one('postgres', null, `select application_deadline > now() + interval '29 days' and application_deadline < now() + interval '31 days' ok from job_postings where id=$1`, [J1]);
ok(r.ok, 'submit: cierre por defecto = 30 dias');
r = await one('postgres', null, `select credit_balance from companies where id=$1`, [CO.A]);
ok(r.credit_balance === 100, 'submit: no toca creditos de la empresa');
await expectErr('submit repetido: INVALID_STATE', /INVALID_STATE/, 'authenticated', U.mA, `select submit_job_for_review($1)`, [J1]);
await expectErr('miembro: AI_REVIEW -> PUBLISHED prohibido', /IN_REVIEW/, 'authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1`, [J1]);
await expectErr('miembro: AI_REVIEW -> DRAFT prohibido', /IN_REVIEW/, 'authenticated', U.mA, `update job_postings set status='DRAFT' where id=$1`, [J1]);
await expectErr('miembro: AI_REVIEW -> CLOSED prohibido', /IN_REVIEW/, 'authenticated', U.mA, `update job_postings set status='CLOSED' where id=$1`, [J1]);

// submit marcado por filtro previo -> MANUAL_REVIEW + aviso a support@
const JM = (await one('authenticated', U.mA, baseIns('Vendedor con inversión'), ['Vendedor con inversión', longDesc + ' Se requiere una inversión inicial de 200 euros y contactar por WhatsApp.'])).id;
r = await one('authenticated', U.mA, `select submit_job_for_review($1) r`, [JM]);
ok(r.r.status === 'MANUAL_REVIEW' && r.r.flags.includes('DINERO') && r.r.flags.includes('CONTACTO_EXTERNO'), 'submit sospechoso: MANUAL_REVIEW con motivos', JSON.stringify(r.r));
r = await one('postgres', null, `select count(*)::int n, min(to_email) e from email_outbox where kind='job_manual_review' and payload->>'job_id'=$1`, [JM]);
ok(r.n === 1 && r.e === 'support@yourcvpassport.com', 'submit sospechoso: encola aviso a support@yourcvpassport.com', JSON.stringify(r));
await expectErr('miembro: MANUAL_REVIEW -> PUBLISHED prohibido', /IN_REVIEW/, 'authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1`, [JM]);
await expectErr('miembro: MANUAL_REVIEW -> DRAFT prohibido', /IN_REVIEW/, 'authenticated', U.mA, `update job_postings set status='DRAFT' where id=$1`, [JM]);
r = await one('postgres', null, `select count(*)::int n from email_outbox where sent_at is not null`);
ok(r.n === 0, 'ningun correo se marca como enviado (solo se encola)');

// ---------------------------------------------------------------------------
// 6. Miembro de empresa B: aislamiento
// ---------------------------------------------------------------------------
r = await rows('authenticated', U.mB, `select id from job_postings where company_id='${CO.A}' and status <> 'PUBLISHED'`);
ok(r.length === 0, 'B: no ve borradores/revisiones de A');
r = await as('authenticated', U.mB, `update job_postings set title='robado' where id=$1`, [J1]);
ok(r.affectedRows === 0, 'B: no actualiza ofertas de A');
r = await as('authenticated', U.mB, `update job_postings set status='PUBLISHED' where id=$1`, [JM]);
ok(r.affectedRows === 0, 'B: no publica la oferta de A en revision');
await expectErr('B: no envia a revision una oferta de A', /Unauthorized/, 'authenticated', U.mB, `select submit_job_for_review($1)`, [J2]);
await expectErr('B: no inserta ofertas en la empresa A', /row-level security/, 'authenticated', U.mB, `insert into job_postings(company_id,created_by,title,description) values ('${CO.A}','${U.mB}','x','y')`);
r = await rows('authenticated', U.mB, `select * from job_posting_status_history where job_id=$1`, [J1]);
ok(r.length === 0, 'B: no lee el historial de ofertas de A');
r = await as('authenticated', U.mB, `delete from job_postings where id=$1`, [J1]);
ok(r.affectedRows === 0, 'B: no borra ofertas de A');
await expectErr('B: publish_job_posting de empresa ajena', /Unauthorized|USER_MISMATCH/, 'authenticated', U.mB, `select publish_job_posting($1,$2,$3,30)`, [J2, CO.A, U.mB]);

// ---------------------------------------------------------------------------
// 7. Admin / service_role: moderar_oferta
// ---------------------------------------------------------------------------
await expectErr('miembro: moderar_oferta rechazado', /FORBIDDEN/, 'authenticated', U.mA, `select moderar_oferta($1,'PUBLISHED')`, [J1]);
await expectErr('admin: decision invalida', /INVALID_DECISION/, 'authenticated', U.admin, `select moderar_oferta($1,'CLOSED')`, [J1]);
await expectErr('admin: REJECTED exige motivo', /MOTIVO_REQUIRED/, 'authenticated', U.admin, `select moderar_oferta($1,'REJECTED')`, [JM]);
await expectErr('admin: REJECTED con motivo vacio', /MOTIVO_REQUIRED/, 'authenticated', U.admin, `select moderar_oferta($1,'REJECTED','   ')`, [JM]);
r = await one('authenticated', U.admin, `select moderar_oferta($1,'REJECTED','Pide dinero al candidato') r`, [JM]);
ok(r.r.status === 'REJECTED', 'admin: rechaza con motivo', JSON.stringify(r.r));
r = await one('postgres', null, `select review_reason from job_postings where id=$1`, [JM]);
ok(r.review_reason === 'Pide dinero al candidato', 'admin: motivo guardado en review_reason');
r = await one('postgres', null, `select count(*)::int n, min(to_email) e from email_outbox where kind='job_rejected' and payload->>'job_id'=$1`, [JM]);
ok(r.n === 1 && r.e === 'a@a.test', 'rechazo: encola aviso a la empresa', JSON.stringify(r));
r = await one('authenticated', U.mA, `select status, review_reason from job_postings where id=$1`, [JM]);
ok(r.status === 'REJECTED' && r.review_reason, 'miembro ve el motivo del rechazo');
r = await one('authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED') r`, [J1]);
ok(r.r.status === 'PUBLISHED' && r.r.published_at, 'admin: publica (AI_REVIEW -> PUBLISHED) y fija published_at', JSON.stringify(r.r));
r = await one('postgres', null, `select application_deadline between now()+interval '29 days' and now()+interval '31 days' ok, reviewed_by, reviewed_text_hash is not null h from job_postings where id=$1`, [J1]);
ok(r.ok && r.reviewed_by === U.admin && r.h, 'admin: cierre +30 dias, reviewed_by y hash del texto aprobado');
r = await one('postgres', null, `select count(*)::int n from email_outbox where kind='job_published' and payload->>'job_id'=$1`, [J1]);
ok(r.n === 1, 'publicar: encola aviso de oferta publicada');
r = await rows('anon', null, `select slug from job_postings where id=$1`, [J1]);
ok(r.length === 1, 'la oferta aprobada ya es visible para anon');
// service_role
r = await one('service_role', null, `select moderar_oferta($1,'MANUAL_REVIEW','Dudas del revisor') r`, [J1]);
ok(r.r.status === 'MANUAL_REVIEW', 'service_role: puede moderar (PUBLISHED -> MANUAL_REVIEW)');
// sin claim de rol no vale ni siquiera con el rol de BD service_role? (claim 'service_role' es lo que cuenta)
await expectErr('moderar_oferta: oferta DRAFT no se modera', /INVALID_STATE/, 'authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED')`, [J2]);
r = await one('authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED') r`, [J1]);
ok(r.r.status === 'PUBLISHED', 'admin vuelve a publicar la oferta');
r = await one('service_role', null, `select count(*)::int n from email_outbox`);
ok(r.n >= 3, 'service_role lee email_outbox', String(r.n));

// Historial
r = await rows('authenticated', U.mA, `select from_status, to_status, source from job_posting_status_history where job_id=$1 order by id`, [J1]);
const seq = r.map((x) => `${x.from_status}>${x.to_status}:${x.source}`).join(' | ');
ok(seq === 'null>DRAFT:direct | DRAFT>AI_REVIEW:submit | AI_REVIEW>PUBLISHED:moderation | PUBLISHED>MANUAL_REVIEW:moderation | MANUAL_REVIEW>PUBLISHED:moderation', 'historial: se llena solo con origen y orden', seq);
r = await one('authenticated', U.admin, `select count(*)::int n from job_posting_status_history where job_id=$1 and changed_by is not null`, [J1]);
ok(r.n >= 3, 'historial: guarda quien hizo el cambio');
await expectErr('historial: miembro no inserta', /permission denied/, 'authenticated', U.mA, `insert into job_posting_status_history(job_id,to_status) values ('${J1}','PUBLISHED')`);
await expectErr('historial: admin tampoco inserta a mano', /permission denied/, 'authenticated', U.admin, `insert into job_posting_status_history(job_id,to_status) values ('${J1}','PUBLISHED')`);
await expectErr('historial: nadie actualiza', /permission denied/, 'authenticated', U.admin, `update job_posting_status_history set to_status='X'`);
await expectErr('historial: nadie borra', /permission denied/, 'authenticated', U.mA, `delete from job_posting_status_history`);
await expectErr('historial: service_role tampoco necesita escribir (anon denegado)', /permission denied/, 'anon', null, `insert into job_posting_status_history(job_id,to_status) values ('${J1}','PUBLISHED')`);

// ---------------------------------------------------------------------------
// 8. Editar una oferta PUBLISHED / pausar / reanudar / cerrar
// ---------------------------------------------------------------------------
r = await one('authenticated', U.mA, `update job_postings set salary_min=2000, salary_max=3000, salary_period='MONTHLY', salary_currency='EUR', show_salary=true, benefits=ARRAY['Seguro'] where id=$1 returning status`, [J1]);
ok(r.status === 'PUBLISHED', 'salario/beneficios en oferta publicada: se aplican al momento (sigue PUBLISHED)');
r = await one('authenticated', U.mA, `update job_postings set title='Analista de Datos Senior II' where id=$1 returning status`, [J1]);
ok(r.status === 'AI_REVIEW', 'cambiar el titulo de una PUBLISHED la devuelve a AI_REVIEW', r.status);
r = await rows('anon', null, `select 1 from job_postings where id=$1`, [J1]);
ok(r.length === 0, 'tras editar el titulo ya no es publica');
r = await one('postgres', null, `select source, reason from job_posting_status_history where job_id=$1 order by id desc limit 1`, [J1]);
ok(r.source === 'edit', 'historial registra el origen «edit»', JSON.stringify(r));
await as('authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED')`, [J1]);
r = await one('authenticated', U.mA, `update job_postings set description=$2 where id=$1 returning status`, [J1, longDesc + ' Ampliada.']);
ok(r.status === 'AI_REVIEW', 'cambiar la descripcion de una PUBLISHED la devuelve a AI_REVIEW');
await as('authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED')`, [J1]);
r = await one('authenticated', U.mA, `update job_postings set status='PAUSED' where id=$1 returning status`, [J1]);
ok(r.status === 'PAUSED', 'miembro pausa una publicada');
r = await one('authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1 returning status`, [J1]);
ok(r.status === 'PUBLISHED', 'miembro reanuda PAUSED -> PUBLISHED (texto aprobado intacto)');
await as('authenticated', U.mA, `update job_postings set status='PAUSED' where id=$1`, [J1]);
r = await one('authenticated', U.mA, `update job_postings set description=$2 where id=$1 returning status`, [J1, longDesc + ' Cambiada durante la pausa.']);
ok(r.status === 'PAUSED', 'editar durante la pausa no publica');
r = await one('authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1 returning status`, [J1]);
ok(r.status === 'AI_REVIEW', 'reanudar tras editar el texto en pausa -> AI_REVIEW (no PUBLISHED)', r.status);
await as('authenticated', U.admin, `select moderar_oferta($1,'PUBLISHED')`, [J1]);
await expectErr('miembro: PUBLISHED -> EXPIRED prohibido', /STATUS_RESERVED/, 'authenticated', U.mA, `update job_postings set status='EXPIRED' where id=$1`, [J1]);
await expectErr('miembro: PUBLISHED -> REJECTED prohibido', /STATUS_RESERVED/, 'authenticated', U.mA, `update job_postings set status='REJECTED' where id=$1`, [J1]);
r = await one('authenticated', U.mA, `update job_postings set status='CLOSED' where id=$1 returning status, closed_by, closed_at`, [J1]);
ok(r.status === 'CLOSED' && r.closed_by === U.mA && r.closed_at, 'miembro cierra: closed_by/closed_at los fija el trigger');
await expectErr('miembro: CLOSED -> PUBLISHED prohibido', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1`, [J1]);
await expectErr('miembro: CLOSED -> PAUSED prohibido', /STATUS_RESERVED/, 'authenticated', U.mA, `update job_postings set status='PAUSED' where id=$1`, [J1]);
const J1slug = (await one('postgres', null, `select slug from job_postings where id=$1`, [J1])).slug;
r = await rows('anon', null, `select status, accepting_applications from get_job_posting_detail($1)`, [J1slug]);
ok(r.length === 1 && r[0].status === 'CLOSED' && r[0].accepting_applications === false, 'ficha publica de oferta CLOSED: visible y sin inscripcion', JSON.stringify(r));

// ---------------------------------------------------------------------------
// 9. publish_job_posting (sin cobro)
// ---------------------------------------------------------------------------
const J3 = (await one('authenticated', U.mA, baseIns('Ingeniero de Software'), ['Ingeniero de Software', longDesc])).id;
await expectErr('publish_job_posting: p_user_id ajeno', /USER_MISMATCH/, 'authenticated', U.mA, `select publish_job_posting($1,$2,$3,30)`, [J3, CO.A, U.mB]);
await expectErr('publish_job_posting: VIEWER', /Unauthorized/, 'authenticated', U.vA, `select publish_job_posting($1,$2,$3,30)`, [J3, CO.A, U.vA]);
await expectErr('publish_job_posting: empresa que no es de la oferta', /Unauthorized|not found/, 'authenticated', U.mB, `select publish_job_posting($1,$2,$3,30)`, [J3, CO.B, U.mB]);
r = await one('authenticated', U.mA, `select publish_job_posting($1,$2,$3,30) r`, [J3, CO.A, U.mA]);
ok(r.r.credits_used === 0 && r.r.new_balance === 100 && r.r.status === 'AI_REVIEW', 'publish_job_posting: no cobra y envia a revision', JSON.stringify(r.r));
r = await one('postgres', null, `select (select count(*)::int from company_credits_history) h, (select credit_balance from companies where id='${CO.A}') b`);
ok(r.h === 0 && r.b === 100, 'publish_job_posting: sin movimientos de creditos');

// credits_cost siempre 0, incluso como postgres / service_role
r = await one('postgres', null, `update job_postings set credits_cost=30 where id=$1 returning credits_cost`, [J3]);
ok(r.credits_cost === 0, 'credits_cost = 0 incluso con un UPDATE de postgres');
r = await one('service_role', null, `update job_postings set credits_cost=30 where id=$1 returning credits_cost`, [J3]);
ok(r.credits_cost === 0, 'credits_cost = 0 incluso con service_role');

// ---------------------------------------------------------------------------
// 10. Caducidad idempotente
// ---------------------------------------------------------------------------
const mk = async (id, title, status, deadline, createdAgo) => db.query(
  `insert into job_postings(id, company_id, created_by, title, description, location_city, work_mode, country_code, category, contract_types, schedule, status, published_at, created_at, application_deadline)
   values ($1,$2,$3,$4,$5,'Madrid','ONSITE','ES','IT',ARRAY['INDEFINITE'],'FULL_TIME',$6, now(), now() - $7::interval, now() + $8::interval)`,
  [id, CO.A, U.mA, title, longDesc, status, createdAgo, deadline]);
const JE = '22222222-aaaa-aaaa-aaaa-000000000001', JS = '22222222-aaaa-aaaa-aaaa-000000000002', JP = '22222222-aaaa-aaaa-aaaa-000000000003';
await mk(JE, 'Oferta vencida', 'PUBLISHED', '-1 day', '40 days');
await mk(JS, 'Oferta por vencer', 'PUBLISHED', '2 days', '10 days');
await mk(JP, 'Oferta pausada vencida', 'PAUSED', '-2 hours', '40 days');
await expectErr('expire: authenticated no puede', /permission denied/, 'authenticated', U.mA, `select expire_job_postings()`);
await expectErr('expire: ni siquiera un admin con sesion (solo service_role/cron)', /permission denied/, 'authenticated', U.admin, `select expire_job_postings()`);
r = await one('service_role', null, `select expire_job_postings() r`);
ok(r.r.expired === 2 && r.r.notices === 1, 'expire: cierra 2 vencidas y avisa 1 (3 dias antes)', JSON.stringify(r.r));
const before = (await one('postgres', null, `select count(*)::int n from email_outbox`)).n;
r = await one('service_role', null, `select expire_job_postings() r`);
ok(r.r.expired === 0 && r.r.notices === 0, 'expire: segunda ejecucion no hace nada (idempotente)', JSON.stringify(r.r));
const after = (await one('postgres', null, `select count(*)::int n from email_outbox`)).n;
ok(before === after, 'expire: no duplica correos encolados', `${before} -> ${after}`);
r = await rows('postgres', null, `select id, status from job_postings where id in ($1,$2,$3) order by id`, [JE, JS, JP]);
ok(r[0].status === 'EXPIRED' && r[1].status === 'PUBLISHED' && r[2].status === 'EXPIRED', 'expire: estados tras la ejecucion', JSON.stringify(r));
r = await one('postgres', null, `select count(*) filter (where kind='job_expiring')::int a, count(*) filter (where kind='job_expired')::int b from email_outbox where payload->>'job_id' in ($1,$2,$3)`, [JE, JS, JP]);
ok(r.a === 1 && r.b === 2, 'expire: 1 aviso previo + 2 avisos de cierre en la cola', JSON.stringify(r));
r = await one('postgres', null, `select source, from_status, to_status from job_posting_status_history where job_id=$1 order by id desc limit 1`, [JE]);
ok(r.source === 'expire' && r.from_status === 'PUBLISHED' && r.to_status === 'EXPIRED', 'expire: queda en el historial');
await expectErr('miembro: EXPIRED -> PUBLISHED prohibido', /PUBLISH_REQUIRES_REVIEW/, 'authenticated', U.mA, `update job_postings set status='PUBLISHED' where id=$1`, [JE]);
r = await one('authenticated', U.mA, `update job_postings set status='DRAFT' where id=$1 returning status`, [JE]);
ok(r.status === 'DRAFT', 'miembro puede volver a borrador una caducada para renovarla');
m = await err('authenticated', U.mA, `select submit_job_for_review($1)`, [JE]);
ok(m && /deadline_past/.test(m), 'renovar exige nueva fecha de cierre', m);
await as('authenticated', U.mA, `update job_postings set application_deadline = now() + interval '20 days' where id=$1`, [JE]);
r = await one('authenticated', U.mA, `select submit_job_for_review($1) r`, [JE]);
ok(r.r.status === 'AI_REVIEW', 'renovada y reenviada a revision');

// ---------------------------------------------------------------------------
// 11. search_public_jobs_v2
// ---------------------------------------------------------------------------
await db.exec(`delete from job_postings where id <> '${L1}'; update job_postings set status='CLOSED' where id='${L1}'`); // limpia; se re-siembra abajo
const pub = async (title, co, country, category, wm, extra) => {
  const id = (await db.query(`insert into job_postings(company_id, created_by, title, description, location_city, work_mode, is_remote, country_code, category, contract_types, schedule, status, ${extra.cols})
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PUBLISHED', ${extra.vals}) returning id`,
    [co, U.mA, title, longDesc + ' ' + title, wm === 'REMOTE' ? null : extra.city, wm, wm === 'REMOTE', country, category, extra.contract || ['INDEFINITE'], extra.sched || 'FULL_TIME'])).rows[0].id;
  return id;
};
const VES = await pub('Desarrollador Madrid', CO.A, 'ES', 'IT', 'ONSITE', { city: 'Madrid', cols: `salary_min, salary_max, salary_period, salary_currency, show_salary`, vals: `2000, 3000, 'MONTHLY', 'EUR', true` });
const VMX = await pub('Remoto desde Mexico', CO.B, 'MX', 'IT', 'REMOTE', { cols: `salary_min, salary_period, salary_currency, show_salary, allowed_countries, contract_types_x`.replace(', contract_types_x', ''), vals: `30000, 'MONTHLY', 'MXN', false, ARRAY['ES','CO']` });
const VCO = await pub('Ventas Bogotá', CO.B, 'CO', 'Ventas', 'ONSITE', { city: 'Bogotá', contract: ['TEMPORARY'], sched: 'PART_TIME', cols: `salary_min, salary_max, salary_period, salary_currency, show_salary`, vals: `10, 12, 'HOURLY', 'COP', true` });
const VPEND = await pub('De empresa pendiente', CO.C, 'ES', 'IT', 'ONSITE', { city: 'Madrid', cols: `show_salary`, vals: `true` });
const VDRAFT = (await db.query(`insert into job_postings(company_id, created_by, title, description, status, country_code) values ($1,$2,'Borrador ES',$3,'DRAFT','ES') returning id`, [CO.A, U.mA, longDesc])).rows[0].id;
await db.query(`update job_postings set published_at = now() - interval '10 days' where id = $1`, [VCO]);
await db.query(`insert into job_applications(job_posting_id, profile_id, company_id, status) values ($1,$2,$3,'NEW')`, [VES, U.cand, CO.A]);

const titles = (x) => x.map((y) => y.title).sort().join(' | ');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_country=>'ES')`);
ok(titles(r) === 'Desarrollador Madrid | Remoto desde Mexico', 'v2 pais=ES: ofertas de ES + remotas que admiten ES, sin empresas no verificadas ni borradores', titles(r));
r = await rows('anon', null, `select * from search_public_jobs_v2(p_country=>'MX')`);
ok(titles(r) === 'Remoto desde Mexico', 'v2 pais=MX', titles(r));
r = await rows('anon', null, `select * from search_public_jobs_v2(p_country=>'CO')`);
ok(titles(r) === 'Remoto desde Mexico | Ventas Bogotá', 'v2 pais=CO', titles(r));
r = await rows('anon', null, `select * from search_public_jobs_v2(p_country=>'FR')`);
ok(r.length === 0, 'v2 pais sin ofertas -> vacio');
r = await rows('anon', null, `select * from search_public_jobs_v2()`);
ok(titles(r) === 'Desarrollador Madrid | Remoto desde Mexico | Ventas Bogotá', 'v2 sin pais: todas las publicadas de empresas APPROVED (+ la heredada sin pais excluida del conteo)', titles(r));
ok(!Object.keys(r[0]).some((k) => ['notify_emails', 'review_reason', 'credits_cost', 'created_by', 'metadata', 'reviewed_by'].includes(k)), 'v2: no devuelve columnas privadas');
ok(r.every((x) => Number(x.total_count) === r.length), 'v2: total_count presente y coherente');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_category=>'Ventas')`);
ok(titles(r) === 'Ventas Bogotá', 'v2 categoria');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_work_mode=>'REMOTE')`);
ok(titles(r) === 'Remoto desde Mexico', 'v2 modalidad');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_contract=>'TEMPORARY')`);
ok(titles(r) === 'Ventas Bogotá', 'v2 contrato');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_schedule=>'PART_TIME')`);
ok(titles(r) === 'Ventas Bogotá', 'v2 jornada');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_min_salary=>2500)`);
ok(titles(r) === 'Desarrollador Madrid | Remoto desde Mexico', 'v2 salario minimo (normaliza por hora/mes; usa el salario aunque no se muestre)', titles(r));
r = await rows('anon', null, `select title, salary_min, salary_currency, show_salary from search_public_jobs_v2(p_country=>'MX')`);
ok(r[0].salary_min === null && r[0].salary_currency === null && r[0].show_salary === false, 'v2: salario oculto si show_salary = false');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_posted_within_days=>7)`);
ok(titles(r) === 'Desarrollador Madrid | Remoto desde Mexico', 'v2 fecha (7 dias)', titles(r));
r = await rows('anon', null, `select * from search_public_jobs_v2(p_search=>'bogot')`);
ok(titles(r) === 'Ventas Bogotá', 'v2 texto');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_search=>'%')`);
ok(r.length === 0, 'v2: los comodines del texto se escapan');
r = await rows('anon', null, `select * from search_public_jobs_v2(p_city=>'madrid')`);
ok(titles(r) === 'Desarrollador Madrid', 'v2 ciudad');
r = await rows('anon', null, `select title, total_count from search_public_jobs_v2(p_limit=>1, p_offset=>1)`);
ok(r.length === 1 && Number(r[0].total_count) === 3, 'v2 paginacion: total_count independiente del limite', JSON.stringify(r));
r = await rows('anon', null, `select title from search_public_jobs_v2(p_limit=>1000)`);
ok(r.length === 3, 'v2: limite acotado a 50');
r = await rows('authenticated', U.cand, `select title, already_applied from search_public_jobs_v2(p_country=>'ES') order by title`);
ok(r.find((x) => x.title === 'Desarrollador Madrid').already_applied === true && r.find((x) => x.title === 'Remoto desde Mexico').already_applied === false, 'v2: «Ya inscrito» para el candidato');
r = await rows('anon', null, `select already_applied from search_public_jobs_v2(p_country=>'ES')`);
ok(r.every((x) => x.already_applied === false), 'v2: anon nunca esta inscrito');
r = await rows('anon', null, `select title, salary_min, salary_mode from get_job_posting_detail((select slug from job_postings where id='${VMX}'))`);
ok(r.length === 1 && r[0].salary_min === null, 'detalle: salario oculto si show_salary = false');
r = await rows('anon', null, `select 1 from get_job_posting_detail((select slug from job_postings where status='DRAFT' limit 1))`);
ok(r.length === 0, 'detalle: un borrador no se sirve');
r = await rows('anon', null, `select 1 from get_job_posting_detail((select slug from job_postings where id='${VPEND}'))`);
ok(r.length === 0, 'detalle: empresa no verificada no se sirve');

// ---------------------------------------------------------------------------
// 12. Denuncias
// ---------------------------------------------------------------------------
await expectErr('denuncia: anon no puede', /permission denied/, 'anon', null, `insert into job_reports(job_id, reason) values ($1,'SCAM')`, [VES]);
await expectErr('denuncia: no se puede denunciar en nombre de otro', /row-level security/, 'authenticated', U.cand, `insert into job_reports(job_id, reporter_id, reason) values ($1,$2,'SCAM')`, [VES, U.mB]);
await as('authenticated', U.cand, `insert into job_reports(job_id, reason, details) values ($1,'SCAM','Piden dinero')`, [VES]);
ok(true, 'denuncia: candidato autenticado denuncia');
await expectErr('denuncia: duplicada rechazada', /duplicate key|unique/, 'authenticated', U.cand, `insert into job_reports(job_id, reason) values ($1,'SCAM')`, [VES]);
await expectErr('denuncia: oferta no publicada rechazada', /row-level security/, 'authenticated', U.cand, `insert into job_reports(job_id, reason) values ($1,'SCAM')`, [VDRAFT]);
r = await rows('authenticated', U.cand, `select * from job_reports`);
ok(r.length === 0, 'denuncia: el denunciante no lee denuncias');
r = await rows('authenticated', U.admin, `select * from job_reports`);
ok(r.length === 1, 'denuncia: admin lee');
r = await one('postgres', null, `select count(*)::int n from email_outbox where kind='job_reported' and to_email='support@yourcvpassport.com'`);
ok(r.n === 1, 'denuncia: encola aviso a support@');
await as('authenticated', U.mB, `insert into job_reports(job_id, reason) values ($1,'MISLEADING')`, [VES]);
r = await one('postgres', null, `select status from job_postings where id=$1`, [VES]);
ok(r.status === 'PUBLISHED', 'denuncia: con 2 abiertas la oferta sigue publicada');
await as('authenticated', U.mC, `insert into job_reports(job_id, reason) values ($1,'OTHER')`, [VES]);
r = await one('postgres', null, `select status, review_reason from job_postings where id=$1`, [VES]);
ok(r.status === 'AI_REVIEW', 'denuncia: 3 abiertas distintas -> vuelve a AI_REVIEW', JSON.stringify(r));
r = await as('authenticated', U.cand, `update job_reports set status='DISMISSED'`);
ok(r.affectedRows === 0, 'denuncia: solo admin gestiona');

// ---------------------------------------------------------------------------
// 13. Reaplicar con datos y privilegios finales
// ---------------------------------------------------------------------------
const polBefore = (await one('postgres', null, `select count(*)::int n from pg_policies`)).n;
let e3 = null;
try { await db.exec(migSql); } catch (e) { e3 = e.message; }
ok(e3 === null, 'migracion: tercera aplicacion con datos', e3 || '');
const polAfter = (await one('postgres', null, `select count(*)::int n from pg_policies`)).n;
ok(polBefore === polAfter, 'migracion: no duplica politicas', `${polBefore} -> ${polAfter}`);
r = await one('postgres', null, `select slug from job_postings where id=$1`, [L1]);
ok(r.slug === 'gestin-de-proyectos', 'tras reaplicar: el slug publicado sigue igual');
r = await one('postgres', null, `select has_column_privilege('anon','public.job_postings','notify_emails','SELECT') a, has_column_privilege('anon','public.job_postings','slug','SELECT') b,
  has_table_privilege('anon','public.email_outbox','SELECT') c, has_table_privilege('authenticated','public.email_outbox','SELECT') d,
  has_function_privilege('authenticated','public.expire_job_postings()','EXECUTE') e, has_function_privilege('anon','public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int)','EXECUTE') f,
  has_function_privilege('anon','public.get_job_posting_detail(varchar)','EXECUTE') g, has_function_privilege('anon','public.publish_job_posting(uuid,uuid,uuid,int)','EXECUTE') h`);
ok(!r.a && r.b && !r.c && !r.d && !r.e && r.f && r.g && !r.h, 'privilegios finales como se esperan', JSON.stringify(r));

console.log(`\n${pass} ok, ${fail} fallos`);
process.exit(fail ? 1 : 0);
