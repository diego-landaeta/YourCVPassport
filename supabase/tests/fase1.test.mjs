// Test de la migración 20261029_legal_aceptaciones_idioma.sql en PGlite.
// Stubs con las definiciones REALES de producción (29/10/2026).
import { PGlite } from '@electric-sql/pglite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const HERE = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');
const MIG = HERE + '../migrations/20261029_legal_aceptaciones_idioma.sql';
const migSql = readFileSync(MIG, 'utf8');

const db = new PGlite();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  OK   ' + m); } else { fail++; console.log('  FAIL ' + m); } };
const U = {
  existing: '00000000-0000-0000-0000-0000000000e1',
  A: '00000000-0000-0000-0000-00000000000a',
  B: '00000000-0000-0000-0000-00000000000b',
  C: '00000000-0000-0000-0000-00000000000c',
  EMP: '00000000-0000-0000-0000-0000000000e2',
  ADMIN: '00000000-0000-0000-0000-0000000000ad',
};
const CO = '00000000-0000-0000-0000-00000000c001';
const JOB = '00000000-0000-0000-0000-0000000000b1';

async function as(role, uid, headers) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.role', $2, false), set_config('request.headers', $3, false)",
    [uid ?? '', role === 'postgres' ? '' : role, headers ? JSON.stringify(headers) : '']);
  if (role !== 'postgres') await db.exec(`set role ${role}`);
}
async function q(sql, params) { return (await db.query(sql, params)).rows; }
process.on("unhandledRejection", e => { console.log("ERROR NO CAPTURADO:", e.message); process.exit(2); });
async function err(sql, params) {
  try { if (params === undefined) await db.exec(sql); else await db.query(sql, params); return null; } catch (e) { try { await db.exec("rollback"); } catch {} return e; }
}
const denied = (e) => e && (e.code === '42501' || /permission denied|row-level security|new row violates/i.test(e.message));

// ---------------------------------------------------------------- stubs
await db.exec(`
create role anon nologin; create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
create schema auth; grant usage on schema auth to anon, authenticated, service_role;
-- Como Supabase: los objetos nuevos de public se conceden a los tres roles.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant select on auth.users to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- profiles: columnas reales de producción
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, headline text, summary text, slug text unique, meta_title text, meta_description text,
 template text default 'modern', template_color text default '#0052FF', availability text, location text,
 phone text, linkedin_url text, github_url text, gender text, portfolio_url text, job_seeking_status text,
 avatar_url text, open_to_remote boolean default false, website_url text, twitter_url text, instagram_url text,
 youtube_url text, behance_url text, dribbble_url text, job_type text[], willing_to_relocate boolean default false,
 preferred_locations text[], slug_validation_error text, email text, name text,
 role text default 'PROFESSIONAL', plan text default 'free', handle text, title text, remote_preference text,
 salary_min bigint, salary_max bigint, salary_currency text default 'USD',
 created_at timestamptz default now(), updated_at timestamptz default now(),
 show_verified_credentials boolean default false, show_connect_links boolean default true,
 show_qr_code boolean default true, show_availability_badge boolean default true, country_code text,
 remote boolean default false, work_mode text, last_slug_changed_at timestamptz,
 dashboard_tour_completed boolean default false, first_login_completed boolean default false,
 wizard_completed boolean default false, is_active boolean default true not null, suspension_reason text,
 suspended_until timestamptz, profile_hidden boolean default false not null, search_blocked boolean default false not null,
 messages_blocked boolean default false not null, banner_url text, is_open_to_messages boolean default true,
 managed_by uuid references auth.users(id) on delete set null, is_premium boolean
);
alter table public.profiles enable row level security;
create policy "pub" on public.profiles for select to anon, authenticated using (slug is not null and profile_hidden is not true and is_active is not false);
create policy "own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "upd" on public.profiles for update using (auth.uid() = id);

create function public.current_user_is_admin() returns boolean language sql stable security definer set search_path to public as
 $$ select coalesce((select lower(p.role) = 'admin' from public.profiles p where p.id = auth.uid()), false) $$;

-- companies: columnas y CHECK reales
create table public.companies(
 id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
 company_name varchar not null, legal_name varchar not null, tax_id varchar not null unique,
 company_email varchar not null unique, company_phone varchar, website_url varchar, address_street varchar,
 address_city varchar, address_state varchar, address_country varchar, address_postal varchar, industry varchar,
 company_size varchar, description text, logo_url text, tax_document_url text, verification_document_url text,
 status varchar default 'PENDING', verified_at timestamptz, verified_by uuid references auth.users(id) on delete set null,
 rejection_reason text, admin_notes text, credit_balance integer not null default 0,
 total_credits_purchased integer default 0, total_credits_used integer default 0, signup_ip varchar,
 last_login_at timestamptz, metadata jsonb default '{}', website text, created_by uuid references auth.users(id) on delete set null,
 constraint companies_company_size_check check ((company_size)::text = any ((array['1-10','11-50','51-200','201-500','501-1000','1000+'])::text[])),
 constraint companies_status_check check ((status)::text = any ((array['PENDING','APPROVED','REJECTED','SUSPENDED'])::text[]))
);
alter table public.companies enable row level security;
create policy "approved" on public.companies for select using (status = 'APPROVED');
create table public.company_users(id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 user_id uuid not null, role varchar default 'MEMBER', invited_by uuid, invited_at timestamptz default now(), accepted_at timestamptz, created_at timestamptz default now());
create function public.is_company_member(p_company_id uuid, p_roles text[] default null) returns boolean language sql stable security definer set search_path to public as
 $$ select auth.uid() is not null and exists (select 1 from public.company_users cu where cu.company_id = p_company_id and cu.user_id = auth.uid() and (p_roles is null or cu.role = any (p_roles))) $$;
create table public.job_postings(id uuid primary key default gen_random_uuid(), company_id uuid references public.companies(id), status varchar);

-- Vistas reales
create view public.profiles_full with (security_barrier=true) as
 select id, full_name, headline, summary, slug, meta_title, meta_description, template, template_color, availability, location, phone, linkedin_url, github_url, gender, portfolio_url, job_seeking_status, avatar_url, open_to_remote, website_url, twitter_url, instagram_url, youtube_url, behance_url, dribbble_url, job_type, willing_to_relocate, preferred_locations, slug_validation_error, email, name, role, plan, handle, title, remote_preference, salary_min, salary_max, salary_currency, created_at, updated_at, show_verified_credentials, show_connect_links, show_qr_code, show_availability_badge, country_code, remote, work_mode, last_slug_changed_at, dashboard_tour_completed, first_login_completed, wizard_completed, is_active, suspension_reason, suspended_until, profile_hidden, search_blocked, messages_blocked, banner_url, is_open_to_messages, managed_by, is_premium
 from public.profiles p where (id = auth.uid()) or (managed_by = auth.uid()) or public.current_user_is_admin();
create view public.companies_full with (security_barrier=true) as
 select id, created_at, updated_at, company_name, legal_name, tax_id, company_email, company_phone, website_url, address_street, address_city, address_state, address_country, address_postal, industry, company_size, description, logo_url, tax_document_url, verification_document_url, status, verified_at, verified_by, rejection_reason, admin_notes, credit_balance, total_credits_purchased, total_credits_used, signup_ip, last_login_at, metadata, website, created_by
 from public.companies c where (created_by = auth.uid()) or public.is_company_member(id) or public.current_user_is_admin();
revoke all on public.profiles_full, public.companies_full from anon, authenticated;
grant select on public.profiles_full, public.companies_full to authenticated;

-- Cierre por columnas (20261006 y 20261009b)
revoke select on public.profiles from public, anon, authenticated;
grant select (id, full_name, name, headline, summary, slug, handle, title, meta_title, meta_description, template, template_color, availability, location, country_code, gender, avatar_url, banner_url, linkedin_url, github_url, portfolio_url, website_url, twitter_url, instagram_url, youtube_url, behance_url, dribbble_url, job_seeking_status, job_type, open_to_remote, remote, remote_preference, work_mode, willing_to_relocate, preferred_locations, show_verified_credentials, show_connect_links, show_qr_code, show_availability_badge, is_open_to_messages, wizard_completed, is_premium, is_active, profile_hidden, role, created_at, updated_at) on public.profiles to anon, authenticated;
revoke insert, update, delete on public.profiles from anon;
revoke select on public.companies from public, anon, authenticated;
grant select (id, company_name, logo_url) on public.companies to anon, authenticated;
revoke insert, update, delete on public.companies from anon;

-- handle_new_user REAL de producción (sin la migración)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path to 'public' as $function$
DECLARE
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));
  INSERT INTO public.profiles (id, email, full_name, headline, summary, role, plan, created_at, updated_at)
  VALUES (NEW.id, NEW.email, user_full_name, '', '', 'professional', 'free', NOW(), NOW());
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- profiles_bloquear_campos_protegidos REAL (resumida a lo relevante: role/plan/managed_by)
create function public.profiles_bloquear_campos_protegidos() returns trigger language plpgsql security definer set search_path to 'public' as $f$
DECLARE v_role text := COALESCE(auth.role(), '');
BEGIN
  IF v_role NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
  IF public.current_user_is_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.plan IS DISTINCT FROM OLD.plan) THEN
    RAISE EXCEPTION 'PROTECTED_FIELD' USING ERRCODE = '42501'; END IF;
  RETURN NEW;
END; $f$;
create trigger trg_profiles_bloquear_campos_protegidos before insert or update on public.profiles for each row execute function public.profiles_bloquear_campos_protegidos();
`);

// Usuario EXISTENTE (anterior a la migración)
await as('postgres');
await db.query("insert into auth.users values ($1,'existing@x.com','{\"full_name\":\"Ya Existia\"}')", [U.existing]);
ok((await q("select count(*)::int n from public.profiles where id=$1", [U.existing]))[0].n === 1, 'stub: perfil del usuario existente creado con handle_new_user de produccion');

// ---------------------------------------------------------------- migración x2
console.log('\n== Migracion (aplicada DOS veces) ==');
await as('postgres');
let e1 = await err(migSql); ok(!e1, 'primera aplicacion sin error' + (e1 ? ': ' + e1.message : ''));
let e2 = await err(migSql); ok(!e2, 'segunda aplicacion sin error' + (e2 ? ': ' + e2.message : ''));
ok((await q('select count(*)::int n from public.documentos_legales'))[0].n === 8, 'documentos_legales: 8 filas (4 tipos x es/en), sin duplicar tras 2 aplicaciones');
ok((await q('select count(*)::int n from public.countries'))[0].n === 40, 'countries: 40 paises');
ok((await q("select count(*)::int n from public.countries where currency is null or currency=''"))[0].n === 0, 'countries: todos con moneda');
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === 0, 'aceptaciones: 0 (la semilla no se aplica a nadie)');
ok((await q('select count(*)::int n from public.documentos_legales where borrador'))[0].n === 8, 'documentos semilla marcados como borrador');
ok((await q("select count(*)::int n from pg_policies where schemaname='public' and tablename in ('documentos_legales','aceptaciones','countries','company_ai_reviews')"))[0].n === 8, 'politicas sin duplicar tras 2 aplicaciones (8)');

// Vistas conservan opciones y grants
const vopt = await q("select relname, reloptions::text o from pg_class where relname in ('profiles_full','companies_full') order by 1");
ok(vopt.every(r => /security_barrier=true/.test(r.o)), 'vistas conservan security_barrier=true');
const vgr = await q("select table_name, grantee, privilege_type from information_schema.role_table_grants where table_name in ('profiles_full','companies_full') and grantee in ('anon','authenticated','public') order by 1,2,3");
ok(vgr.length === 2 && vgr.every(r => r.grantee === 'authenticated' && r.privilege_type === 'SELECT'), 'vistas: solo SELECT para authenticated (anon sin acceso)');
const vcols = await q("select column_name from information_schema.columns where table_name='profiles_full' order by ordinal_position desc limit 2");
ok(vcols[0].column_name === 'fecha_nacimiento' && vcols[1].column_name === 'registro_idioma', 'profiles_full: columnas nuevas al final');

// ---------------------------------------------------------------- handle_new_user
console.log('\n== handle_new_user ==');
await as('postgres');
const ins = (id, email, meta) => db.query('insert into auth.users values ($1,$2,$3::jsonb)', [id, email, JSON.stringify(meta)]);
await ins(U.A, 'a@x.com', { full_name: 'Ana', registro_idioma: 'EN', fecha_nacimiento: '1990-05-17' });
let pa = (await q('select * from public.profiles where id=$1', [U.A]))[0];
ok(pa.registro_idioma === 'en' && String(pa.fecha_nacimiento.toISOString?.() ?? pa.fecha_nacimiento).startsWith('1990-05-17'), 'guarda idioma (en minusculas) y fecha de nacimiento');
ok(pa.email === 'a@x.com' && pa.full_name === 'Ana' && pa.headline === '' && pa.summary === '' && pa.role === 'professional' && pa.plan === 'free', 'conserva email, full_name, headline/summary vacios, role professional, plan free');
await ins(U.B, 'b@x.com', {});
let pb = (await q('select * from public.profiles where id=$1', [U.B]))[0];
ok(pb && pb.full_name === 'b' && pb.registro_idioma === null && pb.fecha_nacimiento === null, 'sin metadata: perfil creado, nombre = parte local del correo, idioma/fecha NULL');
await ins(U.C, 'c@x.com', { idioma: 'pt-BR', fecha_nacimiento: 'no-es-fecha' });
let pc = (await q('select * from public.profiles where id=$1', [U.C]))[0];
ok(pc && pc.registro_idioma === 'pt' && pc.fecha_nacimiento === null, 'fecha mal formada -> NULL y el perfil se crea; "pt-BR" -> "pt"');
await ins('00000000-0000-0000-0000-0000000000f1', 'f1@x.com', { lang: 'x$', fecha_nacimiento: '2999-01-01' });
let pf = (await q("select * from public.profiles where id='00000000-0000-0000-0000-0000000000f1'"))[0];
ok(pf && pf.registro_idioma === null && pf.fecha_nacimiento === null, 'idioma invalido y fecha futura -> NULL, perfil creado');
await ins(U.EMP, 'emp@x.com', { full_name: 'Empresa', registro_idioma: 'es' });
await ins(U.ADMIN, 'admin@x.com', { full_name: 'Admin' });
await db.query("update public.profiles set role='admin' where id=$1", [U.ADMIN]);
await db.query("update public.profiles set role='employer' where id=$1", [U.EMP]);
await db.query("insert into public.companies(id, company_name, legal_name, tax_id, company_email, status, created_by, company_size) values ($1,'Acme','Acme SL','B1','acme@x.com','APPROVED',$2,'51-250')", [CO, U.EMP]);
await db.query("insert into public.company_users(company_id,user_id,role) values ($1,$2,'OWNER')", [CO, U.EMP]);
await db.query("insert into public.job_postings(id, company_id, status) values ($1,$2,'PUBLISHED')", [JOB, CO]);
// slug para que A sea visible en la política pública (el test de columna privada lo necesita)
await db.query("update public.profiles set slug='ana' where id=$1", [U.A]);

// ---------------------------------------------------------------- documentos_legales (anon)
console.log('\n== documentos_legales: lectura publica solo de vigentes ==');
await as('postgres');
await db.query(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values
  ('terminos_candidato','0.9','es','viejo','x', '2026-01-01'),
  ('terminos_candidato','2.0','es','futuro','x', now() + interval '30 days')`);
await as('anon');
let rows = await q('select tipo, version, idioma from public.documentos_legales order by 1,3');
ok(rows.length === 8 && rows.every(r => r.version === '1.0'), 'anon ve exactamente las 8 v1.0 vigentes (no la 0.9 sustituida ni la 2.0 futura)');
ok(denied(await err("insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('cookies','9','es','t','x',now())")), 'anon no puede insertar documentos');
await as('authenticated', U.B);
ok(denied(await err("insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('cookies','9','es','t','x',now())")), 'authenticated no admin no puede insertar documentos');
await as('authenticated', U.ADMIN);
ok(!(await err("insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('cookies','1.1','es','t','x', now() + interval '60 days')")), 'admin puede insertar una version futura');
ok((await q('select count(*)::int n from public.documentos_legales'))[0].n === 11, 'admin ve todas (8 + 0.9 + 2.0 + 1.1 de cookies)');
ok(!!(await err("update public.documentos_legales set texto='manipulado' where tipo='privacidad' and idioma='es'")), 'admin no puede editar el texto de una version ya en vigor');
ok(!(await err("update public.documentos_legales set borrador=false where tipo='privacidad' and idioma='es'")), 'admin si puede cambiar el flag borrador');
await as('postgres');
await db.query("update public.documentos_legales set borrador=true where tipo='privacidad'");
await db.query("delete from public.documentos_legales where version in ('2.0') or (tipo='cookies' and version='1.1')");

// ---------------------------------------------------------------- columnas privadas
console.log('\n== fecha_nacimiento / registro_idioma privadas ==');
await as('anon');
ok(denied(await err('select fecha_nacimiento from public.profiles')), 'anon NO puede leer profiles.fecha_nacimiento');
ok(denied(await err('select registro_idioma from public.profiles')), 'anon NO puede leer profiles.registro_idioma');
ok(denied(await err('select * from public.profiles')), 'anon: select * de profiles denegado (columnas cerradas)');
ok(denied(await err('select * from public.profiles_full')), 'anon NO puede leer profiles_full');
ok(!(await err('select id, slug from public.profiles')), 'anon sigue leyendo columnas publicas de profiles');
await as('authenticated', U.B);
ok(denied(await err('select fecha_nacimiento from public.profiles')), 'authenticated (otro usuario) NO lee profiles.fecha_nacimiento');
let vf = await q("select id, fecha_nacimiento from public.profiles_full where id=$1", [U.A]);
ok(vf.length === 0, 'otro usuario no ve la fila de A en profiles_full');
await as('authenticated', U.A);
vf = await q("select registro_idioma, fecha_nacimiento from public.profiles_full where id=$1", [U.A]);
ok(vf.length === 1 && vf[0].registro_idioma === 'en', 'A lee su propio idioma y fecha via profiles_full');
ok(!(await err("update public.profiles set registro_idioma='en', fecha_nacimiento='1990-05-18' where id=$1", [U.A])), 'A puede actualizar su propio idioma (UPDATE conservado)');
await as('authenticated', U.ADMIN);
ok((await q('select count(*)::int n from public.profiles_full'))[0].n >= 6, 'admin ve todas las filas de profiles_full');
await as('authenticated', U.EMP);
ok(denied(await err('select contact_name from public.companies')), 'authenticated NO lee companies.contact_name directamente');
ok((await q("select contact_name, idioma, country_code from public.companies_full where id=$1", [CO])).length === 1, 'miembro lee companies_full con columnas nuevas');
await as('authenticated', U.B);
ok((await q("select id from public.companies_full where id=$1", [CO])).length === 0, 'no miembro no ve la empresa en companies_full');
await as('anon');
ok(denied(await err('select idioma from public.companies')), 'anon NO lee companies.idioma');
ok((await q("select company_name from public.companies")).length === 1, 'anon sigue viendo company_name de empresas aprobadas');

// ---------------------------------------------------------------- registrar_aceptacion
console.log('\n== registrar_aceptacion / aceptaciones ==');
await as('postgres');
const docs = Object.fromEntries((await q("select tipo, idioma, id from public.documentos_legales where version='1.0'")).map(r => [r.tipo + '/' + r.idioma, r.id]));
docs['viejo09'] = (await q("select id from public.documentos_legales where version='0.9'"))[0].id;
const OBL = { acepto_condiciones_privacidad: true, datos_verdaderos: true };
const hdr = { 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '9.9.9.9, 10.0.0.1', 'user-agent': 'UA-Test/1.0' };

await as('anon', null, hdr);
ok(denied(await err('select public.registrar_aceptacion($1::uuid[])', [[docs['privacidad/es']]])), 'anon no puede ejecutar registrar_aceptacion');
await as('authenticated', U.A, hdr);
let r1 = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['terminos_candidato/en'], docs['privacidad/en']], JSON.stringify({}), 'registro']);
ok(r1 && /CASILLA_OBLIGATORIA/.test(r1.message), 'sin casillas obligatorias -> CASILLA_OBLIGATORIA');
r1 = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['terminos_candidato/en']], JSON.stringify({ acepto_condiciones_privacidad: true, datos_verdaderos: false }), 'registro']);
ok(r1 && /CASILLA_OBLIGATORIA/.test(r1.message), 'una obligatoria a false -> rechazado');
r1 = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['privacidad/en']], JSON.stringify({ ip: '6.6.6.6' }), 'registro']);
ok(r1 && /ACEPTACION_INVALIDA/.test(r1.message), 'casillas con valores no booleanos (intento de colar una ip) -> rechazado');
r1 = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, null, null, $4)', [[docs['privacidad/en']], '{}', 'registro', '6.6.6.6']);
ok(!!r1, 'no existe parametro de IP: llamar con un 6.º argumento falla');
r1 = await err("select public.registrar_aceptacion($1::uuid[], '{}'::jsonb, 'registro') ", [[docs['viejo09']]]);
ok(r1 && /DOCUMENTO_NO_VIGENTE/.test(r1.message), 'documento sustituido -> DOCUMENTO_NO_VIGENTE');
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === 0, 'los intentos fallidos no dejan filas');

const res = await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3) ids', [[docs['terminos_candidato/en'], docs['privacidad/en']], JSON.stringify({ ...OBL, perfil_publico: false }), 'registro']);
ok(res[0].ids.length === 2, 'registrar_aceptacion devuelve 2 ids');
let mine = await q('select * from public.aceptaciones where user_id=$1 order by tipo', [U.A]);
ok(mine.length === 2 && mine.every(r => r.ip === '203.0.113.7/32' || r.ip === '203.0.113.7'), 'IP guardada = cabecera cf-connecting-ip del servidor: ' + mine[0].ip);
ok(mine.every(r => r.user_agent === 'UA-Test/1.0' && r.user_email === 'a@x.com' && r.contexto === 'registro'), 'user_agent y correo copiados del servidor; contexto registro');
ok(mine[0].tipo === 'privacidad' && mine[0].version === '1.0' && mine[1].tipo === 'terminos_candidato', 'tipo y version copiados');
// Solo x-forwarded-for
await as('authenticated', U.B, { 'x-forwarded-for': '198.51.100.5, 10.0.0.1', 'user-agent': 'UA2' });
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['privacidad/es']], '{}', 'registro']);
await as('postgres');
ok((await q("select host(ip) h from public.aceptaciones where user_id=$1", [U.B]))[0].h === '198.51.100.5', 'sin cf-connecting-ip: primer elemento de x-forwarded-for');
// Sin cabeceras
await as('authenticated', U.B);
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['cookies/es']], '{}', 'registro']);
await as('postgres');
ok((await q("select ip from public.aceptaciones where user_id=$1 and tipo='cookies'", [U.B]))[0].ip === null, 'sin cabeceras: ip NULL (no se inventa)');

// INSERT directo
await as('authenticated', U.A, hdr);
ok(denied(await err("insert into public.aceptaciones(user_id,documento_id,tipo,version,contexto,ip) values ($1,$2,'privacidad','1.0','registro','6.6.6.6')", [U.A, docs['privacidad/es']])), 'authenticated no puede INSERT directo (ni con una IP elegida por el)');
await as('anon');
ok(denied(await err("insert into public.aceptaciones(documento_id,tipo,version,contexto) values ($1,'privacidad','1.0','registro')", [docs['privacidad/es']])), 'anon no puede INSERT');
ok(denied(await err('select * from public.aceptaciones')), 'anon no puede SELECT aceptaciones');
// UPDATE / DELETE
await as('authenticated', U.A);
ok(denied(await err("update public.aceptaciones set ip='1.1.1.1' where user_id=$1", [U.A])), 'authenticated no puede UPDATE una aceptacion propia');
ok(denied(await err('delete from public.aceptaciones where user_id=$1', [U.A])), 'authenticated no puede DELETE una aceptacion propia');
ok(denied(await err('truncate public.aceptaciones')), 'authenticated no puede TRUNCATE');
await as('authenticated', U.B);
ok(denied(await err("update public.aceptaciones set casillas='{}' where user_id=$1", [U.A])), 'otro usuario no puede UPDATE aceptaciones ajenas');
await as('service_role');
ok(denied(await err("update public.aceptaciones set ip='1.1.1.1'")), 'service_role no puede UPDATE (sin privilegio)');
ok(denied(await err('delete from public.aceptaciones')), 'service_role no puede DELETE (sin privilegio)');
await as('postgres');
let t1 = await err("update public.aceptaciones set casillas='{\"x\":true}'");
ok(t1 && /ACEPTACION_INMUTABLE/.test(t1.message), 'incluso el propietario: trigger impide UPDATE');
t1 = await err('delete from public.aceptaciones');
ok(t1 && /ACEPTACION_INMUTABLE/.test(t1.message), 'incluso el propietario: trigger impide DELETE');
t1 = await err('truncate public.aceptaciones');
ok(t1 && /ACEPTACION_INMUTABLE/.test(t1.message), 'incluso el propietario: trigger impide TRUNCATE');
// SELECT aislado
await as('authenticated', U.A);
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === 2, 'A ve solo sus 2 aceptaciones');
await as('authenticated', U.B);
rows = await q('select user_id from public.aceptaciones');
ok(rows.length === 2 && rows.every(r => r.user_id === U.B), 'B ve solo las suyas (2), ninguna de A');
await as('authenticated', U.ADMIN);
ok((await q('select count(*)::int n from public.aceptaciones'))[0].n === 4, 'admin ve todas (4)');
// A lee el documento que aceptó aunque deje de estar vigente
await as('postgres');
await db.query(`insert into public.documentos_legales(tipo,version,idioma,titulo,texto,vigente_desde) values ('privacidad','1.1','en','Privacy 1.1','nuevo','2026-10-29 00:00:01+00')`);
await as('authenticated', U.A);
ok((await q("select 1 from public.documentos_legales where tipo='privacidad' and idioma='en' and version='1.0'")).length === 1, 'A sigue viendo la v1.0 que aceptó aunque la 1.1 ya la sustituya');
await as('anon');
ok((await q("select version from public.documentos_legales where tipo='privacidad' and idioma='en'")).map(r => r.version).join() === '1.1', 'anon solo ve la 1.1 (vigente) de privacidad en');

// ---------------------------------------------------------------- documentos_pendientes
console.log('\n== documentos_pendientes ==');
await as('anon');
ok(denied(await err('select * from public.documentos_pendientes()')), 'anon no puede ejecutar documentos_pendientes');
await as('authenticated', U.existing);
let pend = await q('select tipo, version, idioma from public.documentos_pendientes()');
ok(pend.map(r => r.tipo).join() === 'privacidad,terminos_candidato' && pend.every(r => r.idioma === 'es'), 'usuario EXISTENTE (sin idioma): pendientes privacidad + terminos_candidato en es; cookies no requiere aceptacion');
await as('authenticated', U.C);
pend = await q('select tipo, idioma from public.documentos_pendientes()');
ok(pend.length === 2 && pend.every(r => r.idioma === 'es'), 'idioma sin texto (pt) -> cae a es');
await as('authenticated', U.A);
pend = await q('select tipo, version, idioma from public.documentos_pendientes()');
ok(pend.length === 1 && pend[0].tipo === 'privacidad' && pend[0].version === '1.1' && pend[0].idioma === 'en', 'A (en) aceptó v1.0; ahora solo falta privacidad 1.1 (en)');
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[(await q("select documento_id from public.documentos_pendientes()"))[0].documento_id], '{}', 'nueva_version']);
ok((await q('select count(*)::int n from public.documentos_pendientes()'))[0].n === 0, 'tras aceptar la nueva version, A no tiene pendientes');
await as('authenticated', U.EMP);
pend = await q('select tipo, idioma from public.documentos_pendientes()');
ok(pend.map(r => r.tipo).join() === 'privacidad,terminos_empleador', 'empleador (role employer + miembro): privacidad + terminos_empleador, sin terminos_candidato');
// aceptar como empresa con company_id, y verificar reglas de empresa/oferta
const empDocs = [docs['terminos_empleador/es'], docs['privacidad/es']];
const EMPCAS = { poder_representacion: true, ofertas_reales_no_discriminatorias: true, anexo_encargo_tratamiento: true };
let re = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3)', [[docs['terminos_empleador/es']], JSON.stringify({ poder_representacion: true }), 'registro']);
ok(re && /CASILLA_OBLIGATORIA/.test(re.message), 'empleador: faltan casillas obligatorias -> rechazado');
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, $4, $5)', [[docs['terminos_empleador/es']], JSON.stringify(EMPCAS), 'publicacion', JOB, CO]);
await q('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, null, $4)', [[docs['privacidad/es']], '{}', 'registro', CO]);
ok((await q('select count(*)::int n from public.documentos_pendientes()'))[0].n === 0, 'empleador sin pendientes tras aceptar (con oferta y empresa)');
await as('authenticated', U.B, hdr);
re = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, null, $4)', [[docs['privacidad/es']], '{}', 'registro', CO]);
ok(re && /no perteneces a esa empresa/.test(re.message), 'un no miembro no puede registrar aceptaciones a nombre de una empresa');
re = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, $4)', [[docs['privacidad/es']], '{}', 'publicacion', JOB]);
ok(re && /no perteneces/.test(re.message), 'un no miembro no puede registrar contexto publicacion en una oferta ajena');
re = await err('select public.registrar_aceptacion($1::uuid[], $2::jsonb, $3, $4)', [[docs['privacidad/es']], '{}', 'inscripcion', JOB]);
ok(!re, 'un candidato si puede registrar contexto inscripcion en una oferta');
await as('authenticated', U.ADMIN);
ok((await q('select count(*)::int n from public.documentos_pendientes()'))[0].n === 1, 'admin: solo privacidad (audiencia todos)');

// ---------------------------------------------------------------- borrado de cuenta
console.log('\n== Borrado de cuenta no bloqueado y la prueba se conserva ==');
await as('postgres');
const antes = (await q('select count(*)::int n from public.aceptaciones where user_id=$1', [U.B]))[0].n;
const e3 = await err('delete from auth.users where id=$1', [U.B]);
ok(!e3, 'se puede borrar la cuenta de B (SET NULL pasa el trigger)' + (e3 ? ': ' + e3.message : ''));
const desp = await q("select user_id, user_email from public.aceptaciones where user_email='b@x.com'");
ok(desp.length === antes && desp.every(r => r.user_id === null), `las ${antes} aceptaciones de B se conservan con user_id NULL y el correo copiado`);
// no se puede reasignar ni cambiar otra columna
const e4 = await err("update public.aceptaciones set user_id=$1 where user_email='b@x.com'", [U.A]);
ok(e4 && /ACEPTACION_INMUTABLE/.test(e4.message), 'no se puede reasignar una aceptacion anonimizada a otro usuario');

// ---------------------------------------------------------------- companies
console.log('\n== companies: CHECK, countries, company_ai_reviews ==');
await as('postgres');
ok(!!(await err("update public.companies set company_size='51-200' where id=$1", [CO])), 'company_size 51-200 (antiguo) rechazado');
ok(!(await err("update public.companies set company_size='250+', country_code='ES', idioma='es', contact_name='Ana', contact_position='RRHH' where id=$1", [CO])), 'company_size 250+ y columnas nuevas aceptadas');
for (const s of ['1-10', '11-50', '51-250']) ok(!(await err('update public.companies set company_size=$2 where id=$1', [CO, s])), 'company_size ' + s + ' aceptado');
ok(!!(await err("update public.companies set country_code='ZZ' where id=$1", [CO])), 'country_code debe existir en countries');
await as('anon');
ok((await q('select count(*)::int n from public.countries'))[0].n === 40, 'anon lee countries (40)');
ok(denied(await err("insert into public.countries values ('ZZ','a','b','USD')")), 'anon no escribe en countries');
await as('authenticated', U.A);
ok(denied(await err("insert into public.countries values ('ZZ','a','b','USD')")), 'authenticated no admin no escribe en countries');
await as('authenticated', U.ADMIN);
ok(!(await err("insert into public.countries values ('ZZ','Zeta','Zed','USD')")), 'admin escribe en countries');
await as('postgres');
await db.query("delete from public.countries where code='ZZ'");
await as('service_role');
ok(!(await err("insert into public.company_ai_reviews(company_id, resultado, motivos) values ($1,'dudosa','[\"web propia con correo gratuito\"]'::jsonb)", [CO])), 'service_role escribe company_ai_reviews');
ok(!!(await err("insert into public.company_ai_reviews(company_id, resultado) values ($1,'inventado')", [CO])), 'resultado fuera de ok/dudosa/error rechazado');
await as('anon');
ok(denied(await err('select * from public.company_ai_reviews')), 'anon no lee company_ai_reviews');
await as('authenticated', U.EMP);
ok((await q('select count(*)::int n from public.company_ai_reviews'))[0].n === 0, 'miembro de la empresa NO ve company_ai_reviews (RLS)');
ok(denied(await err("insert into public.company_ai_reviews(company_id, resultado) values ($1,'ok')", [CO])), 'authenticated no escribe company_ai_reviews');
await as('authenticated', U.ADMIN);
ok((await q('select count(*)::int n from public.company_ai_reviews'))[0].n === 1, 'admin lee company_ai_reviews');

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
