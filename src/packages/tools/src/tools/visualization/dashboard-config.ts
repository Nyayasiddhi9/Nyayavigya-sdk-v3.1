/**
 * Dashboard Configuration Tool
 * Generate dashboard layouts and widget configurations
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Dashboard Configuration Tool Definition
 */
export const dashboardConfigTool: Tool = {
  id: 'dashboard_config',
  name: 'Dashboard Configuration Generator',
  description: 'Generate dashboard layouts with multiple widgets (charts, tables, metrics)',
  parameters: [
    {
      name: 'widgets',
      type: 'array',
      description: 'Array of widget configurations',
      required: true,
    },
    {
      name: 'layout',
      type: 'string',
      description: 'Layout type',
      required: false,
      enum: ['grid', 'flex', 'masonry', 'custom'],
      default: 'grid',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Dashboard options (theme, spacing, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Dashboard configuration with layout and widgets',
  },
  examples: [
    {
      input: {
        widgets: [
          { type: 'metric', title: 'Total Sales', value: 15000 },
          { type: 'chart', chartType: 'line', data: { labels: ['Jan', 'Feb'], datasets: [] } },
        ],
        layout: 'grid',
      },
      output: {
        success: true,
        layout: 'grid',
        widgets: [
          { id: 'widget-1', type: 'metric', title: 'Total Sales', value: 15000, grid: { x: 0, y: 0, w: 3, h: 2 } },
          { id: 'widget-2', type: 'chart', chartType: 'line', grid: { x: 3, y: 0, w: 9, h: 4 } },
        ],
      },
    },
  ],
};

/**
 * Dashboard Configuration Executor
 */
export const dashboardConfigExecutor: ToolExecutor = async (params) => {
  const { widgets, layout = 'grid', options = {} } = params;

  if (!Array.isArray(widgets) || widgets.length === 0) {
    return {
      success: false,
      error: 'Widgets must be a non-empty array',
    };
  }

  try {
    // Validate grid configuration
    const gridColumns = Math.max(1, options.gridColumns || 12);
    const defaultWidgetHeight = Math.max(1, options.defaultHeight || 4);

    // Track grid cursor and current row max height
    let currentX = 0;
    let currentY = 0;
    let currentRowMaxHeight = 0;

    const layoutedWidgets = widgets.map((widget, idx) => {
      const widgetId = `widget-${idx + 1}`;
      
      switch (layout) {
        case 'grid': {
          // Validate and clamp widget dimensions
          const widgetWidth = Math.max(1, Math.min(widget.width || (widget.type === 'metric' ? 3 : 6), gridColumns));
          const widgetHeight = Math.max(1, widget.height || (widget.type === 'metric' ? 2 : defaultWidgetHeight));
          
          // Check if widget fits in current row
          if (currentX + widgetWidth > gridColumns) {
            // Move to next row
            currentX = 0;
            currentY += currentRowMaxHeight; // Use max height of previous row
            currentRowMaxHeight = 0; // Reset for new row
          }

          const gridPos = {
            x: currentX,
            y: currentY,
            w: widgetWidth,
            h: widgetHeight,
          };

          // Update cursor and track max height in current row
          currentX += widgetWidth;
          currentRowMaxHeight = Math.max(currentRowMaxHeight, widgetHeight);

          return {
            id: widgetId,
            ...widget,
            grid: gridPos,
          };
        }

        case 'flex': {
          return {
            id: widgetId,
            ...widget,
            flex: {
              order: idx,
              grow: widget.grow || 1,
              basis: widget.basis || 'auto',
            },
          };
        }

        case 'masonry': {
          return {
            id: widgetId,
            ...widget,
            masonry: {
              column: idx % 3,
              order: idx,
            },
          };
        }

        case 'custom': {
          return {
            id: widgetId,
            ...widget,
            position: widget.position || { x: 0, y: idx * 100 },
          };
        }

        default:
          return { id: widgetId, ...widget };
      }
    });

    const config = {
      layout,
      gridColumns: layout === 'grid' ? gridColumns : undefined,
      widgets: layoutedWidgets,
      theme: options.theme || 'light',
      spacing: options.spacing || 16,
      responsive: options.responsive !== false,
    };

    return {
      success: true,
      config,
      widgetCount: layoutedWidgets.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
