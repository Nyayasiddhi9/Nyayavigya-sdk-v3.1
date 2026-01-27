/**
 * Data Visualization Configuration Tool
 * Generate D3.js and advanced visualization configurations
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Data Visualization Configuration Tool Definition
 */
export const dataVizConfigTool: Tool = {
  id: 'data_viz_config',
  name: 'Data Visualization Configuration',
  description: 'Generate D3.js and advanced visualization configs (tree maps, sankey, network graphs, heatmaps)',
  parameters: [
    {
      name: 'vizType',
      type: 'string',
      description: 'Type of visualization',
      required: true,
      enum: ['treemap', 'sankey', 'network', 'heatmap', 'sunburst', 'chord', 'force'],
    },
    {
      name: 'data',
      type: 'object',
      description: 'Visualization data',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Visualization options',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'D3.js visualization configuration',
  },
  examples: [
    {
      input: {
        vizType: 'treemap',
        data: {
          name: 'root',
          children: [
            { name: 'A', value: 100 },
            { name: 'B', value: 200 },
          ],
        },
      },
      output: {
        success: true,
        vizType: 'treemap',
        config: {
          data: { name: 'root', children: [{ name: 'A', value: 100 }, { name: 'B', value: 200 }] },
          width: 800,
          height: 600,
        },
      },
    },
  ],
};

/**
 * Data Visualization Configuration Executor
 */
export const dataVizConfigExecutor: ToolExecutor = async (params) => {
  const { vizType, data, options = {} } = params;

  try {
    const width = options.width || 800;
    const height = options.height || 600;

    switch (vizType) {
      case 'treemap': {
        const config = {
          data,
          width,
          height,
          paddingInner: options.paddingInner || 1,
          paddingOuter: options.paddingOuter || 3,
          paddingTop: options.paddingTop || 20,
          colorScheme: options.colorScheme || 'schemeCategory10',
        };

        return {
          success: true,
          vizType: 'treemap',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      case 'sankey': {
        const config = {
          nodes: data.nodes || [],
          links: data.links || [],
          width,
          height,
          nodeWidth: options.nodeWidth || 15,
          nodePadding: options.nodePadding || 10,
          iterations: options.iterations || 6,
        };

        return {
          success: true,
          vizType: 'sankey',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
          plugin: 'https://unpkg.com/d3-sankey@0.12.3/dist/d3-sankey.min.js',
        };
      }

      case 'network':
      case 'force': {
        const config = {
          nodes: data.nodes || [],
          links: data.links || [],
          width,
          height,
          charge: options.charge || -300,
          distance: options.distance || 100,
          gravity: options.gravity || 0.1,
          iterations: options.iterations || 100,
        };

        return {
          success: true,
          vizType: 'network',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      case 'heatmap': {
        const config = {
          data: data.values || [],
          xLabels: data.xLabels || [],
          yLabels: data.yLabels || [],
          width,
          height,
          colorScheme: options.colorScheme || 'interpolateYlOrRd',
          margin: options.margin || { top: 30, right: 30, bottom: 30, left: 60 },
        };

        return {
          success: true,
          vizType: 'heatmap',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      case 'sunburst': {
        const config = {
          data,
          width,
          height,
          radius: Math.min(width, height) / 2,
          colorScheme: options.colorScheme || 'schemeCategory10',
        };

        return {
          success: true,
          vizType: 'sunburst',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      case 'chord': {
        const config = {
          matrix: data.matrix || [],
          labels: data.labels || [],
          width,
          height,
          innerRadius: options.innerRadius || Math.min(width, height) * 0.4,
          outerRadius: options.outerRadius || Math.min(width, height) * 0.45,
        };

        return {
          success: true,
          vizType: 'chord',
          config,
          library: 'd3',
          cdn: 'https://d3js.org/d3.v7.min.js',
        };
      }

      default:
        throw new Error(`Unknown visualization type: ${vizType}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
