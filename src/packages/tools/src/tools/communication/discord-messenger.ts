/**
 * Discord Messenger Tool
 * Send messages to Discord channels
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Discord Messenger Tool Definition
 */
export const discordMessengerTool: Tool = {
  id: 'discord_messenger',
  name: 'Discord Messenger',
  description: 'Send Discord messages: channels, DMs, embeds, files, reactions',
  parameters: [
    {
      name: 'channelId',
      type: 'string',
      description: 'Discord channel ID',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Message content',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Message options (embeds, files, tts, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Discord message result with message ID',
  },
  examples: [
    {
      input: {
        channelId: '1234567890',
        content: 'Hello from WAI SDK!',
        options: { tts: false },
      },
      output: {
        success: true,
        messageId: '9876543210',
        channelId: '1234567890',
      },
    },
  ],
};

/**
 * Discord Messenger Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const discordMessengerExecutor: ToolExecutor = async (params) => {
  const { channelId, content, options = {} } = params;

  if (typeof channelId !== 'string' || !channelId.trim()) {
    return {
      success: false,
      error: 'channelId must be a non-empty string',
    };
  }

  if (typeof content !== 'string' || !content.trim()) {
    return {
      success: false,
      error: 'content must be a non-empty string',
    };
  }

  // Return Discord configuration for host to execute
  return {
    success: true,
    action: 'discord_send',
    config: {
      channelId: channelId.trim(),
      content: content.trim(),
      embeds: options.embeds,
      files: options.files,
      tts: options.tts || false,
      allowedMentions: options.allowedMentions,
      messageReference: options.messageReference,
      components: options.components,
    },
    note: 'Discord messaging requires Discord Bot token and execution by host environment',
  };
};
