import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import { fitnessLevelHistories, FitnessLevelHistory, NewFitnessLevelHistory } from '@/lib/db/schema';

export interface IFitnessLevelHistoryRepository {
  create(historyData: NewFitnessLevelHistory): Promise<FitnessLevelHistory>;
  findByUser(userId: string, limit?: number): Promise<FitnessLevelHistory[]>;
  findLatestByUser(userId: string): Promise<FitnessLevelHistory | null>;
}

export class FitnessLevelHistoryRepository implements IFitnessLevelHistoryRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async create(historyData: NewFitnessLevelHistory): Promise<FitnessLevelHistory> {
    const result = await this.db.insert(fitnessLevelHistories)
      .values(historyData)
      .returning();
    return result[0];
  }

  async findByUser(userId: string, limit?: number): Promise<FitnessLevelHistory[]> {
    let query = this.db.select()
      .from(fitnessLevelHistories)
      .where(eq(fitnessLevelHistories.user_id, userId))
      .orderBy(desc(fitnessLevelHistories.calculated_at));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async findLatestByUser(userId: string): Promise<FitnessLevelHistory | null> {
    const result = await this.db.select()
      .from(fitnessLevelHistories)
      .where(eq(fitnessLevelHistories.user_id, userId))
      .orderBy(desc(fitnessLevelHistories.calculated_at))
      .limit(1);
    
    return result[0] || null;
  }
}
