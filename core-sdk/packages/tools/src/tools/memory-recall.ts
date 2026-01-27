/**
 * Memory Recall Tool
 * Search and recall memories using semantic search
 */

import { Tool, ToolExecutor } from '@wai/protocols';
import { getMemoryService } from './memory-service-singleton';

/**
 * Memory Recall Tool Definition
 */
export const memoryRecallTool: Tool = {
  id: 'memory_recall',
  name: 'Memory Recall',
  description: 'Search and recall memories using semantic search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    },
    {
      name: 'type',
      type: 'string',
      description: 'Memory type filter',
      required: false,
      enum: ['user', 'session', 'agent', 'entity'],
    },
    {
      name: 'userId',
      type: 'string',
      description: 'User ID filter',
      required: false,
    },
    {
      name: 'sessionId',
      type: 'string',
      description: 'Session ID filter',
      required: false,
    },
    {
      name: 'agentId',
      type: 'string',
      description: 'Agent ID filter',
      required: false,
    },
    {
      name: 'tags',
      type: 'array',
      description: 'Tag filters',
      required: false,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of results',
      required: false,
      default: 10,
    },
    {
      name: 'minSimilarity',
      type: 'number',
      description: 'Minimum similarity score (0-1)',
      required: false,
      default: 0.5,
    },
  ],
  returns: {
    type: 'object',
    description: 'Search results with memories and similarity scores',
  },
  examples: [
    {
      input: {
        query: 'What are the user preferences?',
        userId: 'user_123',
        limit: 5,
      },
      output: {
        success: true,
        results: [
          {
            memory: {
              id: 'mem_abc123',
              content: 'User prefers dark mode',
            },
            similarity: 0.92,
            relevance: 0.89,
          },
        ],
      },
    },
  ],
};

/**
 * Memory Recall Executor
 * Production implementation with real MemoryService integration
 */
export const memoryRecallExecutor: ToolExecutor = async (params) => {
  const {
    query,
    type,
    userId,
    sessionId,
    agentId,
    tags,
    limit = 10,
    minSimilarity = 0.5,
  } = params;

  try {
    const memoryService = await getMemoryService();
    const results = await memoryService.search(query, {
      type,
      userId,
      sessionId,
      agentId,
      tags,
      limit,
      minSimilarity,
    });

    return {
      success: true,
      results: results.map(result => ({
        memory: {
          id: result.memory.id,
          type: result.memory.type,
          content: result.memory.content,
          userId: result.memory.userId,
          sessionId: result.memory.sessionId,
          agentId: result.memory.agentId,
          metadata: result.memory.metadata,
          tags: result.memory.tags,
          priority: result.memory.priority,
          createdAt: result.memory.createdAt.toISOString(),
        },
        similarity: result.similarity,
        relevance: result.relevance,
      })),
      count: results.length,
      query,
      filters: { type, userId, sessionId, agentId, tags },
    };
  } catch (error: any) {
    throw new Error(`Failed to recall memories: ${error.message}`);
  }
};
