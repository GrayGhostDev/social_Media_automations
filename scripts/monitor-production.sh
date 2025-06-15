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
