import { and, count, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { challenges, challengeSubscribers, type Challenge, type NewChallenge, type NewChallengeSubscriber } from '$lib/server/db/schema';

export type IChallengesRepository = {
  create(challenge: NewChallenge): Promise<{ id: string }>;
  findById(id: string): Promise<Challenge | null>;
  update(id: string, updates: Partial<Challenge>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  join(subscriber: NewChallengeSubscriber, tx?: NodePgDatabase<any>, ): Promise<{id: string}>;
  leave(challengeId: string, userId: string): Promise<boolean>;
  listPublicUpcoming(page: number, limit: number): Promise<Challenge[]>;
};

export class ChallengesRepository implements IChallengesRepository {
  constructor(private db: NodePgDatabase<any>) {}

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
    const res = await this.db.update(challenges).set(updates).where(eq(challenges.id, id));
    return (res.rowCount ?? 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db.delete(challenges).where(eq(challenges.id, id));
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
}


