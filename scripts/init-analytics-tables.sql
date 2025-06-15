-- Additional tables for analytics storage
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for date lookups
CREATE INDEX IF NOT EXISTS idx_snapshot_date ON analytics_snapshots(date DESC);

-- Create update trigger for analytics_snapshots
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analytics_snapshots_updated_at BEFORE UPDATE
    ON analytics_snapshots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Stored procedure for analytics rollup
CREATE OR REPLACE FUNCTION calculate_platform_roi(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    platform VARCHAR(50),
    total_posts BIGINT,
    total_cost DECIMAL(10,2),
    total_revenue DECIMAL(10,2),
    roi DECIMAL(10,2),
    avg_engagement_rate DECIMAL(5,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.platform,
        COUNT(DISTINCT pm.id) as total_posts,
        COALESCE(SUM(mp.cost), 0) as total_cost,
        COALESCE(SUM(pm.metadata->>'revenue'), 0)::DECIMAL as total_revenue,
        CASE 
            WHEN SUM(mp.cost) > 0 THEN 
                ((COALESCE(SUM(pm.metadata->>'revenue'), 0)::DECIMAL - SUM(mp.cost)) / SUM(mp.cost) * 100)
            ELSE 0 
        END as roi,
        AVG(pm.actual_engagement_rate) as avg_engagement_rate
    FROM post_metrics pm
    LEFT JOIN model_performance mp ON mp.created_at::DATE = pm.published_at::DATE
    WHERE pm.published_at BETWEEN p_start_date AND p_end_date
    GROUP BY pm.platform;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for daily analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_platform_analytics AS
SELECT 
    DATE(published_at) as date,
    platform,
    COUNT(*) as posts_count,
    AVG(viral_score) as avg_viral_score,
    AVG(actual_engagement_rate) as avg_engagement,
    SUM(likes) as total_likes,
    SUM(shares) as total_shares,
    SUM(views) as total_views,
    COUNT(CASE WHEN actual_engagement_rate > 0.05 THEN 1 END) as high_performers,
    COUNT(CASE WHEN actual_engagement_rate < 0.01 THEN 1 END) as low_performers
FROM post_metrics
WHERE published_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(published_at), platform;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_platform_analytics(date DESC);

-- Analytics helper functions
CREATE OR REPLACE FUNCTION get_trending_hashtags(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    hashtag TEXT,
    usage_count BIGINT,
    avg_engagement DECIMAL(5,4),
    platforms TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH hashtag_data AS (
        SELECT 
            UNNEST(string_to_array(hashtags, ',')) as hashtag,
            platform,
            actual_engagement_rate
        FROM post_metrics
        WHERE published_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
          AND hashtags IS NOT NULL
    )
    SELECT 
        hd.hashtag,
        COUNT(*) as usage_count,
        AVG(hd.actual_engagement_rate) as avg_engagement,
        ARRAY_AGG(DISTINCT hd.platform) as platforms
    FROM hashtag_data hd
    WHERE LENGTH(TRIM(hd.hashtag)) > 0
    GROUP BY hd.hashtag
    ORDER BY COUNT(*) DESC, AVG(hd.actual_engagement_rate) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Content performance by time of day
CREATE OR REPLACE FUNCTION get_best_posting_times(p_platform VARCHAR DEFAULT NULL)
RETURNS TABLE (
    hour_of_day INTEGER,
    avg_engagement DECIMAL(5,4),
    posts_count BIGINT,
    platform VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM published_at AT TIME ZONE 'America/New_York')::INTEGER as hour_of_day,
        AVG(actual_engagement_rate) as avg_engagement,
        COUNT(*) as posts_count,
        pm.platform
    FROM post_metrics pm
    WHERE published_at >= CURRENT_DATE - INTERVAL '30 days'
      AND (p_platform IS NULL OR pm.platform = p_platform)
    GROUP BY EXTRACT(HOUR FROM published_at AT TIME ZONE 'America/New_York'), pm.platform
    HAVING COUNT(*) >= 5  -- Minimum sample size
    ORDER BY AVG(actual_engagement_rate) DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON analytics_snapshots TO n8n_user;
GRANT SELECT ON daily_platform_analytics TO n8n_user;
GRANT EXECUTE ON FUNCTION calculate_platform_roi TO n8n_user;
GRANT EXECUTE ON FUNCTION get_trending_hashtags TO n8n_user;
GRANT EXECUTE ON FUNCTION get_best_posting_times TO n8n_user;