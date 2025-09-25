import { and, eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { challengeSubscribers, type ChallengeSubscriber, type NewChallengeSubscriber } from '$lib/server/db/schema';

export type IChallengeSubscribersRepository = {
  findByChallengeAndUser(challengeId: string, userId: string): Promise<ChallengeSubscriber | null>;
  listMembers(challengeId: string): Promise<ChallengeSubscriber[]>;
  listChallengesForUser(userId: string): Promise<ChallengeSubscriber[]>;
};

export class ChallengeSubscribersRepository implements IChallengeSubscribersRepository {
  constructor(private db: NodePgDatabase<any>) {}

  async findByChallengeAndUser(challengeId: string, userId: string): Promise<ChallengeSubscriber | null> {
    const [row] = await this.db.select().from(challengeSubscribers)
    .where(and(eq(challengeSubscribers.challengeId, challengeId), eq(challengeSubscribers.userId, userId))).limit(1);
    return row ?? null;
  }

  async listChallengesForUser(userId: string): Promise<ChallengeSubscriber[]> {
    const rows = await this.db.select().from(challengeSubscribers)
    .where(eq(challengeSubscribers.userId, userId))
    .orderBy(desc(challengeSubscribers.joinedAt));
    return rows;
  }

  async listMembers(challengeId: string): Promise<ChallengeSubscriber[]> {
    const rows = await this.db.select().from(challengeSubscribers)
    .where(eq(challengeSubscribers.challengeId, challengeId));
    return rows;
  }
}


