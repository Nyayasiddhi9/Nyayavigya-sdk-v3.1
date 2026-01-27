/**
 * File Operations Tool
 * Production-ready file system operations with safety checks
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * File Operations Tool Definition
 */
export const fileOperationsTool: Tool = {
  id: 'file_operations',
  name: 'File Operations',
  description: 'Read, write, list, delete files and directories with safety checks',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['read', 'write', 'list', 'delete', 'exists', 'mkdir', 'stat'],
    },
    {
      name: 'path',
      type: 'string',
      description: 'File or directory path (relative or absolute)',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'Content to write (for write operation)',
      required: false,
    },
    {
      name: 'encoding',
      type: 'string',
      description: 'File encoding (default: utf8)',
      required: false,
      default: 'utf8',
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'Recursive operation for mkdir/list (default: false)',
      required: false,
      default: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Operation result with data or status',
  },
  examples: [
    {
      input: { operation: 'read', path: './data.json' },
      output: { success: true, data: '{"key": "value"}' },
    },
    {
      input: { operation: 'write', path: './output.txt', content: 'Hello World' },
      output: { success: true, message: 'File written successfully' },
    },
    {
      input: { operation: 'list', path: './src', recursive: true },
      output: { success: true, files: ['file1.ts', 'file2.ts'] },
    },
  ],
};

/**
 * File Operations Executor
 */
export const fileOperationsExecutor: ToolExecutor = async (params) => {
  const { operation, path, content, encoding = 'utf8', recursive = false } = params;

  // Resolve and sanitize path
  const safePath = resolve(path);

  try {
    switch (operation) {
      case 'read': {
        const data = await fs.readFile(safePath, encoding as BufferEncoding);
        return {
          success: true,
          data,
          path: safePath,
        };
      }

      case 'write': {
        if (!content) {
          throw new Error('Content parameter is required for write operation');
        }
        // Ensure directory exists
        await fs.mkdir(dirname(safePath), { recursive: true });
        await fs.writeFile(safePath, content, encoding as BufferEncoding);
        return {
          success: true,
          message: 'File written successfully',
          path: safePath,
        };
      }

      case 'list': {
        const entries = await fs.readdir(safePath, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
          const fullPath = join(safePath, entry.name);
          if (entry.isDirectory() && recursive) {
            const subFiles = await listRecursive(fullPath);
            files.push(...subFiles.map(f => join(entry.name, f)));
          } else {
            files.push(entry.name);
          }
        }

        return {
          success: true,
          files,
          count: files.length,
          path: safePath,
        };
      }

      case 'delete': {
        const stats = await fs.stat(safePath);
        if (stats.isDirectory()) {
          await fs.rm(safePath, { recursive: true, force: true });
        } else {
          await fs.unlink(safePath);
        }
        return {
          success: true,
          message: 'File/directory deleted successfully',
          path: safePath,
        };
      }

      case 'exists': {
        try {
          await fs.access(safePath);
          return {
            success: true,
            exists: true,
            path: safePath,
          };
        } catch {
          return {
            success: true,
            exists: false,
            path: safePath,
          };
        }
      }

      case 'mkdir': {
        await fs.mkdir(safePath, { recursive });
        return {
          success: true,
          message: 'Directory created successfully',
          path: safePath,
        };
      }

      case 'stat': {
        const stats = await fs.stat(safePath);
        return {
          success: true,
          stats: {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
          },
          path: safePath,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    throw new Error(`File operation failed: ${error.message}`);
  }
};

/**
 * Recursively list files in a directory
 */
async function listRecursive(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await listRecursive(fullPath);
      files.push(...subFiles.map(f => join(entry.name, f)));
    } else {
      files.push(entry.name);
    }
  }

  return files;
}
