import {
  CreateUserChallengeDto,
  UpdateUserChallengeScheduleDto,
  SubmitUserChallengeQuizDto,
  PutUserChallengeLogDto,
  ListUserChallengeLogsDto,
  UserChallengeSummaryResponse,
  UserChallengeDetailResponse,
  NewUserChallengeResponse,
  UserHabitLogResponse,
  UserChallengeProgressResponse,
  ListUserChallengeQuizSubmissionsDto,
  AuthRequestContext,
} from '@/shared/interfaces';
import { 
  ResourceNotFoundError,
  ValidationError,
  InternalServerError,
  notFoundCheck
} from '@/shared/errors';
import { type IDateTimeHelper } from '../helpers/date-time.helper';
import { type IUserChallengeProgressRepository, type IUserChallengeRepository, type IUserHabitLogsRepository } from '@/repositories/';
import { UserChallenge, UserChallengeProgress, UserHabitLog } from '@/lib/db/schema';
import { IChallengeDAO } from '@/data/content/utils/daos/';


export type IChallengeService = {
    createUserChallenge(dto: CreateUserChallengeDto, requestContext: AuthRequestContext): Promise<NewUserChallengeResponse>;
    getUserChallenge(userChallengeId: string, requestContext: AuthRequestContext): Promise<UserChallengeDetailResponse>;
    listUserChallenges(requestContext: AuthRequestContext): Promise<UserChallengeSummaryResponse[]>;
    updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto, requestContext: AuthRequestContext): Promise<void>;
    submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto, requestContext: AuthRequestContext): Promise<void>;
    putUserChallengeLog(dto: PutUserChallengeLogDto, requestContext: AuthRequestContext): Promise<void>;
    listUserChallengeLogs(dto: ListUserChallengeLogsDto, requestContext: AuthRequestContext): Promise<UserHabitLogResponse[]>;
    listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto, requestContext: AuthRequestContext): Promise<UserChallengeProgressResponse[]>;
    updateChallengeStatuses(requestContext: AuthRequestContext): Promise<void>;
  };
  
export class ChallengeService implements IChallengeService {
  constructor(
    private readonly userChallengeRepository: IUserChallengeRepository,
    private readonly userChallengeProgressRepository: IUserChallengeProgressRepository,
    private readonly userHabitLogsRepository: IUserHabitLogsRepository,
    private readonly challengeDAO: IChallengeDAO,
    private readonly dateTimeHelper: IDateTimeHelper
  ) {}

  /**
   * Create a new user challenge
   * POST /user-challenges
   */

  async createUserChallenge(dto: CreateUserChallengeDto, requestContext: AuthRequestContext): Promise<NewUserChallengeResponse> {
    const requestDate = requestContext.requestDate;
    const challenge = notFoundCheck(this.challengeDAO.getById(dto.challengeId), 'Challenge');

    // Validate start date is within 2 weeks
    // @TODO: Convert the input Dtos to Zod schemas and validate them using Zod not here but from the API entry point.
    const today = this.dateTimeHelper.getUtcDateString(requestDate);
    const twoWeeksFromToday = this.dateTimeHelper.getTwoWeeksFromTodayUtcDateString();

    if (dto.startDate < today || dto.startDate > twoWeeksFromToday) {
      throw new ValidationError('Start date must be between today and 2 weeks from now');
    }

    // Check if user already has an active challenge
    // @TODO: check if this is the right logic, i.e. if its only a challenge of the same challenge id,
    // a user can have multiple challenges of different challenge ids
    const existingActiveChallenge = await this.userChallengeRepository.findActiveByUserId(requestContext.userId);
    if (existingActiveChallenge) {
      throw new ValidationError('User already has an active challenge');
    }

    // Create the challenge
    const userChallenge = await this.userChallengeRepository.create({
        userId: requestContext.userId,
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
  async getUserChallenge(userChallengeId: string, requestContext: AuthRequestContext): Promise<UserChallengeDetailResponse> {
    const requestDate = requestContext.requestDate;
    const userChallenge = notFoundCheck(
        await this.userChallengeRepository.findById(userChallengeId, requestContext.userId),
        'Challenge'
    );
    
    const challenge = this.challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
    const implicitStatus = userChallenge.implicitStatus({ requestDate, challengeDays: challenge.durationDays });

    return this.mapToUserChallengeResponse(userChallenge, implicitStatus);
  }

  async listUserChallenges(requestContext: AuthRequestContext): Promise<UserChallengeSummaryResponse[]> {
    const requestDate = requestContext.requestDate;

    const userChallenges = await this.userChallengeRepository.findByUserId(requestContext.userId);
    return userChallenges.map(userChallenge => {
        const challenge = this.challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
        const implicitStatus = userChallenge.implicitStatus({ requestDate, challengeDays: challenge.durationDays });
        return this.mapToUserChallengeResponse(userChallenge, implicitStatus);
    });
  }

  /**
   * Update user challenge schedule
   * PATCH /user-challenges/:userChallengeId/schedule
   */
  async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto, requestContext: AuthRequestContext): Promise<void> {
    const requestDate = requestContext.requestDate;
    const userChallenge = notFoundCheck(
        await this.userChallengeRepository.findById(dto.userChallengeId, requestContext.userId),
        'Challenge'
    );

    // Check if challenge is rescheduleable
    const challenge = this.challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
    const implicitStatus = userChallenge.implicitStatus({ requestDate, challengeDays: challenge.durationDays });
    if (!this.isChallengeRescheduleable(implicitStatus)) {
      throw new ValidationError('Cannot reschedule a challenge in this state');
    }

    // Validate new start date is within one month of original start date
    const oneMonthFromOriginal = this.dateTimeHelper.getOneMonthFromDateUtcDateString(userChallenge.originalStartDate);

    if (dto.newStartDate < userChallenge.originalStartDate || dto.newStartDate > oneMonthFromOriginal) {
      throw new ValidationError('New start date must be within one month of the originally chosen date');
    }

    // Update the challenge
    const updatedChallenge = await this.userChallengeRepository.update({
      id: dto.userChallengeId,
      userId: requestContext.userId,
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
  async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto, requestContext: AuthRequestContext): Promise<void> {
    const requestDate = requestContext.requestDate;
    const userChallenge = notFoundCheck(
        await this.userChallengeRepository.findById(dto.userChallengeId, requestContext.userId),
        'Challenge'
    );

    
    // Validate article is part of challenge
    const challenge = this.challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
    const isArticleInChallenge = challenge.articles.some(article => article.knowledgeBaseId === dto.knowledgeBaseId);
    if (!isArticleInChallenge) {
      throw new ValidationError('Article/Quiz is not part of this challenge');
    }

    // Check if challenge is not locked or maybe not started?
    const implicitStatus = userChallenge.implicitStatus({ requestDate, challengeDays: challenge.durationDays });
    if (!this.isChallengeLoggable(implicitStatus)) {
      throw new ValidationError('Challenge is not active and cannot be modified at this time');
    }

    // Check if quiz already submitted
    const existingProgress = await this.userChallengeProgressRepository.findByUserChallengeAndArticle(
      dto.userChallengeId,
      requestContext.userId,
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
    await this.userChallengeProgressRepository.upsert({
        userId: requestContext.userId,
        userChallengeId: dto.userChallengeId,
        knowledgeBaseId: dto.knowledgeBaseId,
        allCorrectAnswers: allCorrect,
        quizAnswers: dto.quizAnswers,
        firstAttemptedAt: requestDate,
      });
  }
  
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
  async putUserChallengeLog(dto: PutUserChallengeLogDto, requestContext: AuthRequestContext): Promise<void> {
    const requestDate = requestContext.requestDate;
    const userChallenge = notFoundCheck(
        await this.userChallengeRepository.findById(dto.userChallengeId, requestContext.userId),
        'Challenge'
    );
    const challenge = this.challengeDAO.getByIdOrThrow(userChallenge.challengeId, () => new InternalServerError(`Challenge with ID ${userChallenge.challengeId} does not exist`));
    

    const implicitStatus = userChallenge.implicitStatus({ requestDate, challengeDays: challenge.durationDays });
    if (!this.isChallengeLoggable(implicitStatus)) {
      throw new ValidationError('Challenge is locked and cannot be modified');
    }

    // Validate log date is not in the future and not before start date
    // @TODO double check this logic, and also that you cant log for a date outside the challenge period range
    // Implement an isWithinRange method somewhere (maybe in the date-time service)
    if (this.dateTimeHelper.isDateInFuture(dto.logDate)) {
      throw new ValidationError('Cannot log habits for future dates');
    }

    if (this.dateTimeHelper.isDateBeforeStartDate(dto.logDate, userChallenge.startDate)) {
      throw new ValidationError('Cannot log habits for dates before challenge start date');
    }

    // Validate log date is within challenge period
    const challengeDuration = challenge.durationDays;
    if (challengeDuration && !this.dateTimeHelper.isLogDateWithinChallengePeriod(dto.logDate, userChallenge.startDate, challengeDuration)) {
      throw new ValidationError('Cannot log habits for dates outside the challenge period');
    }

    // Upsert the habit log
    await this.userHabitLogsRepository.upsert({
        userId: requestContext.userId,
        userChallengeId: dto.userChallengeId,
        logDate: dto.logDate,
        values: dto.values,
        createdAt: requestDate,
      });
  }

  /**
   * List user challenge logs
   * GET /user-challenges/:userChallengeId/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async listUserChallengeLogs(dto: ListUserChallengeLogsDto, requestContext: AuthRequestContext): Promise<UserHabitLogResponse[]> {
    const challenge = notFoundCheck(
        await this.userChallengeRepository.findById(dto.userChallengeId, requestContext.userId),
        'Challenge'
    );

    // Validate date range
    if (dto.fromDate && dto.toDate && dto.fromDate > dto.toDate) {
      throw new ValidationError('From date must be before or equal to to date');
    }

    const logs = await this.userHabitLogsRepository.findByUserChallengeAndDateRange(
      dto.userChallengeId,
      requestContext.userId,
      dto.fromDate,
      dto.toDate
    );

    return logs.map(log => this.mapToUserHabitLogResponse(log));
  }

  async listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto, requestContext: AuthRequestContext): Promise<UserChallengeProgressResponse[]> {
    const challenge = notFoundCheck(
        await this.userChallengeRepository.findById(dto.userChallengeId, requestContext.userId),
        'Challenge'
    );

    const submissions = await this.userChallengeProgressRepository.findByUserChallengeId(
      dto.userChallengeId,
      requestContext.userId
    );

    return submissions.map(submission => this.mapToUserChallengeProgressResponse(submission));
  }

  /**
   * Update challenge statuses (scheduled job)
   * This method implements the challenge status update algorithm
   */
  async updateChallengeStatuses(requestContext: AuthRequestContext): Promise<void> {
    const requestDate = requestContext.requestDate;

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
   */
  private mapToUserHabitLogResponse(log: UserHabitLog): UserHabitLogResponse {
    return {
      id: log.id,
      userChallengeId: log.userChallengeId,
      logDate: log.logDate,
      values: log.values,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    };
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
