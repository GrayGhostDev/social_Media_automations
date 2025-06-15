#!/bin/bash
# Pre-deployment checklist script for ViralHub

echo "🚀 ViralHub Pre-Deployment Checklist"
echo "===================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

FAILED_CHECKS=0

echo "A. Environment & Secrets Check"
echo "------------------------------"

# Check if .env exists
if [ -f ".env" ]; then
    check 0 ".env file exists"
    
    # Check for required new keys
    REQUIRED_KEYS=(
        "VEO3_URL"
        "VEO3_KEY"
        "GROQ_API_KEY"
        "SERPAPI_KEY"
        "RITETAG_KEY"
        "BUZZSUMO_KEY"
        "GA4_PROPERTY_ID"
        "SHEETS_ID"
        "N8N_ENCRYPTION_KEY"
        "CLAUDE_KEY"
        "PPLX_URL"
        "PPLX_KEY"
        "QUSO_KEY"
    )
    
    for key in "${REQUIRED_KEYS[@]}"; do
        if grep -q "^${key}=" .env && ! grep -q "^${key}=your-" .env; then
            check 0 "$key is configured"
        else
            check 1 "$key is missing or not configured"
        fi
    done
else
    check 1 ".env file exists"
    echo -e "${YELLOW}  → Run: cp .env.example .env${NC}"
fi

echo ""
echo "B. Google Sheets Setup"
echo "---------------------"
if [ -n "$SHEETS_ID" ]; then
    check 0 "SHEETS_ID is set"
    echo -e "${YELLOW}  → Ensure sheet has tabs: Content_Prompts, Hooks_Templates, Style_Guidelines, Compliance_Rules, Input_Templates${NC}"
    echo -e "${YELLOW}  → Share sheet with service account email${NC}"
else
    check 1 "SHEETS_ID environment variable"
fi

echo ""
echo "C. Custom Code Assets"
echo "--------------------"
CUSTOM_FUNCTIONS=(
    "custom/functions/aiRouter.js"
    "custom/functions/promptSelector.js"
    "custom/functions/viralScore.js"
    "custom/functions/deduplication.js"
    "custom/functions/smartScheduler.js"
)

for func in "${CUSTOM_FUNCTIONS[@]}"; do
    if [ -f "$func" ]; then
        check 0 "$func exists"
    else
        check 1 "$func exists"
    fi
done

echo ""
echo "D. Docker Services"
echo "-----------------"
# Check if docker-compose.yml has required services
if [ -f "docker-compose.yml" ]; then
    if grep -q "redis:" docker-compose.yml; then
        check 0 "Redis service configured"
    else
        check 1 "Redis service configured"
    fi
    
    if grep -q "EXECUTIONS_MODE=queue" docker-compose.yml; then
        check 0 "Queue mode enabled"
    else
        check 1 "Queue mode enabled"
    fi
else
    check 1 "docker-compose.yml exists"
fi

echo ""
echo "E. Workflow Files"
echo "----------------"
REQUIRED_WORKFLOWS=(
    "workflows/viral_hub.json"
    "workflows/content_factory.json"
    "workflows/analytics_loop.json"
    "workflows/prompt_hub_loader.json"
    "workflows/research_fetcher.json"
    "workflows/content_qc_suite.json"
    "workflows/publisher_formatter.json"
)

for wf in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ -f "$wf" ]; then
        check 0 "$wf exists"
    else
        check 1 "$wf exists"
    fi
done

echo ""
echo "F. Database Scripts"
echo "------------------"
if [ -f "scripts/init-database.sql" ]; then
    check 0 "Database schema script exists"
else
    check 1 "Database schema script exists"
fi

if [ -f "scripts/init-analytics-tables.sql" ]; then
    check 0 "Analytics tables script exists"
else
    check 1 "Analytics tables script exists"
fi

echo ""
echo "Summary"
echo "-------"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start services: docker compose up -d"
    echo "2. Initialize database: docker compose exec postgres psql -U n8n_user -d n8n_db -f /scripts/init-database.sql"
    echo "3. Run Prompt Hub Loader manually in n8n"
    echo "4. Execute smoke tests"
else
    echo -e "${RED}❌ Failed $FAILED_CHECKS checks. Please fix issues above.${NC}"
    echo ""
    echo "Quick fixes:"
    echo "- Missing .env: cp .env.example .env && edit .env"
    echo "- Missing workflows: Ensure all JSON files are in workflows/"
    echo "- Redis not configured: Check docker-compose.yml has redis service"
fi

echo ""
echo "For detailed instructions, see GAP_ANALYSIS.md"