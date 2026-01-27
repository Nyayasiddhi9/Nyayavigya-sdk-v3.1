/**
 * Memory Store Tool
 * Store memories for users, sessions, or agents
 */

import { Tool, ToolExecutor } from '@wai/protocols';
import { getMemoryService } from './memory-service-singleton';

/**
 * Memory Store Tool Definition
 */
export const memoryStoreTool: Tool = {
  id: 'memory_store',
  name: 'Memory Store',
  description: 'Store memories for users, sessions, or agents with semantic search capability',
  parameters: [
    {
      name: 'content',
      type: 'string',
      description: 'Memory content to store',
      required: true,
    },
    {
      name: 'type',
      type: 'string',
      description: 'Memory type',
      required: false,
      default: 'user',
      enum: ['user', 'session', 'agent', 'entity'],
    },
    {
      name: 'userId',
      type: 'string',
      description: 'User ID (for user memories)',
      required: false,
    },
    {
      name: 'sessionId',
      type: 'string',
      description: 'Session ID (for session memories)',
      required: false,
    },
    {
      name: 'agentId',
      type: 'string',
      description: 'Agent ID (for agent memories)',
      required: false,
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'Additional metadata',
      required: false,
    },
    {
      name: 'tags',
      type: 'array',
      description: 'Tags for categorization',
      required: false,
    },
    {
      name: 'priority',
      type: 'number',
      description: 'Priority (0-100, default 50)',
      required: false,
      default: 50,
    },
    {
      name: 'ttl',
      type: 'number',
      description: 'Time to live in seconds',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Stored memory with ID and metadata',
  },
  examples: [
    {
      input: {
        content: 'User prefers dark mode and morning meetings',
        type: 'user',
        userId: 'user_123',
        tags: ['preferences'],
      },
      output: {
        success: true,
        memory: {
          id: 'mem_abc123',
          content: 'User prefers dark mode and morning meetings',
        },
      },
    },
  ],
};

/**
 * Memory Store Executor
 * Production implementation with real MemoryService integration
 */
export const memoryStoreExecutor: ToolExecutor = async (params) => {
  const {
    content,
    type = 'user',
    userId,
    sessionId,
    agentId,
    metadata,
    tags,
    priority = 50,
    ttl,
  } = params;

  try {
    const memoryService = await getMemoryService();
    const memory = await memoryService.add(content, {
      type,
      userId,
      sessionId,
      agentId,
      metadata,
      tags,
      priority,
      ttl,
    });

    return {
      success: true,
      memory: {
        id: memory.id,
        type: memory.type,
        content: memory.content,
        userId: memory.userId,
        sessionId: memory.sessionId,
        agentId: memory.agentId,
        metadata: memory.metadata,
        tags: memory.tags,
        priority: memory.priority,
        ttl: memory.ttl,
        createdAt: memory.createdAt.toISOString(),
        expiresAt: memory.expiresAt?.toISOString(),
      },
      message: 'Memory stored successfully',
    };
  } catch (error: any) {
    throw new Error(`Failed to store memory: ${error.message}`);
  }
};
