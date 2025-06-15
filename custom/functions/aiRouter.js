// Enhanced AI Router with multi-model support and cost optimization
module.exports = {
  // Main routing function
  route: function(content, options = {}) {
    const {
      content_type = 'general',
      platform = 'general',
      complexity = 'medium',
      word_count = 0,
      max_cost = 0.10,
      preferred_model = null,
      fallback_enabled = true
    } = options;

    // Model definitions with capabilities and costs
    const models = {
      'gpt-4o': {
        cost_per_1k: 0.03,
        capabilities: ['general', 'analysis', 'creative', 'technical'],
        max_tokens: 4096,
        quality: 0.95,
        speed: 0.7
      },
      'gpt-4o-mini': {
        cost_per_1k: 0.0015,
        capabilities: ['general', 'captions', 'simple'],
        max_tokens: 4096,
        quality: 0.85,
        speed: 0.9
      },
      'claude-sonnet-4': {
        cost_per_1k: 0.015,
        capabilities: ['creative', 'storytelling', 'long-form', 'analysis'],
        max_tokens: 8192,
        quality: 0.95,
        speed: 0.6
      },
      'claude-3-haiku': {
        cost_per_1k: 0.00025,
        capabilities: ['simple', 'fast', 'moderation'],
        max_tokens: 4096,
        quality: 0.75,
        speed: 0.95
      },
      'gemini-1.5-pro': {
        cost_per_1k: 0.00125,
        capabilities: ['multimodal', 'analysis', 'creative'],
        max_tokens: 8192,
        quality: 0.9,
        speed: 0.8
      },
      'groq-llama-3-70b': {
        cost_per_1k: 0.0008,
        capabilities: ['fast', 'general', 'coding'],
        max_tokens: 8192,
        quality: 0.85,
        speed: 0.98
      }
    };

    // Content type to model mapping
    const contentTypeMap = {
      'story': ['claude-sonnet-4', 'gpt-4o'],
      'caption': ['gpt-4o-mini', 'groq-llama-3-70b'],
      'hook': ['gpt-4o', 'claude-sonnet-4'],
      'script': ['claude-sonnet-4', 'gpt-4o'],
      'analysis': ['gpt-4o', 'gemini-1.5-pro'],
      'moderation': ['claude-3-haiku', 'gpt-4o-mini'],
      'general': ['gpt-4o-mini', 'groq-llama-3-70b', 'gpt-4o']
    };

    // Platform-specific preferences
    const platformPreferences = {
      'tiktok': { preferred: ['gpt-4o-mini', 'groq-llama-3-70b'], max_length: 150 },
      'twitter': { preferred: ['gpt-4o-mini', 'groq-llama-3-70b'], max_length: 280 },
      'instagram': { preferred: ['gpt-4o', 'claude-sonnet-4'], max_length: 2200 },
      'linkedin': { preferred: ['gpt-4o', 'claude-sonnet-4'], max_length: 3000 },
      'youtube': { preferred: ['claude-sonnet-4', 'gpt-4o'], max_length: 5000 }
    };

    // Calculate estimated tokens
    const estimated_tokens = Math.ceil(word_count / 0.75) + 500; // buffer for response

    // Get candidate models
    let candidates = contentTypeMap[content_type] || contentTypeMap['general'];
    
    // Apply platform preferences
    if (platformPreferences[platform]) {
      const platformModels = platformPreferences[platform].preferred;
      candidates = candidates.filter(m => platformModels.includes(m));
      if (candidates.length === 0) candidates = platformModels;
    }

    // Apply preferred model if specified
    if (preferred_model && models[preferred_model]) {
      candidates = [preferred_model, ...candidates.filter(m => m !== preferred_model)];
    }

    // Score and rank models
    const scoredModels = candidates.map(modelName => {
      const model = models[modelName];
      const cost = (estimated_tokens / 1000) * model.cost_per_1k;
      
      // Calculate score based on quality, speed, and cost
      let score = model.quality * 0.5 + model.speed * 0.3 + (1 - cost / max_cost) * 0.2;
      
      // Boost score for content type match
      if (model.capabilities.includes(content_type)) score += 0.1;
      
      // Penalty if cost exceeds budget
      if (cost > max_cost) score -= 0.5;
      
      return {
        model: modelName,
        score,
        cost,
        details: model
      };
    }).sort((a, b) => b.score - a.score);

    // Select primary and fallback models
    const primary = scoredModels[0];
    const fallbacks = fallback_enabled ? scoredModels.slice(1, 3) : [];

    return {
      model: primary.model,
      estimated_cost: primary.cost,
      fallback_models: fallbacks.map(f => f.model),
      reasoning: this.explainChoice(primary, content_type, platform),
      config: {
        temperature: this.getTemperature(content_type),
        max_tokens: Math.min(estimated_tokens + 200, primary.details.max_tokens),
        top_p: content_type === 'creative' ? 0.9 : 0.7,
        frequency_penalty: platform === 'twitter' ? 0.3 : 0.0,
        presence_penalty: content_type === 'story' ? 0.6 : 0.0
      }
    };
  },

  // Explain model choice
  explainChoice: function(choice, content_type, platform) {
    const reasons = [];
    
    if (choice.model.includes('claude') && content_type === 'story') {
      reasons.push('Claude excels at creative storytelling');
    }
    if (choice.model.includes('mini') && choice.cost < 0.01) {
      reasons.push('Cost-effective for simple tasks');
    }
    if (choice.model.includes('gpt-4o') && content_type === 'analysis') {
      reasons.push('GPT-4o provides superior analytical capabilities');
    }
    if (choice.model.includes('groq') && platform === 'twitter') {
      reasons.push('Groq offers fastest response for real-time needs');
    }
    
    return reasons.join('; ') || 'Optimal balance of quality and cost';
  },

  // Get temperature setting by content type
  getTemperature: function(content_type) {
    const temperatures = {
      'story': 0.9,
      'creative': 0.85,
      'hook': 0.8,
      'caption': 0.7,
      'analysis': 0.3,
      'moderation': 0.1,
      'general': 0.7
    };
    return temperatures[content_type] || 0.7;
  },

  // Cost calculator helper
  calculateCost: function(model, tokens) {
    const models = {
      'gpt-4o': { input: 0.01, output: 0.03 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'claude-sonnet-4': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
      'groq-llama-3-70b': { input: 0.0008, output: 0.0008 }
    };
    
    const rates = models[model] || models['gpt-4o-mini'];
    const input_cost = (tokens.input / 1000) * rates.input;
    const output_cost = (tokens.output / 1000) * rates.output;
    
    return {
      input_cost,
      output_cost,
      total_cost: input_cost + output_cost,
      model,
      tokens
    };
  },

  // Batch routing for multiple requests
  batchRoute: function(requests) {
    return requests.map(req => ({
      ...req,
      routing: this.route(req.content, req.options)
    }));
  }
};