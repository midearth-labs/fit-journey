import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lte } from 'drizzle-orm';
import { userChallenges, UserChallenge, NewUserChallenge } from '@/lib/db/schema';
import { IUserChallengeRepository } from '@/shared/interfaces';

export class UserChallengeRepository implements IUserChallengeRepository {
  constructor(private db: NodePgDatabase<Record<string, never>>) {}

  /**
   * Create a new user challenge
   */
  async create(challengeData: NewUserChallenge): Promise<UserChallenge> {
    const [challenge] = await this.db
      .insert(userChallenges)
      .values(challengeData)
      .returning();
    
    return challenge;
  }

  /**
   * Find a user challenge by ID and userId
   */
  async findById(id: string, userId: string): Promise<UserChallenge | null> {
    const [challenge] = await this.db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.id, id),
          eq(userChallenges.userId, userId)
        )
      )
      .limit(1);
    
    return challenge || null;
  }

  /**
   * Find all challenges for a specific user
   */
  async findByUserId(userId: string): Promise<UserChallenge[]> {
    return await this.db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.userId, userId))
      .orderBy(userChallenges.createdAt);
  }

  /**
   * Find the active challenge for a specific user
   */
  async findActiveByUserId(userId: string): Promise<UserChallenge | null> {
    const [challenge] = await this.db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.status, 'active')
        )
      )
      .limit(1);
    
    return challenge || null;
  }

  /**
   * Update a user challenge
   */
  async update(id: string, userId: string, updates: Partial<UserChallenge>, updatedAt: Date): Promise<UserChallenge | null> {
    const [updatedChallenge] = await this.db
      .update(userChallenges)
      .set({ ...updates, updatedAt })
      .where(
        and(
          eq(userChallenges.id, id),
          eq(userChallenges.userId, userId)
        )
      )
      .returning();
    
    return updatedChallenge || null;
  }

  /**
   * Delete a user challenge
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(userChallenges)
      .where(
        and(
          eq(userChallenges.id, id),
          eq(userChallenges.userId, userId)
        )
      );
    
    return result.rowCount > 0;
  }

  /**
   * Find challenges that should be activated (not_started -> active)
   * Challenges where startDate <= current date and status is 'not_started'
   */
  async findChallengesToActivate(currentDate: string): Promise<UserChallenge[]> {
    return await this.db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.status, 'not_started'),
          lte(userChallenges.startDate, currentDate)
        )
      );
  }

  /**
   * Find all active challenges
   * Used by the service layer to check for completion
   */
  async findActiveChallenges(): Promise<UserChallenge[]> {
    return await this.db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.status, 'active'));
  }

  /**
   * Find challenges that should be locked (completed -> locked)
   * Challenges where completedAt <= (NOW() - 48 hours) and status is 'completed'
   */
  async findChallengesToLock(fortyEightHoursAgoTimestamp: Date): Promise<UserChallenge[]> {
    return await this.db
      .select()
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.status, 'completed'),
          lte(userChallenges.completedAt, fortyEightHoursAgoTimestamp)
        )
      );
  }
}
