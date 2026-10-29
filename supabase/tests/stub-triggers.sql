-- Triggers REALES (se crean después de cargar prod-funcs.sql, que trae las funciones reales)
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create trigger normalize_profile_role_trigger before insert or update on public.profiles for each row execute function public.normalize_profile_role();
create trigger trg_profiles_bloquear_campos_protegidos before insert or update on public.profiles for each row execute function public.profiles_bloquear_campos_protegidos();

create trigger trg_companies_proteger_campos before insert or update on public.companies for each row execute function public.companies_proteger_campos();
create trigger update_companies_updated_at_trigger before update on public.companies for each row execute function public.update_companies_updated_at();
create trigger on_company_created_create_settings after insert on public.companies for each row execute function public.create_default_company_settings();
create trigger trigger_company_approved after update on public.companies for each row
  when (new.status::text = 'APPROVED' and old.status::text is distinct from 'APPROVED') execute function public.notify_company_approved();
create trigger trigger_company_rejected after update on public.companies for each row
  when (new.status::text = 'REJECTED' and old.status::text is distinct from 'REJECTED') execute function public.notify_company_rejected();
create trigger trigger_low_credits after update on public.companies for each row
  when (new.credit_balance < 10 and (old.credit_balance is null or old.credit_balance >= 10)) execute function public.notify_low_credits();
create trigger trigger_team_member_added after insert on public.company_users for each row execute function public.notify_team_member_added();

create trigger trg_job_postings_proteger_publicacion before insert or update on public.job_postings for each row execute function public.job_postings_proteger_publicacion();
create trigger trigger_generate_job_posting_slug before insert or update on public.job_postings for each row execute function public.generate_job_posting_slug();
create trigger trigger_update_job_posting_timestamp before update on public.job_postings for each row execute function public.update_job_posting_updated_at();

create trigger on_application_status_change after update of status on public.job_applications for each row execute function public.notify_application_status_change();
create trigger on_new_job_application after insert on public.job_applications for each row execute function public.notify_new_job_application();
create trigger trigger_update_job_application_timestamp before update on public.job_applications for each row execute function public.update_job_posting_updated_at();
