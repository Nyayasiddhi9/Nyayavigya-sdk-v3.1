/**
 * Memory Service Singleton
 * Provides a single shared instance of MemoryService for all memory tools
 */

import { MemoryService, createMemoryService, MemoryConfig } from '@wai/memory';

let memoryServiceInstance: MemoryService | null = null;

/**
 * Get or create memory service instance
 */
export async function getMemoryService(): Promise<MemoryService> {
  if (memoryServiceInstance) {
    return memoryServiceInstance;
  }

  // Create memory service with production configuration
  const config: MemoryConfig = {
    embeddingProvider: {
      type: 'openai',
      model: 'text-embedding-3-small',
      apiKey: process.env.OPENAI_API_KEY,
    },
    vectorStore: {
      type: 'pgvector',
      connectionString: process.env.DATABASE_URL,
      tableName: 'wai_memory_vectors',
      dimension: 1536, // text-embedding-3-small dimension
    },
    storage: {
      tableName: 'wai_memories',
      enableAutoCleanup: true,
      cleanupIntervalMs: 3600000, // 1 hour
    },
  };

  memoryServiceInstance = await createMemoryService(config);
  return memoryServiceInstance;
}

/**
 * Close memory service (for cleanup)
 */
export async function closeMemoryService(): Promise<void> {
  if (memoryServiceInstance) {
    await memoryServiceInstance.close();
    memoryServiceInstance = null;
  }
}
