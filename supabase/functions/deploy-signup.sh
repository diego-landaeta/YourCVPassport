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
supabase secrets set RESEND_API_KEY="${RESEND_API_KEY:?Pon RESEND_API_KEY en el entorno}"

echo "Setting SENDER_EMAIL..."
supabase secrets set SENDER_EMAIL=no-reply@yourcvpassport.com

echo "Setting SUPABASE_URL..."
supabase secrets set SUPABASE_URL=https://djehzlzombqrzzuchcef.supabase.co

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?Pon SUPABASE_SERVICE_ROLE_KEY en el entorno}"

echo ""
echo "🎉 Signup function deployed and configured!"
echo ""
echo "✅ Users should now be able to register via the app"
echo ""
