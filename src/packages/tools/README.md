# @wai/tools - Essential Tools Package

Production-ready tools for NyayaVighya SDK orchestration platform, providing 10 essential tools with MCP (Model Context Protocol) integration.

## 🚀 Features

- **10 Production-Ready Tools** - File ops, web requests, code execution, JSON, text, math, datetime, random, validation
- **MCP Integration** - Full Model Context Protocol support with rate limiting and concurrency control
- **Type Safety** - Comprehensive TypeScript types with Zod validation
- **Error Handling** - Robust error handling with timeout protection
- **Zero Placeholders** - Every tool is fully implemented and production-ready

## 📦 Installation

```bash
pnpm install @wai/tools @wai/protocols
```

## 🛠️ Available Tools

### 1. File Operations (`file_operations`)
Read, write, list, delete files and directories with safety checks.

**Operations**: `read`, `write`, `list`, `delete`, `exists`, `mkdir`, `stat`

```typescript
await toolProtocol.executeTool('file_operations', {
  operation: 'read',
  path: './data.json'
});
```

### 2. Web Requests (`web_requests`)
HTTP client with retries, timeouts, and authentication.

**Methods**: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`

```typescript
await toolProtocol.executeTool('web_requests', {
  url: 'https://api.example.com/data',
  method: 'POST',
  body: { key: 'value' },
  headers: { 'Authorization': 'Bearer token' }
});
```

### 3. Code Execution (`code_execution`)
Sandboxed JavaScript execution with timeout and memory limits (using vm2).

```typescript
await toolProtocol.executeTool('code_execution', {
  code: 'return input * 2',
  context: { input: 21 },
  timeout: 5000
});
```

### 4. JSON Operations (`json_operations`)
Query, transform, validate, and merge JSON data with JSONPath support.

**Operations**: `query`, `transform`, `validate`, `merge`, `stringify`, `parse`

```typescript
await toolProtocol.executeTool('json_operations', {
  operation: 'query',
  data: { users: [{ name: 'Alice' }] },
  path: '$.users[*].name'
});
```

### 5. Text Processing (`text_processing`)
Search, replace, format, sanitize, and extract text data.

**Operations**: `search`, `replace`, `format`, `sanitize`, `extract`, `split`, `join`, `case`, `trim`

```typescript
await toolProtocol.executeTool('text_processing', {
  operation: 'case',
  text: 'hello world',
  caseType: 'title'
});
```

### 6. Math & Calculations (`math_calculations`)
Mathematical operations, statistics, and unit conversions.

**Operations**: `eval`, `stats`, `convert`, `round`, `random`

```typescript
await toolProtocol.executeTool('math_calculations', {
  operation: 'stats',
  numbers: [1, 2, 3, 4, 5]
});
```

### 7. Date/Time Operations (`datetime_operations`)
Parse, format, calculate, and manipulate dates/times with timezone support (using date-fns).

**Operations**: `now`, `parse`, `format`, `add`, `subtract`, `diff`, `validate`

```typescript
await toolProtocol.executeTool('datetime_operations', {
  operation: 'format',
  date: '2025-01-15T12:00:00Z',
  formatString: 'MMM dd, yyyy'
});
```

### 8. Random Generation (`random_generation`)
Generate UUIDs, random strings, numbers, dates, and mock data.

**Types**: `uuid`, `string`, `number`, `date`, `boolean`, `array`, `color`, `email`, `name`

```typescript
await toolProtocol.executeTool('random_generation', {
  type: 'uuid'
});
```

### 9. Data Validation (`data_validation`)
Schema validation, type checking, and data sanitization (using Zod).

**Operations**: `validate`, `type_check`, `sanitize`, `email`, `url`, `phone`, `credit_card`

```typescript
await toolProtocol.executeTool('data_validation', {
  operation: 'email',
  data: 'user@example.com'
});
```

## 💡 Quick Start

```typescript
import { MCPServer } from '@wai/protocols/mcp';
import { createToolRegistry } from '@wai/tools';

// Create MCP server
const mcpServer = new MCPServer({
  name: 'My Tools Server',
  version: '1.0.0',
  capabilities: { tools: true },
  maxConcurrentTools: 10,
});

mcpServer.start();

// Register all 10 tools
const toolRegistry = createToolRegistry(mcpServer, {
  rateLimit: {
    maxCalls: 100,
    windowMs: 60000, // 100 calls per minute
  },
  timeout: 30000,
});

// Execute tools
const toolProtocol = mcpServer.getToolProtocol();

const result = await toolProtocol.executeTool('web_requests', {
  url: 'https://api.example.com/data',
  method: 'GET',
});

console.log(result);
```

## 🔧 Configuration

### Tool Registry Options

```typescript
interface ToolRegistryConfig {
  enabledTools?: string[]; // Whitelist specific tools
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
  timeout?: number; // Default: 30000ms
}
```

### Per-Tool Configuration

Each tool can be configured individually when registered:

```typescript
toolProtocol.registerTool(toolDefinition, executor, {
  enabled: true,
  rateLimit: { maxCalls: 50, windowMs: 60000 },
  timeout: 10000,
  retries: 2,
});
```

## 📊 Tool Statistics

```typescript
// Get stats for all tools
const allStats = toolProtocol.getStats();

// Get stats for specific tool
const fileStats = toolProtocol.getStats('file_operations');

console.log(allStats);
// {
//   file_operations: {
//     calls: 150,
//     errors: 2,
//     totalTime: 5430,
//     avgTime: 36.2,
//     errorRate: 0.013
//   },
//   ...
// }
```

## 🔒 Security Features

- **Sandboxed Execution**: Code execution tool uses vm2 for isolation
- **Path Sanitization**: File operations prevent directory traversal
- **Input Validation**: All tools validate parameters before execution
- **Rate Limiting**: Prevent abuse with configurable rate limits
- **Timeout Protection**: All operations have configurable timeouts

## 📚 Examples

See `/src/examples/usage-example.ts` for comprehensive examples of all 10 tools.

## 🎯 Roadmap to 80+ Tools

This package provides the foundation for expanding to 80+ tools:

**Phase 2 (20 tools)**: Database, Redis, Email, PDF, Image processing
**Phase 3 (30 tools)**: AI/ML, Voice, Video, Blockchain, Cloud services
**Phase 4 (20 tools)**: Advanced analytics, monitoring, deployment

## 🤝 Integration

These tools integrate seamlessly with:
- NyayaVighya SDK Core orchestration
- MCP (Model Context Protocol) server
- Autonomous agents requiring tool access
- Multi-agent collaboration systems

## 📄 License

MIT
