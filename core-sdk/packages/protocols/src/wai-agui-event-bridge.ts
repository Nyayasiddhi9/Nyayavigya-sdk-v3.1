/**
 * WAI-to-AGUI Event Bridge
 * 
 * Purpose: Bridges WAI orchestration events to AG-UI protocol events
 * Architecture: Listens to WAI orchestration core events and emits corresponding AG-UI events
 * 
 * This service ensures real-time agent activity is streamed to the frontend via AG-UI protocol.
 */

import type { WAIOrchestrationCoreV9 } from '../orchestration/wai-orchestration-core-v9.js';
import type { AGUIWAIIntegrationService } from './agui-wai-integration-service.js';

// ================================================================================================
// WAI-AGUI EVENT BRIDGE
// ================================================================================================

export class WAIAGUIEventBridge {
  private waiCore: WAIOrchestrationCoreV9;
  private aguiService: AGUIWAIIntegrationService;
  private sessionIdMap: Map<string, string>; // Maps WAI execution IDs to AGUI session IDs
  
  constructor(waiCore: WAIOrchestrationCoreV9, aguiService: AGUIWAIIntegrationService) {
    this.waiCore = waiCore;
    this.aguiService = aguiService;
    this.sessionIdMap = new Map();
    
    this.setupEventListeners();
    
    console.log('✅ WAI-AGUI Event Bridge initialized');
  }

  /**
   * Register AG-UI session for WAI execution
   */
  registerSession(waiExecutionId: string, aguiSessionId: string): void {
    this.sessionIdMap.set(waiExecutionId, aguiSessionId);
    console.log(`🔗 WAI execution ${waiExecutionId} → AG-UI session ${aguiSessionId}`);
  }

  /**
   * Unregister AG-UI session
   */
  unregisterSession(waiExecutionId: string): void {
    this.sessionIdMap.delete(waiExecutionId);
  }

  /**
   * Get AG-UI session ID for WAI execution
   */
  private getAGUISessionId(waiExecutionId?: string): string | undefined {
    if (!waiExecutionId) return undefined;
    return this.sessionIdMap.get(waiExecutionId);
  }

  /**
   * Setup event listeners for WAI orchestration events
   */
  private setupEventListeners(): void {
    // WAI Core initialization events
    this.waiCore.on('initialized', () => {
      console.log('🎯 WAI Core initialized - bridge active');
    });

    this.waiCore.on('initialization-failed', (error: Error) => {
      console.error('❌ WAI Core initialization failed:', error.message);
    });

    // Agent execution events (would need to be added to WAI core)
    this.waiCore.on('agent:start', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitStatusChange(
          sessionId,
          'running',
          'idle',
          `Starting agent: ${data.agentId}`
        );
        
        this.aguiService.emitMessage(
          sessionId,
          `🤖 **Agent Started**: ${data.agentId}`,
          'system',
          data.agentId
        );
      }
    });

    this.waiCore.on('agent:thinking', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitThinking(
          sessionId,
          data.step || 'analyzing',
          data.description || 'Agent is thinking...',
          data.agentId,
          data.confidence,
          data.reasoning
        );
      }
    });

    this.waiCore.on('agent:message', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitMessage(
          sessionId,
          data.content,
          data.role || 'agent',
          data.agentId,
          data.metadata
        );
      }
    });

    this.waiCore.on('agent:tool_call', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitToolCall(
          sessionId,
          data.toolName,
          data.input,
          data.agentId,
          data.executionType || 'backend'
        );
      }
    });

    this.waiCore.on('agent:tool_result', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitToolResult(
          sessionId,
          data.toolCallId,
          data.toolName,
          data.result,
          data.success !== false,
          data.duration,
          data.error
        );
      }
    });

    this.waiCore.on('agent:complete', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitStatusChange(
          sessionId,
          'completed',
          'running',
          `Agent completed: ${data.agentId}`
        );
        
        this.aguiService.emitMessage(
          sessionId,
          `✅ **Agent Completed**: ${data.agentId}${data.result ? `\n\nResult: ${data.result}` : ''}`,
          'system',
          data.agentId
        );
      }
    });

    this.waiCore.on('agent:error', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitError(
          sessionId,
          data.error?.message || 'Agent execution error',
          data.agentId,
          data.error?.stack,
          data.recoverable !== false
        );
        
        this.aguiService.emitStatusChange(
          sessionId,
          'error',
          'running',
          `Error in agent: ${data.agentId}`
        );
      }
    });

    // Sub-agent events
    this.waiCore.on('subagent:start', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitSubAgentStart(
          sessionId,
          data.subAgentId,
          data.subAgentName || data.subAgentId,
          data.task,
          data.parentAgentId,
          data.scopedState
        );
      }
    });

    this.waiCore.on('subagent:complete', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitSubAgentComplete(
          sessionId,
          data.subAgentId,
          data.subAgentName || data.subAgentId,
          data.result,
          data.parentAgentId,
          data.resultState
        );
      }
    });

    // Progress events
    this.waiCore.on('progress', (data: any) => {
      const sessionId = this.getAGUISessionId(data.executionId);
      if (sessionId) {
        this.aguiService.emitProgress(
          sessionId,
          data.percentage,
          data.message,
          data.currentStep,
          data.totalSteps,
          data.agentId
        );
      }
    });

    // BMAD, GRPO, Production orchestrator events
    this.waiCore.on('bmad-registered', () => {
      console.log('✅ BMAD-CAM Framework registered');
    });

    this.waiCore.on('grpo-registered', () => {
      console.log('✅ GRPO Reinforcement Trainer registered');
    });

    this.waiCore.on('production-registered', () => {
      console.log('✅ Production Orchestrator registered');
    });
  }

  /**
   * Wrapper method for WAI agent execution with AG-UI streaming
   */
  async executeAgentWithStreaming(
    aguiSessionId: string,
    agentId: string,
    input: any,
    options?: any
  ): Promise<any> {
    const executionId = `wai_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register session mapping
    this.registerSession(executionId, aguiSessionId);
    
    try {
      // Execute agent through WAI core
      const result = await this.waiCore.executeAgent(agentId, {
        ...input,
        executionId, // Pass execution ID so WAI can emit events with it
      }, options);
      
      return result;
    } finally {
      // Cleanup session mapping
      this.unregisterSession(executionId);
    }
  }

  /**
   * Wrapper method for WAI task execution with AG-UI streaming
   */
  async executeTaskWithStreaming(
    aguiSessionId: string,
    task: any
  ): Promise<any> {
    const executionId = `wai_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Register session mapping
    this.registerSession(executionId, aguiSessionId);
    
    try {
      // Execute task through WAI core
      const result = await this.waiCore.executeTask({
        ...task,
        executionId, // Pass execution ID so WAI can emit events with it
      });
      
      return result;
    } finally {
      // Cleanup session mapping
      this.unregisterSession(executionId);
    }
  }
}

export default WAIAGUIEventBridge;
