// Prompt Selector - Retrieves prompts from Google Sheets cache based on platform, content type, and phase
module.exports = {
  // Main selection function
  select: function(phase, platform, contentType, options = {}) {
    const {
      prompts = global.prompts || {},
      variables = {},
      fallbackEnabled = true
    } = options;

    // Validate inputs
    if (!phase || !prompts[phase]) {
      throw new Error(`Invalid phase: ${phase}. Expected one of: Content_Prompts, Research_Prompts, Publishing_Prompts, Analysis_Prompts`);
    }

    // Get the appropriate sheet data
    const sheetData = prompts[phase];
    if (!sheetData || !Array.isArray(sheetData)) {
      if (fallbackEnabled) {
        return this.getFallbackPrompt(phase, platform, contentType);
      }
      throw new Error(`No data found for phase: ${phase}`);
    }

    // Find matching row based on criteria
    let matchedRow = null;
    
    switch (phase) {
      case 'Content_Prompts':
        matchedRow = sheetData.find(row => 
          row.Platform?.toLowerCase() === platform?.toLowerCase() && 
          row.Content_Type?.toLowerCase() === contentType?.toLowerCase()
        );
        break;
        
      case 'Research_Prompts':
        matchedRow = sheetData.find(row => 
          row.Research_Type?.toLowerCase() === contentType?.toLowerCase() ||
          row.Platform?.toLowerCase() === platform?.toLowerCase()
        );
        break;
        
      case 'Publishing_Prompts':
        matchedRow = sheetData.find(row => 
          row.Platform?.toLowerCase() === platform?.toLowerCase()
        );
        break;
        
      case 'Analysis_Prompts':
        matchedRow = sheetData.find(row => 
          row.Analysis_Type?.toLowerCase() === contentType?.toLowerCase()
        );
        break;
    }

    // If no exact match, try partial matches
    if (!matchedRow && fallbackEnabled) {
      matchedRow = sheetData.find(row => 
        row.Platform?.toLowerCase() === platform?.toLowerCase() ||
        row.Platform?.toLowerCase() === 'all'
      );
    }

    // If still no match, use fallback
    if (!matchedRow) {
      if (fallbackEnabled) {
        return this.getFallbackPrompt(phase, platform, contentType);
      }
      throw new Error(`No prompt found for: ${phase} - ${platform} - ${contentType}`);
    }

    // Process the matched row
    const result = this.processRow(matchedRow, phase, variables);
    
    return result;
  },

  // Process a row and replace variables
  processRow: function(row, phase, variables = {}) {
    const result = {
      raw: { ...row },
      processed: {}
    };

    // Phase-specific processing
    switch (phase) {
      case 'Content_Prompts':
        result.processed = {
          platform: row.Platform,
          contentType: row.Content_Type,
          prompt: this.replaceVariables(row.Prompt_Template, variables),
          characterLimit: parseInt(row.Character_Limit) || 1000,
          requiredElements: this.parseList(row.Required_Elements),
          tone: row.Tone,
          aiModel: row.AI_Model || 'gpt-4o-mini',
          temperature: this.getToneTemperature(row.Tone)
        };
        break;

      case 'Research_Prompts':
        result.processed = {
          researchType: row.Research_Type,
          platform: row.Platform,
          query: this.replaceVariables(row.Query_Prompt, variables),
          updateFrequency: row.Update_Frequency,
          priority: row.Priority,
          endpoint: this.replaceVariables(row.API_Endpoint, variables),
          headers: this.parseHeaders(row.Headers, variables)
        };
        break;

      case 'Publishing_Prompts':
        result.processed = {
          platform: row.Platform,
          postType: row.Post_Type,
          formatTemplate: this.replaceVariables(row.Format_Template, variables),
          mediaRequirements: this.parseList(row.Media_Requirements),
          qualityChecks: this.parseList(row.Quality_Checks),
          platformLimits: this.parseLimits(row.Platform_Limits)
        };
        break;

      case 'Analysis_Prompts':
        result.processed = {
          analysisType: row.Analysis_Type,
          dataSource: row.Data_Source,
          prompt: this.replaceVariables(row.Analysis_Prompt, variables),
          outputFormat: row.Output_Format,
          frequency: row.Frequency,
          recipients: this.parseRecipients(row.Recipients, variables)
        };
        break;
    }

    return result.processed;
  },

  // Replace variables in template strings
  replaceVariables: function(template, variables = {}) {
    if (!template) return '';
    
    let processed = template;
    
    // Replace all {VARIABLE} patterns
    const matches = template.match(/\{([A-Z_]+)\}/g) || [];
    matches.forEach(match => {
      const varName = match.slice(1, -1); // Remove { }
      const value = variables[varName] || 
                   process.env[varName] || 
                   `[${varName}]`; // Fallback to show missing variable
      processed = processed.replace(match, value);
    });
    
    return processed;
  },

  // Parse comma-separated lists
  parseList: function(listString) {
    if (!listString) return [];
    return listString.split(',').map(item => item.trim()).filter(Boolean);
  },

  // Parse platform limits
  parseLimits: function(limitsString) {
    if (!limitsString) return {};
    
    const limits = {};
    const parts = this.parseList(limitsString);
    
    parts.forEach(part => {
      const match = part.match(/^(.+?)_(\d+)_(.+)$/);
      if (match) {
        const [, key, value, unit] = match;
        limits[key] = { value: parseInt(value), unit };
      }
    });
    
    return limits;
  },

  // Parse headers string
  parseHeaders: function(headersString, variables = {}) {
    if (!headersString) return {};
    
    const headers = {};
    const parts = headersString.split(';').map(h => h.trim());
    
    parts.forEach(part => {
      const [key, value] = part.split(':').map(s => s.trim());
      if (key && value) {
        headers[key] = this.replaceVariables(value, variables);
      }
    });
    
    return headers;
  },

  // Parse recipients
  parseRecipients: function(recipientsString, variables = {}) {
    const processed = this.replaceVariables(recipientsString, variables);
    return this.parseList(processed);
  },

  // Get temperature based on tone
  getToneTemperature: function(tone) {
    const toneMap = {
      'professional': 0.3,
      'conversational': 0.7,
      'creative': 0.9,
      'energetic': 0.8,
      'fun': 0.85,
      'authentic': 0.7,
      'informative': 0.5,
      'engaging': 0.75,
      'friendly': 0.8,
      'mysterious': 0.6
    };
    
    return toneMap[tone?.toLowerCase()] || 0.7;
  },

  // Get fallback prompts when sheets data is unavailable
  getFallbackPrompt: function(phase, platform, contentType) {
    const fallbacks = {
      Content_Prompts: {
        prompt: `Create engaging ${platform} content about {TOPIC}`,
        characterLimit: 1000,
        requiredElements: ['hook', 'value', 'cta'],
        tone: 'conversational',
        aiModel: 'gpt-4o-mini',
        temperature: 0.7
      },
      Research_Prompts: {
        researchType: 'general',
        query: `trending ${contentType} topics`,
        endpoint: 'https://www.google.com/search?q={QUERY}',
        headers: {},
        updateFrequency: 'daily',
        priority: 'medium'
      },
      Publishing_Prompts: {
        formatTemplate: '{CONTENT}',
        mediaRequirements: [],
        qualityChecks: ['length_check', 'brand_voice'],
        platformLimits: { characters: { value: 1000, unit: 'chars' } }
      },
      Analysis_Prompts: {
        prompt: `Analyze performance data and provide insights`,
        outputFormat: 'summary',
        frequency: 'daily',
        recipients: ['team@example.com']
      }
    };

    console.warn(`Using fallback prompt for ${phase} - ${platform} - ${contentType}`);
    return fallbacks[phase] || fallbacks.Content_Prompts;
  },

  // Batch select for multiple platforms/types
  batchSelect: function(requests, options = {}) {
    return requests.map(req => {
      try {
        return {
          ...req,
          prompt: this.select(req.phase, req.platform, req.contentType, {
            ...options,
            variables: { ...options.variables, ...req.variables }
          })
        };
      } catch (error) {
        return {
          ...req,
          error: error.message,
          prompt: this.getFallbackPrompt(req.phase, req.platform, req.contentType)
        };
      }
    });
  },

  // Validate all prompts in cache
  validateCache: function(prompts) {
    const issues = [];
    const requiredSheets = ['Content_Prompts', 'Research_Prompts', 'Publishing_Prompts', 'Analysis_Prompts'];
    
    requiredSheets.forEach(sheet => {
      if (!prompts[sheet]) {
        issues.push(`Missing sheet: ${sheet}`);
      } else if (!Array.isArray(prompts[sheet]) || prompts[sheet].length === 0) {
        issues.push(`Empty sheet: ${sheet}`);
      }
    });

    // Check for required columns
    if (prompts.Content_Prompts && prompts.Content_Prompts.length > 0) {
      const requiredCols = ['Platform', 'Content_Type', 'Prompt_Template'];
      const firstRow = prompts.Content_Prompts[0];
      requiredCols.forEach(col => {
        if (!firstRow.hasOwnProperty(col)) {
          issues.push(`Missing column in Content_Prompts: ${col}`);
        }
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
};