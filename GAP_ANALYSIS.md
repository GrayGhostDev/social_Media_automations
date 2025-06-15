# ViralHub Production Gap Analysis

## Status: Pre-Deploy Phase
Last Updated: 2025-01-15

## Critical Path Items (Pre-Deploy)

### A. Environment & Secrets ⚠️
- [ ] 1. Populate .env with new keys:
  - [ ] VEO3_URL, VEO3_KEY
  - [ ] GROQ_API_KEY
  - [ ] SERPAPI_KEY
  - [ ] RITETAG_KEY
  - [ ] BUZZSUMO_KEY
  - [ ] GA4_PROPERTY_ID
  - [ ] SHEETS_ID
- [ ] 2. Remove duplicate GOOGLE_SHEET_ID vars
- [ ] 3. Create n8n credential records

### B. Google Sheets Prompt Matrix ⚠️
- [ ] 4. Build five-tab sheet:
  - [ ] Content_Prompts
  - [ ] Hooks_Templates
  - [ ] Style_Guidelines
  - [ ] Compliance_Rules
  - [ ] Input_Templates
- [ ] 5. Share with service account

### C. Custom Code Assets ✅
- [x] 6. Copy JS files to container:
  - [x] aiRouter.js (created)
  - [x] promptSelector.js (created)
  - [x] viralScore.js (created)
  - [x] deduplication.js (created)
  - [x] smartScheduler.js (created)
- [x] 7. Update package.json with dependencies (all deps added)

### D. Redis / Queue-mode ✅
- [x] 8. Update docker-compose.yml with Redis
- [x] 9. Add n8n-worker scale block

### E. RabbitMQ ✅
- [x] 10. Confirm RabbitMQ credentials (in docker-compose.yml)
- [x] 11. Add dead-letter exchange (configure-rabbitmq.sh created)

### F. Global Cache Initializer ✅
- [x] 12. Import Prompt Hub Loader workflow (created)

### G. Workflow IDs ✅
- [x] 13. Ensure sub-workflow IDs match (verify-workflow-ids.js created)

### H. Binary Data Propagation ✅
- [x] 14. Fix video binary handling (fix-video-binary-handling.js created)

### R. Security & Compliance ✅
- [x] 27. Enable N8N_ENCRYPTION_KEY (configure-production.sh handles this)

### S. Old Workflow Cleanup ✅
- [x] 28. Archive legacy workflows (archive-legacy-workflows.sh created)

## Development Sprint Items

### I. QC Suite Outputs
- [ ] 15. Confirm retry flag logic
- [ ] 16. Add failure branch timeout

### J. Scheduling Logic ✅
- [x] 17. Add negative delay protection (implemented)

### K. Analytics Loop
- [x] 18. Build AnalyticsLoop workflow

### L. Fallback Discovery ✅
- [x] 19. Add fallback path on health check fail (implemented)

### M. Webhook for Veo
- [ ] 20. Create Veo webhook credential

## Backlog Items

### N. Rate-limit / Cost Guards
- [ ] 21. Set token cost ceiling

### O. Logging & Monitoring
- [ ] 22. Configure Vector sink
- [ ] 23. Configure PagerDuty

### P. Test Data
- [ ] 24. Add Postman tests
- [ ] 25. Jest tests for helpers

### Q. Documentation
- [ ] 26. Update README

### T. Back-fill Content Hash
- [ ] 29. Add content_hash column

## Quick Smoke Test Sequence
1. [ ] Run Prompt Hub Loader - verify global.prompts
2. [ ] Execute ViralHub once - check RabbitMQ
3. [ ] Trigger dequeue - verify sub-workflow chain
4. [ ] Test staging webhooks
5. [ ] Run AnalyticsLoop - verify digest

## Go-Live Checklist
- [ ] All Pre-Deploy items complete
- [ ] Smoke tests passed
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Set ViralHub active=true
- [ ] Scale workers for production load