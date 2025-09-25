import { 
  type AuthRequestContext,
  type CreateUserChallengeDto,
  type UpdateUserChallengeDto,
  type JoinChallengeDto,
  type LeaveChallengeDto,
  type GetChallengeDto,
  type ListPublicChallengesDto,
  type CreateUserChallengeResponse,
  type JoinChallengeResponse,
  type ChallengeResponse,
  type ListChallengeResponse,
  type GetUserChallengeDto,
  type ListChallengesOwnedByUserDto,
  type ListChallengeJoinedByUserMembersDto,
  type GetChallengeJoinedByUserSubscriptionDto,
  type ListChallengesJoinedByUserDto,
  type DeleteUserChallengeDto,
  type GetUserChallengeResponse,
  type ListChallengesOwnedByUserResponse,
  type ListChallengeJoinedByUserMembersResponse,
  type GetChallengeJoinedByUserSubscriptionResponse,
  type ListChallengesJoinedByUserResponse,
  type UpdateUserChallengeResponse,
  type LeaveChallengeOperationResponse,
  type DeleteUserChallengeOperationResponse,
} from '$lib/server/shared/interfaces';
import { type ChallengeWithImplicitStatus, type IChallengesRepository, type IChallengeSubscribersRepository } from '$lib/server/repositories';
import { type Challenge, type NewChallenge } from '$lib/server/db/schema';
import { notFoundCheck, ValidationError } from '../shared/errors';
import type { IDateTimeHelper } from '../helpers';

export type IChallengesService = {
  createUserChallenge(dto: CreateUserChallengeDto): Promise<CreateUserChallengeResponse>;
  updateUserChallenge(dto: UpdateUserChallengeDto): Promise<void>;
  joinChallenge(dto: JoinChallengeDto): Promise<JoinChallengeResponse>;
  leaveChallenge(dto: LeaveChallengeDto): Promise<void>;
  getChallenge(dto: GetChallengeDto): Promise<ChallengeResponse>;
  listPublicChallenges(dto: ListPublicChallengesDto): Promise<ListChallengeResponse[]>;
  // User challenge management methods
  getUserChallenge(dto: GetUserChallengeDto): Promise<GetUserChallengeResponse>;
  listChallengesOwnedByUser(dto: ListChallengesOwnedByUserDto): Promise<ListChallengesOwnedByUserResponse[]>;
  listChallengeJoinedByUserMembers(dto: ListChallengeJoinedByUserMembersDto): Promise<ListChallengeJoinedByUserMembersResponse[]>;
  getChallengeJoinedByUserSubscription(dto: GetChallengeJoinedByUserSubscriptionDto): Promise<GetChallengeJoinedByUserSubscriptionResponse>;
  listChallengesJoinedByUser(dto: ListChallengesJoinedByUserDto): Promise<ListChallengesJoinedByUserResponse[]>;
  deleteUserChallenge(dto: DeleteUserChallengeDto): Promise<void>;
};

export class ChallengesService implements IChallengesService {
  constructor(
    private readonly dependencies: {
      readonly challengesRepository: IChallengesRepository;
      readonly challengeSubscribersRepository: IChallengeSubscribersRepository;
      readonly dateTimeHelper: IDateTimeHelper;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Create a new challenge and auto-subscribe the owner
   * POST /api/v1/users/me/challenges
   */
  async createUserChallenge(dto: CreateUserChallengeDto): Promise<CreateUserChallengeResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { dateTimeHelper } = this.dependencies;
    // @TODO: extract these to constants or put the default value in schema
    const maxMembers = dto.joinType === 'personal' ? 1 : (dto.maxMembers);

    // Validate startDate is not in the past anywhere in the world
    const { latest: latestPossibleDate } = dateTimeHelper.getPossibleDatesOnEarthAtInstant(dateTimeHelper.getUtcNow());
    if (dto.startDate < latestPossibleDate) {
      throw new ValidationError('Start date must be a future date');
    }

    const payload: NewChallenge = {
      ownerUserId: userId,
      name: dto.name,
      description: dto.description,
      goals: dto.goals,
      joinType: dto.joinType,
      startDate: dto.startDate,
      durationDays: dto.durationDays,
      maxMembers,
      createdAt: requestDate,
    };

    const created = await this.dependencies.challengesRepository.create(payload);
    return created;
  }

  /**
   * Update a challenge before start and before any member joins
   * PATCH /api/v1/users/me/challenges/:challengeId
   */
  async updateUserChallenge(dto: UpdateUserChallengeDto): Promise<UpdateUserChallengeResponse> {
    const { requestDate } = this.requestContext;
    const { challengesRepository, dateTimeHelper } = this.dependencies;

    const { challengeId, ...updates } = dto;
    const challenge = notFoundCheck(await challengesRepository.findById(dto.challengeId), 'Challenge');
    
    // Similar to join logic, check if challenge has already started
    if (challenge.implicitStatus({ referenceDate: requestDate }) !== 'not_started') {
      throw new ValidationError('Challenge is not editable anymore');
    }

    // Validate startDate is not in the past anywhere in the world
    const { latest: latestPossibleDate } = dateTimeHelper.getPossibleDatesOnEarthAtInstant(dateTimeHelper.getUtcNow());
    if (updates.startDate < latestPossibleDate) {
      throw new ValidationError('Start date must be a future date');
    }

    if (updates.joinType === 'personal') {
      updates.maxMembers = 1;
    }

    if (updates.maxMembers < challenge.membersCount) {
      throw new ValidationError('Max members cannot be less than the current members count');
    }

    // Service-level validation will be added later (lock checks, deprecated goals, etc.)
    await this.dependencies.challengesRepository.update(challengeId, { ...updates, updatedAt: requestDate });
  }

  /**
   * Join a challenge (public or invite-code) before start
   * POST /api/v1/challenges/:challengeId/join
   */
  async joinChallenge(dto: JoinChallengeDto): Promise<JoinChallengeResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { challengesRepository, challengeSubscribersRepository } = this.dependencies;

    const challenge = notFoundCheck(await challengesRepository.findById(dto.challengeId), 'Challenge');
    const existingSubscription = await challengeSubscribersRepository.findByChallengeAndUser(dto.challengeId, userId);
    if (existingSubscription) return { id: existingSubscription.id };

    // @TODO: this must be the implicit status check
    // No joins after startDate or completed, locked etc.
    if (challenge.implicitStatus({ referenceDate: requestDate }) !== 'not_started') {
      throw new ValidationError('Challenge cannot be joined at the moment');
    }

    if (challenge.joinType === 'personal') throw new ValidationError('Personal challenges are not joinable');
    if (challenge.joinType === 'invite-code' && dto.inviteCode !== challenge.inviteCode) {
      throw new ValidationError('Challenge requires a valid invite code');
    }

    if (challenge.membersCount >= challenge.maxMembers) throw new ValidationError('Challenge is at maximum capacity');

    return await challengesRepository.join({ challengeId: dto.challengeId, userId, joinedAt: requestDate });
  }

  /**
   * Leave a challenge (removes the subscription)
   * POST /api/v1/challenges/:challengeId/leave
   */
  async leaveChallenge(dto: LeaveChallengeDto): Promise<LeaveChallengeOperationResponse> {
    const { user: { id: userId } } = this.requestContext;
    const { challengesRepository } = this.dependencies;

    // Check if the challenge exists and get its details
    const challenge = notFoundCheck(await challengesRepository.findById(dto.challengeId), 'Challenge');

    // Prevent owner from leaving their own challenge
    if (challenge.ownerUserId === userId) {
      throw new ValidationError('Challenge owners cannot leave their own challenge');
    }

    await challengesRepository.leave(dto.challengeId, userId);
  }

  /**
   * Get a challenge by ID
   * GET /api/v1/challenges/:challengeId
   */
  async getChallenge(dto: GetChallengeDto): Promise<ChallengeResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const challenge = notFoundCheck(await(async () => { 
      const challenge = await this.dependencies.challengesRepository.findById(dto.challengeId);
      if (challenge && challenge.joinType === 'personal' && challenge.ownerUserId !== userId) return null;
      return challenge;
    }
    )(), 'Challenge');

    return this.mapToChallengeResponse(challenge, requestDate);
  }

  /**
   * List public challenges (upcoming/ongoing policy handled in repo)
   * GET /api/v1/challenges
   */
  async listPublicChallenges(dto: ListPublicChallengesDto): Promise<ListChallengeResponse[]> {
    const { page, limit } = dto;
    const { requestDate } = this.requestContext;
    const challenges = await this.dependencies.challengesRepository.listPublicUpcoming(page, limit);
    return challenges.map(challenge => this.mapToChallengeResponse(challenge, requestDate));
  }

  /**
   * Get a challenge by its ID (owned by user)
   * GET /api/v1/users/me/challenges/:challengeId
   */
  async getUserChallenge(dto: GetUserChallengeDto): Promise<GetUserChallengeResponse> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;

    const challenge = notFoundCheck(
      await challengesRepository.findByIdForUser(dto.challengeId, userId),
      'Challenge'
    );

    return this.mapToChallengeResponse(challenge, requestDate);
  }

  /**
   * List challenges owned by the authenticated user
   * GET /api/v1/users/me/challenges/owned
   */
  async listChallengesOwnedByUser(dto: ListChallengesOwnedByUserDto): Promise<ListChallengesOwnedByUserResponse[]> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { page, limit } = dto;


    const challenges = await challengesRepository.listOwnedByUser(userId, page, limit);
    return challenges.map(challenge => this.mapToChallengeResponse(challenge, requestDate));
  }

  /**
   * List members of a challenge (only if user is a member of the challenge)
   * GET /api/v1/users/me/challenges/joined/:challengeId/members
   */
  async listChallengeJoinedByUserMembers(dto: ListChallengeJoinedByUserMembersDto): Promise<ListChallengeJoinedByUserMembersResponse[]> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId } } = this.requestContext;
    const { page, limit } = dto;

    const members = await challengesRepository.listJoinedByUserMembers(dto.challengeId, userId, page, limit);

    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      joinedAt: member.joinedAt.toISOString(),
      dailyLogCount: member.dailyLogCount,
    }));
  }

  /**
   * Get user's subscription to a challenge (only if user is a member of the challenge)
   * GET /api/v1/users/me/challenges/joined/:challengeId/subscription
   */
  async getChallengeJoinedByUserSubscription(dto: GetChallengeJoinedByUserSubscriptionDto): Promise<GetChallengeJoinedByUserSubscriptionResponse> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId } } = this.requestContext;

    const subscription = notFoundCheck(
      await challengesRepository.getJoinedByUserSubscription(dto.challengeId, userId),
      'Challenge subscription'
    );

    return {
      id: subscription.id,
      joinedAt: subscription.joinedAt.toISOString(),
      dailyLogCount: subscription.dailyLogCount,
      lastActivityDate: subscription.lastActivityDate?.toISOString()
    };
  }

  /**
   * List challenges joined by the authenticated user
   * GET /api/v1/users/me/challenges/joined
   */
  async listChallengesJoinedByUser(dto: ListChallengesJoinedByUserDto): Promise<ListChallengesJoinedByUserResponse[]> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { page, limit } = dto;

    const challenges = await challengesRepository.listJoinedByUser(userId, page, limit);
    return challenges.map(challenge => ({
      id: challenge.id,
      name: challenge.name,
      status: challenge.implicitStatus({ referenceDate: requestDate }),
      joinType: challenge.joinType,
      startDate: challenge.startDate,
      durationDays: challenge.durationDays,
      membersCount: challenge.membersCount,
      joinedAt: challenge.joinedAt.toISOString(),
      dailyLogCount: challenge.dailyLogCount,
      lastActivityDate: challenge.lastActivityDate?.toISOString()
    }));
  }

  /**
   * Delete a user challenge (only if conditions are met)
   * DELETE /api/v1/users/me/challenges/:challengeId
   */
  async deleteUserChallenge(dto: DeleteUserChallengeDto): Promise<DeleteUserChallengeOperationResponse> {
    const { challengesRepository } = this.dependencies;
    const { user: { id: userId } } = this.requestContext;
    const challenge = notFoundCheck(await challengesRepository.findByIdForUser(dto.challengeId, userId), 'Challenge');
    
    // Can delete if:
    // 1. Challenge is not started (status = 'not_started')
    // 2. Challenge is personal (joinType = 'personal')
    // 3. Challenge has no other members (membersCount <= 1, which includes the owner)
    // @TODO: make sure this logic is synced up with the repo layer delete
    if (challenge.status === 'not_started' || 
           challenge.joinType === 'personal' || 
           challenge.membersCount <= 1) {
      throw new ValidationError('Challenge cannot be deleted. It must be not started, personal, or have no other members.');
    }

    // Delete the challenge
    await challengesRepository.delete(dto.challengeId, userId);
  }

  private mapToChallengeResponse(challenge: ChallengeWithImplicitStatus, referenceDate: Date): ChallengeResponse {
    return {
      id: challenge.id,
      name: challenge.name,
      status: challenge.implicitStatus({ referenceDate }),
      description: challenge.description,
      goals: challenge.goals,
      startDate: challenge.startDate,
      durationDays: challenge.durationDays,
      joinType: challenge.joinType,
      maxMembers: challenge.maxMembers,
      membersCount: challenge.membersCount,
      createdAt: challenge.createdAt.toISOString(),
      updatedAt: challenge.updatedAt.toISOString(),
      ownerUserId: challenge.ownerUserId,
    };
  }
}


