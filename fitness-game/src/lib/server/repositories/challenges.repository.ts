import { and, count, eq, lte, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { challenges, challengeSubscribers, type Challenge, type ChallengeSubscriber, type NewChallenge, type NewChallengeSubscriber } from '$lib/server/db/schema';
import { ValidationError } from '../shared/errors';
import type { IChallengeSubscribersRepository } from './challenge-subscribers.repository';

export type JoinedByUserMember = Pick<ChallengeSubscriber, 'id' | 'userId' | 'joinedAt' | 'dailyLogCount' | 'lastActivityDate'>;
type JoinedByUser = Pick<Challenge, 'id' | 'name' | 'status' | 'joinType' | 'startDate' | 'durationDays' | 'membersCount'> & 
    Pick<ChallengeSubscriber, 'joinedAt' | 'dailyLogCount' | 'lastActivityDate'>;

export type IChallengesRepository = {
  create(challenge: NewChallenge): Promise<{ id: string }>;
  findById(id: string): Promise<Challenge | null>;
  findByIdForUser(id: string, userId: string): Promise<Challenge | null>;
  update(id: string, updates: Partial<Challenge>): Promise<boolean>;
  delete(id: string, userId: string): Promise<boolean>;
  join(subscriber: NewChallengeSubscriber, tx?: NodePgDatabase<any>, ): Promise<{id: string}>;
  leave(challengeId: string, userId: string): Promise<boolean>;
  listPublicUpcoming(page: number, limit: number): Promise<Challenge[]>;
  listOwnedByUser(userId: string, page: number, limit: number): Promise<Challenge[]>;
  listJoinedByUserMembers(challengeId: string, userId: string, page: number, limit: number): Promise<Array<JoinedByUserMember>>;
  getJoinedByUserSubscription(challengeId: string, userId: string): Promise<JoinedByUserMember | null>;
  listJoinedByUser(userId: string, page: number, limit: number): Promise<Array<JoinedByUser>>;
};

export class ChallengesRepository implements IChallengesRepository {
  constructor(private db: NodePgDatabase<any>, private challengeSubscribersRepository: IChallengeSubscribersRepository) {}

  async create(challenge: NewChallenge): Promise<{ id: string }> {
   const newChallenge = await this.db.transaction(async (tx) => {
      const [newChallenge] = await tx
        .insert(challenges)
        // membersCount is 1 because the owner is automatically subscribed
        .values({ ...challenge, updatedAt: challenge.createdAt, membersCount: 0, status: 'not_started' })
        .returning({ id: challenges.id });

      // Auto-subscribe owner inside the same transaction
      await this.join({ challengeId: newChallenge.id, userId: challenge.ownerUserId, joinedAt: challenge.createdAt }, tx);

      return newChallenge
    });
    return newChallenge;
  }

  async findById(id: string): Promise<Challenge | null> {
    const [row] = await this.db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
    return row ?? null;
  }

  async update(id: string, updates: Partial<Challenge>): Promise<boolean> {
    if (!updates.ownerUserId) {
      throw new ValidationError('Owner user ID is required');
    }

    const res = await this.db.update(challenges)
    .set(updates)
    .where(
      and(
        eq(challenges.id, id), 
        eq(challenges.ownerUserId, updates.ownerUserId)
      )
    );
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
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
    const res = await this.db.delete(challenges).where(
      and(
        eq(challenges.id, id), 
        eq(challenges.ownerUserId, userId),
        and(
          or(
            eq(challenges.status, 'not_started'),
            eq(challenges.joinType, 'personal'),
            lte(challenges.membersCount, 1),
          )
        )
      )
    );
    return (res.rowCount ?? 0) > 0;
  }

  async join(subscriber: NewChallengeSubscriber, parentTx?: NodePgDatabase<any>): Promise<{id: string}> {
    const newSubscriber = await (parentTx ?? this.db).transaction(async (tx) => {
      const [newSubscriber] = await tx.insert(challengeSubscribers)
      .values({ ...subscriber, dailyLogCount: 0, lastActivityDate: subscriber.joinedAt })
      .returning({ id: challengeSubscribers.id });
      
      await this.incrementMembersCountTx(tx, subscriber.challengeId);
      return newSubscriber;
    });
    return newSubscriber;
  }

  async leave(challengeId: string, userId: string): Promise<boolean> {
    let affected = false;
    await this.db.transaction(async (tx) => {
      const res = await tx
        .delete(challengeSubscribers)
        .where(and(eq(challengeSubscribers.challengeId, challengeId), eq(challengeSubscribers.userId, userId)));
      const deletedCount = res.rowCount > 0;
      if (deletedCount) {
        await this.decrementMembersCountTx(tx, challengeId);
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

  async listPublicUpcoming(page: number, limit: number): Promise<Challenge[]> {
    const offset = (page - 1) * limit;
    
    // Rely on partial index for joinType = 'public'
    const rows = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.joinType, 'public'))
      .orderBy(challenges.startDate, challenges.createdAt)
      .limit(limit)
      .offset(offset);
    return rows;
  }

  async findByIdForUser(id: string, userId: string): Promise<Challenge | null> {
    const [row] = await this.db
      .select()
      .from(challenges)
      .where(and(eq(challenges.id, id), eq(challenges.ownerUserId, userId)))
      .limit(1);
    return row ?? null;
  }

  async listOwnedByUser(userId: string, page: number, limit: number): Promise<Challenge[]> {
    const offset = (page - 1) * limit;
    
    const rows = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.ownerUserId, userId))
      .orderBy(challenges.createdAt)
      .limit(limit)
      .offset(offset);
    return rows;
  }

  async listJoinedByUserMembers(challengeId: string, userId: string, page: number, limit: number): Promise<Array<JoinedByUserMember>> {
    const subscriber = await this.challengeSubscribersRepository.findByChallengeAndUser(challengeId, userId)
    if (!subscriber) throw new ValidationError('User is not a member of the challenge');

    const offset = (page - 1) * limit;

    const rows = await this.db
      .select({
        id: challengeSubscribers.id,
        userId: challengeSubscribers.userId,
        dailyLogCount: challengeSubscribers.dailyLogCount,
        joinedAt: challengeSubscribers.joinedAt,
        lastActivityDate: challengeSubscribers.lastActivityDate
      })
      .from(challengeSubscribers)
      .where(eq(challengeSubscribers.challengeId, challengeId))
      .limit(limit)
      .offset(offset);
    
    // Filter out null userIds and ensure type safety
    return rows;
  }
  
  async listJoinedByUser(userId: string, page: number, limit: number): Promise<Array<JoinedByUser>> {
    const offset = (page - 1) * limit;
    
    const rows = await this.db
      .select({
        id: challenges.id,
        name: challenges.name,
        status: challenges.status,
        joinType: challenges.joinType,
        startDate: challenges.startDate,
        durationDays: challenges.durationDays,
        membersCount: challenges.membersCount,
        joinedAt: challengeSubscribers.joinedAt,
        dailyLogCount: challengeSubscribers.dailyLogCount,
        lastActivityDate: challengeSubscribers.lastActivityDate
      })
      .from(challenges)
      .innerJoin(challengeSubscribers, eq(challenges.id, challengeSubscribers.challengeId))
      .where(eq(challengeSubscribers.userId, userId))
      .orderBy(challengeSubscribers.joinedAt)
      .limit(limit)
      .offset(offset);
    
    return rows;
  }

  async getJoinedByUserSubscription(challengeId: string, userId: string): Promise<JoinedByUserMember | null> {
    const [row] = await this.db
      .select({
        id: challengeSubscribers.id,
        userId: challengeSubscribers.userId,
        joinedAt: challengeSubscribers.joinedAt,
        dailyLogCount: challengeSubscribers.dailyLogCount,
        lastActivityDate: challengeSubscribers.lastActivityDate
      })
      .from(challengeSubscribers)
      .where(and(
        eq(challengeSubscribers.challengeId, challengeId),
        eq(challengeSubscribers.userId, userId)
      ))
      .limit(1);
    
    return row ?? null;
  }
}

