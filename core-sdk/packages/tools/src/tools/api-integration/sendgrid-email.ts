/**
 * SendGrid Email Tool
 * Send emails via SendGrid
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * SendGrid Email Tool Definition
 */
export const sendgridEmailTool: Tool = {
  id: 'sendgrid_email',
  name: 'SendGrid Email',
  description: 'SendGrid operations: send emails, manage templates, track stats, lists, contacts',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: send_email, send_template, get_stats, manage_contacts, etc.',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: 'Action parameters (to, from, subject, content, etc.)',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'SendGrid API response',
  },
  examples: [
    {
      input: {
        action: 'send_email',
        params: {
          to: 'user@example.com',
          from: 'noreply@company.com',
          subject: 'Welcome!',
          html: '<p>Hello from WAI SDK!</p>',
        },
      },
      output: {
        success: true,
        messageId: 'msg_abc123',
        status: 'sent',
      },
    },
  ],
};

/**
 * SendGrid Email Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const sendgridEmailExecutor: ToolExecutor = async (params) => {
  const { action, params: actionParams } = params;

  const validActions = [
    'send_email', 'send_template',
    'create_template', 'update_template', 'delete_template',
    'get_stats', 'get_bounces', 'get_blocks',
    'add_contact', 'update_contact', 'delete_contact',
    'create_list', 'add_to_list',
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

  // Return SendGrid configuration for host to execute
  return {
    success: true,
    action: `sendgrid_${action}`,
    config: actionParams,
    note: 'SendGrid API requires SendGrid API key and execution by host environment',
  };
};
