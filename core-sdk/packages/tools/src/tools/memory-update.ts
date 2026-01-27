/**
 * Memory Update Tool
 * Update existing memories
 */

import { Tool, ToolExecutor } from '@wai/protocols';
import { getMemoryService } from './memory-service-singleton';

/**
 * Memory Update Tool Definition
 */
export const memoryUpdateTool: Tool = {
  id: 'memory_update',
  name: 'Memory Update',
  description: 'Update existing memories with new content or metadata',
  parameters: [
    {
      name: 'id',
      type: 'string',
      description: 'Memory ID to update',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'New memory content',
      required: false,
    },
    {
      name: 'metadata',
      type: 'object',
      description: 'New metadata',
      required: false,
    },
    {
      name: 'tags',
      type: 'array',
      description: 'New tags',
      required: false,
    },
    {
      name: 'priority',
      type: 'number',
      description: 'New priority (0-100)',
      required: false,
    },
    {
      name: 'ttl',
      type: 'number',
      description: 'New time to live in seconds',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Updated memory',
  },
  examples: [
    {
      input: {
        id: 'mem_abc123',
        content: 'User prefers dark mode and prefers afternoon meetings',
        priority: 80,
      },
      output: {
        success: true,
        memory: {
          id: 'mem_abc123',
          content: 'User prefers dark mode and prefers afternoon meetings',
          priority: 80,
        },
      },
    },
  ],
};

/**
 * Memory Update Executor
 * Production implementation with real MemoryService integration
 */
export const memoryUpdateExecutor: ToolExecutor = async (params) => {
  const { id, content, metadata, tags, priority, ttl } = params;

  try {
    const memoryService = await getMemoryService();
    const memory = await memoryService.update(id, {
      content,
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
        updatedAt: memory.updatedAt?.toISOString(),
        expiresAt: memory.expiresAt?.toISOString(),
      },
      message: 'Memory updated successfully',
    };
  } catch (error: any) {
    throw new Error(`Failed to update memory: ${error.message}`);
  }
};
