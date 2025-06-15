#!/bin/bash
# Script to update n8n container with required dependencies

echo "📦 Updating n8n dependencies for custom functions..."

# Create a package.json for custom dependencies if it doesn't exist
cat > /tmp/custom-deps-package.json << 'EOF'
{
  "name": "n8n-custom-dependencies",
  "version": "1.0.0",
  "description": "Additional dependencies for n8n custom functions",
  "dependencies": {
    "axios": "^1.6.0",
    "lodash": "^4.17.21",
    "moment": "^2.29.4",
    "@tensorflow/tfjs": "^4.15.0",
    "ajv": "^8.12.0",
    "crypto-js": "^4.2.0",
    "string-similarity": "^4.0.4"
  }
}
EOF

# Copy to n8n container and install
docker compose cp /tmp/custom-deps-package.json n8n:/home/node/
docker compose exec -T n8n sh -c "cd /home/node && npm install --production"

# Update Dockerfile for persistent dependencies
cat > Dockerfile.update << 'EOF'
FROM n8nio/n8n:latest

# Install additional dependencies for custom functions
USER root
RUN npm install -g \
    axios@^1.6.0 \
    lodash@^4.17.21 \
    moment@^2.29.4 \
    @tensorflow/tfjs@^4.15.0 \
    ajv@^8.12.0 \
    crypto-js@^4.2.0 \
    string-similarity@^4.0.4

# Allow these modules in n8n
ENV NODE_FUNCTION_ALLOW_EXTERNAL="axios,lodash,moment,@tensorflow/tfjs,ajv,crypto-js,string-similarity"
ENV ALLOWED_MODULES="axios,lodash,moment,@tensorflow/tfjs,ajv,crypto-js,string-similarity"

USER node
EOF

echo "✅ Dependencies script created!"
echo ""
echo "To apply:"
echo "1. Run: chmod +x scripts/update-dependencies.sh"
echo "2. Run: ./scripts/update-dependencies.sh"
echo "3. Update Dockerfile with contents from Dockerfile.update"
echo "4. Rebuild: docker compose build n8n"