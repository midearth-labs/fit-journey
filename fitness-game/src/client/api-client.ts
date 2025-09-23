import type {
  GetUserProfileOperation,
  UpdateUserProfileOperation,
  ListUserLogsOperation,
  PutUserLogOperation,
  CreateUserChallengeOperation,
  ListUserChallengesOperation,
  GetUserChallengeOperation,
  UpdateUserChallengeScheduleOperation,
  CancelUserChallengeOperation,
  ListUserChallengeQuizSubmissionsOperation,
  SubmitUserChallengeQuizOperation,
  ListChallengesOperation,
  GetChallengeOperation,
  SubmitQuestionOperation,
  ListQuestionsOperation,
  GetQuestionOperation,
  AddQuestionReactionOperation,
  SubmitAnswerOperation,
  ListAnswersOperation,
  GetAnswerOperation,
  AddAnswerReactionOperation,
  ShareProgressOperation,
  AddShareReactionOperation,
  GetUserSharesOperation,
  GetUserShareOperation,
  UpdateShareStatusOperation,
  GetPublicSharesOperation,
  GetShareOperation,
  DeleteShareOperation
} from '$lib/server/shared/schemas';

/**
 * Lightweight API client for calling the server's /api/v1 endpoints.
 * - Accepts a baseUrl in the constructor and composes full request URLs
 * - Reuses Zod-inferred DTO/response types from $lib/server/shared/schemas
 * - Centralizes fetch logic with JSON handling and error propagation
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  /**
   * Create a new ApiClient.
   * @param baseUrl Base URL to prefix all API calls, e.g. "/api/v1" or "https://host/api/v1"
   * @param headers Optional default headers (e.g. authentication). Values are merged per request.
   */
  constructor(baseUrl: string, headers?: Record<string, string>) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  /** Core fetch wrapper for JSON APIs with URL building and parameter substitution */
  private async request<TResponse>(
    path: string, 
    init?: RequestInit,
    options?: {
      params?: Record<string, string | number | boolean | undefined | null>;
      query?: Record<string, string | number | boolean | undefined | null>;
    }
  ): Promise<TResponse> {
    // @TODO: find a way to make params and query more type safe
    // Replace path parameters (e.g., :userId -> actual value)
    let resolvedPath = path;
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          resolvedPath = resolvedPath.replace(`:${key}`, encodeURIComponent(String(value)));
        }
      }
    }

    // Build full URL with query parameters
    const url = new URL(`${this.baseUrl}${resolvedPath}`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }

    // If we constructed with a fake origin (SSR), strip it back off
    const href = url.toString();
    const origin = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const finalUrl = href.startsWith(origin) ? href.slice(origin.length) : href;

    const res = await fetch(finalUrl, {
      credentials: 'include',
      ...init,
      headers: {
        ...this.defaultHeaders,
        ...(init?.headers as Record<string, string> | undefined)
      }
    });

    if (!res.ok) {
      // Try to parse JSON error body; fall back to text
      let errorBody: unknown = undefined;
      try {
        errorBody = await res.clone().json();
      } catch {
        try {
          errorBody = await res.text();
        } catch {
          // ignore
        }
      }
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      (err as any).status = res.status;
      (err as any).body = errorBody;
      throw err;
    }

    // No content
    if (res.status === 204) return undefined as unknown as TResponse;

    // Parse JSON
    return res.json() as Promise<TResponse>;
  }

  // ---------- Users ----------

  /** GET /users/me/profile */
  async getMyProfile(): Promise<GetUserProfileOperation['response']['body']> {
    return this.request<GetUserProfileOperation['response']['body']>('/api/v1/users/me/profile', { method: 'GET' });
  }

  /** PATCH /users/me/profile */
  async updateMyProfile(dto: UpdateUserProfileOperation['request']['body']): Promise<UpdateUserProfileOperation['response']['body']> {
    return this.request<UpdateUserProfileOperation['response']['body']>('/api/v1/users/me/profile', { method: 'PATCH', body: JSON.stringify(dto) });
  }

  // ---------- Logs ----------

  /** GET /logs with optional filters */
  async listLogs(dto: ListUserLogsOperation['request']['query']): Promise<ListUserLogsOperation['response']['body']> {
    return this.request<ListUserLogsOperation['response']['body']>('/api/v1/logs', { method: 'GET' }, {
      query: {
        userChallengeId: dto.userChallengeId,
        fromDate: dto.fromDate,
        toDate: dto.toDate
      }
    });
  }

  /** PUT /logs/:logDate */
  async putLog(dto: PutUserLogOperation['request']): Promise<PutUserLogOperation['response']['body']> {
    return this.request<PutUserLogOperation['response']['body']>('/api/v1/logs/:logDate', { method: 'PUT', body: JSON.stringify(dto.body) }, {
      params: { logDate: dto.params.logDate }
    });
  }

  // ---------- User Challenges ----------

  /** POST /user-challenges */
  async createUserChallenge(dto: CreateUserChallengeOperation['request']['body']): Promise<CreateUserChallengeOperation['response']['body']> {
    return this.request<CreateUserChallengeOperation['response']['body']>('/api/v1/user-challenges', { method: 'POST', body: JSON.stringify(dto) });
  }

  /** GET /user-challenges */
  async listUserChallenges(): Promise<ListUserChallengesOperation['response']['body']> {
    return this.request<ListUserChallengesOperation['response']['body']>('/api/v1/user-challenges', { method: 'GET' });
  }

  /** GET /user-challenges/:userChallengeId */
  async getUserChallenge(userChallengeId: string): Promise<GetUserChallengeOperation['response']['body']> {
    return this.request<GetUserChallengeOperation['response']['body']>('/api/v1/user-challenges/:userChallengeId', { method: 'GET' }, {
      params: { userChallengeId }
    });
  }

  /** PATCH /user-challenges/:userChallengeId/schedule */
  async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleOperation['request']): Promise<UpdateUserChallengeScheduleOperation['response']['body']> {
    return this.request<UpdateUserChallengeScheduleOperation['response']['body']>('/api/v1/user-challenges/:userChallengeId/schedule', { method: 'PATCH', body: JSON.stringify(dto.body) }, {
      params: { userChallengeId: dto.params.userChallengeId }
    });
  }

  /** DELETE /user-challenges/:userChallengeId */
  async cancelUserChallenge(userChallengeId: string): Promise<CancelUserChallengeOperation['response']['body']> {
    return this.request<CancelUserChallengeOperation['response']['body']>('/api/v1/user-challenges/:userChallengeId', { method: 'DELETE' }, {
      params: { userChallengeId }
    });
  }

  // ---------- User Challenge Quizzes ----------

  /** GET /user-challenges/:userChallengeId/quizzes */
  async listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsOperation['request']): Promise<ListUserChallengeQuizSubmissionsOperation['response']['body']> {
    return this.request<ListUserChallengeQuizSubmissionsOperation['response']['body']>('/api/v1/user-challenges/:userChallengeId/quizzes', { method: 'GET' }, {
      params: { userChallengeId: dto.params.userChallengeId },
      query: { fromDate: dto.query.fromDate, toDate: dto.query.toDate }
    });
  }

  /** POST /user-challenges/:userChallengeId/quizzes/:knowledgeBaseId */
  async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizOperation['request']): Promise<SubmitUserChallengeQuizOperation['response']['body']> {
    return this.request<SubmitUserChallengeQuizOperation['response']['body']>('/api/v1/user-challenges/:userChallengeId/quizzes/:knowledgeBaseId', {
      method: 'POST',
      body: JSON.stringify(dto.body)
    }, {
      params: { userChallengeId: dto.params.userChallengeId, knowledgeBaseId: dto.params.knowledgeBaseId }
    });
  }

  // ---------- Content (public-like, but still under /api) ----------

  /** GET /content/challenges */
  async listChallenges(): Promise<ListChallengesOperation['response']['body']> {
    return this.request<ListChallengesOperation['response']['body']>('/api/v1/content/challenges', { method: 'GET' });
  }

  /** GET /content/challenges/:challengeId */
  async getChallengeById(challengeId: string): Promise<GetChallengeOperation['response']['body']> {
    return this.request<GetChallengeOperation['response']['body']>('/api/v1/content/challenges/:challengeId', { method: 'GET' }, {
      params: { challengeId }
    });
  }

  // ---------- Social Features ----------

  // ---------- Questions ----------

  /** POST /social/questions */
  async submitQuestion(dto: SubmitQuestionOperation['request']['body']): Promise<SubmitQuestionOperation['response']['body']> {
    return this.request<SubmitQuestionOperation['response']['body']>('/api/v1/social/questions', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** GET /social/questions?articleId=:articleId */
  async listQuestions(dto: ListQuestionsOperation['request']['query']): Promise<ListQuestionsOperation['response']['body']> {
    return this.request<ListQuestionsOperation['response']['body']>('/api/v1/social/questions', { method: 'GET' }, {
      query: {
        articleId: dto.articleId,
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** GET /social/questions/:questionId */
  async getQuestion(questionId: string): Promise<GetQuestionOperation['response']['body']> {
    return this.request<GetQuestionOperation['response']['body']>('/api/v1/social/questions/:questionId', { method: 'GET' }, {
      params: { questionId }
    });
  }

  /** POST /social/questions/:questionId/reactions */
  async addQuestionReaction(dto: AddQuestionReactionOperation['request']): Promise<AddQuestionReactionOperation['response']['body']> {
    return this.request<AddQuestionReactionOperation['response']['body']>('/api/v1/social/questions/:questionId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId }
    });
  }

  // ---------- Answers ----------

  /** POST /social/questions/:questionId/answers */
  async submitAnswer(dto: SubmitAnswerOperation['request']): Promise<SubmitAnswerOperation['response']['body']> {
    return this.request<SubmitAnswerOperation['response']['body']>('/api/v1/social/questions/:questionId/answers', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId }
    });
  }

  /** GET /social/questions/:questionId/answers */
  async listAnswers(dto: ListAnswersOperation['request']): Promise<ListAnswersOperation['response']['body']> {
    return this.request<ListAnswersOperation['response']['body']>('/api/v1/social/questions/:questionId/answers', { method: 'GET' }, {
      params: { questionId: dto.params.questionId },
      query: {
        page: dto.query.page,
        limit: dto.query.limit
      }
    });
  }

  /** GET /social/questions/:questionId/answers/:answerId */
  async getAnswer(questionId: string, answerId: string): Promise<GetAnswerOperation['response']['body']> {
    return this.request<GetAnswerOperation['response']['body']>('/api/v1/social/questions/:questionId/answers/:answerId', { method: 'GET' }, {
      params: { questionId, answerId }
    });
  }

  /** POST /social/questions/:questionId/answers/:answerId/reactions */
  async addAnswerReaction(dto: AddAnswerReactionOperation['request']): Promise<AddAnswerReactionOperation['response']['body']> {
    return this.request<AddAnswerReactionOperation['response']['body']>('/api/v1/social/questions/:questionId/answers/:answerId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId, answerId: dto.params.answerId }
    });
  }

  // ---------- Progress Shares ----------

  /** POST /progress-shares */
  async shareProgress(dto: ShareProgressOperation['request']['body']): Promise<ShareProgressOperation['response']['body']> {
    return this.request<ShareProgressOperation['response']['body']>('/api/v1/progress-shares', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** GET /progress-shares */
  async getPublicShares(dto: GetPublicSharesOperation['request']['query']): Promise<GetPublicSharesOperation['response']['body']> {
    return this.request<GetPublicSharesOperation['response']['body']>('/api/v1/progress-shares', { method: 'GET' }, {
      query: {
        shareType: dto.shareType,
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** GET /public/api/v1/progress-shares/:shareId */
  async getShare(shareId: string): Promise<GetShareOperation['response']['body']> {
    return this.request<GetShareOperation['response']['body']>('/public/api/v1/progress-shares/:shareId', { method: 'GET' }, {
      params: { shareId }
    });
  }

  /** GET /users/me/progress-shares */
  async getMyShares(dto: GetUserSharesOperation['request']['query']): Promise<GetUserSharesOperation['response']['body']> {
    return this.request<GetUserSharesOperation['response']['body']>('/api/v1/users/me/progress-shares', { method: 'GET' }, {
      query: {
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** GET /users/me/progress-shares/:shareId */
  async getMyShare(shareId: string): Promise<GetUserShareOperation['response']['body']> {
    return this.request<GetUserShareOperation['response']['body']>('/api/v1/users/me/progress-shares/:shareId', { method: 'GET' }, {
      params: { shareId }
    });
  }

  /** PUT /users/me/progress-shares/:shareId/status */
  async updateShareStatus(shareId: string, dto: UpdateShareStatusOperation['request']['body']): Promise<UpdateShareStatusOperation['response']['body']> {
    return this.request<UpdateShareStatusOperation['response']['body']>('/api/v1/users/me/progress-shares/:shareId/status', { 
      method: 'PUT', 
      body: JSON.stringify(dto) 
    }, {
      params: { shareId }
    });
  }

  /** DELETE /progress-shares/:shareId */
  async deleteShare(shareId: string): Promise<DeleteShareOperation['response']['body']> {
    return this.request<DeleteShareOperation['response']['body']>('/api/v1/progress-shares/:shareId', { method: 'DELETE' }, {
      params: { shareId }
    });
  }

  /** POST /progress-shares/:shareId/reactions */
  async addShareReaction(dto: AddShareReactionOperation['request']): Promise<AddShareReactionOperation['response']['body']> {
    return this.request<AddShareReactionOperation['response']['body']>('/public/api/v1/progress-shares/:shareId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { shareId: dto.params.shareId }
    });
  }

}

export default ApiClient;


