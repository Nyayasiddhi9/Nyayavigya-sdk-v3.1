/**
 * Real-Time Widget Configuration Tool
 * Generate configurations for real-time data widgets (metrics, gauges, sparklines)
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Real-Time Widget Configuration Tool Definition
 */
export const realTimeWidgetTool: Tool = {
  id: 'realtime_widget',
  name: 'Real-Time Widget Configuration',
  description: 'Generate real-time widget configs (metrics, gauges, sparklines, progress bars)',
  parameters: [
    {
      name: 'widgetType',
      type: 'string',
      description: 'Type of widget',
      required: true,
      enum: ['metric', 'gauge', 'sparkline', 'progress', 'stat', 'indicator'],
    },
    {
      name: 'data',
      type: 'object',
      description: 'Widget data (value, trend, target, etc.)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Widget options (thresholds, colors, formatting)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Real-time widget configuration',
  },
  examples: [
    {
      input: {
        widgetType: 'metric',
        data: { value: 1234, label: 'Active Users', trend: 12 },
        options: { format: 'number', prefix: '', suffix: '' },
      },
      output: {
        success: true,
        widgetType: 'metric',
        config: {
          value: 1234,
          label: 'Active Users',
          trend: 12,
          trendDirection: 'up',
          format: 'number',
        },
      },
    },
  ],
};

/**
 * Real-Time Widget Executor
 */
export const realTimeWidgetExecutor: ToolExecutor = async (params) => {
  const { widgetType, data, options = {} } = params;

  try {
    switch (widgetType) {
      case 'metric': {
        const value = data.value;
        const trend = data.trend || 0;
        
        const config = {
          value,
          label: data.label || '',
          trend,
          trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral',
          format: options.format || 'number',
          prefix: options.prefix || '',
          suffix: options.suffix || '',
          decimals: options.decimals || 0,
          color: options.color || (trend > 0 ? 'green' : trend < 0 ? 'red' : 'gray'),
        };

        return {
          success: true,
          widgetType: 'metric',
          config,
        };
      }

      case 'gauge': {
        const value = data.value;
        const min = data.min || 0;
        const max = data.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;

        const config = {
          value,
          min,
          max,
          percentage,
          label: data.label || '',
          thresholds: options.thresholds || [
            { value: 33, color: 'red' },
            { value: 66, color: 'yellow' },
            { value: 100, color: 'green' },
          ],
          showValue: options.showValue !== false,
          showPercentage: options.showPercentage || false,
        };

        return {
          success: true,
          widgetType: 'gauge',
          config,
        };
      }

      case 'sparkline': {
        const values = data.values || [];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const last = values[values.length - 1];
        const previous = values[values.length - 2];
        const change = previous ? ((last - previous) / previous) * 100 : 0;

        const config = {
          values,
          min,
          max,
          last,
          change,
          changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
          width: options.width || 100,
          height: options.height || 30,
          color: options.color || '#4CAF50',
          showDots: options.showDots || false,
        };

        return {
          success: true,
          widgetType: 'sparkline',
          config,
        };
      }

      case 'progress': {
        const value = data.value;
        const max = data.max || 100;
        const percentage = (value / max) * 100;

        const config = {
          value,
          max,
          percentage,
          label: data.label || '',
          showPercentage: options.showPercentage !== false,
          showValue: options.showValue || false,
          color: options.color || '#2196F3',
          height: options.height || 20,
        };

        return {
          success: true,
          widgetType: 'progress',
          config,
        };
      }

      case 'stat': {
        const value = data.value;
        const compare = data.compare;
        const change = compare ? ((value - compare) / compare) * 100 : 0;

        const config = {
          value,
          label: data.label || '',
          compare,
          change,
          changeDirection: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
          format: options.format || 'number',
          decimals: options.decimals || 0,
          showChange: options.showChange !== false,
        };

        return {
          success: true,
          widgetType: 'stat',
          config,
        };
      }

      case 'indicator': {
        const status = data.status || 'normal';
        
        const config = {
          status,
          label: data.label || '',
          value: data.value,
          message: data.message || '',
          color: options.statusColors?.[status] || (
            status === 'critical' ? 'red' :
            status === 'warning' ? 'yellow' :
            status === 'success' ? 'green' : 'gray'
          ),
          blinking: options.blinking && status === 'critical',
        };

        return {
          success: true,
          widgetType: 'indicator',
          config,
        };
      }

      default:
        throw new Error(`Unknown widget type: ${widgetType}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
