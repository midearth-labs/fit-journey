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
  async upsert(logData: NewUserHabitLog, updatedAt?: Date): Promise<UserHabitLog> {
    const [log] = await this.db
      .insert(userHabitLogs)
      .values(logData)
      .onConflictDoUpdate({
        target: [userHabitLogs.userChallengeId, userHabitLogs.logDate],
        set: {
          values: logData.values,
          updatedAt: updatedAt || new Date(),
        },
      })
      .returning();
    
    return log;
  }

  /**
   * Find all habit logs for a user challenge
   */
  async findByUserChallengeId(userChallengeId: string): Promise<UserHabitLog[]> {
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(eq(userHabitLogs.userChallengeId, userChallengeId))
      .orderBy(userHabitLogs.logDate);
  }

  /**
   * Find habit logs for a user challenge within a date range
   */
  async findByUserChallengeAndDateRange(
    userChallengeId: string, 
    fromDate: string, 
    toDate: string
  ): Promise<UserHabitLog[]> {
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userChallengeId, userChallengeId),
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
    logDate: string
  ): Promise<UserHabitLog | null> {
    const [log] = await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.userChallengeId, userChallengeId),
          eq(userHabitLogs.logDate, logDate)
        )
      )
      .limit(1);
    
    return log || null;
  }

  /**
   * Delete a habit log record
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(userHabitLogs)
      .where(eq(userHabitLogs.id, id));
    
    return result.rowCount > 0;
  }
}
