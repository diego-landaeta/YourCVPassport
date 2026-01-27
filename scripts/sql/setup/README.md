# Demo Professionals Setup Scripts

## Overview

This directory contains SQL scripts to populate the database with complete professional profiles for demonstration purposes.

---

## Available Setup Scripts

### Individual Professionals

#### 1. James Wilson - Tutor de Educación Emocional
**File**: `01_INJECT_JAMES_WILSON_COMPLETE.sql`

Creates a complete profile for James Wilson including:
- ✅ Auth user account (email: james.wilson@iseih.edu)
- ✅ Complete profile with summary and location (Miami, FL)
- ✅ 4 Work experiences
- ✅ 2 Education entries
- ✅ 6 Skills
- ✅ 2 Languages
- ✅ 3 Portfolio projects
- ✅ 3 Collaborations
- ✅ 3 Professional certifications
- ✅ 5 Verification stamps (EMAIL, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION)

**Professional Background**:
- 9 years of experience teaching socioemotional skills
- Specializes in emotional intelligence for children and adolescents
- Evidence-based, practical approach
- Based in Miami, Florida

**Certifications**:
1. Certified Emotional Intelligence Educator (CASEL)
2. Trauma-Informed Care Specialist (NCTSN)
3. SEL Implementation Specialist (Collaborative for Academic, Social, and Emotional Learning)

---

### Comprehensive Setup

#### 2. 10 ISEIH Professionals
**File**: `INJECT_10_PROFESSIONALS_COMPLETE.sql`

Creates 10 complete professional profiles for ISEIH (Instituto Superior de Educación Integral Holística) including:

1. **James Wilson** - Tutor de Educación Emocional (Miami, FL)
2. **Sarah Martinez** - [To be documented]
3. **Robert Chen** - [To be documented]
4. **Emily Rodriguez** - [To be documented]
5. **Marcus Thompson** - [To be documented]
6. **Lisa Anderson** - [To be documented]
7. **David Kim** - [To be documented]
8. **Rachel Okonkwo** - [To be documented]
9. **Jennifer Patel** - [To be documented]
10. **Michael Santos** - [To be documented]

Each profile includes:
- Complete authentication setup
- Full profile data with professional summaries
- Multiple work experiences
- Education credentials
- Skills and languages
- Portfolio projects and collaborations
- Professional certifications
- Verification stamps

---

## How to Execute

### Prerequisites

Before running these scripts, ensure the following migrations are applied:

1. **Certification stamp type**:
   ```sql
   -- File: supabase/migrations/20260122_add_certification_stamp_type.sql
   ```

2. **Portfolio items update for certifications**:
   ```sql
   -- File: supabase/migrations/20260122_update_portfolio_items_for_certifications.sql
   ```

3. **Enable certification verification**:
   ```sql
   -- File: supabase/migrations/20260122_enable_certification_verification.sql
   ```

### Execution Options

#### Option 1: Individual Profile (James Wilson)

From **Supabase Dashboard → SQL Editor**:
1. Copy contents of `01_INJECT_JAMES_WILSON_COMPLETE.sql`
2. Paste into SQL Editor
3. Click **Run**

Or via psql:
```bash
psql -U postgres -d yourcvpassport -f scripts/sql/setup/01_INJECT_JAMES_WILSON_COMPLETE.sql
```

#### Option 2: All 10 Professionals

From **Supabase Dashboard → SQL Editor**:
1. Copy contents of `INJECT_10_PROFESSIONALS_COMPLETE.sql`
2. Paste into SQL Editor
3. Click **Run**

Or via psql:
```bash
psql -U postgres -d yourcvpassport -f scripts/sql/setup/INJECT_10_PROFESSIONALS_COMPLETE.sql
```

---

## Verification

After executing the scripts, verify the setup:

### Check User Creation
```sql
SELECT
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email LIKE '%@iseih.edu'
ORDER BY email;
```

### Check Profiles
```sql
SELECT
  p.full_name,
  p.email,
  p.headline,
  p.location,
  p.slug
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.full_name;
```

### Check Certifications
```sql
SELECT
  p.full_name,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certifications,
  COUNT(DISTINCT s.id) FILTER (WHERE s.type = 'CERTIFICATION') as cert_stamps
FROM profiles p
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps s ON s.profile_id = p.id
WHERE p.email LIKE '%@iseih.edu'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;
```

### Check All Stamps
```sql
SELECT
  p.full_name,
  s.type,
  s.status,
  s.verified_at
FROM profiles p
JOIN stamps s ON s.profile_id = p.id
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.full_name, s.type;
```

---

## Features Demonstrated

These demo profiles showcase:

### 1. Complete Professional Profiles
- Detailed summaries and headlines
- Professional locations and contact information
- Custom URL slugs
- Template selection

### 2. Work Experience
- Multiple positions with dates
- Company information
- Detailed descriptions

### 3. Education
- Degree information
- Institutions
- Graduation dates

### 4. Skills & Languages
- Technical and soft skills
- Proficiency levels
- Multiple languages

### 5. Portfolio & Projects
- Featured projects
- Descriptions and outcomes
- Professional collaborations

### 6. Certifications System ⭐
- Professional certifications with official issuers
- Credential IDs and verification URLs
- Issue and expiration dates
- Verified status badges

### 7. Verification Stamps ⭐
- EMAIL verification
- IDENTITY verification
- EDUCATION verification
- EMPLOYMENT verification
- LANGUAGE verification
- CERTIFICATION verification (NEW)

---

## Notes

### Idempotency
All scripts use proper existence checks and `ON CONFLICT` clauses to prevent duplicate data. They can be run multiple times safely.

### Passwords
Demo users are created with the temporary password: `TempPassword123!`

**⚠️ Important**: These are demo accounts. In production:
- Use strong, unique passwords
- Require password reset on first login
- Implement proper password policies

### Data Privacy
These profiles contain fictional data for demonstration purposes only. Do not use real personal information in demo accounts.

---

## Related Files

### Other Demo User Scripts
- `../EJECUTAR_SETUP_USUARIOS_DEMO.sql` - Setup for Marta, Javier, and Laura (existing users)
- `../add-certifications-demo-users.sql` - Add certifications to existing demo users
- `../README_USUARIOS_DEMO.md` - Documentation for existing demo users

### Migrations
- `../../supabase/migrations/20260122_add_certification_stamp_type.sql`
- `../../supabase/migrations/20260122_update_portfolio_items_for_certifications.sql`
- `../../supabase/migrations/20260122_enable_certification_verification.sql`

### Documentation
- `../../docs/USUARIOS_DEMO_CERTIFICACIONES.md` - Demo users with certifications overview
- `../../docs/implementation/CERTIFICACIONES_IMPLEMENTACION_COMPLETA.md` - Certifications implementation
- `../../docs/implementation/CERTIFICATION_VERIFICATION_SYSTEM.md` - Verification system details

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Cause**: User already exists in the database.
**Solution**: The scripts handle this with existence checks. If you need to reset, delete the user first:
```sql
DELETE FROM auth.users WHERE email = 'james.wilson@iseih.edu';
```

### Error: "type certification does not exist"
**Cause**: Required migration not applied.
**Solution**: Run `20260122_add_certification_stamp_type.sql` first.

### Error: "column verified does not exist"
**Cause**: Portfolio items table not updated.
**Solution**: Run `20260122_update_portfolio_items_for_certifications.sql` first.

### Error: Permission denied
**Cause**: Insufficient database permissions.
**Solution**: Run as database admin or ensure RLS policies allow the operation.

---

## Next Steps

After setting up demo profiles:

1. **View Public Profiles**:
   - Visit: `https://yourdomain.com/profile/james-wilson-educacion-emocional`
   - Verify all sections display correctly
   - Check that verification badges appear

2. **Test Search Functionality**:
   - Search for professionals by skill
   - Filter by certifications
   - Test location-based search

3. **Admin Review**:
   - Check admin dashboard
   - Verify stamps management
   - Test certification approval workflow

4. **Create More Profiles**:
   - Use these scripts as templates
   - Add profiles for different industries
   - Diversify locations and specializations

---

**Created**: 2026-01-22
**Version**: 1.0
**System**: YourCVPassport - Professional Demo Profiles
**Purpose**: Demonstration and testing of complete professional profiles with certification system
