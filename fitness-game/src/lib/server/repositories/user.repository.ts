import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, type User, type NewUser } from '$lib/server/db/schema';

export interface IUserRepository {
  update(userId: string, updates: Partial<User>): Promise<boolean>;
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface IUserInternalRepository {
  create(userData: NewUser): Promise<User>;
  delete(userId: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository, IUserInternalRepository {
  // Drizzle instance is injected
  constructor(private db: NodePgDatabase<any>) {}

  async create(userData: NewUser): Promise<User> {
    const result = await this.db.insert(users)
      .values(userData)
      .returning();
    return result[0];
  }

  async update(userId: string, updates: Partial<User>): Promise<boolean> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, userId));
    
    return result.rowCount > 0;
  }

  async delete(userId: string): Promise<boolean> {
    const result = await this.db.delete(users)
      .where(eq(users.id, userId));
    
    return result.rowCount > 0;
  }

  async findById(userId: string): Promise<User | null> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return result[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return result[0] || null;
  }
}
