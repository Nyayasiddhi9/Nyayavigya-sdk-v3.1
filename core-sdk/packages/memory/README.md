# @wai/memory - Production Memory System

mem0-style memory management for NyayaVighya SDK with semantic search, vector embeddings, and PostgreSQL+pgvector storage.

## 🚀 Features

- **mem0-Compatible API** - Drop-in replacement for mem0 with enhanced capabilities
- **Semantic Search** - OpenAI embeddings + pgvector for intelligent memory recall
- **Multiple Memory Types** - User, session, agent, and entity memories
- **Relevance Scoring** - Combines similarity, priority, and recency for optimal recall
- **Automatic Cleanup** - TTL-based memory expiration
- **Production-Ready** - PostgreSQL-backed with comprehensive error handling

## 📦 Installation

```bash
pnpm install @wai/memory
```

## 🎯 Quick Start

```typescript
import { createMemoryService } from '@wai/memory';

// Initialize memory service
const memoryService = await createMemoryService({
  embeddingProvider: {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
  },
  vectorStore: {
    type: 'pgvector',
    connectionString: process.env.DATABASE_URL,
  },
  storage: {
    enableAutoCleanup: true,
    cleanupIntervalMs: 3600000, // 1 hour
  },
  search: {
    defaultLimit: 10,
    minSimilarity: 0.5,
  },
});

// Add memory
const memory = await memoryService.add(
  'User prefers dark mode and morning meetings',
  {
    userId: 'user_123',
    type: 'user',
    tags: ['preferences'],
    priority: 80,
  }
);

// Search memories
const results = await memoryService.search(
  'What are the user preferences?',
  {
    userId: 'user_123',
    limit: 5,
    minSimilarity: 0.7,
  }
);

console.log(results);
// [
//   {
//     memory: { id: 'mem_abc', content: 'User prefers dark mode...' },
//     similarity: 0.92,
//     relevance: 0.89
//   }
// ]
```

## 🛠️ Core Components

### 1. Memory Service

High-level API for memory operations (mem0-compatible):

```typescript
class MemoryService {
  // Add memory from messages or string
  async add(
    messages: string | Message[],
    options?: {
      userId?: string;
      sessionId?: string;
      agentId?: string;
      type?: MemoryType;
      metadata?: Record<string, any>;
      tags?: string[];
      priority?: number;
      ttl?: number;
    }
  ): Promise<MemoryEntry>;

  // Search memories with semantic search
  async search(
    query: string,
    options?: {
      userId?: string;
      sessionId?: string;
      agentId?: string;
      type?: MemoryType;
      tags?: string[];
      limit?: number;
      minSimilarity?: number;
    }
  ): Promise<MemorySearchResult[]>;

  // Get memory by ID
  async get(id: string): Promise<MemoryEntry | null>;

  // Get all memories with filters
  async getAll(filters?: {
    userId?: string;
    sessionId?: string;
    agentId?: string;
    type?: MemoryType;
  }): Promise<MemoryEntry[]>;

  // Update memory
  async update(id: string, updates: MemoryUpdate): Promise<MemoryEntry>;

  // Delete memory
  async delete(id: string): Promise<boolean>;

  // Cleanup expired memories
  async cleanup(): Promise<number>;

  // Get statistics
  async getStats(): Promise<MemoryStats>;
}
```

### 2. Embedding Provider

Generate vector embeddings for semantic search:

```typescript
// OpenAI Embedding Provider (text-embedding-3-small, 1536 dimensions)
const embeddingProvider = new OpenAIEmbeddingProvider(
  process.env.OPENAI_API_KEY!,
  'text-embedding-3-small'
);

const embedding = await embeddingProvider.generateEmbedding(
  'User prefers dark mode'
);
// Returns: number[] (1536 dimensions)
```

### 3. Vector Store

pgvector-backed semantic search:

```typescript
// PostgreSQL + pgvector
const vectorStore = new PgVectorStore(
  process.env.DATABASE_URL!,
  'wai_memory_vectors',
  1536 // dimension
);

await vectorStore.initialize();

// Store embedding
await vectorStore.store('mem_abc', embedding, {
  userId: 'user_123',
  type: 'user',
});

// Search similar embeddings
const results = await vectorStore.search(queryEmbedding, 10, {
  userId: 'user_123',
});
```

### 4. Memory Storage

PostgreSQL-backed memory persistence:

```typescript
const storage = new PgMemoryStorage(
  process.env.DATABASE_URL!,
  vectorStore,
  embeddingProvider,
  'wai_memories'
);

await storage.initialize();
```

## 📊 Memory Types

### User Memory
Persistent information about specific users:
```typescript
await memoryService.add('User is vegetarian and allergic to nuts', {
  userId: 'user_123',
  type: 'user',
  tags: ['dietary', 'health'],
});
```

### Session Memory
Temporary information for active sessions:
```typescript
await memoryService.add('Discussing Q4 revenue projections', {
  sessionId: 'session_abc',
  type: 'session',
  ttl: 3600, // 1 hour
});
```

### Agent Memory
Learning and insights for autonomous agents:
```typescript
await memoryService.add('User responds well to concise answers', {
  agentId: 'agent_001',
  type: 'agent',
  priority: 90,
});
```

### Entity Memory
Facts about entities and relationships:
```typescript
await memoryService.add('AWS headquartered in Seattle', {
  type: 'entity',
  tags: ['company', 'location'],
  metadata: { entity: 'AWS' },
});
```

## 🔍 Search & Recall

### Semantic Search
```typescript
const results = await memoryService.search(
  'What dietary restrictions does the user have?',
  {
    userId: 'user_123',
    type: 'user',
    tags: ['dietary'],
    limit: 5,
    minSimilarity: 0.6,
  }
);

// Results include:
// - memory: Full memory entry
// - similarity: 0-1 cosine similarity score
// - relevance: Combined score (similarity + priority + recency)
```

### Relevance Scoring

Memories are ranked by:
- **Similarity (60%)** - Semantic match to query
- **Priority (20%)** - User-defined importance (0-100)
- **Recency (20%)** - How recently memory was created

## 🎨 Advanced Usage

### Custom Configuration
```typescript
const memoryService = await createMemoryService({
  embeddingProvider: {
    type: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'text-embedding-3-small',
    dimension: 1536,
  },
  vectorStore: {
    type: 'pgvector',
    connectionString: process.env.DATABASE_URL,
    tableName: 'custom_vectors',
    dimension: 1536,
  },
  storage: {
    tableName: 'custom_memories',
    enableAutoCleanup: true,
    cleanupIntervalMs: 1800000, // 30 minutes
  },
  search: {
    defaultLimit: 20,
    minSimilarity: 0.6,
    enableReranking: true,
  },
});
```

### Memory with TTL (Auto-expiration)
```typescript
await memoryService.add('Temporary session data', {
  sessionId: 'session_xyz',
  type: 'session',
  ttl: 3600, // Expires in 1 hour
});

// Cleanup expired memories
const cleanedCount = await memoryService.cleanup();
console.log(`Removed ${cleanedCount} expired memories`);
```

### Priority-based Filtering
```typescript
await memoryService.add('Critical user preference', {
  userId: 'user_123',
  priority: 95, // High priority
});

await memoryService.add('Minor preference', {
  userId: 'user_123',
  priority: 30, // Low priority
});

// Search automatically weighs high-priority memories higher
const results = await memoryService.search('user preferences', {
  userId: 'user_123',
});
```

### Metadata and Tags
```typescript
await memoryService.add('User completed onboarding', {
  userId: 'user_123',
  tags: ['milestone', 'onboarding'],
  metadata: {
    timestamp: new Date().toISOString(),
    version: 'v2.0',
    source: 'web-app',
  },
});

// Filter by tags
const onboardingMemories = await memoryService.search('onboarding', {
  userId: 'user_123',
  tags: ['onboarding'],
});
```

## 📈 Statistics

```typescript
const stats = await memoryService.getStats();
console.log(stats);
// {
//   totalMemories: 1523,
//   memoryByType: { user: 890, session: 124, agent: 309, entity: 200 },
//   totalEmbeddings: 1523,
//   averageAccessCount: 3.4,
//   oldestMemory: '2025-01-01T00:00:00Z',
//   newestMemory: '2025-11-13T12:00:00Z'
// }
```

## 🔧 MCP Tool Integration

Memory tools are integrated with MCP server for agent orchestration:

1. **memory_store** - Store new memories
2. **memory_recall** - Search and recall memories
3. **memory_update** - Update existing memories
4. **memory_delete** - Delete memories

These tools are automatically registered with the tool registry.

## 🔐 Security

- **Embeddings** - Secure OpenAI API integration
- **Storage** - PostgreSQL with parameterized queries (SQL injection protection)
- **Access Control** - User/session/agent isolation
- **TTL** - Automatic cleanup of expired memories

## 🚀 Performance

- **Vector Search** - HNSW index for fast approximate nearest neighbor search
- **Batch Operations** - Efficient bulk memory operations
- **Caching** - Embedding caching to reduce API calls
- **Async Cleanup** - Background TTL-based memory expiration

## 📝 Database Schema

### Memories Table (`wai_memories`)
```sql
CREATE TABLE wai_memories (
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
  ttl INTEGER
);
```

### Vectors Table (`wai_memory_vectors`)
```sql
CREATE TABLE wai_memory_vectors (
  id VARCHAR(255) PRIMARY KEY,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX wai_memory_vectors_embedding_idx
ON wai_memory_vectors
USING hnsw (embedding vector_cosine_ops);
```

## 🌟 Comparison to mem0

### Similarities
✅ mem0-compatible API (add, search, get, getAll, update, delete)  
✅ Semantic search with vector embeddings  
✅ Multiple memory types (user, session, agent)  
✅ Priority and TTL support  

### Enhancements
🚀 **Relevance Scoring** - Combines similarity, priority, and recency  
🚀 **MCP Integration** - Built-in tools for agent orchestration  
🚀 **pgvector** - PostgreSQL-native vector search (no external deps)  
🚀 **Access Tracking** - Monitors memory usage patterns  
🚀 **Production-Ready** - Comprehensive error handling and logging  

## 📄 License

MIT
