// Platform-specific prompt templates for AI content generation
module.exports = {
  // TikTok - Focus on hooks and visual cues
  tiktok: (content, options = {}) => {
    const { tone = 'energetic', hashtags = [] } = options;
    return `You are the hook-master. Create a TikTok video script that stops scrollers instantly.

Rules:
- First sentence: MAX 5 words, must create curiosity
- Total script: 10-15 seconds (75 words max)
- Structure: Hook → Build → Payoff
- Add [on-screen text] cues in brackets
- Include [visual: description] for key moments
- End with clear CTA
- Tone: ${tone}

${hashtags.length > 0 ? `Use these trending hashtags: ${hashtags.join(', ')}` : ''}

Input content:
${content}

Output format:
[HOOK - 0:00-0:02]
[BUILD - 0:02-0:08]
[PAYOFF - 0:08-0:10]
#hashtag1 #hashtag2 #hashtag3`;
  },

  // Instagram - Emoji-rich and visually structured
  instagram: (content, options = {}) => {
    const { contentType = 'reel', hashtags = [] } = options;
    return `Transform this into an Instagram ${contentType} caption that drives engagement.

Rules:
- Start with attention-grabbing first line
- Use emoji bullets for key points (one emoji per line)
- Max 2200 characters
- Include 5-10 hashtags (mix of high-volume and niche)
- Add line breaks for mobile readability
- Include a question or CTA at the end

${hashtags.length > 0 ? `Focus on these hashtags: ${hashtags.join(', ')}` : ''}

Input content:
${content}

Structure:
[Attention-grabbing opener]

🎯 [Key point 1]
💡 [Key point 2]
🚀 [Key point 3]

[Engaging question or CTA]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5`;
  },

  // LinkedIn - Professional and insight-driven
  linkedin: (content, options = {}) => {
    const { industry = 'business', includeStats = true } = options;
    return `Craft a LinkedIn post that positions you as a thought leader in ${industry}.

Rules:
- Professional yet conversational tone
- 300-800 characters for optimal reach
- Include ONE thought-provoking question
- ${includeStats ? 'Cite a relevant statistic or data point' : 'Focus on personal insights'}
- No hashtags in main text (add 3-5 at the end)
- Structure: Hook → Insight → Question

Input content:
${content}

Format:
[Compelling opening statement]

[2-3 sentences of insight/value]

[Thought-provoking question]

What's your take?

#ProfessionalGrowth #${industry} #Leadership`;
  },

  // Twitter/X - Concise and conversational
  twitter: (content, options = {}) => {
    const { style = 'informative', thread = false } = options;
    return `Create a ${thread ? 'Twitter thread' : 'single tweet'} that maximizes engagement.

Rules:
- ${thread ? 'First tweet: Strong hook (max 200 chars)' : 'Max 250 characters to leave room for retweets'}
- ${style === 'informative' ? 'Share actionable insight' : 'Be conversational and relatable'}
- Use 1-3 relevant hashtags
- ${thread ? 'Each tweet: One complete thought' : 'Include a question or bold statement'}
- Natural language, avoid corporate speak

Input content:
${content}

${thread ? 'Thread structure:\n1/ [Hook]\n2/ [Main point]\n3/ [Supporting detail]\n4/ [Conclusion + CTA]' : ''}`;
  },

  // YouTube Shorts - Teaser-focused
  youtube: (content, options = {}) => {
    const { videoLength = '60s' } = options;
    return `Create a YouTube Shorts description that maximizes views and watch time.

Rules:
- First line: Irresistible hook question or statement
- Tease the payoff without giving it away
- Include 3-5 relevant keywords naturally
- Add timestamps if applicable
- CTA: "Full video in bio" or "Subscribe for more"
- ${videoLength} video length consideration

Input content:
${content}

Format:
[Hook question/statement]

In this short, you'll discover:
• [Teaser point 1]
• [Teaser point 2]
• [Key takeaway teaser]

👇 Comment your thoughts below!

#Shorts #YourNiche #Viral`;
  },

  // Facebook - Community-focused
  facebook: (content, options = {}) => {
    const { groupType = 'general', emotional = true } = options;
    return `Write a Facebook post that sparks meaningful discussion in ${groupType} groups.

Rules:
- ${emotional ? 'Start with relatable emotion/experience' : 'Lead with valuable information'}
- Conversational, like talking to a friend
- Include a question that invites personal stories
- Use paragraphs for readability
- End with "What do you think?" or similar
- Optional: Add relevant emoji

Input content:
${content}

Structure:
[Relatable opening]

[Main content - 2-3 short paragraphs]

[Personal touch or example]

What's been your experience with this? 🤔`;
  },

  // Multi-platform optimizer
  multiPlatform: (content, platforms = ['twitter', 'linkedin', 'instagram']) => {
    return `Create platform-optimized versions of this content for: ${platforms.join(', ')}

Core message to maintain across all platforms:
${content}

For each platform, provide:
1. Platform name
2. Optimized content following that platform's best practices
3. Recommended posting time (in ET)
4. Key hashtags (if applicable)
5. Expected engagement metric to track

Ensure each version feels native to its platform while maintaining the core message.`;
  },

  // A/B Testing variants generator
  generateABVariants: (content, platform, testElement = 'hook') => {
    return `Generate A/B test variants for ${platform} focusing on different ${testElement}s.

Original content:
${content}

Create 2 variants:
- Variant A: ${testElement === 'hook' ? 'Question-based hook' : testElement === 'cta' ? 'Soft CTA' : 'Emoji-heavy'}
- Variant B: ${testElement === 'hook' ? 'Statement-based hook' : testElement === 'cta' ? 'Direct CTA' : 'Minimal emojis'}

Each variant should:
1. Maintain the core message
2. Only change the ${testElement}
3. Be roughly the same length
4. Follow ${platform} best practices

Provide clear labels for tracking.`;
  },

  // Prompt enhancer for specific goals
  enhanceForGoal: (content, goal = 'engagement', platform = 'general') => {
    const goalPrompts = {
      engagement: 'Maximize comments and shares by adding controversial or thought-provoking elements',
      reach: 'Optimize for algorithm favorability with trending topics and broad appeal',
      conversion: 'Include clear value proposition and strong call-to-action',
      brand: 'Strengthen brand voice and values while maintaining authenticity',
    };

    return `Enhance this content to ${goalPrompts[goal]}.

Platform: ${platform}
Original content:
${content}

Enhancement focus:
- ${goal === 'engagement' ? 'Add polarizing question or bold statement' : ''}
- ${goal === 'reach' ? 'Include 2-3 trending topics naturally' : ''}
- ${goal === 'conversion' ? 'Clear value prop in first line + specific CTA' : ''}
- ${goal === 'brand' ? 'Infuse brand personality and values' : ''}

Maintain authenticity while optimizing for ${goal}.`;
  },

  // System prompts for different AI models
  systemPrompts: {
    openai: `You are a viral content expert who has analyzed millions of high-performing social media posts. You understand platform algorithms, audience psychology, and engagement triggers. Always write in an authentic, human voice that connects emotionally while delivering value. Never use corporate jargon or obviously AI-generated phrases.`,
    
    anthropic: `You are a thoughtful social media strategist focused on creating meaningful connections through content. You prioritize authenticity, value, and ethical engagement over cheap tricks. Help users create content that genuinely resonates with their audience while respecting platform best practices and user attention.`,
    
    gemini: `You are a creative content optimizer with deep knowledge of social media trends and platform-specific nuances. You excel at transforming ideas into platform-native content that feels natural and engaging. Focus on clarity, creativity, and cultural relevance in every piece of content.`,
    
    groq: `You are a high-speed content generation specialist optimized for rapid iteration and A/B testing. Create multiple variants quickly while maintaining quality and platform-specific optimization. Focus on actionable, concise content that drives measurable results.`,
  },

  // Helper function to get prompt by platform and options
  getPrompt: function(platform, content, options = {}) {
    if (this[platform]) {
      return this[platform](content, options);
    }
    throw new Error(`Platform '${platform}' not supported in prompt library`);
  },

  // Batch prompt generator for multiple platforms
  batchGenerate: function(content, platforms = ['twitter', 'linkedin', 'instagram'], options = {}) {
    return platforms.map(platform => ({
      platform,
      prompt: this.getPrompt(platform, content, options[platform] || {}),
    }));
  },
};