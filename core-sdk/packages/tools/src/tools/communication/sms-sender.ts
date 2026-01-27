/**
 * SMS Sender Tool
 * Send SMS messages via Twilio or other providers
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * SMS Sender Tool Definition
 */
export const smsSenderTool: Tool = {
  id: 'sms_sender',
  name: 'SMS Sender',
  description: 'Send SMS messages via Twilio: single/bulk messages, delivery status, scheduling',
  parameters: [
    {
      name: 'to',
      type: 'string',
      description: 'Recipient phone number (E.164 format: +1234567890)',
      required: true,
    },
    {
      name: 'message',
      type: 'string',
      description: 'SMS message body',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'SMS options (from, mediaUrl, scheduledTime, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'SMS send result with message SID',
  },
  examples: [
    {
      input: {
        to: '+1234567890',
        message: 'Hello from WAI SDK!',
        options: { from: '+0987654321' },
      },
      output: {
        success: true,
        sid: 'SM1234567890abcdef',
        status: 'sent',
      },
    },
  ],
};

/**
 * SMS Sender Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const smsSenderExecutor: ToolExecutor = async (params) => {
  const { to, message, options = {} } = params;

  if (typeof to !== 'string' || !to.trim()) {
    return {
      success: false,
      error: 'to must be a non-empty string (E.164 format: +1234567890)',
    };
  }

  if (typeof message !== 'string' || !message.trim()) {
    return {
      success: false,
      error: 'message must be a non-empty string',
    };
  }

  // Return SMS configuration for host to execute
  return {
    success: true,
    action: 'sms_send',
    config: {
      to: to.trim(),
      message: message.trim(),
      from: options.from,
      mediaUrl: options.mediaUrl,
      statusCallback: options.statusCallback,
      scheduledTime: options.scheduledTime,
      maxPrice: options.maxPrice,
    },
    note: 'SMS sending requires Twilio API credentials and execution by host environment',
  };
};
