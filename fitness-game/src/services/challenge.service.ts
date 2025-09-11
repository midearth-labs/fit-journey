import { 
  IUserChallengeRepository, 
  IUserChallengeProgressRepository, 
  IUserHabitLogsRepository,
  IChallengeContentService,
  IDateTimeService,
  IChallengeService,
  CreateUserChallengeDto,
  UpdateUserChallengeScheduleDto,
  SubmitUserChallengeQuizDto,
  PutUserChallengeLogDto,
  ListUserChallengeLogsDto,
  UserChallengeResponse,
  UserHabitLogResponse
} from '@/shared/interfaces';
import { 
  ResourceNotFoundError,
  ValidationError,
  AuthorizationError
} from '@/shared/errors';
import { UserChallenge, NewUserChallenge, NewUserChallengeProgress, NewUserHabitLog, UserHabitLog } from '@/lib/db/schema';

export class ChallengeService implements IChallengeService {
  constructor(
    private readonly userChallengeRepository: IUserChallengeRepository,
    private readonly userChallengeProgressRepository: IUserChallengeProgressRepository,
    private readonly userHabitLogsRepository: IUserHabitLogsRepository,
    private readonly challengeContentService: IChallengeContentService,
    private readonly dateTimeService: IDateTimeService
  ) {}

  /**
   * Create a new user challenge
   * POST /user-challenges
   */
  async createUserChallenge(dto: CreateUserChallengeDto): Promise<UserChallengeResponse> {
    // Validate challenge exists
    const challengeExists = await this.challengeContentService.validateChallengeExists(dto.challengeId);
    if (!challengeExists) {
      throw new ValidationError(`Challenge with ID ${dto.challengeId} does not exist`);
    }

    // Validate start date is within 2 weeks
    const today = this.dateTimeService.getTodayUtcDateString();
    const twoWeeksFromToday = this.dateTimeService.getTwoWeeksFromTodayUtcDateString();

    if (dto.startDate < today || dto.startDate > twoWeeksFromToday) {
      throw new ValidationError('Start date must be between today and 2 weeks from now');
    }

    // Check if user already has an active challenge
    const existingActiveChallenge = await this.userChallengeRepository.findActiveByUserId(dto.userId);
    if (existingActiveChallenge) {
      throw new ValidationError('User already has an active challenge');
    }

    // Create the challenge
    const newChallenge: NewUserChallenge = {
      userId: dto.userId,
      challengeId: dto.challengeId,
      startDate: dto.startDate,
      originalStartDate: dto.startDate,
      status: 'not_started'
    };

    const challenge = await this.userChallengeRepository.create(newChallenge);
    return this.mapToUserChallengeResponse(challenge);
  }

  /**
   * Get a user challenge by ID
   * GET /user-challenges/:userChallengeId
   */
  async getUserChallenge(userChallengeId: string, userId: string): Promise<UserChallengeResponse> {
    const challenge = await this.userChallengeRepository.findById(userChallengeId);
    if (!challenge) {
      throw new ResourceNotFoundError('Challenge not found');
    }

    // Check authorization
    if (challenge.userId !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Get additional data
    const challengeData = await this.challengeContentService.getChallengeById(challenge.challengeId);
    const progress = await this.userChallengeProgressRepository.findByUserChallengeId(userChallengeId);
    const logs = await this.userHabitLogsRepository.findByUserChallengeId(userChallengeId);

    const response = this.mapToUserChallengeResponse(challenge);
    response.challenge = challengeData;
    response.progress = progress;
    response.logs = logs;

    return response;
  }

  /**
   * Update user challenge schedule
   * PATCH /user-challenges/:userChallengeId/schedule
   */
  async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<UserChallengeResponse> {
    const challenge = await this.userChallengeRepository.findById(dto.userChallengeId);
    if (!challenge) {
      throw new ResourceNotFoundError('Challenge not found');
    }

    // Check authorization
    if (challenge.userId !== dto.userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if challenge is not started
    if (challenge.status !== 'not_started') {
      throw new ValidationError('Cannot reschedule a challenge that has already started');
    }

    // Validate new start date is within one month of original start date
    const oneMonthFromOriginal = this.dateTimeService.getOneMonthFromDateUtcDateString(challenge.originalStartDate);

    if (dto.newStartDate < challenge.originalStartDate || dto.newStartDate > oneMonthFromOriginal) {
      throw new ValidationError('New start date must be within one month of the originally chosen date');
    }

    // Update the challenge
    const updatedChallenge = await this.userChallengeRepository.update(dto.userChallengeId, {
      startDate: dto.newStartDate
    }, this.dateTimeService.getUtcNow());

    if (!updatedChallenge) {
      throw new ResourceNotFoundError('Failed to update challenge');
    }

    return this.mapToUserChallengeResponse(updatedChallenge);
  }

  /**
   * Submit user challenge quiz
   * POST /user-challenges/:userChallengeId/progress/:knowledgeBaseId/quiz
   */
  async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void> {
    const challenge = await this.userChallengeRepository.findById(dto.userChallengeId);
    if (!challenge) {
      throw new ResourceNotFoundError('Challenge not found');
    }

    // Check authorization
    if (challenge.userId !== dto.userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if challenge is not locked
    // @TODO: add runtime check if status (will be locked, i.e. if cron job hasnt run yet)
    if (challenge.status === 'locked') {
      throw new ValidationError('Challenge is locked and cannot be modified');
    }
    // @TODO: you also have to check if challenge is ready for submission. i.e. the start_date has pass ed.

    // Validate article is part of challenge
    const isArticleInChallenge = this.challengeContentService.isArticleInChallenge(
      challenge.challengeId, 
      dto.knowledgeBaseId
    );
    if (!isArticleInChallenge) {
      throw new ValidationError('Article is not part of this challenge');
    }

    // Check if quiz already submitted
    const existingProgress = await this.userChallengeProgressRepository.findByUserChallengeAndArticle(
      dto.userChallengeId,
      dto.knowledgeBaseId
    );

    if (existingProgress) {
      throw new ValidationError('Quiz for this article has already been submitted');
    }

    // Calculate if all answers are correct
    const allCorrect = dto.quizAnswers.every(answer => answer.is_correct);

    // Create progress record
    const progressData: NewUserChallengeProgress = {
      userChallengeId: dto.userChallengeId,
      knowledgeBaseId: dto.knowledgeBaseId,
      allCorrectAnswers: allCorrect,
      quizAnswers: dto.quizAnswers,
      firstAttemptedAt: this.dateTimeService.getUtcNow(),
      lastAttemptedAt: this.dateTimeService.getUtcNow(),
      attempts: 1
    };

    await this.userChallengeProgressRepository.create(progressData);
  }

  /**
   * Put user challenge log
   * PUT /user-challenges/:userChallengeId/logs/:logDate
   */
  async putUserChallengeLog(dto: PutUserChallengeLogDto): Promise<void> {
    const challenge = await this.userChallengeRepository.findById(dto.userChallengeId);
    if (!challenge) {
      throw new ResourceNotFoundError('Challenge not found');
    }

    // Check authorization
    if (challenge.userId !== dto.userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if challenge is not locked
    // @TODO: add runtime check if status (will be locked, i.e. if cron job hasnt run yet)
    if (challenge.status === 'locked') {
      throw new ValidationError('Challenge is locked and cannot be modified');
    }

    // Validate log date is not in the future and not before start date
    if (this.dateTimeService.isDateInFuture(dto.logDate)) {
      throw new ValidationError('Cannot log habits for future dates');
    }

    if (this.dateTimeService.isDateBeforeStartDate(dto.logDate, challenge.startDate)) {
      throw new ValidationError('Cannot log habits for dates before challenge start date');
    }

    // Validate log date is within challenge period
    const challengeDuration = this.challengeContentService.getChallengeDuration(challenge.challengeId);
    if (challengeDuration && !this.dateTimeService.isLogDateWithinChallengePeriod(dto.logDate, challenge.startDate, challengeDuration)) {
      throw new ValidationError('Cannot log habits for dates outside the challenge period');
    }

    // Upsert the habit log
    const logData: NewUserHabitLog = {
      userChallengeId: dto.userChallengeId,
      logDate: dto.logDate,
      values: dto.values
    };

    await this.userHabitLogsRepository.upsert(logData, this.dateTimeService.getUtcNow());
  }

  /**
   * List user challenge logs
   * GET /user-challenges/:userChallengeId/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  async listUserChallengeLogs(dto: ListUserChallengeLogsDto): Promise<UserHabitLogResponse[]> {
    const challenge = await this.userChallengeRepository.findById(dto.userChallengeId);
    if (!challenge) {
      throw new ResourceNotFoundError('Challenge not found');
    }

    // Check authorization
    if (challenge.userId !== dto.userId) {
      throw new AuthorizationError('Access denied');
    }

    // Validate date range
    if (dto.fromDate > dto.toDate) {
      throw new ValidationError('From date must be before or equal to to date');
    }

    const logs = await this.userHabitLogsRepository.findByUserChallengeAndDateRange(
      dto.userChallengeId,
      dto.fromDate,
      dto.toDate
    );

    return logs.map(log => this.mapToUserHabitLogResponse(log));
  }

  /**
   * Update challenge statuses (scheduled job)
   * This method implements the challenge status update algorithm
   */
  async updateChallengeStatuses(): Promise<void> {
    // @TODO: update logic to allow for user filter, and also, to run in batches (or partitioned, using a WHERE INDEX)
    const today = this.dateTimeService.getTodayUtcDateString();
    const fortyEightHoursAgo = this.dateTimeService.getFortyEightHoursAgoUtcTimestamp();
    
    // Transition from NOT_STARTED to ACTIVE
    const challengesToActivate = await this.userChallengeRepository.findChallengesToActivate(today);
    for (const challenge of challengesToActivate) {
      await this.userChallengeRepository.update(challenge.id, { status: 'active' }, this.dateTimeService.getUtcNow());
    }

    // Transition from ACTIVE to COMPLETED
    // This requires checking against static challenge data for duration
    const activeChallenges = await this.userChallengeRepository.findActiveChallenges();
    
    for (const challenge of activeChallenges) {
      const duration = this.challengeContentService.getChallengeDuration(challenge.challengeId);
      if (duration) {
        const endDate = this.dateTimeService.getChallengeEndDateUtcDateString(challenge.startDate, duration);
        
        if (this.dateTimeService.isDateAfterChallengeEndDate(today, endDate)) {
          await this.userChallengeRepository.update(challenge.id, {
            status: 'completed',
            completedAt: this.dateTimeService.getUtcNow()
          }, this.dateTimeService.getUtcNow());
        }
      }
    }

    // Transition from COMPLETED to LOCKED
    const challengesToLock = await this.userChallengeRepository.findChallengesToLock(fortyEightHoursAgo);
    for (const challenge of challengesToLock) {
      await this.userChallengeRepository.update(challenge.id, {
        status: 'locked',
        lockedAt: this.dateTimeService.getUtcNow()
      }, this.dateTimeService.getUtcNow());
    }
  }

  /**
   * Map database model to response DTO
   */
  private mapToUserChallengeResponse(challenge: UserChallenge): UserChallengeResponse {
    return {
      id: challenge.id,
      challengeId: challenge.challengeId,
      userId: challenge.userId,
      startDate: challenge.startDate,
      originalStartDate: challenge.originalStartDate,
      status: challenge.status,
      completedAt: challenge.completedAt?.toISOString(),
      lockedAt: challenge.lockedAt?.toISOString(),
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
}
