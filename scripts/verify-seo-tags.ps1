# Script para verificar los meta tags de perfiles
# Uso: .\scripts\verify-seo-tags.ps1 emily-harper

param(
    [string]$Slug = "emily-harper"
)

$BaseUrl = "https://yourcvpassport.com"
$ProfileUrl = "$BaseUrl/cv/$Slug"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🔍 Verificando SEO Meta Tags para: $Slug" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Verificando HTML crudo (lo que los bots ven):" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $ProfileUrl -UseBasicParsing
    $html = $response.Content

    # Extract title
    if ($html -match '<title>(.*?)</title>') {
        Write-Host "Title: $($matches[1])" -ForegroundColor Green
    }

    # Extract description
    if ($html -match '<meta name="description" content="(.*?)"') {
        Write-Host "Description: $($matches[1])" -ForegroundColor Green
    }

    # Extract OG tags
    if ($html -match '<meta property="og:title" content="(.*?)"') {
        Write-Host "OG Title: $($matches[1])" -ForegroundColor Green
    }

    if ($html -match '<meta property="og:description" content="(.*?)"') {
        Write-Host "OG Description: $($matches[1])" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error al obtener la página: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

Write-Host "2️⃣  Verificando con User-Agent de Googlebot:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Gray

try {
    $headers = @{
        "User-Agent" = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }
    $response = Invoke-WebRequest -Uri $ProfileUrl -Headers $headers -UseBasicParsing
    $html = $response.Content

    if ($html -match '<title>(.*?)</title>') {
        Write-Host "Googlebot ve Title: $($matches[1])" -ForegroundColor Green
    }

    if ($html -match '<meta name="description" content="(.*?)"') {
        Write-Host "Googlebot ve Description: $($matches[1])" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error al simular Googlebot: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host ""

Write-Host "3️⃣  Análisis:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Gray

# Verificar si los meta tags son específicos del perfil
$isGeneric = $false
if ($html -match "Professional CV Platform" -or $html -match "Create, verify and share") {
    $isGeneric = $true
    Write-Host "⚠️  PROBLEMA DETECTADO: Los meta tags son GENÉRICOS" -ForegroundColor Red
    Write-Host "    Los bots de SEO no ven información específica del perfil $Slug" -ForegroundColor Red
} else {
    Write-Host "✅ Los meta tags parecen ser específicos del perfil" -ForegroundColor Green
    Write-Host "    (Verifica manualmente si la información es correcta)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host ""

Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Gray

if ($isGeneric) {
    Write-Host "❌ Se detectaron meta tags genéricos. Para solucionar esto:" -ForegroundColor Yellow
    Write-Host "   1. Lee: docs\SEO_PROFILES_FIX.md" -ForegroundColor White
    Write-Host "   2. Implementa prerendering (Prerender.io recomendado)" -ForegroundColor White
    Write-Host "   3. O implementa SSR con Next.js/Remix" -ForegroundColor White
} else {
    Write-Host "✅ Verifica con herramientas online para confirmar:" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔗 Herramientas online para verificar:" -ForegroundColor Cyan
Write-Host "  • Facebook: https://developers.facebook.com/tools/debug/" -ForegroundColor White
Write-Host "  • Twitter: https://cards-dev.twitter.com/validator" -ForegroundColor White
Write-Host "  • LinkedIn: https://www.linkedin.com/post-inspector/" -ForegroundColor White
Write-Host "  • Google: https://search.google.com/test/rich-results" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentación completa: docs\SEO_PROFILES_FIX.md" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
