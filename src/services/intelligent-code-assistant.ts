/**
 * Intelligent Code Assistant Service
 * Phase 2: Advanced IDE Features - AI-Powered Code Intelligence
 * Integrates with WAI Orchestration for real-time code assistance
 */

import { EventEmitter } from 'events';
import { waiOrchestrator } from './unified-orchestration-client'

export interface CodeAnalysisResult {
  suggestions: CodeSuggestion[];
  errors: CodeError[];
  warnings: CodeWarning[];
  metrics: CodeMetrics;
  refactoringSuggestions: RefactoringSuggestion[];
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'optimization' | 'best_practice';
  line: number;
  column: number;
  text: string;
  description: string;
  confidence: number;
  provider: string;
}

export interface CodeError {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  fixSuggestions: string[];
  quickFix?: string;
}

export interface CodeWarning {
  id: string;
  line: number;
  column: number;
  message: string;
  type: 'performance' | 'security' | 'maintainability';
  impact: 'low' | 'medium' | 'high';
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  duplicateLines: number;
  technicalDebt: {
    score: number;
    issues: string[];
  };
}

export interface RefactoringSuggestion {
  id: string;
  type: 'extract_method' | 'rename_variable' | 'simplify_condition' | 'remove_duplication';
  startLine: number;
  endLine: number;
  description: string;
  benefits: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
}

export interface ArchitectureSuggestion {
  component: string;
  suggestion: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  implementation: string[];
}

class IntelligentCodeAssistant extends EventEmitter {
  private analysisCache = new Map<string, CodeAnalysisResult>();
  private completionCache = new Map<string, CodeSuggestion[]>();
  
  constructor() {
    super();
    this.setupRealtimeAnalysis();
  }

  /**
   * Get intelligent code completions using WAI orchestration
   */
  async getCodeCompletions(
    projectId: string,
    fileName: string,
    content: string,
    cursorPosition: { line: number; column: number },
    language: string
  ): Promise<CodeSuggestion[]> {
    const cacheKey = `${fileName}-${cursorPosition.line}-${cursorPosition.column}`;
    
    if (this.completionCache.has(cacheKey)) {
      return this.completionCache.get(cacheKey)!;
    }

    try {
      const prompt = `
        As an expert ${language} developer, provide intelligent code completions for the following context:
        
        File: ${fileName}
        Language: ${language}
        Cursor Position: Line ${cursorPosition.line}, Column ${cursorPosition.column}
        
        Code Context:
        \`\`\`${language}
        ${content}
        \`\`\`
        
        Provide up to 5 intelligent completions that:
        1. Follow ${language} best practices
        2. Are contextually relevant
        3. Include type information where applicable
        4. Consider existing patterns in the code
        
        Return as JSON array with: { text, description, confidence }
      `;

      const response = await waiOrchestrator.processRequest({
        id: `completion-${Date.now()}`,
        type: 'code_completion',
        prompt: prompt,
        projectId,
        metadata: {
          fileName,
          language,
          position: cursorPosition
        }
      });

      const completions = this.parseCompletions(response.data || response.content, cursorPosition);
      this.completionCache.set(cacheKey, completions);
      
      // Cache cleanup after 5 minutes
      setTimeout(() => this.completionCache.delete(cacheKey), 300000);
      
      return completions;
    } catch (error) {
      console.error('Error getting code completions:', error);
      return [];
    }
  }

  /**
   * Perform comprehensive code analysis
   */
  async analyzeCode(
    projectId: string,
    fileName: string,
    content: string,
    language: string
  ): Promise<CodeAnalysisResult> {
    const cacheKey = `${projectId}-${fileName}`;
    
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    try {
      const analysisPrompt = `
        As a senior software architect and code reviewer, analyze this ${language} code:
        
        File: ${fileName}
        Language: ${language}
        
        Code:
        \`\`\`${language}
        ${content}
        \`\`\`
        
        Provide comprehensive analysis including:
        1. Code errors and warnings with line numbers
        2. Performance optimization opportunities
        3. Security vulnerabilities
        4. Code quality metrics (complexity, maintainability)
        5. Refactoring suggestions
        6. Best practice violations
        
        Return structured JSON with detailed analysis.
      `;

      const response = await waiOrchestrator.processRequest({
        id: `analysis-${Date.now()}`,
        type: 'code_analysis',
        prompt: analysisPrompt,
        projectId,
        metadata: {
          fileName,
          language
        }
      });

      const analysis = this.parseAnalysisResult(response.data || response.content, fileName);
      this.analysisCache.set(cacheKey, analysis);
      
      // Emit real-time analysis event
      this.emit('code_analyzed', {
        projectId,
        fileName,
        analysis
      });
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing code:', error);
      return this.getEmptyAnalysis();
    }
  }

  /**
   * Generate code from natural language comments
   */
  async generateCodeFromComment(
    comment: string,
    context: string,
    language: string,
    projectInfo: any
  ): Promise<{ code: string; explanation: string }> {
    try {
      const prompt = `
        As an expert ${language} developer, generate production-ready code from this comment:
        
        Comment: ${comment}
        Language: ${language}
        Context: ${context}
        Project: ${projectInfo.name} - ${projectInfo.description}
        
        Generate:
        1. Clean, well-structured ${language} code
        2. Follow project patterns and conventions
        3. Include proper error handling
        4. Add inline documentation
        5. Ensure type safety (if applicable)
        
        Provide both the code and a brief explanation.
      `;

      const response = await waiOrchestrator.processRequest({
        id: `generation-${Date.now()}`,
        type: 'code_generation',
        prompt: prompt,
        metadata: {
          language,
          projectInfo,
          comment
        }
      });

      return this.parseCodeGeneration(response.data || response.content);
    } catch (error) {
      console.error('Error generating code from comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        code: `// Error generating code: ${errorMessage}`,
        explanation: 'Failed to generate code from comment'
      };
    }
  }

  /**
   * Get architecture suggestions for the project
   */
  async getArchitectureSuggestions(
    projectId: string,
    projectStructure: any,
    techStack: string[]
  ): Promise<ArchitectureSuggestion[]> {
    try {
      const prompt = `
        As a software architect, analyze this project structure and provide architecture recommendations:
        
        Project ID: ${projectId}
        Tech Stack: ${techStack.join(', ')}
        
        Current Structure:
        ${JSON.stringify(projectStructure, null, 2)}
        
        Provide architecture suggestions for:
        1. Code organization and structure
        2. Design patterns to implement
        3. Performance optimizations
        4. Scalability improvements
        5. Security enhancements
        6. Testing strategies
        
        Return as JSON array with priority levels.
      `;

      const response = await waiOrchestrator.processRequest({
        id: `architecture-${Date.now()}`,
        type: 'architecture_analysis',
        prompt: prompt,
        projectId,
        metadata: {
          techStack,
          projectStructure
        }
      });

      return this.parseArchitectureSuggestions(response.data || response.content);
    } catch (error) {
      console.error('Error getting architecture suggestions:', error);
      return [];
    }
  }

  /**
   * Detect security vulnerabilities in code
   */
  async detectSecurityVulnerabilities(
    fileName: string,
    content: string,
    language: string
  ): Promise<CodeError[]> {
    try {
      const prompt = `
        As a cybersecurity expert, analyze this ${language} code for security vulnerabilities:
        
        File: ${fileName}
        
        Code:
        \`\`\`${language}
        ${content}
        \`\`\`
        
        Identify:
        1. SQL injection vulnerabilities
        2. XSS vulnerabilities
        3. Authentication/authorization issues
        4. Input validation problems
        5. Insecure dependencies
        6. Data exposure risks
        
        Return detailed security analysis with severity levels and fix suggestions.
      `;

      const response = await waiOrchestrator.processRequest({
        id: `security-${Date.now()}`,
        type: 'security_analysis',
        prompt: prompt,
        metadata: {
          fileName,
          language
        }
      });

      return this.parseSecurityVulnerabilities(response.data || response.content);
    } catch (error) {
      console.error('Error detecting security vulnerabilities:', error);
      return [];
    }
  }

  /**
   * Generate documentation for code
   */
  async generateDocumentation(
    fileName: string,
    content: string,
    language: string,
    documentationType: 'api' | 'inline' | 'readme'
  ): Promise<string> {
    try {
      const prompt = `
        Generate comprehensive ${documentationType} documentation for this ${language} code:
        
        File: ${fileName}
        Language: ${language}
        Documentation Type: ${documentationType}
        
        Code:
        \`\`\`${language}
        ${content}
        \`\`\`
        
        Generate professional documentation that includes:
        1. Clear descriptions of functionality
        2. Parameter documentation
        3. Return value descriptions
        4. Usage examples
        5. Error handling information
        6. Performance considerations
      `;

      const response = await waiOrchestrator.processRequest({
        id: `documentation-${Date.now()}`,
        type: 'documentation_generation',
        prompt: prompt,
        metadata: {
          fileName,
          language,
          documentationType
        }
      });

      return response.data || response.content || '';
    } catch (error) {
      console.error('Error generating documentation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return `// Error generating documentation: ${errorMessage}`;
    }
  }

  private setupRealtimeAnalysis() {
    // Setup periodic cleanup and optimization
    setInterval(() => {
      this.cleanupCaches();
    }, 600000); // 10 minutes
  }

  private parseCompletions(content: string, position: { line: number; column: number }): CodeSuggestion[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed.map((item, index) => ({
        id: `completion-${Date.now()}-${index}`,
        type: 'completion' as const,
        line: position.line,
        column: position.column,
        text: item.text || '',
        description: item.description || '',
        confidence: item.confidence || 0.8,
        provider: 'wai-orchestration'
      })) : [];
    } catch {
      return [];
    }
  }

  private parseAnalysisResult(content: string, fileName: string): CodeAnalysisResult {
    try {
      const parsed = JSON.parse(content);
      return {
        suggestions: parsed.suggestions || [],
        errors: parsed.errors || [],
        warnings: parsed.warnings || [],
        metrics: parsed.metrics || this.getDefaultMetrics(),
        refactoringSuggestions: parsed.refactoringSuggestions || []
      };
    } catch {
      return this.getEmptyAnalysis();
    }
  }

  private parseCodeGeneration(content: string): { code: string; explanation: string } {
    try {
      const parsed = JSON.parse(content);
      return {
        code: parsed.code || content,
        explanation: parsed.explanation || 'Generated code from AI assistant'
      };
    } catch {
      return {
        code: content,
        explanation: 'Generated code from AI assistant'
      };
    }
  }

  private parseArchitectureSuggestions(content: string): ArchitectureSuggestion[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private parseSecurityVulnerabilities(content: string): CodeError[] {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities.map((vuln: any) => ({
        id: `security-${Date.now()}-${Math.random()}`,
        line: vuln.line || 1,
        column: vuln.column || 1,
        message: vuln.message || 'Security vulnerability detected',
        severity: vuln.severity || 'warning',
        fixSuggestions: vuln.fixSuggestions || [],
        quickFix: vuln.quickFix
      })) : [];
    } catch {
      return [];
    }
  }

  private getEmptyAnalysis(): CodeAnalysisResult {
    return {
      suggestions: [],
      errors: [],
      warnings: [],
      metrics: this.getDefaultMetrics(),
      refactoringSuggestions: []
    };
  }

  private getDefaultMetrics(): CodeMetrics {
    return {
      complexity: 0,
      maintainability: 100,
      testCoverage: 0,
      duplicateLines: 0,
      technicalDebt: {
        score: 0,
        issues: []
      }
    };
  }

  private cleanupCaches() {
    // Clear old cache entries to prevent memory leaks
    if (this.analysisCache.size > 100) {
      const keys = Array.from(this.analysisCache.keys());
      for (let i = 0; i < 50; i++) {
        this.analysisCache.delete(keys[i]);
      }
    }
    
    if (this.completionCache.size > 200) {
      const keys = Array.from(this.completionCache.keys());
      for (let i = 0; i < 100; i++) {
        this.completionCache.delete(keys[i]);
      }
    }
  }
}

export const intelligentCodeAssistant = new IntelligentCodeAssistant();
export default intelligentCodeAssistant;