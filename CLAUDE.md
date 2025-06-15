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

# Initialize database schema
docker compose exec postgres psql -U n8n_user -d n8n_db -f /scripts/init-database.sql

# Initialize MCP credentials (first time only)
docker compose exec proxy /scripts/n8n-mcp-onboard.sh

# Import production workflow
# Open n8n UI and import workflows/production_viral_publisher.json

# View logs
docker compose logs -f n8n
docker compose logs -f proxy

# Stop all services
docker compose down

# Rebuild after changes to Dockerfile
docker compose up --build
```

## Key URLs
- n8n Editor: http://localhost:5678
- RabbitMQ Management: http://localhost:15672
- PostgreSQL: localhost:5432
- MCP Proxy: http://localhost:7990
- MCP Proxy Health: http://localhost:7990/healthz

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
├── mcp-data/            # MCP proxy server registry
└── scripts/             # Utility scripts
    └── n8n-mcp-onboard.sh  # MCP credential setup
```

## Custom Functions Available
1. **viralScore.js** - Calculates viral potential score (0-100)
2. **contentModeration.js** - Checks content for compliance
3. **deduplication.js** - Prevents duplicate content posting
4. **mcpRouter.js** - Routes content to appropriate MCP endpoints

## Custom Nodes Available
1. **ViralityPredictor** - ML-based viral potential prediction with platform-specific optimization

## Environment Variables Required
### Core Services
- `OPENAI_API_KEY` - OpenAI API authentication
- `ANTHROPIC_API_KEY` - Anthropic Claude API authentication
- `SLACK_WEBHOOK_URL` - Slack incoming webhook for publishing
- `N8N_ENCRYPTION_KEY` - 32-character key for credential encryption
- `POSTGRES_*` - Database configuration
- `RABBITMQ_*` - Message queue configuration

### MCP Integration
- `MCP_PROXY_URL` - MCP proxy endpoint (default: http://proxy:7990)
- `MCP_PROXY_KEY` - JWT authentication key for MCP proxy
- `MACROCOSMOS_KEY` - API key for Macrocosmos social listening
- `TWITTER_BEARER_TOKEN` - Twitter API v2 bearer token
- `FACEBOOK_PAGE_TOKEN` - Facebook Graph API page token

## Workflow Features
### Original Workflow (`viral_content_workflow.json`)
- Scheduled content discovery (hourly)
- AI content generation with OpenAI
- Fallback to Anthropic Claude for compliance
- Viral scoring and moderation
- Multi-channel publishing (Slack example)

### Enhanced MCP Workflow (`viral_content_mcp_workflow.json`)
- **MCP Health Check**: Validates proxy availability before processing
- **Macrocosmos Discovery**: Pulls viral content from X/Twitter, Reddit, HuggingFace
- **Twitter MCP Integration**: Hashtag search and automated posting
- **Facebook MCP Integration**: Page posting with Graph API
- **MCP Router**: Dynamic endpoint selection based on target platforms
- **Fallback Path**: Graceful degradation to direct APIs if MCP fails

### Production Workflow (`production_viral_publisher.json`)
#### Discovery Layer (15-min intervals)
- **Multi-source discovery**: Macrocosmos, Google Trends, RiteTag, BuzzSumo, Google Sheets
- **Viral scoring**: Weighted algorithm with configurable factors
- **Deduplication**: Content similarity detection
- **Content filtering**: Keyword-based NSFW/banned content removal
- **RabbitMQ queuing**: Rate-limited buffer for processing

#### AI Agent Layer
- **Multi-LLM routing**: GPT-4, Gemini 1.5 Pro, Claude 3, Groq Llama 3
- **Agent memory**: Conversation persistence in PostgreSQL
- **Platform-specific prompts**: Optimized for each social platform
- **Content generation**: Text, image (DALL-E 3), video (Runway)
- **Moderation**: OpenAI moderation API with Claude fallback
- **A/B testing**: Variant generation and tracking

#### Publishing Layer
- **Multi-platform**: TikTok, Instagram Reels, Facebook, LinkedIn, YouTube Shorts, WordPress
- **Smart scheduling**: Time-zone aware optimal posting times
- **Analytics tracking**: Post metrics stored in PostgreSQL

#### Analytics & Optimization
- **GA4 integration**: Traffic and conversion tracking
- **Platform insights**: Native analytics from each platform
- **A/B test analysis**: CTR-based winner selection
- **Virality prediction**: Custom TensorFlow.js model
- **Prompt optimization**: Performance-based weight adjustment
- **Daily digest**: HTML email reports to stakeholders

#### Monitoring & Operations
- **Error handling**: Global error capture with alerts
- **Slack notifications**: Real-time error alerts
- **PagerDuty integration**: Critical issue escalation
- **Health checks**: Service availability monitoring

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

### Add New MCP Server
1. Join the MCP server: `docker compose exec proxy mcp join gh:user/repo`
2. Add endpoint mapping in MCP Router function node
3. No other n8n changes needed - proxy auto-exposes endpoints

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
- **Can't connect to services**: Ensure ports 5678, 5432, 15672, 7990 are free
- **Credentials error**: Verify `N8N_ENCRYPTION_KEY` hasn't changed
- **Workflow fails**: Check n8n execution logs in UI or `docker compose logs n8n`
- **MCP proxy errors**: Check `docker compose logs proxy` and verify MCP_PROXY_KEY
- **MCP health check fails**: Ensure proxy container is running and healthy

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

# Test MCP Proxy health
curl http://localhost:7990/healthz

# Test MCP endpoint (example: Macrocosmos)
curl -H "Authorization: Bearer your_mcp_proxy_key" \
  "http://localhost:7990/macrocosmos/query?q=AI"
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
### Input Sources
- **MCP-powered**: Macrocosmos (X/Twitter, Reddit, HuggingFace trends)
- **Traditional**: RSS feeds, APIs, webhooks
- **Social APIs**: Twitter hashtag search, Facebook insights

### AI Models
- **Primary**: OpenAI GPT-3.5/4
- **Fallback**: Anthropic Claude (compliance mode)

### Output Channels
- **MCP-enabled**: Twitter, Facebook (via proxy)
- **Direct**: Slack, Medium, WordPress
- **Extensible**: Any MCP server via `mcp join`

### Infrastructure
- **Storage**: PostgreSQL for state, workflow data
- **Queuing**: RabbitMQ for async tasks, MCP proxy for API queuing
- **Proxy**: Plugged-in MCP for unified API management

## Performance Optimization
- Use RabbitMQ for async processing of heavy tasks
- Implement caching in custom functions
- Set appropriate workflow concurrency limits
- Monitor PostgreSQL query performance

## MCP Servers Integrated
1. **Plugged-in MCP Proxy** - Multi-server management layer
   - Dynamic routing, rate limiting, credential management
   - Health checks and fallback handling

2. **Macrocosmos** - Social listening powerhouse
   - X/Twitter trends, Reddit hot topics, HuggingFace models
   - Unified viral content discovery

3. **twitter-mcp** - Full Twitter API v2 integration
   - Timeline, hashtag search, posting, deletion
   - OAuth handling abstracted away

4. **facebook-mcp-server** - Facebook Graph API wrapper
   - Page posting, insights, comment moderation
   - Simplified authentication flow

## Database Schema
The system uses PostgreSQL with the following tables:
- **agent_memory**: AI conversation history and model usage
- **post_metrics**: Publishing performance tracking
- **content_library**: Generated content repository
- **trend_tracking**: Discovered trends and keywords
- **ab_test_results**: A/B test performance data
- **workflow_metrics**: Execution performance tracking
- **model_performance**: LLM usage and cost tracking
- **daily_platform_analytics**: Materialized view for reporting

## Production Features
### AI Model Management
- Multi-LLM support with intelligent routing
- Cost tracking per model/request
- Performance monitoring and optimization
- Fallback chains for reliability

### Content Optimization
- Platform-specific formatting
- Viral scoring algorithm
- A/B testing framework
- Performance-based learning

### Analytics & Reporting
- Real-time engagement tracking
- Daily performance digests
- Cost analysis and optimization
- Predictive virality modeling

### Operational Excellence
- Comprehensive error handling
- Multi-channel alerting
- Health monitoring
- Database-backed persistence

## Future Enhancements
- [x] Add Twitter integration (via MCP)
- [x] Add Facebook integration (via MCP)
- [x] Multi-LLM AI agent support
- [x] A/B testing framework
- [x] Analytics database schema
- [x] Virality prediction model
- [ ] Real-time analytics dashboard
- [ ] Advanced content scheduling
- [ ] LinkedIn MCP integration
- [ ] Instagram MCP integration
- [ ] TensorFlow.js model training pipeline
- [ ] Cost optimization AI
- [ ] Multi-language support