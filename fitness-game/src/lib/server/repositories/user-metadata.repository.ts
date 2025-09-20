import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { userMetadata, type UserMetadata, type NewUserMetadata } from '$lib/server/db/schema';

export interface IUserMetadataRepository {
  create(profileData: NewUserMetadata): Promise<{id: UserMetadata['id']}>;
  update(UserMetadataId: string, updates: Partial<UserMetadata>): Promise<boolean>;
  delete(UserMetadataId: string): Promise<boolean>;
  findById(UserMetadataId: string): Promise<UserMetadata | null>;
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

  async update(UserMetadataId: string, updates: Partial<UserMetadata>): Promise<boolean> {
    const result = await this.db.update(userMetadata)
      .set(updates)
      .where(eq(userMetadata.id, UserMetadataId));
    
    return result.rowCount > 0;
  }

  async delete(UserMetadataId: string): Promise<boolean> {
    const result = await this.db.delete(userMetadata)
      .where(eq(userMetadata.id, UserMetadataId));
    
    return result.rowCount > 0;
  }

  async findById(UserMetadataId: string): Promise<UserMetadata | null> {
    const result = await this.db.select()
      .from(userMetadata)
      .where(eq(userMetadata.id, UserMetadataId))
      .limit(1);
    
    return result[0] || null;
  }
}
