import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { streakLogs, StreakLog, NewStreakLog } from '@/lib/db/schema';

export interface IStreakLogRepository {
  create(logData: NewStreakLog): Promise<StreakLog>;
  update(logId: string, updates: Partial<StreakLog>): Promise<StreakLog | null>;
  findByUserAndDate(userId: string, dateUtc: string): Promise<StreakLog | null>;
  findByUserInDateRange(userId: string, startDate: string, endDate: string): Promise<StreakLog[]>;
  findLatestByUser(userId: string): Promise<StreakLog | null>;
  findByUser(userId: string, limit?: number): Promise<StreakLog[]>;
}

export class StreakLogRepository implements IStreakLogRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(logData: NewStreakLog): Promise<StreakLog> {
    const result = await this.db.insert(streakLogs)
      .values(logData)
      .returning();
    return result[0];
  }

  async update(logId: string, updates: Partial<StreakLog>): Promise<StreakLog | null> {
    const result = await this.db.update(streakLogs)
      .set(updates)
      .where(eq(streakLogs.id, logId))
      .returning();
    
    return result[0] || null;
  }

  async findByUserAndDate(userId: string, dateUtc: string): Promise<StreakLog | null> {
    const result = await this.db.select()
      .from(streakLogs)
      .where(and(
        eq(streakLogs.user_id, userId),
        eq(streakLogs.date_utc, dateUtc)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async findByUserInDateRange(userId: string, startDate: string, endDate: string): Promise<StreakLog[]> {
    return this.db.select()
      .from(streakLogs)
      .where(and(
        eq(streakLogs.user_id, userId),
        gte(streakLogs.date_utc, startDate),
        lte(streakLogs.date_utc, endDate)
      ))
      .orderBy(desc(streakLogs.date_utc));
  }
  // @TODO: Use UserProfile.current_streak_ids?
  async findLatestByUser(userId: string): Promise<StreakLog | null> {
    const result = await this.db.select()
      .from(streakLogs)
      .where(eq(streakLogs.user_id, userId))
      .orderBy(desc(streakLogs.date_utc))
      .limit(1);
    
    return result[0] || null;
  }

  async findByUser(userId: string, limit?: number): Promise<StreakLog[]> {
    let query = this.db.select()
      .from(streakLogs)
      .where(eq(streakLogs.user_id, userId))
      .orderBy(desc(streakLogs.date_utc));
    return limit ? await query.limit(limit) : await query;
  }
}
