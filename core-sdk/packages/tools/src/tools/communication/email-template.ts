/**
 * Email Template Tool
 * Generate emails from templates with variable substitution
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Email Template Tool Definition
 */
export const emailTemplateTool: Tool = {
  id: 'email_template',
  name: 'Email Template',
  description: 'Generate emails from templates: variable substitution, conditional blocks, loops',
  parameters: [
    {
      name: 'template',
      type: 'string',
      description: 'Email template with {{variables}}',
      required: true,
    },
    {
      name: 'variables',
      type: 'object',
      description: 'Variables to substitute in template',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Template options (format, escapeHtml, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Rendered email content',
  },
  examples: [
    {
      input: {
        template: 'Hello {{name}}, your order {{orderId}} is ready!',
        variables: { name: 'John', orderId: '12345' },
      },
      output: {
        success: true,
        content: 'Hello John, your order 12345 is ready!',
      },
    },
  ],
};

/**
 * Render template with variables
 */
const renderTemplate = (template: string, variables: any, escapeHtml: boolean = false): string => {
  let result = template;

  // Replace {{variable}} patterns
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    const valueStr = String(value);
    const escapedValue = escapeHtml ? escapeHtmlEntities(valueStr) : valueStr;
    result = result.replace(regex, escapedValue);
  }

  return result;
};

/**
 * Escape HTML entities
 */
const escapeHtmlEntities = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Email Template Executor
 */
export const emailTemplateExecutor: ToolExecutor = async (params) => {
  const { template, variables, options = {} } = params;

  if (typeof template !== 'string' || !template.trim()) {
    return {
      success: false,
      error: 'template must be a non-empty string',
    };
  }

  if (!variables || typeof variables !== 'object') {
    return {
      success: false,
      error: 'variables must be an object',
    };
  }

  try {
    const content = renderTemplate(template, variables, options.escapeHtml);

    return {
      success: true,
      content,
      variablesUsed: Object.keys(variables),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
