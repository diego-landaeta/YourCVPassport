-- =====================================================
-- ADD CERTIFICATION STAMP TYPE
-- =====================================================
-- This migration adds 'CERTIFICATION' to the stamp_type enum
-- to allow verification of professional certifications

DO $$
BEGIN
    -- Check if stamp_type enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stamp_type') THEN
        -- Add CERTIFICATION if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype AND enumlabel = 'CERTIFICATION') THEN
            ALTER TYPE stamp_type ADD VALUE 'CERTIFICATION';
            RAISE NOTICE 'CERTIFICATION added to stamp_type enum';
        ELSE
            RAISE NOTICE 'CERTIFICATION already exists in stamp_type enum';
        END IF;
    ELSE
        -- If enum doesn't exist, create it with all values including CERTIFICATION
        CREATE TYPE stamp_type AS ENUM (
            'EMAIL',
            'IDENTITY',
            'EDUCATION',
            'EMPLOYMENT',
            'LANGUAGE',
            'CERTIFICATION'
        );
        RAISE NOTICE 'stamp_type enum created with CERTIFICATION';
    END IF;
END $$;

-- Verify the enum values
SELECT enumlabel as available_stamp_types
FROM pg_enum
WHERE enumtypid = 'stamp_type'::regtype
ORDER BY enumsortorder;
