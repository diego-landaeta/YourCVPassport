#!/bin/bash

# ============================================================================
# Supabase Edge Functions Deployment Script
# ============================================================================
# Description: Deploy all verification edge functions to Supabase
# Usage:
#   export BREVO_API_KEY=...             # API key v3 de Brevo (nunca en el repo)
#   export SENDER_EMAIL=no-reply@yourcvpassport.com   # opcional; si no se exporta no se toca el secreto
#   ./deploy.sh
#
# Los correos salen por Brevo (_shared/email.ts); ver EMAIL.md.
#
# Verificación de JWT en el gateway (auditoría 2026-10-05, U4):
# send-verification-email, verify-email-code, send-verification-sms,
# verify-phone-code y company-registration-email exigen sesión y se despliegan
# SIN --no-verify-jwt. send-magic-link y send-password-reset son públicas por
# diseño (login / recuperación) y lo mantienen.
# ============================================================================

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Correo: BREVO_API_KEY es obligatoria (sin imprimir su valor)
if [ -z "${BREVO_API_KEY:-}" ]; then
    echo "❌ Error: falta la variable de entorno BREVO_API_KEY"
    echo "Defínela antes de ejecutar el script:"
    echo "  export BREVO_API_KEY=<tu API key de Brevo>"
    exit 1
fi

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

# Secretos de correo antes de desplegar, para que las funciones nuevas ya los
# usen. Por fichero temporal (permisos 600): los valores no aparecen en la lista
# de procesos ni en el historial del shell. SENDER_EMAIL solo se escribe si se
# ha exportado, para no pisar un remitente ya guardado en Supabase.
echo "📝 Setting email secrets (BREVO_API_KEY${SENDER_EMAIL:+, SENDER_EMAIL})..."
env_file="$(mktemp)"
chmod 600 "$env_file"
trap 'rm -f "$env_file"' EXIT
{
    printf 'BREVO_API_KEY=%s\n' "$BREVO_API_KEY"
    if [ -n "${SENDER_EMAIL:-}" ]; then
        printf 'SENDER_EMAIL=%s\n' "$SENDER_EMAIL"
    fi
} > "$env_file"
if ! supabase secrets set --env-file "$env_file" > /dev/null; then
    echo "❌ Failed to set email secrets"
    exit 1
fi
echo "✅ Email secrets set"
echo ""

# Deploy send-verification-email
echo "📧 Deploying send-verification-email..."
supabase functions deploy send-verification-email
if [ $? -eq 0 ]; then
    echo "✅ send-verification-email deployed successfully"
else
    echo "❌ Failed to deploy send-verification-email"
    exit 1
fi
echo ""

# Deploy verify-email-code
echo "✉️  Deploying verify-email-code..."
supabase functions deploy verify-email-code
if [ $? -eq 0 ]; then
    echo "✅ verify-email-code deployed successfully"
else
    echo "❌ Failed to deploy verify-email-code"
    exit 1
fi
echo ""

# Deploy send-verification-sms
echo "📱 Deploying send-verification-sms..."
supabase functions deploy send-verification-sms
if [ $? -eq 0 ]; then
    echo "✅ send-verification-sms deployed successfully"
else
    echo "❌ Failed to deploy send-verification-sms"
    exit 1
fi
echo ""

# Deploy verify-phone-code
echo "🔢 Deploying verify-phone-code..."
supabase functions deploy verify-phone-code
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

# Deploy company-registration-email
echo "🏢 Deploying company-registration-email..."
supabase functions deploy company-registration-email
if [ $? -eq 0 ]; then
    echo "✅ company-registration-email deployed successfully"
else
    echo "❌ Failed to deploy company-registration-email"
    exit 1
fi
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "⚠️  IMPORTANT: Don't forget to set environment variables in Supabase Dashboard:"
echo "   - TWILIO_ACCOUNT_SID"
echo "   - TWILIO_AUTH_TOKEN"
echo "   - TWILIO_PHONE_NUMBER"
echo ""
echo "📝 To set env vars, go to:"
echo "   Project Settings > Edge Functions > Add new secret"
echo ""
