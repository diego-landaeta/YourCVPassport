# ============================================================================
# Supabase Edge Functions Deployment Script (Windows PowerShell)
# ============================================================================
# Description: Deploy all verification edge functions to Supabase
# Usage: .\deploy.ps1
# ============================================================================

Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    supabase projects list 2>&1 | Out-Null
} catch {
    Write-Host "❌ Error: Not logged in to Supabase" -ForegroundColor Red
    Write-Host "Run: supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy send-verification-email
Write-Host "📧 Deploying send-verification-email..." -ForegroundColor Yellow
supabase functions deploy send-verification-email --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-verification-email deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-verification-email" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy verify-email-code
Write-Host "✉️  Deploying verify-email-code..." -ForegroundColor Yellow
supabase functions deploy verify-email-code --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ verify-email-code deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy verify-email-code" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy send-verification-sms
Write-Host "📱 Deploying send-verification-sms..." -ForegroundColor Yellow
supabase functions deploy send-verification-sms --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-verification-sms deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-verification-sms" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy verify-phone-code
Write-Host "🔢 Deploying verify-phone-code..." -ForegroundColor Yellow
supabase functions deploy verify-phone-code --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ verify-phone-code deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy verify-phone-code" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy send-password-reset
Write-Host "🔐 Deploying send-password-reset..." -ForegroundColor Yellow
supabase functions deploy send-password-reset --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-password-reset deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-password-reset" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy send-email-confirmation
Write-Host "📬 Deploying send-email-confirmation..." -ForegroundColor Yellow
supabase functions deploy send-email-confirmation --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-email-confirmation deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-email-confirmation" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Deploy send-magic-link
Write-Host "✨ Deploying send-magic-link..." -ForegroundColor Yellow
supabase functions deploy send-magic-link --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-magic-link deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy send-magic-link" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "🎉 All functions deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Don't forget to set environment variables in Supabase Dashboard:" -ForegroundColor Yellow
Write-Host "   - RESEND_API_KEY" -ForegroundColor Cyan
Write-Host "   - TWILIO_ACCOUNT_SID" -ForegroundColor Cyan
Write-Host "   - TWILIO_AUTH_TOKEN" -ForegroundColor Cyan
Write-Host "   - TWILIO_PHONE_NUMBER" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 To set env vars, go to:" -ForegroundColor Yellow
Write-Host "   Project Settings > Edge Functions > Add new secret" -ForegroundColor Cyan
Write-Host ""
