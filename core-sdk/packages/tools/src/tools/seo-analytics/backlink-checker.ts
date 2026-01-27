/**
 * Backlink Checker Tool
 * Check and analyze backlinks for a domain
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Backlink Checker Tool Definition
 */
export const backlinkCheckerTool: Tool = {
  id: 'backlink_checker',
  name: 'Backlink Checker',
  description: 'Analyze domain backlinks: find linking domains, anchor text, link quality, domain authority',
  parameters: [
    {
      name: 'domain',
      type: 'string',
      description: 'Domain to check backlinks for',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Check options (limit, includeAnchors, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Backlink analysis with linking domains and metrics',
  },
  examples: [
    {
      input: {
        domain: 'example.com',
        options: { limit: 100 },
      },
      output: {
        success: true,
        totalBacklinks: 5432,
        linkingDomains: 234,
        backlinks: [
          {
            url: 'https://blog.example.com/article',
            domain: 'blog.example.com',
            anchorText: 'example website',
            domainAuthority: 65,
          },
        ],
      },
    },
  ],
};

/**
 * Backlink Checker Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const backlinkCheckerExecutor: ToolExecutor = async (params) => {
  const { domain, options = {} } = params;

  if (typeof domain !== 'string' || !domain.trim()) {
    return {
      success: false,
      error: 'domain must be a non-empty string',
    };
  }

  // Return check configuration for host to execute
  return {
    success: true,
    action: 'backlink_check',
    config: {
      domain: domain.trim().replace(/^https?:\/\//, ''),
      limit: options.limit || 100,
      offset: options.offset || 0,
      includeAnchors: options.includeAnchors !== false,
      includeDomainAuthority: options.includeDomainAuthority !== false,
      includeFollowNoFollow: options.includeFollowNoFollow !== false,
      sortBy: options.sortBy || 'domain_authority',
      minDomainAuthority: options.minDomainAuthority || 0,
    },
    note: 'Backlink checking requires SEO API key and execution by host environment',
  };
};
