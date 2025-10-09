import { and, count, eq, lte, or, sql, lt, inArray, notInArray, desc, gte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { challenges, challengeSubscribers, userMetadata, type Challenge, type ChallengeSubscriber, type NewChallenge, type NewChallengeSubscriber } from '$lib/server/db/schema';
import { ValidationError } from '../shared/errors';
import type { IChallengeSubscribersRepository } from './challenge-subscribers.repository';
import type { ImplicitStatusCheckPayload } from '$lib/server/shared/interfaces';
import type { IDateTimeHelper } from '$lib/server/helpers/date-time.helper';
import { CHALLENGE_CONSTANTS } from '../content/types/constants';
import type { AllLogKeysType } from '$lib/config/constants';

export type JoinedByUserMember = Pick<ChallengeSubscriber, 'id' | 'userId' | 'joinedAt' | 'shareLogKeys'>;
type UpdateChallenge = Pick<Challenge, 'id'> & Omit<NewChallenge, 'createdAt'>;

type JoinedByUser = Pick<Challenge, 'id' | 'name' | 'status' | 'joinType' | 'startDate' | 'durationDays' | 'endDate' | 'membersCount' | 'logTypes'> & 
    Pick<ChallengeSubscriber, 'joinedAt' | 'shareLogKeys'>;

// Enriched types with implicit status
export type ChallengeWithImplicitStatus = Challenge & {
  implicitStatus: (payload: Pick<ImplicitStatusCheckPayload, 'referenceDate'>) => Challenge['status'];
};

export type JoinedByUserWithImplicitStatus = JoinedByUser & {
  implicitStatus: (payload: Pick<ImplicitStatusCheckPayload, 'referenceDate'>) => Challenge['status'];
};

export type IChallengesRepository = {
  create(challenge: NewChallenge): Promise<{ id: string }>;
  findById(id: string): Promise<ChallengeWithImplicitStatus | null>;
  findByIdForUser(id: string, userId: string): Promise<ChallengeWithImplicitStatus | null>;
  update(id: string, updates: UpdateChallenge, requestDate: Date): Promise<boolean>;
  delete(id: string, userId: string, requestDate: Date): Promise<boolean>;
  join(subscriber: NewChallengeSubscriber, tx?: NodePgDatabase<any>, ): Promise<{id: string}>;
  leave(challengeId: string, userId: string, requestDate: Date): Promise<boolean>;
  listPublicUpcoming(page: number, limit: number): Promise<ChallengeWithImplicitStatus[]>;
  listOwnedByUser(userId: string, page: number, limit: number): Promise<ChallengeWithImplicitStatus[]>;
  listJoinedByUserMembers(challengeId: string, userId: string, page: number, limit: number): Promise<Array<JoinedByUserMember>>;
  getJoinedByUserSubscription(challengeId: string, userId: string): Promise<JoinedByUserMember | null>;
  updateJoinedByUserSubscription(challengeId: string, userId: string, shareLogKeys: AllLogKeysType[], requestDate: Date): Promise<boolean>;
  listJoinedByUser(userId: string, page: number, limit: number, fromDate?: string, toDate?: string): Promise<Array<JoinedByUserWithImplicitStatus>>;
  batchUpdateChallengeStatusesLimit(requestDate: Date, limit: number): Promise<void>;
};

export class ChallengesRepository implements IChallengesRepository {
  constructor(private db: NodePgDatabase<any>, private challengeSubscribersRepository: IChallengeSubscribersRepository, private dateTimeHelper: IDateTimeHelper) {}

  // Helper method to create implicit status callback
  private createImplicitStatusCallback(challenge: Pick<Challenge, 'id' | 'status' | 'startDate' | 'durationDays'>) {
    return (payload: Pick<ImplicitStatusCheckPayload, 'referenceDate'>) => 
      this.getRealChallengeStatus({ ...payload, challengeId: challenge.id }, challenge);
  }

  async create(challenge: NewChallenge): Promise<{ id: string }> {
   const newChallenge = await this.db.transaction(async (tx) => {
      const [newChallenge] = await tx
        .insert(challenges)
        // membersCount is 1 because the owner is automatically subscribed
        .values({
          ...challenge, 
          updatedAt: challenge.createdAt, membersCount: 0, status: 'not_started', 
          endDate: this.dateTimeHelper.daysOffsetFromDateOnly(challenge.startDate, challenge.durationDays) 
        })
        .returning({ id: challenges.id });

      // Auto-subscribe owner inside the same transaction
      await this.join({ challengeId: newChallenge.id, userId: challenge.userId, joinedAt: challenge.createdAt, shareLogKeys: [] }, tx);

      // Update user metadata to increment challengesStarted counter
      await tx
        .update(userMetadata)
        .set({
          challengesStarted: sql`${userMetadata.challengesStarted} + 1`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${challenge.createdAt.toISOString()})`,
        })
        .where(eq(userMetadata.id, challenge.userId));
      

      return newChallenge
    });
    return newChallenge;
  }

  async findById(id: string): Promise<ChallengeWithImplicitStatus | null> {
    const [row] = await this.db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    return row ? {
      ...row,
      implicitStatus: this.createImplicitStatusCallback(row)
    } : null;
  }

  async update(id: string, updates: UpdateChallenge, requestDate: Date): Promise<boolean> {
    if (!updates.userId) {
      throw new ValidationError('Owner user ID is required');
    }

    const res = await this.db.update(challenges)
    .set({ 
      ...updates, 
      updatedAt: requestDate, 
      endDate: this.dateTimeHelper.daysOffsetFromDateOnly(updates.startDate, updates.durationDays) 
    })
    .where(
      and(
        eq(challenges.id, id), 
        eq(challenges.userId, updates.userId)
      )
    );
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: string, userId: string, requestDate: Date): Promise<boolean> {
    // @TODO: make sure this logic is synced up with the service layer deleteUserChallenge
    // SQL equivalent:
    // DELETE FROM challenges 
    // WHERE id = $1 
    //   AND owner_user_id = $2 
    //   AND (
    //     status = 'not_started' 
    //     OR join_type = 'personal' 
    //     OR members_count <= 1
    //   );
    const result = await this.db.transaction(async (tx) => {
      const deleteResult = await tx.delete(challenges).where(
        and(
          eq(challenges.id, id), 
          eq(challenges.userId, userId),
          and(
            or(
              eq(challenges.status, 'not_started'),
              eq(challenges.joinType, 'personal'),
              lte(challenges.membersCount, 1),
            )
          )
        )
      );

      // Update user metadata to decrement challengesStarted counter
      if (deleteResult.rowCount > 0) {
        await tx
          .update(userMetadata)
          .set({
            challengesStarted: sql`${userMetadata.challengesStarted} - 1`,
            updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${requestDate.toISOString()})`,
          })
          .where(eq(userMetadata.id, userId));
      }

      return deleteResult;
    });
    return (result.rowCount ?? 0) > 0;
  }

  async join(subscriber: NewChallengeSubscriber, parentTx?: NodePgDatabase<any>): Promise<{id: string}> {
    const newSubscriber = await (parentTx ?? this.db).transaction(async (tx) => {
      const [newSubscriber] = await tx.insert(challengeSubscribers)
      .values({ ...subscriber })
      .returning({ id: challengeSubscribers.id });
      
      await this.incrementMembersCountTx(tx, subscriber.challengeId);

      // Update user metadata to increment challengesJoined counter
      await tx
        .update(userMetadata)
        .set({
          challengesJoined: sql`${userMetadata.challengesJoined} + 1`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${subscriber.joinedAt.toISOString()})`,
        })
        .where(eq(userMetadata.id, subscriber.userId));

      return newSubscriber;
    });
    return newSubscriber;
  }

  async leave(challengeId: string, userId: string, requestDate: Date): Promise<boolean> {
    let affected = false;
    await this.db.transaction(async (tx) => {
      const deleteResult = await tx
        .delete(challengeSubscribers)
        .where(and(eq(challengeSubscribers.challengeId, challengeId), eq(challengeSubscribers.userId, userId)));
      if (deleteResult.rowCount > 0) {
        await this.decrementMembersCountTx(tx, challengeId);

        // Update user metadata to decrement challengesJoined counter
        await tx
          .update(userMetadata)
          .set({
            challengesJoined: sql`${userMetadata.challengesJoined} - 1`,
            updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${requestDate.toISOString()})`,
          })
          .where(eq(userMetadata.id, userId));

        affected = true;
      }
    });
    return affected;
  }

  private async incrementMembersCountTx(tx: NodePgDatabase<any>, challengeId: string): Promise<void> {
    await this.addToMembersCountTx(tx, challengeId, 1);
  }

  private async addToMembersCountTx(tx: NodePgDatabase<any>, challengeId: string, count: number): Promise<void> {
    
    await tx.update(challenges)
    .set({ 
      membersCount: sql`${challenges.membersCount} + ${count}`,
    })
    .where(eq(challenges.id, challengeId));
  }

  private async decrementMembersCountTx(tx: NodePgDatabase<any>, challengeId: string): Promise<void> {
    await this.addToMembersCountTx(tx, challengeId, -1);
  }

  async listPublicUpcoming(page: number, limit: number): Promise<ChallengeWithImplicitStatus[]> {
    const offset = (page - 1) * limit;
    
    // Rely on partial index for joinType = 'public'
    const rows = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.joinType, 'public'))
      .orderBy(challenges.startDate, challenges.createdAt)
      .limit(limit)
      .offset(offset);
    return rows.map(row => ({
      ...row,
      implicitStatus: this.createImplicitStatusCallback(row)
    }));
  }

  async findByIdForUser(id: string, userId: string): Promise<ChallengeWithImplicitStatus | null> {
    const [row] = await this.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.id, id), eq(challenges.userId, userId)))
      .limit(1);
    return row ? {
      ...row,
      implicitStatus: this.createImplicitStatusCallback(row)
    } : null;
  }

  async listOwnedByUser(userId: string, page: number, limit: number): Promise<ChallengeWithImplicitStatus[]> {
    const offset = (page - 1) * limit;
    
    const rows = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.userId, userId))
      .orderBy(challenges.createdAt)
      .limit(limit)
      .offset(offset);
    return rows.map(row => ({
      ...row,
      implicitStatus: this.createImplicitStatusCallback(row)
    }));
  }

  async listJoinedByUserMembers(challengeId: string, userId: string, page: number, limit: number): Promise<Array<JoinedByUserMember>> {
    const subscriber = await this.challengeSubscribersRepository.findByChallengeAndUser(challengeId, userId)
    if (!subscriber) throw new ValidationError('User is not a member of the challenge');

    const offset = (page - 1) * limit;

    const rows = await this.db
      .select({
        id: challengeSubscribers.id,
        userId: challengeSubscribers.userId,
        joinedAt: challengeSubscribers.joinedAt,
        shareLogKeys: challengeSubscribers.shareLogKeys
      })
      .from(challengeSubscribers)
      .where(eq(challengeSubscribers.challengeId, challengeId))
      .limit(limit)
      .offset(offset);
    
    // Filter out null userIds and ensure type safety
    return rows;
  }
  
  async listJoinedByUser(userId: string, page: number, limit: number, fromDate?: string, toDate?: string): Promise<Array<JoinedByUserWithImplicitStatus>> {
    const offset = (page - 1) * limit;
    const whereClause = [
      eq(challengeSubscribers.userId, userId),
      // Overlap condition: challenge window [startDate, endDate] intersects [fromDate, toDate]
      // If only fromDate is provided → endDate >= fromDate
      ...(fromDate ? [lte(challenges.endDate, fromDate)] : []),
      // If only toDate is provided → startDate <= toDate
      ...(toDate ? [lte(challenges.startDate, toDate)] : []),
    ];
    
    const rows = await this.db
      .select({
        id: challenges.id,
        name: challenges.name,
        status: challenges.status,
        joinType: challenges.joinType,
        startDate: challenges.startDate,
        durationDays: challenges.durationDays,
        endDate: challenges.endDate,
        membersCount: challenges.membersCount,
        logTypes: challenges.logTypes,
        joinedAt: challengeSubscribers.joinedAt,
        shareLogKeys: challengeSubscribers.shareLogKeys
      })
      .from(challenges)
      .innerJoin(challengeSubscribers, eq(challenges.id, challengeSubscribers.challengeId))
      .where(and(...whereClause))
      .orderBy(desc(challengeSubscribers.joinedAt))
      .limit(limit)
      .offset(offset);
    
    return rows.map(row => ({
      ...row,
      implicitStatus: this.createImplicitStatusCallback(row)
    }));
  }

  async getJoinedByUserSubscription(challengeId: string, userId: string): Promise<JoinedByUserMember | null> {
    const [row] = await this.db
      .select({
        id: challengeSubscribers.id,
        userId: challengeSubscribers.userId,
        joinedAt: challengeSubscribers.joinedAt,
        shareLogKeys: challengeSubscribers.shareLogKeys
      })
      .from(challengeSubscribers)
      .where(and(
        eq(challengeSubscribers.challengeId, challengeId),
        eq(challengeSubscribers.userId, userId)
      ))
      .limit(1);
    
    return row ?? null;
  }

  async updateJoinedByUserSubscription(challengeId: string, userId: string, shareLogKeys: AllLogKeysType[], requestDate: Date): Promise<boolean> {
    const result = await this.db
      .update(challengeSubscribers)
      .set({
        shareLogKeys: shareLogKeys,
      })
      .where(and(
        eq(challengeSubscribers.challengeId, challengeId),
        eq(challengeSubscribers.userId, userId)
      ));
    
    return result.rowCount > 0;
  }

  private isChallengeLoggable(status: Challenge['status']): boolean {
    return ['active', 'completed'].includes(status);
  }

  private getRealChallengeStatus(
    payload: ImplicitStatusCheckPayload,
    challenge: Pick<Challenge, 'status' | 'startDate' | 'durationDays'>
  ): Challenge['status'] {
    const { referenceDate: requestDate } = payload;

    // Guard: explicit locked or inactive remain as-is
    if (challenge.status === 'locked' || challenge.status === 'inactive') {
      return challenge.status;
    }

    const { earliestAllowedStartDate, latestDateOnEarth, earliestDateOnEarth } = this.getInferredStatusBoundaryDates(challenge.durationDays, requestDate);

    // Outside grace window → locked
    if (earliestAllowedStartDate >= challenge.startDate) {
      return 'locked';
    }

    // State transitions for non-locked
    switch (challenge.status) {
      case 'completed':
        return 'completed';
      case 'active': {
        // start_date <= earliestDateOnEarth - durationDays days
        // We use: start_date <= (DATE ${earliestDateOnEarth}) - (interval '1 day' * ${challenges.durationDays})
        
        // Consider a challenge completed when its end date has passed globally
        const endDate = this.dateTimeHelper.daysOffsetFromDateOnly(earliestDateOnEarth, - challenge.durationDays);
        if (challenge.startDate <= endDate) {
          return 'completed';
        }
        return 'active';
      }
      case 'not_started':
        if (latestDateOnEarth >= challenge.startDate) {
          return 'active';
        }
        return 'not_started';
      default:
        throw new Error(`Invalid or unhandled challenge status: ${challenge.status}`);
    }
  }

  public async batchUpdateChallengeStatuses(requestDate: Date): Promise<void> {
    // Compute boundary dates once
    // We'll operate on all challenges regardless of duration; completion uses durationDays per row is not directly expressible
    // We update per-rule where possible with available columns
    // @TODO: use some artificial maxbound date based on today and max durationDays to set a limit on the queries
    // to help range-scan performance
    const { earliestDateOnEarthWithGrace, earliestDateOnEarth, latestDateOnEarth } = this.getInferredStatusBoundaryDatesForBatchUpdate(requestDate);
     
    // 1) Lock expired challenges (outside grace period): startDate <= earliestDateOnEarthWithGrace
    await this.db.update(challenges)
      .set({ status: 'locked', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
      .where(and(
        // status NOT IN ('locked','inactive')
        notInArray(challenges.status, ['locked', 'inactive']),
        // start_date <= earliestDateOnEarthWithGrace - durationDays days
        // We use: start_date <= (DATE ${earliestDateOnEarthWithGrace}) - (interval '1 day' * ${challenges.durationDays})
        lte(challenges.startDate, sql`(DATE ${earliestDateOnEarthWithGrace}) - (interval '1 day' * ${challenges.durationDays})`)
      ));

    // 2) Activate pending challenges: not_started and startDate <= latestDateOnEarth
    await this.db.update(challenges)
      .set({ status: 'active', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
      .where(and(
        eq(challenges.status, 'not_started'),
        lte(challenges.startDate, latestDateOnEarth)
      ));

    // 3) Complete active challenges when end date has passed globally: startDate + durationDays <= earliestDateOnEarth
    await this.db.update(challenges)
      .set({ status: 'completed', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
      .where(and(
        eq(challenges.status, 'active'),
        // start_date <= earliestDateOnEarth - durationDays days
        // We use: start_date <= (DATE ${earliestDateOnEarth}) - (interval '1 day' * ${challenges.durationDays})
        lte(challenges.startDate, sql`(DATE ${earliestDateOnEarth}) - (interval '1 day' * ${challenges.durationDays})`)
      ));
  }

  public async batchUpdateChallengeStatusesLimit(requestDate: Date, limit: number): Promise<void> {
    // Compute boundary dates once (same as full-batch version)
    const { earliestDateOnEarthWithGrace, earliestDateOnEarth, latestDateOnEarth } = this.getInferredStatusBoundaryDatesForBatchUpdate(requestDate);

    // 1) Lock expired challenges (outside grace period)
    {
      const toUpdate = this.db.$with('to_update_lock').as(
        this.db
          .select({ id: challenges.id })
          .from(challenges)
          .where(and(
            notInArray(challenges.status, ['locked', 'inactive']),
            lte(challenges.startDate, sql`(DATE ${earliestDateOnEarthWithGrace}) - (interval '1 day' * ${challenges.durationDays})`)
          ))
          .orderBy(challenges.id)
          .limit(limit)
          .for('update', { skipLocked: true })
      );

      await this.db
        .with(toUpdate)
        .update(challenges)
        .set({ status: 'locked', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
        .where(sql`${challenges.id} in (select id from ${toUpdate})`);
    }

    // 2) Activate pending challenges
    {
      const toUpdate = this.db.$with('to_update_activate').as(
        this.db
          .select({ id: challenges.id })
          .from(challenges)
          .where(and(
            eq(challenges.status, 'not_started'),
            lte(challenges.startDate, latestDateOnEarth)
          ))
          .orderBy(challenges.id)
          .limit(limit)
          .for('update', { skipLocked: true })
      );

      await this.db
        .with(toUpdate)
        .update(challenges)
        .set({ status: 'active', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
        .where(sql`${challenges.id} in (select id from ${toUpdate})`);
    }

    // 3) Complete active challenges when end date has passed globally
    {
      const toUpdate = this.db.$with('to_update_complete').as(
        this.db
          .select({ id: challenges.id })
          .from(challenges)
          .where(and(
            eq(challenges.status, 'active'),
            lte(challenges.startDate, sql`(DATE ${earliestDateOnEarth}) - (interval '1 day' * ${challenges.durationDays})`)
          ))
          .orderBy(challenges.id)
          .limit(limit)
          .for('update', { skipLocked: true })
      );

      await this.db
        .with(toUpdate)
        .update(challenges)
        .set({ status: 'completed', updatedAt: sql`GREATEST(${challenges.updatedAt}, ${requestDate.toISOString()})` })
        .where(sql`${challenges.id} in (select id from ${toUpdate})`);
    }
  }

    /**
     * 
     * @param challengeDays 
     * @param requestDate 
     * @returns 
     * earliestAllowedStartDate The calculated date for the grace period lock check.
     * latestDateOnEarth The earliest current date anywhere on Earth, for activation checks.
     */
    private getInferredStatusBoundaryDates(
      challengeDays: number,
      requestDate: Date,
  ) {
      const { earliest: earliestAllowedStartDate } = this.dateTimeHelper.getDatesFromInstantWithOffset(
          requestDate,
          { days: -challengeDays, hours: -CHALLENGE_CONSTANTS.DEFAULT_CHALLENGE_GRACE_PERIOD_HOURS }
      );
      const { latest: latestDateOnEarth, earliest: earliestDateOnEarth } = this.dateTimeHelper.getPossibleDatesOnEarthAtInstant(requestDate);
      return { earliestAllowedStartDate, latestDateOnEarth, earliestDateOnEarth };
  }

/**
 * For the batch update, we don't need to pass the challengeDays because we will 
 * dynamically inject it in the queries
 * @param requestDate 
 * @returns 
 */
  private getInferredStatusBoundaryDatesForBatchUpdate(
    requestDate: Date,
) {
    const { earliestAllowedStartDate, latestDateOnEarth, earliestDateOnEarth } = this.getInferredStatusBoundaryDates(0, requestDate);
    
    return { earliestDateOnEarthWithGrace: earliestAllowedStartDate, latestDateOnEarth, earliestDateOnEarth };
}
}

