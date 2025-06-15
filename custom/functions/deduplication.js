/**
 * Content Deduplication Helper
 * Helps track and prevent duplicate content posting
 */

// Simple in-memory store for demo (in production, use database)
const publishedContent = new Map();

function generateContentHash(content) {
  // Simple hash function for demo purposes
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

function checkDuplicate(content, source = 'unknown') {
  const hash = generateContentHash(content);
  const now = new Date();
  
  // Check if content was published before
  if (publishedContent.has(hash)) {
    const previous = publishedContent.get(hash);
    const hoursSince = (now - previous.timestamp) / (1000 * 60 * 60);
    
    return {
      isDuplicate: true,
      hash,
      previouslyPublished: previous.timestamp,
      hoursSince: Math.round(hoursSince),
      source: previous.source
    };
  }
  
  return {
    isDuplicate: false,
    hash,
    source
  };
}

function markAsPublished(content, source = 'unknown', metadata = {}) {
  const hash = generateContentHash(content);
  
  publishedContent.set(hash, {
    timestamp: new Date(),
    source,
    metadata
  });
  
  // Clean up old entries (older than 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  for (const [key, value] of publishedContent.entries()) {
    if (value.timestamp < weekAgo) {
      publishedContent.delete(key);
    }
  }
  
  return {
    success: true,
    hash,
    totalTracked: publishedContent.size
  };
}

module.exports = { checkDuplicate, markAsPublished, generateContentHash };