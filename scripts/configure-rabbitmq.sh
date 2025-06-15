#!/bin/bash
# Configure RabbitMQ with dead-letter exchange for ViralHub

echo "🐰 Configuring RabbitMQ for ViralHub..."

# Wait for RabbitMQ to be ready
echo "Waiting for RabbitMQ to be ready..."
sleep 10

# RabbitMQ credentials from environment
RABBITMQ_USER="${RABBITMQ_USER:-n8n_rabbit}"
RABBITMQ_PASS="${RABBITMQ_PASS:-your_rabbitmq_password_here}"
RABBITMQ_HOST="${RABBITMQ_HOST:-localhost}"
RABBITMQ_PORT="${RABBITMQ_PORT:-15672}"

# Function to execute RabbitMQ management API calls
rabbitmq_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -u "$RABBITMQ_USER:$RABBITMQ_PASS" \
             -X "$method" \
             "http://$RABBITMQ_HOST:$RABBITMQ_PORT/api/$endpoint"
    else
        curl -s -u "$RABBITMQ_USER:$RABBITMQ_PASS" \
             -H "Content-Type: application/json" \
             -X "$method" \
             -d "$data" \
             "http://$RABBITMQ_HOST:$RABBITMQ_PORT/api/$endpoint"
    fi
}

# Create vhost if not exists
echo "Creating vhost..."
rabbitmq_api PUT "vhosts/n8n" '{}'

# Set permissions
echo "Setting permissions..."
rabbitmq_api PUT "permissions/n8n/$RABBITMQ_USER" '{
    "configure": ".*",
    "write": ".*",
    "read": ".*"
}'

# Create dead letter exchange
echo "Creating dead letter exchange..."
rabbitmq_api PUT "exchanges/n8n/dlx_ideas" '{
    "type": "fanout",
    "durable": true,
    "auto_delete": false
}'

# Create dead letter queue
echo "Creating dead letter queue..."
rabbitmq_api PUT "queues/n8n/ideas_dlq" '{
    "durable": true,
    "auto_delete": false,
    "arguments": {
        "x-message-ttl": 604800000
    }
}'

# Bind dead letter queue to dead letter exchange
echo "Binding dead letter queue..."
rabbitmq_api POST "bindings/n8n/e/dlx_ideas/q/ideas_dlq" '{
    "routing_key": "",
    "arguments": {}
}'

# Create main exchange
echo "Creating main exchange..."
rabbitmq_api PUT "exchanges/n8n/ideas_exchange" '{
    "type": "direct",
    "durable": true,
    "auto_delete": false
}'

# Create main queue with dead letter configuration
echo "Creating main queue with dead letter settings..."
rabbitmq_api PUT "queues/n8n/ideas_queue" '{
    "durable": true,
    "auto_delete": false,
    "arguments": {
        "x-message-ttl": 86400000,
        "x-max-priority": 10,
        "x-dead-letter-exchange": "dlx_ideas",
        "x-max-retries": 5
    }
}'

# Bind main queue to main exchange
echo "Binding main queue..."
rabbitmq_api POST "bindings/n8n/e/ideas_exchange/q/ideas_queue" '{
    "routing_key": "ideas",
    "arguments": {}
}'

# Create monitoring queue for analytics
echo "Creating analytics queue..."
rabbitmq_api PUT "queues/n8n/analytics_queue" '{
    "durable": true,
    "auto_delete": false,
    "arguments": {
        "x-message-ttl": 3600000
    }
}'

# Configure policies
echo "Setting queue policies..."
rabbitmq_api PUT "policies/n8n/retry-policy" '{
    "pattern": "^ideas_queue$",
    "definition": {
        "dead-letter-exchange": "dlx_ideas",
        "dead-letter-routing-key": "failed",
        "message-ttl": 86400000,
        "max-length": 10000
    },
    "priority": 1,
    "apply-to": "queues"
}'

# Configure alarms
echo "Setting up alarms..."
rabbitmq_api PUT "policies/n8n/queue-length-alarm" '{
    "pattern": ".*",
    "definition": {
        "max-length": 50000
    },
    "priority": 0,
    "apply-to": "queues"
}'

echo "✅ RabbitMQ configuration complete!"
echo ""
echo "Configuration summary:"
echo "- Vhost: n8n"
echo "- Main queue: ideas_queue (with DLX after 5 retries)"
echo "- Dead letter exchange: dlx_ideas"
echo "- Dead letter queue: ideas_dlq (7 day retention)"
echo "- Analytics queue: analytics_queue"
echo ""
echo "To verify configuration:"
echo "1. Visit http://$RABBITMQ_HOST:15672"
echo "2. Login with: $RABBITMQ_USER"
echo "3. Check Queues and Exchanges tabs"