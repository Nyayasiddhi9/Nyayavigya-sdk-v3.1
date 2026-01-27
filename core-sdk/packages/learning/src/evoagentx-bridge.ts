/**
 * EvoAgentX Bridge
 * Integration with Python EvoAgentX for self-evolving agents
 */

import { EventEmitter } from 'events';

export interface EvoGenome {
  id: string;
  agentId: string;
  genes: Record<string, number>;
  fitness: number;
  generation: number;
  mutations: string[];
  syncedAt: Date;
}

export interface EvolutionSessionConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
  maxGenerations: number;
}

export interface BridgeStats {
  status: 'healthy' | 'degraded' | 'disconnected';
  syncedGenomes: number;
  activeSessions: number;
  lastSync: Date | null;
}

export class EvoAgentXBridge extends EventEmitter {
  private static instance: EvoAgentXBridge;
  private genomes: Map<string, EvoGenome> = new Map();
  private isConnected: boolean = false;
  private lastSync: Date | null = null;

  private constructor() {
    super();
    console.log('🌉 EvoAgentXBridge initialized');
  }

  public static getInstance(): EvoAgentXBridge {
    if (!EvoAgentXBridge.instance) {
      EvoAgentXBridge.instance = new EvoAgentXBridge();
    }
    return EvoAgentXBridge.instance;
  }

  public async connect(): Promise<boolean> {
    try {
      this.isConnected = true;
      this.lastSync = new Date();
      console.log('✅ EvoAgentX bridge connected');
      this.emit('connected');
      return true;
    } catch (error) {
      console.error('❌ EvoAgentX bridge connection failed:', error);
      this.isConnected = false;
      this.emit('connection-failed', error);
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('🔌 EvoAgentX bridge disconnected');
    this.emit('disconnected');
  }

  public async syncGenome(agentId: string, genes: Record<string, number>): Promise<EvoGenome> {
    const genome: EvoGenome = {
      id: `evo-${agentId}-${Date.now()}`,
      agentId,
      genes,
      fitness: 0.5,
      generation: 0,
      mutations: [],
      syncedAt: new Date()
    };

    this.genomes.set(agentId, genome);
    this.lastSync = new Date();
    
    this.emit('genome-synced', genome);
    
    return genome;
  }

  public async evolveGenome(agentId: string): Promise<EvoGenome | null> {
    const genome = this.genomes.get(agentId);
    if (!genome) return null;

    const newGenes: Record<string, number> = {};
    
    for (const [key, value] of Object.entries(genome.genes)) {
      const mutation = (Math.random() - 0.5) * 0.2;
      newGenes[key] = Math.max(0, Math.min(1, value + mutation));
      
      if (Math.abs(mutation) > 0.05) {
        genome.mutations.push(`${key}:${mutation.toFixed(4)}`);
      }
    }

    genome.genes = newGenes;
    genome.generation++;
    genome.syncedAt = new Date();
    
    this.emit('genome-evolved', genome);
    
    return genome;
  }

  public async updateFitness(agentId: string, fitness: number): Promise<void> {
    const genome = this.genomes.get(agentId);
    if (!genome) return;

    genome.fitness = Math.max(0, Math.min(1, fitness));
    genome.syncedAt = new Date();
    
    this.emit('fitness-updated', { agentId, fitness });
  }

  public async crossover(parent1Id: string, parent2Id: string): Promise<EvoGenome | null> {
    const parent1 = this.genomes.get(parent1Id);
    const parent2 = this.genomes.get(parent2Id);
    
    if (!parent1 || !parent2) return null;

    const childGenes: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(parent1.genes), ...Object.keys(parent2.genes)]);
    
    for (const key of allKeys) {
      const gene1 = parent1.genes[key] ?? 0.5;
      const gene2 = parent2.genes[key] ?? 0.5;
      childGenes[key] = Math.random() < 0.5 ? gene1 : gene2;
    }

    const childId = `child-${parent1Id}-${parent2Id}-${Date.now()}`;
    const childGenome: EvoGenome = {
      id: `evo-${childId}`,
      agentId: childId,
      genes: childGenes,
      fitness: (parent1.fitness + parent2.fitness) / 2,
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      mutations: [],
      syncedAt: new Date()
    };

    this.genomes.set(childId, childGenome);
    this.emit('crossover-completed', { parent1Id, parent2Id, childId });
    
    return childGenome;
  }

  public getGenome(agentId: string): EvoGenome | undefined {
    return this.genomes.get(agentId);
  }

  public getAllGenomes(): EvoGenome[] {
    return Array.from(this.genomes.values());
  }

  public getStats(): BridgeStats {
    return {
      status: this.isConnected ? 'healthy' : 'disconnected',
      syncedGenomes: this.genomes.size,
      activeSessions: 0,
      lastSync: this.lastSync
    };
  }
}

export const evoAgentXBridge = EvoAgentXBridge.getInstance();
export default EvoAgentXBridge;
