import { db } from '../index';
import { fitnessLevelHistories } from '../schema';
import { eq, and, desc, asc, gte } from 'drizzle-orm';
import type { FitnessLevelHistory, NewFitnessLevelHistory } from '../schema';
import { UserDAO } from './user-dao';

export class FitnessLevelDAO {
  private userDAO: UserDAO;

  constructor() {
    this.userDAO = new UserDAO();
  }

  /**
   * Get user's current fitness level
   */
  async getCurrentFitnessLevel(userId: string): Promise<number> {
    const profile = await this.userDAO.getUserProfile(userId);
    return profile?.current_fitness_level || 0;
  }

  /**
   * Get user's fitness level history
   */
  async getFitnessLevelHistory(userId: string, limit = 30): Promise<FitnessLevelHistory[]> {
    return await db.query.fitnessLevelHistories.findMany({
      where: eq(fitnessLevelHistories.user_id, userId),
      orderBy: desc(fitnessLevelHistories.calculated_at),
      limit,
    });
  }

  /**
   * Get fitness level history by date range
   */
  async getFitnessLevelHistoryByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<FitnessLevelHistory[]> {
    return await db.query.fitnessLevelHistories.findMany({
      where: and(
        eq(fitnessLevelHistories.user_id, userId),
        gte(fitnessLevelHistories.calculated_at, startDate),
        gte(fitnessLevelHistories.calculated_at, endDate)
      ),
      orderBy: asc(fitnessLevelHistories.calculated_at),
    });
  }

  /**
   * Get fitness level at a specific date
   */
  async getFitnessLevelAtDate(userId: string, date: Date): Promise<FitnessLevelHistory | null> {
    const result = await db.query.fitnessLevelHistories.findFirst({
      where: and(
        eq(fitnessLevelHistories.user_id, userId),
        eq(fitnessLevelHistories.calculated_at, date)
      ),
    });
    return result || null;
  }

  /**
   * Add new fitness level entry
   */
  async addFitnessLevelEntry(
    userId: string, 
    fitnessLevel: number, 
    calculatedAt?: Date
  ): Promise<FitnessLevelHistory[]> {
    return await db.insert(fitnessLevelHistories).values({
      user_id: userId,
      fitness_level: fitnessLevel,
      calculated_at: calculatedAt || new Date(),
    }).returning();
  }

  /**
   * Update user's fitness level (adds to history and updates profile)
   */
  async updateFitnessLevel(userId: string, newLevel: number): Promise<{
    historyEntry: FitnessLevelHistory[];
    profileUpdate: any[];
  }> {
    // Add to history
    const historyEntry = await this.addFitnessLevelEntry(userId, newLevel);

    // Update profile
    const profileUpdate = await this.userDAO.updateCurrentFitnessLevel(userId, newLevel);

    return { historyEntry, profileUpdate };
  }

  /**
   * Get fitness level trend (last N days)
   */
  async getFitnessLevelTrend(userId: string, days: number = 7): Promise<FitnessLevelHistory[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await db.query.fitnessLevelHistories.findMany({
      where: and(
        eq(fitnessLevelHistories.user_id, userId),
        gte(fitnessLevelHistories.calculated_at, startDate)
      ),
      orderBy: asc(fitnessLevelHistories.calculated_at),
    });
  }

  /**
   * Get fitness level progression over time
   */
  async getFitnessLevelProgression(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<FitnessLevelHistory[]> {
    return await db.query.fitnessLevelHistories.findMany({
      where: and(
        eq(fitnessLevelHistories.user_id, userId),
        gte(fitnessLevelHistories.calculated_at, startDate),
        gte(fitnessLevelHistories.calculated_at, endDate)
      ),
      orderBy: asc(fitnessLevelHistories.calculated_at),
    });
  }

  /**
   * Get user's highest fitness level achieved
   */
  async getHighestFitnessLevel(userId: string): Promise<FitnessLevelHistory | null> {
    const result = await db.query.fitnessLevelHistories.findFirst({
      where: eq(fitnessLevelHistories.user_id, userId),
      orderBy: desc(fitnessLevelHistories.fitness_level),
    });
    return result || null;
  }

  /**
   * Get user's lowest fitness level achieved
   */
  async getLowestFitnessLevel(userId: string): Promise<FitnessLevelHistory | null> {
    const result = await db.query.fitnessLevelHistories.findFirst({
      where: eq(fitnessLevelHistories.user_id, userId),
      orderBy: asc(fitnessLevelHistories.fitness_level),
    });
    return result || null;
  }

  /**
   * Calculate fitness level change over a period
   */
  async calculateFitnessLevelChange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<number> {
    const startLevel = await this.getFitnessLevelAtDate(userId, startDate);
    const endLevel = await this.getFitnessLevelAtDate(userId, endDate);

    if (!startLevel || !endLevel) {
      return 0;
    }

    return endLevel.fitness_level - startLevel.fitness_level;
  }

  /**
   * Get fitness level milestones (when user reached specific levels)
   */
  async getFitnessLevelMilestones(userId: string): Promise<{
    level: number;
    firstAchieved: Date;
    lastAchieved: Date;
    timesAchieved: number;
  }[]> {
    const history = await this.getFitnessLevelHistory(userId, 1000); // Get all history
    
    const milestones = new Map<number, {
      level: number;
      firstAchieved: Date;
      lastAchieved: Date;
      timesAchieved: number;
    }>();

    for (const entry of history) {
      const level = entry.fitness_level;
      const achievedAt = entry.calculated_at;

      if (!milestones.has(level)) {
        milestones.set(level, {
          level,
          firstAchieved: achievedAt,
          lastAchieved: achievedAt,
          timesAchieved: 1,
        });
      } else {
        const milestone = milestones.get(level)!;
        milestone.lastAchieved = achievedAt;
        milestone.timesAchieved++;
      }
    }

    return Array.from(milestones.values()).sort((a, b) => a.level - b.level);
  }

  /**
   * Get fitness level distribution (how many times each level was achieved)
   */
  async getFitnessLevelDistribution(userId: string): Promise<Map<number, number>> {
    const history = await this.getFitnessLevelHistory(userId, 1000);
    const distribution = new Map<number, number>();

    for (const entry of history) {
      const level = entry.fitness_level;
      distribution.set(level, (distribution.get(level) || 0) + 1);
    }

    return distribution;
  }

  /**
   * Clean up old fitness level history entries
   */
  async cleanupOldHistory(userId: string, keepDays: number = 365): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    // Note: This would require a delete operation, which should be implemented
    // based on your specific requirements for data retention
    console.log(`Would clean up fitness level history older than ${cutoffDate} for user ${userId}`);
  }
}
