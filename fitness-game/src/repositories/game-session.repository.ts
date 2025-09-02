import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, lt } from 'drizzle-orm';
import { gameSessions, GameSession, NewGameSession, userProfiles } from '@/db/schema';

export interface IGameSessionRepository {
  findSessionByDay(userId: string, dayNumber: number): Promise<GameSession | null>;
  findLastSessionByUserId(userId: string): Promise<GameSession | null>;
  create(sessionData: NewGameSession): Promise<GameSession>;
  findById(sessionId: string): Promise<GameSession | null>;
  findManyByUser(userId: string, page: number, limit: number): Promise<GameSession[]>;
}

export class GameSessionRepository implements IGameSessionRepository {
  // Drizzle instance is injected
  constructor(private db: NodePgDatabase<any>) {}

  async findSessionByDay(userId: string, dayNumber: number): Promise<GameSession | null> {
    const result = await this.db.select()
      .from(gameSessions)
      .where(and(
        eq(gameSessions.user_id, userId),
        eq(gameSessions.day, dayNumber),
      ))
      .limit(1);

    return result[0] || null;
  }

  async findLastSessionByUserId(userId: string): Promise<GameSession | null> {
    const result = await this.db.select()
      .from(gameSessions)
      .where(eq(gameSessions.user_id, userId))
      .orderBy(desc(gameSessions.day)) // Latest day, then latest completion time
      .limit(1);

    return result[0] || null;
  }

  async create(sessionData: NewGameSession): Promise<GameSession> {
    // @TODO: Update the User profile with the latest game session in a transaction
    const result = await this.db.insert(gameSessions)
      .values(sessionData)
      .returning();

    await this.db.update(userProfiles)
      .set({ latest_game_session: result[0].id })
      .where(eq(userProfiles.user_id, sessionData.user_id));

    return result[0];
  }

  async findById(sessionId: string): Promise<GameSession | null> {
    const result = await this.db.select()
      .from(gameSessions)
      .where(eq(gameSessions.id, sessionId))
      .limit(1);
    return result[0] || null;
  }

  // @TODO: Limit the columns returned and use Pick on GameSession type
  async findManyByUser(userId: string): Promise<GameSession[]> {
    return this.db.select()
      .from(gameSessions)
      .where(eq(gameSessions.user_id, userId))
      .orderBy(desc(gameSessions.day));
  }

  // @TODO: Limit the columns returned and use Pick on GameSession type
  async findManyByUserPaginated(userId: string, limit: number, beforeDay?: number): Promise<GameSession[]> {
    return this.db.select()
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.user_id, userId),
          beforeDay ? lt(gameSessions.day, beforeDay) : undefined
        )
      )
      .orderBy(desc(gameSessions.day))
      .limit(limit);
  }
}


