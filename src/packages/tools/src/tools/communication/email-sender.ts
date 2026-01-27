/**
 * Email Sender Tool
 * Send emails via SMTP or email service providers
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Email Sender Tool Definition
 */
export const emailSenderTool: Tool = {
  id: 'email_sender',
  name: 'Email Sender',
  description: 'Send emails via SMTP/SendGrid/Mailgun: single recipients, attachments, HTML templates',
  parameters: [
    {
      name: 'to',
      type: 'any',
      description: 'Recipient email address (string) or array of addresses',
      required: true,
    },
    {
      name: 'subject',
      type: 'string',
      description: 'Email subject',
      required: true,
    },
    {
      name: 'body',
      type: 'string',
      description: 'Email body (plain text or HTML)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Email options (from, cc, bcc, attachments, html, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Email send result with message ID',
  },
  examples: [
    {
      input: {
        to: 'user@example.com',
        subject: 'Hello',
        body: 'This is a test email',
        options: { from: 'noreply@company.com', html: true },
      },
      output: {
        success: true,
        messageId: '<abc123@mail.company.com>',
      },
    },
  ],
};

/**
 * Email Sender Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const emailSenderExecutor: ToolExecutor = async (params) => {
  const { to, subject, body, options = {} } = params;

  if (!to || (typeof to !== 'string' && !Array.isArray(to))) {
    return {
      success: false,
      error: 'to must be a string or array of email addresses',
    };
  }

  if (typeof subject !== 'string' || !subject.trim()) {
    return {
      success: false,
      error: 'subject must be a non-empty string',
    };
  }

  if (typeof body !== 'string' || !body.trim()) {
    return {
      success: false,
      error: 'body must be a non-empty string',
    };
  }

  // Return email configuration for host to execute
  return {
    success: true,
    action: 'email_send',
    config: {
      to: Array.isArray(to) ? to : [to],
      subject: subject.trim(),
      body: body.trim(),
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
      html: options.html || false,
      priority: options.priority,
      headers: options.headers,
    },
    note: 'Email sending requires SMTP/SendGrid/Mailgun credentials and execution by host environment',
  };
};
