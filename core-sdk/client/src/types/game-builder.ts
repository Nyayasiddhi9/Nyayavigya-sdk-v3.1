// Game Builder API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface GameTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedBuildTime: number;
  thumbnailUrl: string;
  gameConfig: any;
}

export interface GameProject {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  buildProgress: number;
  templateId: number;
  publishedUrl?: string;
  embedCode?: string;
  playUrl?: string;
  shareUrl?: string;
  gameConfig?: any;
  createdAt: string;
  updatedAt: string;
}

export interface BuildProgress {
  gameId: number;
  progress: number;
  phase: string;
  phaseIndex?: number;
  totalPhases?: number;
}