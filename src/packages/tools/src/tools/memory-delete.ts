/**
 * Memory Delete Tool
 * Delete memories by ID
 */

import { Tool, ToolExecutor } from '@wai/protocols';
import { getMemoryService } from './memory-service-singleton';

/**
 * Memory Delete Tool Definition
 */
export const memoryDeleteTool: Tool = {
  id: 'memory_delete',
  name: 'Memory Delete',
  description: 'Delete memories by ID',
  parameters: [
    {
      name: 'id',
      type: 'string',
      description: 'Memory ID to delete',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Deletion result',
  },
  examples: [
    {
      input: { id: 'mem_abc123' },
      output: { success: true, deleted: true },
    },
  ],
};

/**
 * Memory Delete Executor
 * Production implementation with real MemoryService integration
 */
export const memoryDeleteExecutor: ToolExecutor = async (params) => {
  const { id } = params;

  try {
    const memoryService = await getMemoryService();
    const deleted = await memoryService.delete(id);

    return {
      success: true,
      deleted,
      id,
      message: deleted ? 'Memory deleted successfully' : 'Memory not found',
    };
  } catch (error: any) {
    throw new Error(`Failed to delete memory: ${error.message}`);
  }
};
