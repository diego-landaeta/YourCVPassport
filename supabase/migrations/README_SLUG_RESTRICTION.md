# Slug Update Restriction Feature - Migration Guide

## Overview
This migration adds the ability to restrict profile URL (slug) updates to once every 90 days.

## Files Changed

### Database Migration
- **File**: `20251219_add_slug_change_tracking.sql`
- **What it does**: Adds `last_slug_changed_at` column to track when users last changed their slug

### Backend/Utils
- **File**: `utils/slugValidation.ts` (NEW)
- **Functions**:
  - `canChangeSlug()` - Check if user can change slug (90 days passed)
  - `calculateDaysUntilSlugChange()` - Calculate days remaining
  - `getNextSlugChangeDate()` - Get formatted next available date
  - `updateSlugWithValidation()` - Update slug with all validations

### Frontend Components
- **File**: `components/dashboard/DashboardContent.tsx`
  - Added `SlugEditor` component with inline editing and 90-day restriction UI
  - Shows warning message when restriction is active
  - Real-time slug availability checking
  - Save/Cancel actions

- **File**: `components/profile-editor/FinalizationStep.tsx`
  - Sets `last_slug_changed_at` when slug is first created during onboarding

### Types
- **File**: `types.ts`
  - Added `last_slug_changed_at?: string | null` to Profile interface

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/20251219_add_slug_change_tracking.sql`
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

### Option 3: Manual Migration
If you prefer to run it manually via PostgreSQL client:

```bash
psql -h YOUR_SUPABASE_HOST -U postgres -d postgres -f supabase/migrations/20251219_add_slug_change_tracking.sql
```

## What Happens After Migration

1. **Existing Users**:
   - Users with existing slugs will have `last_slug_changed_at` set to current time
   - They will need to wait 90 days before they can change their slug

2. **New Users**:
   - When creating their profile, `last_slug_changed_at` is set automatically
   - They can change it once after 90 days

## Testing the Feature

### Test Case 1: User with No Restriction
1. Go to **Ajustes** (Settings) page
2. The URL input should be editable
3. Click on the input to start editing
4. Change the slug and save
5. Verify the change was saved and `last_slug_changed_at` was updated

### Test Case 2: User with Active Restriction
1. User who changed their slug recently (< 90 days)
2. Go to **Ajustes** page
3. The URL input should be disabled
4. A warning message should appear showing:
   - Days remaining until next change
   - Next available change date

### Test Case 3: Slug Availability Checking
1. Start editing the slug
2. Type a new slug
3. Wait 500ms for debounced check
4. Should see:
   - Green checkmark if available
   - Red X if already taken
   - Spinning loader while checking

### Test Case 4: Validation Messages
1. Try to save a slug with less than 3 characters → Error
2. Try to save a slug that's already taken → Error
3. Try to change before 90 days → Error with specific days remaining
4. Successfully change slug → Success message

## Rollback Instructions

If you need to rollback this migration:

```sql
-- Remove the column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_slug_changed_at;

-- Remove the index
DROP INDEX IF EXISTS idx_profiles_last_slug_changed;
```

## Notes

- The 90-day restriction is enforced both in the UI (disabled input) and backend (validation function)
- Auto-generated slugs (during profile creation) also set the timestamp
- The restriction can be adjusted by modifying the value in `utils/slugValidation.ts` (line 17: `90 - daysPassed`)
