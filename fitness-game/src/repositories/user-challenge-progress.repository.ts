import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { userChallengeProgress, UserChallengeProgress, NewUserChallengeProgress } from '@/lib/db/schema';
import { IUserChallengeProgressRepository } from '@/shared/interfaces';

export class UserChallengeProgressRepository implements IUserChallengeProgressRepository {
  constructor(private db: NodePgDatabase<Record<string, never>>) {}

  /**
   * Create a new user challenge progress record
   */
  async create(progressData: NewUserChallengeProgress): Promise<UserChallengeProgress> {
    const [progress] = await this.db
      .insert(userChallengeProgress)
      .values(progressData)
      .returning();
    
    return progress;
  }

  /**
   * Find all progress records for a user challenge
   */
  async findByUserChallengeId(userChallengeId: string, userId: string): Promise<UserChallengeProgress[]> {
    return await this.db
      .select()
      .from(userChallengeProgress)
      .where(
        and(
          eq(userChallengeProgress.userChallengeId, userChallengeId),
          eq(userChallengeProgress.userId, userId)
        )
      )
      .orderBy(userChallengeProgress.firstAttemptedAt);
  }

  /**
   * Find progress for a specific article within a user challenge
   */
  async findByUserChallengeAndArticle(
    userChallengeId: string, 
    userId: string,
    knowledgeBaseId: string
  ): Promise<UserChallengeProgress | null> {
    const [progress] = await this.db
      .select()
      .from(userChallengeProgress)
      .where(
        and(
          eq(userChallengeProgress.userChallengeId, userChallengeId),
          eq(userChallengeProgress.userId, userId),
          eq(userChallengeProgress.knowledgeBaseId, knowledgeBaseId)
        )
      )
      .limit(1);
    
    return progress || null;
  }

  /**
   * Upsert a user challenge progress record
   * This handles both creating new records and updating existing ones
   */
  async upsert(progressData: NewUserChallengeProgress): Promise<UserChallengeProgress> {
    // First try to find existing record
    const existing = await this.findByUserChallengeAndArticle(
      progressData.userChallengeId,
      progressData.userId,
      progressData.knowledgeBaseId
    );

    if (existing) {
      // Update existing record
      const [updated] = await this.db
        .update(userChallengeProgress)
        .set({
          allCorrectAnswers: progressData.allCorrectAnswers,
          quizAnswers: progressData.quizAnswers,
          lastAttemptedAt: progressData.lastAttemptedAt,
          attempts: progressData.attempts,
        })
        .where(
            and(
              eq(userChallengeProgress.id, existing.id),
              eq(userChallengeProgress.userId, existing.userId)
            ))
        .returning();
      
      return updated;
    } else {
      // Create new record
      return await this.create(progressData);
    }
  }

  /**
   * Update a user challenge progress record
   */
  async update(id: string, userId: string, updates: Partial<UserChallengeProgress>): Promise<UserChallengeProgress | null> {
    const [updatedProgress] = await this.db
      .update(userChallengeProgress)
      .set(updates)
      .where(
        and(
          eq(userChallengeProgress.id, id),
          eq(userChallengeProgress.userId, userId)
        )
      )
      .returning();
    
    return updatedProgress || null;
  }
}
