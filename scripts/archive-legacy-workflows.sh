#!/bin/bash
# Archive legacy workflows to prevent duplicate cron triggers

echo "📦 Archiving legacy workflows..."

# Create archive directory
ARCHIVE_DIR="workflows/archive_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$ARCHIVE_DIR"

# List of legacy workflows to archive
LEGACY_WORKFLOWS=(
    "mini_ai_publisher.json"
    "production_viral_publisher.json"
    "viral_content_mcp_workflow.json"
    "viral_content_workflow.json"
)

# Archive each legacy workflow
ARCHIVED_COUNT=0
for workflow in "${LEGACY_WORKFLOWS[@]}"; do
    if [ -f "workflows/$workflow" ]; then
        echo "Archiving: $workflow"
        mv "workflows/$workflow" "$ARCHIVE_DIR/"
        ARCHIVED_COUNT=$((ARCHIVED_COUNT + 1))
    else
        echo "Not found: $workflow (skipping)"
    fi
done

# Create archive README
cat > "$ARCHIVE_DIR/README.md" << EOF
# Archived Legacy Workflows

These workflows were archived on $(date +"%Y-%m-%d %H:%M:%S") to prevent duplicate cron triggers.

## Archived Files:
$(ls -1 "$ARCHIVE_DIR" | grep -v README.md | sed 's/^/- /')

## Active Workflow:
The new unified workflow system uses **ViralHub** as the root orchestrator with the following sub-workflows:
- ViralHub (root)
- ContentFactory
- ContentQCSuite
- PublisherFormatter
- ResearchFetcher
- AnalyticsLoop
- PromptHubLoader

## To Restore:
If you need to restore any of these workflows:
\`\`\`bash
cp $ARCHIVE_DIR/workflow_name.json ../
\`\`\`

**WARNING**: Restoring these may cause duplicate cron executions!
EOF

echo ""
echo "✅ Archived $ARCHIVED_COUNT legacy workflows to: $ARCHIVE_DIR"
echo ""
echo "Active workflows remaining:"
ls -1 workflows/*.json | grep -v archive | sed 's/workflows\//- /'
echo ""
echo "⚠️  IMPORTANT: Remove these workflows from n8n UI if they were already imported!"