import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IUserRepository } from '$lib/server/repositories';
import type { UpdateUserProfileDto, UserProfileResponse } from '$lib/server/shared/interfaces';
import type { User } from '../db/schema';
import { notFoundCheck } from '../shared/errors';
import type { IFeatureAccessControl } from '../helpers/feature-access-control.helper';

export type IUserProfileService = {
  updateUserProfile(dto: UpdateUserProfileDto): Promise<void>;
  getUserProfile(): Promise<UserProfileResponse>;
};

export class UserProfileService implements IUserProfileService {
  constructor(
    private readonly dependencies: {
      readonly userRepository: IUserRepository;
      readonly featureAccessControl: IFeatureAccessControl;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

    /**
     * Update the authenticated user's profile preferences
     * PATCH /api/v1/users/me/profile
     */
  async updateUserProfile(dto: UpdateUserProfileDto): Promise<void> {
    const { userRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;

    // Build updates object: ignore undefined; allow null to explicitly clear fields
    const updates: Partial<User> = {};
    const allowedKeys = ['displayName', 'avatarGender', 'avatarAgeRange', 'personalizationCountryCodes', 'timezone', 'preferredReminderTime', 'notificationPreferences'] as const satisfies (keyof User & keyof UpdateUserProfileDto)[];

    const assignIfProvided = <T extends keyof User & keyof UpdateUserProfileDto>(key: T) => {
      if (dto[key] !== undefined) {
        // null is allowed and will clear the field in DB
        updates[key] = dto[key]
      }
    };

    for (const key of allowedKeys) {
        assignIfProvided(key);
    }
  
    // Always bump  to request time
    updates.updatedAt = requestDate;

    await userRepository.update(userId, updates);
  }

  /**
   * Get the authenticated user's profile
   * GET /api/v1/users/me/profile
   */
  async getUserProfile(): Promise<UserProfileResponse> {
    const { userRepository, featureAccessControl } = this.dependencies;
    const { user: { id: userId } } = this.requestContext;

    const user = notFoundCheck(await userRepository.findById(userId), 'User');

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarGender: user.avatarGender,
      avatarAgeRange: user.avatarAgeRange,
      personalizationCountryCodes: user.personalizationCountryCodes,
      timezone: user.timezone,
      preferredReminderTime: user.preferredReminderTime,
      notificationPreferences: user.notificationPreferences,
      invitationCode: (await featureAccessControl.hasFeatureAccess(userId, 'shareInvitationsEnabled')) ? user.invitationCode : null,
      invitationJoinCount: user.invitationJoinCount,
    };
  }
}


