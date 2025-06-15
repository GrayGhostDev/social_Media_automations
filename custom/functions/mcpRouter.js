/**
 * MCP Router Function
 * Maps platforms to MCP endpoints and formats requests
 */

const platformEndpointMap = {
  // Social Media Platforms
  twitter: {
    endpoint: '/twitter-mcp/create_post',
    paramKey: 'text',
    maxLength: 280,
    requiresMedia: false
  },
  facebook: {
    endpoint: '/facebook/post_to_facebook',
    paramKey: 'message',
    maxLength: 63206,
    requiresMedia: false,
    additionalParams: ['image_url', 'link']
  },
  linkedin: {
    endpoint: '/linkedin-mcp/share',
    paramKey: 'text',
    maxLength: 3000,
    requiresMedia: false
  },
  instagram: {
    endpoint: '/instagram-mcp/post',
    paramKey: 'caption',
    maxLength: 2200,
    requiresMedia: true
  },
  medium: {
    endpoint: '/medium-mcp/publish',
    paramKey: 'content',
    maxLength: null, // No strict limit
    requiresMedia: false,
    additionalParams: ['title', 'tags']
  },
  
  // Direct integrations (not via MCP)
  slack: {
    endpoint: 'direct',
    paramKey: 'text',
    maxLength: 4000,
    requiresMedia: false,
    directUrl: process.env.SLACK_WEBHOOK_URL
  }
};

function routeToMCP(platform, content, metadata = {}) {
  const config = platformEndpointMap[platform.toLowerCase()];
  
  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  
  // Handle direct integrations
  if (config.endpoint === 'direct') {
    return {
      useMcp: false,
      url: config.directUrl,
      method: 'POST',
      body: {
        [config.paramKey]: content
      }
    };
  }
  
  // Format content based on platform limits
  let formattedContent = content;
  if (config.maxLength && content.length > config.maxLength) {
    formattedContent = content.substring(0, config.maxLength - 3) + '...';
  }
  
  // Build request body
  const body = {
    [config.paramKey]: formattedContent,
    metadata: {
      ...metadata,
      platform,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add additional parameters if supported
  if (config.additionalParams && metadata) {
    config.additionalParams.forEach(param => {
      if (metadata[param]) {
        body[param] = metadata[param];
      }
    });
  }
  
  return {
    useMcp: true,
    endpoint: config.endpoint,
    platform,
    body,
    requiresMedia: config.requiresMedia || false
  };
}

function batchRouteContent(platforms, content, metadata = {}) {
  return platforms.map(platform => {
    try {
      return routeToMCP(platform, content, metadata);
    } catch (error) {
      return {
        platform,
        error: error.message,
        useMcp: false
      };
    }
  });
}

module.exports = { routeToMCP, batchRouteContent, platformEndpointMap };