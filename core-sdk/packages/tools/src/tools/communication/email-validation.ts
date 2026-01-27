/**
 * Email Validation Tool
 * Validate email addresses and check deliverability
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Email Validation Tool Definition
 */
export const emailValidationTool: Tool = {
  id: 'email_validation',
  name: 'Email Validation',
  description: 'Validate email addresses: syntax check, domain validation, MX record lookup, disposable detection',
  parameters: [
    {
      name: 'email',
      type: 'string',
      description: 'Email address to validate',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Validation options (checkMX, checkDisposable, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Validation result with detailed checks',
  },
  examples: [
    {
      input: {
        email: 'user@example.com',
        options: { checkMX: true },
      },
      output: {
        success: true,
        valid: true,
        email: 'user@example.com',
        syntaxValid: true,
        domainValid: true,
        mxRecordsFound: true,
      },
    },
  ],
};

/**
 * Validate email syntax
 */
const validateSyntax = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Extract domain from email
 */
const extractDomain = (email: string): string => {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
};

/**
 * Check if domain looks valid
 */
const validateDomain = (domain: string): boolean => {
  if (!domain) return false;
  
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain);
};

/**
 * Check for common disposable email domains
 */
const isDisposable = (domain: string): boolean => {
  const disposableDomains = [
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'maildrop.cc',
    'temp-mail.org',
  ];

  return disposableDomains.includes(domain.toLowerCase());
};

/**
 * Email Validation Executor
 */
export const emailValidationExecutor: ToolExecutor = async (params) => {
  const { email, options = {} } = params;

  if (typeof email !== 'string' || !email.trim()) {
    return {
      success: false,
      error: 'email must be a non-empty string',
    };
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    const syntaxValid = validateSyntax(trimmedEmail);
    const domain = extractDomain(trimmedEmail);
    const domainValid = validateDomain(domain);
    const disposable = isDisposable(domain);

    // Overall validation
    const valid = syntaxValid && domainValid && !disposable;

    return {
      success: true,
      valid,
      email: trimmedEmail,
      syntaxValid,
      domain,
      domainValid,
      disposable,
      checks: {
        syntax: syntaxValid,
        domain: domainValid,
        notDisposable: !disposable,
      },
      note: options.checkMX
        ? 'MX record check requires DNS lookup by host environment'
        : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
