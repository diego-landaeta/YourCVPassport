# Setup Script for Edge Function Tests
# This script helps you set the required environment variables

Write-Host "Edge Function Tests - Environment Setup" -ForegroundColor Cyan
Write-Host ""

# Check if variables are already set
if ($env:VITE_SUPABASE_URL -and $env:VITE_SUPABASE_ANON_KEY) {
    Write-Host "Environment variables are already set:" -ForegroundColor Green
    Write-Host "   VITE_SUPABASE_URL: $env:VITE_SUPABASE_URL" -ForegroundColor Gray
    Write-Host "   VITE_SUPABASE_ANON_KEY: $($env:VITE_SUPABASE_ANON_KEY.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Do you want to update them? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Host "Using existing environment variables" -ForegroundColor Green
        exit 0
    }
}

Write-Host "Please enter your Supabase credentials:" -ForegroundColor Yellow
Write-Host "   (You can find these in your Supabase project dashboard -> Settings -> API)" -ForegroundColor Gray
Write-Host ""

# Get Supabase URL
$supabaseUrl = Read-Host "Enter your SUPABASE_URL (e.g., https://xxxxx.supabase.co)"
if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
    Write-Host "Error: SUPABASE_URL cannot be empty" -ForegroundColor Red
    exit 1
}

# Get Supabase Anon Key
$supabaseKey = Read-Host "Enter your SUPABASE_ANON_KEY"
if ([string]::IsNullOrWhiteSpace($supabaseKey)) {
    Write-Host "Error: SUPABASE_ANON_KEY cannot be empty" -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:VITE_SUPABASE_URL = $supabaseUrl
$env:VITE_SUPABASE_ANON_KEY = $supabaseKey

Write-Host ""
Write-Host "Environment variables set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Current values:" -ForegroundColor Cyan
Write-Host "   VITE_SUPABASE_URL: $env:VITE_SUPABASE_URL" -ForegroundColor Gray
Write-Host "   VITE_SUPABASE_ANON_KEY: $($env:VITE_SUPABASE_ANON_KEY.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""
Write-Host "You can now run the tests:" -ForegroundColor Cyan
Write-Host "   npm test tests/edge-functions/" -ForegroundColor White
Write-Host ""
Write-Host "Note: These variables are only set for this PowerShell session." -ForegroundColor Yellow
Write-Host "   You will need to run this script again if you open a new terminal." -ForegroundColor Yellow
