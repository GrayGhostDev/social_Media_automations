// Smart Scheduler - Calculates optimal posting times based on platform, timezone, and competitor gaps
module.exports = {
  // Main scheduling function
  calculateBestTime: function(platform, options = {}) {
    const {
      target_timezone = 'America/New_York',
      content_type = 'general',
      competitor_data = null,
      user_analytics = null,
      avoid_conflicts = true,
      scheduling_window_days = 7
    } = options;

    // Platform heat maps (best engagement times in UTC)
    const platformHeatMaps = {
      tiktok: {
        peak_hours: [
          { hour: 6, score: 0.8 },   // 6 AM
          { hour: 10, score: 0.9 },  // 10 AM
          { hour: 19, score: 1.0 },  // 7 PM
          { hour: 20, score: 0.95 }  // 8 PM
        ],
        peak_days: {
          'tuesday': 1.1,
          'wednesday': 1.1,
          'thursday': 1.15,
          'friday': 1.0,
          'saturday': 0.9,
          'sunday': 0.95,
          'monday': 0.85
        }
      },
      instagram: {
        peak_hours: [
          { hour: 11, score: 0.9 },
          { hour: 12, score: 0.95 },
          { hour: 17, score: 1.0 },
          { hour: 19, score: 0.9 }
        ],
        peak_days: {
          'monday': 0.9,
          'tuesday': 0.95,
          'wednesday': 1.0,
          'thursday': 0.95,
          'friday': 0.85,
          'saturday': 0.8,
          'sunday': 0.85
        }
      },
      twitter: {
        peak_hours: [
          { hour: 8, score: 0.85 },
          { hour: 9, score: 0.9 },
          { hour: 15, score: 0.95 },
          { hour: 17, score: 1.0 }
        ],
        peak_days: {
          'monday': 0.95,
          'tuesday': 1.0,
          'wednesday': 1.0,
          'thursday': 0.95,
          'friday': 0.85,
          'saturday': 0.7,
          'sunday': 0.75
        }
      },
      linkedin: {
        peak_hours: [
          { hour: 7, score: 0.9 },
          { hour: 8, score: 0.95 },
          { hour: 12, score: 0.9 },
          { hour: 17, score: 1.0 }
        ],
        peak_days: {
          'monday': 0.85,
          'tuesday': 1.0,
          'wednesday': 1.0,
          'thursday': 0.95,
          'friday': 0.8,
          'saturday': 0.5,
          'sunday': 0.6
        }
      },
      facebook: {
        peak_hours: [
          { hour: 9, score: 0.85 },
          { hour: 13, score: 0.9 },
          { hour: 15, score: 0.95 },
          { hour: 19, score: 1.0 }
        ],
        peak_days: {
          'monday': 0.85,
          'tuesday': 0.9,
          'wednesday': 0.95,
          'thursday': 1.0,
          'friday': 0.95,
          'saturday': 0.85,
          'sunday': 0.9
        }
      },
      youtube: {
        peak_hours: [
          { hour: 14, score: 0.9 },
          { hour: 15, score: 0.95 },
          { hour: 20, score: 1.0 },
          { hour: 21, score: 0.95 }
        ],
        peak_days: {
          'monday': 0.85,
          'tuesday': 0.9,
          'wednesday': 0.9,
          'thursday': 0.95,
          'friday': 1.0,
          'saturday': 1.0,
          'sunday': 0.95
        }
      }
    };

    // Get platform heat map
    const heatMap = platformHeatMaps[platform] || platformHeatMaps.twitter;

    // Calculate timezone offset
    const timezoneOffsets = {
      'America/New_York': -5,
      'America/Chicago': -6,
      'America/Denver': -7,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Australia/Sydney': 11
    };
    const offset = timezoneOffsets[target_timezone] || -5;

    // Generate candidate times for the next week
    const candidates = [];
    const now = new Date();
    
    for (let dayOffset = 0; dayOffset < scheduling_window_days; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const dayScore = heatMap.peak_days[dayName] || 0.8;

      heatMap.peak_hours.forEach(({ hour, score }) => {
        const candidateTime = new Date(date);
        candidateTime.setUTCHours(hour - offset, 0, 0, 0);
        
        // Skip times in the past
        if (candidateTime < now) return;

        let finalScore = score * dayScore;

        // Apply content type modifiers
        if (content_type === 'video' && platform === 'youtube') {
          finalScore *= 1.1; // Boost video content on YouTube
        }
        if (content_type === 'story' && (platform === 'instagram' || platform === 'facebook')) {
          finalScore *= 1.05; // Stories perform better at certain times
        }

        // Check competitor gaps
        if (competitor_data && avoid_conflicts) {
          const conflictScore = this.checkCompetitorConflicts(candidateTime, competitor_data);
          finalScore *= conflictScore;
        }

        // Boost based on user's historical performance
        if (user_analytics) {
          const historicalBoost = this.getHistoricalBoost(candidateTime, user_analytics);
          finalScore *= historicalBoost;
        }

        candidates.push({
          time: candidateTime,
          score: finalScore,
          day: dayName,
          hour: candidateTime.getHours(),
          reasoning: this.explainTiming(platform, dayName, candidateTime.getHours(), finalScore)
        });
      });
    }

    // Sort by score and return top options
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    const alternatives = candidates.slice(1, 4);

    return {
      best_time: best.time.toISOString(),
      score: Math.round(best.score * 100) / 100,
      reasoning: best.reasoning,
      alternatives: alternatives.map(alt => ({
        time: alt.time.toISOString(),
        score: Math.round(alt.score * 100) / 100,
        reasoning: alt.reasoning
      })),
      platform,
      timezone: target_timezone,
      factors: {
        day_weight: heatMap.peak_days[best.day],
        hour_weight: best.score / (heatMap.peak_days[best.day] || 1),
        competitor_gap: avoid_conflicts ? 'considered' : 'ignored',
        content_type_boost: content_type
      }
    };
  },

  // Check for competitor posting conflicts
  checkCompetitorConflicts: function(time, competitor_data) {
    if (!competitor_data || !competitor_data.recent_posts) return 1.0;

    const hourWindow = 2; // Avoid posting within 2 hours of competitors
    let conflictScore = 1.0;

    competitor_data.recent_posts.forEach(post => {
      const postTime = new Date(post.timestamp);
      const hourDiff = Math.abs(time - postTime) / (1000 * 60 * 60);
      
      if (hourDiff < hourWindow) {
        // Reduce score based on competitor's engagement
        const competitorImpact = post.engagement_rate || 0.05;
        conflictScore *= (1 - competitorImpact * 0.5);
      }
    });

    return Math.max(0.3, conflictScore); // Don't reduce below 30%
  },

  // Get historical performance boost
  getHistoricalBoost: function(time, user_analytics) {
    if (!user_analytics || !user_analytics.past_performance) return 1.0;

    const hour = time.getHours();
    const day = time.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Look for similar posts in history
    const similar = user_analytics.past_performance.filter(post => {
      const postTime = new Date(post.timestamp);
      return postTime.getHours() === hour && 
             postTime.toLocaleDateString('en-US', { weekday: 'lowercase' }) === day;
    });

    if (similar.length === 0) return 1.0;

    // Calculate average performance
    const avgEngagement = similar.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / similar.length;
    const baseline = user_analytics.baseline_engagement || 0.05;
    
    return Math.max(0.8, Math.min(1.5, avgEngagement / baseline));
  },

  // Explain timing choice
  explainTiming: function(platform, day, hour, score) {
    const reasons = [];
    
    // Time-based reasons
    if (hour >= 7 && hour <= 9) {
      reasons.push('Morning commute time - high mobile usage');
    } else if (hour >= 12 && hour <= 13) {
      reasons.push('Lunch break - peak engagement window');
    } else if (hour >= 17 && hour <= 19) {
      reasons.push('Evening hours - users unwinding after work');
    } else if (hour >= 20 && hour <= 22) {
      reasons.push('Prime time - maximum user activity');
    }

    // Platform-specific reasons
    if (platform === 'linkedin' && (day === 'tuesday' || day === 'wednesday')) {
      reasons.push('Mid-week professional engagement peak');
    }
    if (platform === 'tiktok' && hour >= 19) {
      reasons.push('Peak TikTok scrolling hours');
    }
    if (platform === 'instagram' && day === 'wednesday') {
      reasons.push('Instagram hump-day engagement boost');
    }

    // Score-based reasons
    if (score > 0.9) {
      reasons.push('Optimal timing based on platform analytics');
    }

    return reasons.join('; ');
  },

  // Batch scheduling for multiple posts
  scheduleBatch: function(posts, options = {}) {
    const { min_spacing_hours = 4, distribute_platforms = true } = options;
    const scheduled = [];
    const usedSlots = [];

    posts.forEach((post, index) => {
      let bestTime = this.calculateBestTime(post.platform, {
        ...options,
        ...post.options
      });

      // Check for conflicts with already scheduled posts
      let attempts = 0;
      while (this.hasConflict(bestTime.best_time, usedSlots, min_spacing_hours) && attempts < 3) {
        // Use an alternative time
        if (bestTime.alternatives[attempts]) {
          bestTime.best_time = bestTime.alternatives[attempts].time;
          bestTime.score = bestTime.alternatives[attempts].score;
          bestTime.reasoning = bestTime.alternatives[attempts].reasoning;
        }
        attempts++;
      }

      usedSlots.push({
        time: bestTime.best_time,
        platform: post.platform
      });

      scheduled.push({
        ...post,
        scheduled_time: bestTime.best_time,
        scheduling_score: bestTime.score,
        scheduling_reasoning: bestTime.reasoning
      });
    });

    return scheduled;
  },

  // Check for scheduling conflicts
  hasConflict: function(time, usedSlots, min_spacing_hours) {
    const checkTime = new Date(time);
    
    return usedSlots.some(slot => {
      const slotTime = new Date(slot.time);
      const hourDiff = Math.abs(checkTime - slotTime) / (1000 * 60 * 60);
      return hourDiff < min_spacing_hours;
    });
  }
};