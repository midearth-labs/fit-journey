import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lte, lt, ne, gte } from 'drizzle-orm';
import { userChallenges, UserChallenge, NewUserChallenge, UpdateUserChallenge } from '@/lib/db/schema';
import { IUserChallengeRepository, IDateTimeService } from '@/shared/interfaces';
import { CHALLENGE_CONSTANTS } from '@/data/content/types/constants';

export class UserChallengeRepository implements IUserChallengeRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>, 
    private readonly dateTimeService: IDateTimeService
  ) {}

  /**
   * Create a new user challenge
   */
  async create(challengeData: NewUserChallenge): Promise<UserChallenge> {
    const [challenge] = await this.db
      .insert(userChallenges)
      .values({...challengeData, updatedAt: challengeData.createdAt, status: 'not_started', knowledgeBaseCompletedCount: 0, habitsLoggedCount: 0})
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
  async update(updates: UpdateUserChallenge): Promise<UserChallenge | null> {
    const [updatedChallenge] = await this.db
      .update(userChallenges)
      .set({ ...updates })
      .where(
        and(
          eq(userChallenges.id, updates.id),
          eq(userChallenges.userId, updates.userId)
        )
      )
      .returning();
    
    return updatedChallenge || null;
  }

  /**
   * Delete a user challenge
   */
  // Can a challenge be deleted/cancelled, set as inactive/cancelled instead?
  // if going with cancelled, then update the status checking / batch update methods to check for cancelled status
  // also update the challenge service to handle cancelled status
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



  private getRealChallengeStatus(
    requestDate: Date,
    challengeDays: number,
    challenge: Pick<UserChallenge, 'status' | 'startDate' | 'knowledgeBaseCompletedCount' | 'habitsLoggedCount'>
    ): UserChallenge['status'] {
        
        // --- 1. Handle all "locked" conditions first as guard clauses ---

        // Condition A: The challenge is explicitly marked as 'locked'.
        if (challenge.status === 'locked') {
            return 'locked';
        }

        // Condition B: The challenge is outside its accessible time window (grace period).
        // This is a universal rule that can lock an otherwise active or completed challenge.
        const { earliest: earliestAllowedStartDate } = this.dateTimeService.getDatesFromInstantWithOffset(
            requestDate,
            { days: -challengeDays, hours: -CHALLENGE_CONSTANTS.DEFAULT_CHALLENGE_GRACE_PERIOD_HOURS }
        );
        if (earliestAllowedStartDate > challenge.startDate) {
            return 'locked';
        }

        // --- 2. Handle state transitions for non-locked challenges ---
        // At this point, we know the challenge is not locked. We can now evaluate its current status.

        switch (challenge.status) {
            case 'completed':
                // If it's already completed and not locked by the grace period, it remains completed.
                return 'completed';

            case 'active':
                // An active challenge might transition to 'completed'.
                const isComplete = challenge.knowledgeBaseCompletedCount >= challengeDays &&
                                challenge.habitsLoggedCount >= challengeDays;
                if (isComplete) {
                    return 'completed';
                }
                // Otherwise, it remains 'active'.
                return 'active';

            case 'not_started':
                // A 'not_started' challenge might transition to 'active'.
                const { latest: latestDateOnEarth } = this.dateTimeService.getPossibleDatesOnEarthAtInstant(requestDate);
                if (latestDateOnEarth >= challenge.startDate) {
                    return 'active';
                }
                // Otherwise, it remains 'not_started'.
                return 'not_started';

            default:
                // This handles any unexpected status values.
                throw new Error(`Invalid or unhandled challenge status: ${challenge.status}`);
        }
    }
    /**
     * Generates a sequence of Drizzle UPDATE queries to synchronize challenge statuses.
     * These queries should be executed in the returned order within a transaction.
     *
     * @param challengeDays The number of days required for challenge completion.
     * @param currentInstant The current timestamp (new Date()) to use for `updatedAt`.
     * @param earliestAllowedStartDate The calculated date for the grace period lock check.
     * @param currentDateOnEarth The earliest current date anywhere on Earth, for activation checks.
     * @returns An array of Drizzle promise-based queries to be executed.
     */
  public getChallengeStatusUpdateQueries(
    challengeDays: number,
    currentInstant: Date,
    earliestAllowedStartDate: string,
    latestDateOnEarth: string
  ) {
    /**
     * QUERY 1: Lock challenges that are outside their grace period.
     * This logic corresponds to the primary guard clause. It locks any challenge
     * (that isn't already locked) whose start date is before the earliest allowed date.
     */
    const lockExpiredChallengesQuery = this.db.update(userChallenges)
      .set({
        status: 'locked',
        updatedAt: currentInstant,
      })
      .where(and(
        ne(userChallenges.status, 'locked'),
        lt(userChallenges.startDate, earliestAllowedStartDate)
      ));
    // Expected SQL:
    // UPDATE "user_challenges" SET "status" = 'locked', "updated_at" = $1 WHERE "status" != 'locked' AND "start_date" < $2
  
    /**
     * QUERY 2: Activate challenges that have not started yet but their start date has arrived.
     * This transitions challenges from 'not_started' to 'active'.
     */
    const activatePendingChallengesQuery = this.db.update(userChallenges)
      .set({
        status: 'active',
        updatedAt: currentInstant,
      })
      .where(and(
        eq(userChallenges.status, 'not_started'),
        lte(userChallenges.startDate, latestDateOnEarth) // Note: lte(col, val) is equivalent to col <= val
      ));
    // Expected SQL:
    // UPDATE "user_challenges" SET "status" = 'active', "updated_at" = $1 WHERE "status" = 'not_started' AND "start_date" <= $2
  
    /**
     * QUERY 3: Complete active challenges that have met their completion criteria.
     * This transitions challenges from 'active' to 'completed'.
     */
    const completeActiveChallengesQuery = this.db.update(userChallenges)
      .set({
        status: 'completed',
        updatedAt: currentInstant,
      })
      .where(and(
        eq(userChallenges.status, 'active'),
        gte(userChallenges.knowledgeBaseCompletedCount, challengeDays),
        gte(userChallenges.habitsLoggedCount, challengeDays)
      ));
    // Expected SQL:
    // UPDATE "user_challenges" SET "status" = 'completed', "updated_at" = $1 WHERE "status" = 'active' AND "knowledge_base_completed_count" >= $2 AND "habits_logged_count" >= $3
  
    return [
      lockExpiredChallengesQuery,
      activatePendingChallengesQuery,
      completeActiveChallengesQuery,
    ];
  }
}
