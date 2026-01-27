#!/bin/bash

# Script para verificar los meta tags de perfiles
# Uso: ./scripts/verify-seo-tags.sh [slug-del-perfil]

SLUG=${1:-"emily-harper"}
BASE_URL="https://yourcvpassport.com"

echo "=================================================="
echo "🔍 Verificando SEO Meta Tags para: $SLUG"
echo "=================================================="
echo ""

echo "1️⃣  Verificando HTML crudo (lo que los bots ven):"
echo "--------------------------------------------------"
curl -s "$BASE_URL/cv/$SLUG" | grep -E '<title>|<meta name="description"|<meta property="og:title"|<meta property="og:description"' | head -n 10
echo ""
echo ""

echo "2️⃣  Verificando con User-Agent de Googlebot:"
echo "--------------------------------------------------"
curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "$BASE_URL/cv/$SLUG" | grep -E '<title>|<meta name="description"' | head -n 5
echo ""
echo ""

echo "3️⃣  Verificando con User-Agent de Facebook:"
echo "--------------------------------------------------"
curl -s -A "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" "$BASE_URL/cv/$SLUG" | grep -E '<title>|<meta property="og:' | head -n 10
echo ""
echo ""

echo "📋 Próximos pasos:"
echo "--------------------------------------------------"
echo "✅ Si ves meta tags ESPECÍFICOS del perfil $SLUG, ¡funciona!"
echo "❌ Si ves meta tags GENÉRICOS, necesitas implementar prerendering"
echo ""
echo "🔗 Herramientas online para verificar:"
echo "  • Facebook: https://developers.facebook.com/tools/debug/"
echo "  • Twitter: https://cards-dev.twitter.com/validator"
echo "  • LinkedIn: https://www.linkedin.com/post-inspector/"
echo "  • Google: https://search.google.com/test/rich-results"
echo ""
echo "📖 Lee: docs/SEO_PROFILES_FIX.md para soluciones completas"
echo "=================================================="
