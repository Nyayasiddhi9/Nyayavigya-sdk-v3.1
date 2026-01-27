/**
 * Natural Language Database Tool Service
 * 
 * Converts natural language queries to SQL using WAI SDK
 * Provides safe database operations with validation and logging
 * 
 * Phase 3 Track B: Production-ready NL database interface
 */

import { db, pool } from '../db';
import { WAIRequestBuilder } from '../builders/wai-request-builder';
import WAIOrchestrationCoreV9 from '../orchestration/wai-orchestration-core-v9';
import { z } from 'zod';

// ================================================================================================
// SCHEMAS & TYPES
// ================================================================================================

/**
 * Query operation types
 */
export const queryOperationSchema = z.enum([
  'SELECT', // Read data
  'INSERT', // Create data
  'UPDATE', // Modify data
  'DELETE', // Remove data
  'COUNT',  // Count records
  'AGGREGATE' // Aggregations (SUM, AVG, etc.)
]);

/**
 * Safety level for query execution
 */
export const safetyLevelSchema = z.enum([
  'read-only',  // Only SELECT/COUNT queries
  'safe-write', // INSERT/UPDATE with validation
  'admin'       // All operations (requires admin role)
]);

/**
 * NL Database query request
 */
export const nlDatabaseQuerySchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  safetyLevel: safetyLevelSchema.default('read-only'),
  maxRows: z.number().int().positive().max(1000).default(100),
  dryRun: z.boolean().default(false), // Preview SQL without executing
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type NLDatabaseQuery = z.infer<typeof nlDatabaseQuerySchema>;
export type QueryOperation = z.infer<typeof queryOperationSchema>;
export type SafetyLevel = z.infer<typeof safetyLevelSchema>;

/**
 * Query execution result
 */
export interface QueryResult {
  success: boolean;
  operation: QueryOperation;
  sql: string;
  rows?: any[];
  rowCount?: number;
  error?: string;
  warning?: string;
  executionTime: number;
  safetyChecks: {
    passed: boolean;
    warnings: string[];
    blocked?: string;
  };
}

// ================================================================================================
// DANGEROUS OPERATIONS DETECTION
// ================================================================================================

/**
 * Patterns that indicate dangerous SQL operations
 */
const DANGEROUS_PATTERNS = [
  /DROP\s+(TABLE|DATABASE|SCHEMA|INDEX)/i,
  /TRUNCATE\s+TABLE/i,
  /ALTER\s+TABLE.*DROP/i,
  /DELETE\s+FROM.*WHERE.*1\s*=\s*1/i, // Delete all
  /UPDATE.*WHERE.*1\s*=\s*1/i, // Update all
  /;.*DELETE/i, // SQL injection attempt
  /;.*DROP/i, // SQL injection attempt
  /GRANT|REVOKE/i, // Permission changes
  /CREATE\s+USER/i, // User creation
  /pg_sleep/i, // DOS attempt
];

/**
 * System tables that should never be modified
 */
const PROTECTED_TABLES = [
  'pg_catalog',
  'information_schema',
  'pg_',
  'users.password', // Prevent password column access
];

// ================================================================================================
// NL DATABASE TOOL SERVICE
// ================================================================================================

export class NLDatabaseToolService {
  private waiCore: WAIOrchestrationCoreV9;

  constructor() {
    this.waiCore = new WAIOrchestrationCoreV9();
  }

  /**
   * Execute a natural language database query
   */
  async executeNLQuery(request: NLDatabaseQuery): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Validate request
      const validated = nlDatabaseQuerySchema.parse(request);

      // Convert NL to SQL using WAI SDK
      const sqlResult = await this.convertNLToSQL(validated.query);

      if (!sqlResult.success || !sqlResult.sql) {
        return {
          success: false,
          operation: 'SELECT',
          sql: '',
          error: sqlResult.error || 'Failed to convert query to SQL',
          executionTime: Date.now() - startTime,
          safetyChecks: { passed: false, warnings: [] }
        };
      }

      // CRITICAL: Strip comments FIRST (before all validation)
      const originalSQL = sqlResult.sql;
      let cleanedSQL = this.stripSQLComments(originalSQL.trim()).trim();
      
      // CRITICAL: Collapse consecutive whitespace (prevents INS/*c*/ERT → INS ERT bypass)
      cleanedSQL = cleanedSQL.replace(/\s+/g, ' ').trim();

      // Extract operation type from CLEANED SQL (after whitespace normalization)
      const operation = this.detectOperation(cleanedSQL);

      // Perform safety checks on CLEANED SQL
      const safetyChecks = this.performSafetyChecks(
        cleanedSQL,
        operation,
        validated.safetyLevel
      );

      if (!safetyChecks.passed) {
        return {
          success: false,
          operation,
          sql: originalSQL,
          error: safetyChecks.blocked,
          executionTime: Date.now() - startTime,
          safetyChecks
        };
      }

      // Dry run mode - return SQL without executing
      if (validated.dryRun) {
        return {
          success: true,
          operation,
          sql: originalSQL,
          warning: 'Dry run mode - query not executed',
          executionTime: Date.now() - startTime,
          safetyChecks
        };
      }

      // Execute query with enforced safety level (pass cleaned SQL)
      const result = await this.executeSafeSQL(
        cleanedSQL,
        operation,
        validated.maxRows,
        validated.safetyLevel
      );

      return {
        ...result,
        operation,
        sql: originalSQL, // Show original SQL for debugging
        executionTime: Date.now() - startTime,
        safetyChecks
      };

    } catch (error) {
      return {
        success: false,
        operation: 'SELECT',
        sql: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        safetyChecks: { passed: false, warnings: [] }
      };
    }
  }

  /**
   * Convert natural language to SQL using WAI SDK
   */
  private async convertNLToSQL(nlQuery: string): Promise<{
    success: boolean;
    sql?: string;
    error?: string;
  }> {
    try {
      // Build WAI orchestration request
      const waiRequest = new WAIRequestBuilder()
        .setType('analysis')
        .setTask(`Convert this natural language database query to PostgreSQL SQL:
        
Query: "${nlQuery}"

Requirements:
- Generate valid PostgreSQL SQL syntax
- Use proper table/column names from the schema
- Include LIMIT clauses for SELECT queries
- Avoid dangerous operations (DROP, TRUNCATE, etc.)
- Return ONLY the SQL statement, no explanations

Available tables and their columns:
- users (id, email, name, role, subscription_plan, created_at)
- projects (id, user_id, name, description, status, progress, created_at)
- deployments (id, project_id, status, url, created_at)
- agent_executions (id, agent_id, task, status, result, created_at)
- studios (id, name, slug, description, capabilities)
- studio_sessions (id, studio_id, founder_id, status, created_at)

Output ONLY the SQL statement.`)
        .setPriority('high')
        .setPreferences({
          costOptimization: true,
          qualityThreshold: 0.9
        })
        .setContext({
          task_type: 'nl_to_sql',
          database_type: 'postgresql'
        })
        .build();

      // Execute orchestration
      const result = await this.waiCore.orchestrate(waiRequest);

      if (!result.success || !result.result) {
        return {
          success: false,
          error: 'WAI SDK failed to convert query'
        };
      }

      // Extract SQL from result
      const sql = this.extractSQL(result.result);

      return {
        success: true,
        sql
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      };
    }
  }

  /**
   * Extract SQL statement from WAI SDK result
   */
  private extractSQL(result: string): string {
    // Remove markdown code blocks if present
    let sql = result.replace(/```sql\n?/gi, '').replace(/```\n?/g, '');
    
    // Trim whitespace
    sql = sql.trim();
    
    // Remove trailing semicolon if present
    if (sql.endsWith(';')) {
      sql = sql.slice(0, -1);
    }
    
    return sql;
  }

  /**
   * Detect SQL operation type
   * Uses whitespace-collapsed version to prevent comment-obfuscation bypass
   */
  private detectOperation(sql: string): QueryOperation {
    const upperSQL = sql.toUpperCase().trim();
    
    // Additional check: Remove ALL whitespace from first 50 chars to detect obfuscated keywords
    // This catches INS ERT, UP DATE, DEL ETE patterns
    const compactedStart = upperSQL.slice(0, 50).replace(/\s+/g, '');
    
    // Check for write operations first (security-critical)
    if (compactedStart.startsWith('INSERT') || upperSQL.startsWith('INSERT')) return 'INSERT';
    if (compactedStart.startsWith('UPDATE') || upperSQL.startsWith('UPDATE')) return 'UPDATE';
    if (compactedStart.startsWith('DELETE') || upperSQL.startsWith('DELETE')) return 'DELETE';
    if (compactedStart.startsWith('DROP') || upperSQL.startsWith('DROP')) return 'DELETE';
    if (compactedStart.startsWith('ALTER') || upperSQL.startsWith('ALTER')) return 'DELETE';
    if (compactedStart.startsWith('TRUNCATE') || upperSQL.startsWith('TRUNCATE')) return 'DELETE';
    
    // Check for SELECT operations
    if (upperSQL.startsWith('SELECT') || compactedStart.startsWith('SELECT')) {
      if (upperSQL.includes('COUNT(')) return 'COUNT';
      if (upperSQL.match(/SUM\(|AVG\(|MIN\(|MAX\(/)) return 'AGGREGATE';
      return 'SELECT';
    }
    
    // Default to SELECT for safety
    return 'SELECT';
  }

  /**
   * Perform comprehensive safety checks
   */
  private performSafetyChecks(
    sql: string,
    operation: QueryOperation,
    safetyLevel: SafetyLevel
  ): { passed: boolean; warnings: string[]; blocked?: string } {
    const warnings: string[] = [];

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(sql)) {
        return {
          passed: false,
          warnings,
          blocked: `Dangerous operation detected: ${pattern.source}`
        };
      }
    }

    // Check for protected tables
    for (const table of PROTECTED_TABLES) {
      if (sql.toLowerCase().includes(table.toLowerCase())) {
        return {
          passed: false,
          warnings,
          blocked: `Cannot access protected table: ${table}`
        };
      }
    }

    // Check safety level permissions
    if (safetyLevel === 'read-only') {
      if (operation !== 'SELECT' && operation !== 'COUNT' && operation !== 'AGGREGATE') {
        return {
          passed: false,
          warnings,
          blocked: `Operation ${operation} not allowed in read-only mode`
        };
      }
    }

    if (safetyLevel === 'safe-write') {
      if (operation === 'DELETE') {
        warnings.push('DELETE operation requires admin safety level');
        return {
          passed: false,
          warnings,
          blocked: 'DELETE operations require admin safety level'
        };
      }
    }

    // Add informational warnings
    if (operation === 'UPDATE' || operation === 'DELETE') {
      if (!sql.toLowerCase().includes('where')) {
        warnings.push('Operation affects all rows - no WHERE clause detected');
      }
    }

    return {
      passed: true,
      warnings
    };
  }

  /**
   * Strip SQL comments (block and line comments) to prevent keyword obfuscation
   */
  private stripSQLComments(sql: string): string {
    let result = '';
    let i = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    while (i < sql.length) {
      const char = sql[i];
      const nextChar = i < sql.length - 1 ? sql[i + 1] : '';
      const prevChar = i > 0 ? sql[i - 1] : '';

      // Track quote state (ignore escaped quotes)
      if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        result += char;
        i++;
        continue;
      }
      if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        result += char;
        i++;
        continue;
      }

      // Skip comments only outside quotes
      if (!inSingleQuote && !inDoubleQuote) {
        // Block comment /* ... */
        if (char === '/' && nextChar === '*') {
          i += 2;
          while (i < sql.length - 1) {
            if (sql[i] === '*' && sql[i + 1] === '/') {
              i += 2;
              break;
            }
            i++;
          }
          result += ' '; // Replace comment with space
          continue;
        }

        // Line comment -- ...
        if (char === '-' && nextChar === '-') {
          i += 2;
          while (i < sql.length && sql[i] !== '\n') {
            i++;
          }
          result += ' '; // Replace comment with space
          continue;
        }
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Clamp LIMIT clause to maxRows ceiling and block unsafe variants
   */
  private clampLimit(sql: string, maxRows: number): { sql: string; error?: string } {
    const upperSQL = sql.toUpperCase();
    
    // Block LIMIT ALL (PostgreSQL syntax for unlimited)
    if (/\bLIMIT\s+ALL\b/i.test(sql)) {
      return { sql, error: 'SECURITY: LIMIT ALL blocked - use specific row limit' };
    }
    
    // Block FETCH FIRST (alternative pagination syntax)
    if (/\bFETCH\s+(FIRST|NEXT)/i.test(sql)) {
      return { sql, error: 'SECURITY: FETCH FIRST/NEXT blocked - use LIMIT instead' };
    }
    
    // Block OFFSET without LIMIT (can exfiltrate data)
    if (/\bOFFSET\s+\d+/i.test(upperSQL) && !/\bLIMIT\s+\d+/i.test(upperSQL)) {
      return { sql, error: 'SECURITY: OFFSET without LIMIT blocked' };
    }
    
    // Match LIMIT clause
    const limitMatch = sql.match(/\bLIMIT\s+(\d+)(\s+OFFSET\s+\d+)?/i);
    
    if (limitMatch) {
      const currentLimit = parseInt(limitMatch[1], 10);
      if (currentLimit > maxRows) {
        // Replace with clamped value
        const clampedSQL = sql.replace(/\bLIMIT\s+\d+/i, `LIMIT ${maxRows}`);
        return { sql: clampedSQL };
      }
    }
    
    return { sql };
  }

  /**
   * Execute SQL with safety limits and enforced restrictions
   * Note: SQL is already comment-stripped and validated by caller
   */
  private async executeSafeSQL(
    sql: string,
    operation: QueryOperation,
    maxRows: number,
    safetyLevel: SafetyLevel = 'read-only'
  ): Promise<Omit<QueryResult, 'operation' | 'sql' | 'executionTime' | 'safetyChecks'>> {
    try {
      // Clean SQL (already comment-stripped by executeNLQuery)
      let cleanSQL = sql.trim();
      
      // Remove trailing semicolon if present
      if (cleanSQL.endsWith(';')) {
        cleanSQL = cleanSQL.slice(0, -1).trim();
      }

      // CRITICAL: Multi-statement detection (redundant check for safety)
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let semicolonCount = 0;
      
      for (let i = 0; i < cleanSQL.length; i++) {
        const char = cleanSQL[i];
        const prevChar = i > 0 ? cleanSQL[i - 1] : '';
        
        if (char === "'" && prevChar !== '\\') {
          inSingleQuote = !inSingleQuote;
        } else if (char === '"' && prevChar !== '\\') {
          inDoubleQuote = !inDoubleQuote;
        }
        
        if (char === ';' && !inSingleQuote && !inDoubleQuote) {
          semicolonCount++;
        }
      }
      
      if (semicolonCount > 0) {
        return {
          success: false,
          error: 'SECURITY: Multi-statement SQL blocked for safety'
        };
      }

      const upperSQL = cleanSQL.toUpperCase();

      // CRITICAL: Enforce read-only safety level (redundant check for defense-in-depth)
      if (safetyLevel === 'read-only') {
        if (operation !== 'SELECT' && operation !== 'COUNT' && operation !== 'AGGREGATE') {
          return {
            success: false,
            error: `SECURITY: ${operation} operations blocked in read-only mode`
          };
        }

        // Double-check for write keywords (defense-in-depth)
        if (upperSQL.includes('INSERT') || upperSQL.includes('UPDATE') || 
            upperSQL.includes('DELETE') || upperSQL.includes('DROP') ||
            upperSQL.includes('ALTER') || upperSQL.includes('TRUNCATE')) {
          return {
            success: false,
            error: 'SECURITY: Write operations detected in read-only query'
          };
        }
      }

      // CRITICAL: LIMIT enforcement with clamping
      let finalSQL = cleanSQL;
      if (operation === 'SELECT' || operation === 'COUNT' || operation === 'AGGREGATE') {
        const hasLimit = /\bLIMIT\s+\d+/i.test(upperSQL);
        
        if (!hasLimit) {
          // Add LIMIT if not present
          finalSQL = `${cleanSQL} LIMIT ${maxRows}`;
        } else {
          // Clamp existing LIMIT to maxRows and block unsafe variants
          const clampResult = this.clampLimit(cleanSQL, maxRows);
          if (clampResult.error) {
            return {
              success: false,
              error: clampResult.error
            };
          }
          finalSQL = clampResult.sql;
        }
      }

      // Execute query using connection pool (SQL is validated above)
      const result = await pool.query(finalSQL);

      return {
        success: true,
        rows: result.rows,
        rowCount: result.rowCount || 0
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      };
    }
  }

  /**
   * Get database schema information (for UI display)
   */
  async getDatabaseSchema(): Promise<{
    tables: Array<{
      name: string;
      columns: string[];
      rowCount?: number;
    }>;
  }> {
    try {
      const result = await pool.query(`
        SELECT 
          table_name,
          array_agg(column_name ORDER BY ordinal_position) as columns
        FROM information_schema.columns
        WHERE table_schema = 'public'
        GROUP BY table_name
        ORDER BY table_name
      `);

      const tables = result.rows.map(row => ({
        name: row.table_name,
        columns: row.columns
      }));

      // Get row counts for each table
      for (const table of tables) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
          table.rowCount = parseInt(countResult.rows[0].count);
        } catch {
          // Skip if table doesn't exist or access denied
          table.rowCount = 0;
        }
      }

      return { tables };

    } catch (error) {
      throw new Error(`Failed to fetch schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get query suggestions based on common patterns
   */
  async getQuerySuggestions(): Promise<string[]> {
    return [
      'Show me all users created in the last 7 days',
      'Count how many projects are in progress',
      'List the top 10 most active users by project count',
      'Show me failed deployments from this week',
      'Find all premium subscription users',
      'Get average project completion time by studio',
      'Show me all agent executions that failed',
      'List projects with more than 50% progress',
      'Count users by subscription plan',
      'Show me the most recent studio sessions'
    ];
  }
}

// Export singleton instance
export const nlDatabaseService = new NLDatabaseToolService();
