/**
 * Job Queue Interface
 * Provides abstraction for async job scheduling and execution
 * Used for workflow orchestration, scheduled tasks, background processing
 */

export interface Job<T = unknown> {
  /** Unique job identifier */
  id: string;
  /** Job type/name */
  type: string;
  /** Job payload data */
  data: T;
  /** Priority (higher = more important) */
  priority?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoff?: 'exponential' | 'linear' | 'fixed';
    delay?: number;
  };
  /** Schedule (cron expression or delay in ms) */
  schedule?: string | number;
  /** Timeout in ms */
  timeout?: number;
  /** Tags for categorization */
  tags?: string[];
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface JobResult<T = unknown> {
  /** Job ID */
  jobId: string;
  /** Execution status */
  status: 'completed' | 'failed' | 'cancelled';
  /** Result data (if completed) */
  result?: T;
  /** Error (if failed) */
  error?: Error;
  /** Execution time in ms */
  executionTime?: number;
  /** Attempt number */
  attempt?: number;
}

export interface JobStatus {
  /** Job ID */
  id: string;
  /** Current status */
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'scheduled';
  /** Progress (0-100) */
  progress?: number;
  /** Current attempt */
  attempt?: number;
  /** Max attempts */
  maxAttempts?: number;
  /** Created timestamp */
  createdAt: Date;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Error message */
  error?: string;
  /** Result preview */
  result?: unknown;
}

export type JobHandler<T = unknown, R = unknown> = (
  job: Job<T>
) => Promise<R> | R;

export interface IJobQueue {
  /**
   * Enqueue a new job
   * @param job - Job configuration
   * @returns Job ID
   */
  enqueue<T = unknown>(job: Omit<Job<T>, 'id'>): Promise<string>;

  /**
   * Dequeue and execute the next job
   * @returns Job result or null if queue is empty
   */
  dequeue<T = unknown>(): Promise<JobResult<T> | null>;

  /**
   * Get job status
   * @param jobId - Job ID
   * @returns Job status or null if not found
   */
  getStatus(jobId: string): Promise<JobStatus | null>;

  /**
   * Cancel a pending/running job
   * @param jobId - Job ID
   * @returns True if cancelled
   */
  cancel(jobId: string): Promise<boolean>;

  /**
   * Register a job handler
   * @param type - Job type
   * @param handler - Handler function
   */
  registerHandler<T = unknown, R = unknown>(
    type: string,
    handler: JobHandler<T, R>
  ): void;

  /**
   * Process jobs continuously
   * @param concurrency - Number of concurrent jobs
   */
  startProcessing(concurrency?: number): Promise<void>;

  /**
   * Stop processing jobs
   */
  stopProcessing(): Promise<void>;

  /**
   * Get queue statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Clear completed/failed jobs
   * @param olderThan - Clear jobs older than timestamp
   */
  clearJobs(olderThan?: Date): Promise<number>;
}

export interface QueueStats {
  /** Total pending jobs */
  pending: number;
  /** Total running jobs */
  running: number;
  /** Total completed jobs */
  completed: number;
  /** Total failed jobs */
  failed: number;
  /** Total cancelled jobs */
  cancelled: number;
  /** Average execution time (ms) */
  avgExecutionTime?: number;
  /** Success rate (0-1) */
  successRate?: number;
}

/**
 * In-Memory Job Queue (for development/testing)
 */
export class MemoryJobQueue implements IJobQueue {
  private jobs = new Map<string, Job & { status: JobStatus }>();
  private handlers = new Map<string, JobHandler>();
  private processing = false;
  private concurrency = 1;

  async enqueue<T = unknown>(job: Omit<Job<T>, 'id'>): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullJob: Job<T> & { status: JobStatus } = {
      id,
      ...job,
      status: {
        id,
        status: 'pending',
        createdAt: new Date(),
        attempt: 0,
        maxAttempts: job.retry?.maxAttempts || 1,
      },
    };
    
    this.jobs.set(id, fullJob as Job & { status: JobStatus });
    return id;
  }

  async dequeue<T = unknown>(): Promise<JobResult<T> | null> {
    const pendingJob = Array.from(this.jobs.values()).find(
      j => j.status.status === 'pending'
    );
    
    if (!pendingJob) return null;

    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${pendingJob.type}`);
    }

    pendingJob.status.status = 'running';
    pendingJob.status.startedAt = new Date();
    pendingJob.status.attempt = (pendingJob.status.attempt || 0) + 1;

    const startTime = Date.now();

    try {
      const result = await handler(pendingJob);
      
      pendingJob.status.status = 'completed';
      pendingJob.status.completedAt = new Date();
      pendingJob.status.result = result;

      return {
        jobId: pendingJob.id,
        status: 'completed',
        result: result as T,
        executionTime: Date.now() - startTime,
        attempt: pendingJob.status.attempt,
      };
    } catch (error) {
      const shouldRetry = pendingJob.status.attempt! < (pendingJob.status.maxAttempts || 1);
      
      if (shouldRetry) {
        pendingJob.status.status = 'pending';
      } else {
        pendingJob.status.status = 'failed';
        pendingJob.status.completedAt = new Date();
        pendingJob.status.error = error instanceof Error ? error.message : String(error);
      }

      return {
        jobId: pendingJob.id,
        status: 'failed',
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime,
        attempt: pendingJob.status.attempt,
      };
    }
  }

  async getStatus(jobId: string): Promise<JobStatus | null> {
    const job = this.jobs.get(jobId);
    return job?.status || null;
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status.status === 'completed') return false;

    job.status.status = 'cancelled';
    job.status.completedAt = new Date();
    return true;
  }

  registerHandler<T = unknown, R = unknown>(
    type: string,
    handler: JobHandler<T, R>
  ): void {
    this.handlers.set(type, handler as JobHandler);
  }

  async startProcessing(concurrency = 1): Promise<void> {
    this.processing = true;
    this.concurrency = concurrency;

    const processLoop = async () => {
      while (this.processing) {
        const result = await this.dequeue();
        if (!result) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => processLoop());
    await Promise.all(workers);
  }

  async stopProcessing(): Promise<void> {
    this.processing = false;
  }

  async getStats(): Promise<QueueStats> {
    const jobs = Array.from(this.jobs.values());
    
    return {
      pending: jobs.filter(j => j.status.status === 'pending').length,
      running: jobs.filter(j => j.status.status === 'running').length,
      completed: jobs.filter(j => j.status.status === 'completed').length,
      failed: jobs.filter(j => j.status.status === 'failed').length,
      cancelled: jobs.filter(j => j.status.status === 'cancelled').length,
    };
  }

  async clearJobs(olderThan?: Date): Promise<number> {
    let cleared = 0;
    
    for (const [id, job] of this.jobs) {
      const isDone = ['completed', 'failed', 'cancelled'].includes(job.status.status);
      const isOld = !olderThan || (job.status.completedAt && job.status.completedAt < olderThan);
      
      if (isDone && isOld) {
        this.jobs.delete(id);
        cleared++;
      }
    }
    
    return cleared;
  }
}
