/**
 * Reflection Pattern Service (Critic→Revise→Pass)
 * 
 * Features:
 * - Self-evaluation and critique
 * - Iterative revision based on feedback
 * - Quality scoring and thresholds
 * - Multi-aspect evaluation
 * - Improvement tracking
 */

import { v4 as uuidv4 } from 'uuid';

export type EvaluationAspect = 
  | 'accuracy'
  | 'completeness'
  | 'clarity'
  | 'relevance'
  | 'coherence'
  | 'actionability'
  | 'safety'
  | 'creativity';

export interface CritiqueResult {
  id: string;
  contentId: string;
  overallScore: number;
  aspectScores: Record<EvaluationAspect, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  passed: boolean;
  criticalIssues: string[];
}

export interface RevisionResult {
  id: string;
  originalContent: string;
  revisedContent: string;
  addressedIssues: string[];
  remainingIssues: string[];
  improvementScore: number;
  revisionStrategy: string;
}

export interface ReflectionIteration {
  iterationNumber: number;
  content: string;
  critique: CritiqueResult;
  revision?: RevisionResult;
  timestamp: Date;
  latencyMs: number;
}

export interface ReflectionSession {
  id: string;
  originalContent: string;
  originalPrompt?: string;
  iterations: ReflectionIteration[];
  finalContent: string;
  finalScore: number;
  totalIterations: number;
  passed: boolean;
  improvementPercentage: number;
  totalLatencyMs: number;
  createdAt: Date;
}

export interface ReflectionConfig {
  passThreshold: number;
  maxIterations: number;
  aspects: EvaluationAspect[];
  aspectWeights: Partial<Record<EvaluationAspect, number>>;
  criticalAspects: EvaluationAspect[];
  minImprovementPerIteration: number;
}

type ContentGenerator = (prompt: string, feedback?: CritiqueResult) => Promise<string>;

class ReflectionPatternService {
  private sessions: Map<string, ReflectionSession> = new Map();
  
  private config: ReflectionConfig = {
    passThreshold: 0.8,
    maxIterations: 5,
    aspects: ['accuracy', 'completeness', 'clarity', 'relevance', 'coherence'],
    aspectWeights: {
      accuracy: 1.5,
      completeness: 1.2,
      clarity: 1.0,
      relevance: 1.3,
      coherence: 1.0,
      actionability: 0.8,
      safety: 1.5,
      creativity: 0.7
    },
    criticalAspects: ['accuracy', 'safety'],
    minImprovementPerIteration: 0.05
  };

  private readonly ASPECT_EVALUATORS: Record<EvaluationAspect, (content: string, context?: string) => { score: number; feedback: string }> = {
    accuracy: (content: string) => {
      const hedgingWords = (content.match(/maybe|perhaps|possibly|might|could be/gi) || []).length;
      const confidenceMarkers = (content.match(/definitely|certainly|clearly|specifically/gi) || []).length;
      const score = Math.max(0.3, Math.min(1, 0.8 - hedgingWords * 0.1 + confidenceMarkers * 0.05));
      return {
        score,
        feedback: hedgingWords > 2 ? 'Contains too much hedging language' : 'Good confidence level'
      };
    },
    completeness: (content: string) => {
      const wordCount = content.split(/\s+/).length;
      const hasSections = /\n\n/.test(content) || /\d\.|•|-/.test(content);
      const score = Math.min(1, (wordCount / 200) * 0.5 + (hasSections ? 0.3 : 0) + 0.2);
      return {
        score,
        feedback: wordCount < 50 ? 'Response is too brief' : 'Adequate coverage'
      };
    },
    clarity: (content: string) => {
      const avgSentenceLength = content.split(/[.!?]+/).reduce((sum, s) => sum + s.split(/\s+/).length, 0) / 
                                Math.max(1, content.split(/[.!?]+/).length);
      const hasJargon = /\b(aforementioned|hereinafter|heretofore|whereby|therein)\b/i.test(content);
      const score = Math.max(0.3, Math.min(1, 1 - (avgSentenceLength > 25 ? 0.3 : 0) - (hasJargon ? 0.2 : 0)));
      return {
        score,
        feedback: avgSentenceLength > 25 ? 'Sentences are too long' : hasJargon ? 'Contains unnecessary jargon' : 'Clear and readable'
      };
    },
    relevance: (content: string, context?: string) => {
      if (!context) return { score: 0.7, feedback: 'No context provided for relevance check' };
      const contextTerms = context.toLowerCase().split(/\s+/).filter(t => t.length > 3);
      const contentLower = content.toLowerCase();
      const matchedTerms = contextTerms.filter(t => contentLower.includes(t)).length;
      const score = Math.min(1, matchedTerms / Math.max(1, contextTerms.length) + 0.3);
      return {
        score,
        feedback: score > 0.7 ? 'Highly relevant to context' : 'May need better alignment with context'
      };
    },
    coherence: (content: string) => {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const hasTransitions = /however|therefore|additionally|furthermore|moreover|consequently/i.test(content);
      const hasStructure = /first|second|finally|in conclusion|to summarize/i.test(content);
      const score = Math.min(1, 0.5 + (hasTransitions ? 0.25 : 0) + (hasStructure ? 0.25 : 0));
      return {
        score,
        feedback: hasTransitions && hasStructure ? 'Well-structured and coherent' : 'Could benefit from better transitions'
      };
    },
    actionability: (content: string) => {
      const hasActions = /you should|you can|try to|consider|recommend|step \d|action item/i.test(content);
      const hasExamples = /for example|such as|e\.g\.|like this/i.test(content);
      const score = Math.min(1, 0.4 + (hasActions ? 0.3 : 0) + (hasExamples ? 0.3 : 0));
      return {
        score,
        feedback: hasActions ? 'Contains actionable guidance' : 'Could be more actionable'
      };
    },
    safety: (content: string) => {
      const dangerousPatterns = /hack|exploit|bypass security|illegal|harmful/i.test(content);
      const hasDisclaimers = /consult|professional advice|not intended as|disclaimer/i.test(content);
      const score = dangerousPatterns ? 0.2 : (hasDisclaimers ? 1 : 0.8);
      return {
        score,
        feedback: dangerousPatterns ? 'CRITICAL: Contains potentially harmful content' : 'Safe content'
      };
    },
    creativity: (content: string) => {
      const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
      const totalWords = content.split(/\s+/).length;
      const lexicalDiversity = uniqueWords / Math.max(1, totalWords);
      const hasAnalogies = /like|similar to|imagine|think of it as/i.test(content);
      const score = Math.min(1, lexicalDiversity + (hasAnalogies ? 0.2 : 0));
      return {
        score,
        feedback: lexicalDiversity > 0.6 ? 'Good variety and creativity' : 'Could use more varied language'
      };
    }
  };

  async critique(
    content: string,
    context?: string,
    aspects?: EvaluationAspect[]
  ): Promise<CritiqueResult> {
    const evaluationAspects = aspects || this.config.aspects;
    const aspectScores: Record<EvaluationAspect, number> = {} as Record<EvaluationAspect, number>;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    const criticalIssues: string[] = [];

    for (const aspect of evaluationAspects) {
      const evaluator = this.ASPECT_EVALUATORS[aspect];
      const result = evaluator(content, context);
      aspectScores[aspect] = result.score;

      if (result.score >= 0.8) {
        strengths.push(`${aspect}: ${result.feedback}`);
      } else if (result.score < 0.5) {
        weaknesses.push(`${aspect}: ${result.feedback}`);
        suggestions.push(`Improve ${aspect}: ${result.feedback}`);
        
        if (this.config.criticalAspects.includes(aspect)) {
          criticalIssues.push(`Critical issue in ${aspect}: ${result.feedback}`);
        }
      }
    }

    let weightedSum = 0;
    let weightTotal = 0;
    for (const aspect of evaluationAspects) {
      const weight = this.config.aspectWeights[aspect] || 1;
      weightedSum += aspectScores[aspect] * weight;
      weightTotal += weight;
    }
    const overallScore = weightedSum / weightTotal;

    const passed = overallScore >= this.config.passThreshold && criticalIssues.length === 0;

    return {
      id: uuidv4(),
      contentId: uuidv4(),
      overallScore,
      aspectScores,
      strengths,
      weaknesses,
      suggestions,
      passed,
      criticalIssues
    };
  }

  async revise(
    content: string,
    critique: CritiqueResult,
    generator?: ContentGenerator
  ): Promise<RevisionResult> {
    const addressedIssues: string[] = [];
    const remainingIssues: string[] = [];
    
    let revisedContent = content;

    for (const weakness of critique.weaknesses) {
      const aspect = weakness.split(':')[0].toLowerCase() as EvaluationAspect;
      
      switch (aspect) {
        case 'completeness':
          revisedContent = this.expandContent(revisedContent);
          addressedIssues.push(weakness);
          break;
        case 'clarity':
          revisedContent = this.simplifyContent(revisedContent);
          addressedIssues.push(weakness);
          break;
        case 'coherence':
          revisedContent = this.addTransitions(revisedContent);
          addressedIssues.push(weakness);
          break;
        case 'actionability':
          revisedContent = this.addActionItems(revisedContent);
          addressedIssues.push(weakness);
          break;
        default:
          remainingIssues.push(weakness);
      }
    }

    for (const critical of critique.criticalIssues) {
      remainingIssues.push(critical);
    }

    const originalScore = critique.overallScore;
    const revisedCritique = await this.critique(revisedContent);
    const improvementScore = revisedCritique.overallScore - originalScore;

    return {
      id: uuidv4(),
      originalContent: content,
      revisedContent,
      addressedIssues,
      remainingIssues,
      improvementScore,
      revisionStrategy: `Addressed ${addressedIssues.length} issues using rule-based revision`
    };
  }

  private expandContent(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    if (sentences.length < 3) {
      return `${content}\n\nTo elaborate further, this topic involves several key considerations. First, it's important to understand the context and background. Second, practical application requires careful attention to details. Finally, ongoing evaluation helps ensure success.`;
    }
    return content;
  }

  private simplifyContent(content: string): string {
    return content
      .replace(/\b(aforementioned|hereinafter|heretofore|whereby|therein)\b/gi, '')
      .replace(/([^.!?]{80,}?)(\s+\w+)/g, '$1.$2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private addTransitions(content: string): string {
    const sentences = content.split(/(?<=[.!?])\s+/);
    if (sentences.length < 2) return content;

    const transitions = ['Furthermore,', 'Additionally,', 'Moreover,', 'In addition,'];
    let result = sentences[0];
    
    for (let i = 1; i < sentences.length; i++) {
      if (i === sentences.length - 1) {
        result += ' In conclusion, ' + sentences[i];
      } else if (i % 2 === 0 && !sentences[i].match(/^(However|Therefore|Additionally|Furthermore)/i)) {
        result += ' ' + transitions[i % transitions.length] + ' ' + sentences[i].charAt(0).toLowerCase() + sentences[i].slice(1);
      } else {
        result += ' ' + sentences[i];
      }
    }
    
    return result;
  }

  private addActionItems(content: string): string {
    if (!/you should|you can|try to|consider|recommend/i.test(content)) {
      return `${content}\n\nKey action items:\n1. Review the information provided above\n2. Consider how it applies to your specific situation\n3. Take appropriate steps based on your context`;
    }
    return content;
  }

  async runReflectionLoop(
    initialContent: string,
    options: {
      prompt?: string;
      generator?: ContentGenerator;
      config?: Partial<ReflectionConfig>;
      context?: string;
    } = {}
  ): Promise<ReflectionSession> {
    const startTime = Date.now();
    const sessionId = uuidv4();
    const sessionConfig = { ...this.config, ...options.config };
    
    const session: ReflectionSession = {
      id: sessionId,
      originalContent: initialContent,
      originalPrompt: options.prompt,
      iterations: [],
      finalContent: initialContent,
      finalScore: 0,
      totalIterations: 0,
      passed: false,
      improvementPercentage: 0,
      totalLatencyMs: 0,
      createdAt: new Date()
    };

    let currentContent = initialContent;
    let previousScore = 0;

    for (let i = 0; i < sessionConfig.maxIterations; i++) {
      const iterationStart = Date.now();

      const critique = await this.critique(currentContent, options.context, sessionConfig.aspects);
      
      const iteration: ReflectionIteration = {
        iterationNumber: i + 1,
        content: currentContent,
        critique,
        timestamp: new Date(),
        latencyMs: 0
      };

      if (critique.passed) {
        iteration.latencyMs = Date.now() - iterationStart;
        session.iterations.push(iteration);
        session.finalContent = currentContent;
        session.finalScore = critique.overallScore;
        session.passed = true;
        break;
      }

      if (i > 0) {
        const improvement = critique.overallScore - previousScore;
        if (improvement < sessionConfig.minImprovementPerIteration) {
          iteration.latencyMs = Date.now() - iterationStart;
          session.iterations.push(iteration);
          session.finalContent = currentContent;
          session.finalScore = critique.overallScore;
          break;
        }
      }

      const revision = await this.revise(currentContent, critique, options.generator);
      iteration.revision = revision;
      iteration.latencyMs = Date.now() - iterationStart;
      session.iterations.push(iteration);

      previousScore = critique.overallScore;
      currentContent = revision.revisedContent;
    }

    session.totalIterations = session.iterations.length;
    
    if (session.iterations.length > 0) {
      const firstScore = session.iterations[0].critique.overallScore;
      const lastScore = session.iterations[session.iterations.length - 1].critique.overallScore;
      session.improvementPercentage = ((lastScore - firstScore) / Math.max(0.01, firstScore)) * 100;
      
      if (!session.passed) {
        session.finalScore = lastScore;
        session.finalContent = currentContent;
      }
    }

    session.totalLatencyMs = Date.now() - startTime;
    this.sessions.set(sessionId, session);
    
    return session;
  }

  getSession(sessionId: string): ReflectionSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateConfig(newConfig: Partial<ReflectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getStats(): {
    totalSessions: number;
    passRate: number;
    averageIterations: number;
    averageImprovement: number;
    averageFinalScore: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const passed = sessions.filter(s => s.passed).length;
    const totalIterations = sessions.reduce((sum, s) => sum + s.totalIterations, 0);
    const totalImprovement = sessions.reduce((sum, s) => sum + s.improvementPercentage, 0);
    const totalFinalScore = sessions.reduce((sum, s) => sum + s.finalScore, 0);

    return {
      totalSessions: sessions.length,
      passRate: sessions.length > 0 ? passed / sessions.length : 0,
      averageIterations: sessions.length > 0 ? totalIterations / sessions.length : 0,
      averageImprovement: sessions.length > 0 ? totalImprovement / sessions.length : 0,
      averageFinalScore: sessions.length > 0 ? totalFinalScore / sessions.length : 0
    };
  }
}

export const reflectionPatternService = new ReflectionPatternService();
export default reflectionPatternService;
