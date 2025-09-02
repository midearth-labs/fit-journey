import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { users, User, NewUser } from '@/lib/db/schema';

export interface IUserRepository {
  create(userData: NewUser): Promise<User>;
  update(userId: string, updates: Partial<User>): Promise<User | null>;
  delete(userId: string): Promise<boolean>;
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export class UserRepository implements IUserRepository {
  // Drizzle instance is injected
  constructor(private db: NodePgDatabase<any>) {}

  async create(userData: NewUser): Promise<User> {
    const result = await this.db.insert(users)
      .values(userData)
      .returning();
    return result[0];
  }

  async update(userId: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    
    return result[0] || null;
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
