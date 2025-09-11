import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte } from 'drizzle-orm';
import { userHabitLogs, UserHabitLog, NewUserHabitLog } from '@/lib/db/schema';
import { IUserHabitLogsRepository } from '@/shared/interfaces';

export class UserHabitLogsRepository implements IUserHabitLogsRepository {
  constructor(private db: NodePgDatabase<Record<string, never>>) {}

  /**
   * Upsert a user habit log record
   * This handles both creating new records and updating existing ones
   * Uses the unique constraint on (userChallengeId, logDate)
   */
  // @TODO: look for other upser methods and update to use the onConflictDoUpdate pattern
  async upsert(logData: NewUserHabitLog, updatedAt: Date): Promise<UserHabitLog> {
    const [log] = await this.db
      .insert(userHabitLogs)
      .values(logData)
      .onConflictDoUpdate({
        // @TODO: does this need to include userId also?
        target: [userHabitLogs.userChallengeId, userHabitLogs.logDate],
        set: {
          values: logData.values,
          updatedAt,
        },
      })
      .returning();
    
    return log;
  }

  /**
   * Find all habit logs for a user challenge
   */
  async findByUserChallengeId(userChallengeId: string, userId: string): Promise<UserHabitLog[]> {
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userChallengeId, userChallengeId),
          eq(userHabitLogs.userId, userId)
        )
      )
      .orderBy(userHabitLogs.logDate);
  }

  /**
   * Find habit logs for a user challenge within a date range
   */
  // @TODO: make fromDate and toDate optional.
  async findByUserChallengeAndDateRange(
    userChallengeId: string, 
    userId: string,
    fromDate: string, 
    toDate: string
  ): Promise<UserHabitLog[]> {
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userChallengeId, userChallengeId),
          eq(userHabitLogs.userId, userId),
          gte(userHabitLogs.logDate, fromDate),
          lte(userHabitLogs.logDate, toDate)
        )
      )
      .orderBy(userHabitLogs.logDate);
  }

  /**
   * Find habit log for a specific date within a user challenge
   */
  async findByUserChallengeAndDate(
    userChallengeId: string, 
    userId: string,
    logDate: string
  ): Promise<UserHabitLog | null> {
    const [log] = await this.findByUserChallengeAndDateRange(userChallengeId, userId, logDate, logDate);
    
    return log || null;
  }

  /**
   * Delete a habit log record
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.id, id),
          eq(userHabitLogs.userId, userId)
        )
      );
    
    return result.rowCount > 0;
  }
}
