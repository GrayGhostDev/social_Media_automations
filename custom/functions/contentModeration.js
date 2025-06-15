/**
 * Content Moderation Helper
 * Checks content for compliance and safety
 */

function moderateContent(content) {
  const issues = [];
  let severity = 'safe';
  
  // List of sensitive words/phrases to check
  const sensitiveTerms = [
    'hate', 'violence', 'abuse', 'harassment', 'discrimination',
    'explicit', 'nsfw', 'illegal', 'scam', 'fraud'
  ];
  
  const contentLower = content.toLowerCase();
  
  // Check for sensitive terms
  sensitiveTerms.forEach(term => {
    if (contentLower.includes(term)) {
      issues.push(`Contains potentially sensitive term: "${term}"`);
      severity = 'warning';
    }
  });
  
  // Check for excessive caps (could be seen as shouting/spam)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.6 && content.length > 20) {
    issues.push('Excessive use of capital letters');
    severity = severity === 'safe' ? 'caution' : severity;
  }
  
  // Check for repetitive characters (spam indicator)
  if (/(.)\1{4,}/.test(content)) {
    issues.push('Contains repetitive characters');
    severity = severity === 'safe' ? 'caution' : severity;
  }
  
  // Check for suspicious URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  urls.forEach(url => {
    // Simple check for suspicious TLDs
    if (url.match(/\.(tk|ml|ga|cf)$/i)) {
      issues.push('Contains potentially suspicious URL');
      severity = 'warning';
    }
  });
  
  // Determine if content should use fallback
  const useFallback = severity === 'warning' || issues.length > 2;
  
  return {
    isSafe: severity === 'safe',
    severity,
    issues,
    useFallback,
    recommendation: useFallback ? 
      'Content may need review or alternative generation' : 
      'Content appears safe for publishing'
  };
}

module.exports = { moderateContent };