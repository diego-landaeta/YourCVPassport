#!/bin/bash

# ============================================================================
# Deploy Signup Edge Function
# ============================================================================
#
# Este script NO contiene secretos: los lee de variables de entorno.
#
# Uso (los valores salen de tu gestor de contraseñas / Dashboard de Resend):
#   export RESEND_API_KEY=...            # API key de Resend (rotada)
#   export SENDER_EMAIL=no-reply@yourcvpassport.com
#   ./deploy-signup.sh
#
# SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY NO se configuran aquí: Supabase las
# inyecta automáticamente en todas las Edge Functions (y la CLI no permite
# `secrets set` de nombres con prefijo SUPABASE_).
#
# Opcional: CORS_EXTRA_ORIGINS (orígenes extra separados por comas, p. ej. un
# staging) para supabase/functions/_shared/cors.ts.

set -u

echo "🚀 Deploying signup Edge Function..."
echo ""

# Check required environment variables (sin imprimir sus valores)
missing=0
for var in RESEND_API_KEY SENDER_EMAIL; do
    if [ -z "${!var:-}" ]; then
        echo "❌ Error: falta la variable de entorno $var"
        missing=1
    fi
done
if [ "$missing" -ne 0 ]; then
    echo ""
    echo "Defínelas antes de ejecutar el script, por ejemplo:"
    echo "  export RESEND_API_KEY=<tu API key de Resend>"
    echo "  export SENDER_EMAIL=no-reply@yourcvpassport.com"
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

# Set secrets first so the new deployment already uses them.
# Se pasan por un fichero temporal (permisos 600) para que los valores no
# aparezcan en la lista de procesos ni en el historial del shell.
echo "📝 Setting secrets (RESEND_API_KEY, SENDER_EMAIL)..."
env_file="$(mktemp)"
chmod 600 "$env_file"
trap 'rm -f "$env_file"' EXIT
{
    printf 'RESEND_API_KEY=%s\n' "$RESEND_API_KEY"
    printf 'SENDER_EMAIL=%s\n' "$SENDER_EMAIL"
    if [ -n "${CORS_EXTRA_ORIGINS:-}" ]; then
        printf 'CORS_EXTRA_ORIGINS=%s\n' "$CORS_EXTRA_ORIGINS"
    fi
} > "$env_file"

if ! supabase secrets set --env-file "$env_file" > /dev/null; then
    echo "❌ Failed to set secrets"
    exit 1
fi
echo "✅ Secrets set"
echo ""

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
echo "🎉 Signup function deployed and configured!"
echo ""
echo "✅ Users should now be able to register via the app"
echo ""
