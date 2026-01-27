import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Project Management Types
export interface ProjectBoard {
  id: string;
  name: string;
  description: string;
  projectId: number;
  columns: ProjectColumn[];
  agents: AssignedAgent[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'paused' | 'archived';
  metadata: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    estimatedHours: number;
    actualHours: number;
  };
}

export interface ProjectColumn {
  id: string;
  name: string;
  position: number;
  color: string;
  taskLimit?: number;
  tasks: ProjectTask[];
  agentTypes: string[]; // Which agent types can work on tasks in this column
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'testing' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: AssignedAgent;
  requiredAgentType: string;
  estimatedHours: number;
  actualHours: number;
  dependencies: string[]; // Task IDs this task depends on
  blockers: string[]; // What's blocking this task
  progress: number; // 0-100
  phase: string; // SDLC phase (requirements, design, development, testing, deployment)
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  metrics: {
    codeLines?: number;
    testsWritten?: number;
    bugsFound?: number;
    reviewComments?: number;
  };
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'file' | 'code' | 'design' | 'documentation';
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  content: string;
  author: string; // Agent ID or user ID
  authorType: 'agent' | 'user';
  createdAt: Date;
  taskId: string;
}

export interface AssignedAgent {
  id: string;
  name: string;
  type: string;
  role: string;
  status: 'idle' | 'active' | 'busy' | 'error' | 'offline';
  currentTaskId?: string;
  workload: number; // 0-100
  performance: {
    efficiency: number;
    quality: number;
    speed: number;
    reliability: number;
    tasksCompleted: number;
    averageTaskTime: number;
    errorRate: number;
  };
  allocation: {
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
    priority: number;
    maxConcurrentTasks: number;
  };
}

export interface ProjectManagementEvent {
  type: 'task_created' | 'task_updated' | 'task_completed' | 'agent_assigned' | 'agent_status_changed' | 'board_updated';
  projectId: number;
  boardId: string;
  data: any;
  timestamp: Date;
}

// Project Management Service
export class ProjectManagementService extends EventEmitter {
  private boards: Map<string, ProjectBoard> = new Map();
  private tasks: Map<string, ProjectTask> = new Map();
  private agents: Map<string, AssignedAgent> = new Map();
  private websocketConnections: Map<number, WebSocket[]> = new Map();
  private taskAssignmentQueue: Map<string, ProjectTask[]> = new Map(); // Agent type -> tasks waiting

  constructor() {
    super();
    this.initializeDefaultColumns();
    this.startTaskAssignmentEngine();
    console.log('📋 Project Management Service initialized');
  }

  // Initialize default SDLC columns
  private initializeDefaultColumns(): ProjectColumn[] {
    return [
      {
        id: 'backlog',
        name: 'Backlog',
        position: 0,
        color: '#6B7280',
        tasks: [],
        agentTypes: ['cto', 'cpo', 'program-manager']
      },
      {
        id: 'requirements',
        name: 'Requirements',
        position: 1,
        color: '#3B82F6',
        tasks: [],
        agentTypes: ['business-analyst', 'technical-writer', 'system-architect']
      },
      {
        id: 'design',
        name: 'Design',
        position: 2,
        color: '#8B5CF6',
        tasks: [],
        agentTypes: ['system-architect', 'ui-ux-designer', 'data-architect']
      },
      {
        id: 'development',
        name: 'Development',
        position: 3,
        color: '#10B981',
        taskLimit: 5,
        tasks: [],
        agentTypes: ['frontend-developer', 'backend-developer', 'fullstack-developer', 'mobile-developer']
      },
      {
        id: 'testing',
        name: 'Testing',
        position: 4,
        color: '#F59E0B',
        tasks: [],
        agentTypes: ['qa-engineer', 'test-automation-engineer', 'security-engineer']
      },
      {
        id: 'review',
        name: 'Code Review',
        position: 5,
        color: '#EF4444',
        tasks: [],
        agentTypes: ['senior-developer', 'security-architect', 'code-reviewer']
      },
      {
        id: 'deployment',
        name: 'Deployment',
        position: 6,
        color: '#06B6D4',
        tasks: [],
        agentTypes: ['devops-engineer', 'deployment-specialist', 'infrastructure-expert']
      },
      {
        id: 'done',
        name: 'Done',
        position: 7,
        color: '#22C55E',
        tasks: [],
        agentTypes: []
      }
    ];
  }

  // Create a new project board
  async createProjectBoard(projectId: number, name: string, description: string): Promise<ProjectBoard> {
    const boardId = `board_${projectId}_${Date.now()}`;
    
    const board: ProjectBoard = {
      id: boardId,
      name,
      description,
      projectId,
      columns: this.initializeDefaultColumns(),
      agents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      metadata: {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        estimatedHours: 0,
        actualHours: 0
      }
    };

    this.boards.set(boardId, board);
    
    this.emit('board_created', {
      type: 'board_created',
      projectId,
      boardId,
      data: board,
      timestamp: new Date()
    });

    this.broadcastToProject(projectId, {
      type: 'board_created',
      data: board
    });

    console.log(`📋 Created project board: ${name} for project ${projectId}`);
    return board;
  }

  // Create a new task
  async createTask(
    boardId: string,
    columnId: string,
    title: string,
    description: string,
    requiredAgentType: string,
    options: Partial<ProjectTask> = {}
  ): Promise<ProjectTask> {
    const board = this.boards.get(boardId);
    if (!board) {
      throw new Error(`Board not found: ${boardId}`);
    }

    const column = board.columns.find(c => c.id === columnId);
    if (!column) {
      throw new Error(`Column not found: ${columnId}`);
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: ProjectTask = {
      id: taskId,
      title,
      description,
      status: 'todo',
      priority: options.priority || 'medium',
      requiredAgentType,
      estimatedHours: options.estimatedHours || 1,
      actualHours: 0,
      dependencies: options.dependencies || [],
      blockers: [],
      progress: 0,
      phase: this.getPhaseFromColumn(columnId),
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: options.dueDate,
      tags: options.tags || [],
      attachments: [],
      comments: [],
      metrics: {}
    };

    // Add task to column and maps
    column.tasks.push(task);
    this.tasks.set(taskId, task);
    
    // Update board metadata
    board.metadata.totalTasks++;
    board.updatedAt = new Date();

    // Queue task for assignment
    await this.queueTaskForAssignment(task);

    this.emit('task_created', {
      type: 'task_created',
      projectId: board.projectId,
      boardId,
      data: task,
      timestamp: new Date()
    });

    this.broadcastToProject(board.projectId, {
      type: 'task_created',
      data: { boardId, columnId, task }
    });

    console.log(`📝 Created task: ${title} in ${columnId}`);
    return task;
  }

  // Assign task to agent
  async assignTaskToAgent(taskId: string, agentId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);
    
    if (!task || !agent) {
      return false;
    }

    // Check if agent can handle this task type
    if (agent.type !== task.requiredAgentType && !this.isAgentCompatible(agent, task)) {
      console.log(`❌ Agent ${agentId} is not compatible with task type ${task.requiredAgentType}`);
      return false;
    }

    // Check agent workload
    if (agent.workload >= 90) {
      console.log(`❌ Agent ${agentId} is at maximum workload`);
      return false;
    }

    // Assign task
    task.assignedAgent = agent;
    task.status = 'in_progress';
    task.updatedAt = new Date();
    
    agent.currentTaskId = taskId;
    agent.status = 'active';
    agent.workload += 25; // Increase workload

    const board = this.findBoardByTask(taskId);
    if (board) {
      board.metadata.inProgressTasks++;
      board.updatedAt = new Date();

      this.emit('agent_assigned', {
        type: 'agent_assigned',
        projectId: board.projectId,
        boardId: board.id,
        data: { task, agent },
        timestamp: new Date()
      });

      this.broadcastToProject(board.projectId, {
        type: 'agent_assigned',
        data: { taskId, agentId, agent, task }
      });
    }

    console.log(`🤖 Assigned task ${taskId} to agent ${agentId}`);
    return true;
  }

  // Update task progress
  async updateTaskProgress(taskId: string, progress: number, updates: Partial<ProjectTask> = {}): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = Math.max(0, Math.min(100, progress));
    task.actualHours = updates.actualHours || task.actualHours;
    task.updatedAt = new Date();

    // Update metrics if provided
    if (updates.metrics) {
      task.metrics = { ...task.metrics, ...updates.metrics };
    }

    // Auto-complete task if progress reaches 100%
    if (progress >= 100 && task.status !== 'done') {
      await this.completeTask(taskId);
    }

    const board = this.findBoardByTask(taskId);
    if (board) {
      this.broadcastToProject(board.projectId, {
        type: 'task_progress_updated',
        data: { taskId, progress, task }
      });
    }
  }

  // Complete a task
  async completeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'done';
    task.progress = 100;
    task.updatedAt = new Date();

    // Release agent
    if (task.assignedAgent) {
      const agent = this.agents.get(task.assignedAgent.id);
      if (agent) {
        agent.currentTaskId = undefined;
        agent.status = 'idle';
        agent.workload = Math.max(0, agent.workload - 25);
        agent.performance.tasksCompleted++;
        
        // Calculate average task time
        const taskDuration = (new Date().getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
        agent.performance.averageTaskTime = 
          (agent.performance.averageTaskTime * (agent.performance.tasksCompleted - 1) + taskDuration) / 
          agent.performance.tasksCompleted;
      }
    }

    // Move task to done column
    const board = this.findBoardByTask(taskId);
    if (board) {
      // Remove from current column
      board.columns.forEach(column => {
        column.tasks = column.tasks.filter(t => t.id !== taskId);
      });

      // Add to done column
      const doneColumn = board.columns.find(c => c.id === 'done');
      if (doneColumn) {
        doneColumn.tasks.push(task);
      }

      // Update metadata
      board.metadata.completedTasks++;
      board.metadata.inProgressTasks = Math.max(0, board.metadata.inProgressTasks - 1);
      board.metadata.actualHours += task.actualHours;
      board.updatedAt = new Date();

      this.emit('task_completed', {
        type: 'task_completed',
        projectId: board.projectId,
        boardId: board.id,
        data: task,
        timestamp: new Date()
      });

      this.broadcastToProject(board.projectId, {
        type: 'task_completed',
        data: { taskId, task }
      });

      // Try to assign next task to the freed agent
      if (task.assignedAgent) {
        await this.assignNextTaskToAgent(task.assignedAgent.id);
      }
    }

    console.log(`✅ Completed task: ${task.title}`);
  }

  // Intelligent task assignment engine
  private async startTaskAssignmentEngine(): Promise<void> {
    setInterval(async () => {
      await this.processTaskAssignmentQueue();
    }, 5000); // Run every 5 seconds
  }

  private async processTaskAssignmentQueue(): Promise<void> {
    for (const [agentType, tasks] of this.taskAssignmentQueue.entries()) {
      if (tasks.length === 0) continue;

      // Find available agents of this type
      const availableAgents = Array.from(this.agents.values())
        .filter(agent => 
          (agent.type === agentType || this.isAgentCompatible(agent, tasks[0])) &&
          agent.status === 'idle' &&
          agent.workload < 80
        )
        .sort((a, b) => a.workload - b.workload); // Prioritize less loaded agents

      if (availableAgents.length === 0) continue;

      // Assign tasks to available agents
      const tasksToAssign = tasks.splice(0, availableAgents.length);
      
      for (let i = 0; i < tasksToAssign.length; i++) {
        await this.assignTaskToAgent(tasksToAssign[i].id, availableAgents[i].id);
      }
    }
  }

  private async queueTaskForAssignment(task: ProjectTask): Promise<void> {
    if (!this.taskAssignmentQueue.has(task.requiredAgentType)) {
      this.taskAssignmentQueue.set(task.requiredAgentType, []);
    }
    
    this.taskAssignmentQueue.get(task.requiredAgentType)!.push(task);
  }

  private async assignNextTaskToAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent || agent.workload >= 80) return;

    // Find next compatible task
    for (const [agentType, tasks] of this.taskAssignmentQueue.entries()) {
      if (tasks.length === 0) continue;

      const compatibleTask = tasks.find(task => 
        agent.type === task.requiredAgentType || this.isAgentCompatible(agent, task)
      );

      if (compatibleTask) {
        // Remove from queue and assign
        const index = tasks.indexOf(compatibleTask);
        tasks.splice(index, 1);
        await this.assignTaskToAgent(compatibleTask.id, agentId);
        break;
      }
    }
  }

  // Helper methods
  private isAgentCompatible(agent: AssignedAgent, task: ProjectTask): boolean {
    // Define agent compatibility rules
    const compatibilityMatrix: Record<string, string[]> = {
      'fullstack-developer': ['frontend-developer', 'backend-developer'],
      'senior-developer': ['frontend-developer', 'backend-developer', 'fullstack-developer'],
      'system-architect': ['data-architect', 'security-architect'],
      'qa-engineer': ['test-automation-engineer'],
      'devops-engineer': ['infrastructure-expert', 'deployment-specialist']
    };

    return compatibilityMatrix[agent.type]?.includes(task.requiredAgentType) || false;
  }

  private getPhaseFromColumn(columnId: string): string {
    const phaseMap: Record<string, string> = {
      'backlog': 'planning',
      'requirements': 'requirements',
      'design': 'design',
      'development': 'development',
      'testing': 'testing',
      'review': 'review',
      'deployment': 'deployment',
      'done': 'completed'
    };
    return phaseMap[columnId] || 'unknown';
  }

  private findBoardByTask(taskId: string): ProjectBoard | undefined {
    for (const board of this.boards.values()) {
      for (const column of board.columns) {
        if (column.tasks.some(task => task.id === taskId)) {
          return board;
        }
      }
    }
    return undefined;
  }

  // WebSocket management
  subscribeToProject(projectId: number, ws: WebSocket): void {
    if (!this.websocketConnections.has(projectId)) {
      this.websocketConnections.set(projectId, []);
    }
    this.websocketConnections.get(projectId)!.push(ws);
    
    ws.on('close', () => {
      const connections = this.websocketConnections.get(projectId) || [];
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
    });
  }

  private broadcastToProject(projectId: number, message: any): void {
    const connections = this.websocketConnections.get(projectId) || [];
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Public API methods
  getProjectBoard(boardId: string): ProjectBoard | undefined {
    return this.boards.get(boardId);
  }

  getProjectBoards(projectId: number): ProjectBoard[] {
    return Array.from(this.boards.values()).filter(board => board.projectId === projectId);
  }

  getTask(taskId: string): ProjectTask | undefined {
    return this.tasks.get(taskId);
  }

  getAgent(agentId: string): AssignedAgent | undefined {
    return this.agents.get(agentId);
  }

  registerAgent(agent: AssignedAgent): void {
    this.agents.set(agent.id, agent);
    console.log(`🤖 Registered agent: ${agent.name} (${agent.type})`);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    console.log(`🚫 Unregistered agent: ${agentId}`);
  }

  getBoardAnalytics(boardId: string): any {
    const board = this.boards.get(boardId);
    if (!board) return null;

    const agentPerformance = Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      efficiency: agent.performance.efficiency,
      tasksCompleted: agent.performance.tasksCompleted,
      averageTaskTime: agent.performance.averageTaskTime,
      workload: agent.workload
    }));

    const tasksByStatus = board.columns.reduce((acc, column) => {
      acc[column.id] = column.tasks.length;
      return acc;
    }, {} as Record<string, number>);

    return {
      board: board.metadata,
      agents: agentPerformance,
      taskDistribution: tasksByStatus,
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.status === 'active').length
    };
  }
}

export const projectManagementService = new ProjectManagementService();