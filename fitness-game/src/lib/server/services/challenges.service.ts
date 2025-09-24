import { 
  type AuthRequestContext,
  type CreateChallengeDto,
  type UpdateChallengeDto,
  type JoinChallengeDto,
  type LeaveChallengeDto,
  type GetChallengeDto,
  type ListPublicChallengesDto,
  type CreateChallengeResponse,
  type JoinChallengeResponse,
  type ChallengeResponse,
  type ListChallengeResponse
} from '$lib/server/shared/interfaces';
import { type IChallengesRepository, type IChallengeSubscribersRepository } from '$lib/server/repositories';
import { type Challenge, type NewChallenge } from '$lib/server/db/schema';
import { notFoundCheck, ValidationError } from '../shared/errors';
import type { IDateTimeHelper } from '../helpers';

// @TODO: add listChallengesOwnedByUser methods, add listChallengeMembers, listChallengesJoinedByUser methods
// add deleteChallenge method (only if the challenge is not started or is personal or has no other members)
export type IChallengesService = {
  createChallenge(dto: CreateChallengeDto): Promise<CreateChallengeResponse>;
  updateChallenge(dto: UpdateChallengeDto): Promise<void>;
  joinChallenge(dto: JoinChallengeDto): Promise<JoinChallengeResponse>;
  leaveChallenge(dto: LeaveChallengeDto): Promise<void>;
  getChallenge(dto: GetChallengeDto): Promise<ChallengeResponse | null>;
  listPublicChallenges(dto: ListPublicChallengesDto): Promise<ListChallengeResponse[]>;
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
  async createChallenge(dto: CreateChallengeDto): Promise<CreateChallengeResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    // @TODO: extract these to constants or put the default value in schema
    const maxMembers = dto.joinType === 'personal' ? 1 : (dto.maxMembers ?? 50);

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
  async updateChallenge(dto: UpdateChallengeDto): Promise<void> {
    const { requestDate } = this.requestContext;
    const { challengeId, ...updates } = dto;
    // Service-level validation will be added later (lock checks, deprecated goals, etc.)
    await this.dependencies.challengesRepository.update(challengeId, { ...updates, updatedAt: requestDate } as any);
  }

  /**
   * Join a challenge (public or invite-code) before start
   * POST /api/v1/challenges/:challengeId/join
   */
  async joinChallenge(dto: JoinChallengeDto): Promise<JoinChallengeResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { dateTimeHelper, challengesRepository, challengeSubscribersRepository } = this.dependencies;

    const challenge = notFoundCheck(await challengesRepository.findById(dto.challengeId), 'Challenge');
    const existingSubscriber = await challengeSubscribersRepository.findByChallengeAndUser(dto.challengeId, userId);
    if (existingSubscriber) return { id: existingSubscriber.id };

    // @TODO: this must be the implicit status check
    // No joins after startDate (use timezone-aware comparison helper already used elsewhere)
    const requestLocalDates = dateTimeHelper.getPossibleDatesOnEarthAtInstant(requestDate);
    if (requestLocalDates.earliest >= challenge.startDate) {
      throw new ValidationError('Challenge has already started');
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
  async leaveChallenge(dto: LeaveChallengeDto): Promise<void> {
    const { user: { id: userId } } = this.requestContext;
    await this.dependencies.challengesRepository.leave(dto.challengeId, userId);
  }

  /**
   * Get a challenge by ID
   * GET /api/v1/challenges/:challengeId
   */
  async getChallenge(dto: GetChallengeDto): Promise<ChallengeResponse | null> {
    const challenge = await this.dependencies.challengesRepository.findById(dto.challengeId);
    if (!challenge) return null;
    return this.mapToChallengeResponse(challenge);
  }

  /**
   * List public challenges (upcoming/ongoing policy handled in repo)
   * GET /api/v1/challenges
   */
  async listPublicChallenges(dto: ListPublicChallengesDto): Promise<ListChallengeResponse[]> {
    const challenges = await this.dependencies.challengesRepository.listPublicUpcoming(dto.page, dto.limit);
    return challenges.map(challenge => this.mapToChallengeResponse(challenge));
  }

  private mapToChallengeResponse(challenge: Challenge): ChallengeResponse {
    return {
      id: challenge.id,
      name: challenge.name,
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


