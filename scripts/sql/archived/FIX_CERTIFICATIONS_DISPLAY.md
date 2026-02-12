# Fix: Certifications Not Displaying on Public Profiles

## Problem

After successfully inserting certification data into the database, certifications were not appearing on public profile pages.

**Database Status**: ✅ Working correctly
- 9 certifications inserted (3 per user)
- 9 CERTIFICATION stamps created
- Data verified via SQL query

**Display Status**: ❌ Not working
- Public profiles showed no certifications section
- Profile data was loaded but not passed to templates correctly

## Root Cause

Three issues were identified:

### 1. TypeScript Type Missing CERTIFICATION
**File**: `types.ts` line 323
**Issue**: PortfolioItemType enum didn't include 'CERTIFICATION' or 'COLLABORATION'
```typescript
// BEFORE (WRONG):
export type PortfolioItemType = 'PROJECT' | 'DESIGN' | 'WRITING' | 'VIDEO' | 'CODE' | 'OTHER';

// AFTER (FIXED):
export type PortfolioItemType = 'PROJECT' | 'DESIGN' | 'WRITING' | 'VIDEO' | 'CODE' | 'OTHER' | 'CERTIFICATION' | 'COLLABORATION';
```

### 2. Missing Certification Fields in PortfolioItem Interface
**File**: `types.ts` PortfolioItem interface
**Issue**: Interface lacked certification-specific fields from database schema

**Added Fields**:
```typescript
// Certification-specific fields (when type = 'CERTIFICATION')
issuer?: string | null;
issue_date?: string | null;
expiry_date?: string | null;
credential_id?: string | null;
credential_url?: string | null;
verified?: boolean | null;
```

### 3. Incorrect Data Passing in ProfileViewPage
**File**: `components/ProfileViewPage.tsx` lines 109-120
**Issue**: Templates expect `data.portfolio` but ProfileViewPage was passing `portfolioItems`

**Before (WRONG)**:
```typescript
setProfileData({
    profile,
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    services: [],
    stats: [],
    portfolioItems: portfolioItems || [],  // ❌ Wrong property name
    certifications: [],                     // ❌ Hardcoded empty array
    languages: languages || [],
    stamps: stamps || [],
});
```

**After (FIXED)**:
```typescript
setProfileData({
    profile,
    experiences: experiences || [],
    education: education || [],
    skills: skills || [],
    services: [],
    stats: [],
    portfolio: portfolioItems || [],  // ✅ Correct property name
    certifications: (portfolioItems || []).filter(item => item.type === 'CERTIFICATION'),  // ✅ Filter certifications
    languages: languages || [],
    stamps: stamps || [],
});
```

## How Templates Use The Data

Templates (e.g., ClassicTemplate.tsx) expect this structure:

```typescript
// Line 15: Destructure portfolio from data
const { profile, experiences = [], education = [], skills = [], portfolio: portfolioItems = [] } = data || {};

// Line 20: Filter certifications from portfolio items
const certifications = portfolioItems.filter(item => item.type === 'CERTIFICATION');
```

The template:
1. Expects `data.portfolio` (not `data.portfolioItems`)
2. Filters certifications by `type === 'CERTIFICATION'`
3. Renders the certifications section if any exist

## Files Modified

1. **types.ts**
   - ✅ Updated PortfolioItemType to include 'CERTIFICATION' and 'COLLABORATION'
   - ✅ Added certification-specific fields to PortfolioItem interface
   - ✅ Updated FullProfileData to support both `portfolio` and `portfolioItems`

2. **components/ProfileViewPage.tsx**
   - ✅ Changed `portfolioItems` to `portfolio` in setProfileData
   - ✅ Changed `certifications: []` to filtered certifications from portfolio items

## Verification

After applying these fixes:

1. **Check TypeScript compilation**:
   ```bash
   npm run build
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Visit profile pages**:
   - `/profile/marta-ruiz-serrano` - Should show 3 certifications
   - `/profile/javier-torres-gimeno` - Should show 3 certifications
   - `/profile/laura-martinez-vidal` - Should show 3 certifications

4. **Expected result**:
   - ✅ Certifications section visible in CV
   - ✅ 3 certifications per user displayed
   - ✅ Green "Verified" badge on each certification
   - ✅ Stamps count in header includes CERTIFICATION stamps

## Database Schema Reference

The `portfolio_items` table supports certifications with this structure:

```sql
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION')),
  title TEXT NOT NULL,
  description TEXT,

  -- Certification-specific columns
  issuer TEXT,
  issue_date TEXT,
  expiry_date TEXT,
  credential_id TEXT,
  credential_url TEXT,
  verified BOOLEAN DEFAULT false,

  -- Common columns
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Related Documentation

- Migration: `supabase/migrations/20260122_update_portfolio_items_for_certifications.sql`
- Setup Script: `scripts/sql/SUPABASE_setup-usuarios-demo.sql`
- Constraint Fix: `scripts/sql/FIX_ERROR_CONSTRAINT.md`
- Execution Guide: `scripts/sql/EJECUTAR_EN_SUPABASE.md`

---

**Fixed**: 2026-01-22
**Status**: ✅ Ready for testing
