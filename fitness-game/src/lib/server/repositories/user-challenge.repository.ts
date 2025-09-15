import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, lte, lt, gte, notInArray } from 'drizzle-orm';
import { userChallenges, type UserChallenge, type NewUserChallenge, type UpdateUserChallenge } from '$lib/server/db/schema';
import { CHALLENGE_CONSTANTS } from '$lib/server/content/types/constants';
import { type IDateTimeHelper } from '$lib/server/helpers/date-time.helper';
import { type IChallengeDAO } from '$lib/server/content/daos/challenge';
import { type ImplicitStatusCheckPayload, type UserChallengeWithImplicitStatus } from '$lib/server/shared/interfaces';

export type IUserChallengeRepository = {
    create(challengeData: NewUserChallenge): Promise<UserChallengeWithImplicitStatus>;
    findById(id: string, userId: string): Promise<UserChallengeWithImplicitStatus | null>;
    findByUserId(userId: string): Promise<UserChallengeWithImplicitStatus[]>;
    findActiveByUserId(userId: string): Promise<UserChallengeWithImplicitStatus | null>;
    update(updates: UpdateUserChallenge): Promise<UserChallengeWithImplicitStatus | null>;
    delete(id: string, userId: string): Promise<boolean>;
    batchUpdateChallengeStatuses(requestDate: Date): Promise<void>;
  };
  
export class UserChallengeRepository implements IUserChallengeRepository {
  constructor(private readonly db: NodePgDatabase<any>, 
    private readonly dateTimeHelper: IDateTimeHelper,
    private readonly challengeDAO: IChallengeDAO,
  ) {}

  /**
   * Create a new user challenge
   */
  async create(challengeData: NewUserChallenge): Promise<UserChallengeWithImplicitStatus> {
    const [challenge] = await this.db
      .insert(userChallenges)
      .values({...challengeData, updatedAt: challengeData.createdAt, status: 'not_started', knowledgeBaseCompletedCount: 0, habitsLoggedCount: 0})
      .returning();
    
    return {
      ...challenge,
      // @TODO: Implement caching for the implicit status
      implicitStatus: (payload: ImplicitStatusCheckPayload) => this.getRealChallengeStatus(payload, challenge),
    };
  }

  /**
   * Find a user challenge by ID and userId
   */
  async findById(id: string, userId: string): Promise<UserChallengeWithImplicitStatus | null> {
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
    
    return challenge ? {
      ...challenge,
      implicitStatus: (payload: ImplicitStatusCheckPayload) => this.getRealChallengeStatus(payload, challenge),
    } : null;
  }

  /**
   * Find all challenges for a specific user
   */
  async findByUserId(userId: string): Promise<UserChallengeWithImplicitStatus[]> {
    const challenges = await this.db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.userId, userId))
      .orderBy(userChallenges.createdAt);
    return challenges.map(challenge => ({
      ...challenge,
      implicitStatus: (payload: ImplicitStatusCheckPayload) => this.getRealChallengeStatus(payload, challenge),
    }));
  }

  /**
   * Find the active challenge for a specific user
   */
  async findActiveByUserId(userId: string): Promise<UserChallengeWithImplicitStatus | null> {
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
    
    return challenge ? {
      ...challenge,
      implicitStatus: (payload: ImplicitStatusCheckPayload) => this.getRealChallengeStatus(payload, challenge),
    } : null;
  }

  /**
   * Update a user challenge
   */
  async update(updates: UpdateUserChallenge): Promise<UserChallengeWithImplicitStatus | null> {
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
    
    return updatedChallenge ? {
      ...updatedChallenge,
      implicitStatus: (payload: ImplicitStatusCheckPayload) => this.getRealChallengeStatus(payload, updatedChallenge),
    } : null;
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
    payload: ImplicitStatusCheckPayload,
    userChallenge: Pick<UserChallenge, 'status' | 'startDate' | 'knowledgeBaseCompletedCount' | 'habitsLoggedCount'>
    ): UserChallenge['status'] {
        const { requestDate, challengeDays } = payload;
        // --- 1. Handle all "locked" and "inactive" conditions first as guard clauses ---

        // Condition A: The challenge is explicitly marked as 'locked' or 'inactive'.
        if (userChallenge.status === 'locked' || userChallenge.status === 'inactive') {
            return userChallenge.status;
        }
        const { earliestAllowedStartDate, latestDateOnEarth } = this.getInferredStatusBoundaryDates(challengeDays, requestDate);
        
        // Condition B: The challenge is outside its accessible time window (grace period).
        // This is a universal rule that can lock an otherwise active or completed challenge.
        if (earliestAllowedStartDate > userChallenge.startDate) {
            return 'locked';
        }

        // --- 2. Handle state transitions for non-locked challenges ---
        // At this point, we know the challenge is not locked. We can now evaluate its current status.

        switch (userChallenge.status) {
            case 'completed':
                // If it's already completed and not locked by the grace period, it remains completed.
                return 'completed';

            case 'active':
                // An active challenge might transition to 'completed'.
                const isComplete = userChallenge.knowledgeBaseCompletedCount >= challengeDays &&
                                userChallenge.habitsLoggedCount >= challengeDays;
                if (isComplete) {
                    return 'completed';
                }
                // Otherwise, it remains 'active'.
                return 'active';

            case 'not_started':
                // A 'not_started' challenge might transition to 'active'.
                if (latestDateOnEarth >= userChallenge.startDate) {
                    return 'active';
                }
                // Otherwise, it remains 'not_started'.
                return 'not_started';

            default:
                // This handles any unexpected status values.
                throw new Error(`Invalid or unhandled challenge status: ${userChallenge.status}`);
        }
    }

    public async batchUpdateChallengeStatuses(
        requestDate: Date,
    ) {
        const activeChallenges = this.challengeDAO.getActiveChallengesOrdered();
        for (const challenge of activeChallenges) {
          console.log(`Processing challenge: ${challenge.id}`);
          const challengeDays = challenge.durationDays;
          
          const { lockExpiredChallengesQuery, activatePendingChallengesQuery, completeActiveChallengesQuery } = this.getChallengeStatusUpdateQueries(challengeDays, requestDate);
          // @TODO: find how to batch each query in limits of 1000 or so.
          // We could utilize the dynamodb type partition space hash approach for this: 1 to 24 (on the userId)
          console.log(`Executing Lock expired challenges query: ${lockExpiredChallengesQuery.toSQL()}`);
          const lockExpiredChallengesResult = await lockExpiredChallengesQuery;
          console.log(`Lock expired challenges: ${lockExpiredChallengesResult.rowCount}`);

          console.log(`Executing Activate pending challenges query: ${activatePendingChallengesQuery.toSQL()}`);
          const activatePendingChallengesResult = await activatePendingChallengesQuery;
          console.log(`Activate pending challenges: ${activatePendingChallengesResult.rowCount}`);
          
          console.log(`Executing Complete active challenges query: ${completeActiveChallengesQuery.toSQL()}`);
          const completeActiveChallengesResult = await completeActiveChallengesQuery;
          console.log(`Complete active challenges: ${completeActiveChallengesResult.rowCount}`);
        }
    }

    /**
     * 
     * @param challengeDays 
     * @param requestDate 
     * @returns 
     * earliestAllowedStartDate The calculated date for the grace period lock check.
     * currentDateOnEarth The earliest current date anywhere on Earth, for activation checks.
     */
    private getInferredStatusBoundaryDates(
        challengeDays: number,
        requestDate: Date,
    ) {
        const { earliest: earliestAllowedStartDate } = this.dateTimeHelper.getDatesFromInstantWithOffset(
            requestDate,
            { days: -challengeDays, hours: -CHALLENGE_CONSTANTS.DEFAULT_CHALLENGE_GRACE_PERIOD_HOURS }
        );
        const { latest: latestDateOnEarth } = this.dateTimeHelper.getPossibleDatesOnEarthAtInstant(requestDate);
        return { earliestAllowedStartDate, latestDateOnEarth };
    }
    
    /**
     * Generates a sequence of Drizzle UPDATE queries to synchronize challenge statuses.
     * These queries should be executed in the returned order within a transaction.
     *
     * @param challengeDays The number of days required for challenge completion.
     * @param requestDate The request timestamp for calculations.
     * @returns An array of Drizzle promise-based queries to be executed.
     */
  private getChallengeStatusUpdateQueries(
    challengeDays: number,
    requestDate: Date
  ) {
    const { earliestAllowedStartDate, latestDateOnEarth } = this.getInferredStatusBoundaryDates(challengeDays, requestDate);
        
    /**
     * QUERY 1: Lock challenges that are outside their grace period.
     * This logic corresponds to the primary guard clause. It locks any challenge
     * (that isn't already locked or inactive) whose start date is before the earliest allowed date.
     */
    // @TODO: check the performance of this query and that they always use user_challenge_status_start_date_not_locked_inactive_index and no table scan
    // Use some constants to keep the statuses in sync with the schema.
    const lockExpiredChallengesQuery = this.db.update(userChallenges)
      .set({
        status: 'locked',
        updatedAt: requestDate,
      })
      .where(and(
        notInArray(userChallenges.status, ['locked', 'inactive']),
        lt(userChallenges.startDate, earliestAllowedStartDate)
      ));
    // Expected SQL:
    // UPDATE "user_challenges" SET "status" = 'locked', "updated_at" = $1 WHERE "status" NOT IN ('locked', 'inactive') AND "start_date" < $2
    /**
     * QUERY 2: Activate challenges that have not started yet but their start date has arrived.
     * This transitions challenges from 'not_started' to 'active'.
     */
    const activatePendingChallengesQuery = this.db.update(userChallenges)
      .set({
        status: 'active',
        updatedAt: requestDate,
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
        updatedAt: requestDate,
      })
      .where(and(
        eq(userChallenges.status, 'active'),
        gte(userChallenges.knowledgeBaseCompletedCount, challengeDays),
        gte(userChallenges.habitsLoggedCount, challengeDays)
      ));
    // Expected SQL:
    // UPDATE "user_challenges" SET "status" = 'completed', "updated_at" = $1 WHERE "status" = 'active' AND "knowledge_base_completed_count" >= $2 AND "habits_logged_count" >= $3
  
    return {
      lockExpiredChallengesQuery,
      activatePendingChallengesQuery,
      completeActiveChallengesQuery,
    };
  }
}
