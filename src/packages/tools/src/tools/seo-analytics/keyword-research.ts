/**
 * Keyword Research Tool
 * Research keywords for SEO and content strategy
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Keyword Research Tool Definition
 */
export const keywordResearchTool: Tool = {
  id: 'keyword_research',
  name: 'Keyword Research',
  description: 'Research SEO keywords: find related keywords, search volume, competition, suggestions',
  parameters: [
    {
      name: 'keyword',
      type: 'string',
      description: 'Seed keyword to research',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Research options (country, language, limit, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Keyword research results with related keywords and metrics',
  },
  examples: [
    {
      input: {
        keyword: 'web development',
        options: { country: 'US', limit: 50 },
      },
      output: {
        success: true,
        keywords: [
          {
            keyword: 'web development tutorial',
            searchVolume: 12000,
            competition: 'medium',
            cpc: 2.5,
          },
        ],
      },
    },
  ],
};

/**
 * Keyword Research Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const keywordResearchExecutor: ToolExecutor = async (params) => {
  const { keyword, options = {} } = params;

  if (typeof keyword !== 'string' || !keyword.trim()) {
    return {
      success: false,
      error: 'keyword must be a non-empty string',
    };
  }

  // Return research configuration for host to execute
  return {
    success: true,
    action: 'keyword_research',
    config: {
      keyword: keyword.trim(),
      country: options.country || 'US',
      language: options.language || 'en',
      limit: options.limit || 100,
      includeSearchVolume: options.includeSearchVolume !== false,
      includeCompetition: options.includeCompetition !== false,
      includeCPC: options.includeCPC !== false,
      includeTrends: options.includeTrends || false,
    },
    note: 'Keyword research requires keyword research API key and execution by host environment',
  };
};
