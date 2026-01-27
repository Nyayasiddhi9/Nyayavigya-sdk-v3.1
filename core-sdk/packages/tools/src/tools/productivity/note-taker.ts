/**
 * Note Taker Tool
 * Create and organize notes
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Note Taker Tool Definition
 */
export const noteTakerTool: Tool = {
  id: 'note_taker',
  name: 'Note Taker',
  description: 'Create notes: markdown, rich text, tags, search, organization',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: create, update, delete, search',
      required: true,
    },
    {
      name: 'note',
      type: 'object',
      description: 'Note data (title, content, tags, etc.)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Additional options (format, folder, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Note operation result',
  },
  examples: [
    {
      input: {
        action: 'create',
        note: {
          title: 'Meeting Notes',
          content: '# Key Points\n- Action item 1\n- Action item 2',
          tags: ['meeting', 'important'],
        },
        options: { format: 'markdown' },
      },
      output: {
        success: true,
        noteId: 'note_789',
        createdAt: '2024-01-15T10:00:00Z',
      },
    },
  ],
};

/**
 * Note Taker Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const noteTakerExecutor: ToolExecutor = async (params) => {
  const { action, note, options = {} } = params;

  // Validate action
  const validActions = ['create', 'update', 'delete', 'search', 'list'];
  if (!validActions.includes(action)) {
    return {
      success: false,
      error: `action must be one of: ${validActions.join(', ')}`,
    };
  }

  if (!note || typeof note !== 'object') {
    return {
      success: false,
      error: 'note must be an object',
    };
  }

  // Return note configuration for host to execute
  return {
    success: true,
    action: `note_${action}`,
    config: {
      note,
      format: options.format || 'markdown',
      folder: options.folder,
      encrypt: options.encrypt || false,
    },
    note: 'Note management requires note storage system and execution by host environment',
  };
};
