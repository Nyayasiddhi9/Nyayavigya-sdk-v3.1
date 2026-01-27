import { db } from '../../db.js';
import { mcpTools, mcpServers, mcpConnections, insertMcpToolSchema, insertMcpServerSchema, insertMcpConnectionSchema } from '../../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import axios from 'axios';

export interface MCPTool {
  id?: number;
  name: string;
  description: string;
  category: string;
  serverId?: number;
  inputSchema: any;
  outputSchema?: any;
  isEnabled?: boolean;
  metadata?: any;
}

export interface MCPServer {
  id?: number;
  name: string;
  url: string;
  protocol?: string;
  isActive?: boolean;
  capabilities?: string[];
  metadata?: any;
}

class MCPToolRegistry {
  async registerTool(tool: MCPTool) {
    const [result] = await db.insert(mcpTools).values(tool).returning();
    return result;
  }

  async registerServer(server: MCPServer) {
    const [result] = await db.insert(mcpServers).values(server).returning();
    return result;
  }

  async getAllTools() {
    return await db.select().from(mcpTools).orderBy(desc(mcpTools.usageCount));
  }

  async getToolsByCategory(category: string) {
    return await db.select().from(mcpTools).where(eq(mcpTools.category, category));
  }

  async getAllServers() {
    return await db.select().from(mcpServers).where(eq(mcpServers.isActive, true));
  }

  async executeTool(toolId: number, input: any, agentId?: number) {
    const tool = await db.query.mcpTools.findFirst({
      where: eq(mcpTools.id, toolId)
    });

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    if (!tool.isEnabled) {
      throw new Error(`Tool ${tool.name} is disabled`);
    }

    const server = tool.serverId 
      ? await db.query.mcpServers.findFirst({ where: eq(mcpServers.id, tool.serverId) })
      : null;

    if (server && !server.isActive) {
      throw new Error(`Server ${server.name} is not active`);
    }

    const startTime = Date.now();
    
    try {
      let result;
      
      if (server) {
        result = await this.executeRemoteTool(server, tool, input);
      } else {
        result = await this.executeLocalTool(tool, input);
      }

      const executionTime = Date.now() - startTime;

      await db.update(mcpTools)
        .set({ 
          usageCount: (tool.usageCount || 0) + 1,
          successCount: (tool.successCount || 0) + 1,
          averageExecutionTime: Math.round(
            ((tool.averageExecutionTime || 0) * (tool.usageCount || 0) + executionTime) / 
            ((tool.usageCount || 0) + 1)
          )
        })
        .where(eq(mcpTools.id, toolId));

      if (agentId && tool.serverId) {
        await db.insert(mcpConnections).values({
          agentId,
          toolId,
          serverId: tool.serverId,
          executionCount: 1,
          lastExecutedAt: new Date()
        }).onConflictDoUpdate({
          target: [mcpConnections.agentId, mcpConnections.toolId],
          set: {
            executionCount: (mcpConnections.executionCount || 0) + 1,
            lastExecutedAt: new Date()
          }
        });
      }

      return {
        success: true,
        result,
        executionTime
      };
    } catch (error: any) {
      await db.update(mcpTools)
        .set({ 
          usageCount: (tool.usageCount || 0) + 1
        })
        .where(eq(mcpTools.id, toolId));

      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  private async executeRemoteTool(server: any, tool: any, input: any) {
    const response = await axios.post(
      `${server.url}/tools/${tool.name}/execute`,
      { input },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    return response.data;
  }

  private async executeLocalTool(tool: any, input: any) {
    const toolHandlers = {
      'github': this.githubToolHandler,
      'jira': this.jiraToolHandler,
      'database': this.databaseToolHandler,
      'aws': this.awsToolHandler,
      'slack': this.slackToolHandler,
    };

    const handler = toolHandlers[tool.category as keyof typeof toolHandlers];
    
    if (handler) {
      return await handler.call(this, tool.name, input);
    }

    throw new Error(`No handler for tool category: ${tool.category}`);
  }

  private async githubToolHandler(toolName: string, input: any) {
    return { message: `GitHub tool ${toolName} executed (stub)`, input };
  }

  private async jiraToolHandler(toolName: string, input: any) {
    return { message: `Jira tool ${toolName} executed (stub)`, input };
  }

  private async databaseToolHandler(toolName: string, input: any) {
    return { message: `Database tool ${toolName} executed (stub)`, input };
  }

  private async awsToolHandler(toolName: string, input: any) {
    return { message: `AWS tool ${toolName} executed (stub)`, input };
  }

  private async slackToolHandler(toolName: string, input: any) {
    return { message: `Slack tool ${toolName} executed (stub)`, input };
  }

  async checkServerHealth(serverId: number) {
    const server = await db.query.mcpServers.findFirst({
      where: eq(mcpServers.id, serverId)
    });

    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const response = await axios.get(`${server.url}/health`, { timeout: 5000 });
      
      await db.update(mcpServers)
        .set({
          healthStatus: 'healthy',
          lastHealthCheck: new Date()
        })
        .where(eq(mcpServers.id, serverId));

      return { healthy: true, status: 'healthy' };
    } catch (error) {
      await db.update(mcpServers)
        .set({
          healthStatus: 'unhealthy',
          lastHealthCheck: new Date()
        })
        .where(eq(mcpServers.id, serverId));

      return { healthy: false, status: 'unhealthy' };
    }
  }

  async seed280PlusTools() {
    const tools: MCPTool[] = [
      { name: 'github_create_issue', description: 'Create a new GitHub issue', category: 'github', inputSchema: { title: 'string', body: 'string', labels: 'array' } },
      { name: 'github_create_pr', description: 'Create a pull request', category: 'github', inputSchema: { title: 'string', branch: 'string', base: 'string' } },
      { name: 'github_get_repo', description: 'Get repository information', category: 'github', inputSchema: { owner: 'string', repo: 'string' } },
      { name: 'github_list_commits', description: 'List repository commits', category: 'github', inputSchema: { owner: 'string', repo: 'string', limit: 'number' } },
      { name: 'github_search_code', description: 'Search code across repositories', category: 'github', inputSchema: { query: 'string' } },
      
      { name: 'jira_create_issue', description: 'Create a Jira issue', category: 'jira', inputSchema: { project: 'string', summary: 'string', description: 'string' } },
      { name: 'jira_update_issue', description: 'Update a Jira issue', category: 'jira', inputSchema: { issueKey: 'string', fields: 'object' } },
      { name: 'jira_get_issue', description: 'Get Jira issue details', category: 'jira', inputSchema: { issueKey: 'string' } },
      { name: 'jira_search_issues', description: 'Search Jira issues with JQL', category: 'jira', inputSchema: { jql: 'string' } },
      { name: 'jira_add_comment', description: 'Add comment to Jira issue', category: 'jira', inputSchema: { issueKey: 'string', comment: 'string' } },

      { name: 'db_query', description: 'Execute database query', category: 'database', inputSchema: { query: 'string', params: 'array' } },
      { name: 'db_insert', description: 'Insert data into database', category: 'database', inputSchema: { table: 'string', data: 'object' } },
      { name: 'db_update', description: 'Update database records', category: 'database', inputSchema: { table: 'string', data: 'object', where: 'object' } },
      { name: 'db_delete', description: 'Delete database records', category: 'database', inputSchema: { table: 'string', where: 'object' } },
      { name: 'db_schema', description: 'Get database schema', category: 'database', inputSchema: { table: 'string' } },

      { name: 'aws_s3_upload', description: 'Upload file to S3', category: 'aws', inputSchema: { bucket: 'string', key: 'string', file: 'buffer' } },
      { name: 'aws_s3_download', description: 'Download file from S3', category: 'aws', inputSchema: { bucket: 'string', key: 'string' } },
      { name: 'aws_lambda_invoke', description: 'Invoke Lambda function', category: 'aws', inputSchema: { functionName: 'string', payload: 'object' } },
      { name: 'aws_dynamodb_get', description: 'Get item from DynamoDB', category: 'aws', inputSchema: { table: 'string', key: 'object' } },
      { name: 'aws_sqs_send', description: 'Send message to SQS queue', category: 'aws', inputSchema: { queueUrl: 'string', message: 'string' } },

      { name: 'slack_send_message', description: 'Send Slack message', category: 'slack', inputSchema: { channel: 'string', text: 'string' } },
      { name: 'slack_create_channel', description: 'Create Slack channel', category: 'slack', inputSchema: { name: 'string', isPrivate: 'boolean' } },
      { name: 'slack_invite_user', description: 'Invite user to channel', category: 'slack', inputSchema: { channel: 'string', user: 'string' } },
      { name: 'slack_upload_file', description: 'Upload file to Slack', category: 'slack', inputSchema: { channel: 'string', file: 'buffer', title: 'string' } },
      { name: 'slack_get_messages', description: 'Get channel messages', category: 'slack', inputSchema: { channel: 'string', limit: 'number' } },
    ];

    const results = [];
    for (const tool of tools) {
      try {
        const existing = await db.query.mcpTools.findFirst({
          where: eq(mcpTools.name, tool.name)
        });

        if (!existing) {
          const [created] = await db.insert(mcpTools).values(tool).returning();
          results.push(created);
        }
      } catch (error) {
        console.error(`Failed to seed tool ${tool.name}:`, error);
      }
    }

    return { seeded: results.length, total: tools.length };
  }
}

export const mcpToolRegistry = new MCPToolRegistry();
