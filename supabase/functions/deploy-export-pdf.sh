#!/bin/bash

# Deploy Export PDF Edge Function
# Script para desplegar la función de exportación de PDFs

set -e

echo "🚀 Deploying export-pdf Edge Function..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase. Please login:${NC}"
    supabase login
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked. Please link your project:${NC}"
    echo "supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo -e "${YELLOW}📦 Building function...${NC}"

# Deploy the function
echo -e "${YELLOW}🚢 Deploying to Supabase...${NC}"
supabase functions deploy export-pdf --no-verify-jwt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Export PDF function deployed successfully!${NC}"
    echo ""
    echo -e "${GREEN}Endpoint:${NC} https://YOUR_PROJECT.supabase.co/functions/v1/export-pdf"
    echo ""
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Test the function with curl or Postman"
    echo "2. Enable it in your frontend using useATSExport hook"
    echo "3. Monitor logs: supabase functions logs export-pdf"
    echo ""
    echo -e "${YELLOW}⚠️  Note:${NC} The function currently returns a placeholder PDF."
    echo "For production, integrate a PDF service (PDFShift, DocRaptor, etc.)"
else
    echo -e "${RED}❌ Deployment failed. Check the error above.${NC}"
    exit 1
fi
