-- =====================================================
-- REMOVE PHONE VERIFICATION - CASCADE ALL DEPENDENCIES
-- =====================================================

-- Step 1: Drop dependent views
DROP VIEW IF EXISTS stamps_summary CASCADE;
DROP VIEW IF EXISTS stamp_request_availability CASCADE;

-- Step 2: Drop dependent functions
DROP FUNCTION IF EXISTS has_verified_stamp(uuid, stamp_type) CASCADE;
DROP FUNCTION IF EXISTS has_verified_stamp(uuid, text) CASCADE;

-- Step 3: Delete all existing PHONE stamps
DELETE FROM public.stamps WHERE type = 'PHONE';

-- Step 4: Create new enum without PHONE
CREATE TYPE stamp_type_new AS ENUM ('EMAIL', 'IDENTITY', 'EDUCATION', 'CERTIFICATION', 'EMPLOYMENT', 'SKILL', 'LANGUAGE');

-- Step 5: Alter the stamps table to use the new enum
ALTER TABLE public.stamps
  ALTER COLUMN type TYPE stamp_type_new
  USING type::text::stamp_type_new;

-- Step 6: Drop old enum and rename
DROP TYPE stamp_type CASCADE;
ALTER TYPE stamp_type_new RENAME TO stamp_type;

-- Step 7: Recreate stamps_summary view
CREATE OR REPLACE VIEW stamps_summary AS
SELECT
    profile_id,
    COUNT(*) as total_stamps,
    COUNT(*) FILTER (WHERE status = 'VERIFIED') as verified_count,
    COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
    COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
    COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_count,
    MAX(verified_at) as last_verification_date
FROM stamps
GROUP BY profile_id;

-- Step 8: Recreate stamp_request_availability view
CREATE OR REPLACE VIEW stamp_request_availability AS
SELECT
    s.profile_id,
    s.type,
    MAX(s.created_at) as last_request_at,
    MAX(s.created_at) + INTERVAL '3 days' as next_available_at,
    (MAX(s.created_at) + INTERVAL '3 days') <= NOW() as can_request_now,
    EXTRACT(DAY FROM (MAX(s.created_at) + INTERVAL '3 days') - NOW()) as days_until_available,
    COUNT(*) as total_attempts,
    CASE
        WHEN s.type IN ('EMAIL') THEN GREATEST(0, 4 - COUNT(*))
        ELSE NULL
    END as remaining_attempts
FROM stamps s
GROUP BY s.profile_id, s.type;

-- Step 9: Recreate has_verified_stamp function
CREATE OR REPLACE FUNCTION has_verified_stamp(user_id uuid, stamp_type_param stamp_type)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM stamps
        WHERE profile_id = user_id
        AND type = stamp_type_param
        AND status = 'VERIFIED'
    );
END;
$$;

-- Step 10: Verify the enum values
SELECT enumlabel as available_stamp_types
FROM pg_enum
WHERE enumtypid = 'stamp_type'::regtype
ORDER BY enumsortorder;
