const { IExecuteFunctions } = require('n8n-core');
const {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} = require('n8n-workflow');

class ViralityPredictor {
  description = {
    displayName: 'Virality Predictor',
    name: 'viralityPredictor',
    icon: 'fa:chart-line',
    group: ['transform'],
    version: 1,
    description: 'Predict viral potential using ML model',
    defaults: {
      name: 'Virality Predictor',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Model Path',
        name: 'modelPath',
        type: 'string',
        default: '/home/node/.n8n/custom/models/virality_model.json',
        description: 'Path to the TensorFlow.js model',
      },
      {
        displayName: 'Content Field',
        name: 'contentField',
        type: 'string',
        default: 'content',
        description: 'Field containing the content to analyze',
      },
      {
        displayName: 'Platform',
        name: 'platform',
        type: 'options',
        options: [
          { name: 'TikTok', value: 'tiktok' },
          { name: 'Instagram', value: 'instagram' },
          { name: 'Twitter', value: 'twitter' },
          { name: 'LinkedIn', value: 'linkedin' },
          { name: 'Facebook', value: 'facebook' },
          { name: 'YouTube', value: 'youtube' },
        ],
        default: 'twitter',
        description: 'Target platform for prediction',
      },
    ],
  };

  async execute() {
    const items = this.getInputData();
    const returnData = [];
    
    const modelPath = this.getNodeParameter('modelPath', 0);
    const contentField = this.getNodeParameter('contentField', 0);
    const platform = this.getNodeParameter('platform', 0);

    // Feature extraction for each item
    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];
        const content = item.json[contentField] || '';
        
        // Extract features
        const features = {
          content_length: content.length,
          word_count: content.split(/\s+/).length,
          hashtag_count: (content.match(/#\w+/g) || []).length,
          mention_count: (content.match(/@\w+/g) || []).length,
          emoji_count: (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu) || []).length,
          url_count: (content.match(/https?:\/\/[^\s]+/g) || []).length,
          question_marks: (content.match(/\?/g) || []).length,
          exclamation_marks: (content.match(/!/g) || []).length,
          capital_ratio: content.length > 0 ? (content.match(/[A-Z]/g) || []).length / content.length : 0,
          platform_score: this.getPlatformScore(platform, content),
          hour_of_day: new Date().getHours(),
          day_of_week: new Date().getDay(),
        };

        // Simple rule-based prediction (replace with actual TF.js model in production)
        let viralityScore = 0;
        
        // Platform-specific scoring
        if (platform === 'tiktok') {
          viralityScore += features.hashtag_count >= 3 && features.hashtag_count <= 5 ? 15 : 0;
          viralityScore += features.emoji_count > 0 ? 10 : 0;
          viralityScore += features.content_length < 150 ? 10 : 0;
        } else if (platform === 'twitter') {
          viralityScore += features.content_length <= 280 ? 10 : -10;
          viralityScore += features.hashtag_count >= 1 && features.hashtag_count <= 3 ? 10 : 0;
          viralityScore += features.question_marks > 0 ? 15 : 0;
        } else if (platform === 'linkedin') {
          viralityScore += features.word_count >= 50 ? 10 : 0;
          viralityScore += features.url_count > 0 ? 5 : 0;
          viralityScore += features.capital_ratio < 0.1 ? 5 : 0;
        }
        
        // Universal factors
        viralityScore += features.emoji_count > 0 && features.emoji_count <= 5 ? 10 : 0;
        viralityScore += features.question_marks > 0 ? 10 : 0;
        viralityScore += features.exclamation_marks === 1 ? 5 : 0;
        
        // Time-based factors
        if (features.hour_of_day >= 12 && features.hour_of_day <= 14) viralityScore += 5;
        if (features.hour_of_day >= 19 && features.hour_of_day <= 21) viralityScore += 10;
        if (features.day_of_week === 2 || features.day_of_week === 3) viralityScore += 5;
        
        // Add existing viral score if present
        const existingScore = item.json.viral_score || 0;
        viralityScore += existingScore * 0.3;
        
        // Normalize to 0-100
        viralityScore = Math.max(0, Math.min(100, viralityScore));
        
        // Determine viral tier
        let viralTier;
        let confidence;
        if (viralityScore >= 80) {
          viralTier = 'viral';
          confidence = 0.85;
        } else if (viralityScore >= 60) {
          viralTier = 'high_potential';
          confidence = 0.75;
        } else if (viralityScore >= 40) {
          viralTier = 'moderate';
          confidence = 0.65;
        } else {
          viralTier = 'low_potential';
          confidence = 0.55;
        }
        
        returnData.push({
          json: {
            ...item.json,
            virality_prediction: {
              score: viralityScore,
              tier: viralTier,
              confidence: confidence,
              features: features,
              platform: platform,
              predicted_engagement_rate: viralityScore / 100 * 0.15, // Simplified
              recommendation: this.getRecommendation(viralityScore, platform, features),
            },
          },
        });
      } catch (error) {
        throw new Error(`Virality Predictor Error: ${error.message}`);
      }
    }

    return [returnData];
  }

  getPlatformScore(platform, content) {
    const platformFactors = {
      tiktok: { optimal_length: 150, hashtag_importance: 0.8 },
      twitter: { optimal_length: 120, hashtag_importance: 0.6 },
      instagram: { optimal_length: 150, hashtag_importance: 0.9 },
      linkedin: { optimal_length: 800, hashtag_importance: 0.3 },
      facebook: { optimal_length: 400, hashtag_importance: 0.4 },
      youtube: { optimal_length: 200, hashtag_importance: 0.7 },
    };
    
    const factors = platformFactors[platform] || platformFactors.twitter;
    const lengthScore = 1 - Math.abs(content.length - factors.optimal_length) / factors.optimal_length;
    
    return Math.max(0, lengthScore * 20);
  }

  getRecommendation(score, platform, features) {
    const recommendations = [];
    
    if (score < 60) {
      if (features.emoji_count === 0) {
        recommendations.push('Add 1-3 relevant emojis');
      }
      if (features.hashtag_count === 0) {
        recommendations.push(`Add ${platform === 'twitter' ? '1-3' : '3-5'} trending hashtags`);
      }
      if (features.question_marks === 0) {
        recommendations.push('Consider ending with a question to boost engagement');
      }
    }
    
    if (platform === 'tiktok' && features.content_length > 150) {
      recommendations.push('Shorten caption to under 150 characters');
    }
    
    if (platform === 'linkedin' && features.word_count < 50) {
      recommendations.push('Expand content to at least 50 words for better reach');
    }
    
    return recommendations.length > 0 ? recommendations.join('; ') : 'Content is optimized for virality';
  }
}

module.exports = { nodeClass: ViralityPredictor };