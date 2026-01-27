/**
 * Twilio SMS Tool
 * Send SMS and manage phone communications
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Twilio SMS Tool Definition
 */
export const twilioSmsTool: Tool = {
  id: 'twilio_sms',
  name: 'Twilio SMS',
  description: 'Twilio SMS operations: send messages, check delivery, manage numbers',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: send_sms, check_status, list_messages, buy_number, etc.',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: 'Action parameters (to, from, body, etc.)',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'Twilio API response',
  },
  examples: [
    {
      input: {
        action: 'send_sms',
        params: {
          to: '+1234567890',
          from: '+0987654321',
          body: 'Hello from WAI SDK!',
        },
      },
      output: {
        success: true,
        sid: 'SM1234567890',
        status: 'queued',
      },
    },
  ],
};

/**
 * Twilio SMS Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const twilioSmsExecutor: ToolExecutor = async (params) => {
  const { action, params: actionParams } = params;

  const validActions = [
    'send_sms', 'send_mms',
    'check_status', 'get_message',
    'list_messages', 'delete_message',
    'list_numbers', 'buy_number', 'release_number',
  ];

  if (!validActions.includes(action)) {
    return {
      success: false,
      error: `action must be one of: ${validActions.join(', ')}`,
    };
  }

  if (!actionParams || typeof actionParams !== 'object') {
    return {
      success: false,
      error: 'params must be an object',
    };
  }

  // Return Twilio configuration for host to execute
  return {
    success: true,
    action: `twilio_${action}`,
    config: actionParams,
    note: 'Twilio API requires Twilio Account SID and Auth Token and execution by host environment',
  };
};
