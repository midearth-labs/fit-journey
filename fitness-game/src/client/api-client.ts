import type {
  UpdateUserProfileDto,
  UserProfileResponse,
  PutUserLogDto,
  ListUserLogsDto,
  UserLogResponse,
  CreateUserChallengeDto,
  UpdateUserChallengeScheduleDto,
  SubmitUserChallengeQuizDto,
  NewUserChallengeResponse,
  UserChallengeDetailResponse,
  UserChallengeProgressResponse,
  SubmitQuestionDto,
  ListQuestionsDto,
  GetQuestionDto,
  NewQuestionResponse,
  QuestionResponse,
  SubmitAnswerDto,
  ListAnswersDto,
  AnswerResponse,
  AddReactionDto,
  AddAnswerReactionDto,
  ShareProgressDto,
  AddShareReactionDto,
  ProgressShareResponse,
  InviteStatsResponse
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
  async getMyProfile(): Promise<UserProfileResponse> {
    return this.request<UserProfileResponse>('/users/me/profile', { method: 'GET' });
  }

  /** PATCH /users/me/profile */
  async updateMyProfile(dto: UpdateUserProfileDto): Promise<void> {
    await this.request<void>('/users/me/profile', { method: 'PATCH', body: JSON.stringify(dto) });
  }

  // ---------- Logs ----------

  /** GET /logs with optional filters */
  async listLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]> {
    return this.request<UserLogResponse[]>('/logs', { method: 'GET' }, {
      query: {
        userChallengeId: dto.userChallengeId,
        fromDate: dto.fromDate,
        toDate: dto.toDate
      }
    });
  }

  /** PUT /logs/:logDate */
  async putLog(dto: PutUserLogDto): Promise<void> {
    await this.request<void>('/logs/:logDate', { method: 'PUT', body: JSON.stringify({ values: dto.values }) }, {
      params: { logDate: dto.logDate }
    });
  }

  // ---------- User Challenges ----------

  /** POST /user-challenges */
  async createUserChallenge(dto: CreateUserChallengeDto): Promise<NewUserChallengeResponse> {
    return this.request<NewUserChallengeResponse>('/user-challenges', { method: 'POST', body: JSON.stringify(dto) });
  }

  /** GET /user-challenges */
  async listUserChallenges(): Promise<NewUserChallengeResponse[]> {
    return this.request<NewUserChallengeResponse[]>('/user-challenges', { method: 'GET' });
  }

  /** GET /user-challenges/:userChallengeId */
  async getUserChallenge(userChallengeId: string): Promise<UserChallengeDetailResponse> {
    return this.request<UserChallengeDetailResponse>('/user-challenges/:userChallengeId', { method: 'GET' }, {
      params: { userChallengeId }
    });
  }

  /** PATCH /user-challenges/:userChallengeId/schedule */
  async updateUserChallengeSchedule(dto: UpdateUserChallengeScheduleDto): Promise<void> {
    await this.request<void>('/user-challenges/:userChallengeId/schedule', { method: 'PATCH', body: JSON.stringify({ newStartDate: dto.newStartDate }) }, {
      params: { userChallengeId: dto.userChallengeId }
    });
  }

  /** DELETE /user-challenges/:userChallengeId */
  async cancelUserChallenge(userChallengeId: string): Promise<void> {
    await this.request<void>('/user-challenges/:userChallengeId', { method: 'DELETE' }, {
      params: { userChallengeId }
    });
  }

  // ---------- User Challenge Quizzes ----------

  /** GET /user-challenges/:userChallengeId/quizzes */
  async listUserChallengeQuizSubmissions(params: { userChallengeId: string; fromDate?: string; toDate?: string }): Promise<UserChallengeProgressResponse[]> {
    return this.request<UserChallengeProgressResponse[]>('/user-challenges/:userChallengeId/quizzes', { method: 'GET' }, {
      params: { userChallengeId: params.userChallengeId },
      query: { fromDate: params.fromDate, toDate: params.toDate }
    });
  }

  /** POST /user-challenges/:userChallengeId/quizzes/:knowledgeBaseId */
  async submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void> {
    await this.request<void>('/user-challenges/:userChallengeId/quizzes/:knowledgeBaseId', {
      method: 'POST',
      body: JSON.stringify({
        quizAnswers: dto.quizAnswers,
        overrideSubmission: dto.overrideSubmission
      })
    }, {
      params: { userChallengeId: dto.userChallengeId, knowledgeBaseId: dto.knowledgeBaseId }
    });
  }

  // ---------- Content (public-like, but still under /api) ----------

  /** GET /content/challenges */
  async listChallenges<T = unknown>(): Promise<T> {
    return this.request<T>('/content/challenges', { method: 'GET' });
  }

  /** GET /content/challenges/:challengeId */
  async getChallengeById<T = unknown>(challengeId: string): Promise<T> {
    return this.request<T>('/content/challenges/:challengeId', { method: 'GET' }, {
      params: { challengeId }
    });
  }

  // ---------- Social Features ----------

  // ---------- Questions ----------

  /** POST /social/questions */
  async submitQuestion(dto: SubmitQuestionDto): Promise<NewQuestionResponse> {
    return this.request<NewQuestionResponse>('/social/questions', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** GET /social/questions?articleId=:articleId */
  async listQuestions(dto: ListQuestionsDto): Promise<QuestionResponse[]> {
    return this.request<QuestionResponse[]>('/social/questions', { method: 'GET' }, {
      query: {
        articleId: dto.articleId,
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** GET /social/questions/:questionId */
  async getQuestion(questionId: string): Promise<QuestionResponse> {
    return this.request<QuestionResponse>('/social/questions/:questionId', { method: 'GET' }, {
      params: { questionId }
    });
  }

  /** POST /social/questions/:questionId/reactions */
  async addQuestionReaction(dto: AddReactionDto): Promise<void> {
    await this.request<void>('/social/questions/:questionId/reactions', { 
      method: 'POST', 
      body: JSON.stringify({ reactionType: dto.reactionType }) 
    }, {
      params: { questionId: dto.questionId }
    });
  }

  // ---------- Answers ----------

  /** POST /social/questions/:questionId/answers */
  async submitAnswer(dto: SubmitAnswerDto): Promise<void> {
    await this.request<void>('/social/questions/:questionId/answers', { 
      method: 'POST', 
      body: JSON.stringify({ answer: dto.answer, isAnonymous: dto.isAnonymous }) 
    }, {
      params: { questionId: dto.questionId }
    });
  }

  /** GET /social/questions/:questionId/answers */
  async listAnswers(dto: ListAnswersDto): Promise<AnswerResponse[]> {
    return this.request<AnswerResponse[]>('/social/questions/:questionId/answers', { method: 'GET' }, {
      params: { questionId: dto.questionId },
      query: {
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** POST /social/questions/:questionId/answers/:answerId/reactions */
  async addAnswerReaction(dto: AddAnswerReactionDto): Promise<void> {
    await this.request<void>('/social/questions/:questionId/answers/:answerId/reactions', { 
      method: 'POST', 
      body: JSON.stringify({ reactionType: dto.reactionType }) 
    }, {
      params: { questionId: dto.questionId, answerId: dto.answerId }
    });
  }

  // ---------- Progress Shares ----------

  /** POST /social/share */
  async shareProgress(dto: ShareProgressDto): Promise<ProgressShareResponse> {
    return this.request<ProgressShareResponse>('/social/share', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** POST /social/shares/:shareId/reactions */
  async addShareReaction(dto: AddShareReactionDto): Promise<void> {
    await this.request<void>('/social/shares/:shareId/reactions', { 
      method: 'POST', 
      body: JSON.stringify({ reactionType: dto.reactionType }) 
    }, {
      params: { shareId: dto.shareId }
    });
  }

  // ---------- Invitations ----------

  /** GET /social/invite/stats */
  async getInviteStats(): Promise<InviteStatsResponse> {
    return this.request<InviteStatsResponse>('/social/invite/stats', { method: 'GET' });
  }
}

export default ApiClient;


