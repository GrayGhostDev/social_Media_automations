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
