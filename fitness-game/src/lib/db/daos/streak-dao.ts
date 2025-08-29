import { db } from '../index';
import { streakLogs, streakHistories } from '../schema';
import { eq, and, desc, isNull, gte, lte } from 'drizzle-orm';
import type { StreakLog, StreakHistory, NewStreakLog, NewStreakHistory } from '../schema';

export class StreakDAO {
  /**
   * Get user's current streaks
   */
  async getCurrentStreaks(userId: string): Promise<StreakHistory[]> {
    return await db.query.streakHistories.findMany({
      where: and(
        eq(streakHistories.user_id, userId),
        isNull(streakHistories.ended_date)
      ),
      orderBy: desc(streakHistories.streak_length),
    });
  }

  /**
   * Get user's streak history by type
   */
  async getStreakHistoryByType(userId: string, streakType: string): Promise<StreakHistory[]> {
    return await db.query.streakHistories.findMany({
      where: and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType)
      ),
      orderBy: desc(streakHistories.streak_length),
    });
  }

  /**
   * Get user's longest streak by type
   */
  async getLongestStreakByType(userId: string, streakType: string): Promise<StreakHistory | null> {
    const result = await db.query.streakHistories.findFirst({
      where: and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType)
      ),
      orderBy: desc(streakHistories.streak_length),
    });
    return result || null;
  }

  /**
   * Get user's streak log for a specific date
   */
  async getStreakLogForDate(userId: string, date: Date): Promise<StreakLog | null> {
    const result = await db.query.streakLogs.findFirst({
      where: and(
        eq(streakLogs.user_id, userId),
        eq(streakLogs.date_utc, date.toISOString().split('T')[0])
      ),
    });
    return result || null;
  }

  /**
   * Get user's streak logs for a date range
   */
  async getStreakLogsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<StreakLog[]> {
    return await db.query.streakLogs.findMany({
      where: and(
        eq(streakLogs.user_id, userId),
        gte(streakLogs.date_utc, startDate.toISOString().split('T')[0]),
        lte(streakLogs.date_utc, endDate.toISOString().split('T')[0])
      ),
      orderBy: desc(streakLogs.date_utc),
    });
  }

  /**
   * Log daily habits
   */
  async logDailyHabits(userId: string, date: Date, entries: {
    workout_completed: boolean;
    ate_clean: boolean;
    slept_well: boolean;
    hydrated: boolean;
    quiz_completed: boolean;
    quiz_passed: boolean;
    all: boolean;
  }): Promise<StreakLog[]> {
    const existing = await this.getStreakLogForDate(userId, date);
    
    if (existing) {
      return await db
        .update(streakLogs)
        .set({ entries, logged_at: new Date() })
        .where(eq(streakLogs.id, existing.id))
        .returning();
    } else {
      return await db.insert(streakLogs).values({
        user_id: userId,
        date_utc: date.toISOString().split('T')[0],
        entries,
        logged_at: new Date(),
      }).returning();
    }
  }

  /**
   * Create or update streak history
   */
  async upsertStreakHistory(streakData: {
    user_id: string;
    streak_length: number;
    started_date: Date;
    ended_date?: Date;
    streak_type: string;
  }): Promise<StreakHistory[]> {
    // Check for existing current streak of same type
    const existing = await db.query.streakHistories.findFirst({
      where: and(
        eq(streakHistories.user_id, streakData.user_id),
        eq(streakHistories.streak_type, streakData.streak_type),
        isNull(streakHistories.ended_date)
      ),
    });

    if (existing) {
      // Update existing streak
      return await db
        .update(streakHistories)
        .set({
          streak_length: streakData.streak_length,
          ended_date: streakData.ended_date?.toISOString().split('T')[0],
        })
        .where(eq(streakHistories.id, existing.id))
        .returning();
    } else {
      // Create new streak
      return await db.insert(streakHistories).values({
        ...streakData,
        started_date: streakData.started_date.toISOString().split('T')[0],
        ended_date: streakData.ended_date?.toISOString().split('T')[0],
      }).returning();
    }
  }

  /**
   * End a current streak
   */
  async endStreak(streakId: string, endDate: Date): Promise<StreakHistory[]> {
    return await db
      .update(streakHistories)
      .set({ ended_date: endDate.toISOString().split('T')[0] })
      .where(eq(streakHistories.id, streakId))
      .returning();
  }

  /**
   * Get user's perfect day streaks (all habits completed)
   */
  async getPerfectDayStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'all');
  }

  /**
   * Get user's workout completion streaks
   */
  async getWorkoutStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'workout_completed');
  }

  /**
   * Get user's clean eating streaks
   */
  async getCleanEatingStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'ate_clean');
  }

  /**
   * Get user's sleep quality streaks
   */
  async getSleepStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'slept_well');
  }

  /**
   * Get user's hydration streaks
   */
  async getHydrationStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'hydrated');
  }

  /**
   * Get user's quiz completion streaks
   */
  async getQuizCompletionStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'quiz_completed');
  }

  /**
   * Get user's quiz passing streaks
   */
  async getQuizPassingStreaks(userId: string): Promise<StreakHistory[]> {
    return await this.getStreakHistoryByType(userId, 'quiz_passed');
  }

  /**
   * Calculate user's current streak for a specific type
   */
  async calculateCurrentStreak(userId: string, streakType: string): Promise<number> {
    const currentStreak = await db.query.streakHistories.findFirst({
      where: and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType),
        isNull(streakHistories.ended_date)
      ),
    });
    return currentStreak?.streak_length || 0;
  }

  /**
   * Get user's streak statistics
   */
  async getUserStreakStats(userId: string): Promise<{
    workout_completed: number;
    ate_clean: number;
    slept_well: number;
    hydrated: number;
    quiz_completed: number;
    quiz_passed: number;
    all: number;
  }> {
    const stats = {
      workout_completed: 0,
      ate_clean: 0,
      slept_well: 0,
      hydrated: 0,
      quiz_completed: 0,
      quiz_passed: 0,
      all: 0,
    };

    const currentStreaks = await this.getCurrentStreaks(userId);
    
    for (const streak of currentStreaks) {
      if (stats.hasOwnProperty(streak.streak_type)) {
        stats[streak.streak_type as keyof typeof stats] = streak.streak_length;
      }
    }

    return stats;
  }
}
