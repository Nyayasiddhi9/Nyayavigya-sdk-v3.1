import { db } from '../db';
import { userOnboardingProgress, users, type InsertUserOnboardingProgress, type UserOnboardingProgress } from '@shared/schema';
import { eq } from 'drizzle-orm';

export class OnboardingService {
  async getOrCreateOnboardingProgress(userId: string): Promise<UserOnboardingProgress> {
    const existing = await db.select()
      .from(userOnboardingProgress)
      .where(eq(userOnboardingProgress.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const newProgress = await db.insert(userOnboardingProgress)
      .values({
        userId,
        currentStep: 1,
        totalSteps: 5,
        stepWelcome: false,
        stepGoalCapture: false,
        stepWorkspaceTour: false,
        stepFirstStudioLaunch: false,
      })
      .returning();

    return newProgress[0];
  }

  async updateStep(userId: string, stepData: {
    stepName: 'stepWelcome' | 'stepGoalCapture' | 'stepWorkspaceTour' | 'stepFirstStudioLaunch';
    founderGoal?: string;
    industryFocus?: string;
    technicalLevel?: string;
  }): Promise<UserOnboardingProgress> {
    const progress = await this.getOrCreateOnboardingProgress(userId);

    // MONOTONIC GUARD: If onboarding is already complete, return existing state without modification
    if (progress.completedAt) {
      return progress;
    }

    const updateData: Partial<InsertUserOnboardingProgress> = {
      [stepData.stepName]: true,
      updatedAt: new Date(),
    };

    // Map step names to their target currentStep values
    let targetStep = progress.currentStep || 1;
    if (stepData.stepName === 'stepWelcome') {
      targetStep = 2;
    } else if (stepData.stepName === 'stepWorkspaceTour') {
      targetStep = 3;
    } else if (stepData.stepName === 'stepGoalCapture') {
      targetStep = 4;
      updateData.founderGoal = stepData.founderGoal;
      updateData.industryFocus = stepData.industryFocus;
      updateData.technicalLevel = stepData.technicalLevel;
    } else if (stepData.stepName === 'stepFirstStudioLaunch') {
      targetStep = 5;
      updateData.completedAt = new Date();
    }

    // MONOTONIC GUARD: Only advance currentStep, never decrease it
    if (targetStep > (progress.currentStep || 0)) {
      updateData.currentStep = targetStep;
    }

    const updated = await db.update(userOnboardingProgress)
      .set(updateData)
      .where(eq(userOnboardingProgress.userId, userId))
      .returning();

    if (stepData.stepName === 'stepFirstStudioLaunch') {
      await db.update(users)
        .set({ onboardingCompleted: true })
        .where(eq(users.id, userId));
    }

    return updated[0];
  }

  async completeOnboarding(userId: string): Promise<UserOnboardingProgress> {
    const updated = await db.update(userOnboardingProgress)
      .set({
        completedAt: new Date(),
        stepWelcome: true,
        stepGoalCapture: true,
        stepWorkspaceTour: true,
        stepFirstStudioLaunch: true,
        currentStep: 5,
        updatedAt: new Date(),
      })
      .where(eq(userOnboardingProgress.userId, userId))
      .returning();

    await db.update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.id, userId));

    return updated[0];
  }

  async getOnboardingStatus(userId: string): Promise<UserOnboardingProgress> {
    return await this.getOrCreateOnboardingProgress(userId);
  }

  async skipOnboarding(userId: string): Promise<void> {
    await db.update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.id, userId));
    
    await db.update(userOnboardingProgress)
      .set({
        completedAt: new Date(),
        currentStep: 5,
        updatedAt: new Date(),
      })
      .where(eq(userOnboardingProgress.userId, userId));
  }
}

export const onboardingService = new OnboardingService();
