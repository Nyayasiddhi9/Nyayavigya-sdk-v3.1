/**
 * Email Parser Tool
 * Parse email messages and extract headers, body, attachments
 * 
 * CURRENT LIMITATION (Phase 1): Blank separator lines must be empty (no whitespace)
 * Full RFC 5322 compliance (whitespace-only separator lines) planned for Phase 2
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Email Parser Tool Definition
 */
export const emailParserTool: Tool = {
  id: 'email_parser',
  name: 'Email Parser',
  description: 'Parse email messages: extract headers, subject, body, attachments, parse MIME format',
  parameters: [
    {
      name: 'rawEmail',
      type: 'string',
      description: 'Raw email message (RFC 822 format)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Parsing options (extractAttachments, decodeHtml, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Parsed email data with headers, body, and attachments',
  },
  examples: [
    {
      input: {
        rawEmail: 'From: sender@example.com\nTo: recipient@example.com\nSubject: Test\n\nBody text',
        options: { extractAttachments: true },
      },
      output: {
        success: true,
        from: 'sender@example.com',
        to: ['recipient@example.com'],
        subject: 'Test',
        body: 'Body text',
        attachments: [],
      },
    },
  ],
};

/**
 * Normalize line endings (CRLF to LF)
 */
const normalizeLineEndings = (text: string): string => {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
};

/**
 * Unfold headers (handle multi-line headers per RFC 5322)
 */
const unfoldHeaders = (headerText: string): string => {
  // Continuation lines start with whitespace
  return headerText.replace(/\n[ \t]+/g, ' ');
};

/**
 * Parse email headers
 */
const parseHeaders = (rawEmail: string): any => {
  const headers: any = {};
  
  // Normalize line endings
  const normalized = normalizeLineEndings(rawEmail);
  
  // Find first blank line (separates headers from body)
  const blankLineIndex = normalized.indexOf('\n\n');
  const headerSection = blankLineIndex >= 0 ? normalized.substring(0, blankLineIndex) : normalized;
  
  // Unfold multi-line headers
  const unfolded = unfoldHeaders(headerSection);
  const lines = unfolded.split('\n');

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const headerKey = key.toLowerCase();
      
      if (headerKey === 'to' || headerKey === 'cc' || headerKey === 'bcc') {
        headers[headerKey] = value.split(',').map(email => email.trim());
      } else {
        headers[headerKey] = value.trim();
      }
    }
  }

  return headers;
};

/**
 * Extract email body
 */
const extractBody = (rawEmail: string): string => {
  // Normalize line endings
  const normalized = normalizeLineEndings(rawEmail);
  
  // Find first blank line
  const blankLineIndex = normalized.indexOf('\n\n');
  
  if (blankLineIndex >= 0) {
    return normalized.substring(blankLineIndex + 2).trim();
  }
  
  return '';
};

/**
 * Email Parser Executor
 */
export const emailParserExecutor: ToolExecutor = async (params) => {
  const { rawEmail, options = {} } = params;

  if (typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return {
      success: false,
      error: 'rawEmail must be a non-empty string',
    };
  }

  try {
    const headers = parseHeaders(rawEmail);
    const body = extractBody(rawEmail);

    return {
      success: true,
      from: headers.from || '',
      to: headers.to || [],
      cc: headers.cc || [],
      bcc: headers.bcc || [],
      subject: headers.subject || '',
      date: headers.date || '',
      body,
      headers,
      messageId: headers['message-id'] || '',
      inReplyTo: headers['in-reply-to'] || '',
      references: headers.references || '',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
