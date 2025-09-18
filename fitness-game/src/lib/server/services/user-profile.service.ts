import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IUserRepository } from '$lib/server/repositories';
import type { UpdateUserProfileDto, UserProfileResponse } from '$lib/server/shared/interfaces';
import type { User } from '../db/schema';

export type IUserProfileService = {
  updateUserProfile(dto: UpdateUserProfileDto): Promise<void>;
};

export class UserProfileService implements IUserProfileService {
  constructor(
    private readonly dependencies: {
      readonly userRepository: IUserRepository;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

    /**
     * Update the authenticated user's profile preferences
     * PATCH /users/me/profile
     */
  async updateUserProfile(dto: UpdateUserProfileDto): Promise<void> {
    const { userRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;

    // Build updates object: ignore undefined; allow null to explicitly clear fields
    const updates: Partial<User> = {};
    const allowedKeys = ['display_name', 'avatar_gender', 'avatar_age_range', 'personalizationCountryCodes', 'timezone', 'preferred_reminder_time', 'notification_preferences'] as const satisfies (keyof User & keyof UpdateUserProfileDto)[];

    const assignIfProvided = <T extends keyof User & keyof UpdateUserProfileDto>(key: T) => {
      if (dto[key] !== undefined) {
        // null is allowed and will clear the field in DB
        updates[key] = dto[key]
      }
    };

    for (const key of allowedKeys) {
        assignIfProvided(key);
    }
  
    // Always bump updated_at to request time
    updates.updated_at = requestDate;

    await userRepository.update(userId, updates);
  }
}


