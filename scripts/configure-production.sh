#!/bin/bash
# Configure all production settings for ViralHub deployment

echo "🚀 Configuring ViralHub for Production..."
echo "====================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your actual credentials${NC}"
    exit 1
fi

# Source environment variables
source .env

echo ""
echo -e "${BLUE}1. Checking N8N_ENCRYPTION_KEY...${NC}"
if [ -z "$N8N_ENCRYPTION_KEY" ] || [ "$N8N_ENCRYPTION_KEY" = "your_32_character_encryption_key_here" ]; then
    echo -e "${YELLOW}Generating secure encryption key...${NC}"
    NEW_KEY=$(openssl rand -hex 16)
    sed -i.bak "s/N8N_ENCRYPTION_KEY=.*/N8N_ENCRYPTION_KEY=$NEW_KEY/" .env
    echo -e "${GREEN}✅ Generated new encryption key${NC}"
else
    echo -e "${GREEN}✅ Encryption key is set${NC}"
fi

echo ""
echo -e "${BLUE}2. Updating Docker Compose for production...${NC}"
# Create production docker-compose override
cat > docker-compose.production.yml << 'EOF'
version: "3.9"

services:
  n8n:
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD:-changeme}
      - N8N_METRICS=true
      - N8N_METRICS_PREFIX=n8n_
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      - EXECUTIONS_DATA_SAVE_ON_PROGRESS=true
      - EXECUTIONS_DATA_SAVE_MANUAL_EXECUTIONS=true
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_VERSION_NOTIFICATIONS_ENABLED=false
      - N8N_TEMPLATES_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    restart: always

  n8n-worker:
    build: .
    command: worker
    environment:
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
      - N8N_LOG_LEVEL=warn
    volumes:
      - ./custom:/home/node/.n8n/custom
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 2G
    restart: always
    networks:
      - n8n-network

  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: always

  redis:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: always

  rabbitmq:
    environment:
      - RABBITMQ_VM_MEMORY_HIGH_WATERMARK=0.8
      - RABBITMQ_DISK_FREE_LIMIT=2GB
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    restart: always

  nginx:
    image: nginx:alpine
    container_name: n8n_nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - n8n
    restart: always
    networks:
      - n8n-network
EOF

echo -e "${GREEN}✅ Created docker-compose.production.yml${NC}"

echo ""
echo -e "${BLUE}3. Creating nginx configuration...${NC}"
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream n8n {
        server n8n:5678;
    }

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        client_max_body_size 100M;

        location / {
            proxy_pass http://n8n;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 600s;
            proxy_connect_timeout 600s;
            proxy_send_timeout 600s;
        }
    }
}
EOF
echo -e "${GREEN}✅ Created nginx.conf${NC}"

echo ""
echo -e "${BLUE}4. Creating SSL directory...${NC}"
mkdir -p ssl
if [ ! -f "ssl/cert.pem" ]; then
    echo -e "${YELLOW}⚠️  No SSL certificates found${NC}"
    echo "To generate self-signed certificates for testing:"
    echo "  openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem"
else
    echo -e "${GREEN}✅ SSL directory exists${NC}"
fi

echo ""
echo -e "${BLUE}5. Setting up production environment variables...${NC}"
cat >> .env << 'EOF'

# Production settings (added by configure-production.sh)
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=changeme
WEBHOOK_URL=https://your-domain.com
N8N_HOST=your-domain.com
N8N_PORT=5678
N8N_PROTOCOL=https
EOF
echo -e "${GREEN}✅ Added production settings to .env${NC}"

echo ""
echo -e "${BLUE}6. Creating production backup script...${NC}"
cat > scripts/backup-production.sh << 'EOF'
#!/bin/bash
# Production backup script

BACKUP_DIR="/backups/viralhub"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔄 Starting production backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR/$TIMESTAMP"

# Backup PostgreSQL
echo "Backing up PostgreSQL..."
docker compose exec -T postgres pg_dump -U $POSTGRES_USER $POSTGRES_DB > "$BACKUP_DIR/$TIMESTAMP/postgres_backup.sql"

# Backup n8n data
echo "Backing up n8n data..."
docker compose exec -T n8n tar czf - /home/node/.n8n > "$BACKUP_DIR/$TIMESTAMP/n8n_data.tar.gz"

# Backup configurations
echo "Backing up configurations..."
cp .env "$BACKUP_DIR/$TIMESTAMP/"
cp docker-compose.yml "$BACKUP_DIR/$TIMESTAMP/"
cp docker-compose.production.yml "$BACKUP_DIR/$TIMESTAMP/"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null

echo "✅ Backup completed: $BACKUP_DIR/$TIMESTAMP"
EOF
chmod +x scripts/backup-production.sh
echo -e "${GREEN}✅ Created backup script${NC}"

echo ""
echo -e "${BLUE}7. Creating monitoring script...${NC}"
cat > scripts/monitor-production.sh << 'EOF'
#!/bin/bash
# Production monitoring script

check_service() {
    if docker compose ps | grep -q "$1.*Up"; then
        echo "✅ $1 is running"
        return 0
    else
        echo "❌ $1 is down!"
        return 1
    fi
}

echo "🔍 Checking production services..."
echo ""

FAILED=0

check_service "n8n" || FAILED=$((FAILED+1))
check_service "postgres" || FAILED=$((FAILED+1))
check_service "redis" || FAILED=$((FAILED+1))
check_service "rabbitmq" || FAILED=$((FAILED+1))
check_service "proxy" || FAILED=$((FAILED+1))

echo ""
echo "📊 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -E "(CONTAINER|n8n)"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "⚠️  $FAILED services are down!"
    exit 1
else
    echo ""
    echo "✅ All services are healthy!"
fi
EOF
chmod +x scripts/monitor-production.sh
echo -e "${GREEN}✅ Created monitoring script${NC}"

echo ""
echo "===================================="
echo -e "${GREEN}✅ Production configuration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env and update:"
echo "   - N8N_BASIC_AUTH_USER/PASSWORD"
echo "   - WEBHOOK_URL with your domain"
echo "   - All API keys and credentials"
echo ""
echo "2. Generate SSL certificates or copy existing ones to ./ssl/"
echo ""
echo "3. Configure RabbitMQ:"
echo "   ./scripts/configure-rabbitmq.sh"
echo ""
echo "4. Start production stack:"
echo "   docker compose -f docker-compose.yml -f docker-compose.production.yml up -d"
echo ""
echo "5. Initialize database:"
echo "   npm run init:db"
echo ""
echo "6. Import workflows in order (see workflow-id-mapping.json)"
echo ""
echo "7. Set up monitoring:"
echo "   crontab -e"
echo "   */5 * * * * /path/to/scripts/monitor-production.sh"
echo ""
echo "8. Set up daily backups:"
echo "   0 2 * * * /path/to/scripts/backup-production.sh"