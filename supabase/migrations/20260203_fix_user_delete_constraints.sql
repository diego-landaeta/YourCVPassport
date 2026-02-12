-- =====================================================
-- FIX ALL FOREIGN KEY CONSTRAINTS FOR USER DELETION
-- =====================================================
-- This migration fixes ALL foreign keys that reference auth.users
-- without ON DELETE CASCADE/SET NULL, which prevents user deletion

-- 1. Fix companies.verified_by
ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS companies_verified_by_fkey;

ALTER TABLE public.companies
ADD CONSTRAINT companies_verified_by_fkey
FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Fix company_users.invited_by
ALTER TABLE public.company_users
DROP CONSTRAINT IF EXISTS company_users_invited_by_fkey;

ALTER TABLE public.company_users
ADD CONSTRAINT company_users_invited_by_fkey
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Fix company_credits_history.created_by
ALTER TABLE public.company_credits_history
DROP CONSTRAINT IF EXISTS company_credits_history_created_by_fkey;

ALTER TABLE public.company_credits_history
ADD CONSTRAINT company_credits_history_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Fix job_postings.created_by
ALTER TABLE public.job_postings
DROP CONSTRAINT IF EXISTS job_postings_created_by_fkey;

ALTER TABLE public.job_postings
ADD CONSTRAINT job_postings_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Fix job_applications.viewed_by
ALTER TABLE public.job_applications
DROP CONSTRAINT IF EXISTS job_applications_viewed_by_fkey;

ALTER TABLE public.job_applications
ADD CONSTRAINT job_applications_viewed_by_fkey
FOREIGN KEY (viewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Fix feed_posts.hidden_by
ALTER TABLE public.feed_posts
DROP CONSTRAINT IF EXISTS feed_posts_hidden_by_fkey;

ALTER TABLE public.feed_posts
ADD CONSTRAINT feed_posts_hidden_by_fkey
FOREIGN KEY (hidden_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 7. Fix enterprise_feature_grants.granted_by
ALTER TABLE public.enterprise_feature_grants
DROP CONSTRAINT IF EXISTS enterprise_feature_grants_granted_by_fkey;

ALTER TABLE public.enterprise_feature_grants
ADD CONSTRAINT enterprise_feature_grants_granted_by_fkey
FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
