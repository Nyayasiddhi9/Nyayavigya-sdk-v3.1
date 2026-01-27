import { db } from '../db';
import { 
  journeyMilestones, 
  journeyProgress, 
  wizardsStartups,
  wizardsFounders,
  type JourneyMilestone,
  type JourneyProgress,
  type InsertJourneyProgress
} from '@shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export class JourneyTrackerService {
  async getMilestones(): Promise<JourneyMilestone[]> {
    return await db.select()
      .from(journeyMilestones)
      .orderBy(journeyMilestones.orderInJourney);
  }

  async getStartupProgress(startupId: number, userId: string): Promise<{
    milestones: JourneyMilestone[];
    progress: JourneyProgress[];
    completionRate: number;
    currentDay: number;
    nextMilestone: JourneyMilestone | null;
  }> {
    const milestones = await this.getMilestones();
    
    const progress = await db.select()
      .from(journeyProgress)
      .where(
        and(
          eq(journeyProgress.startupId, startupId),
          eq(journeyProgress.userId, userId)
        )
      );

    const completedCount = progress.filter(p => p.status === 'completed').length;
    const completionRate = milestones.length > 0 
      ? Math.round((completedCount / milestones.length) * 100) 
      : 0;

    const completedDays = new Set(
      progress
        .filter(p => p.status === 'completed')
        .map(p => {
          const milestone = milestones.find(m => m.id === p.milestoneId);
          return milestone?.dayNumber || 0;
        })
    );
    const currentDay = Math.max(...Array.from(completedDays), 0) + 1;

    const completedMilestoneIds = new Set(
      progress
        .filter(p => p.status === 'completed')
        .map(p => p.milestoneId)
    );

    const nextMilestone = milestones.find(
      m => !completedMilestoneIds.has(m.id) && !m.isOptional
    ) || null;

    return {
      milestones,
      progress,
      completionRate,
      currentDay: Math.min(currentDay, 14),
      nextMilestone,
    };
  }

  async initializeJourneyProgress(startupId: number, userId: string): Promise<void> {
    const milestones = await this.getMilestones();
    
    const existingProgress = await db.select()
      .from(journeyProgress)
      .where(
        and(
          eq(journeyProgress.startupId, startupId),
          eq(journeyProgress.userId, userId)
        )
      );

    const existingMilestoneIds = new Set(existingProgress.map(p => p.milestoneId));

    const newProgressRecords = milestones
      .filter(m => !existingMilestoneIds.has(m.id))
      .map(milestone => ({
        userId,
        startupId,
        milestoneId: milestone.id,
        status: 'pending' as const,
      }));

    if (newProgressRecords.length > 0) {
      // Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
      // The unique constraint (user_id, startup_id, milestone_id) handles this
      try {
        await db.insert(journeyProgress).values(newProgressRecords);
      } catch (error: any) {
        // If constraint violation, ignore (records already exist)
        if (error.code !== '23505') { // PostgreSQL unique violation code
          throw error;
        }
      }
    }
  }

  async updateMilestoneProgress(
    userId: string,
    startupId: number,
    studioId: string,
    status: 'in_progress' | 'completed' | 'blocked',
    data?: {
      qualityScore?: number;
      timeSpent?: number;
      artifacts?: any[];
    }
  ): Promise<JourneyProgress | null> {
    // SECURITY: Verify startup belongs to user before allowing updates
    const startupOwnership = await db.select()
      .from(wizardsStartups)
      .innerJoin(wizardsFounders, eq(wizardsStartups.founderId, wizardsFounders.id))
      .where(
        and(
          eq(wizardsStartups.id, startupId),
          eq(wizardsFounders.userId, userId)
        )
      )
      .limit(1);

    if (startupOwnership.length === 0) {
      throw new Error('Unauthorized: Startup does not belong to user');
    }

    const milestone = await db.select()
      .from(journeyMilestones)
      .where(eq(journeyMilestones.studioId, studioId))
      .limit(1);

    if (milestone.length === 0) return null;

    const existing = await db.select()
      .from(journeyProgress)
      .where(
        and(
          eq(journeyProgress.userId, userId),
          eq(journeyProgress.startupId, startupId),
          eq(journeyProgress.milestoneId, milestone[0].id)
        )
      )
      .limit(1);

    const updateData: Partial<InsertJourneyProgress> = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'in_progress' && !existing[0]?.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.qualityScore = data?.qualityScore;
      updateData.timeSpent = data?.timeSpent;
      updateData.artifactsGenerated = data?.artifacts ? JSON.parse(JSON.stringify(data.artifacts)) : undefined;
    }

    const updated = await db.update(journeyProgress)
      .set(updateData)
      .where(
        and(
          eq(journeyProgress.userId, userId),
          eq(journeyProgress.startupId, startupId),
          eq(journeyProgress.milestoneId, milestone[0].id)
        )
      )
      .returning();

    return updated[0] || null;
  }

  async getJourneyStatistics(startupId: number): Promise<{
    totalDays: number;
    daysCompleted: number;
    studiosCompleted: number;
    totalStudios: number;
    estimatedCompletion: string;
    averageQualityScore: number;
  }> {
    const progress = await db.select()
      .from(journeyProgress)
      .where(eq(journeyProgress.startupId, startupId));

    const milestones = await this.getMilestones();

    const completed = progress.filter(p => p.status === 'completed');
    const completedDays = new Set(
      completed.map(p => {
        const milestone = milestones.find(m => m.id === p.milestoneId);
        return milestone?.dayNumber || 0;
      })
    );

    const qualityScores = completed
      .map(p => p.qualityScore)
      .filter((score): score is number => score !== null && score !== undefined);

    const avgQuality = qualityScores.length > 0
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0;

    const daysRemaining = 14 - completedDays.size;
    const estimatedCompletion = daysRemaining > 0 
      ? `${daysRemaining} days remaining`
      : 'Completed!';

    return {
      totalDays: 14,
      daysCompleted: completedDays.size,
      studiosCompleted: completed.length,
      totalStudios: milestones.length,
      estimatedCompletion,
      averageQualityScore: avgQuality,
    };
  }
}

export const journeyTrackerService = new JourneyTrackerService();
