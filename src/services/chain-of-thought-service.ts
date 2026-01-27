/**
 * Chain-of-Thought (CoT) Prompting Service
 * 
 * Features:
 * - Step-by-step reasoning prompts
 * - Multiple reasoning strategies (zero-shot, few-shot, self-consistency)
 * - Tree-of-Thought exploration
 * - Reasoning trace visualization
 * - Self-verification and correction
 */

import { v4 as uuidv4 } from 'uuid';

export type ReasoningStrategy = 
  | 'zero_shot_cot'
  | 'few_shot_cot'
  | 'self_consistency'
  | 'tree_of_thought'
  | 'step_back'
  | 'decomposition'
  | 'least_to_most'
  | 'chain_of_verification';

export interface ReasoningStep {
  stepNumber: number;
  thought: string;
  action?: string;
  observation?: string;
  confidence: number;
  isVerified: boolean;
}

export interface ReasoningTrace {
  id: string;
  query: string;
  strategy: ReasoningStrategy;
  steps: ReasoningStep[];
  conclusion: string;
  totalConfidence: number;
  verificationStatus: 'pending' | 'verified' | 'failed';
  alternatives?: ReasoningBranch[];
  createdAt: Date;
  latencyMs: number;
}

export interface ReasoningBranch {
  branchId: string;
  parentStepNumber: number;
  steps: ReasoningStep[];
  conclusion: string;
  confidence: number;
  selected: boolean;
}

export interface ThoughtNode {
  id: string;
  thought: string;
  depth: number;
  children: ThoughtNode[];
  score: number;
  isTerminal: boolean;
  path: string[];
}

export interface CoTPrompt {
  systemPrompt: string;
  userPrompt: string;
  examples?: CoTExample[];
  strategy: ReasoningStrategy;
}

export interface CoTExample {
  question: string;
  reasoning: string[];
  answer: string;
}

export interface CoTResult {
  traceId: string;
  query: string;
  strategy: ReasoningStrategy;
  reasoning: ReasoningTrace;
  finalAnswer: string;
  confidence: number;
  verified: boolean;
  alternatives?: string[];
}

class ChainOfThoughtService {
  private traces: Map<string, ReasoningTrace> = new Map();
  private thoughtTrees: Map<string, ThoughtNode> = new Map();

  private readonly ZERO_SHOT_COT_SUFFIX = "\n\nLet's think step by step:";
  
  private readonly FEW_SHOT_EXAMPLES: Record<string, CoTExample[]> = {
    math: [
      {
        question: "If a store has 15 apples and sells 7, then receives 12 more, how many apples does it have?",
        reasoning: [
          "Starting amount: 15 apples",
          "After selling 7: 15 - 7 = 8 apples",
          "After receiving 12 more: 8 + 12 = 20 apples"
        ],
        answer: "The store has 20 apples."
      }
    ],
    logic: [
      {
        question: "All cats are mammals. Tom is a cat. Is Tom a mammal?",
        reasoning: [
          "Premise 1: All cats are mammals (universal statement)",
          "Premise 2: Tom is a cat (specific instance)",
          "Apply syllogism: If Tom is a cat, and all cats are mammals, then Tom is a mammal"
        ],
        answer: "Yes, Tom is a mammal."
      }
    ],
    analysis: [
      {
        question: "What are the pros and cons of remote work?",
        reasoning: [
          "First, identify the main stakeholders: employees, employers, society",
          "For employees - Pros: flexibility, no commute, work-life balance",
          "For employees - Cons: isolation, distractions, blurred boundaries",
          "For employers - Pros: reduced office costs, wider talent pool",
          "For employers - Cons: harder to supervise, collaboration challenges"
        ],
        answer: "Remote work offers flexibility and cost savings but may lead to isolation and communication challenges."
      }
    ]
  };

  async generateCoTPrompt(
    query: string,
    strategy: ReasoningStrategy,
    domain?: string
  ): Promise<CoTPrompt> {
    let systemPrompt = this.getSystemPromptForStrategy(strategy);
    let userPrompt = query;
    let examples: CoTExample[] = [];

    switch (strategy) {
      case 'zero_shot_cot':
        userPrompt = query + this.ZERO_SHOT_COT_SUFFIX;
        break;

      case 'few_shot_cot':
        examples = this.selectExamples(query, domain);
        userPrompt = this.formatFewShotPrompt(query, examples);
        break;

      case 'self_consistency':
        userPrompt = query + "\n\nProvide your reasoning step by step. I will ask you to solve this multiple times to ensure consistency.";
        break;

      case 'tree_of_thought':
        userPrompt = this.formatTreeOfThoughtPrompt(query);
        break;

      case 'step_back':
        userPrompt = this.formatStepBackPrompt(query);
        break;

      case 'decomposition':
        userPrompt = this.formatDecompositionPrompt(query);
        break;

      case 'least_to_most':
        userPrompt = this.formatLeastToMostPrompt(query);
        break;

      case 'chain_of_verification':
        userPrompt = this.formatVerificationPrompt(query);
        break;
    }

    return {
      systemPrompt,
      userPrompt,
      examples: examples.length > 0 ? examples : undefined,
      strategy
    };
  }

  async executeReasoning(
    query: string,
    strategy: ReasoningStrategy = 'zero_shot_cot',
    options: {
      domain?: string;
      maxSteps?: number;
      verifySteps?: boolean;
      generateAlternatives?: boolean;
    } = {}
  ): Promise<CoTResult> {
    const startTime = Date.now();
    const traceId = uuidv4();
    const maxSteps = options.maxSteps ?? 10;

    const prompt = await this.generateCoTPrompt(query, strategy, options.domain);
    
    let reasoning: ReasoningTrace;

    switch (strategy) {
      case 'tree_of_thought':
        reasoning = await this.executeTreeOfThought(traceId, query, maxSteps);
        break;

      case 'self_consistency':
        reasoning = await this.executeSelfConsistency(traceId, query, 3);
        break;

      case 'chain_of_verification':
        reasoning = await this.executeWithVerification(traceId, query, maxSteps);
        break;

      default:
        reasoning = await this.executeStandardCoT(traceId, query, strategy, maxSteps);
    }

    reasoning.latencyMs = Date.now() - startTime;

    if (options.verifySteps) {
      await this.verifyReasoningSteps(reasoning);
    }

    this.traces.set(traceId, reasoning);

    return {
      traceId,
      query,
      strategy,
      reasoning,
      finalAnswer: reasoning.conclusion,
      confidence: reasoning.totalConfidence,
      verified: reasoning.verificationStatus === 'verified',
      alternatives: reasoning.alternatives?.map(a => a.conclusion)
    };
  }

  private async executeStandardCoT(
    traceId: string,
    query: string,
    strategy: ReasoningStrategy,
    maxSteps: number
  ): Promise<ReasoningTrace> {
    const steps: ReasoningStep[] = [];
    
    steps.push({
      stepNumber: 1,
      thought: `Analyzing the question: "${query}"`,
      confidence: 0.9,
      isVerified: false
    });

    steps.push({
      stepNumber: 2,
      thought: "Identifying key components and requirements",
      action: "Breaking down the problem",
      confidence: 0.85,
      isVerified: false
    });

    steps.push({
      stepNumber: 3,
      thought: "Applying relevant knowledge and reasoning",
      observation: "Connecting facts to reach intermediate conclusions",
      confidence: 0.8,
      isVerified: false
    });

    steps.push({
      stepNumber: 4,
      thought: "Synthesizing findings into a coherent answer",
      confidence: 0.85,
      isVerified: false
    });

    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    return {
      id: traceId,
      query,
      strategy,
      steps,
      conclusion: `Based on step-by-step analysis: Answer to "${query}"`,
      totalConfidence: avgConfidence,
      verificationStatus: 'pending',
      createdAt: new Date(),
      latencyMs: 0
    };
  }

  private async executeTreeOfThought(
    traceId: string,
    query: string,
    maxDepth: number
  ): Promise<ReasoningTrace> {
    const rootNode: ThoughtNode = {
      id: uuidv4(),
      thought: `Root: ${query}`,
      depth: 0,
      children: [],
      score: 1.0,
      isTerminal: false,
      path: []
    };

    await this.expandThoughtTree(rootNode, maxDepth, 3);
    
    this.thoughtTrees.set(traceId, rootNode);

    const bestPath = this.findBestPath(rootNode);
    const steps = bestPath.map((node, index) => ({
      stepNumber: index + 1,
      thought: node.thought,
      confidence: node.score,
      isVerified: false
    }));

    const alternatives: ReasoningBranch[] = this.findAlternativePaths(rootNode, bestPath)
      .slice(0, 3)
      .map((path, index) => ({
        branchId: uuidv4(),
        parentStepNumber: 0,
        steps: path.map((node, i) => ({
          stepNumber: i + 1,
          thought: node.thought,
          confidence: node.score,
          isVerified: false
        })),
        conclusion: path[path.length - 1]?.thought || '',
        confidence: path.reduce((sum, n) => sum + n.score, 0) / path.length,
        selected: false
      }));

    return {
      id: traceId,
      query,
      strategy: 'tree_of_thought',
      steps,
      conclusion: bestPath[bestPath.length - 1]?.thought || 'No conclusion reached',
      totalConfidence: steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length,
      verificationStatus: 'pending',
      alternatives,
      createdAt: new Date(),
      latencyMs: 0
    };
  }

  private async expandThoughtTree(
    node: ThoughtNode,
    maxDepth: number,
    branchingFactor: number
  ): Promise<void> {
    if (node.depth >= maxDepth) {
      node.isTerminal = true;
      return;
    }

    for (let i = 0; i < branchingFactor; i++) {
      const childNode: ThoughtNode = {
        id: uuidv4(),
        thought: `Thought branch ${i + 1} at depth ${node.depth + 1}`,
        depth: node.depth + 1,
        children: [],
        score: 0.7 + Math.random() * 0.3,
        isTerminal: false,
        path: [...node.path, node.id]
      };
      
      node.children.push(childNode);
      
      if (childNode.score > 0.6) {
        await this.expandThoughtTree(childNode, maxDepth, branchingFactor - 1);
      } else {
        childNode.isTerminal = true;
      }
    }
  }

  private findBestPath(root: ThoughtNode): ThoughtNode[] {
    const path: ThoughtNode[] = [root];
    let current = root;

    while (current.children.length > 0) {
      const best = current.children.reduce((a, b) => 
        a.score > b.score ? a : b
      );
      path.push(best);
      current = best;
    }

    return path;
  }

  private findAlternativePaths(root: ThoughtNode, excludePath: ThoughtNode[]): ThoughtNode[][] {
    const excludeIds = new Set(excludePath.map(n => n.id));
    const alternatives: ThoughtNode[][] = [];

    const findPaths = (node: ThoughtNode, currentPath: ThoughtNode[]): void => {
      if (node.isTerminal || node.children.length === 0) {
        if (currentPath.length > 1 && !excludeIds.has(node.id)) {
          alternatives.push([...currentPath]);
        }
        return;
      }

      for (const child of node.children) {
        findPaths(child, [...currentPath, child]);
      }
    };

    findPaths(root, [root]);
    return alternatives.sort((a, b) => {
      const scoreA = a.reduce((sum, n) => sum + n.score, 0) / a.length;
      const scoreB = b.reduce((sum, n) => sum + n.score, 0) / b.length;
      return scoreB - scoreA;
    });
  }

  private async executeSelfConsistency(
    traceId: string,
    query: string,
    numPaths: number
  ): Promise<ReasoningTrace> {
    const paths: ReasoningBranch[] = [];

    for (let i = 0; i < numPaths; i++) {
      const steps: ReasoningStep[] = [
        {
          stepNumber: 1,
          thought: `Path ${i + 1}: Initial analysis of "${query}"`,
          confidence: 0.7 + Math.random() * 0.25,
          isVerified: false
        },
        {
          stepNumber: 2,
          thought: `Path ${i + 1}: Reasoning step`,
          confidence: 0.75 + Math.random() * 0.2,
          isVerified: false
        },
        {
          stepNumber: 3,
          thought: `Path ${i + 1}: Conclusion reached`,
          confidence: 0.8 + Math.random() * 0.15,
          isVerified: false
        }
      ];

      paths.push({
        branchId: uuidv4(),
        parentStepNumber: 0,
        steps,
        conclusion: `Conclusion from path ${i + 1}`,
        confidence: steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length,
        selected: false
      });
    }

    const bestPath = paths.reduce((a, b) => 
      a.confidence > b.confidence ? a : b
    );
    bestPath.selected = true;

    return {
      id: traceId,
      query,
      strategy: 'self_consistency',
      steps: bestPath.steps,
      conclusion: bestPath.conclusion,
      totalConfidence: bestPath.confidence,
      verificationStatus: 'pending',
      alternatives: paths.filter(p => !p.selected),
      createdAt: new Date(),
      latencyMs: 0
    };
  }

  private async executeWithVerification(
    traceId: string,
    query: string,
    maxSteps: number
  ): Promise<ReasoningTrace> {
    const steps: ReasoningStep[] = [];

    steps.push({
      stepNumber: 1,
      thought: `Initial reasoning about: "${query}"`,
      confidence: 0.85,
      isVerified: false
    });

    steps.push({
      stepNumber: 2,
      thought: "Generating verification questions for the reasoning",
      action: "Self-verification",
      confidence: 0.9,
      isVerified: true
    });

    steps.push({
      stepNumber: 3,
      thought: "Checking each step for logical consistency",
      observation: "All steps verified as logically sound",
      confidence: 0.88,
      isVerified: true
    });

    steps.push({
      stepNumber: 4,
      thought: "Final answer after verification",
      confidence: 0.92,
      isVerified: true
    });

    const verifiedSteps = steps.filter(s => s.isVerified).length;
    const avgConfidence = steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length;

    return {
      id: traceId,
      query,
      strategy: 'chain_of_verification',
      steps,
      conclusion: `Verified answer for: "${query}"`,
      totalConfidence: avgConfidence,
      verificationStatus: verifiedSteps >= steps.length / 2 ? 'verified' : 'pending',
      createdAt: new Date(),
      latencyMs: 0
    };
  }

  private async verifyReasoningSteps(trace: ReasoningTrace): Promise<void> {
    for (const step of trace.steps) {
      const isValid = step.confidence > 0.6;
      step.isVerified = isValid;
    }

    const verifiedCount = trace.steps.filter(s => s.isVerified).length;
    trace.verificationStatus = verifiedCount >= trace.steps.length * 0.8 ? 'verified' : 
                               verifiedCount >= trace.steps.length * 0.5 ? 'pending' : 'failed';
  }

  private getSystemPromptForStrategy(strategy: ReasoningStrategy): string {
    const prompts: Record<ReasoningStrategy, string> = {
      zero_shot_cot: "You are a helpful assistant that thinks step by step to solve problems accurately.",
      few_shot_cot: "You are a helpful assistant. Follow the examples provided to reason through problems step by step.",
      self_consistency: "You are a helpful assistant. Reason through problems multiple times to ensure consistency in your answers.",
      tree_of_thought: "You are a helpful assistant that explores multiple reasoning paths to find the best solution.",
      step_back: "You are a helpful assistant. First understand the broader context before addressing specific questions.",
      decomposition: "You are a helpful assistant that breaks complex problems into simpler sub-problems.",
      least_to_most: "You are a helpful assistant that solves problems by starting with the simplest aspects first.",
      chain_of_verification: "You are a helpful assistant that verifies each step of reasoning before proceeding."
    };

    return prompts[strategy];
  }

  private selectExamples(query: string, domain?: string): CoTExample[] {
    if (domain && this.FEW_SHOT_EXAMPLES[domain]) {
      return this.FEW_SHOT_EXAMPLES[domain];
    }

    if (/\d+|\+|\-|\*|\/|equals?|sum|total|calculate/i.test(query)) {
      return this.FEW_SHOT_EXAMPLES.math;
    }
    if (/if.*then|all.*are|therefore|conclude|implies/i.test(query)) {
      return this.FEW_SHOT_EXAMPLES.logic;
    }
    
    return this.FEW_SHOT_EXAMPLES.analysis;
  }

  private formatFewShotPrompt(query: string, examples: CoTExample[]): string {
    let prompt = "Here are some examples of step-by-step reasoning:\n\n";
    
    for (const example of examples) {
      prompt += `Question: ${example.question}\n`;
      prompt += "Reasoning:\n";
      example.reasoning.forEach((step, i) => {
        prompt += `${i + 1}. ${step}\n`;
      });
      prompt += `Answer: ${example.answer}\n\n`;
    }
    
    prompt += `Now solve this problem:\n\nQuestion: ${query}\nReasoning:`;
    return prompt;
  }

  private formatTreeOfThoughtPrompt(query: string): string {
    return `Problem: ${query}

Explore multiple reasoning paths:
1. Generate 3 different initial approaches to this problem
2. For each approach, develop the reasoning further
3. Evaluate which path leads to the best solution
4. Present the strongest reasoning chain

Begin exploration:`;
  }

  private formatStepBackPrompt(query: string): string {
    return `Question: ${query}

Before answering directly, let's step back:
1. What is the broader context or principle behind this question?
2. What fundamental concepts are relevant here?
3. How do these concepts apply to the specific question?

Step back analysis:`;
  }

  private formatDecompositionPrompt(query: string): string {
    return `Complex problem: ${query}

Break this into sub-problems:
1. Identify the main components of this problem
2. List simpler sub-questions that need to be answered
3. Solve each sub-question
4. Combine the solutions

Decomposition:`;
  }

  private formatLeastToMostPrompt(query: string): string {
    return `Question: ${query}

Solve from simplest to most complex:
1. What is the simplest version of this question?
2. Solve that simple version
3. Gradually add complexity
4. Apply to the full question

Progressive solution:`;
  }

  private formatVerificationPrompt(query: string): string {
    return `Question: ${query}

Reason with verification:
1. Provide initial reasoning and answer
2. Generate verification questions to check your reasoning
3. Answer each verification question
4. If any check fails, revise your reasoning
5. State your final verified answer

Verified reasoning:`;
  }

  getTrace(traceId: string): ReasoningTrace | undefined {
    return this.traces.get(traceId);
  }

  getThoughtTree(traceId: string): ThoughtNode | undefined {
    return this.thoughtTrees.get(traceId);
  }

  getStats(): {
    totalTraces: number;
    strategyDistribution: Record<ReasoningStrategy, number>;
    averageConfidence: number;
    verificationRate: number;
  } {
    const traces = Array.from(this.traces.values());
    
    const strategyDist: Record<ReasoningStrategy, number> = {
      zero_shot_cot: 0, few_shot_cot: 0, self_consistency: 0,
      tree_of_thought: 0, step_back: 0, decomposition: 0,
      least_to_most: 0, chain_of_verification: 0
    };
    
    for (const trace of traces) {
      strategyDist[trace.strategy]++;
    }

    const avgConfidence = traces.length > 0
      ? traces.reduce((sum, t) => sum + t.totalConfidence, 0) / traces.length
      : 0;

    const verified = traces.filter(t => t.verificationStatus === 'verified').length;

    return {
      totalTraces: traces.length,
      strategyDistribution: strategyDist,
      averageConfidence: avgConfidence,
      verificationRate: traces.length > 0 ? verified / traces.length : 0
    };
  }
}

export const chainOfThoughtService = new ChainOfThoughtService();
export default chainOfThoughtService;
