-- Additional tables for analytics storage
CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_snapshot_date (date DESC)
);

-- Create update trigger for analytics_snapshots
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