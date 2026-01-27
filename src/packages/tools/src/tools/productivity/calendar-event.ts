/**
 * Calendar Event Tool
 * Create and manage calendar events
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Calendar Event Tool Definition
 */
export const calendarEventTool: Tool = {
  id: 'calendar_event',
  name: 'Calendar Event',
  description: 'Create/update Google Calendar events: meetings, reminders, recurring events, attendees',
  parameters: [
    {
      name: 'summary',
      type: 'string',
      description: 'Event title/summary',
      required: true,
    },
    {
      name: 'startTime',
      type: 'string',
      description: 'Start time (ISO 8601 format)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Event options (endTime, description, location, attendees, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Created event with event ID',
  },
  examples: [
    {
      input: {
        summary: 'Team Meeting',
        startTime: '2024-01-15T14:00:00Z',
        options: {
          endTime: '2024-01-15T15:00:00Z',
          attendees: ['user@example.com'],
        },
      },
      output: {
        success: true,
        eventId: 'abc123',
        link: 'https://calendar.google.com/event?eid=abc123',
      },
    },
  ],
};

/**
 * Calendar Event Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const calendarEventExecutor: ToolExecutor = async (params) => {
  const { summary, startTime, options = {} } = params;

  if (typeof summary !== 'string' || !summary.trim()) {
    return {
      success: false,
      error: 'summary must be a non-empty string',
    };
  }

  if (typeof startTime !== 'string' || !startTime.trim()) {
    return {
      success: false,
      error: 'startTime must be a non-empty string (ISO 8601 format)',
    };
  }

  // Return calendar configuration for host to execute
  return {
    success: true,
    action: 'calendar_create_event',
    config: {
      summary: summary.trim(),
      startTime: startTime.trim(),
      endTime: options.endTime,
      description: options.description,
      location: options.location,
      attendees: options.attendees || [],
      reminders: options.reminders,
      recurrence: options.recurrence,
      colorId: options.colorId,
      timeZone: options.timeZone,
    },
    note: 'Calendar event creation requires Google Calendar API credentials and execution by host environment',
  };
};
