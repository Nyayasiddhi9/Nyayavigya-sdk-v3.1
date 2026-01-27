import { db } from '../db.js';
import { wizardsOrchestrationJobs, wizardsStudioSessions } from '@shared/schema';
import { eq, and, lte, or } from 'drizzle-orm';

// [CLEANUP] wizardsOrchestrationService removed - using stub implementation
const wizardsOrchestrationService = {
  async executeOrchestrationJob(params: any) {
    console.log(`📦 Stub: executeOrchestrationJob called with jobType: ${params.jobType}`);
    return { status: 'success', result: { message: 'Stub execution - module removed during cleanup' } };
  }
};

interface JobWorkerConfig {
  pollIntervalMs: number;
  maxConcurrentJobs: number;
  baseBackoffMs: number;
  enableCleanup: boolean;
  cleanupRetentionDays: number;
}

const DEFAULT_CONFIG: JobWorkerConfig = {
  pollIntervalMs: 5000,
  maxConcurrentJobs: 5,
  baseBackoffMs: 1000,
  enableCleanup: true,
  cleanupRetentionDays: 7,
};

export class OrchestrationJobWorker {
  private config: JobWorkerConfig;
  private isRunning = false;
  private activeJobs = 0;
  private intervalId?: NodeJS.Timeout;
  private cleanupIntervalId?: NodeJS.Timeout;

  constructor(config: Partial<JobWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Job worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Orchestration Job Worker starting...');
    console.log(`   📊 Config: ${this.config.pollIntervalMs}ms poll, ${this.config.maxConcurrentJobs} max concurrent`);

    this.intervalId = setInterval(() => {
      this.pollAndExecuteJobs();
    }, this.config.pollIntervalMs);

    if (this.config.enableCleanup) {
      this.cleanupIntervalId = setInterval(() => {
        this.cleanupOldJobs();
      }, 3600000);
    }

    await this.pollAndExecuteJobs();

    console.log('✅ Orchestration Job Worker started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Orchestration Job Worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }

    while (this.activeJobs > 0) {
      console.log(`⏳ Waiting for ${this.activeJobs} active jobs to complete...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Orchestration Job Worker stopped');
  }

  private async pollAndExecuteJobs(): Promise<void> {
    if (!this.isRunning) return;

    while (this.activeJobs < this.config.maxConcurrentJobs && this.isRunning) {
      const job = await this.claimNextJob();
      
      if (!job) {
        break;
      }

      this.activeJobs++;
      this.executeJob(job).finally(() => {
        this.activeJobs--;
      });
    }
  }

  private async claimNextJob() {
    try {
      const now = new Date();

      const result = await db.transaction(async (tx) => {
        const jobs = await tx.select()
          .from(wizardsOrchestrationJobs)
          .where(
            and(
              eq(wizardsOrchestrationJobs.status, 'queued'),
              lte(wizardsOrchestrationJobs.availableAt, now)
            )
          )
          .orderBy(wizardsOrchestrationJobs.priority, wizardsOrchestrationJobs.createdAt)
          .limit(1)
          .for('update', { skipLocked: true });

        if (jobs.length === 0) {
          return null;
        }

        const job = jobs[0];

        await tx.update(wizardsOrchestrationJobs)
          .set({
            status: 'running',
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(wizardsOrchestrationJobs.id, job.id));

        return { ...job, status: 'running' as const, startedAt: new Date() };
      });

      return result;
    } catch (error) {
      console.error('❌ Error claiming job:', error);
      return null;
    }
  }

  private async executeJob(job: any): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Executing job ${job.id} (${job.jobType})`);

      const isCancelled = await this.checkCancellation(job.id);
      if (isCancelled) {
        console.log(`❌ Job ${job.id} was cancelled before execution`);
        return;
      }

      const result = await wizardsOrchestrationService.executeOrchestrationJob({
        startupId: job.startupId,
        sessionId: job.sessionId,
        taskId: job.taskId,
        jobType: job.jobType,
        workflow: job.workflow,
        agents: job.agents || [],
        inputs: job.inputs,
        priority: job.priority,
      });

      const duration = Date.now() - startTime;

      // Re-check cancellation after execution (user may have cancelled during run)
      const wasCancelledDuringExecution = await this.checkCancellation(job.id);
      if (wasCancelledDuringExecution) {
        console.log(`❌ Job ${job.id} was cancelled during execution`);
        return;
      }

      if (result.status === 'success') {
        const completed = await this.completeJob(job, result, duration);
        if (completed) {
          console.log(`✅ Job ${job.id} completed successfully in ${duration}ms`);
        }
      } else {
        const failed = await this.handleJobFailure(job, result.errorMessage || 'Unknown error', duration);
        if (failed) {
          // handleJobFailure logs retry/failure internally
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Job ${job.id} execution error:`, errorMessage);
      
      // Re-check cancellation before handling failure (user may have cancelled)
      const wasCancelledDuringError = await this.checkCancellation(job.id);
      if (wasCancelledDuringError) {
        console.log(`❌ Job ${job.id} was cancelled during error handling`);
        return;
      }
      
      const failed = await this.handleJobFailure(job, errorMessage, duration);
      if (failed) {
        // handleJobFailure logs retry/failure internally
      }
    }
  }

  private async checkCancellation(jobId: number): Promise<boolean> {
    const [job] = await db.select()
      .from(wizardsOrchestrationJobs)
      .where(eq(wizardsOrchestrationJobs.id, jobId))
      .limit(1);

    if (job && job.status === 'cancelled') {
      await db.update(wizardsOrchestrationJobs)
        .set({
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(wizardsOrchestrationJobs.id, jobId));
      
      return true;
    }

    return false;
  }

  private async completeJob(job: any, result: any, duration: number): Promise<boolean> {
    // Conditional update: only if status is still 'running' (not cancelled)
    const updateResult = await db.update(wizardsOrchestrationJobs)
      .set({
        status: 'completed',
        outputs: result.outputs || {},
        progress: 100,
        creditsUsed: result.creditsUsed || 0,
        tokensUsed: result.tokensUsed || 0,
        cost: result.cost?.toString() || '0',
        completedAt: new Date(),
        duration,
        updatedAt: new Date(),
      })
      .where(and(
        eq(wizardsOrchestrationJobs.id, job.id),
        eq(wizardsOrchestrationJobs.status, 'running')
      ))
      .returning();

    // If update affected 0 rows, job was cancelled mid-flight
    if (updateResult.length === 0) {
      const [actualJob] = await db.select()
        .from(wizardsOrchestrationJobs)
        .where(eq(wizardsOrchestrationJobs.id, job.id))
        .limit(1);
      
      console.log(`⚠️ Job ${job.id} completion skipped - actual status: ${actualJob?.status || 'unknown'}`);
      console.log(`📊 Telemetry: completion_update_skipped`, { jobId: job.id, actualStatus: actualJob?.status });
      return false;
    }

    // Note: Session progress is managed by application logic, not individual job completion
    // Sessions may have multiple jobs/steps, so don't mark session as complete here
    return true;
  }

  private async handleJobFailure(job: any, errorMessage: string, duration: number): Promise<boolean> {
    const retryCount = (job.retryCount || 0) + 1;
    const maxRetries = job.maxRetries || 3;

    if (retryCount < maxRetries) {
      const backoffMs = this.config.baseBackoffMs * Math.pow(job.backoffMultiplier || 2, retryCount);
      const availableAt = new Date(Date.now() + backoffMs);

      // Conditional update: only if status is still 'running' (not cancelled)
      const updateResult = await db.update(wizardsOrchestrationJobs)
        .set({
          status: 'queued',
          retryCount,
          availableAt,
          errorMessage,
          duration,
          updatedAt: new Date(),
        })
        .where(and(
          eq(wizardsOrchestrationJobs.id, job.id),
          eq(wizardsOrchestrationJobs.status, 'running')
        ))
        .returning();

      // If update affected 0 rows, job was cancelled mid-flight
      if (updateResult.length === 0) {
        const [actualJob] = await db.select()
          .from(wizardsOrchestrationJobs)
          .where(eq(wizardsOrchestrationJobs.id, job.id))
          .limit(1);
        
        console.log(`⚠️ Job ${job.id} retry scheduling skipped - actual status: ${actualJob?.status || 'unknown'}`);
        console.log(`📊 Telemetry: retry_update_skipped`, { jobId: job.id, actualStatus: actualJob?.status });
        return false;
      }

      console.log(`🔄 Job ${job.id} retry ${retryCount}/${maxRetries} scheduled for ${availableAt.toISOString()}`);
      return true;
    } else {
      // Conditional update: only if status is still 'running' (not cancelled)
      const updateResult = await db.update(wizardsOrchestrationJobs)
        .set({
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
          duration,
          updatedAt: new Date(),
        })
        .where(and(
          eq(wizardsOrchestrationJobs.id, job.id),
          eq(wizardsOrchestrationJobs.status, 'running')
        ))
        .returning();

      // If update affected 0 rows, job was cancelled mid-flight
      if (updateResult.length === 0) {
        const [actualJob] = await db.select()
          .from(wizardsOrchestrationJobs)
          .where(eq(wizardsOrchestrationJobs.id, job.id))
          .limit(1);
        
        console.log(`⚠️ Job ${job.id} failure marking skipped - actual status: ${actualJob?.status || 'unknown'}`);
        console.log(`📊 Telemetry: failure_update_skipped`, { jobId: job.id, actualStatus: actualJob?.status });
        return false;
      }

      console.log(`❌ Job ${job.id} failed permanently after ${maxRetries} retries`);

      // Note: Session status is managed by application logic
      // Don't automatically fail the entire session on individual job failure
      return true;
    }
  }

  private async cleanupOldJobs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupRetentionDays);

      const result = await db.delete(wizardsOrchestrationJobs)
        .where(
          and(
            or(
              eq(wizardsOrchestrationJobs.status, 'completed'),
              eq(wizardsOrchestrationJobs.status, 'failed'),
              eq(wizardsOrchestrationJobs.status, 'cancelled')
            ),
            lte(wizardsOrchestrationJobs.completedAt, cutoffDate)
          )
        );

      console.log(`🧹 Cleaned up old jobs (retention: ${this.config.cleanupRetentionDays} days)`);
    } catch (error) {
      console.error('❌ Error cleaning up old jobs:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
      config: this.config,
    };
  }
}

export const orchestrationJobWorker = new OrchestrationJobWorker({
  pollIntervalMs: 5000,
  maxConcurrentJobs: 3,
  baseBackoffMs: 1000,
  enableCleanup: true,
  cleanupRetentionDays: 7,
});
