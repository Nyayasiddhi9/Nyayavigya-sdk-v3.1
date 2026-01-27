/**
 * Adaptive Learning System
 * Self-improving AI that learns from interactions
 */

import { EventEmitter } from 'events';

export interface LearningPattern {
  id: string;
  pattern: string;
  confidence: number;
  occurrences: number;
  lastSeen: Date;
  context: Record<string, unknown>;
}

export interface ABTestResult {
  testId: string;
  variantA: { impressions: number; conversions: number };
  variantB: { impressions: number; conversions: number };
  winner: 'A' | 'B' | 'inconclusive';
  statisticalSignificance: number;
}

export interface LearningStats {
  totalPatterns: number;
  activeTests: number;
  learningRate: number;
  adaptationScore: number;
}

export class AdaptiveLearningSystem extends EventEmitter {
  private static instance: AdaptiveLearningSystem;
  private patterns: Map<string, LearningPattern> = new Map();
  private abTests: Map<string, ABTestResult> = new Map();
  private learningRate: number = 0.01;
  private isActive: boolean = false;

  private constructor() {
    super();
    console.log('🧠 AdaptiveLearningSystem initialized');
  }

  public static getInstance(): AdaptiveLearningSystem {
    if (!AdaptiveLearningSystem.instance) {
      AdaptiveLearningSystem.instance = new AdaptiveLearningSystem();
    }
    return AdaptiveLearningSystem.instance;
  }

  public async start(): Promise<void> {
    this.isActive = true;
    console.log('🚀 Adaptive Learning System started');
    this.emit('learning-started');
  }

  public async stop(): Promise<void> {
    this.isActive = false;
    console.log('⏹️ Adaptive Learning System stopped');
    this.emit('learning-stopped');
  }

  public async learnPattern(pattern: Omit<LearningPattern, 'id' | 'lastSeen'>): Promise<LearningPattern> {
    const id = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const learningPattern: LearningPattern = {
      ...pattern,
      id,
      lastSeen: new Date()
    };
    
    this.patterns.set(id, learningPattern);
    this.emit('pattern-learned', learningPattern);
    
    return learningPattern;
  }

  public async reinforcePattern(patternId: string, feedback: 'positive' | 'negative'): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    if (feedback === 'positive') {
      pattern.confidence = Math.min(1, pattern.confidence + this.learningRate);
      pattern.occurrences++;
    } else {
      pattern.confidence = Math.max(0, pattern.confidence - this.learningRate);
    }
    
    pattern.lastSeen = new Date();
    this.emit('pattern-reinforced', { patternId, feedback, newConfidence: pattern.confidence });
  }

  public async startABTest(testId: string): Promise<ABTestResult> {
    const result: ABTestResult = {
      testId,
      variantA: { impressions: 0, conversions: 0 },
      variantB: { impressions: 0, conversions: 0 },
      winner: 'inconclusive',
      statisticalSignificance: 0
    };
    
    this.abTests.set(testId, result);
    this.emit('ab-test-started', testId);
    
    return result;
  }

  public async recordABTestImpression(testId: string, variant: 'A' | 'B', converted: boolean): Promise<void> {
    const test = this.abTests.get(testId);
    if (!test) return;

    if (variant === 'A') {
      test.variantA.impressions++;
      if (converted) test.variantA.conversions++;
    } else {
      test.variantB.impressions++;
      if (converted) test.variantB.conversions++;
    }

    this.calculateSignificance(test);
  }

  private calculateSignificance(test: ABTestResult): void {
    const rateA = test.variantA.conversions / Math.max(1, test.variantA.impressions);
    const rateB = test.variantB.conversions / Math.max(1, test.variantB.impressions);
    
    const pooledRate = (test.variantA.conversions + test.variantB.conversions) / 
                       Math.max(1, test.variantA.impressions + test.variantB.impressions);
    
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * 
               (1 / Math.max(1, test.variantA.impressions) + 1 / Math.max(1, test.variantB.impressions)));
    
    const z = Math.abs(rateA - rateB) / Math.max(0.0001, se);
    test.statisticalSignificance = 1 - Math.exp(-0.5 * z * z);
    
    if (test.statisticalSignificance > 0.95) {
      test.winner = rateA > rateB ? 'A' : 'B';
      this.emit('ab-test-completed', test);
    }
  }

  public async completeABTest(testId: string): Promise<ABTestResult | null> {
    const test = this.abTests.get(testId);
    if (!test) return null;
    
    this.emit('ab-test-completed', test);
    return test;
  }

  public getStats(): LearningStats {
    return {
      totalPatterns: this.patterns.size,
      activeTests: this.abTests.size,
      learningRate: this.learningRate,
      adaptationScore: this.calculateAdaptationScore()
    };
  }

  private calculateAdaptationScore(): number {
    if (this.patterns.size === 0) return 0;
    
    const avgConfidence = Array.from(this.patterns.values())
      .reduce((sum, p) => sum + p.confidence, 0) / this.patterns.size;
    
    return Math.round(avgConfidence * 100);
  }

  public getAllPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values());
  }

  public getAllTests(): ABTestResult[] {
    return Array.from(this.abTests.values());
  }
}

export const adaptiveLearningSystem = AdaptiveLearningSystem.getInstance();
export default AdaptiveLearningSystem;
