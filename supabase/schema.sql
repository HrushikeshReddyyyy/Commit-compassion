-- Supabase SQL Schema for Commit Companion
-- This schema includes tables for session management and vector embeddings for code search

-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- SESSIONS TABLE
-- Stores agent execution sessions and their logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Issue information
    issue_url TEXT NOT NULL,
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    issue_number INTEGER NOT NULL,
    issue_title TEXT,
    issue_body TEXT,

    -- Session status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

    -- Agent logs stored as JSONB array
    agent_logs JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Results
    proposed_fix JSONB,
    pr_url TEXT,
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for querying sessions by repository
CREATE INDEX IF NOT EXISTS idx_sessions_repo ON sessions (repo_owner, repo_name);

-- Index for querying sessions by status
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions (status);

-- Index for querying recent sessions
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions (created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- REPO_EMBEDDINGS TABLE
-- Stores vector embeddings for code files to enable semantic search
-- ============================================================================

CREATE TABLE IF NOT EXISTS repo_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Repository information
    repo_owner TEXT NOT NULL,
    repo_name TEXT NOT NULL,

    -- File information
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL, -- SHA hash of file content for change detection
    content TEXT NOT NULL,

    -- Vector embedding (1536 dimensions for OpenAI embeddings)
    embedding vector(1536) NOT NULL,

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Ensure unique file paths per repository
    UNIQUE (repo_owner, repo_name, file_path)
);

-- Index for querying by repository
CREATE INDEX IF NOT EXISTS idx_repo_embeddings_repo ON repo_embeddings (repo_owner, repo_name);

-- Index for vector similarity search using HNSW (faster for large datasets)
CREATE INDEX IF NOT EXISTS idx_repo_embeddings_vector ON repo_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_repo_embeddings_updated_at
    BEFORE UPDATE ON repo_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to search for similar documents using vector similarity
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_repo_owner TEXT DEFAULT NULL,
    filter_repo_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    file_path TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        re.id,
        re.file_path,
        re.content,
        1 - (re.embedding <=> query_embedding) AS similarity
    FROM repo_embeddings re
    WHERE
        (filter_repo_owner IS NULL OR re.repo_owner = filter_repo_owner)
        AND (filter_repo_name IS NULL OR re.repo_name = filter_repo_name)
        AND 1 - (re.embedding <=> query_embedding) > match_threshold
    ORDER BY re.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to upsert a file embedding
CREATE OR REPLACE FUNCTION upsert_embedding(
    p_repo_owner TEXT,
    p_repo_name TEXT,
    p_file_path TEXT,
    p_file_hash TEXT,
    p_content TEXT,
    p_embedding vector(1536),
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    result_id UUID;
BEGIN
    INSERT INTO repo_embeddings (
        repo_owner,
        repo_name,
        file_path,
        file_hash,
        content,
        embedding,
        metadata
    )
    VALUES (
        p_repo_owner,
        p_repo_name,
        p_file_path,
        p_file_hash,
        p_content,
        p_embedding,
        p_metadata
    )
    ON CONFLICT (repo_owner, repo_name, file_path)
    DO UPDATE SET
        file_hash = EXCLUDED.file_hash,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO result_id;

    RETURN result_id;
END;
$$;

-- Function to delete all embeddings for a repository
CREATE OR REPLACE FUNCTION delete_repo_embeddings(
    p_repo_owner TEXT,
    p_repo_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM repo_embeddings
    WHERE repo_owner = p_repo_owner AND repo_name = p_repo_name;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable these policies based on your authentication setup
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repo_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy for sessions - users can only see their own sessions
-- Uncomment and modify based on your auth setup
-- CREATE POLICY "Users can view own sessions" ON sessions
--     FOR SELECT
--     USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own sessions" ON sessions
--     FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- For development, allow all operations (remove in production)
CREATE POLICY "Allow all for development" ON sessions
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for development" ON repo_embeddings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO sessions (issue_url, repo_owner, repo_name, issue_number, issue_title, status)
VALUES
    ('https://github.com/vercel/next.js/issues/12345', 'vercel', 'next.js', 12345, 'Fix routing bug', 'completed'),
    ('https://github.com/facebook/react/issues/67890', 'facebook', 'react', 67890, 'Update hooks API', 'running');
*/
