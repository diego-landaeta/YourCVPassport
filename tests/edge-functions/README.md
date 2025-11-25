# Edge Functions Test Suite

This directory contains comprehensive tests for all Supabase Edge Functions.

## Test Files

### 1. `verification.spec.ts`

Tests for email and phone verification functions:

- `send-verification-email` - Sends 6-digit verification code via email
- `verify-email-code` - Verifies email codes
- `send-verification-sms` - Sends verification code via SMS (Twilio)
- `verify-phone-code` - Verifies phone codes

**Coverage:**

- ✅ Happy path (successful verification)
- ✅ Required parameter validation
- ✅ Rate limiting (3 attempts per hour)
- ✅ Code expiration
- ✅ Invalid codes
- ✅ CORS handling

### 2. `authentication.spec.ts`

Tests for authentication-related functions:

- `send-email-confirmation` - Welcome email with confirmation link
- `send-magic-link` - Passwordless authentication
- `send-password-reset` - Password recovery

**Coverage:**

- ✅ Email sending
- ✅ Custom redirect URLs
- ✅ Required parameter validation
- ✅ Security best practices (not revealing user existence)
- ✅ CORS handling

### 3. `export.spec.ts`

Tests for CV export functions:

- `export-pdf` - Generates PDF resumes
- `export-docx` - Generates Word documents

**Coverage:**

- ✅ Template support (classic, modern, minimal)
- ✅ Language support (en, es)
- ✅ Export options
- ✅ Authorization checks
- ✅ Content type validation
- ✅ Access control

### 4. `public-profile.spec.ts`

Tests for public profile functions:

- `get-public-profile` - Retrieves profile by slug
- `get-profiles-directory` - Lists public profiles

**Coverage:**

- ✅ Profile retrieval
- ✅ Related data (experiences, education, skills, stamps)
- ✅ Pagination
- ✅ Search and filtering
- ✅ Privacy controls
- ✅ Performance

### 5. `utilities.spec.ts`

Tests for utility functions:

- `track-analytics` - Event tracking
- `ai-optimize-description` - AI-powered text optimization
- `sitemap` - SEO sitemap generation
- `send-lead-notification` - Lead notifications

**Coverage:**

- ✅ Event tracking
- ✅ AI optimization
- ✅ XML sitemap generation
- ✅ Lead form validation
- ✅ CORS handling

## Running Tests

### Run All Edge Function Tests

```bash
npm test tests/edge-functions/
```

### Run Specific Test File

```bash
npm test tests/edge-functions/verification.spec.ts
npm test tests/edge-functions/authentication.spec.ts
npm test tests/edge-functions/export.spec.ts
npm test tests/edge-functions/public-profile.spec.ts
npm test tests/edge-functions/utilities.spec.ts
```

### Run in UI Mode

```bash
npm run test:ui
```

### Run in Debug Mode

```bash
npm run test:debug
```

## Environment Variables

Make sure these environment variables are set:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Test Data

Some tests use the following test data:

- Email: `nangelm.dev@gmail.com`
- Phone: `+584129543569`

## Notes

- Some tests may fail if edge functions are not deployed
- Tests with external services (Resend, Twilio) may fail without proper credentials
- Rate limiting tests should be run carefully to avoid hitting actual limits
- Authentication tests require valid JWT tokens for full coverage

## Manual Testing

For real-world validation, you can manually test:

1. **Email Verification**: Check inbox for verification codes
2. **SMS Verification**: Check phone for SMS codes
3. **PDF Export**: Verify generated PDF quality
4. **DOCX Export**: Verify generated Word document quality

## Future Improvements

- [ ] Add email interception for content validation
- [ ] Add database assertions for analytics
- [ ] Add performance benchmarks
- [ ] Add load testing
- [ ] Add integration tests with real authentication
