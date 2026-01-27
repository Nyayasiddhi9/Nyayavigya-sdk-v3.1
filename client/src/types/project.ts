export interface Project {
  id: number;
  userId: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  config?: ProjectConfig;
  metadata?: ProjectMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'planning' | 'development' | 'testing' | 'deployed';

export interface ProjectConfig {
  name: string;
  analysis: ProjectAnalysis;
  phases: ProjectPhase[];
  techStack: TechStack;
  deployment: DeploymentConfig;
  timeline: Timeline;
  budget: Budget;
}

export interface ProjectAnalysis {
  type: 'prd' | 'brd' | 'figma' | 'image' | 'code' | 'other';
  summary: string;
  requirements: string[];
  technologies: string[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedTimeline: string;
  recommendedAgents: string[];
  architecture: {
    frontend: string[];
    backend: string[];
    database: string[];
    deployment: string[];
  };
}

export interface ProjectPhase {
  name: string;
  duration: string;
  agents: string[];
  deliverables: string[];
}

export interface TechStack {
  frontend: {
    framework: string;
    language: string;
    styling: string;
    components: string;
    state: string;
    routing: string;
  };
  backend: {
    runtime: string;
    framework: string;
    language: string;
    database: string;
    cache: string;
    orm: string;
  };
  deployment: {
    platform: string;
    containerization: string;
    cicd: string;
    monitoring: string;
  };
  ai: {
    orchestration: string;
    agents: string;
    memory: string;
    providers: string[];
  };
}

export interface DeploymentConfig {
  environments: string[];
  strategy: string;
  scalability: string;
  monitoring: boolean;
  backup: boolean;
  security: {
    ssl: boolean;
    waf: boolean;
    vpc: boolean;
  };
}

export interface Timeline {
  startDate: string;
  endDate: string;
  totalWeeks: number;
  milestones: Array<{
    name: string;
    week: number;
  }>;
}

export interface Budget {
  total: number;
  breakdown: {
    development: number;
    infrastructure: number;
    ai_services: number;
    miscellaneous: number;
  };
  currency: string;
}

export interface ProjectMetadata {
  filesUploaded: number;
  agentsInitialized: number;
  tasksCompleted: number;
  lastActivity: Date;
}

export interface FileUpload {
  id: number;
  projectId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  processed: boolean;
  analysis?: any;
  createdAt: Date;
}

export interface Deployment {
  id: number;
  projectId: number;
  platform: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  url?: string;
  config?: any;
  logs?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostEntry {
  id: number;
  projectId: number;
  provider: string;
  model: string;
  tokens?: number;
  cost: string;
  operation?: string;
  metadata?: any;
  createdAt: Date;
}

export interface CostSummary {
  total: number;
  byProvider: Record<string, number>;
}
