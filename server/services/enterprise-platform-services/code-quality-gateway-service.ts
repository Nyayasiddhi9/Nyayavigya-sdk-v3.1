/**
 * Code Quality Gateway Service
 * 
 * P1 Priority - Enterprise Code Quality & Security
 * 
 * Features:
 * - Heuristic-based static code analysis (pattern matching)
 * - Security vulnerability scanning (8 common vulnerability patterns)
 * - Code complexity metrics (cyclomatic, maintainability, nesting)
 * - Best practices validation via pattern detection
 * - AI-powered code review suggestions (OpenAI GPT-4o)
 * - Multi-language support (13 languages)
 * - Quality scoring and grading (A-F scale)
 * 
 * Note: This service uses heuristic pattern matching for static analysis,
 * not AST-based tools like ESLint. For production use, consider integrating
 * language-specific linters as additional validation layers.
 */

import { EventEmitter } from 'events';
import OpenAI from 'openai';

export interface CodeAnalysisJob {
  id: string;
  code: string;
  language: string;
  fileName?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  result?: CodeAnalysisResult;
  createdAt: Date;
  completedAt?: Date;
  userId?: string;
}

export interface CodeAnalysisResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: CodeIssue[];
  securityIssues: SecurityIssue[];
  metrics: CodeMetrics;
  suggestions: CodeSuggestion[];
  summary: string;
}

export interface CodeIssue {
  id: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  category: 'style' | 'logic' | 'performance' | 'maintainability';
  fixable: boolean;
  suggestion?: string;
}

export interface SecurityIssue {
  id: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  cwe?: string;
  recommendation: string;
}

export interface CodeMetrics {
  linesOfCode: number;
  logicalLines: number;
  commentLines: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  duplicateBlocks: number;
  functionCount: number;
  classCount: number;
  averageFunctionLength: number;
  maxNestingDepth: number;
}

export interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  category: 'refactoring' | 'performance' | 'security' | 'readability' | 'testing';
  priority: 'high' | 'medium' | 'low';
  effort: 'small' | 'medium' | 'large';
  codeSnippet?: string;
}

export interface LintConfig {
  language: string;
  rules?: Record<string, 'off' | 'warn' | 'error'>;
  ignorePatterns?: string[];
  maxWarnings?: number;
}

class CodeQualityGatewayService extends EventEmitter {
  private jobs: Map<string, CodeAnalysisJob> = new Map();
  private stats = {
    analysesCompleted: 0,
    issuesFound: 0,
    securityIssuesFound: 0,
    suggestionsGenerated: 0,
    apiCalls: 0
  };

  private readonly SUPPORTED_LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'c', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin'
  ];

  private readonly SECURITY_PATTERNS = {
    sqlInjection: /(\bexec\s*\(|execute\s*\(|query\s*\(.*\+.*\)|\.raw\s*\()/gi,
    xss: /innerHTML\s*=|document\.write\s*\(|dangerouslySetInnerHTML/gi,
    hardcodedSecrets: /(api[_-]?key|password|secret|token|credential)\s*[:=]\s*['"][^'"]+['"]/gi,
    unsafeEval: /\beval\s*\(|new\s+Function\s*\(/gi,
    pathTraversal: /\.\.\/|\.\.\\|\.\./g,
    commandInjection: /child_process|exec\s*\(|spawn\s*\(|execSync/gi,
    insecureRandom: /Math\.random\s*\(\)/gi,
    debugCode: /console\.log\s*\(|debugger\b|print\s*\(/gi
  };

  constructor() {
    super();
    console.log('🔍 Code Quality Gateway initialized');
    console.log('   ✅ Heuristic static code analysis');
    console.log('   ✅ Security vulnerability scanning (8 patterns)');
    console.log('   ✅ AI-powered code review (GPT-4o)');
    console.log('   ✅ Multi-language support (13 languages)');
  }

  /**
   * Analyze code quality
   */
  async analyzeCode(input: {
    code: string;
    language: string;
    fileName?: string;
    userId?: string;
  }): Promise<CodeAnalysisResult> {
    const job: CodeAnalysisJob = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code: input.code,
      language: input.language.toLowerCase(),
      fileName: input.fileName,
      status: 'pending',
      createdAt: new Date(),
      userId: input.userId
    };

    this.jobs.set(job.id, job);
    job.status = 'analyzing';
    this.emit('analysis:started', job);

    try {
      // Run static analysis
      const issues = this.runStaticAnalysis(input.code, input.language);
      
      // Run security scan
      const securityIssues = this.runSecurityScan(input.code);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(input.code);
      
      // Get AI suggestions if API key available
      const suggestions = await this.getAISuggestions(input.code, input.language, issues);
      
      // Calculate score and grade
      const score = this.calculateScore(issues, securityIssues, metrics);
      const grade = this.calculateGrade(score);

      const result: CodeAnalysisResult = {
        score,
        grade,
        issues,
        securityIssues,
        metrics,
        suggestions,
        summary: this.generateSummary(score, grade, issues, securityIssues)
      };

      job.result = result;
      job.status = 'completed';
      job.completedAt = new Date();

      this.stats.analysesCompleted++;
      this.stats.issuesFound += issues.length;
      this.stats.securityIssuesFound += securityIssues.length;
      this.stats.suggestionsGenerated += suggestions.length;

      this.emit('analysis:completed', job);
      return result;

    } catch (error) {
      job.status = 'failed';
      this.emit('analysis:failed', { job, error });
      throw error;
    }
  }

  /**
   * Run static code analysis
   */
  private runStaticAnalysis(code: string, language: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineNum) => {
      const lineNumber = lineNum + 1;

      // Check for long lines
      if (line.length > 120) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'warning',
          rule: 'max-len',
          message: `Line exceeds 120 characters (${line.length})`,
          category: 'style',
          fixable: true,
          suggestion: 'Break this line into multiple lines for better readability'
        });
      }

      // Check for TODO/FIXME comments
      if (/\b(TODO|FIXME|HACK|XXX)\b/i.test(line)) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'info',
          rule: 'no-warning-comments',
          message: 'Found TODO/FIXME comment',
          category: 'maintainability',
          fixable: false
        });
      }

      // Check for console statements (JS/TS)
      if (['javascript', 'typescript'].includes(language) && /console\.(log|warn|error|debug)\s*\(/.test(line)) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'warning',
          rule: 'no-console',
          message: 'Unexpected console statement',
          category: 'maintainability',
          fixable: true,
          suggestion: 'Remove console statement or use a proper logging library'
        });
      }

      // Check for unused variables pattern
      if (/^\s*(const|let|var)\s+_/.test(line)) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'warning',
          rule: 'no-unused-vars',
          message: 'Variable starting with underscore suggests unused',
          category: 'maintainability',
          fixable: false
        });
      }

      // Check for magic numbers
      if (/[^0-9a-zA-Z_]([2-9]|[1-9][0-9]+)\s*[;,\)\]]/.test(line) && !/const|let|var|enum/.test(line)) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'info',
          rule: 'no-magic-numbers',
          message: 'Avoid magic numbers, use named constants',
          category: 'maintainability',
          fixable: true,
          suggestion: 'Extract this number into a named constant'
        });
      }

      // Check for deep nesting
      const indentLevel = (line.match(/^\s*/) || [''])[0].length;
      if (indentLevel >= 16) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'warning',
          rule: 'max-depth',
          message: 'Deep nesting detected, consider refactoring',
          category: 'maintainability',
          fixable: false,
          suggestion: 'Extract deeply nested code into separate functions'
        });
      }

      // Check for empty catch blocks
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) {
        issues.push({
          id: `issue_${issues.length + 1}`,
          line: lineNumber,
          severity: 'error',
          rule: 'no-empty-catch',
          message: 'Empty catch block detected',
          category: 'logic',
          fixable: false,
          suggestion: 'Handle errors appropriately or add a comment explaining why it is empty'
        });
      }
    });

    return issues;
  }

  /**
   * Run security vulnerability scan
   */
  private runSecurityScan(code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    for (const [type, pattern] of Object.entries(this.SECURITY_PATTERNS)) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(code)) !== null) {
        const lineNum = code.substring(0, match.index).split('\n').length;
        
        const severity = this.getSecuritySeverity(type);
        const description = this.getSecurityDescription(type);
        const cwe = this.getSecurityCWE(type);
        const recommendation = this.getSecurityRecommendation(type);

        issues.push({
          id: `sec_${issues.length + 1}`,
          line: lineNum,
          severity,
          type,
          description,
          cwe,
          recommendation
        });
      }
    }

    return issues;
  }

  private getSecuritySeverity(type: string): 'critical' | 'high' | 'medium' | 'low' {
    const severityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      sqlInjection: 'critical',
      xss: 'critical',
      hardcodedSecrets: 'critical',
      commandInjection: 'critical',
      unsafeEval: 'high',
      pathTraversal: 'high',
      insecureRandom: 'medium',
      debugCode: 'low'
    };
    return severityMap[type] || 'medium';
  }

  private getSecurityDescription(type: string): string {
    const descriptions: Record<string, string> = {
      sqlInjection: 'Potential SQL injection vulnerability detected',
      xss: 'Potential Cross-Site Scripting (XSS) vulnerability detected',
      hardcodedSecrets: 'Hardcoded secrets or credentials found in code',
      commandInjection: 'Potential command injection vulnerability detected',
      unsafeEval: 'Use of eval() or dynamic code execution detected',
      pathTraversal: 'Potential path traversal vulnerability detected',
      insecureRandom: 'Use of insecure random number generator detected',
      debugCode: 'Debug code detected that should be removed in production'
    };
    return descriptions[type] || 'Security issue detected';
  }

  private getSecurityCWE(type: string): string {
    const cweMap: Record<string, string> = {
      sqlInjection: 'CWE-89',
      xss: 'CWE-79',
      hardcodedSecrets: 'CWE-798',
      commandInjection: 'CWE-78',
      unsafeEval: 'CWE-95',
      pathTraversal: 'CWE-22',
      insecureRandom: 'CWE-330',
      debugCode: 'CWE-489'
    };
    return cweMap[type] || '';
  }

  private getSecurityRecommendation(type: string): string {
    const recommendations: Record<string, string> = {
      sqlInjection: 'Use parameterized queries or prepared statements',
      xss: 'Sanitize user input and use safe DOM manipulation methods',
      hardcodedSecrets: 'Use environment variables or secure secret management',
      commandInjection: 'Validate and sanitize all user input, avoid shell commands',
      unsafeEval: 'Avoid eval() and dynamic code execution, use safer alternatives',
      pathTraversal: 'Validate and sanitize file paths, use path normalization',
      insecureRandom: 'Use crypto.randomBytes() or similar secure alternatives',
      debugCode: 'Remove debug code before deploying to production'
    };
    return recommendations[type] || 'Review and fix this security issue';
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(code: string): CodeMetrics {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    const commentLines = lines.filter(l => /^\s*(\/\/|\/\*|\*|#|--|\"\"\"|''')/.test(l));
    
    // Count functions/methods
    const functionMatches = code.match(/\b(function|def|func|fn|async\s+function|=>\s*\{|:\s*function)\b/g);
    const functionCount = functionMatches ? functionMatches.length : 0;
    
    // Count classes
    const classMatches = code.match(/\b(class|interface|struct|enum)\s+\w+/g);
    const classCount = classMatches ? classMatches.length : 0;
    
    // Estimate cyclomatic complexity
    const branchingKeywords = code.match(/\b(if|else|elif|switch|case|while|for|foreach|catch|&&|\|\||\?:)\b/g);
    const cyclomaticComplexity = (branchingKeywords ? branchingKeywords.length : 0) + 1;
    
    // Calculate max nesting depth
    let maxNesting = 0;
    let currentNesting = 0;
    for (const char of code) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }

    // Estimate duplicate blocks (simple heuristic)
    const codeBlocks = code.split(/\n\n+/);
    const duplicates = codeBlocks.length - new Set(codeBlocks.map(b => b.trim())).size;

    // Calculate maintainability index (simplified)
    const halsteadVolume = Math.log2(new Set(code.match(/\w+/g) || []).size) * (code.match(/\w+/g) || []).length;
    const maintainabilityIndex = Math.max(0, Math.min(100, 
      171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(nonEmptyLines.length)
    ));

    return {
      linesOfCode: lines.length,
      logicalLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      cyclomaticComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      duplicateBlocks: duplicates,
      functionCount,
      classCount,
      averageFunctionLength: functionCount > 0 ? Math.round(nonEmptyLines.length / functionCount) : 0,
      maxNestingDepth: maxNesting
    };
  }

  /**
   * Get AI-powered suggestions
   */
  private async getAISuggestions(
    code: string, 
    language: string, 
    issues: CodeIssue[]
  ): Promise<CodeSuggestion[]> {
    this.stats.apiCalls++;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (!process.env.OPENAI_API_KEY) {
      return this.getDefaultSuggestions(issues);
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'You are a senior code reviewer. Analyze the code and provide improvement suggestions. Return a JSON array of suggestions with fields: title, description, category (refactoring|performance|security|readability|testing), priority (high|medium|low), effort (small|medium|large).'
        }, {
          role: 'user',
          content: `Language: ${language}\n\nCode:\n${code.substring(0, 3000)}\n\nProvide 3-5 specific improvement suggestions.`
        }],
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{"suggestions":[]}';
      const parsed = JSON.parse(content);
      const suggestions = (parsed.suggestions || parsed || []) as CodeSuggestion[];

      return suggestions.slice(0, 5).map((s, i) => ({
        id: `suggestion_${i + 1}`,
        title: s.title || 'Improvement suggestion',
        description: s.description || '',
        category: s.category || 'readability',
        priority: s.priority || 'medium',
        effort: s.effort || 'medium'
      }));

    } catch (error) {
      console.error('AI suggestions failed:', error);
      return this.getDefaultSuggestions(issues);
    }
  }

  private getDefaultSuggestions(issues: CodeIssue[]): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    if (issues.some(i => i.category === 'maintainability')) {
      suggestions.push({
        id: 'suggestion_1',
        title: 'Improve Code Maintainability',
        description: 'Address maintainability issues to make the code easier to understand and modify',
        category: 'readability',
        priority: 'medium',
        effort: 'medium'
      });
    }

    if (issues.some(i => i.rule === 'max-depth')) {
      suggestions.push({
        id: 'suggestion_2',
        title: 'Reduce Nesting Depth',
        description: 'Extract deeply nested code into separate functions to improve readability',
        category: 'refactoring',
        priority: 'high',
        effort: 'medium'
      });
    }

    suggestions.push({
      id: 'suggestion_3',
      title: 'Add Unit Tests',
      description: 'Ensure code quality by adding unit tests for critical functions',
      category: 'testing',
      priority: 'high',
      effort: 'medium'
    });

    return suggestions;
  }

  /**
   * Calculate overall quality score
   */
  private calculateScore(
    issues: CodeIssue[], 
    securityIssues: SecurityIssue[], 
    metrics: CodeMetrics
  ): number {
    let score = 100;

    // Deduct for issues
    issues.forEach(issue => {
      if (issue.severity === 'error') score -= 5;
      else if (issue.severity === 'warning') score -= 2;
      else score -= 0.5;
    });

    // Deduct heavily for security issues
    securityIssues.forEach(issue => {
      if (issue.severity === 'critical') score -= 15;
      else if (issue.severity === 'high') score -= 10;
      else if (issue.severity === 'medium') score -= 5;
      else score -= 2;
    });

    // Adjust for maintainability
    if (metrics.maintainabilityIndex < 50) score -= 10;
    else if (metrics.maintainabilityIndex < 65) score -= 5;

    // Adjust for complexity
    if (metrics.cyclomaticComplexity > 50) score -= 10;
    else if (metrics.cyclomaticComplexity > 30) score -= 5;

    // Adjust for nesting depth
    if (metrics.maxNestingDepth > 6) score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(
    score: number, 
    grade: string, 
    issues: CodeIssue[], 
    securityIssues: SecurityIssue[]
  ): string {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const criticalSecurity = securityIssues.filter(s => s.severity === 'critical').length;

    let summary = `Code quality score: ${score}/100 (Grade: ${grade}). `;
    
    if (criticalSecurity > 0) {
      summary += `⚠️ CRITICAL: ${criticalSecurity} critical security issue(s) found. `;
    }
    
    summary += `Found ${issues.length} code issue(s) (${errorCount} errors, ${warningCount} warnings) `;
    summary += `and ${securityIssues.length} security issue(s). `;

    if (score >= 90) {
      summary += 'Excellent code quality!';
    } else if (score >= 80) {
      summary += 'Good code quality with minor improvements needed.';
    } else if (score >= 70) {
      summary += 'Acceptable code quality, but improvements recommended.';
    } else {
      summary += 'Code quality needs improvement. Review suggestions.';
    }

    return summary;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): CodeAnalysisJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Get service statistics
   */
  getStats(): {
    analysesCompleted: number;
    issuesFound: number;
    securityIssuesFound: number;
    suggestionsGenerated: number;
    apiCalls: number;
    supportedLanguages: number;
  } {
    return {
      ...this.stats,
      supportedLanguages: this.SUPPORTED_LANGUAGES.length
    };
  }
}

export const codeQualityGatewayService = new CodeQualityGatewayService();
