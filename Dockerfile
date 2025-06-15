# Use the official n8n image as base
FROM n8nio/n8n:latest

# Switch to root to install packages if needed
USER root

# Install any additional dependencies if required
# RUN apk add --no-cache git python3 py3-pip

# Switch back to n8n user
USER node

# Copy custom nodes and functions into n8n's custom extensions folder
COPY --chown=node:node custom/ /home/node/.n8n/custom/

# Set the custom extensions path
ENV N8N_CUSTOM_EXTENSIONS="/home/node/.n8n/custom"

# Install any global npm packages if needed for custom code
# RUN npm install -g openai anthropic axios lodash moment

# Set working directory
WORKDIR /home/node

# The base image already has the CMD to start n8n