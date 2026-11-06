-- Stub UNIFICADO de la base REAL de YourCVPassport (producción, 29/10/2026) para PGlite.
-- Tablas, constraints, políticas y funciones leídas con prodsql.mjs (solo lectura).
-- Los objetos que ya existían tras 20261005..20261009b (cierre por columnas de profiles y
-- companies, vistas *_full, triggers de protección) están en su estado real.
-- No incluye NADA de las migraciones 20261028..20261031.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
-- Como en producción (pg_default_acl): todo lo nuevo de public se concede a los tres roles.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- auth: SIN grants sobre auth.users (en Supabase anon/authenticated no la leen)
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- ----------------------------------------------------------------- profiles
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, headline text, summary text, slug text, meta_title text, meta_description text,
 template text default 'modern', template_color text default '#0052FF', availability text, location text,
 phone text, linkedin_url text, github_url text, gender text, portfolio_url text, job_seeking_status text,
 avatar_url text, open_to_remote boolean default false, website_url text, twitter_url text, instagram_url text,
 youtube_url text, behance_url text, dribbble_url text, job_type text[], willing_to_relocate boolean default false,
 preferred_locations text[], slug_validation_error text, email text, name text,
 role text default 'professional', plan text default 'free', handle text, title text, remote_preference text,
 salary_min bigint, salary_max bigint, salary_currency text default 'USD',
 created_at timestamptz default now(), updated_at timestamptz default now(),
 show_verified_credentials boolean default false, show_connect_links boolean default true,
 show_qr_code boolean default true, show_availability_badge boolean default true, country_code text,
 remote boolean default false, work_mode text, last_slug_changed_at timestamptz,
 dashboard_tour_completed boolean default false, first_login_completed boolean default false,
 wizard_completed boolean default false, is_active boolean default true not null, suspension_reason text,
 suspended_until timestamptz, profile_hidden boolean default false not null, search_blocked boolean default false not null,
 messages_blocked boolean default false not null, banner_url text, is_open_to_messages boolean default true,
 managed_by uuid references auth.users(id) on delete set null, is_premium boolean,
 constraint profiles_slug_key unique (slug),
 constraint profiles_handle_unique unique (handle),
 constraint profiles_plan_check check (plan = any (array['free','basic','pro','enterprise'])),
 constraint profiles_role_check check (role = any (array['professional','employer','admin','profile_manager']))
);
alter table public.profiles enable row level security;

-- ----------------------------------------------------------------- companies / company_users
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

create table public.company_users(
 id uuid primary key default gen_random_uuid(),
 company_id uuid not null references public.companies(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role varchar(50) default 'MEMBER',
 invited_by uuid references auth.users(id) on delete set null,
 invited_at timestamptz default now(), accepted_at timestamptz, created_at timestamptz default now(),
 constraint company_users_company_id_user_id_key unique (company_id, user_id),
 constraint company_users_role_check check ((role)::text = any ((array['OWNER','ADMIN','MEMBER','VIEWER'])::text[]))
);
alter table public.company_users enable row level security;

create table public.company_credits_history(id uuid primary key default gen_random_uuid(), company_id uuid not null, amount integer not null,
 balance_after integer not null, transaction_type varchar not null, reference_id uuid, description text, created_by uuid,
 created_at timestamptz default now(), metadata jsonb default '{}');
alter table public.company_credits_history enable row level security;
create table public.company_settings(id uuid primary key default gen_random_uuid(), company_id uuid not null unique references public.companies(id) on delete cascade,
 email_notifications boolean default true, created_at timestamptz default now(), updated_at timestamptz default now());
alter table public.company_settings enable row level security;

-- ----------------------------------------------------------------- funciones auxiliares REALES
create or replace function public.current_user_is_admin() returns boolean language sql stable security definer set search_path to 'public' as
 $$ select coalesce((select lower(p.role) = 'admin' from public.profiles p where p.id = auth.uid()), false) $$;
create or replace function public.is_admin() returns boolean language sql security definer as
 $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
create or replace function public.is_company_member(p_company_id uuid, p_roles text[] default null) returns boolean language sql stable security definer set search_path to 'public' as
 $$ select auth.uid() is not null and exists (select 1 from public.company_users cu where cu.company_id = p_company_id and cu.user_id = auth.uid() and (p_roles is null or cu.role = any (p_roles))) $$;
create or replace function public.is_managed_profile(target_profile_id uuid) returns boolean language sql stable security definer set search_path to 'public' as
 $$ select exists (select 1 from public.profiles p where p.id = target_profile_id and p.managed_by = auth.uid()) $$;
create or replace function public.assert_caller_is_admin() returns void language plpgsql stable security definer set search_path to 'public' as $f$
declare v_role text := coalesce(auth.role(), '');
begin
  if v_role not in ('anon', 'authenticated') then return; end if;
  if v_role = 'authenticated' and public.current_user_is_admin() then return; end if;
  raise exception 'NOT_ADMIN: solo un administrador puede hacer esto' using errcode = '42501';
end; $f$;
create or replace function public.company_owner_signup_allowed(p_company_id uuid) returns boolean language sql stable security definer set search_path to 'public' as
 $$ select auth.uid() is not null
     and exists (select 1 from public.companies c where c.id = p_company_id and c.created_by = auth.uid())
     and not exists (select 1 from public.company_users cu where cu.company_id = p_company_id) $$;
create or replace function public.company_users_insert_allowed(p_company_id uuid, p_user_id uuid, p_role text, p_invited_by uuid)
 returns boolean language plpgsql stable security definer set search_path to 'public' as $f$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return false; end if;
  if public.current_user_is_admin() then return true; end if;
  if p_user_id = v_uid and p_role = 'OWNER' and (p_invited_by is null or p_invited_by = v_uid)
     and public.company_owner_signup_allowed(p_company_id) then return true; end if;
  if p_invited_by is not null and p_invited_by <> v_uid then return false; end if;
  if p_role = 'OWNER' then return public.is_company_member(p_company_id, array['OWNER']); end if;
  return public.is_company_member(p_company_id, array['OWNER', 'ADMIN']);
end; $f$;

create or replace function public.update_companies_updated_at() returns trigger language plpgsql as $f$ begin new.updated_at = now(); return new; end; $f$;
create or replace function public.update_job_posting_updated_at() returns trigger language plpgsql as $f$ begin new.updated_at = now(); return new; end; $f$;

-- Correo: cola antigua y envío antiguo (reales)
create table public.email_queue(id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
 template_name text not null, recipient_email text not null, recipient_name text, variables jsonb, sent boolean default false, sent_at timestamptz, error text);
create or replace function public.queue_email_notification(p_template_name text, p_recipient_email text, p_recipient_name text, p_variables jsonb)
 returns void language plpgsql as $f$ begin insert into email_queue (template_name, recipient_email, recipient_name, variables) values (p_template_name, p_recipient_email, p_recipient_name, p_variables); end; $f$;
create or replace function public.send_email_notification(p_to_email text, p_template text, p_data jsonb) returns void language plpgsql security definer as $f$
begin
  perform net.http_post(url := current_setting('app.settings.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
    body := jsonb_build_object('to', p_to_email, 'template', p_template, 'data', p_data));
exception when others then raise warning 'Failed to send email: %', sqlerrm;
end; $f$;

-- Triggers de empresas (reales)
create or replace function public.companies_proteger_campos() returns trigger language plpgsql set search_path to 'public' as $f$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if current_user = 'authenticated' and public.current_user_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'PENDING'; new.credit_balance := 0; new.total_credits_purchased := 0; new.total_credits_used := 0;
    new.verified_at := null; new.verified_by := null; new.rejection_reason := null; new.admin_notes := null;
    new.created_by := auth.uid();
    return new;
  end if;
  if new.status is distinct from old.status or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by or new.rejection_reason is distinct from old.rejection_reason
     or new.admin_notes is distinct from old.admin_notes then
    raise exception 'PROTECTED_FIELD: el estado y la verificación de la empresa solo los cambia un admin' using errcode = '42501';
  end if;
  if new.credit_balance is distinct from old.credit_balance or new.total_credits_purchased is distinct from old.total_credits_purchased
     or new.total_credits_used is distinct from old.total_credits_used then
    raise exception 'PROTECTED_FIELD: los créditos solo cambian por compra verificada, consumo o ajuste de un admin' using errcode = '42501';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'PROTECTED_FIELD: created_by no se puede cambiar' using errcode = '42501';
  end if;
  return new;
end; $f$;
create or replace function public.create_default_company_settings() returns trigger language plpgsql security definer as $f$
begin insert into public.company_settings (company_id) values (new.id) on conflict (company_id) do nothing; return new; end; $f$;
create or replace function public.notify_company_approved() returns trigger language plpgsql security definer as $f$
declare v_dashboard_url text;
begin
  if new.status = 'APPROVED' and (old.status is null or old.status != 'APPROVED') then
    v_dashboard_url := current_setting('app.settings.app_url', true) || '/company/dashboard';
    perform send_email_notification(new.company_email, 'company-approved',
      jsonb_build_object('companyName', new.company_name, 'dashboardUrl', v_dashboard_url, 'welcomeCredits', 10, 'adminNotes', new.admin_notes));
    update companies set credit_balance = credit_balance + 10 where id = new.id;
    insert into company_credits_history (company_id, amount, balance_after, transaction_type, description, created_by)
    values (new.id, 10, new.credit_balance + 10, 'ADMIN_ADJUSTMENT', 'Welcome bonus - Company approved', new.verified_by);
  end if;
  return new;
end; $f$;
create or replace function public.notify_company_rejected() returns trigger language plpgsql security definer as $f$
begin
  if new.status = 'REJECTED' and (old.status is null or old.status != 'REJECTED') then
    perform send_email_notification(new.company_email, 'company-rejected', jsonb_build_object('companyName', new.company_name, 'reason', new.rejection_reason));
  end if;
  return new;
end; $f$;
create or replace function public.notify_low_credits() returns trigger language plpgsql security definer as $f$
begin
  if new.credit_balance < 10 and (old.credit_balance is null or old.credit_balance >= 10) then
    perform send_email_notification(new.company_email, 'low-credits', jsonb_build_object('companyName', new.company_name, 'creditsRemaining', new.credit_balance));
  end if;
  return new;
end; $f$;
create or replace function public.notify_team_member_added() returns trigger language plpgsql security definer as $f$
declare v_company companies%rowtype; v_user_profile profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into v_company from companies where id = new.company_id;
    select * into v_user_profile from profiles where id = new.user_id;
    perform send_email_notification(v_user_profile.email, 'welcome-team-member', jsonb_build_object('companyName', v_company.company_name, 'role', new.role));
  end if;
  return new;
end; $f$;
create or replace function public.approve_company(p_company_id uuid, p_admin_id uuid, p_notes text default null) returns jsonb language plpgsql security definer set search_path to 'public' as $f$
declare v_admin uuid := coalesce(auth.uid(), p_admin_id); v_company_email varchar(255); v_company_name varchar(255);
begin
  perform public.assert_caller_is_admin();
  update public.companies set status = 'APPROVED', verified_at = now(), verified_by = v_admin, admin_notes = coalesce(p_notes, admin_notes)
   where id = p_company_id returning company_email, company_name into v_company_email, v_company_name;
  if not found then raise exception 'Company not found'; end if;
  return jsonb_build_object('success', true, 'company_id', p_company_id, 'company_email', v_company_email, 'company_name', v_company_name);
end; $f$;
create or replace function public.reject_company(p_company_id uuid, p_admin_id uuid, p_reason text) returns jsonb language plpgsql security definer set search_path to 'public' as $f$
declare v_admin uuid := coalesce(auth.uid(), p_admin_id); v_company_email varchar(255); v_company_name varchar(255);
begin
  perform public.assert_caller_is_admin();
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'Rejection reason is required'; end if;
  update public.companies set status = 'REJECTED', verified_at = now(), verified_by = v_admin, rejection_reason = p_reason
   where id = p_company_id returning company_email, company_name into v_company_email, v_company_name;
  if not found then raise exception 'Company not found'; end if;
  return jsonb_build_object('success', true, 'company_id', p_company_id, 'reason', p_reason);
end; $f$;

-- Trigger de publicación de ofertas REAL (20261007)
create or replace function public.job_postings_proteger_publicacion() returns trigger language plpgsql set search_path to 'public' as $f$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if current_user = 'authenticated' and public.current_user_is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'PUBLISHED' then
      raise exception 'PUBLISH_REQUIRES_CREDITS: crea la oferta como borrador y publícala con publish_job_posting' using errcode = '42501';
    end if;
    new.published_at := null; new.views_count := 0; new.applications_count := 0; new.credits_cost := 30;
    return new;
  end if;
  if new.credits_cost is distinct from old.credits_cost or new.published_at is distinct from old.published_at
     or new.views_count is distinct from old.views_count or new.applications_count is distinct from old.applications_count then
    raise exception 'PROTECTED_FIELD: coste, fecha de publicación y contadores de la oferta no se editan' using errcode = '42501';
  end if;
  if new.status = 'PUBLISHED' and old.status is distinct from 'PUBLISHED' and not (old.status = 'PAUSED' and old.published_at is not null) then
    raise exception 'PUBLISH_REQUIRES_CREDITS: publica la oferta con publish_job_posting' using errcode = '42501';
  end if;
  return new;
end; $f$;

-- ----------------------------------------------------------------- bolsa de empleo: las 3 tablas reales
create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete set null,
  title varchar(200) not null, slug varchar(250), department varchar(100),
  employment_type varchar(50), work_mode varchar(50), experience_level varchar(50),
  location_city varchar(100), location_state varchar(100), location_country varchar(2), is_remote boolean default false,
  description text not null, responsibilities text[], requirements text[], nice_to_have text[], benefits text[],
  required_skills varchar[], optional_skills varchar[],
  salary_min integer, salary_max integer, salary_currency varchar(3) default 'USD', salary_period varchar(20), show_salary boolean default false,
  application_deadline timestamptz, application_email varchar(255), application_url text, application_instructions text,
  status varchar(50) default 'DRAFT', published_at timestamptz, closed_at timestamptz,
  meta_title varchar(200), meta_description text, views_count integer default 0, applications_count integer default 0,
  metadata jsonb default '{}'::jsonb, credits_cost integer default 30,
  constraint job_postings_employment_type_check check ((employment_type)::text = any ((array['FULL_TIME','PART_TIME','CONTRACT','TEMPORARY','INTERNSHIP','FREELANCE'])::text[])),
  constraint job_postings_experience_level_check check ((experience_level)::text = any ((array['ENTRY','JUNIOR','MID','SENIOR','LEAD','EXECUTIVE'])::text[])),
  constraint job_postings_salary_period_check check ((salary_period)::text = any ((array['HOURLY','MONTHLY','YEARLY'])::text[])),
  constraint job_postings_slug_key unique (slug),
  constraint job_postings_status_check check ((status)::text = any ((array['DRAFT','PUBLISHED','PAUSED','CLOSED','FILLED'])::text[])),
  constraint job_postings_work_mode_check check ((work_mode)::text = any ((array['REMOTE','ONSITE','HYBRID'])::text[])),
  constraint valid_deadline check (application_deadline is null or application_deadline > created_at),
  constraint valid_salary_range check (salary_max is null or salary_min is null or salary_max >= salary_min)
);
alter table public.job_postings enable row level security;

create table public.job_posting_questions (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  question_text text not null, question_type varchar(50), options jsonb, is_required boolean default false,
  order_index integer default 0, created_at timestamptz default now(),
  constraint job_posting_questions_question_type_check check ((question_type)::text = any ((array['TEXT','TEXTAREA','YES_NO','MULTIPLE_CHOICE'])::text[]))
);
alter table public.job_posting_questions enable row level security;

create table public.job_applications (
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), updated_at timestamptz default now(),
  job_posting_id uuid not null references public.job_postings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  status varchar(50) default 'NEW', cover_letter text, resume_url text, answers jsonb default '{}'::jsonb,
  viewed_by_company boolean default false, viewed_at timestamptz, viewed_by uuid references auth.users(id) on delete set null,
  internal_notes text, rating integer, match_score integer, metadata jsonb default '{}'::jsonb,
  constraint job_applications_job_posting_id_profile_id_key unique (job_posting_id, profile_id),
  constraint job_applications_match_score_check check (match_score >= 0 and match_score <= 100),
  constraint job_applications_rating_check check (rating >= 1 and rating <= 5),
  constraint job_applications_status_check check ((status)::text = any ((array['NEW','REVIEWING','SHORTLISTED','INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN'])::text[]))
);
alter table public.job_applications enable row level security;

-- CV del candidato (columnas y constraints reales)
create table public.experiences (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null, position text not null, start_date date not null, end_date date, description text, achievements text[],
  is_current boolean default false, location text, employment_type text, sort_order integer default 0, verified boolean default false,
  verified_at timestamptz, verified_by uuid references public.profiles(id), created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint experiences_employment_type_check check (employment_type = any (array['FULL_TIME','PART_TIME','CONTRACT','FREELANCE','INTERNSHIP'])));
create table public.education (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  institution_name text not null, degree text not null, field_of_study text not null, start_date date not null, end_date date, grade text, description text,
  is_current boolean default false, verified boolean default false, verified_at timestamptz, verified_by uuid references public.profiles(id),
  sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.skills (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, level text, years_of_experience integer, percentage integer, category text, endorsed_count integer default 0, sort_order integer default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  constraint skills_level_check check (level = any (array['BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'])),
  constraint skills_percentage_check check (percentage >= 0 and percentage <= 100), constraint skills_profile_id_name_key unique (profile_id, name));
create table public.languages (id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, level text, is_native boolean default false, sort_order integer default 0, created_at timestamptz default now(), updated_at timestamptz default now(), percentage integer,
  constraint languages_level_check check (level = any (array['A1','A2','B1','B2','C1','C2','Native'])),
  constraint languages_percentage_check check (percentage >= 0 and percentage <= 100), constraint languages_profile_id_name_key unique (profile_id, name));
alter table public.experiences enable row level security; alter table public.education enable row level security;
alter table public.skills enable row level security; alter table public.languages enable row level security;

-- ----------------------------------------------------------------- POLÍTICAS REALES
-- profiles
create policy "Admins can delete profiles" on public.profiles for delete to authenticated using (public.current_user_is_admin());
create policy "Admins can update all profiles" on public.profiles for update to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin());
create policy "Admins can view all profiles" on public.profiles for select to authenticated using (public.current_user_is_admin());
create policy "Managers can update managed profiles" on public.profiles for update using (managed_by = auth.uid()) with check (managed_by = auth.uid());
create policy "Managers can view managed profiles" on public.profiles for select to authenticated using (managed_by = auth.uid());
create policy "Perfiles publicados visibles para todos" on public.profiles for select to anon, authenticated using (slug is not null and profile_hidden is not true and is_active is not false);
create policy "Users can view their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "enable_insert_for_authenticated_users_only" on public.profiles for insert with check (auth.uid() = id);
create policy "enable_update_for_users_based_on_user_id" on public.profiles for update using (auth.uid() = id);
-- companies
create policy "Admins can delete companies" on public.companies for delete to authenticated using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins can update all companies" on public.companies for update to authenticated using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins can view all companies" on public.companies for select to authenticated using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Anyone can register companies" on public.companies for insert to authenticated with check (true);
create policy "Miembros y creador ven su empresa" on public.companies for select to authenticated using (created_by = auth.uid() or public.is_company_member(id));
create policy "Public can view approved companies basic info" on public.companies for select using ((status)::text = 'APPROVED');
create policy "Users can view companies after registration" on public.companies for select to authenticated using (true);
create policy "Users can view their companies" on public.companies for select using (exists (select 1 from public.company_users where company_users.company_id = companies.id and company_users.user_id = auth.uid()));
-- company_users
create policy "Admins can manage all memberships" on public.company_users for all to authenticated using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Admins can view all memberships" on public.company_users for select to authenticated using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "Altas en company_users" on public.company_users for insert to authenticated with check (public.company_users_insert_allowed(company_id, user_id, (role)::text, invited_by));
create policy "Altas en company_users (restrictiva)" on public.company_users as restrictive for insert to authenticated with check (public.company_users_insert_allowed(company_id, user_id, (role)::text, invited_by));
create policy "Users can view own memberships" on public.company_users for select to authenticated using (user_id = auth.uid());
-- job_postings
create policy "Company admins can delete job postings" on public.job_postings for delete using (company_id in (select company_id from public.company_users where user_id = auth.uid() and (role)::text = any (array['OWNER','ADMIN'])));
create policy "Company members can create job postings" on public.job_postings for insert with check (company_id in (select company_id from public.company_users where user_id = auth.uid()));
create policy "Company members can update job postings" on public.job_postings for update using (exists (select 1 from public.company_users where company_users.company_id = job_postings.company_id and company_users.user_id = auth.uid() and (company_users.role)::text = any (array['OWNER','ADMIN','MEMBER'])));
create policy "Company members can update their job postings" on public.job_postings for update using (company_id in (select company_id from public.company_users where user_id = auth.uid()));
create policy "Company members view their own jobs" on public.job_postings for select to authenticated using (exists (select 1 from public.company_users cu where cu.company_id = job_postings.company_id and cu.user_id = auth.uid()));
create policy "Company owners and admins can delete job postings" on public.job_postings for delete using (exists (select 1 from public.company_users where company_users.company_id = job_postings.company_id and company_users.user_id = auth.uid() and (company_users.role)::text = any (array['OWNER','ADMIN'])));
create policy "Public read access to published jobs" on public.job_postings for select using ((status)::text = 'PUBLISHED' and published_at is not null and (application_deadline is null or application_deadline > now()));
-- job_posting_questions (6 reales, con duplicados)
create policy "Anyone can view questions for published jobs" on public.job_posting_questions for select using (job_posting_id in (select job_postings.id from public.job_postings where (job_postings.status)::text = 'PUBLISHED'));
create policy "Company members can manage questions" on public.job_posting_questions for all using (job_posting_id in (select jp.id from public.job_postings jp where jp.company_id in (select company_id from public.company_users where user_id = auth.uid())));
create policy "Company members can view questions for their jobs" on public.job_posting_questions for select using (job_posting_id in (select jp.id from public.job_postings jp where jp.company_id in (select company_id from public.company_users where user_id = auth.uid())));
create policy "Company members can view their questions" on public.job_posting_questions for select using (exists (select 1 from public.job_postings jp join public.company_users cu on cu.company_id = jp.company_id where jp.id = job_posting_questions.job_posting_id and cu.user_id = auth.uid()));
create policy "Company members manage questions" on public.job_posting_questions for all to authenticated using (exists (select 1 from public.job_postings jp join public.company_users cu on cu.company_id = jp.company_id where jp.id = job_posting_questions.job_posting_id and cu.user_id = auth.uid()));
create policy "Public can view questions of published jobs" on public.job_posting_questions for select using (exists (select 1 from public.job_postings jp where jp.id = job_posting_questions.job_posting_id and (jp.status)::text = 'PUBLISHED'));
-- job_applications (7 reales)
create policy "Candidates can create applications" on public.job_applications for insert with check (profile_id = auth.uid());
create policy "Candidates can update their applications" on public.job_applications for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "Candidates can view their applications" on public.job_applications for select using (exists (select 1 from public.profiles where profiles.id = job_applications.profile_id and profiles.id = auth.uid()));
create policy "Candidates can view their own applications" on public.job_applications for select using (profile_id = auth.uid());
create policy "Company members can update application status" on public.job_applications for update using (company_id in (select company_id from public.company_users where user_id = auth.uid()));
create policy "Company members can view applications" on public.job_applications for select using (exists (select 1 from public.company_users where company_users.company_id = job_applications.company_id and company_users.user_id = auth.uid()));
create policy "Company members can view applications to their jobs" on public.job_applications for select using (company_id in (select company_id from public.company_users where user_id = auth.uid()));
-- CV
create policy "Managers manage managed profile experiences" on public.experiences for all using (public.is_managed_profile(profile_id)) with check (public.is_managed_profile(profile_id));
create policy "Users can delete own experiences" on public.experiences for delete using (auth.uid() = profile_id);
create policy "Users can insert own experiences" on public.experiences for insert with check (auth.uid() = profile_id);
create policy "Users can update own experiences" on public.experiences for update using (auth.uid() = profile_id);
create policy "experiences_visible_si_el_perfil_lo_es" on public.experiences for select to anon, authenticated using (exists (select 1 from public.profiles p where p.id = experiences.profile_id));
create policy "Managers manage managed profile education" on public.education for all using (public.is_managed_profile(profile_id)) with check (public.is_managed_profile(profile_id));
create policy "Users can delete own education" on public.education for delete using (auth.uid() = profile_id);
create policy "Users can insert own education" on public.education for insert with check (auth.uid() = profile_id);
create policy "Users can update own education" on public.education for update using (auth.uid() = profile_id);
create policy "education_visible_si_el_perfil_lo_es" on public.education for select to anon, authenticated using (exists (select 1 from public.profiles p where p.id = education.profile_id));
create policy "Managers manage managed profile skills" on public.skills for all using (public.is_managed_profile(profile_id)) with check (public.is_managed_profile(profile_id));
create policy "Users can delete own skills" on public.skills for delete using (auth.uid() = profile_id);
create policy "Users can insert own skills" on public.skills for insert with check (auth.uid() = profile_id);
create policy "Users can update own skills" on public.skills for update using (auth.uid() = profile_id);
create policy "skills_visible_si_el_perfil_lo_es" on public.skills for select to anon, authenticated using (exists (select 1 from public.profiles p where p.id = skills.profile_id));
create policy "Managers manage managed profile languages" on public.languages for all using (public.is_managed_profile(profile_id)) with check (public.is_managed_profile(profile_id));
create policy "Users can delete own languages" on public.languages for delete using (auth.uid() = profile_id);
create policy "Users can insert own languages" on public.languages for insert with check (auth.uid() = profile_id);
create policy "Users can update own languages" on public.languages for update using (auth.uid() = profile_id);
create policy "languages_visible_si_el_perfil_lo_es" on public.languages for select to anon, authenticated using (exists (select 1 from public.profiles p where p.id = languages.profile_id));

-- ----------------------------------------------------------------- vistas reales (antes de la fase 1)
create view public.profiles_full with (security_barrier=true) as
 select id, full_name, headline, summary, slug, meta_title, meta_description, template, template_color, availability, location, phone, linkedin_url, github_url, gender, portfolio_url, job_seeking_status, avatar_url, open_to_remote, website_url, twitter_url, instagram_url, youtube_url, behance_url, dribbble_url, job_type, willing_to_relocate, preferred_locations, slug_validation_error, email, name, role, plan, handle, title, remote_preference, salary_min, salary_max, salary_currency, created_at, updated_at, show_verified_credentials, show_connect_links, show_qr_code, show_availability_badge, country_code, remote, work_mode, last_slug_changed_at, dashboard_tour_completed, first_login_completed, wizard_completed, is_active, suspension_reason, suspended_until, profile_hidden, search_blocked, messages_blocked, banner_url, is_open_to_messages, managed_by, is_premium
 from public.profiles p where (id = auth.uid()) or (managed_by = auth.uid()) or public.current_user_is_admin();
create view public.companies_full with (security_barrier=true) as
 select id, created_at, updated_at, company_name, legal_name, tax_id, company_email, company_phone, website_url, address_street, address_city, address_state, address_country, address_postal, industry, company_size, description, logo_url, tax_document_url, verification_document_url, status, verified_at, verified_by, rejection_reason, admin_notes, credit_balance, total_credits_purchased, total_credits_used, signup_ip, last_login_at, metadata, website, created_by
 from public.companies c where (created_by = auth.uid()) or public.is_company_member(id) or public.current_user_is_admin();
revoke all on public.profiles_full, public.companies_full from anon, authenticated;
grant select on public.profiles_full, public.companies_full to authenticated;

-- ----------------------------------------------------------------- cierres previos (20261005..20261009b), estado real
revoke select on public.profiles from public, anon, authenticated;
grant select (id, full_name, name, headline, summary, slug, handle, title, meta_title, meta_description, template, template_color, availability, location, country_code, gender, avatar_url, banner_url, linkedin_url, github_url, portfolio_url, website_url, twitter_url, instagram_url, youtube_url, behance_url, dribbble_url, job_seeking_status, job_type, open_to_remote, remote, remote_preference, work_mode, willing_to_relocate, preferred_locations, show_verified_credentials, show_connect_links, show_qr_code, show_availability_badge, is_open_to_messages, wizard_completed, is_premium, is_active, profile_hidden, role, created_at, updated_at) on public.profiles to anon, authenticated;
revoke insert, update, delete on public.profiles from anon;
revoke select, insert, update, delete on public.companies from anon;
revoke select on public.companies from public, authenticated;
grant select (id, company_name, logo_url) on public.companies to anon, authenticated;
