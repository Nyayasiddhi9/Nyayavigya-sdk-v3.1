/**
 * tRPC Router Types for WAI-SDK Integration
 */

// This will be generated based on the actual tRPC router from WAI-SDK
// For now, we'll define the expected structure

export interface AppRouter {
  agents: {
    list: {
      query: () => any;
    };
    get: {
      query: (input: { id: string }) => any;
    };
    search: {
      query: (input: { query: string; filters?: any }) => any;
    };
    execute: {
      mutate: (input: { id: string; task: any }) => any;
    };
    toggle: {
      mutate: (input: { id: string; enabled: boolean }) => any;
    };
    analytics: {
      query: () => any;
    };
  };
  llm: {
    providers: {
      query: () => any;
    };
    provider: {
      query: (input: { id: string }) => any;
    };
    models: {
      query: () => any;
    };
    toggle: {
      mutate: (input: { id: string; enabled: boolean }) => any;
    };
    updateLimits: {
      mutate: (input: { id: string; limits: any }) => any;
    };
    analytics: {
      query: () => any;
    };
  };
  orchestration: {
    execute: {
      mutate: (input: any) => any;
    };
    status: {
      query: (input: { id: string }) => any;
    };
    history: {
      query: () => any;
    };
  };
  system: {
    health: {
      query: () => any;
    };
    status: {
      query: () => any;
    };
    metrics: {
      query: () => any;
    };
    capabilities: {
      query: () => any;
    };
  };
  core: {
    orchestrate: {
      mutate: (input: any) => any;
    };
    health: {
      query: () => any;
    };
    metrics: {
      query: () => any;
    };
    capabilities: {
      query: () => any;
    };
    version: {
      query: () => any;
    };
  };
  enterprise: {
    analytics: {
      query: () => any;
    };
    deploy: {
      mutate: (input: any) => any;
    };
    compliance: {
      query: () => any;
    };
  };
  integrations: {
    available: {
      query: () => any;
    };
    enable: {
      mutate: (input: { name: string; config: any }) => any;
    };
    status: {
      query: () => any;
    };
  };
}