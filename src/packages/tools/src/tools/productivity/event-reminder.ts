/**
 * Event Reminder Tool
 * Create reminders and notifications
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Event Reminder Tool Definition
 */
export const eventReminderTool: Tool = {
  id: 'event_reminder',
  name: 'Event Reminder',
  description: 'Create reminders: one-time, recurring, multiple notification channels (email/SMS/push)',
  parameters: [
    {
      name: 'title',
      type: 'string',
      description: 'Reminder title',
      required: true,
    },
    {
      name: 'time',
      type: 'string',
      description: 'When to send reminder (ISO 8601 format)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Reminder options (description, channels, repeat, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Created reminder with ID',
  },
  examples: [
    {
      input: {
        title: 'Team standup',
        time: '2024-01-15T09:00:00Z',
        options: {
          channels: ['email', 'push'],
          repeat: 'daily',
        },
      },
      output: {
        success: true,
        reminderId: 'rem_123',
        nextTrigger: '2024-01-15T09:00:00Z',
      },
    },
  ],
};

/**
 * Event Reminder Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const eventReminderExecutor: ToolExecutor = async (params) => {
  const { title, time, options = {} } = params;

  if (typeof title !== 'string' || !title.trim()) {
    return {
      success: false,
      error: 'title must be a non-empty string',
    };
  }

  if (typeof time !== 'string' || !time.trim()) {
    return {
      success: false,
      error: 'time must be a non-empty string (ISO 8601 format)',
    };
  }

  // Return reminder configuration for host to execute
  return {
    success: true,
    action: 'reminder_create',
    config: {
      title: title.trim(),
      time: time.trim(),
      description: options.description,
      channels: options.channels || ['push'],
      repeat: options.repeat,
      snoozeMinutes: options.snoozeMinutes,
      priority: options.priority || 'normal',
    },
    note: 'Reminder creation requires notification service and execution by host environment',
  };
};
