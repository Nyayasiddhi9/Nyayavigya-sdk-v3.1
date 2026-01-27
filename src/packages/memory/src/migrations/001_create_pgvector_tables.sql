-- WAI SDK Memory System - pgvector Migration
-- Creates tables for memories and vector embeddings with HNSW indexing
-- Run this migration ONCE before using the memory system
-- DO NOT run CREATE EXTENSION in application code (requires superuser)

-- ============================================================
-- STEP 1: Enable pgvector extension (run as superuser)
-- ============================================================
-- This must be run manually by a database administrator with superuser privileges.
-- If you're using Neon, pgvector is already enabled.
-- If you're using another PostgreSQL provider, run:
--   CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- STEP 2: Create memories table
-- ============================================================
CREATE TABLE IF NOT EXISTS wai_memories (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  agent_id VARCHAR(255),
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  priority INTEGER DEFAULT 50,
  ttl INTEGER,
  
  -- Constraints
  CONSTRAINT check_priority CHECK (priority >= 0 AND priority <= 100),
  CONSTRAINT check_ttl CHECK (ttl IS NULL OR ttl > 0)
);

-- ============================================================
-- STEP 3: Create indexes for memories table
-- ============================================================
CREATE INDEX IF NOT EXISTS wai_memories_type_idx ON wai_memories(type);
CREATE INDEX IF NOT EXISTS wai_memories_user_id_idx ON wai_memories(user_id);
CREATE INDEX IF NOT EXISTS wai_memories_session_id_idx ON wai_memories(session_id);
CREATE INDEX IF NOT EXISTS wai_memories_agent_id_idx ON wai_memories(agent_id);
CREATE INDEX IF NOT EXISTS wai_memories_tags_idx ON wai_memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS wai_memories_created_at_idx ON wai_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS wai_memories_priority_idx ON wai_memories(priority DESC);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS wai_memories_user_type_idx ON wai_memories(user_id, type);
CREATE INDEX IF NOT EXISTS wai_memories_session_type_idx ON wai_memories(session_id, type);

-- ============================================================
-- STEP 4: Create memory vectors table
-- ============================================================
CREATE TABLE IF NOT EXISTS wai_memory_vectors (
  id VARCHAR(255) PRIMARY KEY,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Foreign key to memories table
  CONSTRAINT fk_memory FOREIGN KEY (id) REFERENCES wai_memories(id) ON DELETE CASCADE
);

-- ============================================================
-- STEP 5: Create HNSW index for fast similarity search
-- ============================================================
-- HNSW (Hierarchical Navigable Small World) provides fast approximate nearest neighbor search
-- m=16: number of connections per layer (higher = more accurate but slower build)
-- ef_construction=64: size of dynamic candidate list for construction (higher = better quality)
CREATE INDEX IF NOT EXISTS wai_memory_vectors_embedding_idx
ON wai_memory_vectors
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================================
-- STEP 6: Create metadata index
-- ============================================================
CREATE INDEX IF NOT EXISTS wai_memory_vectors_metadata_idx ON wai_memory_vectors USING GIN(metadata);

-- ============================================================
-- STEP 7: Create function for TTL cleanup
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM wai_memories
  WHERE ttl IS NOT NULL
    AND created_at + (ttl || ' seconds')::INTERVAL < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 8: Create function for relevance scoring
-- ============================================================
-- Combines similarity, priority, and recency for optimal memory recall
CREATE OR REPLACE FUNCTION calculate_relevance(
  similarity FLOAT,
  priority INTEGER,
  created_at TIMESTAMP
)
RETURNS FLOAT AS $$
DECLARE
  similarity_weight CONSTANT FLOAT := 0.6;
  priority_weight CONSTANT FLOAT := 0.2;
  recency_weight CONSTANT FLOAT := 0.2;
  
  recency_score FLOAT;
  days_old FLOAT;
BEGIN
  -- Calculate days since creation
  days_old := EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0;
  
  -- Recency score: decays exponentially (half-life of 30 days)
  recency_score := EXP(-days_old / 30.0);
  
  -- Normalize priority to 0-1 range
  RETURN (
    similarity * similarity_weight +
    (priority / 100.0) * priority_weight +
    recency_score * recency_weight
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- STEP 9: Create optimized search function
-- ============================================================
CREATE OR REPLACE FUNCTION search_memories(
  query_embedding vector(1536),
  search_limit INTEGER DEFAULT 10,
  min_similarity FLOAT DEFAULT 0.5,
  filter_user_id VARCHAR DEFAULT NULL,
  filter_session_id VARCHAR DEFAULT NULL,
  filter_agent_id VARCHAR DEFAULT NULL,
  filter_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  memory_id VARCHAR,
  similarity FLOAT,
  relevance FLOAT,
  content TEXT,
  memory_type VARCHAR,
  user_id VARCHAR,
  session_id VARCHAR,
  agent_id VARCHAR,
  metadata JSONB,
  tags TEXT[],
  priority INTEGER,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    1 - (v.embedding <=> query_embedding) AS similarity,
    calculate_relevance(
      1 - (v.embedding <=> query_embedding),
      m.priority,
      m.created_at
    ) AS relevance,
    m.content,
    m.type,
    m.user_id,
    m.session_id,
    m.agent_id,
    m.metadata,
    m.tags,
    m.priority,
    m.created_at
  FROM wai_memory_vectors v
  INNER JOIN wai_memories m ON v.id = m.id
  WHERE
    (1 - (v.embedding <=> query_embedding)) >= min_similarity
    AND (filter_user_id IS NULL OR m.user_id = filter_user_id)
    AND (filter_session_id IS NULL OR m.session_id = filter_session_id)
    AND (filter_agent_id IS NULL OR m.agent_id = filter_agent_id)
    AND (filter_type IS NULL OR m.type = filter_type)
    AND (m.ttl IS NULL OR m.created_at + (m.ttl || ' seconds')::INTERVAL >= NOW())
  ORDER BY relevance DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- STEP 10: Create trigger for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wai_memories_updated_at
BEFORE UPDATE ON wai_memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STEP 11: Grant permissions (adjust as needed)
-- ============================================================
-- Grant SELECT, INSERT, UPDATE, DELETE to application user
-- Replace 'app_user' with your application's database user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON wai_memories TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON wai_memory_vectors TO app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_memories() TO app_user;
-- GRANT EXECUTE ON FUNCTION search_memories(vector, INTEGER, FLOAT, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO app_user;

-- ============================================================
-- Migration Complete
-- ============================================================
-- You can now use the WAI SDK Memory System.
-- The tables, indexes, and functions are ready for production use.
