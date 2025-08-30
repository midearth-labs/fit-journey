import { db } from '../index';
import { gameSessions } from '../schema';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';
import type { GameSession, NewGameSession } from '../schema';

// @TODO: transaction use in multi-step DAOS.
export class GameSessionDAO {
  /**
   * Get user's current game session
   */
  async getCurrentSession(userId: string): Promise<GameSession | null> {
    const result = await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.user_id, userId),
        eq(gameSessions.in_progress, true)
      ),
      orderBy: desc(gameSessions.started_at),
    });
    return result || null;
  }

  /**
   * Get game session by ID
   */
  async getSessionById(sessionId: string): Promise<GameSession | null> {
    const result = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });
    return result || null;
  }

  /**
   * Get user's game sessions for a specific date range
   */
  async getSessionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<GameSession[]> {
    return await db.query.gameSessions.findMany({
      where: and(
        eq(gameSessions.user_id, userId),
        gte(gameSessions.session_date_utc, startDate.toISOString().split('T')[0]),
        lte(gameSessions.session_date_utc, endDate.toISOString().split('T')[0])
      ),
      orderBy: desc(gameSessions.session_date_utc),
    });
  }

  /**
   * Get user's game sessions for a specific date
   */
  async getSessionsByDate(userId: string, date: Date): Promise<GameSession[]> {
    const dateString = date.toISOString().split('T')[0];
    return await db.query.gameSessions.findMany({
      where: and(
        eq(gameSessions.user_id, userId),
        eq(gameSessions.session_date_utc, dateString)
      ),
      orderBy: desc(gameSessions.started_at),
    });
  }

  /**
   * Get active sessions by date and partition key for cleanup operations
   */
  async getActiveSessionsByDate(sessionDateUtc: string, partitionKey: number): Promise<GameSession[]> {
    return await db.query.gameSessions.findMany({
      where: and(
        eq(gameSessions.session_date_utc, sessionDateUtc),
        eq(gameSessions.active_partition_key, partitionKey),
      ),
    });
  }

  /**
   * Create new game session
   */
  async createSession(sessionData: {
    user_id: string;
    day: number;
    challenge_id: string
    session_timezone: string;
    session_date_utc: Date;
  }): Promise<GameSession[]> {
    // Calculate partition key: hashcode of user_id modulo 24 (1-24)
    const partitionKey = (sessionData.user_id.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0) % 24) + 1;

    return await db.insert(gameSessions).values({
      ...sessionData,
      day: sessionData.day,
      session_date_utc: sessionData.session_date_utc.toISOString().split('T')[0],
      started_at: new Date(),
      in_progress: true,
      active_partition_key: partitionKey,
      attempt_count: 1,
    }).returning();
  }

  /**
   * Complete game session
   */
  async completeSession(sessionId: string, completionData: {
    user_answers: Array<{
      question_id: string;
      answer_index: number;
      is_correct: boolean;
      hint_used: boolean;
    }>;
    all_correct_answers: boolean;
    time_spent_seconds: number;
  }): Promise<GameSession[]> {
    return await db
      .update(gameSessions)
      .set({
        ...completionData,
        completed_at: new Date(),
        in_progress: null,
        active_partition_key: null,
      })
      .where(eq(gameSessions.id, sessionId))
      .returning();
  }

  /**
   * Increment attempt count for retry
   */
  async incrementAttemptCount(sessionId: string): Promise<GameSession[]> {
    const session = await this.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');

    return await db
      .update(gameSessions)
      .set({ attempt_count: session.attempt_count + 1 })
      .where(eq(gameSessions.id, sessionId))
      .returning();
  }

  /**
   * Update session in progress status
   */
  async updateInProgressStatus(sessionId: string, inProgress: boolean | null): Promise<GameSession[]> {
    return await db
      .update(gameSessions)
      .set({ 
        in_progress: inProgress,
        active_partition_key: inProgress ? undefined : null // Keep existing partition key if setting to true, set to null if false
      })
      .where(eq(gameSessions.id, sessionId))
      .returning();
  }

  /**
   * Update session user answers
   */
  async updateUserAnswers(sessionId: string, userAnswers: Array<{
    question_id: string;
    answer_index: number;
    is_correct: boolean;
    hint_used: boolean;
  }>): Promise<GameSession[]> {
    return await db
      .update(gameSessions)
      .set({ user_answers: userAnswers })
      .where(eq(gameSessions.id, sessionId))
      .returning();
  }

  /**
   * Get all sessions for a specific challenge
   */
  async getSessionsByChallenge(day: number): Promise<GameSession[]> {
    return await db.query.gameSessions.findMany({
      where: eq(gameSessions.day, day),
      orderBy: desc(gameSessions.started_at),
    });
  }

  /**
   * Get user's session count for a specific date
   */
  async getUserSessionCountForDate(userId: string, date: Date): Promise<number> {
    const sessions = await this.getSessionsByDate(userId, date);
    return sessions.length;
  }

  /**
   * Check if user has completed challenge for a specific date
   */
  async hasUserCompletedChallengeForDate(userId: string, dateStringUtc: string): Promise<boolean> {
    const result = await db.query.gameSessions.findFirst({
      where: and(
        eq(gameSessions.user_id, userId),
        eq(gameSessions.session_date_utc, dateStringUtc),
        isNull(gameSessions.in_progress)
      ),
    });
    return !!result;
  }
}
