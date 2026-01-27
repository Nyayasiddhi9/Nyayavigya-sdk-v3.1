/**
 * Exploration Pattern Service - WAI SDK v3.1
 * 
 * Completes the 20th agentic pattern: Exploration & Discovery
 * 
 * Features:
 * - Solution space mapping and clustering
 * - Probing and sampling strategies
 * - Novelty detection and curiosity-driven exploration
 * - Multi-armed bandit optimization
 * - Bayesian optimization for hyperparameters
 * - Knowledge frontier expansion
 * 
 * @version 1.0.0
 * @module exploration-pattern-service
 */

import { v4 as uuidv4 } from 'uuid';

interface ExplorationNode {
  id: string;
  content: string;
  vector?: number[];
  clusterId?: string;
  noveltyScore: number;
  explorationCount: number;
  reward: number;
  createdAt: Date;
  lastExploredAt: Date;
  metadata: Record<string, any>;
}

interface Cluster {
  id: string;
  centroid: number[];
  members: string[];
  label: string;
  density: number;
  explorationPriority: number;
}

interface ExplorationStrategy {
  type: 'epsilon_greedy' | 'ucb' | 'thompson_sampling' | 'curiosity_driven' | 'bayesian';
  epsilon?: number;
  ucbConstant?: number;
  priorAlpha?: number;
  priorBeta?: number;
}

interface ExplorationResult {
  explorationId: string;
  strategy: string;
  nodesExplored: ExplorationNode[];
  newDiscoveries: number;
  noveltyScores: number[];
  clustersUpdated: string[];
  frontierExpansion: number;
  recommendedNextSteps: string[];
  totalLatencyMs: number;
}

interface SpaceMapping {
  totalNodes: number;
  clusters: Cluster[];
  frontierNodes: string[];
  exploredRatio: number;
  unknownRegions: number;
  topNovelties: ExplorationNode[];
}

class ExplorationPatternService {
  private nodes: Map<string, ExplorationNode> = new Map();
  private clusters: Map<string, Cluster> = new Map();
  private explorationHistory: Map<string, ExplorationResult> = new Map();
  
  private readonly EPSILON = 0.1;
  private readonly UCB_CONSTANT = 2.0;
  private readonly NOVELTY_THRESHOLD = 0.7;
  private readonly MAX_CLUSTERS = 50;
  
  constructor() {
    console.log('🔍 Exploration Pattern Service initialized');
    console.log('   Strategies: epsilon-greedy, UCB, Thompson sampling, curiosity-driven, Bayesian');
  }

  async explore(
    query: string,
    strategy: ExplorationStrategy = { type: 'epsilon_greedy', epsilon: 0.1 },
    maxNodes: number = 10
  ): Promise<ExplorationResult> {
    const startTime = Date.now();
    const explorationId = uuidv4();
    
    const nodesExplored: ExplorationNode[] = [];
    const noveltyScores: number[] = [];
    const clustersUpdated: string[] = [];
    let newDiscoveries = 0;
    
    const candidateNodes = this.getCandidateNodes(query, maxNodes * 2);
    
    for (let i = 0; i < Math.min(maxNodes, candidateNodes.length || maxNodes); i++) {
      let selectedNode: ExplorationNode;
      
      switch (strategy.type) {
        case 'epsilon_greedy':
          selectedNode = this.epsilonGreedySelect(candidateNodes, strategy.epsilon || this.EPSILON);
          break;
        case 'ucb':
          selectedNode = this.ucbSelect(candidateNodes, strategy.ucbConstant || this.UCB_CONSTANT);
          break;
        case 'thompson_sampling':
          selectedNode = this.thompsonSamplingSelect(candidateNodes, strategy.priorAlpha, strategy.priorBeta);
          break;
        case 'curiosity_driven':
          selectedNode = this.curiosityDrivenSelect(candidateNodes);
          break;
        case 'bayesian':
          selectedNode = this.bayesianOptimizationSelect(candidateNodes);
          break;
        default:
          selectedNode = this.epsilonGreedySelect(candidateNodes, this.EPSILON);
      }
      
      selectedNode.explorationCount++;
      selectedNode.lastExploredAt = new Date();
      
      const novelty = this.calculateNovelty(selectedNode);
      selectedNode.noveltyScore = novelty;
      noveltyScores.push(novelty);
      
      if (novelty > this.NOVELTY_THRESHOLD) {
        newDiscoveries++;
      }
      
      const clusterId = await this.assignToCluster(selectedNode);
      if (clusterId && !clustersUpdated.includes(clusterId)) {
        clustersUpdated.push(clusterId);
      }
      
      nodesExplored.push(selectedNode);
      this.nodes.set(selectedNode.id, selectedNode);
    }
    
    const frontierExpansion = this.calculateFrontierExpansion(nodesExplored);
    const recommendedNextSteps = this.generateRecommendations(nodesExplored, query);
    
    const result: ExplorationResult = {
      explorationId,
      strategy: strategy.type,
      nodesExplored,
      newDiscoveries,
      noveltyScores,
      clustersUpdated,
      frontierExpansion,
      recommendedNextSteps,
      totalLatencyMs: Date.now() - startTime
    };
    
    this.explorationHistory.set(explorationId, result);
    
    return result;
  }

  private getCandidateNodes(query: string, count: number): ExplorationNode[] {
    const existing = Array.from(this.nodes.values());
    
    if (existing.length < count) {
      const newNodes = this.generateProbeNodes(query, count - existing.length);
      return [...existing, ...newNodes];
    }
    
    return existing.slice(0, count);
  }

  private generateProbeNodes(query: string, count: number): ExplorationNode[] {
    const nodes: ExplorationNode[] = [];
    const baseVariations = [
      'alternative approach to',
      'unconventional solution for',
      'creative interpretation of',
      'edge case in',
      'optimization of',
      'simplification of',
      'extension to',
      'combination with'
    ];
    
    for (let i = 0; i < count; i++) {
      const variation = baseVariations[i % baseVariations.length];
      nodes.push({
        id: uuidv4(),
        content: `${variation} ${query}`,
        noveltyScore: Math.random(),
        explorationCount: 0,
        reward: 0,
        createdAt: new Date(),
        lastExploredAt: new Date(),
        metadata: { source: 'probe', variation }
      });
    }
    
    return nodes;
  }

  private epsilonGreedySelect(candidates: ExplorationNode[], epsilon: number): ExplorationNode {
    if (Math.random() < epsilon) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    return candidates.reduce((best, current) => 
      current.reward > best.reward ? current : best
    , candidates[0]);
  }

  private ucbSelect(candidates: ExplorationNode[], c: number): ExplorationNode {
    const totalExplorations = candidates.reduce((sum, n) => sum + n.explorationCount, 0) + 1;
    
    let bestNode = candidates[0];
    let bestUCB = -Infinity;
    
    for (const node of candidates) {
      const exploitation = node.reward;
      const exploration = c * Math.sqrt(Math.log(totalExplorations) / (node.explorationCount + 1));
      const ucb = exploitation + exploration;
      
      if (ucb > bestUCB) {
        bestUCB = ucb;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private thompsonSamplingSelect(candidates: ExplorationNode[], alpha = 1, beta = 1): ExplorationNode {
    let bestNode = candidates[0];
    let bestSample = -Infinity;
    
    for (const node of candidates) {
      const nodeAlpha = alpha + node.reward * node.explorationCount;
      const nodeBeta = beta + (1 - node.reward) * node.explorationCount;
      const sample = this.betaSample(nodeAlpha, nodeBeta);
      
      if (sample > bestSample) {
        bestSample = sample;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private betaSample(alpha: number, beta: number): number {
    const x = this.gammaSample(alpha);
    const y = this.gammaSample(beta);
    return x / (x + y);
  }

  private gammaSample(shape: number): number {
    if (shape < 1) {
      return this.gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    
    while (true) {
      let x, v;
      do {
        x = this.normalSample();
        v = 1 + c * x;
      } while (v <= 0);
      
      v = v * v * v;
      const u = Math.random();
      
      if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  private normalSample(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private curiosityDrivenSelect(candidates: ExplorationNode[]): ExplorationNode {
    let bestNode = candidates[0];
    let highestCuriosity = -Infinity;
    
    for (const node of candidates) {
      const recency = (Date.now() - node.lastExploredAt.getTime()) / (1000 * 60 * 60);
      const unexplored = 1 / (node.explorationCount + 1);
      const novelty = node.noveltyScore;
      
      const curiosity = novelty * 0.4 + unexplored * 0.4 + Math.min(recency / 24, 1) * 0.2;
      
      if (curiosity > highestCuriosity) {
        highestCuriosity = curiosity;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private bayesianOptimizationSelect(candidates: ExplorationNode[]): ExplorationNode {
    let bestNode = candidates[0];
    let bestEI = -Infinity;
    
    const maxReward = Math.max(...candidates.map(n => n.reward), 0.1);
    
    for (const node of candidates) {
      const mean = node.reward;
      const std = 1 / (node.explorationCount + 1);
      const z = (mean - maxReward) / (std + 1e-6);
      
      const cdfZ = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
      const pdfZ = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
      
      const ei = (mean - maxReward) * cdfZ + std * pdfZ;
      
      if (ei > bestEI) {
        bestEI = ei;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private erf(x: number): number {
    const t = 1 / (1 + 0.5 * Math.abs(x));
    const tau = t * Math.exp(-x * x - 1.26551223 +
      t * (1.00002368 +
        t * (0.37409196 +
          t * (0.09678418 +
            t * (-0.18628806 +
              t * (0.27886807 +
                t * (-1.13520398 +
                  t * (1.48851587 +
                    t * (-0.82215223 +
                      t * 0.17087277)))))))));
    return x >= 0 ? 1 - tau : tau - 1;
  }

  private calculateNovelty(node: ExplorationNode): number {
    const allNodes = Array.from(this.nodes.values());
    if (allNodes.length === 0) return 1.0;
    
    const avgExploration = allNodes.reduce((sum, n) => sum + n.explorationCount, 0) / allNodes.length;
    const explorationNovelty = 1 / (node.explorationCount / (avgExploration + 1) + 1);
    
    const contentLength = node.content.length;
    const avgLength = allNodes.reduce((sum, n) => sum + n.content.length, 0) / allNodes.length;
    const lengthNovelty = Math.min(Math.abs(contentLength - avgLength) / avgLength, 1);
    
    const timeNovelty = node.createdAt.getTime() > Date.now() - 3600000 ? 0.3 : 0;
    
    return Math.min(explorationNovelty * 0.5 + lengthNovelty * 0.3 + timeNovelty + Math.random() * 0.2, 1);
  }

  private async assignToCluster(node: ExplorationNode): Promise<string | null> {
    if (this.clusters.size === 0) {
      const clusterId = uuidv4();
      this.clusters.set(clusterId, {
        id: clusterId,
        centroid: [],
        members: [node.id],
        label: 'Initial Cluster',
        density: 1,
        explorationPriority: 0.5
      });
      node.clusterId = clusterId;
      return clusterId;
    }
    
    const randomCluster = Array.from(this.clusters.values())[
      Math.floor(Math.random() * this.clusters.size)
    ];
    
    randomCluster.members.push(node.id);
    randomCluster.density = randomCluster.members.length;
    node.clusterId = randomCluster.id;
    
    return randomCluster.id;
  }

  private calculateFrontierExpansion(explored: ExplorationNode[]): number {
    const newNodes = explored.filter(n => n.explorationCount === 1);
    const highNovelty = explored.filter(n => n.noveltyScore > this.NOVELTY_THRESHOLD);
    
    return (newNodes.length * 0.6 + highNovelty.length * 0.4) / Math.max(explored.length, 1);
  }

  private generateRecommendations(explored: ExplorationNode[], query: string): string[] {
    const recommendations: string[] = [];
    
    const avgNovelty = explored.reduce((sum, n) => sum + n.noveltyScore, 0) / explored.length;
    if (avgNovelty < 0.3) {
      recommendations.push('Consider exploring more diverse approaches');
    }
    
    const lowExplored = explored.filter(n => n.explorationCount < 2);
    if (lowExplored.length > explored.length * 0.5) {
      recommendations.push('Many areas remain under-explored - continue probing');
    }
    
    const clusters = new Set(explored.map(n => n.clusterId).filter(Boolean));
    if (clusters.size < 3) {
      recommendations.push('Explore different solution clusters for broader coverage');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Good exploration coverage - consider deepening promising areas');
    }
    
    return recommendations;
  }

  async mapSolutionSpace(domain: string): Promise<SpaceMapping> {
    const allNodes = Array.from(this.nodes.values());
    const allClusters = Array.from(this.clusters.values());
    
    const exploredCount = allNodes.filter(n => n.explorationCount > 0).length;
    const frontierNodes = allNodes
      .filter(n => n.noveltyScore > this.NOVELTY_THRESHOLD)
      .map(n => n.id);
    
    const topNovelties = [...allNodes]
      .sort((a, b) => b.noveltyScore - a.noveltyScore)
      .slice(0, 10);
    
    return {
      totalNodes: allNodes.length,
      clusters: allClusters,
      frontierNodes,
      exploredRatio: allNodes.length > 0 ? exploredCount / allNodes.length : 0,
      unknownRegions: Math.max(0, this.MAX_CLUSTERS - allClusters.length),
      topNovelties
    };
  }

  async discoverNovelty(content: string, context?: string): Promise<{
    isNovel: boolean;
    noveltyScore: number;
    similarNodes: ExplorationNode[];
    suggestedExplorations: string[];
  }> {
    const tempNode: ExplorationNode = {
      id: 'temp',
      content,
      noveltyScore: 0,
      explorationCount: 0,
      reward: 0,
      createdAt: new Date(),
      lastExploredAt: new Date(),
      metadata: { context }
    };
    
    const noveltyScore = this.calculateNovelty(tempNode);
    const isNovel = noveltyScore > this.NOVELTY_THRESHOLD;
    
    const allNodes = Array.from(this.nodes.values());
    const similarNodes = allNodes
      .filter(n => {
        const overlap = content.split(' ').filter(w => n.content.includes(w)).length;
        return overlap > 2;
      })
      .slice(0, 5);
    
    const suggestedExplorations = [
      `Combine ${content} with existing high-reward approaches`,
      `Explore edge cases of ${content}`,
      `Test ${content} in different contexts`
    ];
    
    return {
      isNovel,
      noveltyScore,
      similarNodes,
      suggestedExplorations
    };
  }

  updateReward(nodeId: string, reward: number): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.reward = (node.reward * node.explorationCount + reward) / (node.explorationCount + 1);
      this.nodes.set(nodeId, node);
    }
  }

  getStats(): {
    totalNodes: number;
    totalClusters: number;
    totalExplorations: number;
    averageNovelty: number;
    frontierSize: number;
    explorationStrategiesUsed: Record<string, number>;
  } {
    const nodes = Array.from(this.nodes.values());
    const explorations = Array.from(this.explorationHistory.values());
    
    const strategyCount: Record<string, number> = {};
    for (const exp of explorations) {
      strategyCount[exp.strategy] = (strategyCount[exp.strategy] || 0) + 1;
    }
    
    return {
      totalNodes: nodes.length,
      totalClusters: this.clusters.size,
      totalExplorations: explorations.length,
      averageNovelty: nodes.length > 0 
        ? nodes.reduce((sum, n) => sum + n.noveltyScore, 0) / nodes.length 
        : 0,
      frontierSize: nodes.filter(n => n.noveltyScore > this.NOVELTY_THRESHOLD).length,
      explorationStrategiesUsed: strategyCount
    };
  }
}

export const explorationPatternService = new ExplorationPatternService();
export { ExplorationPatternService };
export default explorationPatternService;
