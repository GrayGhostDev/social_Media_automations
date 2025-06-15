# ViralHub Production Deployment Guide

## ✅ Core Functionality Completed

All core functionality tasks have been completed. The system is now ready for production deployment.

### 🎯 Completed Tasks

1. **Package.json Updated** ✅
   - All required dependencies added
   - TensorFlow.js for ML models
   - Natural language processing libraries
   - Utility libraries (lodash, moment, axios, etc.)

2. **RabbitMQ Configuration** ✅
   - Script: `scripts/configure-rabbitmq.sh`
   - Dead-letter exchange configured
   - Retry logic with 5 max retries
   - Queue TTL and priority settings

3. **Video Binary Handling** ✅
   - Script: `scripts/fix-video-binary-handling.js`
   - Ensures proper binary propagation
   - Fixes Execute Workflow nodes

4. **Workflow ID Verification** ✅
   - Script: `scripts/verify-workflow-ids.js`
   - Validates all sub-workflow references
   - Generates import order guide

5. **Production Security** ✅
   - Script: `scripts/configure-production.sh`
   - Auto-generates N8N_ENCRYPTION_KEY
   - Configures basic auth
   - SSL/TLS support via nginx

6. **Legacy Workflow Archival** ✅
   - Script: `scripts/archive-legacy-workflows.sh`
   - Prevents duplicate cron triggers
   - Maintains clean workflow directory

## 🚀 Quick Start Production Deployment

### 1. Environment Setup
```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with all API keys and credentials

# Generate encryption key (if not done)
./scripts/configure-production.sh
```

### 2. Configure Services
```bash
# Start services
docker compose up -d

# Configure RabbitMQ
./scripts/configure-rabbitmq.sh

# Initialize databases
npm run init:db
```

### 3. Deploy Workflows
```bash
# Verify workflow IDs
./scripts/verify-workflow-ids.js

# Archive legacy workflows
./scripts/archive-legacy-workflows.sh

# Fix video binary handling
./scripts/fix-video-binary-handling.js
```

### 4. Import Workflows (in order)
1. prompt_hub_loader.json
2. ai_video_veo3.json
3. research_fetcher.json
4. content_factory.json
5. content_qc_suite.json
6. publisher_formatter.json
7. analytics_loop.json
8. viral_hub.json (import last!)

### 5. Post-Import Steps
```bash
# Run Prompt Hub Loader manually first
# This populates global.prompts cache

# Activate ViralHub workflow
# Set active=true in n8n UI
```

## 📊 Production Monitoring

### Health Check
```bash
./scripts/monitor-production.sh
```

### View Logs
```bash
docker compose logs -f n8n
docker compose logs -f proxy
docker compose logs -f rabbitmq
```

### Backup
```bash
./scripts/backup-production.sh
```

## 🔐 Security Checklist

- [x] N8N_ENCRYPTION_KEY generated
- [ ] Basic auth credentials changed
- [ ] SSL certificates installed
- [ ] Firewall rules configured
- [ ] API keys rotated from defaults

## 📈 Performance Tuning

### Queue Workers
```bash
# Scale workers (in docker-compose.production.yml)
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --scale n8n-worker=3
```

### Resource Limits
Already configured in docker-compose.production.yml:
- n8n: 2 CPU, 4GB RAM
- Workers: 1 CPU, 2GB RAM each
- PostgreSQL: 1 CPU, 1GB RAM
- Redis: 0.5 CPU, 512MB RAM

## 🛠️ Troubleshooting

### Common Issues

1. **Workflows not found**
   - Run: `./scripts/verify-workflow-ids.js`
   - Check workflow IDs match exactly

2. **Queue not processing**
   - Verify Redis is running
   - Check EXECUTIONS_MODE=queue in .env

3. **MCP proxy errors**
   - Check proxy health: `curl http://localhost:7990/healthz`
   - Verify MCP_PROXY_KEY is set

4. **Video upload failures**
   - Run: `./scripts/fix-video-binary-handling.js`
   - Check binary data in workflow executions

## 🎉 Success Criteria

Your ViralHub is ready when:
- [ ] All services show as "Up" in `docker compose ps`
- [ ] PromptHubLoader has run successfully
- [ ] Test content flows through entire pipeline
- [ ] Analytics are being collected
- [ ] No errors in last 24 hours

## 📞 Support

- GitHub Issues: https://github.com/GrayGhostDev/social_Media_automations
- Documentation: See GAP_ANALYSIS.md for detailed requirements
- Logs: Check /logs directory for detailed debugging