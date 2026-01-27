import { db } from '../db';
import { 
  analyticsEvents,
  type AnalyticsEvent,
  type InsertAnalyticsEvent
} from '@shared/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

export type EventType =
  | 'user_signup'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'studio_launched'
  | 'artifact_generated'
  | 'milestone_completed'
  | 'credit_purchased'
  | 'journey_completed'
  | 'error_encountered'
  | 'session_started'
  | 'session_ended';

export interface AnalyticsMetrics {
  totalUsers: number;
  signupsToday: number;
  onboardingCompletionRate: number;
  avgTimeToFirstStudio: number;
  totalStudioLaunches: number;
  totalArtifacts: number;
  activeUsers24h: number;
  conversionFunnel: {
    signups: number;
    onboardingStarted: number;
    onboardingCompleted: number;
    firstStudioLaunched: number;
    firstArtifactGenerated: number;
  };
}

export class AnalyticsService {
  async trackEvent(
    userId: string,
    eventType: EventType,
    properties?: Record<string, any>,
    startupId?: number
  ): Promise<AnalyticsEvent> {
    const event = await db.insert(analyticsEvents)
      .values({
        userId,
        eventType,
        properties: properties ? JSON.parse(JSON.stringify(properties)) : null,
        startupId: startupId || null,
      })
      .returning();

    return event[0];
  }

  async getUserEvents(
    userId: string,
    eventType?: EventType,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsEvent[]> {
    const conditions: any[] = [eq(analyticsEvents.userId, userId)];

    if (eventType) {
      conditions.push(eq(analyticsEvents.eventType, eventType));
    }

    if (startDate) {
      conditions.push(gte(analyticsEvents.timestamp, startDate));
    }

    if (endDate) {
      conditions.push(lte(analyticsEvents.timestamp, endDate));
    }

    // Use single condition directly or combine multiple with `and`
    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    return await db.select()
      .from(analyticsEvents)
      .where(whereClause)
      .orderBy(desc(analyticsEvents.timestamp));
  }

  async getMetrics(startDate?: Date, endDate?: Date): Promise<AnalyticsMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Total users (unique user IDs with any event)
    const totalUsersResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM ${analyticsEvents}
    `);
    const totalUsers = parseInt((totalUsersResult.rows[0] as any).count || '0');

    // Signups today
    const signupsTodayResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM ${analyticsEvents}
      WHERE event_type = 'user_signup'
      AND timestamp >= ${today}
    `);
    const signupsToday = parseInt((signupsTodayResult.rows[0] as any).count || '0');

    // Active users in last 24 hours
    const activeUsers24hResult = await db.execute(sql`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM ${analyticsEvents}
      WHERE timestamp >= ${yesterday}
    `);
    const activeUsers24h = parseInt((activeUsers24hResult.rows[0] as any).count || '0');

    // Conversion funnel with proper WHERE clause building
    const whereClauses: any[] = [];
    if (startDate) whereClauses.push(sql`timestamp >= ${startDate}`);
    if (endDate) whereClauses.push(sql`timestamp <= ${endDate}`);
    
    const whereClause = whereClauses.length > 0 
      ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
      : sql``;

    const funnelQuery = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT CASE WHEN event_type = 'user_signup' THEN user_id END) as signups,
        COUNT(DISTINCT CASE WHEN event_type = 'onboarding_started' THEN user_id END) as onboarding_started,
        COUNT(DISTINCT CASE WHEN event_type = 'onboarding_completed' THEN user_id END) as onboarding_completed,
        COUNT(DISTINCT CASE WHEN event_type = 'studio_launched' THEN user_id END) as first_studio_launched,
        COUNT(DISTINCT CASE WHEN event_type = 'artifact_generated' THEN user_id END) as first_artifact_generated
      FROM ${analyticsEvents}
      ${whereClause}
    `);
    
    const funnel = funnelQuery.rows[0] as any;
    const conversionFunnel = {
      signups: parseInt(funnel.signups || '0'),
      onboardingStarted: parseInt(funnel.onboarding_started || '0'),
      onboardingCompleted: parseInt(funnel.onboarding_completed || '0'),
      firstStudioLaunched: parseInt(funnel.first_studio_launched || '0'),
      firstArtifactGenerated: parseInt(funnel.first_artifact_generated || '0'),
    };

    // Onboarding completion rate
    const onboardingCompletionRate = conversionFunnel.onboardingStarted > 0
      ? Math.round((conversionFunnel.onboardingCompleted / conversionFunnel.onboardingStarted) * 100)
      : 0;

    // Average time to first studio (in hours)
    const avgTimeQuery = await db.execute(sql`
      SELECT AVG(
        EXTRACT(EPOCH FROM (
          studio.timestamp - signup.timestamp
        )) / 3600
      ) as avg_hours
      FROM ${analyticsEvents} signup
      INNER JOIN ${analyticsEvents} studio 
        ON signup.user_id = studio.user_id 
        AND studio.event_type = 'studio_launched'
      WHERE signup.event_type = 'user_signup'
      AND studio.id = (
        SELECT MIN(id) 
        FROM ${analyticsEvents} 
        WHERE user_id = signup.user_id 
        AND event_type = 'studio_launched'
      )
    `);
    const avgTimeToFirstStudio = parseFloat((avgTimeQuery.rows[0] as any)?.avg_hours || '0');

    // Total studio launches and artifacts
    const statsQuery = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN event_type = 'studio_launched' THEN 1 END) as studio_launches,
        COUNT(CASE WHEN event_type = 'artifact_generated' THEN 1 END) as artifacts
      FROM ${analyticsEvents}
    `);
    const stats = statsQuery.rows[0] as any;
    const totalStudioLaunches = parseInt(stats.studio_launches || '0');
    const totalArtifacts = parseInt(stats.artifacts || '0');

    return {
      totalUsers,
      signupsToday,
      onboardingCompletionRate,
      avgTimeToFirstStudio: Math.round(avgTimeToFirstStudio * 10) / 10, // 1 decimal place
      totalStudioLaunches,
      totalArtifacts,
      activeUsers24h,
      conversionFunnel,
    };
  }

  async getEventTimeline(
    eventType?: EventType,
    startDate?: Date,
    days: number = 7
  ): Promise<Array<{ date: string; count: number }>> {
    const endDate = startDate || new Date();
    const start = new Date(endDate);
    start.setDate(start.getDate() - days);

    const query = await db.execute(sql`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM ${analyticsEvents}
      WHERE timestamp >= ${start}
      ${eventType ? sql`AND event_type = ${eventType}` : sql``}
      GROUP BY DATE(timestamp)
      ORDER BY DATE(timestamp)
    `);

    return query.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count),
    }));
  }
}

export const analyticsService = new AnalyticsService();
