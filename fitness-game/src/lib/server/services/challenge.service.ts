import {
  type CreateUserChallengeDto,
  type UpdateUserChallengeScheduleDto,
  type UserChallengeSummaryResponse,
  type UserChallengeDetailResponse,
  type NewUserChallengeResponse,
  type AuthRequestContext,
} from '$lib/server/shared/interfaces';
import { 
  ResourceNotFoundError,
  ValidationError,
  notFoundCheck
} from '$lib/server/shared/errors';
import { type IDateTimeHelper } from '../helpers/date-time.helper';
import { type IUserChallengeRepository } from '$lib/server/repositories';
import { type UserChallenge } from '$lib/server/db/schema';


export type IChallengeService = {
    createUserChallenge(dto: CreateUserChallengeDto): Promise<NewUserChallengeResponse>;
    getUserChallenge(dto: {userChallengeId: string}): Promise<UserChallengeDetailResponse>;
    listUserChallenges(dto: {}): Promise<UserChallengeSummaryResponse[]>;
    updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<void>;
    cancelChallenge(dto: {userChallengeId: string}): Promise<void>;
    updateChallengeStatuses(): Promise<void>;
  };
  
export class ChallengeService implements IChallengeService {
  constructor(
    private readonly dependencies: {
      readonly userChallengeRepository: IUserChallengeRepository;
      readonly dateTimeHelper: IDateTimeHelper;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Create a new user challenge
   * POST /user-challenges
   */

  async createUserChallenge(dto: CreateUserChallengeDto): Promise<NewUserChallengeResponse> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { dateTimeHelper, userChallengeRepository } = this.dependencies;

    // Validate start date is within 2 weeks
    // @TODO: Convert the input Dtos to Zod schemas and validate them using Zod not here but from the API entry point.
    // @TODO: use least/greatest date helper to validate the date range
    const today = dateTimeHelper.getUtcDateString(requestDate);
    const twoWeeksFromToday = dateTimeHelper.getTwoWeeksFromTodayUtcDateString();

    if (dto.startDate < today || dto.startDate > twoWeeksFromToday) {
      throw new ValidationError('Start date must be between today and 2 weeks from now');
    }

    // Check if user already has an existing conflicting challenge for the same challenge id
    // @TODO: check if this is the right logic, i.e. if its only a challenge of the same challenge id,
    // a user can have multiple challenges of different challenge ids
    const existingActiveChallenge = await userChallengeRepository.findConflictingByUserIdAndChallengeId(userId, dto.challengeId);
    if (existingActiveChallenge) {
      throw new ValidationError('User already has an existing conflicting challenge');
    }

    // Create the challenge
    const userChallenge = await userChallengeRepository.create({
        userId,
        challengeId: dto.challengeId,
        startDate: dto.startDate,
        originalStartDate: dto.startDate,
        createdAt: requestDate,
      });

    return {id: userChallenge.id};
  }

  /**
   * Get a user challenge by ID
   * GET /user-challenges/:userChallengeId
   */
  async getUserChallenge(dto: {userChallengeId: string}): Promise<UserChallengeDetailResponse> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository } = this.dependencies;
    const userChallenge = notFoundCheck(
        await userChallengeRepository.findById(dto.userChallengeId, userId),
        'Challenge'
    );
    
    const implicitStatus = userChallenge.implicitStatus({ referenceDate: requestDate });

    return this.mapToUserChallengeResponse(userChallenge, implicitStatus);
  }

  async listUserChallenges(_: {}): Promise<UserChallengeSummaryResponse[]> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository } = this.dependencies;

    const userChallenges = await userChallengeRepository.findByUserId(userId);
    return userChallenges.map(userChallenge => {
        const implicitStatus = userChallenge.implicitStatus({ referenceDate: requestDate });
        return this.mapToUserChallengeResponse(userChallenge, implicitStatus);
    });
  }

  /**
   * Update user challenge schedule
   * PATCH /user-challenges/:userChallengeId/schedule
   */
  async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, dateTimeHelper } = this.dependencies;
    const userChallenge = notFoundCheck(
        await userChallengeRepository.findById(dto.userChallengeId, userId),
        'Challenge'
    );

    // Check if challenge is rescheduleable
    const implicitStatus = userChallenge.implicitStatus({ referenceDate: requestDate });
    if (!this.isChallengeRescheduleable(implicitStatus)) {
      throw new ValidationError('Cannot reschedule a challenge in this state');
    }

    // Validate new start date is within one month of original start date
    const oneMonthFromOriginal = dateTimeHelper.getOneMonthFromDateUtcDateString(userChallenge.originalStartDate);

    if (dto.newStartDate < userChallenge.originalStartDate || dto.newStartDate > oneMonthFromOriginal) {
      throw new ValidationError('New start date must be within one month of the originally chosen date');
    }

    // Update the challenge
    await userChallengeRepository.update({
      id: dto.userChallengeId,
      userId: userId,
      startDate: dto.newStartDate,
      updatedAt: requestDate
    });
  }

  /**
   * Cancel a user challenge
   * DELETE /user-challenges/:userChallengeId
   */
  async cancelChallenge(dto: {userChallengeId: string}): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository } = this.dependencies;

    // Cancel the challenge using the repository method
    const cancelledChallenge = await userChallengeRepository.cancel(dto.userChallengeId, userId, requestDate);
    
    if (!cancelledChallenge) {
      throw new ResourceNotFoundError('Cancellable challenge not found');
    }
  }

  /**
   * Update user challenge status helpers
   */
  //@TODO: Refactor into one method
  private isChallengeRescheduleable(status: UserChallenge['status']): boolean {
    return status === 'not_started';
  }

  /**
   * Update challenge statuses (scheduled job)
   * This method implements the challenge status update algorithm
   */
  async updateChallengeStatuses(): Promise<void> {
    // call SQL methods off the Repo
  }

  /**
   * Map database model to response DTO
   */
  private mapToUserChallengeResponse(challenge: UserChallenge, implicitStatus: UserChallenge['status']): UserChallengeSummaryResponse {
    return {
      id: challenge.id,
      challengeId: challenge.challengeId,
      userId: challenge.userId,
      startDate: challenge.startDate,
      originalStartDate: challenge.originalStartDate,
      status: implicitStatus,
      knowledgeBaseCompletedCount: challenge.knowledgeBaseCompletedCount,
      dailyLogCount: challenge.dailyLogCount,
      lastActivityDate: challenge.lastActivityDate?.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      updatedAt: challenge.updatedAt.toISOString()
    };
  }
}
