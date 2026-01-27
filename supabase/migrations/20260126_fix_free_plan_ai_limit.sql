-- Fix Free Plan AI Limit Display
-- Free users should NOT have access to AI, but it was showing as "unlimited"
-- The issue: ai_requests_per_month = 0 is interpreted as unlimited in the system

-- Solution: Keep AI disabled but use -1 to indicate "not available" instead of 0 (unlimited)
UPDATE public.plan_limits
SET
    ai_requests_per_month = -1,     -- -1 means feature not available (not 0 which means unlimited)
    can_use_ai = false,              -- AI not available for free users
    updated_at = NOW()
WHERE plan_name = 'free';

-- Verify the update
SELECT plan_name, ats_exports_per_month, ai_requests_per_month, stamps_per_month, can_use_ai
FROM public.plan_limits
WHERE plan_name = 'free';
