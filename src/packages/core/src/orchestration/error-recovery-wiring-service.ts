/**
 * Error Recovery & Fallback Wiring Service
 * 
 * Enables robust error handling and automatic recovery:
 * - Retry strategies with exponential backoff
 * - Circuit breaker pattern
 * - Fallback chain configuration
 * - Error categorization and logging
 * 
 * Integration Points:
 * - Pre-orchestration: Configure retry policies
 * - During-orchestration: Handle errors with retries/fallbacks
 * - Post-orchestration: Analyze error patterns
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface CircuitBreakerState {
  status: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailureTime: Date | null;
  nextRetryTime: Date | null;
}

export interface ErrorRecoveryStats {
  totalErrors: number;
  recoveredErrors: number;
  recoveryRate: number;
  errorsByType: Record<string, number>;
  fallbacksUsed: number;
}

/**
 * Error Recovery & Fallback Wiring Service
 */
class ErrorRecoveryWiringService {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private stats: ErrorRecoveryStats = {
    totalErrors: 0,
    recoveredErrors: 0,
    recoveryRate: 0,
    errorsByType: {},
    fallbacksUsed: 0,
  };

  constructor() {
    console.log('🛡️ Error Recovery & Fallback Wiring Service initialized');
    console.log('🎯 Features: Retry strategies, Circuit breaker, Fallback chains, Error analysis');
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    config: Partial<RetryConfig> = {}
  ): Promise<{ success: boolean; result?: T; error?: Error; attempts: number }> {
    const fullConfig: RetryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['TIMEOUT', 'RATE_LIMIT', 'SERVER_ERROR'],
      ...config,
    };

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts <= fullConfig.maxRetries) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(operationId)) {
          throw new Error('Circuit breaker is OPEN');
        }

        const result = await operation();
        this.recordSuccess(operationId);
        
        if (attempts > 0) {
          this.stats.recoveredErrors++;
          this.updateRecoveryRate();
          console.log(`🛡️ [Recovery SUCCESS] ${operationId} recovered after ${attempts} retries`);
        }

        return { success: true, result, attempts };

      } catch (error) {
        attempts++;
        lastError = error as Error;
        this.stats.totalErrors++;
        this.recordFailure(operationId);

        const errorType = this.categorizeError(error as Error);
        this.stats.errorsByType[errorType] = (this.stats.errorsByType[errorType] || 0) + 1;

        // Check if error is retryable
        if (!this.isRetryable(error as Error, fullConfig) || attempts > fullConfig.maxRetries) {
          console.log(`🛡️ [Recovery FAIL] ${operationId} failed after ${attempts} attempts: ${lastError.message}`);
          this.updateRecoveryRate();
          return { success: false, error: lastError, attempts };
        }

        // Calculate backoff delay
        const delay = Math.min(
          fullConfig.initialDelay * Math.pow(fullConfig.backoffMultiplier, attempts - 1),
          fullConfig.maxDelay
        );

        console.log(`🛡️ [Retry] ${operationId} attempt ${attempts}/${fullConfig.maxRetries} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    this.updateRecoveryRate();
    return { success: false, error: lastError!, attempts };
  }

  /**
   * Execute with fallback chain
   */
  async executeWithFallback<T>(
    operations: Array<{ id: string; fn: () => Promise<T> }>,
    operationName: string
  ): Promise<{ success: boolean; result?: T; usedFallback: boolean; fallbackLevel: number }> {
    for (let i = 0; i < operations.length; i++) {
      const { id, fn } = operations[i];
      
      try {
        const result = await fn();
        
        if (i > 0) {
          this.stats.fallbacksUsed++;
          console.log(`🛡️ [Fallback] ${operationName} succeeded using fallback level ${i}`);
        }

        return {
          success: true,
          result,
          usedFallback: i > 0,
          fallbackLevel: i,
        };

      } catch (error) {
        console.log(`🛡️ [Fallback] ${operationName} fallback ${i} failed: ${(error as Error).message}`);
        
        if (i === operations.length - 1) {
          // All fallbacks exhausted
          return {
            success: false,
            usedFallback: true,
            fallbackLevel: i,
          };
        }
      }
    }

    return { success: false, usedFallback: false, fallbackLevel: -1 };
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(operationId: string): boolean {
    const breaker = this.circuitBreakers.get(operationId);
    if (!breaker) return false;

    if (breaker.status === 'open') {
      if (breaker.nextRetryTime && Date.now() >= breaker.nextRetryTime.getTime()) {
        // Transition to half-open
        breaker.status = 'half-open';
        console.log(`🛡️ [Circuit Breaker] ${operationId} transitioned to HALF-OPEN`);
        return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Record successful operation
   */
  private recordSuccess(operationId: string): void {
    let breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      breaker = {
        status: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextRetryTime: null,
      };
      this.circuitBreakers.set(operationId, breaker);
    }

    breaker.successCount++;
    breaker.failureCount = 0;

    // Reset circuit if in half-open state
    if (breaker.status === 'half-open') {
      breaker.status = 'closed';
      console.log(`🛡️ [Circuit Breaker] ${operationId} CLOSED after successful recovery`);
    }
  }

  /**
   * Record failed operation
   */
  private recordFailure(operationId: string): void {
    let breaker = this.circuitBreakers.get(operationId);
    if (!breaker) {
      breaker = {
        status: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailureTime: null,
        nextRetryTime: null,
      };
      this.circuitBreakers.set(operationId, breaker);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = new Date();

    // Open circuit if threshold exceeded
    if (breaker.failureCount >= 5) {
      breaker.status = 'open';
      breaker.nextRetryTime = new Date(Date.now() + 60000); // 1 minute
      console.log(`🛡️ [Circuit Breaker] ${operationId} OPENED due to repeated failures`);
    }
  }

  /**
   * Categorize error type
   */
  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit')) return 'RATE_LIMIT';
    if (message.includes('unauthorized') || message.includes('forbidden')) return 'AUTH_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('server') || message.includes('500')) return 'SERVER_ERROR';
    if (message.includes('network')) return 'NETWORK_ERROR';
    
    return 'UNKNOWN';
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error, config: RetryConfig): boolean {
    const errorType = this.categorizeError(error);
    return config.retryableErrors.includes(errorType);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update recovery rate
   */
  private updateRecoveryRate(): void {
    this.stats.recoveryRate = this.stats.totalErrors > 0
      ? this.stats.recoveredErrors / this.stats.totalErrors
      : 0;
  }

  /**
   * Get error recovery statistics
   */
  getRecoveryStats(): ErrorRecoveryStats {
    return { ...this.stats };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: this.stats.recoveryRate > 0.7 ? 'healthy' as const : 'degraded' as const,
      recoveryRate: this.stats.recoveryRate,
      totalErrors: this.stats.totalErrors,
      recoveredErrors: this.stats.recoveredErrors,
      features: {
        retryStrategies: true,
        circuitBreaker: true,
        fallbackChains: true,
        errorAnalysis: true,
      },
    };
  }
}

// Export singleton instance
export const errorRecoveryWiringService = new ErrorRecoveryWiringService();
