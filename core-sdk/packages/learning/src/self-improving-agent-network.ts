/**
 * Self-Improving Agent Network (SIAN)
 * Neural evolution engine for agent self-improvement
 */

import { EventEmitter } from 'events';

export interface AgentGenome {
  agentId: string;
  fitness: number;
  generation: number;
  traits: Record<string, number>;
  skills: string[];
  mutations: string[];
  parentGenomes: string[];
  createdAt: Date;
}

export interface EvolutionSession {
  sessionId: string;
  population: AgentGenome[];
  generation: number;
  bestFitness: number;
  averageFitness: number;
  startedAt: Date;
  status: 'running' | 'paused' | 'completed';
}

export interface SIANStats {
  totalGenomes: number;
  activeSessions: number;
  averageFitness: number;
  topPerformers: string[];
}

export class SelfImprovingAgentNetwork extends EventEmitter {
  private static instance: SelfImprovingAgentNetwork;
  private genomes: Map<string, AgentGenome> = new Map();
  private sessions: Map<string, EvolutionSession> = new Map();
  private mutationRate: number = 0.1;
  private populationSize: number = 50;

  private constructor() {
    super();
    console.log('🧬 SelfImprovingAgentNetwork initialized');
  }

  public static getInstance(): SelfImprovingAgentNetwork {
    if (!SelfImprovingAgentNetwork.instance) {
      SelfImprovingAgentNetwork.instance = new SelfImprovingAgentNetwork();
    }
    return SelfImprovingAgentNetwork.instance;
  }

  public async createGenome(agentId: string, initialTraits?: Record<string, number>): Promise<AgentGenome> {
    const genome: AgentGenome = {
      agentId,
      fitness: 0.5,
      generation: 0,
      traits: initialTraits || this.generateRandomTraits(),
      skills: [],
      mutations: [],
      parentGenomes: [],
      createdAt: new Date()
    };

    this.genomes.set(agentId, genome);
    this.emit('genome-created', genome);
    
    return genome;
  }

  private generateRandomTraits(): Record<string, number> {
    return {
      creativity: Math.random(),
      precision: Math.random(),
      speed: Math.random(),
      memory: Math.random(),
      adaptability: Math.random(),
      collaboration: Math.random()
    };
  }

  public async mutateGenome(agentId: string): Promise<AgentGenome | null> {
    const genome = this.genomes.get(agentId);
    if (!genome) return null;

    const mutatedTraits = { ...genome.traits };
    const traitKeys = Object.keys(mutatedTraits);
    
    for (const key of traitKeys) {
      if (Math.random() < this.mutationRate) {
        const mutation = (Math.random() - 0.5) * 0.2;
        mutatedTraits[key] = Math.max(0, Math.min(1, mutatedTraits[key] + mutation));
        genome.mutations.push(`${key}:${mutation.toFixed(3)}`);
      }
    }

    genome.traits = mutatedTraits;
    genome.generation++;
    
    this.emit('genome-mutated', { agentId, mutations: genome.mutations });
    
    return genome;
  }

  public async crossover(parent1Id: string, parent2Id: string, childId: string): Promise<AgentGenome | null> {
    const parent1 = this.genomes.get(parent1Id);
    const parent2 = this.genomes.get(parent2Id);
    
    if (!parent1 || !parent2) return null;

    const childTraits: Record<string, number> = {};
    const allKeys = new Set([...Object.keys(parent1.traits), ...Object.keys(parent2.traits)]);
    
    for (const key of allKeys) {
      const trait1 = parent1.traits[key] || 0.5;
      const trait2 = parent2.traits[key] || 0.5;
      childTraits[key] = Math.random() < 0.5 ? trait1 : trait2;
    }

    const childGenome: AgentGenome = {
      agentId: childId,
      fitness: (parent1.fitness + parent2.fitness) / 2,
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      traits: childTraits,
      skills: [...new Set([...parent1.skills, ...parent2.skills])],
      mutations: [],
      parentGenomes: [parent1Id, parent2Id],
      createdAt: new Date()
    };

    this.genomes.set(childId, childGenome);
    this.emit('genome-crossover', { parent1Id, parent2Id, childId });
    
    return childGenome;
  }

  public async updateFitness(agentId: string, fitness: number): Promise<void> {
    const genome = this.genomes.get(agentId);
    if (!genome) return;

    genome.fitness = Math.max(0, Math.min(1, fitness));
    this.emit('fitness-updated', { agentId, fitness: genome.fitness });
  }

  public async startEvolutionSession(sessionId: string): Promise<EvolutionSession> {
    const population: AgentGenome[] = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const genome = await this.createGenome(`${sessionId}-agent-${i}`);
      population.push(genome);
    }

    const session: EvolutionSession = {
      sessionId,
      population,
      generation: 0,
      bestFitness: 0.5,
      averageFitness: 0.5,
      startedAt: new Date(),
      status: 'running'
    };

    this.sessions.set(sessionId, session);
    this.emit('evolution-session-started', sessionId);
    
    return session;
  }

  public async evolveGeneration(sessionId: string): Promise<EvolutionSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') return null;

    session.population.sort((a, b) => b.fitness - a.fitness);
    
    const survivors = session.population.slice(0, Math.floor(this.populationSize / 2));
    const newGeneration: AgentGenome[] = [...survivors];
    
    while (newGeneration.length < this.populationSize) {
      const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
      const parent2 = survivors[Math.floor(Math.random() * survivors.length)];
      
      const childId = `${sessionId}-gen${session.generation + 1}-${newGeneration.length}`;
      const child = await this.crossover(parent1.agentId, parent2.agentId, childId);
      
      if (child) {
        await this.mutateGenome(child.agentId);
        newGeneration.push(child);
      }
    }

    session.population = newGeneration;
    session.generation++;
    session.bestFitness = Math.max(...newGeneration.map(g => g.fitness));
    session.averageFitness = newGeneration.reduce((sum, g) => sum + g.fitness, 0) / newGeneration.length;
    
    this.emit('generation-evolved', {
      sessionId,
      generation: session.generation,
      bestFitness: session.bestFitness,
      averageFitness: session.averageFitness
    });
    
    return session;
  }

  public getStats(): SIANStats {
    const allGenomes = Array.from(this.genomes.values());
    const sortedByFitness = [...allGenomes].sort((a, b) => b.fitness - a.fitness);
    
    return {
      totalGenomes: this.genomes.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.status === 'running').length,
      averageFitness: allGenomes.length > 0 
        ? allGenomes.reduce((sum, g) => sum + g.fitness, 0) / allGenomes.length 
        : 0,
      topPerformers: sortedByFitness.slice(0, 10).map(g => g.agentId)
    };
  }

  public getGenome(agentId: string): AgentGenome | undefined {
    return this.genomes.get(agentId);
  }

  public getAllGenomes(): AgentGenome[] {
    return Array.from(this.genomes.values());
  }

  public getSession(sessionId: string): EvolutionSession | undefined {
    return this.sessions.get(sessionId);
  }
}

export const sianNetwork = SelfImprovingAgentNetwork.getInstance();
export default SelfImprovingAgentNetwork;
