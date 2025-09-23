import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { userMetadata, type UserMetadata, type NewUserMetadata, type EnabledFeatures } from '$lib/server/db/schema';

export interface IUserMetadataRepository {
  create(profileData: NewUserMetadata): Promise<{id: UserMetadata['id']}>;
  update(userMetadataId: string, updates: Partial<UserMetadata>): Promise<boolean>;
  delete(userMetadataId: string): Promise<boolean>;
  findById(userMetadataId: string): Promise<UserMetadata | null>;
  findEnabledFeatures(userId: string): Promise<EnabledFeatures | null>;
}

export class UserMetadataRepository implements IUserMetadataRepository {
  // Drizzle instance is injected
  constructor(private db: NodePgDatabase<any>) {}

  async create(profileData: NewUserMetadata): Promise<{id: UserMetadata['id']}> {
    const result = await this.db.insert(userMetadata)
      .values(profileData)
      .returning({id: userMetadata.id});
    return result[0];
  }

  async update(userMetadataId: string, updates: Partial<UserMetadata>): Promise<boolean> {
    const result = await this.db.update(userMetadata)
      .set(updates)
      .where(eq(userMetadata.id, userMetadataId));
    
    return result.rowCount > 0;
  }

  async delete(userMetadataId: string): Promise<boolean> {
    const result = await this.db.delete(userMetadata)
      .where(eq(userMetadata.id, userMetadataId));
    
    return result.rowCount > 0;
  }

  async findById(userMetadataId: string): Promise<UserMetadata | null> {
    const result = await this.db.select()
      .from(userMetadata)
      .where(eq(userMetadata.id, userMetadataId))
      .limit(1);
    
    return result[0] || null;
  }

  async findEnabledFeatures(userId: string): Promise<EnabledFeatures | null> {
    const [result] = await this.db.select({enabledFeatures: userMetadata.enabledFeatures})
      .from(userMetadata)
      .where(eq(userMetadata.id, userId))
      .limit(1);
    return result?.enabledFeatures || null;
  }
}
