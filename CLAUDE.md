# CLAUDE.md - Project Knowledge Base

## Project Overview
This is a comprehensive n8n-based social media automation system designed for multi-channel publishing of AI-regenerated viral content. The project uses Docker Compose to orchestrate n8n, PostgreSQL, and RabbitMQ containers, making it easy to run locally in VS Code.

## Quick Start Commands
```bash
# Copy environment template and configure
cp .env.example .env
# Edit .env with your API keys and credentials

# Start all services
docker compose up -d

# View logs
docker compose logs -f n8n

# Stop all services
docker compose down

# Rebuild after changes to Dockerfile
docker compose up --build
```

## Key URLs
- n8n Editor: http://localhost:5678
- RabbitMQ Management: http://localhost:15672
- PostgreSQL: localhost:5432

## Project Structure
```
social_Media_automations/
├── docker-compose.yml      # Docker services configuration
├── Dockerfile             # Custom n8n image
├── .env                   # Environment variables (not in git)
├── .env.example          # Template for environment variables
├── workflows/            # n8n workflow JSON files
├── custom/               # Custom nodes and functions
│   ├── nodes/           # Custom n8n nodes
│   └── functions/       # JavaScript helper functions
├── data/                # Persistent data
│   ├── postgres/        # PostgreSQL data
│   └── rabbitmq/        # RabbitMQ data
└── scripts/             # Utility scripts
```

## Custom Functions Available
1. **viralScore.js** - Calculates viral potential score (0-100)
2. **contentModeration.js** - Checks content for compliance
3. **deduplication.js** - Prevents duplicate content posting

## Environment Variables Required
- `OPENAI_API_KEY` - OpenAI API authentication
- `ANTHROPIC_API_KEY` - Anthropic Claude API authentication
- `SLACK_WEBHOOK_URL` - Slack incoming webhook for publishing
- `N8N_ENCRYPTION_KEY` - 32-character key for credential encryption
- `POSTGRES_*` - Database configuration
- `RABBITMQ_*` - Message queue configuration

## Workflow Features
The included `viral_content_workflow.json` demonstrates:
- Scheduled content discovery (hourly)
- AI content generation with OpenAI
- Fallback to Anthropic Claude for compliance
- Viral scoring and moderation
- Multi-channel publishing (Slack example)

## Development Workflow
1. Edit custom functions in `custom/functions/`
2. Restart n8n container: `docker compose restart n8n`
3. Import/edit workflows in n8n UI
4. Export workflows to `workflows/` for version control

## Extending the System
### Add New Publishing Channel
1. Add API credentials to `.env`
2. Update workflow to include new HTTP Request node
3. Configure authentication and payload

### Add Custom Node
1. Create node in `custom/nodes/YourNode/`
2. Include `YourNode.node.js` and optionally `YourNode.credentials.js`
3. Restart n8n container

### Modify AI Behavior
1. Edit prompts in workflow nodes
2. Adjust temperature and max_tokens
3. Add custom pre/post-processing in Function nodes

## Troubleshooting
- **Container won't start**: Check `.env` file is properly configured
- **Can't connect to services**: Ensure ports 5678, 5432, 15672 are free
- **Credentials error**: Verify `N8N_ENCRYPTION_KEY` hasn't changed
- **Workflow fails**: Check n8n execution logs in UI or `docker compose logs n8n`

## Security Notes
- Never commit `.env` file
- Use strong passwords for all services
- Consider enabling n8n basic auth for production
- Regularly update container images

## Testing
```bash
# Test OpenAI integration
curl -X POST http://localhost:5678/webhook-test/your-webhook-id

# Check PostgreSQL connection
docker compose exec postgres psql -U n8n_user -d n8n_db -c "SELECT version();"

# Verify RabbitMQ
curl -u n8n_rabbit:your_password http://localhost:15672/api/overview
```

## Maintenance Commands
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U n8n_user n8n_db > backup.sql

# Clean up old Docker resources
docker system prune -a

# Update n8n to latest
docker compose pull
docker compose up -d
```

## Integration Points
- **Input Sources**: RSS feeds, APIs, webhooks
- **AI Models**: OpenAI GPT-3.5/4, Anthropic Claude
- **Output Channels**: Slack, Twitter, Medium, WordPress (extendable)
- **Storage**: PostgreSQL for state, RabbitMQ for queuing

## Performance Optimization
- Use RabbitMQ for async processing of heavy tasks
- Implement caching in custom functions
- Set appropriate workflow concurrency limits
- Monitor PostgreSQL query performance

## Future Enhancements
- [ ] Add Twitter integration
- [ ] Implement content scheduling
- [ ] Add analytics dashboard
- [ ] Create content performance tracking
- [ ] Implement A/B testing for content variations