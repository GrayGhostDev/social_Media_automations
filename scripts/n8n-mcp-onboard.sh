#!/bin/bash
# MCP Proxy Credential Seeding Script
# This script registers MCP servers and their credentials with the proxy

set -e

echo "🚀 Initializing MCP Proxy with credentials..."

# Wait for proxy to be ready
echo "⏳ Waiting for MCP Proxy to be ready..."
for i in {1..30}; do
    if curl -s -f http://proxy:7990/healthz > /dev/null 2>&1; then
        echo "✅ MCP Proxy is ready!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Register Macrocosmos MCP
if [ ! -z "$MACROCOSMOS_KEY" ]; then
    echo "📡 Registering Macrocosmos MCP..."
    curl -X POST http://proxy:7990/register \
        -H "Authorization: Bearer $MCP_PROXY_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"macrocosmos\",
            \"url\": \"https://api.macrocosmos.ai/mcp\",
            \"credentials\": {
                \"api_key\": \"$MACROCOSMOS_KEY\"
            }
        }"
fi

# Register Twitter MCP
if [ ! -z "$TWITTER_BEARER_TOKEN" ]; then
    echo "🐦 Registering Twitter MCP..."
    curl -X POST http://proxy:7990/register \
        -H "Authorization: Bearer $MCP_PROXY_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"twitter-mcp\",
            \"url\": \"https://twitter-mcp.vercel.app\",
            \"credentials\": {
                \"bearer_token\": \"$TWITTER_BEARER_TOKEN\"
            }
        }"
fi

# Register Facebook MCP
if [ ! -z "$FACEBOOK_PAGE_TOKEN" ]; then
    echo "📘 Registering Facebook MCP..."
    curl -X POST http://proxy:7990/register \
        -H "Authorization: Bearer $MCP_PROXY_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"facebook\",
            \"url\": \"https://facebook-mcp.herokuapp.com\",
            \"credentials\": {
                \"page_token\": \"$FACEBOOK_PAGE_TOKEN\"
            }
        }"
fi

# Join GitHub-hosted MCP servers
echo "🔗 Joining GitHub-hosted MCP servers..."

# Join twitter-mcp from GitHub
curl -X POST http://proxy:7990/mcp/join \
    -H "Authorization: Bearer $MCP_PROXY_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"git_url\": \"gh:zcaceres/twitter-mcp\"}"

# Join facebook-mcp-server from GitHub
curl -X POST http://proxy:7990/mcp/join \
    -H "Authorization: Bearer $MCP_PROXY_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"git_url\": \"gh:metharath/facebook-mcp-server\"}"

# Join macrocosmos from GitHub
curl -X POST http://proxy:7990/mcp/join \
    -H "Authorization: Bearer $MCP_PROXY_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"git_url\": \"gh:QuantumSavory/macrocosmos\"}"

echo "✨ MCP Proxy initialization complete!"
echo "Available endpoints:"
echo "  - /macrocosmos/query"
echo "  - /twitter-mcp/timeline"
echo "  - /twitter-mcp/hashtag_search"
echo "  - /twitter-mcp/create_post"
echo "  - /facebook/post_to_facebook"