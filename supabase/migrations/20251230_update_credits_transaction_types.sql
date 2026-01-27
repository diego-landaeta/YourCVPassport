-- =====================================================
-- UPDATE CREDIT TRANSACTION TYPES
-- =====================================================
-- Add JOB_POSTING to the allowed transaction types

-- Drop the existing constraint
ALTER TABLE public.company_credits_history
DROP CONSTRAINT IF EXISTS company_credits_history_transaction_type_check;

-- Add new constraint with JOB_POSTING included
ALTER TABLE public.company_credits_history
ADD CONSTRAINT company_credits_history_transaction_type_check
CHECK (transaction_type IN (
    'PURCHASE',
    'ADMIN_ADJUSTMENT',
    'REFUND',
    'PROFILE_VIEW',
    'PROFILE_CONTACT',
    'PROFILE_UNLOCK',
    'SEARCH_EXPORT',
    'CV_DOWNLOAD',
    'JOB_POSTING',           -- NEW: For publishing job postings
    'JOB_APPLICATION_VIEW'   -- NEW: For viewing job applications (if charged)
));

COMMENT ON COLUMN public.company_credits_history.transaction_type IS
'Type of credit transaction: PURCHASE (buying credits), ADMIN_ADJUSTMENT (manual adjustment), '
'REFUND (credit refund), PROFILE_VIEW (viewing profile), PROFILE_CONTACT (contacting candidate), '
'PROFILE_UNLOCK (unlocking full profile), SEARCH_EXPORT (exporting search results), '
'CV_DOWNLOAD (downloading CV), JOB_POSTING (publishing job vacancy), '
'JOB_APPLICATION_VIEW (viewing job application)';
