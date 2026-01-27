import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AssistantBuilderConfig {
  // Basic Info
  name: string;
  description: string;
  
  // Avatar Configuration
  avatarStyle: string;
  modelUrl: string;
  
  // Voice Configuration
  voiceConfig: {
    provider: 'elevenlabs' | 'azure' | 'openai';
    voiceId: string;
    language: string;
    accent: string;
    speed: number;
    pitch: number;
  };
  
  // Knowledge Base
  knowledgeBase: {
    websiteUrl?: string;
    uploadedFiles?: File[];
    systemPrompt?: string;
  };
  
  // Generated assistant ID after creation
  assistantId?: string;
}

interface AssistantBuilderStore {
  config: AssistantBuilderConfig;
  currentStep: 'create' | '3d-avatar' | 'voice' | 'test' | 'deploy';
  isCreating: boolean;
  
  // Actions
  updateConfig: (updates: Partial<AssistantBuilderConfig>) => void;
  setCurrentStep: (step: AssistantBuilderStore['currentStep']) => void;
  setIsCreating: (creating: boolean) => void;
  resetBuilder: () => void;
  validateCurrentStep: () => boolean;
}

const initialConfig: AssistantBuilderConfig = {
  name: '',
  description: '',
  avatarStyle: 'professional',
  modelUrl: '',
  voiceConfig: {
    provider: 'elevenlabs',
    voiceId: 'professional_female_warm',
    language: 'en-US',
    accent: 'American',
    speed: 1.0,
    pitch: 1.0,
  },
  knowledgeBase: {},
};

export const useAssistantBuilderStore = create<AssistantBuilderStore>()(
  persist(
    (set, get) => ({
      config: initialConfig,
      currentStep: 'create',
      isCreating: false,
      
      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setIsCreating: (creating) => set({ isCreating: creating }),
      
      resetBuilder: () =>
        set({
          config: initialConfig,
          currentStep: 'create',
          isCreating: false,
        }),
      
      validateCurrentStep: () => {
        const { config, currentStep } = get();
        
        switch (currentStep) {
          case 'create':
            return !!(config.name.trim() && config.description.trim());
          case '3d-avatar':
            return !!config.modelUrl;
          case 'voice':
            return !!(config.voiceConfig.provider && config.voiceConfig.voiceId);
          case 'test':
            return true; // Always valid for test step
          case 'deploy':
            return !!config.assistantId;
          default:
            return false;
        }
      },
    }),
    {
      name: 'assistant-builder-storage',
      partialize: (state) => ({ config: state.config, currentStep: state.currentStep }),
    }
  )
);