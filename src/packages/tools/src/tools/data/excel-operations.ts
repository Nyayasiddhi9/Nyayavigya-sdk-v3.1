/**
 * Excel Operations Tool
 * Read, write, and manipulate Excel files using xlsx library
 */

import * as XLSX from 'xlsx';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Excel Operations Tool Definition
 */
export const excelOperationsTool: Tool = {
  id: 'excel_operations',
  name: 'Excel Operations',
  description: 'Read Excel files to JSON, write JSON to Excel, manipulate worksheets, and analyze Excel data',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['read', 'write', 'getSheets', 'readSheet', 'createWorkbook', 'analyze'],
    },
    {
      name: 'data',
      type: 'string',
      description: 'Base64-encoded Excel file data or JSON data',
      required: false,
    },
    {
      name: 'sheetName',
      type: 'string',
      description: 'Worksheet name (for readSheet operation)',
      required: false,
    },
    {
      name: 'sheets',
      type: 'object',
      description: 'Worksheets data for createWorkbook (format: { sheetName: data[] })',
      required: false,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Operation-specific options',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Operation result with Excel data or metadata',
  },
  examples: [
    {
      input: {
        operation: 'read',
        data: '<base64-excel-data>',
      },
      output: {
        success: true,
        sheets: ['Sheet1'],
        data: {
          Sheet1: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
        },
      },
    },
    {
      input: {
        operation: 'write',
        sheets: {
          Sheet1: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
          ],
        },
      },
      output: {
        success: true,
        base64: '<base64-excel-data>',
      },
    },
  ],
};

/**
 * Excel Operations Executor
 */
export const excelOperationsExecutor: ToolExecutor = async (params) => {
  const { operation, data, sheetName, sheets, options = {} } = params;

  try {
    switch (operation) {
      case 'read': {
        if (!data) {
          throw new Error('Data parameter is required for read operation');
        }

        const buffer = Buffer.from(data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer', ...options });

        const result: Record<string, any[]> = {};
        for (const sheet of workbook.SheetNames) {
          result[sheet] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
        }

        return {
          success: true,
          sheets: workbook.SheetNames,
          data: result,
          sheetCount: workbook.SheetNames.length,
        };
      }

      case 'write': {
        if (!sheets) {
          throw new Error('Sheets parameter is required for write operation');
        }

        const workbook = XLSX.utils.book_new();

        for (const [name, sheetData] of Object.entries(sheets)) {
          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, name);
        }

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', ...options });
        const base64 = buffer.toString('base64');

        return {
          success: true,
          base64,
          size: buffer.length,
          sheets: Object.keys(sheets),
        };
      }

      case 'getSheets': {
        if (!data) {
          throw new Error('Data parameter is required for getSheets operation');
        }

        const buffer = Buffer.from(data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        return {
          success: true,
          sheets: workbook.SheetNames,
          count: workbook.SheetNames.length,
        };
      }

      case 'readSheet': {
        if (!data || !sheetName) {
          throw new Error('Data and sheetName parameters are required for readSheet operation');
        }

        const buffer = Buffer.from(data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        if (!workbook.SheetNames.includes(sheetName)) {
          throw new Error(`Sheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        return {
          success: true,
          sheetName,
          data: jsonData,
          rowCount: jsonData.length,
        };
      }

      case 'createWorkbook': {
        if (!sheets) {
          throw new Error('Sheets parameter is required for createWorkbook operation');
        }

        const workbook = XLSX.utils.book_new();
        const sheetNames: string[] = [];

        for (const [name, sheetData] of Object.entries(sheets)) {
          const worksheet = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, worksheet, name);
          sheetNames.push(name);
        }

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const base64 = buffer.toString('base64');

        return {
          success: true,
          base64,
          sheets: sheetNames,
          size: buffer.length,
        };
      }

      case 'analyze': {
        if (!data) {
          throw new Error('Data parameter is required for analyze operation');
        }

        const buffer = Buffer.from(data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        const analysis: Record<string, any> = {};

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

          analysis[sheetName] = {
            rowCount: jsonData.length,
            columnCount: range.e.c - range.s.c + 1,
            columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
            hasData: jsonData.length > 0,
          };
        }

        return {
          success: true,
          sheetCount: workbook.SheetNames.length,
          sheets: workbook.SheetNames,
          analysis,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
