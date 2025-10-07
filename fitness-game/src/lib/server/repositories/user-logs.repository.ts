import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { userLogs, userMetadata, type UserLog, type NewUserLog } from '$lib/server/db/schema';
import type { IDateTimeHelper } from '../helpers/date-time.helper';

export type IUserLogsRepository = {
    upsert(logData: NewUserLog): Promise<void>;
    deleteLog(userId: string, logDate: string, requestDate: Date): Promise<boolean>;
    findByUser(userId: string, page: number, limit: number, fromDate?: string, toDate?: string): Promise<UserLog[]>;
    findByUserOnDate(userId: string, logDate: string): Promise<UserLog | null>;
  };
  

export class UserLogsRepository implements IUserLogsRepository {
  constructor(
    private db: NodePgDatabase<any>,
    private readonly dateTimeHelper: IDateTimeHelper,
  ) {}

  /**
   * Upsert a user log record with complete overwrite of JSONB values
   * This completely replaces the existing fiveStarValues and measurementValues
   * Uses the unique constraint on (userId, logDate)
   */
  async upsert(
    logData: NewUserLog
  ): Promise<void> {
    const result = await this.db
      .insert(userLogs)
      .values({
        ...logData,
        updatedAt: logData.createdAt,
      })
      .onConflictDoUpdate({
        target: [userLogs.userId, userLogs.logDate],
        set: {
          fiveStarValues: sql`EXCLUDED.${sql.raw(userLogs.fiveStarValues.name)}`,
          measurementValues: sql`EXCLUDED.${sql.raw(userLogs.measurementValues.name)}`,
          updatedAt: sql`GREATEST(${userLogs.updatedAt}, EXCLUDED.${sql.raw(userLogs.updatedAt.name)})`,
        },
        setWhere: sql`${userLogs.userId} = EXCLUDED.${sql.raw(userLogs.userId.name)}`
      })
      .returning({
        wasInserted: sql`(xmax = 0)`.mapWith(Boolean),
      });

    const wasInserted = result[0].wasInserted;

    if (wasInserted) {
      // Update user metadata to increment daysLogged count
      await this.db
        .update(userMetadata)
        .set({
          daysLogged: sql`${userMetadata.daysLogged} + 1`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${logData.createdAt.toISOString()})`,
        })
        .where(eq(userMetadata.id, logData.userId));
    }
  }

  /**
   * Delete a user log for a specific date
   */
  async deleteLog(userId: string, logDate: string, requestDate: Date): Promise<boolean> {
    const result = await this.db
      .delete(userLogs)
      .where(and(eq(userLogs.userId, userId), eq(userLogs.logDate, logDate)));

    if (result.rowCount > 0) {
      // Update user metadata to decrement daysLogged count
      await this.db
        .update(userMetadata)
        .set({
          daysLogged: sql`${userMetadata.daysLogged} - 1`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${requestDate.toISOString()})`,
        })
        .where(eq(userMetadata.id, userId));
    }

    return result.rowCount > 0;
  }

  /**
   * Find log records for a user within optional date range with pagination
   */
  async findByUser(
    userId: string,
    page: number,
    limit: number,
    fromDate?: string, 
    toDate?: string
  ): Promise<UserLog[]> {
    const offset = (page - 1) * limit;
    const whereClause = [
      eq(userLogs.userId, userId),
      ...(fromDate ? [gte(userLogs.logDate, fromDate)] : []),
      ...(toDate ? [lte(userLogs.logDate, toDate)] : []),
    ];

    return await this.db
      .select()
      .from(userLogs)
      .where(and(...whereClause))
      .orderBy(desc(userLogs.logDate))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Find log record for a specific date for a user
   */
  async findByUserOnDate(userId: string, logDate: string): Promise<UserLog | null> {
    const [result] = await this.findByUser(userId, 1, 1, logDate, logDate);

    return result || null;
  }
}
