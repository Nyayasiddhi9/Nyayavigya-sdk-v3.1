/**
 * Tool Registry Interface
 * Provides abstraction for tool discovery, registration, and execution
 * Foundation for 80+ tools ecosystem
 */

import { z } from 'zod';

export interface Tool<TInput = unknown, TOutput = unknown> {
  /** Unique tool identifier */
  id: string;
  /** Display name */
  name: string;
  /** Tool description */
  description: string;
  /** Category (data-analysis, web, communication, etc.) */
  category: string;
  /** Input schema (Zod schema) */
  inputSchema: z.ZodSchema<TInput>;
  /** Output schema (Zod schema) */
  outputSchema: z.ZodSchema<TOutput>;
  /** Tool execution function */
  execute: (input: TInput) => Promise<TOutput> | TOutput;
  /** Tags for searchability */
  tags?: string[];
  /** Version */
  version?: string;
  /** Required API keys/credentials */
  requiredCredentials?: string[];
  /** Cost estimate */
  cost?: {
    type: 'free' | 'usage-based' | 'subscription';
    estimate?: string;
  };
  /** Rate limits */
  rateLimit?: {
    requests: number;
    period: 'second' | 'minute' | 'hour' | 'day';
  };
  /** Documentation URL */
  docsUrl?: string;
  /** Examples */
  examples?: ToolExample<TInput, TOutput>[];
}

export interface ToolExample<TInput = unknown, TOutput = unknown> {
  /** Example title */
  title: string;
  /** Example description */
  description?: string;
  /** Example input */
  input: TInput;
  /** Expected output */
  output: TOutput;
}

export interface ToolExecutionContext {
  /** User ID (for rate limiting, analytics) */
  userId?: string;
  /** Session ID */
  sessionId?: string;
  /** Credentials/API keys */
  credentials?: Record<string, string>;
  /** Timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoff?: 'exponential' | 'linear' | 'fixed';
  };
}

export interface ToolExecutionResult<TOutput = unknown> {
  /** Tool ID */
  toolId: string;
  /** Execution status */
  status: 'success' | 'error' | 'timeout' | 'rate-limited';
  /** Result data (if success) */
  data?: TOutput;
  /** Error (if failed) */
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  /** Execution time in ms */
  executionTime: number;
  /** Cost incurred */
  cost?: number;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface IToolRegistry {
  /**
   * Register a new tool
   * @param tool - Tool definition
   */
  register<TInput = unknown, TOutput = unknown>(
    tool: Tool<TInput, TOutput>
  ): void;

  /**
   * Get a tool by ID
   * @param id - Tool ID
   * @returns Tool definition or undefined
   */
  get<TInput = unknown, TOutput = unknown>(
    id: string
  ): Tool<TInput, TOutput> | undefined;

  /**
   * List all tools
   * @param category - Filter by category (optional)
   * @param tags - Filter by tags (optional)
   * @returns Array of tools
   */
  list(category?: string, tags?: string[]): Tool[];

  /**
   * Search tools by query
   * @param query - Search query
   * @returns Array of matching tools
   */
  search(query: string): Tool[];

  /**
   * Execute a tool
   * @param id - Tool ID
   * @param input - Tool input
   * @param context - Execution context
   * @returns Execution result
   */
  execute<TInput = unknown, TOutput = unknown>(
    id: string,
    input: TInput,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult<TOutput>>;

  /**
   * Unregister a tool
   * @param id - Tool ID
   * @returns True if unregistered
   */
  unregister(id: string): boolean;

  /**
   * Get tool categories
   * @returns Array of unique categories
   */
  getCategories(): string[];

  /**
   * Get tools by category
   * @param category - Category name
   * @returns Array of tools
   */
  getByCategory(category: string): Tool[];
}

/**
 * In-Memory Tool Registry (default implementation)
 */
export class MemoryToolRegistry implements IToolRegistry {
  private tools = new Map<string, Tool>();

  register<TInput = unknown, TOutput = unknown>(
    tool: Tool<TInput, TOutput>
  ): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool with ID "${tool.id}" already registered`);
    }
    this.tools.set(tool.id, tool as Tool);
  }

  get<TInput = unknown, TOutput = unknown>(
    id: string
  ): Tool<TInput, TOutput> | undefined {
    return this.tools.get(id) as Tool<TInput, TOutput> | undefined;
  }

  list(category?: string, tags?: string[]): Tool[] {
    let tools = Array.from(this.tools.values());

    if (category) {
      tools = tools.filter(t => t.category === category);
    }

    if (tags && tags.length > 0) {
      tools = tools.filter(t => 
        tags.some(tag => t.tags?.includes(tag))
      );
    }

    return tools;
  }

  search(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.tools.values()).filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async execute<TInput = unknown, TOutput = unknown>(
    id: string,
    input: TInput,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionResult<TOutput>> {
    const tool = this.get<TInput, TOutput>(id);
    
    if (!tool) {
      return {
        toolId: id,
        status: 'error',
        error: {
          message: `Tool not found: ${id}`,
          code: 'TOOL_NOT_FOUND',
        },
        executionTime: 0,
      };
    }

    // Validate input
    const validation = tool.inputSchema.safeParse(input);
    if (!validation.success) {
      return {
        toolId: id,
        status: 'error',
        error: {
          message: 'Invalid input',
          code: 'VALIDATION_ERROR',
          details: validation.error.format(),
        },
        executionTime: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Execute with timeout
      const timeout = context?.timeout || 30000;
      const result = await Promise.race([
        tool.execute(validation.data),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      return {
        toolId: id,
        status: 'success',
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.message === 'Timeout';
      
      return {
        toolId: id,
        status: isTimeout ? 'timeout' : 'error',
        error: {
          message: error instanceof Error ? error.message : String(error),
          code: isTimeout ? 'TIMEOUT' : 'EXECUTION_ERROR',
        },
        executionTime: Date.now() - startTime,
      };
    }
  }

  unregister(id: string): boolean {
    return this.tools.delete(id);
  }

  getCategories(): string[] {
    const categories = new Set(
      Array.from(this.tools.values()).map(t => t.category)
    );
    return Array.from(categories).sort();
  }

  getByCategory(category: string): Tool[] {
    return this.list(category);
  }
}
