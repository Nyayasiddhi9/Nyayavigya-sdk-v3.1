/**
 * Timezone Converter Tool
 * Convert times between timezones
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Timezone Converter Tool Definition
 */
export const timezoneConverterTool: Tool = {
  id: 'timezone_converter',
  name: 'Timezone Converter',
  description: 'Convert times between timezones: UTC, local time, multiple timezones',
  parameters: [
    {
      name: 'time',
      type: 'string',
      description: 'Time to convert (ISO 8601 or human-readable format)',
      required: true,
    },
    {
      name: 'fromTimezone',
      type: 'string',
      description: 'Source timezone (e.g., "America/New_York", "UTC")',
      required: true,
    },
    {
      name: 'toTimezone',
      type: 'string',
      description: 'Target timezone (e.g., "Europe/London")',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Converted time with details',
  },
  examples: [
    {
      input: {
        time: '2024-01-15T14:00:00',
        fromTimezone: 'America/New_York',
        toTimezone: 'Europe/London',
      },
      output: {
        success: true,
        convertedTime: '2024-01-15T19:00:00',
        offset: '+5 hours',
      },
    },
  ],
};

/**
 * Parse timezone offset
 */
const getTimezoneOffset = (tz: string): number => {
  // Common timezone offsets (in hours from UTC)
  const offsets: Record<string, number> = {
    'UTC': 0,
    'GMT': 0,
    'America/New_York': -5,
    'America/Chicago': -6,
    'America/Denver': -7,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Moscow': 3,
    'Asia/Tokyo': 9,
    'Asia/Shanghai': 8,
    'Australia/Sydney': 10,
  };

  return offsets[tz] || 0;
};

/**
 * Timezone Converter Executor
 */
export const timezoneConverterExecutor: ToolExecutor = async (params) => {
  const { time, fromTimezone, toTimezone } = params;

  if (typeof time !== 'string' || !time.trim()) {
    return {
      success: false,
      error: 'time must be a non-empty string',
    };
  }

  if (typeof fromTimezone !== 'string' || !fromTimezone.trim()) {
    return {
      success: false,
      error: 'fromTimezone must be a non-empty string',
    };
  }

  if (typeof toTimezone !== 'string' || !toTimezone.trim()) {
    return {
      success: false,
      error: 'toTimezone must be a non-empty string',
    };
  }

  try {
    // Parse input time
    const inputDate = new Date(time);
    if (isNaN(inputDate.getTime())) {
      return {
        success: false,
        error: 'Invalid time format',
      };
    }

    // Calculate timezone difference
    const fromOffset = getTimezoneOffset(fromTimezone);
    const toOffset = getTimezoneOffset(toTimezone);
    const offsetDiff = toOffset - fromOffset;

    // Apply offset
    const convertedDate = new Date(inputDate.getTime() + offsetDiff * 60 * 60 * 1000);

    return {
      success: true,
      convertedTime: convertedDate.toISOString(),
      inputTime: inputDate.toISOString(),
      fromTimezone,
      toTimezone,
      offsetHours: offsetDiff,
      note: 'Timezone conversion uses approximate offsets, does not account for DST',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
