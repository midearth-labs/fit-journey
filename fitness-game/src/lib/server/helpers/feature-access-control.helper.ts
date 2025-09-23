import type { EnabledFeatures } from '$lib/server/db/schema';
import type { IUserMetadataRepository } from '$lib/server/repositories/user-metadata.repository';
import { ValidationError } from '$lib/server/shared/errors';

/**
 * Typed feature keys that correspond to the EnabledFeatures type
 */
export type FeatureKey = keyof EnabledFeatures;

/**
 * Feature access control helper that determines if a user should have access to specific features
 * Currently supports user.enabledFeatures but designed to be extensible for A/B testing, dialups, etc.
 */
export interface IFeatureAccessControl {
  /**
   * Check if a user has access to a specific feature
   * @param userId - The user ID to check access for
   * @param feature - The feature key to check access for
   * @returns Promise<boolean> - true if user has access, false otherwise
   */
  hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean>;

  /**
   * Check if a user has access to a specific feature, throwing an error if not
   * @param userId - The user ID to check access for
   * @param feature - The feature key to check access for
   * @param errorMessage - Custom error message to throw if access is denied
   * @throws ValidationError if user doesn't have access to the feature
   */
  requireFeatureAccess(userId: string, feature: FeatureKey, errorMessage?: string): Promise<void>;
}

const defaultErrorMessageMap: Record<FeatureKey, string> = {
  askQuestionsEnabled: 'Ask questions feature is not enabled for your account',
  answerQuestionsEnabled: 'Answer questions feature is not enabled for your account',
  shareChallengesEnabled: 'Challenge sharing is not enabled for your account',
  shareProgressEnabled: 'Share progress feature is not enabled for your account',
  shareReactionsEnabled: 'Share reactions feature is not enabled for your account',
  shareInvitationsEnabled: 'Share invitations feature is not enabled for your account',
  progressAvatarEnabled: 'Progress avatar feature is not enabled for your account',
};

const defaultFeatureStates: Record<FeatureKey, boolean> = {
  askQuestionsEnabled: false,
  answerQuestionsEnabled: false,
  shareChallengesEnabled: true,
  shareProgressEnabled: false,
  shareReactionsEnabled: false,
  shareInvitationsEnabled: false,
  progressAvatarEnabled: false,
};

export class FeatureAccessControl implements IFeatureAccessControl {
  constructor(
    private readonly dependencies: {
      readonly userMetadataRepository: IUserMetadataRepository;
    }
  ) {}

  async hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
    // @TODO: cache this
    // Read the user's enabledFeatures from the userMetadata table
    const enabledFeatures = await this.dependencies.userMetadataRepository.findEnabledFeatures(userId);
    
    if (enabledFeatures == null) {
      return false; // User metadata not found - deny access
    }
    
    // Check if the specific feature is enabled for this user
    return Boolean(enabledFeatures[feature] ?? defaultFeatureStates[feature]);
  }

  async requireFeatureAccess(userId: string, feature: FeatureKey, errorMessage?: string): Promise<void> {
    const hasAccess = await this.hasFeatureAccess(userId, feature);
    
    if (!hasAccess) {
      const defaultMessage = defaultErrorMessageMap[feature];
      throw new ValidationError(errorMessage || defaultMessage);
    }
  }

}
