# Social Media Automations

An AI-powered n8n workflow system for discovering, regenerating, and publishing viral content across multiple social media channels.

## Features

- 🤖 **AI Content Generation**: Uses OpenAI GPT and Anthropic Claude for content creation
- 📊 **Viral Scoring**: Custom algorithms to assess content engagement potential
- 🛡️ **Content Moderation**: Built-in safety checks with fallback options
- 🔄 **Multi-Channel Publishing**: Extensible framework for various platforms
- 🐳 **Docker-Based**: Easy deployment with Docker Compose
- 📝 **Persistent Storage**: PostgreSQL for data and RabbitMQ for message queuing

## Prerequisites

- Docker and Docker Compose
- API Keys:
  - OpenAI API key
  - Anthropic API key
  - Slack webhook URL (or other platform credentials)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/GrayGhostDev/social_Media_automations.git
   cd social_Media_automations
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

3. **Start the services**
   ```bash
   docker compose up -d
   ```

4. **Access n8n**
   - Open http://localhost:5678
   - Import the workflow from `workflows/viral_content_workflow.json`
   - Activate the workflow

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   n8n       │────▶│  PostgreSQL │     │  RabbitMQ   │
│  Workflows  │     │  Database   │     │   Queue     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                         │
       ▼                                         ▼
┌─────────────┐                         ┌─────────────┐
│   OpenAI    │                         │   Slack     │
│   Claude    │                         │  Twitter    │
└─────────────┘                         └─────────────┘
```

## Workflow Overview

The included workflow performs these steps:
1. **Schedule Trigger**: Runs hourly (configurable)
2. **Fetch Content**: Retrieves trending/viral content from sources
3. **AI Generation**: Creates engaging content using OpenAI
4. **Moderation**: Checks content safety and viral potential
5. **Fallback Logic**: Uses Anthropic Claude if needed
6. **Publishing**: Sends to configured channels

## Configuration

### Environment Variables
Key variables in `.env`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `SLACK_WEBHOOK_URL`: Slack incoming webhook
- `N8N_ENCRYPTION_KEY`: 32-character encryption key
- Database and RabbitMQ credentials

### Custom Functions
Located in `custom/functions/`:
- `viralScore.js`: Calculates engagement potential
- `contentModeration.js`: Safety and compliance checks
- `deduplication.js`: Prevents duplicate posts

## Development

### Adding New Channels
1. Add credentials to `.env`
2. Create new HTTP Request node in workflow
3. Configure authentication and payload format

### Custom Node Development
1. Create node in `custom/nodes/`
2. Restart n8n container
3. Node appears in editor

### Workflow Editing
1. Make changes in n8n UI
2. Export workflow to `workflows/`
3. Commit to version control

## Monitoring

- **n8n logs**: `docker compose logs -f n8n`
- **Execution history**: View in n8n UI
- **RabbitMQ management**: http://localhost:15672

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Container won't start | Check `.env` configuration |
| Port conflicts | Ensure ports 5678, 5432, 15672 are free |
| Credential errors | Verify `N8N_ENCRYPTION_KEY` consistency |
| API failures | Check API keys and rate limits |

## Security

- Store `.env` securely (not in version control)
- Use strong passwords for all services
- Enable n8n authentication for production
- Regularly update Docker images

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

- Create an issue on GitHub
- Check n8n documentation: https://docs.n8n.io
- Join n8n community: https://community.n8n.io