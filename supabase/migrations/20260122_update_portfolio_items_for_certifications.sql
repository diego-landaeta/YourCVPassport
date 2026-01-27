-- Migration to support Certifications and Collaborations in portfolio_items table
-- This adds new columns to support the expanded portfolio functionality

-- Add new columns for certifications and collaborations if they don't exist
DO $$
BEGIN
    -- Add type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'type') THEN
        ALTER TABLE portfolio_items ADD COLUMN type TEXT DEFAULT 'PROJECT';
    END IF;

    -- Certification-specific fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'issuer') THEN
        ALTER TABLE portfolio_items ADD COLUMN issuer TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'issue_date') THEN
        ALTER TABLE portfolio_items ADD COLUMN issue_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'expiry_date') THEN
        ALTER TABLE portfolio_items ADD COLUMN expiry_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'credential_id') THEN
        ALTER TABLE portfolio_items ADD COLUMN credential_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'credential_url') THEN
        ALTER TABLE portfolio_items ADD COLUMN credential_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'verified') THEN
        ALTER TABLE portfolio_items ADD COLUMN verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Collaboration-specific fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'organization') THEN
        ALTER TABLE portfolio_items ADD COLUMN organization TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'role') THEN
        ALTER TABLE portfolio_items ADD COLUMN role TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'start_date') THEN
        ALTER TABLE portfolio_items ADD COLUMN start_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'end_date') THEN
        ALTER TABLE portfolio_items ADD COLUMN end_date TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'collaborators') THEN
        ALTER TABLE portfolio_items ADD COLUMN collaborators TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'is_current') THEN
        ALTER TABLE portfolio_items ADD COLUMN is_current BOOLEAN DEFAULT FALSE;
    END IF;

    -- Make sure url is nullable for certifications/collaborations where it's optional
    ALTER TABLE portfolio_items ALTER COLUMN url DROP NOT NULL;

    -- Add category column if it doesn't exist (for backwards compatibility)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'category') THEN
        ALTER TABLE portfolio_items ADD COLUMN category TEXT;
    END IF;

    -- Add image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'portfolio_items' AND column_name = 'image_url') THEN
        ALTER TABLE portfolio_items ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Create an index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_portfolio_items_type ON portfolio_items(type);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_profile_type ON portfolio_items(profile_id, type);

-- Update existing items to have type = 'PROJECT' if they don't have a type yet
UPDATE portfolio_items SET type = 'PROJECT' WHERE type IS NULL;

-- Drop old type check constraint if it exists and create a new one
DO $$
BEGIN
    -- Drop the old constraint
    ALTER TABLE portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_type_check;

    -- Add new constraint that includes CERTIFICATION and COLLABORATION
    ALTER TABLE portfolio_items ADD CONSTRAINT portfolio_items_type_check
        CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION'));

    RAISE NOTICE 'Updated portfolio_items type constraint to include CERTIFICATION and COLLABORATION';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Note: % (this may be expected if constraint did not exist)', SQLERRM;
END $$;

-- Add a comment explaining the table structure
COMMENT ON TABLE portfolio_items IS 'Portfolio items including projects, certifications, and collaborations';
COMMENT ON COLUMN portfolio_items.type IS 'Type of portfolio item: PROJECT, CERTIFICATION, or COLLABORATION';
COMMENT ON COLUMN portfolio_items.issuer IS 'Issuer of certification (for CERTIFICATION type)';
COMMENT ON COLUMN portfolio_items.issue_date IS 'Issue date of certification (for CERTIFICATION type)';
COMMENT ON COLUMN portfolio_items.expiry_date IS 'Expiry date of certification (for CERTIFICATION type)';
COMMENT ON COLUMN portfolio_items.credential_id IS 'Credential ID (for CERTIFICATION type)';
COMMENT ON COLUMN portfolio_items.credential_url IS 'URL to verify credential (for CERTIFICATION type)';
COMMENT ON COLUMN portfolio_items.organization IS 'Organization name (for COLLABORATION type)';
COMMENT ON COLUMN portfolio_items.role IS 'User role in collaboration (for COLLABORATION type)';
COMMENT ON COLUMN portfolio_items.start_date IS 'Start date of collaboration (for COLLABORATION type)';
COMMENT ON COLUMN portfolio_items.end_date IS 'End date of collaboration (for COLLABORATION type)';
COMMENT ON COLUMN portfolio_items.is_current IS 'Whether collaboration is ongoing (for COLLABORATION type)';
COMMENT ON COLUMN portfolio_items.collaborators IS 'Array of collaborator names (for COLLABORATION type)';
