-- Run this SQL in your Supabase SQL Editor to create the required table
CREATE TABLE IF NOT EXISTS kv_store_21f56fa4 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row Level Security (RLS) is recommended but for this simple KV store used by the service role, 
-- we need to ensure the service role can access it.
ALTER TABLE kv_store_21f56fa4 ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Enable access for service role" ON kv_store_21f56fa4
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
