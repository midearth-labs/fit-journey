import { db } from '../index';
import { users, userProfiles } from '../schema';
import { eq } from 'drizzle-orm';
import type { User, UserProfile, NewUser, NewUserProfile } from '../schema';

export class UserDAO {
  /**
   * Get user by ID with profile
   */
  async getUserWithProfile(userId: string) {
    return await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    return result || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return result || null;
  }

  /**
   * Create new user
   */
  async createUser(userData: NewUser): Promise<User[]> {
    return await db.insert(users).values(userData).returning();
  }

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User[]> {
    return await db
      .update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, userId))
      .returning();
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.user_id, userId),
    });
    return result || null;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile[]> {
    return await db
      .update(userProfiles)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(userProfiles.user_id, userId))
      .returning();
  }

  /**
   * Create or update user profile
   */
  async upsertUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile[]> {
    const existing = await this.getUserProfile(userId);
    
    if (existing) {
      return await this.updateUserProfile(userId, profileData);
    } else {
      return await db.insert(userProfiles).values({
        user_id: userId,
        ...profileData,
      }).returning();
    }
  }

  /**
   * Update user's last activity date
   */
  async updateLastActivityDate(userId: string, activityDate: Date): Promise<UserProfile[]> {
    return await this.updateUserProfile(userId, {
      last_activity_date: activityDate.toISOString().split('T')[0],
    });
  }

  /**
   * Update user's current fitness level
   */
  async updateCurrentFitnessLevel(userId: string, fitnessLevel: number): Promise<UserProfile[]> {
    return await this.updateUserProfile(userId, {
      current_fitness_level: fitnessLevel,
    });
  }

  /**
   * Update user's streak IDs
   */
  async updateCurrentStreakIds(userId: string, streakIds: {
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
    quiz_passed?: string;
    all?: string;
  }): Promise<UserProfile[]> {
    return await this.updateUserProfile(userId, {
      current_streak_ids: streakIds,
    });
  }

  /**
   * Update user's longest streaks
   */
  async updateLongestStreaks(userId: string, longestStreaks: {
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
    quiz_passed?: string;
    all?: string;
  }): Promise<UserProfile[]> {
    return await this.updateUserProfile(userId, {
      longest_streaks: longestStreaks,
    });
  }

  /**
   * Update user's latest game session
   */
  async updateLatestGameSession(userId: string, sessionId: string): Promise<UserProfile[]> {
    return await this.updateUserProfile(userId, {
      latest_game_session: sessionId,
    });
  }
}
