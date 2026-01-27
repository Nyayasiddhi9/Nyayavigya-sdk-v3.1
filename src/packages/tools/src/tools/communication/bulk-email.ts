/**
 * Bulk Email Tool
 * Send emails to multiple recipients with personalization
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Bulk Email Tool Definition
 */
export const bulkEmailTool: Tool = {
  id: 'bulk_email',
  name: 'Bulk Email',
  description: 'Send personalized emails to multiple recipients: mail merge, batch sending, rate limiting',
  parameters: [
    {
      name: 'recipients',
      type: 'array',
      description: 'Array of recipient objects with email and variables',
      required: true,
    },
    {
      name: 'template',
      type: 'object',
      description: 'Email template with subject and body',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Sending options (batchSize, delayMs, from, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Bulk send results with success/failure counts',
  },
  examples: [
    {
      input: {
        recipients: [
          { email: 'user1@example.com', name: 'Alice', orderId: '001' },
          { email: 'user2@example.com', name: 'Bob', orderId: '002' },
        ],
        template: {
          subject: 'Order {{orderId}} Update',
          body: 'Hi {{name}}, your order {{orderId}} has shipped!',
        },
        options: { batchSize: 100, delayMs: 1000 },
      },
      output: {
        success: true,
        totalSent: 2,
        totalFailed: 0,
      },
    },
  ],
};

/**
 * Bulk Email Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const bulkEmailExecutor: ToolExecutor = async (params) => {
  const { recipients, template, options = {} } = params;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return {
      success: false,
      error: 'recipients must be a non-empty array',
    };
  }

  if (!template || !template.subject || !template.body) {
    return {
      success: false,
      error: 'template must have subject and body',
    };
  }

  // Validate recipients
  for (const [index, recipient] of recipients.entries()) {
    if (!recipient.email) {
      return {
        success: false,
        error: `Recipient at index ${index} missing email address`,
      };
    }
  }

  // Return bulk email configuration for host to execute
  return {
    success: true,
    action: 'bulk_email_send',
    config: {
      recipients,
      template,
      from: options.from,
      batchSize: options.batchSize || 100,
      delayMs: options.delayMs || 1000,
      trackOpens: options.trackOpens || false,
      trackClicks: options.trackClicks || false,
      unsubscribeLink: options.unsubscribeLink,
    },
    note: 'Bulk email sending requires email service provider credentials and execution by host environment',
  };
};
