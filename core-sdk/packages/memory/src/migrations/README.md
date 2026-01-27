# NyayaVighya SDK Memory System Migrations

## Overview

This directory contains SQL migrations for the NyayaVighya SDK memory system with pgvector support.

## Prerequisites

1. **PostgreSQL 12+** with **pgvector extension**
2. **Superuser access** (for initial setup only)

### Enable pgvector Extension

The pgvector extension must be enabled by a database administrator:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Note for Neon users:** pgvector is pre-installed and enabled on all Neon databases. No action needed.

**Note for other providers:** Contact your database administrator to enable the pgvector extension.

## Running Migrations

### Option 1: Manual Migration (Recommended)

1. Connect to your PostgreSQL database as a superuser or user with CREATE privileges:

```bash
psql $DATABASE_URL
```

2. Run the migration script:

```sql
\i nyayavighya-sdk/packages/memory/src/migrations/001_create_pgvector_tables.sql
```

3. Verify tables were created:

```sql
\dt wai_*
```

You should see:
- `wai_memories` - Memory storage table
- `wai_memory_vectors` - Vector embeddings table

### Option 2: Programmatic Migration

Use the provided migration utility:

```typescript
import { runMigrations } from '@wai/memory/migrations';

// Run all migrations
await runMigrations(process.env.DATABASE_URL);
```

### Option 3: Using psql from command line

```bash
psql $DATABASE_URL -f nyayavighya-sdk/packages/memory/src/migrations/001_create_pgvector_tables.sql
```

## Migration Files

### 001_create_pgvector_tables.sql

Creates the complete memory system infrastructure:

1. **Tables**
   - `wai_memories` - Stores memory content and metadata
   - `wai_memory_vectors` - Stores vector embeddings (1536 dimensions)

2. **Indexes**
   - B-tree indexes on `type`, `user_id`, `session_id`, `agent_id`
   - GIN index on `tags` array
   - HNSW index on `embedding` for fast similarity search
   - Composite indexes for common query patterns

3. **Functions**
   - `cleanup_expired_memories()` - Removes TTL-expired memories
   - `calculate_relevance()` - Scores memories by similarity + priority + recency
   - `search_memories()` - Optimized semantic search with filters
   - `update_updated_at()` - Trigger function for automatic timestamp updates

4. **Constraints**
   - Priority must be 0-100
   - TTL must be positive if set
   - Foreign key from vectors to memories (cascade delete)

## Verification

After running migrations, verify the setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'wai_%';

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check HNSW index
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'wai_memory_vectors';

-- Test search function
SELECT search_memories(
  ARRAY_FILL(0.0, ARRAY[1536])::vector(1536),
  10,
  0.5
);
```

## Troubleshooting

### Error: "extension 'vector' does not exist"

**Solution:** The pgvector extension must be installed and enabled by a database superuser:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If you don't have superuser access, contact your database administrator.

### Error: "operator does not exist: vector <=> vector"

**Solution:** The pgvector extension is not properly loaded. Restart your database connection or re-enable the extension.

### Performance Issues

If searches are slow:

1. **Check HNSW index exists:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'wai_memory_vectors';
```

2. **Tune HNSW parameters** (trade-off between speed and accuracy):
```sql
-- Higher m = more accurate but slower
-- Higher ef_construction = better quality
DROP INDEX IF EXISTS wai_memory_vectors_embedding_idx;
CREATE INDEX wai_memory_vectors_embedding_idx
ON wai_memory_vectors
USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128); -- More accurate
```

3. **Adjust search parameters:**
```typescript
// For production searches
const results = await memoryService.search(query, {
  limit: 10,        // Fewer results = faster
  minSimilarity: 0.7 // Higher threshold = faster
});
```

## Safety Notes

⚠️ **Important Safety Rules:**

1. **Never run migrations in production without a backup**
2. **Test migrations on a staging database first**
3. **The migration uses `IF NOT EXISTS` - safe to re-run**
4. **Vector embeddings use CASCADE DELETE - deleting a memory deletes its vector**
5. **TTL cleanup is manual - use `cleanup_expired_memories()` or enable auto-cleanup**

## Rollback

To rollback the migration (⚠️ THIS DELETES ALL DATA):

```sql
DROP TABLE IF EXISTS wai_memory_vectors CASCADE;
DROP TABLE IF EXISTS wai_memories CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_memories();
DROP FUNCTION IF EXISTS calculate_relevance(FLOAT, INTEGER, TIMESTAMP);
DROP FUNCTION IF EXISTS search_memories(vector, INTEGER, FLOAT, VARCHAR, VARCHAR, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS update_updated_at();
```

## Next Steps

After running migrations:

1. **Initialize MemoryService** in your application
2. **Test memory storage and search**
3. **Set up automated TTL cleanup** (optional)
4. **Monitor query performance** with EXPLAIN ANALYZE

For more information, see the main README at `packages/memory/README.md`.
