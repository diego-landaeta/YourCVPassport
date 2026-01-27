-- =====================================================
-- ENABLE CERTIFICATION VERIFICATION SYSTEM
-- =====================================================
-- This migration updates the stamps table to support certification verification
-- by adding entity reference fields and updating constraints

-- Step 1: Add new columns to stamps table for entity references
DO $$
BEGIN
    -- Add entity_id to reference the specific item being verified (e.g., portfolio_item id)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'stamps' AND column_name = 'entity_id') THEN
        ALTER TABLE stamps ADD COLUMN entity_id TEXT;
        RAISE NOTICE 'Added entity_id column to stamps table';
    END IF;

    -- Add entity_type to specify what type of entity is being verified
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'stamps' AND column_name = 'entity_type') THEN
        ALTER TABLE stamps ADD COLUMN entity_type TEXT;
        RAISE NOTICE 'Added entity_type column to stamps table';
    END IF;
END $$;

-- Step 2: Ensure the type column uses the stamp_type enum
-- Note: The stamp_type enum already provides constraint validation
-- No additional CHECK constraint is needed
DO $$
BEGIN
    -- Drop any legacy check constraint if it exists
    ALTER TABLE stamps DROP CONSTRAINT IF EXISTS stamps_type_check;

    RAISE NOTICE 'Removed legacy type constraint (enum provides validation)';
END $$;

-- Step 3: Create index for faster queries on certifications
CREATE INDEX IF NOT EXISTS idx_stamps_entity ON stamps(entity_id, entity_type) WHERE entity_type = 'CERTIFICATION';
CREATE INDEX IF NOT EXISTS idx_stamps_type_status ON stamps(type, status) WHERE type = 'CERTIFICATION';
CREATE INDEX IF NOT EXISTS idx_stamps_profile_type ON stamps(profile_id, type);

-- Step 4: Add RLS policy for admin to verify certifications
DROP POLICY IF EXISTS "Admins can update any stamp" ON stamps;
CREATE POLICY "Admins can update any stamp"
    ON stamps FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Step 5: Add policy for public to view verified certifications
DROP POLICY IF EXISTS "Public can view verified certifications" ON stamps;
CREATE POLICY "Public can view verified certifications"
    ON stamps FOR SELECT
    USING (
        type = 'CERTIFICATION'
        AND status = 'VERIFIED'
    );

-- Step 6: Add comments for documentation
COMMENT ON COLUMN stamps.entity_id IS 'ID of the entity being verified (e.g., portfolio_item.id for certifications)';
COMMENT ON COLUMN stamps.entity_type IS 'Type of entity being verified (e.g., CERTIFICATION for portfolio certifications)';
COMMENT ON COLUMN stamps.type IS 'Type of stamp: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE, or CERTIFICATION';

-- Step 7: Update portfolio_items verified column to reference stamps
-- This is informational - the actual verification status comes from the stamps table
COMMENT ON COLUMN portfolio_items.verified IS 'Quick reference for verification status. Actual verification data is in stamps table.';
