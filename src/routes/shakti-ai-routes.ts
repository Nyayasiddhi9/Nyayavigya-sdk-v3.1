import { Router, type Request, type Response } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { spawn } from 'child_process';
import { agentRegistry } from '../services/agent-registry-service.js';
import { unifiedToolRegistry } from '../adapters/tool-registry.js';
import { intelligentCodeAssistant } from '../services/intelligent-code-assistant.js';

const router = Router();

const ALLOWED_COMMANDS = new Set([
  'ls', 'cat', 'pwd', 'echo', 'head', 'tail', 'wc', 'grep', 'find',
  'npm', 'npx', 'node', 'tsx', 'tsc',
  'git', 'date', 'whoami', 'printenv',
  'mkdir', 'touch',
  'curl', 'sort', 'uniq', 'tr'
]);

const BLOCKED_PATTERNS = [
  /[;&`]/, 
  /\$\(/, /\$\{/, /`.*`/,
  /\bsudo\b/, /\bsu\b/, /\bchmod\b/, /\bchown\b/, /\bchroot\b/,
  /\bkill\b/, /\bkillall\b/, /\bpkill\b/, /\bshutdown\b/, /\breboot\b/,
  /\bdd\b/, /\bformat\b/,
  />\s*\//, /\bpasswd\b/, /\bshadow\b/,
  /\.\./,
  /\beval\b/, /\bexec\b/,
  /\/dev\//, /\/etc\//, /\/var\//, /\/usr\//, /\/bin\//, /\/sbin\//,
  /-c\s+['"]/, /\bpython\b/, /\bpython3\b/, /\bsh\b/, /\bbash\b/,
  /\brm\b/, /\bmv\b/, /\bcp\b.*\//, /\bsed\b.*-i/, /\bawk\b/,
  /\bwget\b/, /\bcurl\b.*-o/, /\bcurl\b.*--output/,
];

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
  const trimmedCommand = command.trim();
  
  if (!trimmedCommand) {
    return { allowed: false, reason: 'Empty command' };
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmedCommand)) {
      return { allowed: false, reason: 'Command contains blocked patterns' };
    }
  }
  
  const pipeSegments = trimmedCommand.split(/\s*\|\s*/);
  
  for (const segment of pipeSegments) {
    const segmentTrimmed = segment.trim();
    if (!segmentTrimmed) continue;
    
    const baseCommand = segmentTrimmed.split(/\s+/)[0];
    const commandName = baseCommand.includes('/') ? path.basename(baseCommand) : baseCommand;
    
    if (!ALLOWED_COMMANDS.has(commandName)) {
      return { allowed: false, reason: `Command '${commandName}' is not in the allowed list` };
    }
  }
  
  return { allowed: true };
}

const MAX_OUTPUT_SIZE = 100000;

function isPathWithinProject(projectRoot: string, targetPath: string): boolean {
  const resolvedPath = path.resolve(projectRoot, targetPath);
  const relativePath = path.relative(projectRoot, resolvedPath);
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
}

router.post('/terminal/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { command, workingDirectory } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Command is required',
      });
    }
    
    if (command.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Command too long (max 1000 characters)',
      });
    }
    
    const validation = isCommandAllowed(command);
    if (!validation.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Command not allowed',
        reason: validation.reason,
      });
    }
    
    const projectRoot = process.cwd();
    let cwd = projectRoot;
    
    if (workingDirectory) {
      if (!isPathWithinProject(projectRoot, workingDirectory)) {
        return res.status(403).json({
          success: false,
          error: 'Working directory must be within project',
        });
      }
      cwd = path.resolve(projectRoot, workingDirectory);
    }
    
    const output = await new Promise<string>((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        cwd,
        env: { ...process.env, HOME: projectRoot, PATH: process.env.PATH },
        timeout: 30000,
      });
      
      let stdout = '';
      let stderr = '';
      let totalSize = 0;
      let killed = false;
      
      const killIfTooLarge = () => {
        if (!killed && totalSize > MAX_OUTPUT_SIZE) {
          killed = true;
          child.kill();
          reject(new Error('Output too large (max 100KB combined stdout+stderr)'));
        }
      };
      
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        totalSize += chunk.length;
        killIfTooLarge();
      });
      
      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        totalSize += chunk.length;
        killIfTooLarge();
      });
      
      child.on('close', (code) => {
        if (killed) return;
        if (code === 0) {
          resolve(stdout || 'Command completed successfully');
        } else {
          resolve(stderr || stdout || `Command exited with code ${code}`);
        }
      });
      
      child.on('error', (err) => {
        if (!killed) reject(err);
      });
      
      setTimeout(() => {
        if (!killed) {
          killed = true;
          child.kill();
          reject(new Error('Command timed out after 30 seconds'));
        }
      }, 30000);
    });
    
    res.json({
      success: true,
      data: {
        output,
        executionTime: Date.now() - startTime,
        command,
        cwd,
      },
    });
  } catch (error: any) {
    console.error('Terminal execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Command execution failed',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/agents - Get all 267 agents for workflow builder
router.get('/agents', async (req: Request, res: Response) => {
  try {
    // Ensure agent registry is initialized
    await agentRegistry.initialize();
    const allAgents = agentRegistry.getAllAgents();
    
    // Group agents by tier for easy selection
    const agentsByTier: Record<string, any[]> = {
      executive: [],
      development: [],
      creative: [],
      qa: [],
      devops: [],
      domain: [],
    };

    for (const agent of allAgents) {
      const tier = agent.tier || 'domain';
      if (agentsByTier[tier]) {
        agentsByTier[tier].push({
          id: agent.id || agent.name,
          name: agent.name,
          description: agent.description || '',
          tier,
          capabilities: agent.capabilities || [],
          status: agent.status || 'active',
          romaLevel: agent.romaLevel || 'L1',
        });
      }
    }

    res.json({
      success: true,
      totalAgents: allAgents.length,
      byTier: agentsByTier,
      agents: allAgents.map(a => ({
        id: a.id || a.name,
        name: a.name,
        description: a.description || '',
        tier: a.tier || 'domain',
        capabilities: a.capabilities || [],
        status: a.status || 'active',
      })),
    });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/tools - Get all 93+ MCP tools for workflow builder
router.get('/tools', async (req: Request, res: Response) => {
  try {
    const allTools = unifiedToolRegistry.getAllTools();
    
    // Group tools by category
    const toolsByCategory: Record<string, any[]> = {
      core: [],
      voice: [],
      video: [],
      music: [],
      'image-generation': [],
      'image-editing': [],
      memory: [],
    };
    
    for (const tool of allTools) {
      const category = tool.subcategory || tool.category || 'core';
      if (!toolsByCategory[category]) {
        toolsByCategory[category] = [];
      }
      toolsByCategory[category].push({
        id: tool.name,
        name: tool.name,
        description: tool.description || '',
        category: tool.category,
        subcategory: tool.subcategory,
        enabled: tool.enabled,
      });
    }

    res.json({
      success: true,
      totalTools: allTools.length,
      byCategory: toolsByCategory,
      tools: allTools.map(t => ({
        id: t.name,
        name: t.name,
        description: t.description || '',
        category: t.category,
        subcategory: t.subcategory,
        enabled: t.enabled,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching tools:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tools',
      message: error.message,
    });
  }
});

const PROJECT_ROOT = process.cwd();
const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.txt',
  '.css', '.scss', '.html', '.yml', '.yaml', '.env.example'
];

const MAX_FILE_SIZE = 1024 * 1024; // 1MB max file size for IDE

// Security: Ensure path is within project and not accessing sensitive files
function isPathSafe(requestedPath: string): boolean {
  const normalized = path.normalize(requestedPath);
  const resolved = path.resolve(PROJECT_ROOT, normalized);
  
  // Must be within project root
  if (!resolved.startsWith(PROJECT_ROOT)) {
    return false;
  }
  
  // Blocked paths for security
  const blockedPaths = [
    'node_modules',
    '.git',
    '.env',
    'dist',
    'build',
    '.replit',
    'attached_assets'
  ];
  
  const relativePath = path.relative(PROJECT_ROOT, resolved);
  return !blockedPaths.some(blocked => relativePath.startsWith(blocked));
}

// Build file tree structure recursively
async function buildFileTree(dirPath: string, maxDepth = 6, currentDepth = 0): Promise<any[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const tree = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(PROJECT_ROOT, fullPath);
      
      if (!isPathSafe(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, maxDepth, currentDepth + 1);
        tree.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children
        });
      } else {
        const ext = path.extname(entry.name);
        if (ALLOWED_EXTENSIONS.includes(ext)) {
          tree.push({
            name: entry.name,
            path: relativePath,
            type: 'file',
            extension: ext
          });
        }
      }
    }

    return tree.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error building file tree:', error);
    return [];
  }
}

// GET /api/shakti-ai/files - List project files
router.get('/files', async (req: Request, res: Response) => {
  try {
    const basePaths = ['client/src', 'server', 'shared'];
    const fileTree = [];

    for (const basePath of basePaths) {
      const fullPath = path.join(PROJECT_ROOT, basePath);
      try {
        await fs.access(fullPath);
        const children = await buildFileTree(fullPath, 6);
        fileTree.push({
          name: basePath,
          path: basePath,
          type: 'directory',
          children
        });
      } catch {
        // Skip if directory doesn't exist
      }
    }

    res.json({
      success: true,
      data: fileTree
    });
  } catch (error: any) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list project files',
      message: error.message
    });
  }
});

// GET /api/shakti-ai/files/read - Read file content
router.get('/files/read', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    if (!isPathSafe(filePath)) {
      return res.status(403).json({
        success: false,
        error: 'Access to this file is not allowed'
      });
    }

    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    // Check file exists and is a file
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({
        success: false,
        error: 'Path is not a file'
      });
    }

    // Check file size
    if (stats.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: 'File too large to display in IDE (max 1MB)'
      });
    }

    // Read file content
    const content = await fs.readFile(fullPath, 'utf-8');
    
    res.json({
      success: true,
      data: {
        path: filePath,
        content,
        size: stats.size,
        language: getLanguageFromExtension(path.extname(filePath))
      }
    });
  } catch (error: any) {
    console.error('Error reading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read file',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/files/save - Save file content
router.post('/files/save', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string()
    });

    const { path: filePath, content } = schema.parse(req.body);

    if (!isPathSafe(filePath)) {
      return res.status(403).json({
        success: false,
        error: 'Access to this file is not allowed'
      });
    }

    const fullPath = path.join(PROJECT_ROOT, filePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
    
    res.json({
      success: true,
      message: 'File saved successfully',
      data: {
        path: filePath
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    console.error('Error saving file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save file',
      message: error.message
    });
  }
});

// Helper: Get Monaco editor language from file extension
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.md': 'markdown',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.txt': 'plaintext'
  };
  return languageMap[ext] || 'plaintext';
}

// ==================== Workflow Management ====================

const WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.shakti-ai', 'workflows');

// Ensure workflows directory exists
async function ensureWorkflowsDir() {
  await fs.mkdir(WORKFLOWS_DIR, { recursive: true });
}

// GET /api/shakti-ai/workflows - List all saved workflows
router.get('/workflows', async (req: Request, res: Response) => {
  try {
    await ensureWorkflowsDir();
    
    const files = await fs.readdir(WORKFLOWS_DIR);
    const workflows = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(WORKFLOWS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const workflow = JSON.parse(content);
        workflows.push({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          nodeCount: workflow.nodes?.length || 0,
          edgeCount: workflow.edges?.length || 0,
          metadata: workflow.metadata,
        });
      }
    }

    res.json({
      success: true,
      data: workflows
    });
  } catch (error: any) {
    console.error('Error listing workflows:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list workflows',
      message: error.message
    });
  }
});

// =============================================================================
// Workflow Execution History (MUST be before /workflows/:id route!)
// =============================================================================

interface ExecutionHistoryEntry {
  id: string;
  workflowId?: string;
  workflowName: string;
  status: 'success' | 'failed' | 'aborted';
  startTime: string;
  endTime: string;
  durationMs: number;
  nodesExecuted: number;
  totalNodes: number;
  results: Record<string, any>;
  logs: string[];
}

const executionHistory: ExecutionHistoryEntry[] = [];
const MAX_HISTORY_ENTRIES = 100;

// GET /api/shakti-ai/workflows/history - Get execution history
router.get('/workflows/history', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const history = executionHistory.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        history,
        total: executionHistory.length,
        limit,
        offset,
      }
    });
  } catch (error: any) {
    console.error('Error getting execution history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution history',
      message: error.message
    });
  }
});

// GET /api/shakti-ai/workflows/history/:id - Get specific execution details
router.get('/workflows/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = executionHistory.find(e => e.id === id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error: any) {
    console.error('Error getting execution details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution details',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/workflows/history - Record a new execution
router.post('/workflows/history', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      workflowId: z.string().optional(),
      workflowName: z.string(),
      status: z.enum(['success', 'failed', 'aborted']),
      startTime: z.string(),
      endTime: z.string(),
      durationMs: z.number(),
      nodesExecuted: z.number(),
      totalNodes: z.number(),
      results: z.record(z.any()).optional(),
      logs: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);

    const entry: ExecutionHistoryEntry = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: data.workflowId,
      workflowName: data.workflowName,
      status: data.status,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMs: data.durationMs,
      nodesExecuted: data.nodesExecuted,
      totalNodes: data.totalNodes,
      results: data.results || {},
      logs: data.logs || [],
    };

    executionHistory.unshift(entry);

    if (executionHistory.length > MAX_HISTORY_ENTRIES) {
      executionHistory.pop();
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: error.errors
      });
    }

    console.error('Error recording execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record execution',
      message: error.message
    });
  }
});

// DELETE /api/shakti-ai/workflows/history - Clear execution history
router.delete('/workflows/history', async (req: Request, res: Response) => {
  try {
    const count = executionHistory.length;
    executionHistory.length = 0;

    res.json({
      success: true,
      message: `Cleared ${count} execution history entries`
    });
  } catch (error: any) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear history',
      message: error.message
    });
  }
});

// =============================================================================
// Workflow CRUD (Parametric routes - must come after /history routes)
// =============================================================================

// GET /api/shakti-ai/workflows/:id - Get a specific workflow
router.get('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const workflow = JSON.parse(content);
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    console.error('Error reading workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read workflow',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/workflows - Save a new workflow
router.post('/workflows', async (req: Request, res: Response) => {
  try {
    const workflowSchema = z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      metadata: z.object({
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
        version: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).optional(),
    });

    const workflow = workflowSchema.parse(req.body);
    
    // Generate ID if not provided
    if (!workflow.id) {
      workflow.id = `wf-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }

    // Add metadata
    const now = new Date().toISOString();
    workflow.metadata = {
      ...workflow.metadata,
      createdAt: workflow.metadata?.createdAt || now,
      updatedAt: now,
      version: workflow.metadata?.version || '1.0.0',
    };

    await ensureWorkflowsDir();
    const filePath = path.join(WORKFLOWS_DIR, `${workflow.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2), 'utf-8');
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workflow data',
        details: error.errors
      });
    }

    console.error('Error saving workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save workflow',
      message: error.message
    });
  }
});

// PUT /api/shakti-ai/workflows/:id - Update a workflow
router.put('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workflowSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      metadata: z.object({
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
        version: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }).optional(),
    });

    const updates = workflowSchema.parse(req.body);
    
    // Read existing workflow
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const existing = JSON.parse(content);

    // Update workflow
    const workflow = {
      ...existing,
      ...updates,
      id, // Preserve ID
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2), 'utf-8');
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workflow data',
        details: error.errors
      });
    }

    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow',
      message: error.message
    });
  }
});

// DELETE /api/shakti-ai/workflows/:id - Delete a workflow
router.delete('/workflows/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workflow',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/workflows/:id/execute - Execute a workflow with real-time progress
router.post('/workflows/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filePath = path.join(WORKFLOWS_DIR, `${id}.json`);
    
    // Read workflow
    const content = await fs.readFile(filePath, 'utf-8');
    const workflow = JSON.parse(content);
    
    // Set up SSE for real-time updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const sendEvent = (type: string, data: any) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Sort nodes by execution order (topological sort)
    const nodeMap = new Map(workflow.nodes.map((n: any) => [n.id, n]));
    const edgeMap = new Map<string, string[]>();
    
    for (const edge of workflow.edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }
    
    // Find start nodes (no incoming edges)
    const incomingCount = new Map<string, number>();
    for (const node of workflow.nodes) {
      incomingCount.set(node.id, 0);
    }
    for (const edge of workflow.edges) {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }
    
    const queue: string[] = [];
    for (const [nodeId, count] of incomingCount) {
      if (count === 0) queue.push(nodeId);
    }
    
    const executionOrder: string[] = [];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      executionOrder.push(nodeId);
      
      const targets = edgeMap.get(nodeId) || [];
      for (const target of targets) {
        const count = (incomingCount.get(target) || 1) - 1;
        incomingCount.set(target, count);
        if (count === 0 && !visited.has(target)) {
          queue.push(target);
        }
      }
    }
    
    // Execute nodes in order with simulated delays
    sendEvent('start', {
      workflowId: id,
      workflowName: workflow.name,
      totalNodes: executionOrder.length,
    });
    
    const results: Record<string, any> = {};
    
    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = nodeMap.get(nodeId);
      
      if (!node) continue;
      
      // Notify node started
      sendEvent('node:start', {
        nodeId,
        nodeName: node.data?.label || nodeId,
        nodeType: node.type,
        progress: Math.round(((i) / executionOrder.length) * 100),
      });
      
      // Simulate execution based on node type
      const executionTime = node.type === 'agent' ? 800 : node.type === 'tool' ? 500 : 300;
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      // Generate mock result based on node type
      let result: any;
      if (node.type === 'agent') {
        result = {
          status: 'completed',
          output: `Agent "${node.data?.label}" executed successfully`,
          metrics: {
            tokensUsed: Math.floor(Math.random() * 500) + 100,
            latencyMs: executionTime,
          },
        };
      } else if (node.type === 'tool') {
        result = {
          status: 'completed',
          output: `Tool "${node.data?.label}" completed`,
          data: { processed: true },
        };
      } else {
        result = {
          status: 'completed',
          output: `Node "${node.data?.label}" processed`,
        };
      }
      
      results[nodeId] = result;
      
      // Notify node completed
      sendEvent('node:complete', {
        nodeId,
        nodeName: node.data?.label || nodeId,
        nodeType: node.type,
        result,
        progress: Math.round(((i + 1) / executionOrder.length) * 100),
      });
    }
    
    // Workflow complete
    sendEvent('complete', {
      workflowId: id,
      workflowName: workflow.name,
      totalNodes: executionOrder.length,
      results,
      executionTimeMs: executionOrder.length * 500,
    });
    
    res.end();
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/workflows/execute-live - Execute workflow directly from nodes/edges
router.post('/workflows/execute-live', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string(),
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
    });
    
    const workflow = schema.parse(req.body);
    
    // Set up SSE for real-time updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    const sendEvent = (type: string, data: any) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    
    // Sort nodes by execution order (topological sort)
    const nodeMap = new Map(workflow.nodes.map((n: any) => [n.id, n]));
    const edgeMap = new Map<string, string[]>();
    
    for (const edge of workflow.edges) {
      if (!edgeMap.has(edge.source)) {
        edgeMap.set(edge.source, []);
      }
      edgeMap.get(edge.source)!.push(edge.target);
    }
    
    // Find start nodes (no incoming edges)
    const incomingCount = new Map<string, number>();
    for (const node of workflow.nodes) {
      incomingCount.set(node.id, 0);
    }
    for (const edge of workflow.edges) {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }
    
    const queue: string[] = [];
    for (const [nodeId, count] of incomingCount) {
      if (count === 0) queue.push(nodeId);
    }
    
    const executionOrder: string[] = [];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      executionOrder.push(nodeId);
      
      const targets = edgeMap.get(nodeId) || [];
      for (const target of targets) {
        const count = (incomingCount.get(target) || 1) - 1;
        incomingCount.set(target, count);
        if (count === 0 && !visited.has(target)) {
          queue.push(target);
        }
      }
    }
    
    // Execute nodes in order
    sendEvent('start', {
      workflowName: workflow.name,
      totalNodes: executionOrder.length,
    });
    
    const results: Record<string, any> = {};
    
    for (let i = 0; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];
      const node = nodeMap.get(nodeId);
      
      if (!node) continue;
      
      sendEvent('node:start', {
        nodeId,
        nodeName: node.data?.label || nodeId,
        nodeType: node.type,
        progress: Math.round(((i) / executionOrder.length) * 100),
      });
      
      const executionTime = node.type === 'agent' ? 800 : node.type === 'tool' ? 500 : 300;
      await new Promise(resolve => setTimeout(resolve, executionTime));
      
      let result: any = {
        status: 'completed',
        output: `${node.type} "${node.data?.label}" executed`,
      };
      
      results[nodeId] = result;
      
      sendEvent('node:complete', {
        nodeId,
        nodeName: node.data?.label || nodeId,
        nodeType: node.type,
        result,
        progress: Math.round(((i + 1) / executionOrder.length) * 100),
      });
    }
    
    sendEvent('complete', {
      workflowName: workflow.name,
      totalNodes: executionOrder.length,
      results,
    });
    
    res.end();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid workflow data',
        details: error.errors
      });
    }

    console.error('Error executing live workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      message: error.message
    });
  }
});

// =============================================================================
// LSP (Language Server Protocol) Endpoints for Code Intelligence
// =============================================================================

// POST /api/shakti-ai/lsp/diagnostics - Get code diagnostics (errors, warnings)
router.post('/lsp/diagnostics', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      language: z.string().optional(),
    });

    const { path: filePath, content, language } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    
    const diagnostics = simulateLspDiagnostics(content, detectedLanguage);

    res.json({
      success: true,
      data: {
        path: filePath,
        language: detectedLanguage,
        diagnostics,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error: any) {
    console.error('Error getting LSP diagnostics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get diagnostics',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/lsp/completions - Get code completions
router.post('/lsp/completions', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      position: z.object({
        line: z.number(),
        character: z.number(),
      }),
      language: z.string().optional(),
    });

    const { path: filePath, content, position, language } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    
    const completions = simulateLspCompletions(content, position, detectedLanguage);

    res.json({
      success: true,
      data: {
        path: filePath,
        position,
        completions,
        language: detectedLanguage,
      }
    });
  } catch (error: any) {
    console.error('Error getting LSP completions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get completions',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/ai/completions - Get AI-powered code completions via WAI SDK
router.post('/ai/completions', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      position: z.object({
        line: z.number(),
        character: z.number(),
      }),
      language: z.string().optional(),
      projectId: z.string().optional(),
    });

    const { path: filePath, content, position, language, projectId } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    const fileName = path.basename(filePath);
    
    let completions: any[] = [];
    let source = 'wai-sdk';

    try {
      const aiCompletions = await intelligentCodeAssistant.getCodeCompletions(
        projectId || 'default',
        fileName,
        content,
        { line: position.line, column: position.character },
        detectedLanguage
      );

      completions = aiCompletions.map(c => ({
        label: c.text,
        kind: c.type === 'completion' ? 'Text' : c.type === 'optimization' ? 'Snippet' : 'Variable',
        detail: c.description,
        insertText: c.text,
        confidence: c.confidence,
        provider: c.provider || 'wai-sdk',
      }));
    } catch (aiError) {
      console.log('AI completion failed, using enhanced fallback');
    }

    if (completions.length === 0) {
      const fallback = simulateLspCompletions(content, position, detectedLanguage);
      completions = fallback;
      source = 'enhanced-fallback';
    }

    res.json({
      success: true,
      data: {
        path: filePath,
        position,
        completions,
        language: detectedLanguage,
        source,
      }
    });
  } catch (error: any) {
    console.error('Error getting AI completions:', error);
    const basicCompletions = simulateLspCompletions(req.body.content || '', req.body.position || { line: 0, character: 0 }, 'typescript');
    res.json({
      success: true,
      data: {
        path: req.body.path,
        position: req.body.position,
        completions: basicCompletions,
        language: 'typescript',
        source: 'fallback',
      }
    });
  }
});

// POST /api/shakti-ai/ai/analyze - Get AI-powered code analysis
router.post('/ai/analyze', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      language: z.string().optional(),
      projectId: z.string().optional(),
    });

    const { path: filePath, content, language, projectId } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    const fileName = path.basename(filePath);
    
    const analysis = await intelligentCodeAssistant.analyzeCode(
      projectId || 'default',
      fileName,
      content,
      detectedLanguage
    );

    res.json({
      success: true,
      data: {
        path: filePath,
        language: detectedLanguage,
        analysis,
        source: 'wai-sdk',
      }
    });
  } catch (error: any) {
    console.error('Error analyzing code with AI:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze code',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/ai/generate - Generate code from natural language
router.post('/ai/generate', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      comment: z.string(),
      context: z.string().optional(),
      language: z.string(),
      projectInfo: z.object({
        name: z.string(),
        description: z.string().optional(),
      }).optional(),
    });

    const { comment, context, language, projectInfo } = schema.parse(req.body);
    
    const result = await intelligentCodeAssistant.generateCodeFromComment(
      comment,
      context || '',
      language,
      projectInfo || { name: 'Project', description: '' }
    );

    res.json({
      success: true,
      data: {
        code: result.code,
        explanation: result.explanation,
        language,
        source: 'wai-sdk',
      }
    });
  } catch (error: any) {
    console.error('Error generating code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate code',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/lsp/hover - Get hover information
router.post('/lsp/hover', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      position: z.object({
        line: z.number(),
        character: z.number(),
      }),
      language: z.string().optional(),
    });

    const { path: filePath, content, position, language } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    
    const hover = simulateLspHover(content, position, detectedLanguage);

    res.json({
      success: true,
      data: {
        path: filePath,
        position,
        hover,
        language: detectedLanguage,
      }
    });
  } catch (error: any) {
    console.error('Error getting LSP hover:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get hover info',
      message: error.message
    });
  }
});

// POST /api/shakti-ai/lsp/symbols - Get document symbols
router.post('/lsp/symbols', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      path: z.string(),
      content: z.string(),
      language: z.string().optional(),
    });

    const { path: filePath, content, language } = schema.parse(req.body);
    
    const detectedLanguage = language || getLanguageFromExtension(path.extname(filePath));
    
    const symbols = extractSymbols(content, detectedLanguage);

    res.json({
      success: true,
      data: {
        path: filePath,
        symbols,
        language: detectedLanguage,
        totalSymbols: symbols.length,
      }
    });
  } catch (error: any) {
    console.error('Error getting LSP symbols:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get symbols',
      message: error.message
    });
  }
});

// LSP Helper Functions
function simulateLspDiagnostics(content: string, language: string): Array<{
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  code?: string;
  source: string;
}> {
  const diagnostics: Array<{
    severity: 'error' | 'warning' | 'info' | 'hint';
    message: string;
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    code?: string;
    source: string;
  }> = [];
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('console.log(') && (language === 'typescript' || language === 'javascript')) {
      diagnostics.push({
        severity: 'warning',
        message: 'console.log is often left in production code. Consider removing or using a logger.',
        range: {
          start: { line: i, character: line.indexOf('console.log') },
          end: { line: i, character: line.indexOf('console.log') + 11 }
        },
        code: 'no-console',
        source: 'wai-lsp'
      });
    }
    
    if (line.includes('any') && language === 'typescript') {
      const anyIndex = line.indexOf('any');
      if (line.charAt(anyIndex - 1) === ':' || line.charAt(anyIndex - 1) === ' ') {
        diagnostics.push({
          severity: 'warning',
          message: 'Avoid using \'any\' type. Consider using a more specific type.',
          range: {
            start: { line: i, character: anyIndex },
            end: { line: i, character: anyIndex + 3 }
          },
          code: 'no-explicit-any',
          source: 'wai-lsp'
        });
      }
    }
    
    if (line.includes('TODO') || line.includes('FIXME')) {
      diagnostics.push({
        severity: 'info',
        message: 'Task marker found: ' + (line.includes('TODO') ? 'TODO' : 'FIXME'),
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length }
        },
        source: 'wai-lsp'
      });
    }
  }
  
  return diagnostics;
}

function simulateLspCompletions(content: string, position: { line: number; character: number }, language: string): Array<{
  label: string;
  kind: string;
  detail: string;
  insertText: string;
}> {
  const lines = content.split('\n');
  const currentLine = lines[position.line] || '';
  const beforeCursor = currentLine.substring(0, position.character);
  
  const lastWord = beforeCursor.split(/[^a-zA-Z0-9_]/).pop() || '';
  
  const completions: Array<{
    label: string;
    kind: string;
    detail: string;
    insertText: string;
  }> = [];
  
  if (language === 'typescript' || language === 'javascript') {
    const jsCompletions = [
      { label: 'console', kind: 'Variable', detail: 'Console API', insertText: 'console' },
      { label: 'const', kind: 'Keyword', detail: 'Declare a constant', insertText: 'const ' },
      { label: 'function', kind: 'Keyword', detail: 'Declare a function', insertText: 'function ' },
      { label: 'async', kind: 'Keyword', detail: 'Async function modifier', insertText: 'async ' },
      { label: 'await', kind: 'Keyword', detail: 'Await a promise', insertText: 'await ' },
      { label: 'import', kind: 'Keyword', detail: 'Import module', insertText: 'import ' },
      { label: 'export', kind: 'Keyword', detail: 'Export module', insertText: 'export ' },
      { label: 'useState', kind: 'Function', detail: 'React state hook', insertText: 'useState()' },
      { label: 'useEffect', kind: 'Function', detail: 'React effect hook', insertText: 'useEffect(() => {\n\t\n}, [])' },
      { label: 'useCallback', kind: 'Function', detail: 'React callback hook', insertText: 'useCallback(() => {\n\t\n}, [])' },
    ];
    
    completions.push(
      ...jsCompletions.filter(c => 
        c.label.toLowerCase().startsWith(lastWord.toLowerCase())
      )
    );
  }
  
  if (language === 'python') {
    const pyCompletions = [
      { label: 'def', kind: 'Keyword', detail: 'Define a function', insertText: 'def ' },
      { label: 'class', kind: 'Keyword', detail: 'Define a class', insertText: 'class ' },
      { label: 'import', kind: 'Keyword', detail: 'Import module', insertText: 'import ' },
      { label: 'from', kind: 'Keyword', detail: 'From import', insertText: 'from ' },
      { label: 'async', kind: 'Keyword', detail: 'Async function', insertText: 'async ' },
      { label: 'print', kind: 'Function', detail: 'Print to console', insertText: 'print()' },
    ];
    
    completions.push(
      ...pyCompletions.filter(c => 
        c.label.toLowerCase().startsWith(lastWord.toLowerCase())
      )
    );
  }
  
  return completions.slice(0, 10);
}

function simulateLspHover(content: string, position: { line: number; character: number }, language: string): {
  contents: string;
  range?: { start: { line: number; character: number }; end: { line: number; character: number } };
} | null {
  const lines = content.split('\n');
  const currentLine = lines[position.line] || '';
  
  const wordMatch = getWordAtPosition(currentLine, position.character);
  if (!wordMatch) return null;
  
  const { word, start, end } = wordMatch;
  
  const typeInfo: Record<string, string> = {
    'useState': '`function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]`\n\nReturns a stateful value, and a function to update it.',
    'useEffect': '`function useEffect(effect: EffectCallback, deps?: DependencyList): void`\n\nAccepts a function that contains imperative, possibly effectful code.',
    'useCallback': '`function useCallback<T extends Function>(callback: T, deps: DependencyList): T`\n\nReturns a memoized callback.',
    'console': '`var console: Console`\n\nThe console object provides access to the browser\'s debugging console.',
    'async': '*keyword*\n\nDeclares an async function, which returns a Promise.',
    'await': '*keyword*\n\nPauses the execution of an async function until a Promise is resolved.',
    'const': '*keyword*\n\nDeclares a block-scoped constant.',
    'function': '*keyword*\n\nDeclares a function.',
  };
  
  const hoverContent = typeInfo[word];
  if (hoverContent) {
    return {
      contents: hoverContent,
      range: {
        start: { line: position.line, character: start },
        end: { line: position.line, character: end }
      }
    };
  }
  
  return null;
}

function getWordAtPosition(line: string, character: number): { word: string; start: number; end: number } | null {
  const before = line.substring(0, character);
  const after = line.substring(character);
  
  const beforeMatch = before.match(/[a-zA-Z0-9_]+$/);
  const afterMatch = after.match(/^[a-zA-Z0-9_]*/);
  
  const wordStart = beforeMatch ? character - beforeMatch[0].length : character;
  const wordEnd = character + (afterMatch ? afterMatch[0].length : 0);
  
  const word = line.substring(wordStart, wordEnd);
  if (!word) return null;
  
  return { word, start: wordStart, end: wordEnd };
}

function extractSymbols(content: string, language: string): Array<{
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'constant';
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  detail?: string;
}> {
  const symbols: Array<{
    name: string;
    kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'constant';
    range: { start: { line: number; character: number }; end: { line: number; character: number } };
    detail?: string;
  }> = [];
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (language === 'typescript' || language === 'javascript') {
      const funcMatch = line.match(/(?:function|const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(?:\([^)]*\)|[a-zA-Z_][a-zA-Z0-9_]*)\s*=>|\()/);
      if (funcMatch) {
        symbols.push({
          name: funcMatch[1],
          kind: 'function',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          },
          detail: line.trim().substring(0, 50)
        });
      }
      
      const classMatch = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 'class',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          }
        });
      }
      
      const interfaceMatch = line.match(/interface\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (interfaceMatch) {
        symbols.push({
          name: interfaceMatch[1],
          kind: 'interface',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          }
        });
      }
      
      const typeMatch = line.match(/type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
      if (typeMatch) {
        symbols.push({
          name: typeMatch[1],
          kind: 'type',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          }
        });
      }
    }
    
    if (language === 'python') {
      const defMatch = line.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (defMatch) {
        symbols.push({
          name: defMatch[1],
          kind: 'function',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          }
        });
      }
      
      const classMatchPy = line.match(/class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (classMatchPy) {
        symbols.push({
          name: classMatchPy[1],
          kind: 'class',
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: line.length }
          }
        });
      }
    }
  }
  
  return symbols;
}

// ==========================================
// Git Integration Endpoints for IDE
// ==========================================

import { localGitService } from '../services/local-git-service.js';

// GET /api/shakti-ai/git/status - Get git repository status
router.get('/git/status', async (req: Request, res: Response) => {
  try {
    const isRepo = await localGitService.isGitRepository();
    if (!isRepo) {
      return res.json({
        success: true,
        data: {
          isRepository: false,
          message: 'Not a git repository',
        },
      });
    }

    const status = await localGitService.getStatus();
    res.json({
      success: true,
      data: {
        isRepository: true,
        ...status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get git status',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/git/branches - Get all branches
router.get('/git/branches', async (req: Request, res: Response) => {
  try {
    const branches = await localGitService.getBranches();
    res.json({
      success: true,
      data: { branches },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get branches',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/git/log - Get commit history
router.get('/git/log', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const commits = await localGitService.getLog(limit);
    res.json({
      success: true,
      data: { commits },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get git log',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/git/diff - Get diff for files
router.get('/git/diff', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string | undefined;
    const staged = req.query.staged === 'true';
    const diffs = await localGitService.getDiff(filePath, staged);
    res.json({
      success: true,
      data: { diffs },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get diff',
      message: error.message,
    });
  }
});

// POST /api/shakti-ai/git/stage - Stage file(s)
router.post('/git/stage', async (req: Request, res: Response) => {
  try {
    const { path: filePath, all } = req.body;
    
    if (all) {
      await localGitService.stageAll();
    } else if (filePath) {
      await localGitService.stageFile(filePath);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing path or all flag',
      });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to stage file',
      message: error.message,
    });
  }
});

// POST /api/shakti-ai/git/unstage - Unstage file
router.post('/git/unstage', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing file path',
      });
    }
    
    await localGitService.unstageFile(filePath);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to unstage file',
      message: error.message,
    });
  }
});

// POST /api/shakti-ai/git/commit - Create commit
router.post('/git/commit', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing commit message',
      });
    }
    
    const commit = await localGitService.commit(message);
    res.json({
      success: true,
      data: { commit },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to commit',
      message: error.message,
    });
  }
});

// POST /api/shakti-ai/git/discard - Discard changes in file
router.post('/git/discard', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing file path',
      });
    }
    
    await localGitService.discardChanges(filePath);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to discard changes',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/git/file-history - Get file commit history
router.get('/git/file-history', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing file path',
      });
    }
    
    const commits = await localGitService.getFileHistory(filePath, limit);
    res.json({
      success: true,
      data: { commits },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get file history',
      message: error.message,
    });
  }
});

// GET /api/shakti-ai/git/blame - Get git blame for file
router.get('/git/blame', async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing file path',
      });
    }
    
    const blame = await localGitService.getBlame(filePath);
    res.json({
      success: true,
      data: { blame },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get blame',
      message: error.message,
    });
  }
});

export default router;
