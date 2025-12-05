-- Create AnalyticsEvent table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY,
    chat_space_id UUID NOT NULL REFERENCES chat_spaces(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('widget_load', 'chat_start', 'message_sent', 'feedback')),
    anonymous_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create DailyStat table
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY,
    chat_space_id UUID NOT NULL REFERENCES chat_spaces(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_loads INTEGER DEFAULT 0,
    total_chats INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_space_id, date)
);
