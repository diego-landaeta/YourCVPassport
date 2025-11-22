# Deploy Export PDF Edge Function
# PowerShell script para Windows

Write-Host "🚀 Deploying export-pdf Edge Function..." -ForegroundColor Cyan

# Check if supabase CLI is installed
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCmd) {
    Write-Host "❌ Supabase CLI not found. Installing..." -ForegroundColor Red
    npm install -g supabase
}

# Check if logged in
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Supabase. Please login:" -ForegroundColor Yellow
    supabase login
}

# Check if project is linked
if (-not (Test-Path ".supabase\config.toml")) {
    Write-Host "⚠️  Project not linked. Please link your project:" -ForegroundColor Yellow
    Write-Host "supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Building function..." -ForegroundColor Yellow

# Deploy the function
Write-Host "🚢 Deploying to Supabase..." -ForegroundColor Yellow
supabase functions deploy export-pdf --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Export PDF function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Endpoint: " -NoNewline -ForegroundColor Green
    Write-Host "https://YOUR_PROJECT.supabase.co/functions/v1/export-pdf"
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test the function with curl or Postman"
    Write-Host "2. Enable it in your frontend using useATSExport hook"
    Write-Host "3. Monitor logs: supabase functions logs export-pdf"
    Write-Host ""
    Write-Host "⚠️  Note: " -NoNewline -ForegroundColor Yellow
    Write-Host "The function currently returns a placeholder PDF."
    Write-Host "For production, integrate a PDF service (PDFShift, DocRaptor, etc.)"
} else {
    Write-Host "`n❌ Deployment failed. Check the error above." -ForegroundColor Red
    exit 1
}
