/**
 * WAI SDK v2.0 - Master Entry Point
 * 
 * This is the main entry point for the WAI SDK. It provides unified access
 * to all SDK capabilities through a single, cohesive interface.
 * 
 * Features:
 * - 275+ Autonomous Agents (L1-L4 ROMA levels)
 * - 23 LLM Providers (752+ models)
 * - 530+ MCP Tools
 * - 9 Integrated Packages (Edge, Analytics, Learning, Security, Chat, Multimodal, Voice, i18n, AdvancedSystems)
 * - 7 Protocols (A2A, MCP, ROMA, AG-UI, OpenAgent, Parlant, BMAD)
 * - 34 Languages (22 Indian + 12 Global)
 * 
 * @version 2.0.0
 * @since January 18, 2026
 */

import { SDKWiringService, SDKWiringConfig, SDKHealth, WiredPackages } from './sdk-wiring-service';
import { EventEmitter } from 'events';

export interface WAISDKConfig extends Partial<SDKWiringConfig> {
  autoInitialize?: boolean;
  debug?: boolean;
  telemetry?: boolean;
}

export interface WAISDKStatus {
  version: string;
  initialized: boolean;
  health: SDKHealth | null;
  uptime: number;
  packages: Record<string, string>;
}

export class WAISDK extends EventEmitter {
  private static instance: WAISDK;
  private wiringService: SDKWiringService;
  private config: WAISDKConfig;
  private startTime: Date;
  private initialized: boolean = false;

  private constructor(config: WAISDKConfig = {}) {
    super();
    this.startTime = new Date();
    this.config = {
      autoInitialize: false,
      debug: false,
      telemetry: true,
      enableEdgeComputing: true,
      enableAnalytics: true,
      enableLearning: true,
      enableSecurity: true,
      enableChat: true,
      enableMultimodal: true,
      enableVoice: true,
      enableI18n: true,
      enableAdvancedSystems: true,
      lazyLoad: false,
      healthCheckInterval: 60000,
      logLevel: 'info',
      ...config
    };
    this.wiringService = SDKWiringService.getInstance(this.config);
  }

  public static getInstance(config?: WAISDKConfig): WAISDK {
    if (!WAISDK.instance) {
      WAISDK.instance = new WAISDK(config);
    }
    return WAISDK.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('WAI SDK already initialized');
      return;
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           WAI SDK v2.0 - Enterprise AI Platform              ║');
    console.log('║   275+ Agents | 23 LLM Providers | 530+ Tools | 34 Languages ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const startTime = Date.now();

    try {
      await this.wiringService.initialize();
      
      this.wiringService.on('healthCheck', (health) => {
        this.emit('healthCheck', health);
      });

      this.wiringService.on('error', (error) => {
        this.emit('error', error);
      });

      this.initialized = true;
      const duration = Date.now() - startTime;

      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log(`║  ✅ WAI SDK Ready in ${duration}ms                              ║`);
      console.log('║  All packages wired and operational                          ║');
      console.log('╚══════════════════════════════════════════════════════════════╝');
      console.log('');

      this.emit('ready', { duration });
    } catch (error) {
      console.error('❌ WAI SDK initialization failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public getStatus(): WAISDKStatus {
    const health = this.initialized ? this.wiringService.getHealth() : null;
    const packages: Record<string, string> = {};
    
    if (health) {
      for (const [name, status] of Object.entries(health.packages)) {
        packages[name] = status.status;
      }
    }

    return {
      version: '2.0.0',
      initialized: this.initialized,
      health,
      uptime: Date.now() - this.startTime.getTime(),
      packages
    };
  }

  public getHealth(): SDKHealth | null {
    return this.initialized ? this.wiringService.getHealth() : null;
  }

  public getPackages(): WiredPackages {
    return this.wiringService.getPackages();
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public async getEdge() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('edge');
    }
    return this.getPackages().edge;
  }

  public async getAnalytics() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('analytics');
    }
    return this.getPackages().analytics;
  }

  public async getLearning() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('learning');
    }
    return this.getPackages().learning;
  }

  public async getSecurity() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('security');
    }
    return this.getPackages().security;
  }

  public async getChat() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('chat');
    }
    return this.getPackages().chat;
  }

  public async getMultimodal() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('multimodal');
    }
    return this.getPackages().multimodal;
  }

  public async getVoice() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('voice');
    }
    return this.getPackages().voice;
  }

  public async getI18n() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('i18n');
    }
    return this.getPackages().i18n;
  }

  public async getAdvancedSystems() {
    if (this.config.lazyLoad) {
      await this.wiringService.ensurePackageLoaded('advancedSystems');
    }
    return this.getPackages().advancedSystems;
  }

  public get edge() {
    return this.getPackages().edge;
  }

  public get analytics() {
    return this.getPackages().analytics;
  }

  public get learning() {
    return this.getPackages().learning;
  }

  public get security() {
    return this.getPackages().security;
  }

  public get chat() {
    return this.getPackages().chat;
  }

  public get multimodal() {
    return this.getPackages().multimodal;
  }

  public get voice() {
    return this.getPackages().voice;
  }

  public get i18n() {
    return this.getPackages().i18n;
  }

  public get advancedSystems() {
    return this.getPackages().advancedSystems;
  }

  public async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('🛑 Shutting down WAI SDK...');
    await this.wiringService.shutdown();
    this.initialized = false;
    this.emit('shutdown');
    console.log('✅ WAI SDK shut down successfully');
  }
}

export async function createWAISDK(config?: WAISDKConfig): Promise<WAISDK> {
  const sdk = WAISDK.getInstance(config);
  await sdk.initialize();
  return sdk;
}

export const waiSDK = WAISDK.getInstance();

export { SDKWiringService, SDKWiringConfig, SDKHealth, WiredPackages };

export default WAISDK;
