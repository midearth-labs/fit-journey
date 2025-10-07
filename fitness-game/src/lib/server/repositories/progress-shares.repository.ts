import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { progressShares, userMetadata, type ProgressShare, type NewProgressShare } from '$lib/server/db/schema';

export type ReactionType = 'clap' | 'muscle' | 'party';
// Omit the heavy content fields
export type ProgressShareWithoutContent = Omit<ProgressShare, 'contentVersion' | 'generatedContent'>;

export interface IProgressSharesRepository {
  create(data: NewProgressShare): Promise<{id: ProgressShare['id']}>;
  findActiveById(id: string): Promise<ProgressShare | null>;
  findByIdForUser(id: string, userId: string): Promise<ProgressShare | null>;
  findByUserId(userId: string, page?: number, limit?: number): Promise<ProgressShareWithoutContent[]>;
  findPublicSharesByShareType(shareType: ProgressShare['shareType'], page?: number, limit?: number): Promise<ProgressShareWithoutContent[]>;
  updateStatus(share: Pick<ProgressShare, 'id' | 'status' | 'isPublic' | 'updatedAt' | 'userId' | 'includeInviteLink'>): Promise<boolean>;
  incrementActiveShareReactionCount(id: string, reactionType: ReactionType, requestDate: Date): Promise<boolean>;
  delete(share: Pick<ProgressShare, 'id' | 'userId'>, requestDate: Date): Promise<boolean>;
}

export class ProgressSharesRepository implements IProgressSharesRepository {
  // Static constant to define fields without content columns
  private static readonly FIELDS_WITHOUT_CONTENT = {
    id: progressShares.id,
    userId: progressShares.userId,
    shareType: progressShares.shareType,
    shareTypeId: progressShares.shareTypeId,
    title: progressShares.title,
    includeInviteLink: progressShares.includeInviteLink,
    isPublic: progressShares.isPublic,
    status: progressShares.status,
    clapCount: progressShares.clapCount,
    muscleCount: progressShares.muscleCount,
    partyCount: progressShares.partyCount,
    createdAt: progressShares.createdAt,
    updatedAt: progressShares.updatedAt
  } as const;

  constructor(private db: NodePgDatabase<any>) {}

  async create(data: NewProgressShare): Promise<{id: ProgressShare['id']}> {
    const result = await this.db.transaction(async (tx) => {
      const [shareResult] = await tx.insert(progressShares)
        .values({...data, updatedAt: data.createdAt, clapCount: 0, muscleCount: 0, partyCount: 0, status: 'active'})
        .returning();

      // Update user metadata to increment progressShares counter
      await tx
        .update(userMetadata)
        .set({
          progressShares: sql`${userMetadata.progressShares} + 1`,
          updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${data.createdAt.toISOString()})`,
        })
        .where(eq(userMetadata.id, data.userId));

      return shareResult;
    });
    return {id: result.id};
  }

  async findActiveById(id: string): Promise<ProgressShare | null> {
    const result = await this.db.select()
      .from(progressShares)
      .where(and(
        eq(progressShares.id, id), 
        eq(progressShares.status, 'active')
      ))
      .limit(1);
    
    return result[0] || null;
  }

  async findByIdForUser(id: string, userId: string): Promise<ProgressShare | null> {
    const result = await this.db.select()
      .from(progressShares)
      .where(and(
        eq(progressShares.id, id),
        eq(progressShares.userId, userId)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  // @TODO: check the logic of limit and offset across all repositories
  async findByUserId(userId: string, page: number = 1, limit: number = 20): Promise<ProgressShareWithoutContent[]> {
    const offset = (page - 1) * limit;
    
    return await this.db.select(ProgressSharesRepository.FIELDS_WITHOUT_CONTENT)
      .from(progressShares)
      .where(and(
        eq(progressShares.userId, userId),
        eq(progressShares.status, 'active')
      ))
      .orderBy(desc(progressShares.updatedAt))
      .limit(limit)
      .offset(offset);
  }
  
  async findPublicSharesByShareType(shareType: ProgressShare['shareType'], page: number = 1, limit: number = 20): Promise<ProgressShareWithoutContent[]> {
    const offset = (page - 1) * limit;
    
    return await this.db.select(ProgressSharesRepository.FIELDS_WITHOUT_CONTENT)
      .from(progressShares)
      .where(and(
        eq(progressShares.shareType, shareType),
        eq(progressShares.status, 'active'),
        eq(progressShares.isPublic, true)
      ))
      .orderBy(desc(progressShares.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(share: Pick<ProgressShare, 'id' | 'status' | 'isPublic' | 'updatedAt' | 'userId' | 'includeInviteLink'>): Promise<boolean> {
    const result = await this.db.update(progressShares)
      .set({ 
        status: share.status,
        isPublic: share.isPublic,
        includeInviteLink: share.includeInviteLink,
        updatedAt: sql`GREATEST(${progressShares.updatedAt}, ${share.updatedAt.toISOString()})`
      })
      .where(and(
        eq(progressShares.id, share.id),
        eq(progressShares.userId, share.userId)
      ));
    
    return result.rowCount > 0;
  }

  async incrementActiveShareReactionCount(id: string, reactionType: ReactionType, requestDate: Date): Promise<boolean> {
    const fieldMap = {
      clap: { field: progressShares.clapCount, name: 'clapCount' }, 
      muscle: { field: progressShares.muscleCount, name: 'muscleCount' },
      party: { field: progressShares.partyCount, name: 'partyCount' },
    } as const;

    const incrementField = fieldMap[reactionType];
    
    const result = await this.db.update(progressShares)
      .set({ 
        [incrementField.name]: sql`${incrementField.field} + 1`,
        updatedAt: sql`GREATEST(${progressShares.updatedAt}, ${requestDate.toISOString()})`
      })
      .where(and(
        eq(progressShares.id, id),
        eq(progressShares.status, 'active')
      ));
    
    return result.rowCount > 0;
  }

  async delete(share: Pick<ProgressShare, 'id' | 'userId'>, requestDate: Date): Promise<boolean> {
    const result = await this.db.transaction(async (tx) => {
      const deleteResult = await tx.delete(progressShares)
        .where(and(
          eq(progressShares.id, share.id),
          eq(progressShares.userId, share.userId)
        ));

      // Update user metadata to decrement progressShares counter
      if (deleteResult.rowCount > 0) {
        await tx
          .update(userMetadata)
          .set({
            progressShares: sql`${userMetadata.progressShares} - 1`,
            updatedAt: sql`GREATEST(${userMetadata.updatedAt}, ${requestDate.toISOString()})`,
          })
          .where(eq(userMetadata.id, share.userId));
      }

      return deleteResult;
    });
    
    return result.rowCount > 0;
  }
}
