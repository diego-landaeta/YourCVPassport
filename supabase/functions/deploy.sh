#!/bin/bash

# ============================================================================
# Supabase Edge Functions Deployment Script
# ============================================================================
# Description: Deploy all verification edge functions to Supabase
# Usage: ./deploy.sh
# ============================================================================

echo "🚀 Deploying Supabase Edge Functions..."
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

# Deploy send-verification-email
echo "📧 Deploying send-verification-email..."
supabase functions deploy send-verification-email --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ send-verification-email deployed successfully"
else
    echo "❌ Failed to deploy send-verification-email"
    exit 1
fi
echo ""

# Deploy verify-email-code
echo "✉️  Deploying verify-email-code..."
supabase functions deploy verify-email-code --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ verify-email-code deployed successfully"
else
    echo "❌ Failed to deploy verify-email-code"
    exit 1
fi
echo ""

# Deploy send-verification-sms
echo "📱 Deploying send-verification-sms..."
supabase functions deploy send-verification-sms --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ send-verification-sms deployed successfully"
else
    echo "❌ Failed to deploy send-verification-sms"
    exit 1
fi
echo ""

# Deploy verify-phone-code
echo "🔢 Deploying verify-phone-code..."
supabase functions deploy verify-phone-code --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ verify-phone-code deployed successfully"
else
    echo "❌ Failed to deploy verify-phone-code"
    exit 1
fi
echo ""

# Deploy send-password-reset
echo "🔐 Deploying send-password-reset..."
supabase functions deploy send-password-reset --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ send-password-reset deployed successfully"
else
    echo "❌ Failed to deploy send-password-reset"
    exit 1
fi
echo ""

# Deploy send-email-confirmation
echo "📬 Deploying send-email-confirmation..."
supabase functions deploy send-email-confirmation --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ send-email-confirmation deployed successfully"
else
    echo "❌ Failed to deploy send-email-confirmation"
    exit 1
fi
echo ""

# Deploy send-magic-link
echo "✨ Deploying send-magic-link..."
supabase functions deploy send-magic-link --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ send-magic-link deployed successfully"
else
    echo "❌ Failed to deploy send-magic-link"
    exit 1
fi
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: Don't forget to set environment variables in Supabase Dashboard:"
echo "   - RESEND_API_KEY"
echo "   - TWILIO_ACCOUNT_SID"
echo "   - TWILIO_AUTH_TOKEN"
echo "   - TWILIO_PHONE_NUMBER"
echo ""
echo "📝 To set env vars, go to:"
echo "   Project Settings > Edge Functions > Add new secret"
echo ""
