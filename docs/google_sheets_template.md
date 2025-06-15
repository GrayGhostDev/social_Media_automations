# Google Sheets Prompt Repository Template

Create a Google Sheet with the following 5 tabs and exact column structure:

## Sheet 1: Content_Prompts
| A: Platform | B: Content_Type | C: Prompt_Template | D: Character_Limit | E: Required_Elements | F: Tone | G: AI_Model |
|-------------|-----------------|-------------------|-------------------|---------------------|---------|-------------|
| TikTok | Video_Script | You are a viral TikTok creator. Create a 10-15 second script about {TOPIC}. Start with a strong hook, build curiosity, and end with a call to action. Add [visual cues] and emojis. | 150 | hook, visual_cues, cta, emojis | energetic, trendy | gpt-4o-mini |
| Instagram | Reel_Caption | Transform {TOPIC} into an Instagram Reel caption. Use emoji bullets, include 5-10 relevant hashtags from {HASHTAGS}, and end with an engaging question. | 2200 | emojis, hashtags, question | fun, authentic | gpt-4o |
| LinkedIn | Post | Write a professional LinkedIn post about {TOPIC} that demonstrates thought leadership. Include one data point, personal insight, and end with a question. No hashtags in main text. | 800 | data_point, insight, question | professional, conversational | claude-sonnet-4 |
| Twitter | Thread | Create a Twitter thread about {TOPIC}. Hook in first tweet (max 200 chars), 3-5 tweets total, each with one complete thought. End with CTA. | 280 | hook, thread_structure, cta | informative, concise | gpt-4o-mini |
| YouTube | Shorts_Description | Write a YouTube Shorts description for {TOPIC}. Tease the value without giving everything away. Include 3-5 keywords naturally and timestamps if applicable. | 500 | keywords, teaser, timestamps | engaging, mysterious | gpt-4o |
| Facebook | Group_Post | Write a Facebook post about {TOPIC} that sparks discussion. Start with relatable experience, share value, end with "What's your experience?" | 1000 | story, value, question | friendly, community | claude-sonnet-4 |

## Sheet 2: Research_Prompts
| A: Research_Type | B: Platform | C: Query_Prompt | D: Update_Frequency | E: Priority | F: API_Endpoint | G: Headers |
|------------------|------------|-----------------|-------------------|------------|----------------|------------|
| Trending_Topics | TikTok | trending {INDUSTRY} content ideas | hourly | high | https://api.macrocosmos.ai/query?q={QUERY} | Authorization: Bearer {MACROCOSMOS_KEY} |
| Hashtags | Instagram | top performing hashtags for {NICHE} | daily | medium | https://api.ritetag.com/v1/hashtag-suggestions/hashtag/{QUERY} | Authorization: Bearer {RITETAG_KEY} |
| Competitors | All | {COMPETITOR} recent viral posts | 6_hours | high | https://api.buzzsumo.com/search/articles.json?q={QUERY} | api_key: {BUZZSUMO_KEY} |
| Keywords | Google | {TOPIC} search trends {GEO} | daily | medium | https://serpapi.com/search?q={QUERY}&location={GEO} | api_key: {SERPAPI_KEY} |
| Industry_News | LinkedIn | latest {INDUSTRY} developments | 12_hours | low | https://api.perplexity.ai/v1/answer | Authorization: Bearer {PPLX_KEY} |

## Sheet 3: Publishing_Prompts
| A: Platform | B: Post_Type | C: Format_Template | D: Media_Requirements | E: Quality_Checks | F: Platform_Limits |
|-------------|--------------|-------------------|---------------------|------------------|-------------------|
| TikTok | Video | {CAPTION}\n\n{HASHTAGS} | vertical_video_9:16, max_60s | hook_in_3s, captions_burned | caption_150_chars, 5_hashtags |
| Instagram | Reel | {HOOK}\n\n{CONTENT}\n\n{CTA}\n\n{HASHTAGS} | square_or_vertical, max_90s | first_line_impact, emoji_spacing | caption_2200_chars, 30_hashtags |
| LinkedIn | Article | {HEADLINE}\n\n{CONTENT}\n\n{QUESTION}\n\n#LinkedInTips #{INDUSTRY} | image_1200x628_optional | professional_tone, no_clickbait | post_3000_chars, 5_hashtags |
| Twitter | Tweet | {CONTENT} {HASHTAGS} | image_16:9_optional | under_250_chars, natural_language | tweet_280_chars, 3_hashtags |
| YouTube | Short | {TITLE}\n\n{DESCRIPTION}\n\n#Shorts #{NICHE} | vertical_video_9:16, max_60s | clear_thumbnail, keywords_in_title | title_100_chars, desc_5000_chars |
| Facebook | Post | {CONTENT}\n\n{QUESTION} | any_media_type | engagement_focused, authentic | post_63206_chars |

## Sheet 4: Analysis_Prompts
| A: Analysis_Type | B: Data_Source | C: Analysis_Prompt | D: Output_Format | E: Frequency | F: Recipients |
|------------------|----------------|-------------------|------------------|--------------|---------------|
| Daily_Performance | GA4+Platform | Analyze today's social media performance. Highlight top post, worst performer, and 3 actionable improvements. Use data: {METRICS} | bullet_points | daily | {DIGEST_RECIPIENTS} |
| Weekly_Trends | All_Platforms | Identify content patterns from this week. What topics, formats, and posting times drove most engagement? Data: {WEEKLY_DATA} | executive_summary | weekly | {DIGEST_RECIPIENTS} |
| Content_Audit | Database | Review last 30 days of content. Which AI models produced highest engagement? What content types need improvement? | table_with_insights | monthly | {DIGEST_RECIPIENTS} |
| ROI_Analysis | Cost+Revenue | Calculate ROI per platform and content type. Factor in AI costs, time spent, and revenue generated. Data: {FINANCIAL_DATA} | financial_report | weekly | {DIGEST_RECIPIENTS} |
| Competitor_Benchmark | BuzzSumo | Compare our performance vs top 3 competitors. Where are we winning/losing? Suggest 3 strategies. | comparison_chart | bi-weekly | {DIGEST_RECIPIENTS} |

## Sheet 5: Input_Templates
| A: Template_Name | B: Required_Fields | C: Field_Types | D: Validation_Rules | E: Example_Values |
|------------------|-------------------|----------------|-------------------|-------------------|
| content_idea | topic, industry, target_audience | string, string, string | topic_min_10_chars, industry_from_enum, audience_not_empty | "AI in Healthcare", "technology", "IT professionals" |
| campaign_brief | campaign_name, platforms, duration, goals | string, array, number, array | name_required, platforms_min_1, duration_days_1_365, goals_measurable | "Summer Launch", ["instagram","tiktok"], 30, ["awareness","engagement"] |
| competitor_analysis | competitor_name, platforms_to_analyze | string, array | competitor_valid_handle, platforms_supported | "@techcrunch", ["twitter","linkedin"] |
| trend_research | keywords, geo_location, timeframe | array, string, string | keywords_min_1_max_10, geo_valid_code, timeframe_enum | ["AI","automation"], "US", "last_7_days" |

## Setup Instructions

1. Create a new Google Sheet
2. Create 5 tabs with exact names: Content_Prompts, Research_Prompts, Publishing_Prompts, Analysis_Prompts, Input_Templates
3. Copy the headers exactly as shown (A, B, C, etc.)
4. Fill with your organization's specific prompts and templates
5. Share with service account email from SHEETS_SERVICE_CREDS
6. Copy the Sheet ID from the URL and add to .env as SHEETS_ID

## Variable Placeholders

- `{TOPIC}` - Main subject from content idea
- `{INDUSTRY}` - Target industry vertical  
- `{HASHTAGS}` - Platform-specific trending tags
- `{QUERY}` - Search query for APIs
- `{GEO}` - Geographic location code
- `{METRICS}` - Performance data JSON
- `{COMPETITOR}` - Competitor handle/name
- `{NICHE}` - Content niche/category
- Any ALL_CAPS wrapped in {} will be replaced at runtime