import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { userHabitLogs, UserHabitLog, NewUserHabitLog } from '@/lib/db/schema';
import { IUserHabitLogsRepository } from '@/shared/interfaces';

export class UserHabitLogsRepository implements IUserHabitLogsRepository {
  constructor(private db: NodePgDatabase<Record<string, never>>) {}

  /**
   * Upsert a user habit log record
   * This handles both creating new records and updating existing ones
   * Uses the unique constraint on (userChallengeId, logDate)
   */
  async upsert(logData: NewUserHabitLog): Promise<UserHabitLog | null> {
    const [log] = await this.db
      .insert(userHabitLogs)
      .values({...logData, updatedAt: logData.createdAt})
      .onConflictDoUpdate({
        target: [userHabitLogs.userChallengeId, userHabitLogs.logDate],
        set: {
          values: logData.values,
          updatedAt: logData.createdAt,
        },
        // This makes sure we only update the log for the user
        setWhere: sql`${userHabitLogs.userId} = ${logData.userId}`
      })
      .returning();
    
    return log || null;
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
  async findByUserChallengeAndDateRange(
    userChallengeId: string, 
    userId: string,
    fromDate?: string, 
    toDate?: string
  ): Promise<UserHabitLog[]> {
    const whereClause = [
        eq(userHabitLogs.userChallengeId, userChallengeId),
        eq(userHabitLogs.userId, userId),
        ...(fromDate ? [gte(userHabitLogs.logDate, fromDate)] : []),
        ...(toDate ? [lte(userHabitLogs.logDate, toDate)] : []),
    ];
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          ...whereClause
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
