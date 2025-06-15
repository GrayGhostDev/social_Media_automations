# n8n Cloud Migration Guide for ViralHub

## Overview

This guide helps you migrate ViralHub from self-hosted n8n to n8n cloud or configure it for cloud-first deployment.

## Configuration

Your n8n cloud instance is configured with:
- **Instance URL**: https://grayghostdata.app.n8n.cloud
- **Project ID**: 57VsYz98WIBHUxJM
- **API Access**: Enabled with API key

## Key Differences: Self-Hosted vs Cloud

### 1. Custom Nodes
- **Self-hosted**: ✅ Custom TypeScript nodes supported
- **Cloud**: ❌ Not supported - use Function nodes instead

### 2. File System Access
- **Self-hosted**: ✅ Direct file system access
- **Cloud**: ❌ Limited - use cloud storage (S3, GCS)

### 3. Environment Variables
- **Self-hosted**: ✅ Process environment variables
- **Cloud**: ⚠️ Use n8n Variables (Settings > Variables)

### 4. Webhooks
- **Self-hosted**: Custom domain/ports
- **Cloud**: Must use n8n cloud domain

## Migration Steps

### 1. Configure Environment

Your `.env` file already contains:
```env
N8N_API_KEY=eyJhbGc...
N8N_USER=Gray_Ghost
N8N_WEBHOOK_URL=https://grayghostdata.app.n8n.cloud/webhook
N8N_API_URL=https://grayghostdata.app.n8n.cloud
N8N_BASE_URL=https://grayghostdata.app.n8n.cloud
N8N_PROJECT_ID=57VsYz98WIBHUxJM
```

### 2. Convert Custom Nodes to Functions

#### ViralityPredictor Node → Function Node

Replace custom node with Function node:

```javascript
// In Function node
const viralScore = {
  calculateViralScore: function(content, options) {
    // Paste viralScore.js content here
    const weights = options.weights || {
      engagement: 0.3,
      recency: 0.2,
      relevance: 0.25,
      authority: 0.25
    };
    
    // ML-based scoring logic
    let score = 0;
    // ... scoring implementation
    
    return {
      score: Math.round(score),
      isViral: score >= 60,
      factors: factors,
      recommendation: recommendation
    };
  }
};

// Use the function
const result = viralScore.calculateViralScore(
  $json.content,
  { platform: $json.platform }
);

return { json: { ...result, ...$json } };
```

### 3. Update Webhook URLs

All webhook triggers must use n8n cloud URLs:

```yaml
# Old (self-hosted)
http://localhost:5678/webhook/viral-content

# New (cloud)
https://grayghostdata.app.n8n.cloud/webhook/viral-content
```

### 4. Configure Variables in n8n UI

Go to Settings > Variables and add:

| Key | Value |
|-----|-------|
| OPENAI_API_KEY | your-key |
| ANTHROPIC_API_KEY | your-key |
| GROQ_API_KEY | your-key |
| SERPAPI_KEY | your-key |
| SHEETS_ID | your-sheet-id |
| MCP_PROXY_URL | http://proxy:7990 |
| SLACK_WEBHOOK_URL | your-webhook |
| TARGET_TIMEZONE | America/New_York |

### 5. Import Workflows

Use the provided script:
```bash
./scripts/configure-n8n-cloud.sh
# Choose option 4 to import all workflows
```

### 6. Update Execute Workflow Nodes

In n8n cloud, Execute Workflow nodes reference by workflow ID, not name:

1. Import all sub-workflows first
2. Note their assigned IDs
3. Update Execute Workflow nodes in ViralHub

### 7. Database Connections

For PostgreSQL access from cloud:

#### Option 1: Cloud Database
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Configure firewall to allow n8n cloud IPs

#### Option 2: Tunnel
- Use ngrok or similar for local DB access
- Update connection strings in workflows

### 8. File Storage

Replace local file operations:

```javascript
// Old: Local file system
const fs = require('fs');
fs.writeFileSync('/data/output.json', data);

// New: Use S3
const s3Data = {
  bucket: 'viralhub-data',
  key: 'output.json',
  body: JSON.stringify(data)
};
// Use AWS S3 node to upload
```

## Testing Cloud Integration

Run the configuration script:
```bash
./scripts/configure-n8n-cloud.sh
```

Options:
1. Test webhook endpoint
2. List existing workflows
3. Export workflows
4. Import ViralHub workflows
5. Configure webhooks
6. Full connectivity test

## Hybrid Approach

You can run both self-hosted and cloud:

1. **Development**: Self-hosted with custom nodes
2. **Production**: n8n cloud for reliability

Use the API to sync workflows:
```bash
# Export from self-hosted
curl -X GET http://localhost:5678/api/v1/workflows \
  -H "X-N8N-API-KEY: $LOCAL_API_KEY" > workflows.json

# Import to cloud
curl -X POST $N8N_API_URL/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -d @workflows.json
```

## Limitations & Workarounds

### Custom Functions
Embed functions directly in Function nodes:
```javascript
// Instead of require('/custom/functions/aiRouter.js')
const aiRouter = {
  route: function(content, options) {
    // Paste entire function here
  }
};
```

### MCP Proxy
- Not directly accessible from cloud
- Use HTTP Request nodes with full URLs
- Or expose MCP proxy with ngrok

### Queue Mode
- Cloud has built-in scaling
- No need for Redis/queue configuration
- Remove queue-specific settings

## Monitoring

Use n8n cloud's built-in monitoring:
- Execution history
- Error tracking
- Performance metrics

Access via: https://grayghostdata.app.n8n.cloud

## Support

- n8n Cloud Docs: https://docs.n8n.io/hosting/
- API Reference: https://docs.n8n.io/api/
- Community: https://community.n8n.io/