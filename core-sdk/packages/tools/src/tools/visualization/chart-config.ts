/**
 * Chart Configuration Tool
 * Generate Chart.js and other chart library configurations
 * Returns config objects for host rendering
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Chart Configuration Tool Definition
 */
export const chartConfigTool: Tool = {
  id: 'chart_config',
  name: 'Chart Configuration Generator',
  description: 'Generate Chart.js, Recharts, and other chart library configurations for host rendering',
  parameters: [
    {
      name: 'chartType',
      type: 'string',
      description: 'Type of chart to generate',
      required: true,
      enum: ['line', 'bar', 'pie', 'doughnut', 'radar', 'scatter', 'area', 'bubble'],
    },
    {
      name: 'data',
      type: 'object',
      description: 'Chart data with labels and datasets',
      required: true,
    },
    {
      name: 'library',
      type: 'string',
      description: 'Chart library to target (default: chartjs)',
      required: false,
      enum: ['chartjs', 'recharts', 'd3', 'plotly'],
      default: 'chartjs',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Chart options (title, legend, axes, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Chart configuration object for the specified library',
  },
  examples: [
    {
      input: {
        chartType: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ label: 'Sales', data: [100, 150, 200] }],
        },
        library: 'chartjs',
      },
      output: {
        success: true,
        library: 'chartjs',
        config: {
          type: 'line',
          data: { labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'Sales', data: [100, 150, 200] }] },
          options: {},
        },
      },
    },
  ],
};

/**
 * Chart Configuration Executor
 */
export const chartConfigExecutor: ToolExecutor = async (params) => {
  const { chartType, data, library = 'chartjs', options = {} } = params;

  try {
    switch (library) {
      case 'chartjs': {
        const config = {
          type: chartType,
          data,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
              title: {
                display: false,
              },
            },
            ...options,
          },
        };

        return {
          success: true,
          library: 'chartjs',
          config,
          cdn: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
        };
      }

      case 'recharts': {
        const config = {
          chartType,
          data: data.datasets?.map((dataset: any, idx: number) => ({
            name: dataset.label,
            data: dataset.data?.map((value: any, i: number) => ({
              name: data.labels?.[i] || `Item ${i + 1}`,
              value,
            })),
          })),
          options: {
            ...options,
          },
        };

        return {
          success: true,
          library: 'recharts',
          config,
          npm: 'recharts',
        };
      }

      case 'd3': {
        const config = {
          chartType,
          data: {
            values: data.datasets?.[0]?.data || [],
            labels: data.labels || [],
          },
          options: {
            width: 800,
            height: 400,
            margin: { top: 20, right: 20, bottom: 30, left: 50 },
            ...options,
          },
        };

        return {
          success: true,
          library: 'd3',
          config,
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      case 'plotly': {
        const config = {
          data: data.datasets?.map((dataset: any) => ({
            x: data.labels,
            y: dataset.data,
            type: chartType === 'line' ? 'scatter' : chartType,
            mode: chartType === 'line' ? 'lines+markers' : undefined,
            name: dataset.label,
          })),
          layout: {
            title: options.title || '',
            xaxis: { title: options.xAxisLabel || '' },
            yaxis: { title: options.yAxisLabel || '' },
            ...options.layout,
          },
        };

        return {
          success: true,
          library: 'plotly',
          config,
          cdn: 'https://cdn.plot.ly/plotly-2.27.0.min.js',
        };
      }

      default:
        throw new Error(`Unknown library: ${library}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
