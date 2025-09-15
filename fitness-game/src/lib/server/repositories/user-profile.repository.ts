import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { userProfiles, type UserProfile, type NewUserProfile } from '$lib/server/db/schema';

export interface IUserProfileRepository {
  create(profileData: NewUserProfile): Promise<UserProfile>;
  update(userProfileId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
  delete(userProfileId: string): Promise<boolean>;
  findById(userProfileId: string): Promise<UserProfile | null>;
}

export class UserProfileRepository implements IUserProfileRepository {
  // Drizzle instance is injected
  constructor(private db: NodePgDatabase<any>) {}

  async create(profileData: NewUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(userProfiles)
      .values(profileData)
      .returning();
    return result[0];
  }

  async update(userProfileId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const result = await this.db.update(userProfiles)
      .set(updates)
      .where(eq(userProfiles.id, userProfileId))
      .returning();
    
    return result[0] || null;
  }

  async delete(userProfileId: string): Promise<boolean> {
    const result = await this.db.delete(userProfiles)
      .where(eq(userProfiles.id, userProfileId));
    
    return result.rowCount > 0;
  }

  async findById(userProfileId: string): Promise<UserProfile | null> {
    const result = await this.db.select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userProfileId))
      .limit(1);
    
    return result[0] || null;
  }
}
