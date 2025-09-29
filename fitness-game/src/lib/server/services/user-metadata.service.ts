import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IUserMetadataRepository } from '$lib/server/repositories';
import type { UserMetadataResponse } from '$lib/server/shared/interfaces';
import { notFoundCheck } from '../shared/errors';

export type IUserMetadataService = {
  getUserMetadata(): Promise<UserMetadataResponse>;
};

export class UserMetadataService implements IUserMetadataService {
  constructor(
    private readonly dependencies: {
      readonly userMetadataRepository: IUserMetadataRepository;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Get the authenticated user's metadata
   * GET /api/v1/users/me/metadata
   */
  async getUserMetadata(): Promise<UserMetadataResponse> {
    const { userMetadataRepository } = this.dependencies;
    const { user: { id: userId } } = this.requestContext;

    const userMetadata = notFoundCheck(await userMetadataRepository.findById(userId), 'User metadata');

    return {
      id: userMetadata.id,
      enabledFeatures: userMetadata.enabledFeatures,
      currentFitnessLevel: userMetadata.currentFitnessLevel,
      articlesCompleted: userMetadata.articlesCompleted,
      articlesCompletedWithPerfectScore: userMetadata.articlesCompletedWithPerfectScore,
      challengesStarted: userMetadata.challengesStarted,
      challengesJoined: userMetadata.challengesJoined,
      daysLogged: userMetadata.daysLogged,
      questionsAsked: userMetadata.questionsAsked,
      questionsAnswered: userMetadata.questionsAnswered,
      progressShares: userMetadata.progressShares,
      lastActivityDate: userMetadata.lastActivityDate?.toISOString() ?? null,
    };
  }
}
