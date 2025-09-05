import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, isNull, isNotNull } from 'drizzle-orm';
import { streakHistories, StreakHistory, NewStreakHistory } from '@/lib/db/schema';

export interface IStreakHistoryRepository {
  create(historyData: NewStreakHistory): Promise<StreakHistory>;
  update(historyId: string, updates: Partial<StreakHistory>): Promise<StreakHistory | null>;
  findById(historyId: string): Promise<StreakHistory | null>;
  findCurrentStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null>;
  findLongestStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null>;
  findByUserAndType(userId: string, streakType: string, limit?: number): Promise<StreakHistory[]>;
  findByUser(userId: string, limit?: number): Promise<StreakHistory[]>;
}

export class StreakHistoryRepository implements IStreakHistoryRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(historyData: NewStreakHistory): Promise<StreakHistory> {
    const result = await this.db.insert(streakHistories)
      .values(historyData)
      .returning();
    return result[0];
  }

  async update(historyId: string, updates: Partial<StreakHistory>): Promise<StreakHistory | null> {
    const result = await this.db.update(streakHistories)
      .set(updates)
      .where(eq(streakHistories.id, historyId))
      .returning();
    
    return result[0] || null;
  }

  async findById(historyId: string): Promise<StreakHistory | null> {
    const result = await this.db.select()
      .from(streakHistories)
      .where(eq(streakHistories.id, historyId))
      .limit(1);
    
    return result[0] || null;
  }

  async findCurrentStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null> {
    const result = await this.db.select()
      .from(streakHistories)
      .where(and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType),
        isNull(streakHistories.ended_date) // Current streak has no end date
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async findLongestStreakByUserAndType(userId: string, streakType: string): Promise<StreakHistory | null> {
    const result = await this.db.select()
      .from(streakHistories)
      .where(and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType)
      ))
      .orderBy(desc(streakHistories.streak_length))
      .limit(1);
    
    return result[0] || null;
  }

  async findByUserAndType(userId: string, streakType: string, limit?: number): Promise<StreakHistory[]> {
    let query = this.db.select()
      .from(streakHistories)
      .where(and(
        eq(streakHistories.user_id, userId),
        eq(streakHistories.streak_type, streakType)
      ))
      .orderBy(desc(streakHistories.started_date));
    
    return limit ? await query.limit(limit) : await query;
  }

  async findByUser(userId: string, limit?: number): Promise<StreakHistory[]> {
    let query = this.db.select()
      .from(streakHistories)
      .where(eq(streakHistories.user_id, userId))
      .orderBy(desc(streakHistories.started_date));
    
    return limit ? await query.limit(limit) : await query;
  }
}
