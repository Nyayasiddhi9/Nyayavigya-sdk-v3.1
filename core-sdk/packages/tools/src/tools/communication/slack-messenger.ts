/**
 * Slack Messenger Tool
 * Send messages to Slack channels and users
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Slack Messenger Tool Definition
 */
export const slackMessengerTool: Tool = {
  id: 'slack_messenger',
  name: 'Slack Messenger',
  description: 'Send Slack messages: channels, DMs, threads, attachments, interactive blocks',
  parameters: [
    {
      name: 'channel',
      type: 'string',
      description: 'Channel ID or name (#general) or user ID (@user)',
      required: true,
    },
    {
      name: 'text',
      type: 'string',
      description: 'Message text (supports Slack markdown)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Message options (threadTs, blocks, attachments, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Slack message result with timestamp',
  },
  examples: [
    {
      input: {
        channel: '#general',
        text: 'Hello from WAI SDK!',
        options: { username: 'WAI Bot', iconEmoji: ':robot:' },
      },
      output: {
        success: true,
        ts: '1234567890.123456',
        channel: 'C1234567890',
      },
    },
  ],
};

/**
 * Slack Messenger Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const slackMessengerExecutor: ToolExecutor = async (params) => {
  const { channel, text, options = {} } = params;

  if (typeof channel !== 'string' || !channel.trim()) {
    return {
      success: false,
      error: 'channel must be a non-empty string',
    };
  }

  if (typeof text !== 'string' || !text.trim()) {
    return {
      success: false,
      error: 'text must be a non-empty string',
    };
  }

  // Return Slack configuration for host to execute
  return {
    success: true,
    action: 'slack_send',
    config: {
      channel: channel.trim(),
      text: text.trim(),
      threadTs: options.threadTs,
      blocks: options.blocks,
      attachments: options.attachments,
      username: options.username,
      iconEmoji: options.iconEmoji,
      iconUrl: options.iconUrl,
      linkNames: options.linkNames,
      unfurlLinks: options.unfurlLinks,
    },
    note: 'Slack messaging requires Slack Bot token and execution by host environment',
  };
};
