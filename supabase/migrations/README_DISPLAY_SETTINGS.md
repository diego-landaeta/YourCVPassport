# Display Settings Update - Migration Guide

## Overview
This migration removes the QR Code option from display settings and ensures professional links (LinkedIn, Portfolio, GitHub) are always shown when available.

## Changes Made

### Frontend Components
- **File**: `components/profile-editor/DisplaySettingsSection.tsx`
  - Removed QR Code toggle option
  - Set `show_connect_links` to `true` by default
  - Only one toggle remains: "Mostrar Enlaces de Conexión"

- **File**: `components/templates/PassportTemplate.tsx`
  - Professional links section now shows automatically when any link exists
  - No longer depends on `show_connect_links` toggle (but the field is still used for backward compatibility)

### Database Migration
- **File**: `20251219_update_display_settings.sql`
  - Sets `show_connect_links` to `true` for all existing profiles
  - Sets default value to `true` for new profiles
  - Keeps `show_qr_code` column for backward compatibility (no longer used)

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/20251219_update_display_settings.sql`
4. Copy the entire SQL content
5. Paste it into a new query in the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Supabase CLI
If you have Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## What Happens After Migration

1. **All Existing Users**:
   - Their `show_connect_links` setting will be set to `true`
   - Professional links will be visible on their CVs if they have LinkedIn, Portfolio, or GitHub URLs

2. **New Users**:
   - `show_connect_links` defaults to `true` automatically
   - Professional links will show by default

3. **Settings Page**:
   - QR Code option is removed from the UI
   - Only "Mostrar Enlaces de Conexión" toggle remains
   - Users can still toggle to hide their professional links if desired

## Behavior Changes

### Before
- QR Code option shown but not actually used anywhere in templates
- Connect Links required toggle to be manually enabled
- Default was `false` (links hidden)

### After
- QR Code option completely removed from settings
- Connect Links shown by default
- Users can still hide links via toggle if needed
- Professional links appear automatically when URLs are added to profile

## Rollback Instructions

If you need to rollback this migration:

```sql
-- Set show_connect_links back to false for all users
UPDATE public.profiles
SET show_connect_links = false;

-- Remove default value
ALTER TABLE public.profiles
ALTER COLUMN show_connect_links DROP DEFAULT;
```

Note: This won't restore the QR Code option in the UI - you would need to revert the frontend code changes manually.

## Notes

- The `show_qr_code` column remains in the database for backward compatibility
- It's safe to keep it even though it's no longer used
- If you want to remove it completely, run:
  ```sql
  ALTER TABLE public.profiles DROP COLUMN IF EXISTS show_qr_code;
  ```
- Professional links only show when user has entered LinkedIn, Portfolio, or GitHub URLs
