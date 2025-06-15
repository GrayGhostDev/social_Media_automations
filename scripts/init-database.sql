-- AI Agent Memory Schema
CREATE TABLE IF NOT EXISTS agent_memory (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255) NOT NULL,
    conversation_id VARCHAR(255),
    message_role VARCHAR(50) NOT NULL CHECK (message_role IN ('system', 'user', 'assistant')),
    message_content TEXT NOT NULL,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    cost_estimate DECIMAL(10, 6),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_agent_id (agent_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_created_at (created_at)
);

-- Post Metrics Table
CREATE TABLE IF NOT EXISTS post_metrics (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    viral_score INTEGER,
    predicted_virality INTEGER,
    actual_engagement_rate DECIMAL(5, 2),
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'published',
    variant_group VARCHAR(100),
    variant_type VARCHAR(10) CHECK (variant_type IN ('A', 'B', NULL)),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(platform, post_id),
    INDEX idx_platform (platform),
    INDEX idx_published_at (published_at),
    INDEX idx_content_hash (content_hash),
    INDEX idx_variant_group (variant_group)
);

-- Content Library
CREATE TABLE IF NOT EXISTS content_library (
    id SERIAL PRIMARY KEY,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    original_content TEXT,
    generated_content TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text',
    media_urls JSONB,
    ai_model VARCHAR(100),
    prompt_template TEXT,
    generation_params JSONB,
    viral_score INTEGER,
    moderation_status VARCHAR(50) DEFAULT 'passed',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_content_platform (platform),
    INDEX idx_content_type (content_type),
    INDEX idx_viral_score (viral_score),
    INDEX idx_tags (tags) USING GIN
);

-- Trend Tracking
CREATE TABLE IF NOT EXISTS trend_tracking (
    id SERIAL PRIMARY KEY,
    term VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    trend_score DECIMAL(5, 2),
    volume INTEGER,
    growth_rate DECIMAL(5, 2),
    geographic_region VARCHAR(10),
    category VARCHAR(100),
    related_terms JSONB,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    INDEX idx_term (term),
    INDEX idx_source (source),
    INDEX idx_discovered_at (discovered_at),
    INDEX idx_trend_score (trend_score DESC)
);

-- A/B Test Results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    variant_a_id VARCHAR(255) NOT NULL,
    variant_b_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    variant_a_value DECIMAL(10, 4),
    variant_b_value DECIMAL(10, 4),
    winner VARCHAR(1) CHECK (winner IN ('A', 'B', NULL)),
    confidence_level DECIMAL(3, 2),
    sample_size_a INTEGER,
    sample_size_b INTEGER,
    test_duration_hours INTEGER,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    INDEX idx_test_id (test_id),
    INDEX idx_platform_ab (platform),
    INDEX idx_completed_at (completed_at)
);

-- Workflow Execution Metrics
CREATE TABLE IF NOT EXISTS workflow_metrics (
    id SERIAL PRIMARY KEY,
    workflow_id VARCHAR(255) NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    nodes_executed INTEGER,
    nodes_failed INTEGER,
    total_cost DECIMAL(10, 6),
    error_message TEXT,
    metadata JSONB,
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_execution_id (execution_id),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time DESC)
);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    task_type VARCHAR(100) NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    cost DECIMAL(10, 6),
    success BOOLEAN DEFAULT TRUE,
    error_type VARCHAR(100),
    platform VARCHAR(50),
    quality_score DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model_name (model_name),
    INDEX idx_task_type (task_type),
    INDEX idx_created_at (created_at DESC)
);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_post_metrics_updated_at BEFORE UPDATE
    ON post_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for daily analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_platform_analytics AS
SELECT 
    DATE(published_at) as date,
    platform,
    COUNT(*) as total_posts,
    AVG(viral_score) as avg_viral_score,
    AVG(actual_engagement_rate) as avg_engagement_rate,
    SUM(likes) as total_likes,
    SUM(shares) as total_shares,
    SUM(comments) as total_comments,
    SUM(views) as total_views,
    COUNT(CASE WHEN variant_type IS NOT NULL THEN 1 END) as ab_tests_run,
    COUNT(CASE WHEN actual_engagement_rate > 0.05 THEN 1 END) as high_performing_posts
FROM post_metrics
WHERE published_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(published_at), platform;

-- Create index on materialized view
CREATE INDEX idx_daily_analytics_date ON daily_platform_analytics(date DESC);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_daily_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_platform_analytics;
END;
$$ LANGUAGE plpgsql;