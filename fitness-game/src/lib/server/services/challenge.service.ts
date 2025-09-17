import {
  type CreateUserChallengeDto,
  type UpdateUserChallengeScheduleDto,
  type SubmitUserChallengeQuizDto,
  type PutUserChallengeLogDto,
  type ListUserChallengeLogsDto,
  type UserChallengeSummaryResponse,
  type UserChallengeDetailResponse,
  type NewUserChallengeResponse,
  type UserHabitLogResponse,
  type UserChallengeProgressResponse,
  type ListUserChallengeQuizSubmissionsDto,
  type AuthRequestContext,
} from '$lib/server/shared/interfaces';
import { 
  ResourceNotFoundError,
  ValidationError,
  InternalServerError,
  notFoundCheck
} from '$lib/server/shared/errors';
import { type HabitLogValueType, type AllHabitLogKeysType, type DailyHabitLogPayload, type FiveStarValuesType } from '$lib/server/db/schema';
import { type IDateTimeHelper } from '../helpers/date-time.helper';
import { type IUserChallengeProgressRepository, type IUserChallengeRepository, type IUserHabitLogsRepository } from '$lib/server/repositories';
import { type UserChallenge, type UserChallengeProgress, type UserHabitLog } from '$lib/server/db/schema';
import { type IChallengeDAO } from '$lib/server/content/daos';


export type IChallengeService = {
    createUserChallenge(dto: CreateUserChallengeDto): Promise<NewUserChallengeResponse>;
    getUserChallenge(dto: {userChallengeId: string}): Promise<UserChallengeDetailResponse>;
    listUserChallenges(dto: {}): Promise<UserChallengeSummaryResponse[]>;
    updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<void>;
    submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void>;
    putUserChallengeLog(dto: PutUserChallengeLogDto): Promise<void>;
    listUserChallengeLogs(dto: ListUserChallengeLogsDto): Promise<UserHabitLogResponse[]>;
    listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto): Promise<UserChallengeProgressResponse[]>;
    updateChallengeStatuses(): Promise<void>;
  };
  
export class ChallengeService implements IChallengeService {
  constructor(
    private readonly dependencies: {
      readonly userChallengeRepository: IUserChallengeRepository;
      readonly userChallengeProgressRepository: IUserChallengeProgressRepository;
      readonly userHabitLogsRepository: IUserHabitLogsRepository;
      readonly challengeDAO: IChallengeDAO;
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
    const today = dateTimeHelper.getUtcDateString(requestDate);
    const twoWeeksFromToday = dateTimeHelper.getTwoWeeksFromTodayUtcDateString();

    if (dto.startDate < today || dto.startDate > twoWeeksFromToday) {
      throw new ValidationError('Start date must be between today and 2 weeks from now');
    }

    // Check if user already has an active challenge
    // @TODO: check if this is the right logic, i.e. if its only a challenge of the same challenge id,
    // a user can have multiple challenges of different challenge ids
    const existingActiveChallenge = await userChallengeRepository.findActiveByUserId(userId);
    if (existingActiveChallenge) {
      throw new ValidationError('User already has an active challenge');
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
    const updatedChallenge = await userChallengeRepository.update({
      id: dto.userChallengeId,
      userId: userId,
      startDate: dto.newStartDate,
      updatedAt: requestDate
    });

    if (!updatedChallenge) {
      throw new ResourceNotFoundError('Failed to update challenge');
    }
  }

  /**
   * Submit user challenge quiz
   * POST /user-challenges/:userChallengeId/progress/:knowledgeBaseId/quiz
   */
  async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, challengeDAO, userChallengeProgressRepository } = this.dependencies;
    const userChallenge = notFoundCheck(
        await userChallengeRepository.findById(dto.userChallengeId, userId),
        'Challenge'
    );

    
    // Validate article is part of challenge
    const challenge = challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
    const isArticleInChallenge = challenge.articles.some(article => article.knowledgeBaseId === dto.knowledgeBaseId);
    if (!isArticleInChallenge) {
      throw new ValidationError('Article/Quiz is not part of this challenge');
    }

    // Check if challenge is not locked or maybe not started?
    const implicitStatus = userChallenge.implicitStatus({ referenceDate: requestDate });
    if (!this.isChallengeLoggable(implicitStatus)) {
      throw new ValidationError('Challenge is not active and cannot be modified at this time');
    }

    // Check if quiz already submitted
    const existingProgress = await userChallengeProgressRepository.findByUserChallengeAndArticle(
      dto.userChallengeId,
      userId,
      dto.knowledgeBaseId
    );

    // If the quiz has already been submitted with a perfect score and the user is not overriding the submission, throw an error
    if (existingProgress && existingProgress.allCorrectAnswers) {
      if (dto.overrideSubmission) {
        console.warn('Quiz for this article has already been submitted. Overriding submission.');
      } else {
        throw new ValidationError('Quiz for this article has already been submitted with a perfect score. Do you really want to override the submission?');
      }
    }

    // Calculate if all answers are correct
    const allCorrect = dto.quizAnswers.every(answer => answer.is_correct);

    // Create or Update progress record
    await userChallengeProgressRepository.upsert({
        userId,
        userChallengeId: dto.userChallengeId,
        knowledgeBaseId: dto.knowledgeBaseId,
        allCorrectAnswers: allCorrect,
        quizAnswers: dto.quizAnswers,
        firstAttemptedAt: requestDate,
      });
  }

  //@TODO: Refactor into one method
  private isChallengeLoggable(status: UserChallenge['status']): boolean {
    return ['active', 'completed'].includes(status);
  }

  private isChallengeRescheduleable(status: UserChallenge['status']): boolean {
    return status === 'not_started';
  }

  
  /**
   * Put user challenge log
   * PUT /user-challenges/:userChallengeId/logs/:logDate
   */
  async putUserChallengeLog(dto: PutUserChallengeLogDto): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, dateTimeHelper, userHabitLogsRepository } = this.dependencies;
    
    //@TODO: Use this to generate warnings in response, if challenge habits are not set, and if log date is outside all active challenge period
    const {activeChallengeHabits, earliestStartDate, latestEndDate} = 
      await userChallengeRepository.findAllActiveChallengeMetadata(userId, { requestDate });

    // Validate log date is not in the future and not before start date
    // @TODO double check this logic, and also that you cant log for a date outside the challenge period range
    // Implement an isWithinRange method somewhere (maybe in the date-time service)
    if (dateTimeHelper.isDateInFuture(dto.logDate)) {
      throw new ValidationError('Cannot log habits for future dates');
    }

    // Transform DailyHabitLogPayload into the expected array format
    const valuesArray = Object.entries(dto.values)
      .map(([key, value]) => ({ 
        key: key as AllHabitLogKeysType, 
        value: value as HabitLogValueType<number>
      }));

    // Upsert the habit log
    await userHabitLogsRepository.upsert({
        userId,
        logDate: dto.logDate,
        createdAt: requestDate,
      }, valuesArray);
  }

  /**
   * List user challenge logs
   * GET /user-challenges/:userChallengeId/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async listUserChallengeLogs(dto: ListUserChallengeLogsDto): Promise<UserHabitLogResponse[]> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, userHabitLogsRepository, dateTimeHelper } = this.dependencies;
    const challenge = notFoundCheck(
        await userChallengeRepository.findById(dto.userChallengeId, userId),
        'Challenge'
    );

    // Validate date range
    if (dto.fromDate && dto.toDate && dto.fromDate > dto.toDate) {
      throw new ValidationError('From date must be before or equal to to date');
    }

    const logs = await userHabitLogsRepository.findByUserChallengeAndDateRange(
      {id: dto.userChallengeId, startDate: challenge.startDate},
      userId,
      dto.fromDate,
      dto.toDate
    );

    return this.mapToUserHabitLogResponse(logs);
  }

  async listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto): Promise<UserChallengeProgressResponse[]> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, userChallengeProgressRepository } = this.dependencies;
    // Resource existence check
    notFoundCheck(
        await userChallengeRepository.findById(dto.userChallengeId, userId),
        'Challenge'
    );

    const submissions = await userChallengeProgressRepository.findByUserChallengeId(
      dto.userChallengeId,
      userId
    );

    return submissions.map(submission => this.mapToUserChallengeProgressResponse(submission));
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
      habitsLoggedCount: challenge.habitsLoggedCount,
      lastActivityDate: challenge.lastActivityDate?.toISOString(),
      createdAt: challenge.createdAt.toISOString(),
      updatedAt: challenge.updatedAt.toISOString()
    };
  }

  /**
   * Map database model to habit log response DTO
   * Groups logs by date and creates a values object for each date
   */
  private mapToUserHabitLogResponse(logs: UserHabitLog[]): UserHabitLogResponse[] {
    // Group logs by date
    const logsByDate = logs.reduce((acc, log) => {
      const dateKey = log.logDate;
      if (!acc.has(dateKey)) {
        acc.set(dateKey, {
          logDate: log.logDate,
          values: {} as DailyHabitLogPayload,
        });
      }
      
      // Add the habit value to the values object
      const entry = acc.get(dateKey)!;
      entry.values[log.logKey] = log.logValue as HabitLogValueType<unknown>;
      
      return acc;
    }, new Map<string, UserHabitLogResponse>());

    // Convert to array and format timestamps
    return Object.values(logsByDate).map(log => ({
      logDate: log.logDate,
      values: log.values,
    }));
  }

  private mapToUserChallengeProgressResponse(progress: UserChallengeProgress): UserChallengeProgressResponse {
    return {
      id: progress.id,
      userChallengeId: progress.userChallengeId,
      knowledgeBaseId: progress.knowledgeBaseId,
      allCorrectAnswers: progress.allCorrectAnswers,
      quizAnswers: progress.quizAnswers,
      firstAttemptedAt: progress.firstAttemptedAt.toISOString(),
      lastAttemptedAt: progress.lastAttemptedAt.toISOString(),
      attempts: progress.attempts,
    };
  }
}
