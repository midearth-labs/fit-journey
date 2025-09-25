import { 
  type AuthRequestContext,
  type LogReadDto,
  type StartQuizDto,
  type SubmitQuizDto,
  type RetryQuizDto,
  type StartPracticalDto,
  type CompletePracticalDto,
  type SkipPracticalDto,
  type CompleteArticleDto,
  type ListUserArticlesDto,
  type GetUserArticleDto,
  type UserArticleSummaryResponse,
  type UserArticleDetailResponse,
  type LogReadResponse,
  type StartQuizResponse,
  type SubmitQuizResponse,
  type RetryQuizResponse,
  type StartPracticalResponse,
  type CompletePracticalResponse,
  type SkipPracticalResponse,
  type CompleteArticleResponse,
} from '$lib/server/shared/interfaces';
import { ValidationError, notFoundCheck } from '$lib/server/shared/errors';
import { type IUserArticlesRepository } from '$lib/server/repositories';
import { type IKnowledgeBaseDAO, type IQuestionsDAO } from '$lib/server/content/daos';
import { transitionTo, ARTICLE_STATE_TRANSITIONS_V2, type TransitionMapV2, type TransitionDetailsOf } from '$lib/server/helpers/article-state-machine-helper-v2';

export type IArticleService = {
  logRead(dto: LogReadDto): Promise<LogReadResponse>;
  startQuiz(dto: StartQuizDto): Promise<StartQuizResponse>;
  submitQuiz(dto: SubmitQuizDto): Promise<SubmitQuizResponse>;
  retryQuiz(dto: RetryQuizDto): Promise<RetryQuizResponse>;
  startPractical(dto: StartPracticalDto): Promise<StartPracticalResponse>;
  completePractical(dto: CompletePracticalDto): Promise<CompletePracticalResponse>;
  skipPractical(dto: SkipPracticalDto): Promise<SkipPracticalResponse>;
  completeArticle(dto: CompleteArticleDto): Promise<CompleteArticleResponse>;
  listUserArticles(dto: ListUserArticlesDto): Promise<UserArticleSummaryResponse[]>;
  getUserArticle(dto: GetUserArticleDto): Promise<UserArticleDetailResponse>;
};

export class ArticleService implements IArticleService {
  constructor(
    private readonly dependencies: {
      readonly userArticlesRepository: IUserArticlesRepository;
      readonly knowledgeBaseDAO: IKnowledgeBaseDAO;
      readonly questionsDAO: IQuestionsDAO;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Private helper method to execute state transitions with common parameters auto-injected
   * and article existence validation.
   */
  private async transitionTo<K extends keyof typeof ARTICLE_STATE_TRANSITIONS_V2 & string>(
    articleId: string,
    transitionKey: K,
    details: Omit<TransitionDetailsOf<typeof ARTICLE_STATE_TRANSITIONS_V2, K>, 'articleId' | 'requestDate' | 'userId' | 'article'>
  ): Promise<{ id: string }> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { userArticlesRepository, knowledgeBaseDAO } = this.dependencies;

    // Validate article exists
    const article = notFoundCheck(
      knowledgeBaseDAO.getById(articleId),
      'Article'
    );

    // Auto-inject common parameters and execute transition
    return await transitionTo(
      ARTICLE_STATE_TRANSITIONS_V2,
      userArticlesRepository,
      userId,
      articleId,
      requestDate,
      transitionKey,
      {
        articleId,
        requestDate,
        userId,
        article,
        ...details
      } as TransitionDetailsOf<typeof ARTICLE_STATE_TRANSITIONS_V2, K>
    );
  }

  /**
   * Log article reading activity
   * POST /api/v1/users/me/articles/:articleId/read
   */
  async logRead(dto: LogReadDto): Promise<LogReadResponse> {
    await this.transitionTo(dto.articleId, 'LOG_READ', {});
  }

  /**
   * Start quiz for an article
   * POST /api/v1/users/me/articles/:articleId/quiz/start
   */
  async startQuiz(dto: StartQuizDto): Promise<StartQuizResponse> {
    await this.transitionTo(dto.articleId, 'START_QUIZ', {});
  }

  /**
   * Submit quiz answers for an article
   * POST /api/v1/users/me/articles/:articleId/quiz/submit
   */
  async submitQuiz(dto: SubmitQuizDto): Promise<SubmitQuizResponse> {
    const { questionsDAO } = this.dependencies;
      // Process each answer and validate the question itself
      const answersWithQuestions = dto.quizAnswers.map(answer => {
        const question = questionsDAO.getById(answer.questionId);
        if (!question) {
          throw new ValidationError(`Question with ID ${answer.questionId} not found`);
        }
        if (question.knowledge_base_id !== dto.articleId) {
          throw new ValidationError(`Question with ID ${answer.questionId} does not belong to article with ID ${dto.articleId}`);
        }
        return { question, answer };
      });


    await this.transitionTo(dto.articleId, 'SUBMIT_QUIZ', {
      answersWithQuestions
    });
  }

  /**
   * Retry quiz for an article
   * POST /api/v1/users/me/articles/:articleId/quiz/retry
   */
  async retryQuiz(dto: RetryQuizDto): Promise<RetryQuizResponse> {
    await this.transitionTo(dto.articleId, 'RETRY_QUIZ', {
      userWantsToRetry: dto.userWantsToRetry
    });
  }

  /**
   * Start practical activities for an article
   * POST /api/v1/users/me/articles/:articleId/practical/start
   */
  async startPractical(dto: StartPracticalDto): Promise<StartPracticalResponse> {
    const { knowledgeBaseDAO } = this.dependencies;
    // @TODO: this logic should be moved to the state machine
    // Validate article exists and has practicals
    const article = notFoundCheck(
      knowledgeBaseDAO.getById(dto.articleId),
      'Article'
    );

    // Check if article has practicals (assuming this is defined in the article JSON)
    const hasPracticals = article.practicals && article.practicals.length > 0;
    if (!hasPracticals) {
      throw new ValidationError('This article does not have practical activities.');
    }

    await this.transitionTo(dto.articleId, 'START_PRACTICAL', {});
  }

  /**
   * Complete practical activities for an article
   * POST /api/v1/users/me/articles/:articleId/practical/complete
   */
  async completePractical(dto: CompletePracticalDto): Promise<CompletePracticalResponse> {
    await this.transitionTo(dto.articleId, 'COMPLETE_PRACTICAL', {});
  }

  /**
   * Skip practical activities for an article
   * POST /api/v1/users/me/articles/:articleId/practical/skip
   */
  async skipPractical(dto: SkipPracticalDto): Promise<SkipPracticalResponse> {
    await this.transitionTo(dto.articleId, 'SKIP_PRACTICAL', {});
  }

  /**
   * Complete article (bypass practicals)
   * POST /api/v1/users/me/articles/:articleId/complete
   */
  async completeArticle(dto: CompleteArticleDto): Promise<CompleteArticleResponse> {
    await this.transitionTo(dto.articleId, 'COMPLETE_ARTICLE', {});
  }

  /**
   * List user's articles with summary
   * GET /api/v1/users/me/articles
   */
  async listUserArticles(dto: ListUserArticlesDto): Promise<UserArticleSummaryResponse[]> {
    const { user: { id: userId } } = this.requestContext;
    const { userArticlesRepository } = this.dependencies;

    const articles = await userArticlesRepository.listByUser(
      userId, 
      dto.page || 0, 
      dto.limit || 50
    );

    return articles.map(article => this.mapToUserArticleSummaryResponse(article));
  }

  /**
   * Get detailed article progress
   * GET /api/v1/users/me/articles/:articleId
   */
  async getUserArticle(dto: GetUserArticleDto): Promise<UserArticleDetailResponse> {
    const { user: { id: userId } } = this.requestContext;
    const { userArticlesRepository } = this.dependencies;

    const article = notFoundCheck(await userArticlesRepository.findByUserAndArticle(userId, dto.articleId), 'User Article');
    
    return this.mapToUserArticleDetailResponse(article);
  }

  private mapToUserArticleSummaryResponse(article: any): UserArticleSummaryResponse {
    return {
      articleId: article.articleId,
      status: article.status,
      firstReadDate: article.firstReadDate?.toISOString() || null,
      lastReadDate: article.lastReadDate?.toISOString() || null,
      quizAttempts: article.quizAttempts,
      quizAllCorrectAnswers: article.quizAllCorrectAnswers,
    };
  }

  private mapToUserArticleDetailResponse(article: any): UserArticleDetailResponse {
    return {
      articleId: article.articleId,
      status: article.status,
      firstReadDate: article.firstReadDate?.toISOString() || null,
      lastReadDate: article.lastReadDate?.toISOString() || null,
      quizAttempts: article.quizAttempts,
      quizAllCorrectAnswers: article.quizAllCorrectAnswers,
      quizFirstAttemptedAt: article.quizFirstAttemptedAt?.toISOString() || null,
      quizLastAttemptedAt: article.quizLastAttemptedAt?.toISOString() || null,
      quizStartedAt: article.quizStartedAt?.toISOString() || null,
      quizCompletedAt: article.quizCompletedAt?.toISOString() || null,
      quizAnswers: article.quizAnswers,
      createdAt: article.createdAt.toISOString(),
      updatedAt: article.updatedAt.toISOString(),
    };
  }
}
