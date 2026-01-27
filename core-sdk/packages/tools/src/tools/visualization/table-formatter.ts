/**
 * Table Formatter Tool
 * Format data as HTML, Markdown, ASCII, or JSON tables
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Table Formatter Tool Definition
 */
export const tableFormatterTool: Tool = {
  id: 'table_formatter',
  name: 'Table Formatter',
  description: 'Format data as HTML, Markdown, ASCII, or JSON tables with styling',
  parameters: [
    {
      name: 'data',
      type: 'array',
      description: 'Array of objects to format as table',
      required: true,
    },
    {
      name: 'format',
      type: 'string',
      description: 'Output format',
      required: false,
      enum: ['html', 'markdown', 'ascii', 'json', 'csv'],
      default: 'html',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Formatting options (columns, styling, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Formatted table string',
  },
  examples: [
    {
      input: {
        data: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
        format: 'markdown',
      },
      output: {
        success: true,
        format: 'markdown',
        table: '| name  | age |\n|-------|-----|\n| Alice | 30  |\n| Bob   | 25  |',
      },
    },
  ],
};

/**
 * Table Formatter Executor
 */
export const tableFormatterExecutor: ToolExecutor = async (params) => {
  const { data, format = 'html', options = {} } = params;

  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: 'Data must be a non-empty array of objects',
    };
  }

  try {
    const columns = options.columns || Object.keys(data[0]);

    switch (format) {
      case 'html': {
        const className = options.className || 'data-table';
        const styles = options.styles || '';
        
        let html = `<table class="${className}"${styles ? ` style="${styles}"` : ''}>\n`;
        html += '  <thead>\n    <tr>\n';
        
        for (const col of columns) {
          html += `      <th>${col}</th>\n`;
        }
        
        html += '    </tr>\n  </thead>\n  <tbody>\n';
        
        for (const row of data) {
          html += '    <tr>\n';
          for (const col of columns) {
            html += `      <td>${row[col] ?? ''}</td>\n`;
          }
          html += '    </tr>\n';
        }
        
        html += '  </tbody>\n</table>';

        return {
          success: true,
          format: 'html',
          table: html,
          rowCount: data.length,
        };
      }

      case 'markdown': {
        let md = '| ' + columns.join(' | ') + ' |\n';
        md += '|' + columns.map(() => '-----').join('|') + '|\n';
        
        for (const row of data) {
          md += '| ' + columns.map(col => String(row[col] ?? '')).join(' | ') + ' |\n';
        }

        return {
          success: true,
          format: 'markdown',
          table: md,
          rowCount: data.length,
        };
      }

      case 'ascii': {
        const colWidths = columns.map((col) => {
          const maxWidth = Math.max(
            String(col).length,
            ...data.map((row) => String(row[col] ?? '').length)
          );
          return maxWidth + 2;
        });

        const separator = '+' + colWidths.map(w => '-'.repeat(w)).join('+') + '+';
        
        let ascii = separator + '\n';
        ascii += '|' + columns.map((col, i) => ` ${String(col).padEnd(colWidths[i] - 1)}`).join('|') + '|\n';
        ascii += separator + '\n';
        
        for (const row of data) {
          ascii += '|' + columns.map((col, i) => ` ${String(row[col] ?? '').padEnd(colWidths[i] - 1)}`).join('|') + '|\n';
        }
        
        ascii += separator;

        return {
          success: true,
          format: 'ascii',
          table: ascii,
          rowCount: data.length,
        };
      }

      case 'json': {
        const json = JSON.stringify(data, null, 2);

        return {
          success: true,
          format: 'json',
          table: json,
          rowCount: data.length,
        };
      }

      case 'csv': {
        let csv = columns.join(',') + '\n';
        
        for (const row of data) {
          csv += columns.map(col => {
            const value = String(row[col] ?? '');
            return value.includes(',') ? `"${value}"` : value;
          }).join(',') + '\n';
        }

        return {
          success: true,
          format: 'csv',
          table: csv,
          rowCount: data.length,
        };
      }

      default:
        throw new Error(`Unknown format: ${format}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
