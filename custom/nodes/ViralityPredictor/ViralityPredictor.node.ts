import { IExecuteFunctions } from 'n8n-core';
import {
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

export class ViralityPredictor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Virality Predictor',
    name: 'viralityPredictor',
    icon: 'fa:chart-line',
    group: ['transform'],
    version: 1,
    description: 'Predict 24h engagement uplift using ML model',
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
        default: '/home/node/.n8n/custom/models/virality_model.h5',
        description: 'Path to the TensorFlow.js model file',
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
      {
        displayName: 'Use ML Model',
        name: 'useMLModel',
        type: 'boolean',
        default: false,
        description: 'Use TensorFlow model (if available) or rule-based scoring',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    
    const modelPath = this.getNodeParameter('modelPath', 0) as string;
    const contentField = this.getNodeParameter('contentField', 0) as string;
    const platform = this.getNodeParameter('platform', 0) as string;
    const useMLModel = this.getNodeParameter('useMLModel', 0) as boolean;
    
    let model: tf.LayersModel | null = null;
    
    // Try to load ML model if requested
    if (useMLModel && fs.existsSync(modelPath)) {
      try {
        model = await tf.loadLayersModel(`file://${modelPath}`);
      } catch (error) {
        console.warn('Failed to load ML model, falling back to rule-based scoring');
      }
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const content = items[itemIndex].json[contentField] as string || '';
        
        // Extract features
        const features = this.extractFeatures(content, platform);
        
        let viralityScore: number;
        let confidence: number;
        
        if (model && useMLModel) {
          // ML-based prediction
          const prediction = await this.predictWithModel(model, features);
          viralityScore = prediction.score;
          confidence = prediction.confidence;
        } else {
          // Rule-based prediction
          const prediction = this.ruleBasedPrediction(features, platform);
          viralityScore = prediction.score;
          confidence = prediction.confidence;
        }
        
        // Determine viral tier
        const tier = this.getViralTier(viralityScore);
        
        // Generate recommendations
        const recommendations = this.getRecommendations(viralityScore, platform, features);
        
        returnData.push({
          json: {
            ...items[itemIndex].json,
            virality_prediction: {
              score: viralityScore,
              tier: tier,
              confidence: confidence,
              features: features,
              platform: platform,
              predicted_engagement_rate: viralityScore / 100 * 0.15,
              predicted_24h_uplift: viralityScore / 100 * 2.5,
              recommendation: recommendations,
              model_type: model && useMLModel ? 'ml' : 'rule_based',
            },
          },
          pairedItem: itemIndex,
        });
      } catch (error) {
        throw new NodeOperationError(
          this.getNode(),
          `Virality Predictor Error: ${error.message}`,
          { itemIndex }
        );
      }
    }

    return [returnData];
  }

  private extractFeatures(content: string, platform: string): Record<string, number> {
    const features: Record<string, number> = {
      content_length: content.length,
      word_count: content.split(/\s+/).filter(w => w.length > 0).length,
      hashtag_count: (content.match(/#\w+/g) || []).length,
      mention_count: (content.match(/@\w+/g) || []).length,
      emoji_count: (content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu) || []).length,
      url_count: (content.match(/https?:\/\/[^\s]+/g) || []).length,
      question_marks: (content.match(/\?/g) || []).length,
      exclamation_marks: (content.match(/!/g) || []).length,
      capital_ratio: content.length > 0 ? (content.match(/[A-Z]/g) || []).length / content.length : 0,
      newline_count: (content.match(/\n/g) || []).length,
      hour_of_day: new Date().getHours(),
      day_of_week: new Date().getDay(),
      platform_score: this.getPlatformScore(platform, content),
    };
    
    // Platform-specific features
    if (platform === 'tiktok') {
      features.hook_strength = this.calculateHookStrength(content);
      features.trend_alignment = 0.5; // Placeholder for trend analysis
    } else if (platform === 'linkedin') {
      features.professional_tone = this.calculateProfessionalTone(content);
      features.insight_score = this.calculateInsightScore(content);
    }
    
    return features;
  }

  private async predictWithModel(
    model: tf.LayersModel,
    features: Record<string, number>
  ): Promise<{ score: number; confidence: number }> {
    // Normalize features for model input
    const featureArray = [
      features.content_length / 1000,
      features.word_count / 100,
      features.hashtag_count / 10,
      features.mention_count / 10,
      features.emoji_count / 10,
      features.url_count / 5,
      features.question_marks / 3,
      features.exclamation_marks / 3,
      features.capital_ratio,
      features.platform_score / 100,
      features.hour_of_day / 24,
      features.day_of_week / 7,
    ];
    
    const input = tf.tensor2d([featureArray]);
    const prediction = model.predict(input) as tf.Tensor;
    const result = await prediction.array() as number[][];
    
    input.dispose();
    prediction.dispose();
    
    const score = Math.round(result[0][0] * 100);
    const confidence = 0.85; // Placeholder - would calculate from model uncertainty
    
    return { score, confidence };
  }

  private ruleBasedPrediction(
    features: Record<string, number>,
    platform: string
  ): { score: number; confidence: number } {
    let score = 0;
    
    // Platform-specific scoring
    if (platform === 'tiktok') {
      score += features.hashtag_count >= 3 && features.hashtag_count <= 5 ? 15 : 0;
      score += features.emoji_count > 0 && features.emoji_count <= 3 ? 10 : 0;
      score += features.content_length < 150 ? 10 : 0;
      score += features.hook_strength || 0;
    } else if (platform === 'twitter') {
      score += features.content_length <= 280 ? 10 : -10;
      score += features.hashtag_count >= 1 && features.hashtag_count <= 3 ? 10 : 0;
      score += features.question_marks > 0 ? 15 : 0;
      score += features.newline_count >= 1 && features.newline_count <= 3 ? 5 : 0;
    } else if (platform === 'linkedin') {
      score += features.word_count >= 50 && features.word_count <= 150 ? 10 : 0;
      score += features.url_count > 0 ? 5 : 0;
      score += features.capital_ratio < 0.1 ? 5 : 0;
      score += features.professional_tone || 0;
      score += features.insight_score || 0;
    } else if (platform === 'instagram') {
      score += features.emoji_count >= 2 && features.emoji_count <= 5 ? 15 : 0;
      score += features.hashtag_count >= 5 && features.hashtag_count <= 10 ? 15 : 0;
      score += features.newline_count >= 2 ? 10 : 0;
    }
    
    // Universal factors
    score += features.emoji_count > 0 && features.emoji_count <= 5 ? 10 : 0;
    score += features.question_marks === 1 ? 10 : 0;
    score += features.exclamation_marks === 1 ? 5 : 0;
    
    // Time-based factors
    if (features.hour_of_day >= 12 && features.hour_of_day <= 14) score += 5;
    if (features.hour_of_day >= 19 && features.hour_of_day <= 21) score += 10;
    if (features.day_of_week === 2 || features.day_of_week === 3) score += 5;
    
    // Platform score bonus
    score += features.platform_score;
    
    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));
    
    // Calculate confidence based on feature completeness
    const confidence = 0.65 + (Object.keys(features).length / 20) * 0.2;
    
    return { score, confidence: Math.min(0.85, confidence) };
  }

  private getPlatformScore(platform: string, content: string): number {
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

  private calculateHookStrength(content: string): number {
    // Check first 10 words for hook quality
    const firstWords = content.split(/\s+/).slice(0, 10).join(' ').toLowerCase();
    let hookScore = 0;
    
    // Strong hook patterns
    const strongHooks = ['wait until', 'you won\'t believe', 'this is why', 'the moment when', 'pov:', 'storytime'];
    strongHooks.forEach(hook => {
      if (firstWords.includes(hook)) hookScore += 20;
    });
    
    // Question hooks
    if (firstWords.match(/^(who|what|when|where|why|how)/)) hookScore += 15;
    
    return Math.min(30, hookScore);
  }

  private calculateProfessionalTone(content: string): number {
    let score = 0;
    const words = content.toLowerCase().split(/\s+/);
    
    // Professional keywords
    const professionalWords = ['insights', 'strategy', 'innovation', 'leadership', 'growth', 'analysis', 'framework'];
    professionalWords.forEach(word => {
      if (words.includes(word)) score += 5;
    });
    
    // Avoid casual language
    const casualWords = ['lol', 'omg', 'btw', 'gonna', 'wanna'];
    casualWords.forEach(word => {
      if (words.includes(word)) score -= 5;
    });
    
    return Math.max(0, Math.min(20, score));
  }

  private calculateInsightScore(content: string): number {
    let score = 0;
    
    // Check for statistics or numbers
    if (content.match(/\d+%/)) score += 10;
    if (content.match(/\$[\d,]+/)) score += 5;
    
    // Check for structured content
    if (content.includes('1.') || content.includes('•')) score += 10;
    
    return Math.min(25, score);
  }

  private getViralTier(score: number): string {
    if (score >= 80) return 'viral';
    if (score >= 60) return 'high_potential';
    if (score >= 40) return 'moderate';
    return 'low_potential';
  }

  private getRecommendations(
    score: number,
    platform: string,
    features: Record<string, number>
  ): string {
    const recommendations: string[] = [];
    
    if (score < 60) {
      // Universal recommendations
      if (features.emoji_count === 0) {
        recommendations.push('Add 1-3 relevant emojis');
      }
      if (features.question_marks === 0) {
        recommendations.push('Consider ending with a question to boost engagement');
      }
      
      // Platform-specific recommendations
      if (platform === 'tiktok') {
        if (features.hashtag_count < 3) {
          recommendations.push('Add 3-5 trending hashtags');
        }
        if (features.content_length > 150) {
          recommendations.push('Shorten caption to under 150 characters');
        }
        if (!features.hook_strength || features.hook_strength < 15) {
          recommendations.push('Start with a stronger hook (e.g., "POV:", "Wait until you see...")');
        }
      } else if (platform === 'twitter') {
        if (features.content_length > 200) {
          recommendations.push('Keep it concise - aim for 120-200 characters');
        }
        if (features.hashtag_count === 0) {
          recommendations.push('Add 1-3 relevant hashtags');
        }
      } else if (platform === 'linkedin') {
        if (features.word_count < 50) {
          recommendations.push('Expand content to at least 50 words for better reach');
        }
        if (!features.professional_tone || features.professional_tone < 10) {
          recommendations.push('Use more professional language and industry terms');
        }
        if (!features.insight_score || features.insight_score < 10) {
          recommendations.push('Add data points or actionable insights');
        }
      } else if (platform === 'instagram') {
        if (features.hashtag_count < 5) {
          recommendations.push('Use 5-10 relevant hashtags');
        }
        if (features.newline_count < 2) {
          recommendations.push('Break up text with line breaks for readability');
        }
      }
    }
    
    return recommendations.length > 0 
      ? recommendations.join('; ') 
      : 'Content is optimized for virality! Consider A/B testing variations.';
  }
}