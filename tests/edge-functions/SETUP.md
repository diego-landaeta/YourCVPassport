# Edge Function Tests - Setup Guide

## Quick Start

### 1. Set Environment Variables

Before running the tests, you need to set your Supabase credentials:

**PowerShell (Windows):**

```powershell
$env:VITE_SUPABASE_URL="https://your-project.supabase.co"
$env:VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

**Bash (Linux/Mac):**

```bash
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

### 2. Run Tests

```bash
# Run all edge function tests
npm test tests/edge-functions/

# Run specific test file
npm test tests/edge-functions/verification.spec.ts
```

## Finding Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon public** key → Use as `VITE_SUPABASE_ANON_KEY`

## Test Data

The tests use the following data:

- Email: `nangelm.dev@gmail.com`
- Phone: `+584129543569`

## Troubleshooting

### Tests are failing with "VITE_SUPABASE_URL not set"

- Make sure you've set the environment variables in your current terminal session
- The variables are session-specific and need to be set each time you open a new terminal

### Tests are failing with 404 errors

- Make sure your edge functions are deployed to Supabase
- Run `supabase functions deploy` to deploy all functions

### Tests are failing with authentication errors

- Verify your `VITE_SUPABASE_ANON_KEY` is correct
- Make sure the anon key has the correct permissions

## Expected Test Behavior

Some tests are expected to fail in certain scenarios:

- **Rate limiting tests**: Will fail after 3 attempts
- **Invalid code tests**: Will fail with 400 status
- **Unauthorized tests**: Will fail with 401 status

This is normal and expected behavior.
