/**
 * WAI SDK Tools - Usage Example
 * Demonstrates how to use the 10 essential tools with MCP server
 */

import { MCPServer } from '@wai/protocols/mcp';
import { createToolRegistry } from '../registry/tool-registry';

/**
 * Example: Initialize MCP server and register all tools
 */
export async function initializeToolsExample() {
  // Create MCP server
  const mcpServer = new MCPServer({
    name: 'WAI Tools Server',
    version: '1.0.0',
    capabilities: {
      tools: true,
      resources: false,
      context: false,
      prompts: false,
      streaming: false,
    },
    maxConcurrentTools: 10,
  });

  // Start server
  mcpServer.start();

  // Register all 10 tools
  const toolRegistry = createToolRegistry(mcpServer, {
    rateLimit: {
      maxCalls: 100,
      windowMs: 60000, // 100 calls per minute
    },
    timeout: 30000,
  });

  console.log('Registered tools:', toolRegistry.getRegisteredTools());

  return { mcpServer, toolRegistry };
}

/**
 * Example: Execute file operations
 */
export async function fileOperationsExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Read file
  const readResult = await toolProtocol.executeTool('file_operations', {
    operation: 'read',
    path: './package.json',
  });

  console.log('Read result:', readResult);

  // Write file
  const writeResult = await toolProtocol.executeTool('file_operations', {
    operation: 'write',
    path: './test-output.txt',
    content: 'Hello from WAI SDK!',
  });

  console.log('Write result:', writeResult);

  // List files
  const listResult = await toolProtocol.executeTool('file_operations', {
    operation: 'list',
    path: './src',
    recursive: true,
  });

  console.log('List result:', listResult);
}

/**
 * Example: Make web requests
 */
export async function webRequestsExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // GET request
  const getResult = await toolProtocol.executeTool('web_requests', {
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: 'GET',
  });

  console.log('GET result:', getResult);

  // POST request
  const postResult = await toolProtocol.executeTool('web_requests', {
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'POST',
    body: {
      title: 'WAI SDK Test',
      body: 'Testing web requests tool',
      userId: 1,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log('POST result:', postResult);
}

/**
 * Example: Execute code safely
 */
export async function codeExecutionExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Simple calculation
  const calcResult = await toolProtocol.executeTool('code_execution', {
    code: 'return 2 + 2',
  });

  console.log('Calculation result:', calcResult);

  // With context
  const contextResult = await toolProtocol.executeTool('code_execution', {
    code: 'const result = input * 2; return result',
    context: { input: 21 },
  });

  console.log('Context result:', contextResult);
}

/**
 * Example: JSON operations
 */
export async function jsonOperationsExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  const data = {
    users: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 },
    ],
  };

  // Query with JSONPath
  const queryResult = await toolProtocol.executeTool('json_operations', {
    operation: 'query',
    data,
    path: '$.users[*].name',
  });

  console.log('Query result:', queryResult);

  // Merge data
  const mergeResult = await toolProtocol.executeTool('json_operations', {
    operation: 'merge',
    data: { a: 1, b: 2 },
    mergeData: { b: 3, c: 4 },
  });

  console.log('Merge result:', mergeResult);
}

/**
 * Example: Text processing
 */
export async function textProcessingExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Search and replace
  const replaceResult = await toolProtocol.executeTool('text_processing', {
    operation: 'replace',
    text: 'Hello World, World is great!',
    pattern: 'World',
    replacement: 'Universe',
  });

  console.log('Replace result:', replaceResult);

  // Case transformation
  const caseResult = await toolProtocol.executeTool('text_processing', {
    operation: 'case',
    text: 'hello world',
    caseType: 'title',
  });

  console.log('Case result:', caseResult);
}

/**
 * Example: Math calculations
 */
export async function mathCalculationsExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Statistics
  const statsResult = await toolProtocol.executeTool('math_calculations', {
    operation: 'stats',
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  });

  console.log('Stats result:', statsResult);

  // Unit conversion
  const convertResult = await toolProtocol.executeTool('math_calculations', {
    operation: 'convert',
    value: 100,
    from: 'km',
    to: 'mi',
  });

  console.log('Convert result:', convertResult);
}

/**
 * Example: Date/time operations
 */
export async function datetimeOperationsExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Get current time
  const nowResult = await toolProtocol.executeTool('datetime_operations', {
    operation: 'now',
  });

  console.log('Now result:', nowResult);

  // Format date
  const formatResult = await toolProtocol.executeTool('datetime_operations', {
    operation: 'format',
    date: '2025-01-15T12:00:00Z',
    formatString: 'MMM dd, yyyy',
  });

  console.log('Format result:', formatResult);

  // Add days
  const addResult = await toolProtocol.executeTool('datetime_operations', {
    operation: 'add',
    date: '2025-01-15T12:00:00Z',
    amount: 7,
    unit: 'days',
  });

  console.log('Add result:', addResult);
}

/**
 * Example: Random generation
 */
export async function randomGenerationExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Generate UUID
  const uuidResult = await toolProtocol.executeTool('random_generation', {
    type: 'uuid',
  });

  console.log('UUID result:', uuidResult);

  // Generate random string
  const stringResult = await toolProtocol.executeTool('random_generation', {
    type: 'string',
    length: 16,
    charset: 'alphanumeric',
  });

  console.log('String result:', stringResult);

  // Generate email
  const emailResult = await toolProtocol.executeTool('random_generation', {
    type: 'email',
  });

  console.log('Email result:', emailResult);
}

/**
 * Example: Data validation
 */
export async function dataValidationExample(mcpServer: MCPServer) {
  const toolProtocol = mcpServer.getToolProtocol();

  // Validate email
  const emailResult = await toolProtocol.executeTool('data_validation', {
    operation: 'email',
    data: 'user@example.com',
  });

  console.log('Email validation result:', emailResult);

  // Validate schema
  const schemaResult = await toolProtocol.executeTool('data_validation', {
    operation: 'validate',
    data: { name: 'John', age: 30 },
    schema: {
      name: 'string',
      age: 'number',
    },
  });

  console.log('Schema validation result:', schemaResult);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  const { mcpServer, toolRegistry } = await initializeToolsExample();

  console.log('\n=== File Operations ===');
  await fileOperationsExample(mcpServer);

  console.log('\n=== Web Requests ===');
  await webRequestsExample(mcpServer);

  console.log('\n=== Code Execution ===');
  await codeExecutionExample(mcpServer);

  console.log('\n=== JSON Operations ===');
  await jsonOperationsExample(mcpServer);

  console.log('\n=== Text Processing ===');
  await textProcessingExample(mcpServer);

  console.log('\n=== Math Calculations ===');
  await mathCalculationsExample(mcpServer);

  console.log('\n=== Date/Time Operations ===');
  await datetimeOperationsExample(mcpServer);

  console.log('\n=== Random Generation ===');
  await randomGenerationExample(mcpServer);

  console.log('\n=== Data Validation ===');
  await dataValidationExample(mcpServer);

  console.log('\n=== Tool Statistics ===');
  console.log(toolRegistry.getStats());
}
