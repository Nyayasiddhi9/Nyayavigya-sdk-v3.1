/**
 * Task Manager Tool
 * Create and manage tasks
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Task Manager Tool Definition
 */
export const taskManagerTool: Tool = {
  id: 'task_manager',
  name: 'Task Manager',
  description: 'Manage tasks: create, update, prioritize, assign, track progress',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform: create, update, delete, list, complete',
      required: true,
    },
    {
      name: 'task',
      type: 'object',
      description: 'Task data (title, description, priority, assignee, etc.)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Additional options (filters for list, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Task operation result',
  },
  examples: [
    {
      input: {
        action: 'create',
        task: {
          title: 'Review PR #123',
          priority: 'high',
          dueDate: '2024-01-20',
        },
      },
      output: {
        success: true,
        taskId: 'task_456',
        status: 'pending',
      },
    },
  ],
};

/**
 * Task Manager Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const taskManagerExecutor: ToolExecutor = async (params) => {
  const { action, task, options = {} } = params;

  // Validate action
  const validActions = ['create', 'update', 'delete', 'list', 'complete', 'assign'];
  if (!validActions.includes(action)) {
    return {
      success: false,
      error: `action must be one of: ${validActions.join(', ')}`,
    };
  }

  if (!task || typeof task !== 'object') {
    return {
      success: false,
      error: 'task must be an object',
    };
  }

  // Return task configuration for host to execute
  return {
    success: true,
    action: `task_${action}`,
    config: {
      task,
      options,
    },
    note: 'Task management requires task tracking system and execution by host environment',
  };
};
