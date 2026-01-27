/**
 * WhatsApp Business Tool
 * Send messages via WhatsApp Business API
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * WhatsApp Business Tool Definition
 */
export const whatsappBusinessTool: Tool = {
  id: 'whatsapp_business',
  name: 'WhatsApp Business',
  description: 'Send WhatsApp messages: text, media, templates, interactive buttons, location',
  parameters: [
    {
      name: 'to',
      type: 'string',
      description: 'Recipient phone number (E.164 format: +1234567890)',
      required: true,
    },
    {
      name: 'message',
      type: 'object',
      description: 'Message object (type, text/media/template)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Message options (previewUrl, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'WhatsApp message result with message ID',
  },
  examples: [
    {
      input: {
        to: '+1234567890',
        message: {
          type: 'text',
          text: 'Hello from WAI SDK!',
        },
      },
      output: {
        success: true,
        messageId: 'wamid.ABC123...',
      },
    },
  ],
};

/**
 * WhatsApp Business Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const whatsappBusinessExecutor: ToolExecutor = async (params) => {
  const { to, message, options = {} } = params;

  if (typeof to !== 'string' || !to.trim()) {
    return {
      success: false,
      error: 'to must be a non-empty string (E.164 format: +1234567890)',
    };
  }

  if (!message || typeof message !== 'object' || !message.type) {
    return {
      success: false,
      error: 'message must be an object with type field',
    };
  }

  // Validate message type
  const validTypes = ['text', 'image', 'audio', 'video', 'document', 'template', 'location', 'interactive'];
  if (!validTypes.includes(message.type)) {
    return {
      success: false,
      error: `message.type must be one of: ${validTypes.join(', ')}`,
    };
  }

  // Return WhatsApp configuration for host to execute
  return {
    success: true,
    action: 'whatsapp_send',
    config: {
      to: to.trim(),
      message,
      previewUrl: options.previewUrl,
    },
    note: 'WhatsApp Business messaging requires API credentials and execution by host environment',
  };
};
