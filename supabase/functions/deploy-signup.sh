#!/bin/bash

# ============================================================================
# Deploy Signup Edge Function
# ============================================================================

echo "🚀 Deploying signup Edge Function..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Error: Not logged in to Supabase"
    echo "Run: supabase login"
    exit 1
fi

# Deploy signup function
echo "👤 Deploying signup..."
supabase functions deploy signup --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ signup deployed successfully"
else
    echo "❌ Failed to deploy signup"
    exit 1
fi

echo ""
echo "📝 Setting environment variables..."
echo ""

# Set environment variables for the function
# IMPORTANTE: Estas variables deben estar configuradas en tu Dashboard de Supabase
# Ve a: Project Settings > Edge Functions > Manage secrets

echo "Setting RESEND_API_KEY..."
supabase secrets set RESEND_API_KEY=re_Ancd1uP3_2VPxp32mKewFD61LvVPPny61

echo "Setting SENDER_EMAIL..."
supabase secrets set SENDER_EMAIL=no-reply@yourcvpassport.com

echo "Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=https://djehzlzombqrzzuchcef.supabase.co

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWh6bHpvbWJxcnp6dWNoY2VmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYwMDY0NCwiZXhwIjoyMDc2MTc2NjQ0fQ.hOg6MReR79s7UmrTtTa05etDbF3kdbDC3fjb5ndoLwg

echo ""
echo "🎉 Signup function deployed and configured!"
echo ""
echo "✅ Users should now be able to register via the app"
echo ""
