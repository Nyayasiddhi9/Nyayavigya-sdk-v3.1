/**
 * Telegram Bot Tool
 * Send messages via Telegram Bot API
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Telegram Bot Tool Definition
 */
export const telegramBotTool: Tool = {
  id: 'telegram_bot',
  name: 'Telegram Bot',
  description: 'Send Telegram messages: text, photos, documents, inline keyboards, polls',
  parameters: [
    {
      name: 'chatId',
      type: 'string',
      description: 'Chat ID or username (@username)',
      required: true,
    },
    {
      name: 'text',
      type: 'string',
      description: 'Message text (supports Markdown/HTML)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Message options (parseMode, replyMarkup, disablePreview, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Telegram message result with message ID',
  },
  examples: [
    {
      input: {
        chatId: '123456789',
        text: 'Hello from WAI SDK!',
        options: { parseMode: 'Markdown' },
      },
      output: {
        success: true,
        messageId: 987,
        chatId: 123456789,
      },
    },
  ],
};

/**
 * Telegram Bot Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const telegramBotExecutor: ToolExecutor = async (params) => {
  const { chatId, text, options = {} } = params;

  if (typeof chatId !== 'string' || !chatId.trim()) {
    return {
      success: false,
      error: 'chatId must be a non-empty string',
    };
  }

  if (typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'text must be a non-empty string',
    };
  }

  // Return Telegram configuration for host to execute
  return {
    success: true,
    action: 'telegram_send',
    config: {
      chatId: chatId.trim(),
      text: text.trim(),
      parseMode: options.parseMode || 'Markdown',
      replyMarkup: options.replyMarkup,
      disableWebPagePreview: options.disableWebPagePreview,
      disableNotification: options.disableNotification,
      replyToMessageId: options.replyToMessageId,
    },
    note: 'Telegram messaging requires Bot token and execution by host environment',
  };
};
