
import { IGameSessionRepository } from '@/repositories/game-session.repository';
import { 
  IKnowledgeBaseService, 
  IJwtService, 
  IUserProgressService,
  IDateTimeService,
  StartSessionDto,
  StartSessionOutput,
  SubmitAnswersDto,
  SubmitAnswersOutput,
  GameSessionJwtPayload,
  CorrectAssessment,
} from '@/shared/interfaces';
import { 
  ResourceNotFoundError,
  AuthorizationError,
  ValidationError,
  CrossDaySubmissionError,
  NoRetriesLeftError,
} from '@/shared/errors';
import { UserAnswer } from '@/db/schema';
import { DEFAULT_VALUES } from '@/lib/constants';

export class GameSessionService {
  constructor(
    private readonly gameSessionRepository: IGameSessionRepository,
    private readonly knowledgeBaseService: IKnowledgeBaseService,
    private readonly jwtService: IJwtService,
    private readonly userProgressService: IUserProgressService,
    private readonly dateTimeService: IDateTimeService // Injected
  ) {}

  public async startOrResumeSession(dto: StartSessionDto): Promise<StartSessionOutput> {
    const currentDay = await this.userProgressService.getCurrentDayForUser(dto.userId);

    // Check if the currentDay has been fully completed successfully by the user
    // We only care about the *exact* day determined by the progress service
    const completedSession = await this.gameSessionRepository.findSessionByDay(dto.userId, currentDay);
    if (completedSession) {
      return { status: 'completed' };
    }

    const article = await this.knowledgeBaseService.getArticleForDay(currentDay);
    if (!article) {
      // This means currentDay exceeded available articles or there's a data mismatch
      // In a real app, you might return 'completed_all_days' or a different status
      throw new ResourceNotFoundError(`Knowledge base article for day ${currentDay}`);
    }

    const payload: Omit<GameSessionJwtPayload, 'iat'> = {
      sub: dto.userId,
      article_id: article.id,
      day_number: article.day,
      attempts_count: 1,
    };
    
    // JWT expiration needs to be precisely handled based on server UTC and the user's "day" concept
    // For simplicity, we'll keep it '24h' from issue time, but for strict cross-day checks,
    // you might want to expire it at a specific time (e.g., next 00:00 UTC)
    // or rely entirely on the tokenIssuedAt.getUTCDate() !== now.getUTCDate() check.
    // @TODO: Check if need to be more strict, I dont think so though as above token issue check should be enough.
    const sessionToken = this.jwtService.sign(payload, '24h'); 

    return {
      status: 'in-progress',
      sessionToken,
      articleSummary: article,
    };
  }

  public async submitAnswers(dto: SubmitAnswersDto): Promise<SubmitAnswersOutput> {
    let payload: GameSessionJwtPayload;
    try {
      payload = this.jwtService.verify<GameSessionJwtPayload>(dto.sessionToken);
    } catch (error) {
      throw new ValidationError('Invalid or expired session token.');
    }

    if (payload.sub !== dto.userId) {
      throw new AuthorizationError('Token does not belong to the authenticated user.');
    }

    const retriesLeft = DEFAULT_VALUES.MAX_RETRY_ATTEMPTS - payload.attempts_count;
    if (retriesLeft < 0) {
      throw new NoRetriesLeftError();
    }
    
    // Use the injected dateTimeService for current time
    const nowUtc = this.dateTimeService.getUtcNow();
    const tokenIssuedAt = new Date(payload.iat * 1000); // JWT 'iat' is in seconds

    // Cross-Day Submission Check: Compares UTC calendar dates directly
    // This check is robust against server/user timezone differences because both dates are in UTC.
    if (tokenIssuedAt.getUTCFullYear() !== nowUtc.getUTCFullYear() ||
        tokenIssuedAt.getUTCMonth() !== nowUtc.getUTCMonth() ||
        tokenIssuedAt.getUTCDate() !== nowUtc.getUTCDate()) {
        throw new CrossDaySubmissionError();
    }

    // @TODO: Check if payload.day and article.day are the same. If not, throw an error.
    const correctAssessment = await this.knowledgeBaseService.getAssessmentForArticle(payload.article_id);
    if (!correctAssessment) {
      throw new ResourceNotFoundError(`Assessment for article ${payload.article_id}`);
    }

    const { incorrectQuestionIds, userAnswers } = this._gradeAssessment(dto.userAnswers, correctAssessment);
    const allCorrect = incorrectQuestionIds.length === 0;

    if (allCorrect) {
      await this.gameSessionRepository.create({
        user_id: dto.userId,
        knowledge_base_article_id: payload.article_id,
        day: payload.day_number,
        started_at: tokenIssuedAt,
        completed_at: nowUtc, // Use current UTC time for co
        attempt_count: payload.attempts_count,
        all_correct_answers: allCorrect,
        time_spent_seconds: Math.ceil(nowUtc.getTime() - tokenIssuedAt.getTime()) / 1000,
        created_at: nowUtc,
        user_answers: userAnswers,
      });
      return { status: 'completed' };
    }

    // Handle failure / retry
    if (retriesLeft > 1) {
      const newPayload: Omit<GameSessionJwtPayload, 'iat'> = { ...payload, attempts_count: payload.attempts_count + 1 };
      const newSessionToken = this.jwtService.sign(newPayload, '24h');
      return {
        status: 'retry',
        retriesLeft,
        incorrectQuestions: incorrectQuestionIds,
        newSessionToken,
      };
    } else {
      // No retries left, save as failed session
      await this.gameSessionRepository.create({
        user_id: dto.userId,
        knowledge_base_article_id: payload.article_id,
        day: payload.day_number,
        started_at: tokenIssuedAt,
        completed_at: nowUtc, // Use current UTC time for completion
        all_correct_answers: false,
        time_spent_seconds: Math.ceil(nowUtc.getTime() - tokenIssuedAt.getTime()) / 1000,
        attempt_count: payload.attempts_count,
        created_at: nowUtc,
        user_answers: userAnswers,
      });
      return { status: 'failed' };
    }
  }

  // ... (getSessionById and getUserSessions methods remain the same) ...

  private _gradeAssessment(
    userInputAnswers: SubmitAnswersDto['userAnswers'],
    correctAssessment: CorrectAssessment
  ): { incorrectQuestionIds: Array<string>, userAnswers: Array<UserAnswer> } {
    const userAnswersWithCorrectness: Array<UserAnswer> = userInputAnswers.map(userAnswer => ({
      question_id: userAnswer.questionId,
      answer_index: userAnswer.selectedOptionIndex,
      is_correct: userAnswer.selectedOptionIndex === correctAssessment[userAnswer.questionId].correctOptionIndex,
      hint_used: userAnswer.hintUsed,
    }));
    return { 
      incorrectQuestionIds: userAnswersWithCorrectness.filter(answer => !answer.is_correct).map(q => q.question_id), 
      userAnswers: userAnswersWithCorrectness 
    };
  }
}