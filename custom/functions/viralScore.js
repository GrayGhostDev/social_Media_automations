/**
 * Viral Score Calculator
 * Analyzes content and calculates a viral potential score
 */

function calculateViralScore(content) {
  let score = 0;
  
  // Check content length (optimal: 80-280 characters for social media)
  const length = content.length;
  if (length >= 80 && length <= 280) {
    score += 20;
  } else if (length < 50 || length > 500) {
    score -= 10;
  }
  
  // Check for engaging elements
  const engagingWords = ['amazing', 'incredible', 'shocking', 'breaking', 'exclusive', 
                         'revealed', 'secret', 'discover', 'transform', 'revolutionary'];
  const contentLower = content.toLowerCase();
  engagingWords.forEach(word => {
    if (contentLower.includes(word)) {
      score += 5;
    }
  });
  
  // Check for emojis (increases engagement)
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
  const emojiCount = (content.match(emojiRegex) || []).length;
  score += Math.min(emojiCount * 5, 15); // Max 15 points for emojis
  
  // Check for hashtags
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  if (hashtagCount >= 1 && hashtagCount <= 3) {
    score += 10;
  } else if (hashtagCount > 5) {
    score -= 5; // Too many hashtags
  }
  
  // Check for questions (increases engagement)
  if (content.includes('?')) {
    score += 10;
  }
  
  // Check for call-to-action phrases
  const ctaPhrases = ['click', 'share', 'comment', 'follow', 'subscribe', 'learn more', 'find out'];
  ctaPhrases.forEach(phrase => {
    if (contentLower.includes(phrase)) {
      score += 8;
    }
  });
  
  // Normalize score to 0-100
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    isViral: score >= 60,
    recommendation: score >= 60 ? 'High viral potential' : 'Consider optimizing for engagement'
  };
}

module.exports = { calculateViralScore };