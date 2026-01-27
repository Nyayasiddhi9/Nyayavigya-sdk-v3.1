/**
 * WAI SDK Memory Package
 * mem0-style memory with pgvector and OpenAI embeddings
 */

// Core types
export * from './core/types';

// Embedding provider
export * from './core/embedding-provider';

// Vector store
export * from './core/vector-store';

// Memory storage
export * from './core/memory-storage';

// Memory service (main API)
export * from './core/memory-service';

// Two-phase extraction pipeline
export * from './core/extraction-pipeline';

// CAM 2.0 Monitoring (incubator integration)
export * from './cam';

// Version
export const WAI_MEMORY_VERSION = '1.0.0';
