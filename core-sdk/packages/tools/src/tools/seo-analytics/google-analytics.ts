/**
 * Google Analytics Tool
 * Query Google Analytics data and metrics
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Google Analytics Tool Definition
 */
export const googleAnalyticsTool: Tool = {
  id: 'google_analytics',
  name: 'Google Analytics',
  description: 'Query Google Analytics: get page views, sessions, users, events, conversion data',
  parameters: [
    {
      name: 'query',
      type: 'object',
      description: 'Analytics query (metrics, dimensions, dateRange, etc.)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Query options (propertyId, orderBy, limit, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Analytics data matching the query',
  },
  examples: [
    {
      input: {
        query: {
          metrics: ['activeUsers', 'screenPageViews'],
          dimensions: ['date', 'pagePath'],
          dateRange: { startDate: '7daysAgo', endDate: 'today' },
        },
        options: { limit: 100 },
      },
      output: {
        success: true,
        rows: [
          {
            date: '2024-01-01',
            pagePath: '/home',
            activeUsers: 1234,
            screenPageViews: 5678,
          },
        ],
      },
    },
  ],
};

/**
 * Google Analytics Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const googleAnalyticsExecutor: ToolExecutor = async (params) => {
  const { query, options = {} } = params;

  if (!query || typeof query !== 'object') {
    return {
      success: false,
      error: 'query must be an object with metrics and dimensions',
    };
  }

  if (!query.metrics || !Array.isArray(query.metrics) || query.metrics.length === 0) {
    return {
      success: false,
      error: 'query.metrics must be a non-empty array',
    };
  }

  // Return analytics configuration for host to execute
  return {
    success: true,
    action: 'google_analytics',
    config: {
      propertyId: options.propertyId,
      metrics: query.metrics,
      dimensions: query.dimensions || [],
      dateRange: query.dateRange || {
        startDate: '7daysAgo',
        endDate: 'today',
      },
      dimensionFilter: query.dimensionFilter,
      metricFilter: query.metricFilter,
      orderBy: options.orderBy,
      limit: options.limit || 10000,
      offset: options.offset || 0,
      keepEmptyRows: options.keepEmptyRows || false,
    },
    note: 'Google Analytics requires GA4 API credentials and execution by host environment',
  };
};
