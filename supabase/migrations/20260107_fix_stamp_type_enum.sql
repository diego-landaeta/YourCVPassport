-- =====================================================
-- FIX stamp_type ENUM TO SUPPORT ALL VERIFICATION TYPES
-- =====================================================

-- Step 1: Check if stamp_type enum exists
DO $$
BEGIN
    -- If the enum exists, we need to add missing values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stamp_type') THEN
        -- Add IDENTITY if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype AND enumlabel = 'IDENTITY') THEN
            ALTER TYPE stamp_type ADD VALUE 'IDENTITY';
        END IF;

        -- Add EDUCATION if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype AND enumlabel = 'EDUCATION') THEN
            ALTER TYPE stamp_type ADD VALUE 'EDUCATION';
        END IF;

        -- Add EMPLOYMENT if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype AND enumlabel = 'EMPLOYMENT') THEN
            ALTER TYPE stamp_type ADD VALUE 'EMPLOYMENT';
        END IF;

        -- Add LANGUAGE if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'stamp_type'::regtype AND enumlabel = 'LANGUAGE') THEN
            ALTER TYPE stamp_type ADD VALUE 'LANGUAGE';
        END IF;

        RAISE NOTICE 'stamp_type enum updated successfully';
    ELSE
        -- If enum doesn't exist, create it with all values
        CREATE TYPE stamp_type AS ENUM ('EMAIL', 'IDENTITY', 'EDUCATION', 'EMPLOYMENT', 'LANGUAGE');
        RAISE NOTICE 'stamp_type enum created successfully';
    END IF;
END $$;

-- Step 2: Verify the enum values
SELECT enumlabel as available_stamp_types
FROM pg_enum
WHERE enumtypid = 'stamp_type'::regtype
ORDER BY enumsortorder;
