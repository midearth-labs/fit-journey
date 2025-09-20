import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql } from 'drizzle-orm';
import { userChallengeProgress, type UserChallengeProgress, type NewUserChallengeProgress } from '$lib/server/db/schema';


export type IUserChallengeProgressRepository = {
    findByUserChallengeId(userChallengeId: string, userId: string): Promise<UserChallengeProgress[]>;
    findByUserChallengeAndArticle(userChallengeId: string, userId: string, knowledgeBaseId: string): Promise<UserChallengeProgress | null>;
    upsert(progressData: NewUserChallengeProgress): Promise<boolean>;
  };
  
export class UserChallengeProgressRepository implements IUserChallengeProgressRepository {
  constructor(private db: NodePgDatabase<any>) {}

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
  async upsert(progressData: NewUserChallengeProgress): Promise<boolean> {
    const result = await this.db
      .insert(userChallengeProgress)
      .values({...progressData, lastAttemptedAt: progressData.firstAttemptedAt, attempts: 1})
      .onConflictDoUpdate({
        target: [userChallengeProgress.userChallengeId, userChallengeProgress.knowledgeBaseId],
        set: {
          allCorrectAnswers: progressData.allCorrectAnswers,
          quizAnswers: progressData.quizAnswers,
          lastAttemptedAt: progressData.firstAttemptedAt,
          attempts: sql<number>`${userChallengeProgress.attempts} + 1`,
        },
        // This makes sure we only update the progress for the user
        setWhere: sql`${userChallengeProgress.userId} = EXCLUDED.userId`
      })
      // @TODO: Add logic to update the user challenge progress count
    
    return result.rowCount > 0;
  }
}
