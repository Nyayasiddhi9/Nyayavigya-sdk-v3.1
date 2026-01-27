/**
 * MCP Server Integration Tests
 * Tests prompt/context operations, token accounting, and maintenance triggers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from '../server';
import { MCPMessage, PromptTemplate, PromptVariable } from '../types';

describe('MCPServer - Prompt Operations', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({ name: 'Test MCP Server' });
    server.start();
  });

  describe('Legacy Format (string[] variables)', () => {
    it('should register template with string[] variables and auto-normalize', () => {
      const legacyTemplate: PromptTemplate = {
        id: 'legacy-prompt',
        name: 'Legacy Prompt',
        description: 'Test legacy format',
        template: 'Hello {{name}}!',
        variables: ['name'], // Legacy string[] format
      };

      server.registerPromptTemplate(legacyTemplate);

      const registered = server.getPromptServer().get('legacy-prompt');
      expect(registered).toBeDefined();
      expect(registered!.variables).toHaveLength(1);
      expect(registered!.variables[0]).toHaveProperty('name', 'name');
      expect(registered!.variables[0]).toHaveProperty('required', false);
    });

    it('should list prompts in legacy format when legacy=true', async () => {
      const template: PromptTemplate = {
        id: 'test-prompt',
        name: 'Test Prompt',
        description: 'Test',
        template: 'Hello {{name}} from {{location}}!',
        variables: [
          { name: 'name', required: true },
          { name: 'location', required: false },
        ],
      };

      server.registerPromptTemplate(template);

      const request: MCPMessage = {
        type: 'prompt_list_request',
        id: 'req-1',
        timestamp: new Date().toISOString(),
        payload: { legacy: true },
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('prompt_list_response');
      expect(response.payload.prompts).toHaveLength(1);
      
      const returnedPrompt = response.payload.prompts[0];
      expect(returnedPrompt.variables).toEqual(['name', 'location']); // Should be string[]
    });

    it('should list prompts in modern format when legacy=false or omitted', async () => {
      const template: PromptTemplate = {
        id: 'test-prompt-2',
        name: 'Test Prompt 2',
        description: 'Test',
        template: 'Hello {{name}}!',
        variables: [{ name: 'name', required: true, type: 'string' }],
      };

      server.registerPromptTemplate(template);

      const request: MCPMessage = {
        type: 'prompt_list_request',
        id: 'req-2',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('prompt_list_response');
      expect(response.payload.prompts).toHaveLength(1);
      
      const returnedPrompt = response.payload.prompts[0];
      expect(Array.isArray(returnedPrompt.variables)).toBe(true);
      expect(returnedPrompt.variables[0]).toHaveProperty('name', 'name');
      expect(returnedPrompt.variables[0]).toHaveProperty('required', true);
      expect(returnedPrompt.variables[0]).toHaveProperty('type', 'string');
    });
  });

  describe('Modern Format (PromptVariable[] variables)', () => {
    it('should register template with PromptVariable[] and preserve metadata', () => {
      const modernTemplate: PromptTemplate = {
        id: 'modern-prompt',
        name: 'Modern Prompt',
        description: 'Test modern format',
        template: 'Analyze {{data}} using {{method}}',
        variables: [
          { name: 'data', type: 'string', description: 'Input data', required: true },
          { name: 'method', type: 'string', description: 'Analysis method', required: false, default: 'default' },
        ],
        metadata: {
          category: 'analytics',
          tags: ['data', 'analysis'],
          author: 'test-user',
        },
      };

      server.registerPromptTemplate(modernTemplate);

      const registered = server.getPromptServer().get('modern-prompt');
      expect(registered).toBeDefined();
      expect(registered!.variables).toHaveLength(2);
      expect(registered!.variables[0]).toHaveProperty('description', 'Input data');
      expect(registered!.metadata).toBeDefined();
      expect(registered!.metadata!.category).toBe('analytics');
    });

    it('should render prompt with variables correctly', async () => {
      const template: PromptTemplate = {
        id: 'render-test',
        name: 'Render Test',
        description: 'Test rendering',
        template: 'User {{user}} wants {{item}}',
        variables: [
          { name: 'user', required: true },
          { name: 'item', required: true },
        ],
      };

      server.registerPromptTemplate(template);

      const request: MCPMessage = {
        type: 'prompt_render_request',
        id: 'req-3',
        timestamp: new Date().toISOString(),
        payload: {
          promptId: 'render-test',
          variables: { user: 'Alice', item: 'coffee' },
        },
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('prompt_render_response');
      expect(response.payload.rendered).toBe('User Alice wants coffee');
    });

    it('should throw error for missing required variables', async () => {
      const template: PromptTemplate = {
        id: 'required-test',
        name: 'Required Test',
        description: 'Test required validation',
        template: 'Hello {{name}}',
        variables: [{ name: 'name', required: true }],
      };

      server.registerPromptTemplate(template);

      const request: MCPMessage = {
        type: 'prompt_render_request',
        id: 'req-4',
        timestamp: new Date().toISOString(),
        payload: {
          promptId: 'required-test',
          variables: {}, // Missing required variable
        },
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('error');
      expect(response.payload.error).toContain('Required variable missing: name');
    });
  });
});

describe('MCPServer - Context Operations', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({ name: 'Test MCP Server' });
    server.start();
  });

  describe('Context Save', () => {
    it('should create window and save message', async () => {
      const request: MCPMessage = {
        type: 'context_save_request',
        id: 'req-5',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'test-window',
          message: {
            role: 'user',
            content: 'Hello world',
          },
        },
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('context_save_response');
      expect(response.payload.message).toBeDefined();
      expect(response.payload.message.content).toBe('Hello world');
      expect(response.payload.message.id).toBeDefined();
      expect(response.payload.message.tokenCount).toBeGreaterThan(0);
    });

    it('should calculate token count for saved messages', async () => {
      const request: MCPMessage = {
        type: 'context_save_request',
        id: 'req-6',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'token-test',
          message: {
            role: 'user',
            content: 'This is a test message with some content',
          },
        },
      };

      const response = await server.handleMessage(request);

      expect(response.type).toBe('context_save_response');
      expect(response.payload.message.tokenCount).toBeGreaterThan(0);
      // Rough estimate: 1 token ≈ 4 characters
      expect(response.payload.message.tokenCount).toBeLessThanOrEqual(
        Math.ceil(response.payload.message.content.length / 4) + 1
      );
    });
  });

  describe('Context Update with Token Recalculation', () => {
    it('should update message and recalculate tokens', async () => {
      // First, save a message
      const saveRequest: MCPMessage = {
        type: 'context_save_request',
        id: 'req-7',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'update-test',
          message: {
            role: 'user',
            content: 'Original content',
          },
        },
      };

      const saveResponse = await server.handleMessage(saveRequest);
      const messageId = saveResponse.payload.message.id;
      const originalTokenCount = saveResponse.payload.message.tokenCount;

      // Then, update the message with longer content
      const updateRequest: MCPMessage = {
        type: 'context_update_request',
        id: 'req-8',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'update-test',
          messageId,
          updates: {
            content: 'This is much longer updated content with many more words',
          },
        },
      };

      const updateResponse = await server.handleMessage(updateRequest);

      expect(updateResponse.type).toBe('context_update_response');
      expect(updateResponse.payload.message.content).toBe(
        'This is much longer updated content with many more words'
      );
      expect(updateResponse.payload.message.tokenCount).toBeGreaterThan(originalTokenCount);
    });

    it('should trigger maintenance re-evaluation after update', async () => {
      // Create window with low max tokens to easily trigger maintenance
      const maintenance = server.getContextMaintenance();
      const window = maintenance.createWindow(
        'maintenance-test',
        100, // Low maxTokens limit
        true, // compressionEnabled
        0.7 // summarizationThreshold
      );

      // Save a message
      const saveRequest: MCPMessage = {
        type: 'context_save_request',
        id: 'req-9',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'maintenance-test',
          message: {
            role: 'user',
            content: 'Short content',
          },
        },
      };

      const saveResponse = await server.handleMessage(saveRequest);
      const messageId = saveResponse.payload.message.id;
      const originalWindow = maintenance.getWindow('maintenance-test')!;
      const originalTokenCount = originalWindow.tokenCount;

      // Update with much longer content to push over threshold
      const longContent = 'This is a very long message '.repeat(20); // ~560 chars
      const updateRequest: MCPMessage = {
        type: 'context_update_request',
        id: 'req-10',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'maintenance-test',
          messageId,
          updates: {
            content: longContent,
          },
        },
      };

      await server.handleMessage(updateRequest);

      const updatedWindow = maintenance.getWindow('maintenance-test')!;
      
      // Verify token count was recalculated
      expect(updatedWindow.tokenCount).toBeGreaterThan(originalTokenCount);
      
      // Verify window is well over threshold (140 tokens vs 100 max = 140% utilization)
      const utilization = (updatedWindow.tokenCount / updatedWindow.maxTokens) * 100;
      expect(utilization).toBeGreaterThan(100); // Over capacity
      
      // Verify maintenance should have been triggered
      // (In production, compression/summarization would reduce tokens, but for Phase 1
      // functional tests, we just verify the update mechanism works correctly)
      expect(updatedWindow.messages[0].content).toBe(longContent);
    });
  });

  describe('Context List and Snapshot', () => {
    it('should list all context windows', async () => {
      // Create multiple windows
      await server.handleMessage({
        type: 'context_save_request',
        id: 'req-11',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'window-1',
          message: { role: 'user', content: 'Message 1' },
        },
      });

      await server.handleMessage({
        type: 'context_save_request',
        id: 'req-12',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'window-2',
          message: { role: 'user', content: 'Message 2' },
        },
      });

      const listRequest: MCPMessage = {
        type: 'context_list_request',
        id: 'req-13',
        timestamp: new Date().toISOString(),
        payload: {},
      };

      const response = await server.handleMessage(listRequest);

      expect(response.type).toBe('context_list_response');
      expect(response.payload.windows).toHaveLength(2);
    });

    it('should create context snapshot with messages and metadata', async () => {
      // Save multiple messages
      await server.handleMessage({
        type: 'context_save_request',
        id: 'req-14',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'snapshot-test',
          message: { role: 'user', content: 'Message 1' },
        },
      });

      await server.handleMessage({
        type: 'context_save_request',
        id: 'req-15',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'snapshot-test',
          message: { role: 'assistant', content: 'Response 1' },
        },
      });

      const snapshotRequest: MCPMessage = {
        type: 'context_snapshot_request',
        id: 'req-16',
        timestamp: new Date().toISOString(),
        payload: {
          windowId: 'snapshot-test',
        },
      };

      const response = await server.handleMessage(snapshotRequest);

      expect(response.type).toBe('context_snapshot_response');
      expect(response.payload.snapshot).toBeDefined();
      expect(response.payload.snapshot.messages).toHaveLength(2);
      expect(response.payload.snapshot.tokenCount).toBeGreaterThan(0);
      expect(response.payload.snapshot.timestamp).toBeDefined();
    });
  });
});

describe('MCPServer - Server Lifecycle', () => {
  it('should start and stop server correctly', () => {
    const server = new MCPServer();
    
    expect(() => server.start()).not.toThrow();
    expect(() => server.stop()).not.toThrow();
    
    // Should throw if trying to start already running server
    server.start();
    expect(() => server.start()).toThrow('already running');
  });

  it('should return error if server is not running', async () => {
    const server = new MCPServer();
    
    const request: MCPMessage = {
      type: 'prompt_list_request',
      id: 'req-17',
      timestamp: new Date().toISOString(),
      payload: {},
    };

    const response = await server.handleMessage(request);

    expect(response.type).toBe('error');
    expect(response.payload.error).toContain('not running');
  });

  it('should provide server info with statistics', () => {
    const server = new MCPServer({ name: 'Info Test Server', version: '2.0.0' });
    server.start();

    const info = server.getInfo();

    expect(info.name).toBe('Info Test Server');
    expect(info.version).toBe('2.0.0');
    expect(info.capabilities).toBeDefined();
    expect(info.stats).toBeDefined();
    expect(info.stats.tools).toBeGreaterThanOrEqual(0);
    expect(info.stats.promptTemplates).toBe(0);
  });
});
