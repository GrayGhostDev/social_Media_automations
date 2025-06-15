#!/bin/bash
# Configure n8n cloud integration for ViralHub

echo "☁️  n8n Cloud Configuration Helper"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Source environment variables
if [ -f ".env" ]; then
    source .env
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Function to test n8n API connection
test_n8n_api() {
    echo -e "${BLUE}Testing n8n API connection...${NC}"
    
    if [ -z "$N8N_API_KEY" ] || [ "$N8N_API_KEY" = "your-n8n-api-key-here" ]; then
        echo -e "${RED}❌ N8N_API_KEY is not configured!${NC}"
        return 1
    fi
    
    # Test API connection
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_API_URL/api/v1/workflows")
    
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ n8n API connection successful!${NC}"
        return 0
    else
        echo -e "${RED}❌ n8n API connection failed (HTTP $RESPONSE)${NC}"
        return 1
    fi
}

# Function to list workflows
list_workflows() {
    echo -e "${BLUE}Fetching workflows from n8n cloud...${NC}"
    
    curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_API_URL/api/v1/workflows" | jq -r '.data[] | "\(.id) - \(.name)"'
}

# Function to test webhook
test_webhook() {
    echo -e "${BLUE}Testing webhook endpoint...${NC}"
    
    # Create test webhook
    TEST_DATA='{"test": true, "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$TEST_DATA" \
        "$N8N_WEBHOOK_URL/test")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
        echo -e "${GREEN}✅ Webhook endpoint is reachable${NC}"
        if [ "$RESPONSE" = "404" ]; then
            echo -e "${YELLOW}   Note: No 'test' webhook configured yet${NC}"
        fi
    else
        echo -e "${RED}❌ Webhook endpoint unreachable (HTTP $RESPONSE)${NC}"
    fi
}

# Function to export workflow
export_workflow() {
    local WORKFLOW_ID=$1
    local OUTPUT_FILE=$2
    
    echo -e "${BLUE}Exporting workflow $WORKFLOW_ID...${NC}"
    
    curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
        "$N8N_API_URL/api/v1/workflows/$WORKFLOW_ID" \
        -o "$OUTPUT_FILE"
    
    if [ -f "$OUTPUT_FILE" ]; then
        echo -e "${GREEN}✅ Workflow exported to $OUTPUT_FILE${NC}"
    else
        echo -e "${RED}❌ Failed to export workflow${NC}"
    fi
}

# Function to import workflow
import_workflow() {
    local WORKFLOW_FILE=$1
    
    echo -e "${BLUE}Importing workflow from $WORKFLOW_FILE...${NC}"
    
    if [ ! -f "$WORKFLOW_FILE" ]; then
        echo -e "${RED}❌ Workflow file not found!${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$WORKFLOW_FILE" \
        "$N8N_API_URL/api/v1/workflows")
    
    WORKFLOW_ID=$(echo "$RESPONSE" | jq -r '.id')
    
    if [ "$WORKFLOW_ID" != "null" ]; then
        echo -e "${GREEN}✅ Workflow imported successfully (ID: $WORKFLOW_ID)${NC}"
    else
        echo -e "${RED}❌ Failed to import workflow${NC}"
        echo "$RESPONSE" | jq
    fi
}

# Main menu
echo "n8n Cloud Configuration Details:"
echo "================================"
echo "API URL: $N8N_API_URL"
echo "Webhook URL: $N8N_WEBHOOK_URL"
echo "Project ID: $N8N_PROJECT_ID"
echo "User: $N8N_USER"
echo ""

# Test connection
test_n8n_api
echo ""

# Menu options
echo "What would you like to do?"
echo ""
echo "1) Test webhook endpoint"
echo "2) List existing workflows"
echo "3) Export a workflow"
echo "4) Import ViralHub workflows"
echo "5) Configure webhook URLs in workflows"
echo "6) Run full connectivity test"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        test_webhook
        ;;
    2)
        list_workflows
        ;;
    3)
        list_workflows
        echo ""
        read -p "Enter workflow ID to export: " WF_ID
        read -p "Enter output filename: " OUTPUT
        export_workflow "$WF_ID" "$OUTPUT"
        ;;
    4)
        echo ""
        echo "Importing ViralHub workflows to n8n cloud..."
        echo ""
        
        WORKFLOWS=(
            "workflows/prompt_hub_loader.json"
            "workflows/ai_video_veo3.json"
            "workflows/research_fetcher.json"
            "workflows/content_factory.json"
            "workflows/content_qc_suite.json"
            "workflows/publisher_formatter.json"
            "workflows/analytics_loop.json"
            "workflows/viral_hub.json"
        )
        
        for WF in "${WORKFLOWS[@]}"; do
            if [ -f "$WF" ]; then
                echo "Importing $(basename $WF)..."
                import_workflow "$WF"
                sleep 2
            fi
        done
        ;;
    5)
        echo ""
        echo "Webhook configuration:"
        echo "====================="
        echo ""
        echo "Use these webhook URLs in your workflows:"
        echo ""
        echo "Viral Content Trigger: $N8N_WEBHOOK_URL/viral-content"
        echo "Analytics Trigger: $N8N_WEBHOOK_URL/analytics"
        echo "Error Handler: $N8N_WEBHOOK_URL/error"
        echo ""
        echo "Update webhook nodes in n8n UI with these URLs"
        ;;
    6)
        echo ""
        echo "Running full connectivity test..."
        echo ""
        test_n8n_api
        echo ""
        test_webhook
        echo ""
        echo "Testing PostgreSQL connection..."
        docker compose exec -T postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB && \
            echo -e "${GREEN}✅ PostgreSQL is ready${NC}" || \
            echo -e "${RED}❌ PostgreSQL connection failed${NC}"
        echo ""
        echo "Testing Redis connection..."
        docker compose exec -T redis redis-cli ping | grep -q PONG && \
            echo -e "${GREEN}✅ Redis is ready${NC}" || \
            echo -e "${RED}❌ Redis connection failed${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "📝 Notes for n8n Cloud Integration:"
echo ""
echo "1. Custom nodes are not supported in n8n cloud"
echo "   - Use Function nodes instead of custom nodes"
echo "   - Custom functions can be embedded in Function nodes"
echo ""
echo "2. File system access is limited"
echo "   - Use cloud storage (S3, GCS) for file operations"
echo "   - Store data in workflow static data or external DBs"
echo ""
echo "3. Webhook URLs must use the n8n cloud domain"
echo "   - Update all webhook triggers to use $N8N_WEBHOOK_URL"
echo ""
echo "4. Environment variables"
echo "   - Set workflow variables in n8n UI under Settings > Variables"
echo "   - Don't rely on process.env in Function nodes"