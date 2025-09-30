import type {
  GetUserProfileOperation,
  GetUserMetadataOperation,
  UpdateUserProfileOperation,
  ListUserLogsOperation,
  PutUserLogOperation,
  CreateUserChallengeOperation,
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
  DeleteShareOperation,
  UpdateUserChallengeOperation,
  JoinChallengeOperation,
  LeaveChallengeOperation,
  ListPublicChallengesOperation,
  GetUserChallengeOperation,
  ListChallengesOwnedByUserOperation,
  ListChallengesJoinedByUserOperation,
  ListChallengeJoinedByUserMembersOperation,
  GetChallengeJoinedByUserSubscriptionOperation,
  DeleteUserChallengeOperation,
  LogReadOperation,
  StartQuizOperation,
  SubmitQuizOperation,
  RetryQuizOperation,
  StartPracticalOperation,
  CompletePracticalOperation,
  SkipPracticalOperation,
  CompleteArticleOperation,
  ListUserArticlesOperation,
  GetUserArticleOperation,
  UpdateCalendarSettingsOperation,
  GetCalendarSettingsOperation,
  DownloadUserCalendarOperation,
  GetPublicCalendarOperation,
  GetGlobalStatisticsOperation,
  GetArticleStatisticsOperation
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

  // ---------- User Profile Management ----------
  // Powers: User authentication, profile customization, avatar progression, personalized content delivery

  /** 
   * GET /users/me/profile
   * 
   * Retrieves the authenticated user's complete profile information including:
   * - Basic identity (email, display name)
   * - Avatar customization settings (gender, age range)
   * - Personalization preferences (country codes, timezone, reminder time)
   * - Notification preferences
   * - Learning path preferences (learningPaths)
   * - Invitation system data (invitation code, join count)
   * 
   * Features powered:
   * - User dashboard display
   * - Avatar rendering with correct gender/age combination
   * - Personalized content recommendations based on country/timezone
   * - Notification scheduling based on user preferences
   * - Social invitation system (sharing invitation codes)
   * 
   * Used in: Profile pages, dashboard headers, avatar displays, settings panels
   */
  async getMyProfile(): Promise<GetUserProfileOperation['response']['body']> {
    return this.request<GetUserProfileOperation['response']['body']>('/api/v1/users/me/profile', { method: 'GET' });
  }

  /** 
   * PATCH /users/me/profile
   * 
   * Updates the authenticated user's profile information. All fields are optional,
   * supporting progressive profile enhancement as users engage more with the platform.
   * 
   * Updatable fields:
   * - displayName: User's chosen display name for social features
   * - avatarGender: Gender selection for avatar customization (male/female/non-binary)
   * - avatarAgeRange: Age range for avatar appearance (teen/young-adult/adult/senior)
   * - personalizationCountryCodes: Array of country codes for localized content
   * - learningPaths: Array of learning path identifiers the user wants to follow
   * - timezone: User's timezone for challenge scheduling and reminders
   * - preferredReminderTime: Daily reminder time (HH:MM format)
   * - notificationPreferences: Detailed notification settings
   * 
   * Features powered:
   * - Progressive profile completion (users can skip fields initially)
   * - Avatar progression system (gender/age affects avatar appearance)
   * - Localized content delivery based on country preferences
   * - Challenge scheduling and daily reminder system
   * - Personalized notification management
   * 
   * Used in: Profile setup flows, settings pages, onboarding wizards
   */
  async updateMyProfile(dto: UpdateUserProfileOperation['request']['body']): Promise<UpdateUserProfileOperation['response']['body']> {
    return this.request<UpdateUserProfileOperation['response']['body']>('/api/v1/users/me/profile', { method: 'PATCH', body: JSON.stringify(dto) });
  }

  /**
   * GET /users/me/metadata
   * 
   * Retrieves the authenticated user's metadata including:
   * - Feature flags and enabled capabilities
   * - Current fitness level and progression metrics
   * - Activity statistics (articles completed, challenges joined, etc.)
   * - Streak information and achievement data
   * - Last activity timestamp
   * 
   * This data is used for:
   * - Dashboard analytics and progress visualization
   * - Feature gating and capability checks
   * - Gamification elements (streaks, achievements)
   * - Personalization algorithms
   * 
   * Used in: Dashboard, progress tracking, feature toggles, analytics
   */
  async getMyMetadata(): Promise<GetUserMetadataOperation['response']['body']> {
    return this.request<GetUserMetadataOperation['response']['body']>('/api/v1/users/me/metadata', { method: 'GET' });
  }

  // ---------- Daily Habit Logging & Progress Tracking ----------
  // Powers: Wellness metrics tracking, streak management, avatar progression, challenge completion

  /** 
   * GET /logs with optional filters
   * 
   * Retrieves the user's daily habit logs with flexible filtering options.
   * Supports filtering by challenge participation and date ranges for analytics.
   * 
   * Query parameters:
   * - userChallengeId: Filter logs for a specific challenge (optional)
   * - fromDate: Start date for log retrieval (ISO date format)
   * - toDate: End date for log retrieval (ISO date format)
   * 
   * Returns array of log entries with:
   * - logDate: The date of the log entry
   * - values: Object containing logged metrics (dailyMovement, cleanEating, sleepQuality, hydration)
   * 
   * Features powered:
   * - Progress visualization dashboards
   * - Streak calculation and display
   * - Challenge-specific progress tracking
   * - Historical analytics and trend analysis
   * - Avatar progression based on habit consistency
   * 
   * Used in: Dashboard analytics, progress charts, streak displays, challenge progress views
   */
  async listLogs(dto: ListUserLogsOperation['request']['query']): Promise<ListUserLogsOperation['response']['body']> {
    return this.request<ListUserLogsOperation['response']['body']>('/api/v1/logs', { method: 'GET' }, {
      query: {
        userChallengeId: dto.userChallengeId,
        fromDate: dto.fromDate,
        toDate: dto.toDate
      }
    });
  }

  /** 
   * PUT /logs/:logDate
   * 
   * Creates or updates daily habit logs for a specific date. Users log wellness metrics
   * that contribute to their overall fitness journey and avatar progression.
   * 
   * Path parameters:
   * - logDate: The date for the log entry (ISO date format)
   * 
   * Request body contains values object with optional metrics:
   * - dailyMovement: Physical activity tracking (15+ minutes of movement)
   * - cleanEating: Nutrition quality assessment (nutritious food choices)
   * - sleepQuality: Sleep tracking (7-9 hours of restorative sleep)
   * - hydration: Water intake monitoring (adequate daily hydration)
   * - moodCheck: Mood tracking (how the user feels)
   * - energyLevel: Energy level tracking (how the user feels)
   * 
   * Features powered:
   * - Daily wellness habit tracking
   * - Multi-type streak management (individual habits + "perfect day" streaks)
   * - Challenge-specific metric requirements (e.g., nutrition challenges only require cleanEating)
   * - Avatar progression based on consistent habit logging
   * - Progress analytics and trend identification
   * - [Placeholder] Integration with wearable devices for automatic logging
   * 
   * Used in: Daily habit logging interfaces, challenge completion tracking, streak management
   */
  async putLog(dto: PutUserLogOperation['request']): Promise<PutUserLogOperation['response']['body']> {
    return this.request<PutUserLogOperation['response']['body']>('/api/v1/logs/:logDate', { method: 'PUT', body: JSON.stringify(dto.body) }, {
      params: { logDate: dto.params.logDate }
    });
  }

  // ---------- Challenge System V2 ----------
  // Powers: Structured fitness journeys, social challenges, progress tracking, gamification

  /** 
   * GET /api/v1/challenges
   * 
   * Retrieves publicly available challenges that users can discover and join.
   * Supports pagination for browsing large challenge catalogs.
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of challenges per page (default: 20, max: 100)
   * 
   * Returns array of challenge objects with:
   * - Basic challenge info (name, description, goals, duration)
   * - Challenge settings (join type, max members, status)
   * - Participation metrics (member count, creation date)
   * 
   * Features powered:
   * - Challenge discovery and browsing
   * - Public challenge marketplace
   * - Challenge recommendation system
   * - Social challenge exploration
   * 
   * Used in: Challenge discovery pages, homepage featured challenges, search results
   */
  async listPublicChallenges(query: ListPublicChallengesOperation['request']['query']): Promise<ListPublicChallengesOperation['response']['body']> {
    return this.request<ListPublicChallengesOperation['response']['body']>('/api/v1/challenges', { method: 'GET' }, {
      query
    });
  }

  /** 
   * POST /api/v1/users/me/challenges
   * 
   * Creates a new personal or public challenge that users can participate in.
   * Supports different challenge types and social configurations.
   * 
   * Request body contains:
   * - name: Challenge title (1-120 characters)
   * - description: Detailed challenge description (max 2000 characters)
   * - goals: Array of specific fitness goals (1-10 goals)
   * - startDate: Challenge start date (ISO date format)
   * - durationDays: Challenge duration (1-365 days)
   * - joinType: Challenge visibility ('personal', 'public', 'invite-code')
   * - maxMembers: Maximum participants (1-1000, default: 1)
   * 
   * Features powered:
   * - Personal fitness journey creation
   * - Social challenge hosting
   * - Custom challenge templates
   * - Invite-only challenge groups
   * - Challenge goal setting and tracking
   * 
   * Used in: Challenge creation wizards, personal journey setup, social challenge hosting
   */
  async createChallenge(dto: CreateUserChallengeOperation['request']['body']): Promise<CreateUserChallengeOperation['response']['body']> {
    return this.request<CreateUserChallengeOperation['response']['body']>('/api/v1/users/me/challenges', { method: 'POST', body: JSON.stringify(dto) });
  }

  /** 
   * GET /api/v1/users/me/challenges/:challengeId
   * 
   * Retrieves detailed information about a specific challenge owned by the user.
   * Includes challenge settings, progress metrics, and participation data.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge
   * 
   * Returns challenge object with:
   * - Complete challenge configuration
   * - Current status (not_started, active, completed, locked, inactive)
   * - Member count and participation metrics
   * - Challenge timeline and scheduling info
   * 
   * Features powered:
   * - Challenge management dashboard
   * - Progress tracking and analytics
   * - Challenge status monitoring
   * - Member management interface
   * 
   * Used in: Challenge detail pages, owner dashboards, progress tracking views
   */
  async getUserChallenge(challengeId: string): Promise<GetUserChallengeOperation['response']['body']> {
    return this.request<GetUserChallengeOperation['response']['body']>('/api/v1/users/me/challenges/:challengeId', { method: 'GET' }, {
      params: { challengeId }
    });
  }

  /** 
   * PATCH /api/v1/users/me/challenges/:challengeId
   * 
   * Updates an existing challenge owned by the user. Allows modification of
   * challenge settings, goals, and scheduling while preserving participation data.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge
   * 
   * Request body supports updating:
   * - Challenge name and description
   * - Goals and objectives
   * - Duration and scheduling
   * - Join type and member limits
   * 
   * Features powered:
   * - Challenge customization and refinement
   * - Goal adjustment based on progress
   * - Schedule modification for flexibility
   * - Privacy and access control updates
   * 
   * Used in: Challenge editing interfaces, goal adjustment workflows, schedule management
   */
  async updateUserChallenge(dto: UpdateUserChallengeOperation['request']): Promise<UpdateUserChallengeOperation['response']['body']> {
    return this.request<UpdateUserChallengeOperation['response']['body']>('/api/v1/users/me/challenges/:challengeId', { method: 'PATCH', body: JSON.stringify(dto.body) }, {
      params: { challengeId: dto.params.challengeId }
    });
  }

  /** 
   * DELETE /api/v1/users/me/challenges/:challengeId
   * 
   * Permanently deletes a challenge owned by the user. This action removes
   * the challenge and all associated participation data.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge to delete
   * 
   * Features powered:
   * - Challenge cleanup and management
   * - Data privacy compliance
   * - Challenge lifecycle management
   * - [Placeholder] Bulk challenge deletion for account cleanup
   * 
   * Used in: Challenge management interfaces, account cleanup workflows
   */
  async deleteUserChallenge(challengeId: string): Promise<DeleteUserChallengeOperation['response']['body']> {
    return this.request<DeleteUserChallengeOperation['response']['body']>('/api/v1/users/me/challenges/:challengeId', { method: 'DELETE' }, {
      params: { challengeId }
    });
  }

  /** 
   * POST /api/v1/challenges/:challengeId/join
   * 
   * Allows users to join existing challenges, either public challenges or
   * invite-only challenges with proper invitation codes.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge to join
   * 
   * Request body contains:
   * - inviteCode: Optional invitation code for invite-only challenges
   * 
   * Features powered:
   * - Social challenge participation
   * - Invite-only challenge access
   * - Challenge discovery and joining
   * - Community building through shared challenges
   * - [Placeholder] Team-based challenge formation
   * 
   * Used in: Challenge joining interfaces, invitation acceptance flows, social discovery
   */
  async joinChallenge(dto: JoinChallengeOperation['request']): Promise<JoinChallengeOperation['response']['body']> {
    return this.request<JoinChallengeOperation['response']['body']>('/api/v1/challenges/:challengeId/join', { method: 'POST', body: JSON.stringify(dto.body) }, {
      params: { challengeId: dto.params.challengeId }
    });
  }

  /** 
   * POST /api/v1/challenges/:challengeId/leave
   * 
   * Allows users to leave challenges they've joined. Removes their participation
   * data while preserving the challenge for other participants.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge to leave
   * 
   * Features powered:
   * - Flexible challenge participation
   * - User autonomy in challenge management
   * - Challenge cleanup for inactive users
   * - Data privacy and user control
   * 
   * Used in: Challenge management interfaces, participation withdrawal flows
   */
  async leaveChallenge(challengeId: string): Promise<LeaveChallengeOperation['response']['body']> {
    return this.request<LeaveChallengeOperation['response']['body']>('/api/v1/challenges/:challengeId/leave', { method: 'POST' }, {
      params: { challengeId }
    });
  }

  /** 
   * GET /api/v1/users/me/challenges/owned
   * 
   * Retrieves all challenges created by the authenticated user with pagination support.
   * Provides comprehensive view of user's challenge hosting activity.
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of challenges per page (default: 20, max: 100)
   * 
   * Returns array of owned challenges with:
   * - Complete challenge information
   * - Participation metrics and member counts
   * - Challenge status and timeline data
   * 
   * Features powered:
   * - Challenge creator dashboard
   * - Hosting activity tracking
   * - Challenge management overview
   * - Creator analytics and insights
   * 
   * Used in: Creator dashboards, challenge management pages, hosting analytics
   */
  async listChallengesOwnedByUser(query: ListChallengesOwnedByUserOperation['request']['query']): Promise<ListChallengesOwnedByUserOperation['response']['body']> {
    return this.request<ListChallengesOwnedByUserOperation['response']['body']>('/api/v1/users/me/challenges/owned', { method: 'GET' }, {
      query
    });
  }

  /** 
   * GET /api/v1/users/me/challenges/joined
   * 
   * Retrieves all challenges the user has joined with participation metrics.
   * Shows active and completed challenges with progress tracking.
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of challenges per page (default: 20, max: 100)
   * 
   * Returns array of joined challenges with:
   * - Challenge basic information
   * - User's participation data (joined date, log count)
   * - Last activity tracking
   * - Challenge status and progress
   * 
   * Features powered:
   * - Personal challenge dashboard
   * - Participation tracking and analytics
   * - Progress monitoring across multiple challenges
   * - Activity-based challenge recommendations
   * 
   * Used in: Personal dashboards, participation tracking, progress monitoring
   */
  async listChallengesJoinedByUser(query: ListChallengesJoinedByUserOperation['request']['query']): Promise<ListChallengesJoinedByUserOperation['response']['body']> {
    return this.request<ListChallengesJoinedByUserOperation['response']['body']>('/api/v1/users/me/challenges/joined', { method: 'GET' }, {
      query
    });
  }

  /** 
   * GET /api/v1/users/me/challenges/joined/:challengeId/members
   * 
   * Retrieves member information for a specific challenge the user has joined.
   * Provides social context and community engagement metrics.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of members per page (default: 20, max: 100)
   * 
   * Returns array of member objects with:
   * - Member identification (user ID, join date)
   * - Participation metrics (daily log count)
   * - Activity tracking data
   * 
   * Features powered:
   * - Social challenge community views
   * - Member activity tracking
   * - Community engagement metrics
   * - Social motivation and competition
   * - [Placeholder] Member ranking and leaderboards
   * 
   * Used in: Challenge community pages, member leaderboards, social engagement views
   */
  async listChallengeJoinedByUserMembers(challengeId: string, query: ListChallengeJoinedByUserMembersOperation['request']['query']): Promise<ListChallengeJoinedByUserMembersOperation['response']['body']> {
    return this.request<ListChallengeJoinedByUserMembersOperation['response']['body']>('/api/v1/users/me/challenges/joined/:challengeId/members', { method: 'GET' }, {
      params: { challengeId },
      query
    });
  }

  /** 
   * GET /api/v1/users/me/challenges/joined/:challengeId/subscription
   * 
   * Retrieves the user's specific participation data for a joined challenge.
   * Provides detailed subscription information and activity tracking.
   * 
   * Path parameters:
   * - challengeId: Unique identifier for the challenge
   * 
   * Returns subscription object with:
   * - Join date and participation timeline
   * - Daily log count and activity metrics
   * - Last activity date tracking
   * - Subscription status and progress
   * 
   * Features powered:
   * - Individual participation tracking
   * - Personal progress monitoring
   * - Activity streak tracking within challenges
   * - Subscription management and analytics
   * 
   * Used in: Personal challenge progress views, subscription management, activity tracking
   */
  async getChallengeJoinedByUserSubscription(challengeId: string): Promise<GetChallengeJoinedByUserSubscriptionOperation['response']['body']> {
    return this.request<GetChallengeJoinedByUserSubscriptionOperation['response']['body']>('/api/v1/users/me/challenges/joined/:challengeId/subscription', { method: 'GET' }, {
      params: { challengeId }
    });
  }

  // ---------- Social Features & Community ----------
  // Powers: Knowledge sharing, community support, social motivation, progress sharing

  // ---------- Knowledge Q&A Community ----------

  /** 
   * POST /social/questions
   * 
   * Allows users to submit questions related to specific fitness articles.
   * Creates a community-driven knowledge base where users help each other learn.
   * 
   * Request body contains:
   * - articleIds: Array of article IDs the question relates to (1+ required)
   * - title: Question title (10-100 characters)
   * - body: Detailed question description (10-2000 characters)
   * - isAnonymous: Option to post anonymously (default: false)
   * 
   * Features powered:
   * - Article-specific Q&A discussions
   * - Beginner-friendly learning environment
   * - Community knowledge sharing
   * - Expert user recognition system
   * - [Placeholder] AI-powered question categorization
   * 
   * Used in: Article discussion sections, community Q&A interfaces, learning support
   */
  async submitQuestion(dto: SubmitQuestionOperation['request']['body']): Promise<SubmitQuestionOperation['response']['body']> {
    return this.request<SubmitQuestionOperation['response']['body']>('/api/v1/social/questions', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** 
   * GET /social/questions?articleId=:articleId
   * 
   * Retrieves questions related to a specific article with pagination support.
   * Enables users to browse and find relevant discussions for their learning.
   * 
   * Query parameters:
   * - articleId: Article ID to filter questions (required)
   * - page: Page number for pagination (default: 1)
   * - limit: Number of questions per page (default: 20, max: 100)
   * 
   * Returns array of question objects with:
   * - Question content (title, body, status)
   * - Community engagement metrics (helpful/not helpful counts)
   * - Creation and update timestamps
   * - User identification (nullable for anonymous posts)
   * 
   * Features powered:
   * - Article-specific discussion browsing
   * - Community engagement tracking
   * - Question quality assessment
   * - Learning resource discovery
   * 
   * Used in: Article discussion pages, Q&A browsing interfaces, community discovery
   */
  async listQuestions(dto: ListQuestionsOperation['request']['query']): Promise<ListQuestionsOperation['response']['body']> {
    return this.request<ListQuestionsOperation['response']['body']>('/api/v1/social/questions', { method: 'GET' }, {
      query: {
        articleId: dto.articleId,
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** 
   * GET /social/questions/:questionId
   * 
   * Retrieves detailed information about a specific question including
   * all answers and community engagement data.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question
   * 
   * Returns question object with:
   * - Complete question details
   * - Community reaction counts
   * - Creation and update timestamps
   * - User identification and status
   * 
   * Features powered:
   * - Detailed question viewing
   * - Community engagement analysis
   * - Question quality assessment
   * - User contribution tracking
   * 
   * Used in: Question detail pages, community moderation, user contribution views
   */
  async getQuestion(questionId: string): Promise<GetQuestionOperation['response']['body']> {
    return this.request<GetQuestionOperation['response']['body']>('/api/v1/social/questions/:questionId', { method: 'GET' }, {
      params: { questionId }
    });
  }

  /** 
   * POST /social/questions/:questionId/reactions
   * 
   * Allows users to react to questions with helpful/not helpful feedback.
   * Enables community-driven quality assessment and expert recognition.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question
   * 
   * Request body contains:
   * - reactionType: Type of reaction ('helpful' or 'not_helpful')
   * 
   * Features powered:
   * - Community quality assessment
   * - Expert user recognition system
   * - Question ranking and visibility
   * - Community moderation support
   * - [Placeholder] Reputation system for helpful contributors
   * 
   * Used in: Question interaction interfaces, community moderation, quality assessment
   */
  async addQuestionReaction(dto: AddQuestionReactionOperation['request']): Promise<AddQuestionReactionOperation['response']['body']> {
    return this.request<AddQuestionReactionOperation['response']['body']>('/api/v1/social/questions/:questionId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId }
    });
  }

  // ---------- Community Answers ----------

  /** 
   * POST /social/questions/:questionId/answers
   * 
   * Allows users to submit answers to community questions, building
   * a collaborative knowledge base and helping fellow learners.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question being answered
   * 
   * Request body contains:
   * - answer: Detailed answer content (10-2000 characters)
   * - isAnonymous: Option to answer anonymously (default: false)
   * 
   * Features powered:
   * - Community knowledge sharing
   * - Peer-to-peer learning support
   * - Expert user recognition
   * - Collaborative problem solving
   * - [Placeholder] Answer quality scoring and expert badges
   * 
   * Used in: Question answering interfaces, community contribution flows, learning support
   */
  async submitAnswer(dto: SubmitAnswerOperation['request']): Promise<SubmitAnswerOperation['response']['body']> {
    return this.request<SubmitAnswerOperation['response']['body']>('/api/v1/social/questions/:questionId/answers', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId }
    });
  }

  /** 
   * GET /social/questions/:questionId/answers
   * 
   * Retrieves all answers for a specific question with pagination support.
   * Enables users to browse community responses and find helpful solutions.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of answers per page (default: 20, max: 100)
   * 
   * Returns array of answer objects with:
   * - Answer content and status
   * - Community engagement metrics
   * - Creation timestamps
   * - User identification (nullable for anonymous answers)
   * 
   * Features powered:
   * - Community solution browsing
   * - Answer quality assessment
   * - Learning resource discovery
   * - Community engagement tracking
   * 
   * Used in: Question detail pages, answer browsing interfaces, community discovery
   */
  async listAnswers(dto: ListAnswersOperation['request']): Promise<ListAnswersOperation['response']['body']> {
    return this.request<ListAnswersOperation['response']['body']>('/api/v1/social/questions/:questionId/answers', { method: 'GET' }, {
      params: { questionId: dto.params.questionId },
      query: {
        page: dto.query.page,
        limit: dto.query.limit
      }
    });
  }

  /** 
   * GET /social/questions/:questionId/answers/:answerId
   * 
   * Retrieves detailed information about a specific answer including
   * community engagement and quality metrics.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question
   * - answerId: Unique identifier for the answer
   * 
   * Returns answer object with:
   * - Complete answer details
   * - Community reaction counts
   * - Creation timestamp
   * - User identification and status
   * 
   * Features powered:
   * - Detailed answer viewing
   * - Community engagement analysis
   * - Answer quality assessment
   * - User contribution tracking
   * 
   * Used in: Answer detail pages, community moderation, contribution analysis
   */
  async getAnswer(questionId: string, answerId: string): Promise<GetAnswerOperation['response']['body']> {
    return this.request<GetAnswerOperation['response']['body']>('/api/v1/social/questions/:questionId/answers/:answerId', { method: 'GET' }, {
      params: { questionId, answerId }
    });
  }

  /** 
   * POST /social/questions/:questionId/answers/:answerId/reactions
   * 
   * Allows users to react to answers with helpful/not helpful feedback.
   * Enables community-driven quality assessment and expert recognition.
   * 
   * Path parameters:
   * - questionId: Unique identifier for the question
   * - answerId: Unique identifier for the answer
   * 
   * Request body contains:
   * - reactionType: Type of reaction ('helpful' or 'not_helpful')
   * 
   * Features powered:
   * - Community quality assessment
   * - Expert user recognition system
   * - Answer ranking and visibility
   * - Community moderation support
   * - [Placeholder] Reputation system for helpful contributors
   * 
   * Used in: Answer interaction interfaces, community moderation, quality assessment
   */
  async addAnswerReaction(dto: AddAnswerReactionOperation['request']): Promise<AddAnswerReactionOperation['response']['body']> {
    return this.request<AddAnswerReactionOperation['response']['body']>('/api/v1/social/questions/:questionId/answers/:answerId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { questionId: dto.params.questionId, answerId: dto.params.answerId }
    });
  }

  // ---------- Progress Sharing & Social Motivation ----------

  /** 
   * POST /api/v1/users/me/social/progress-shares
   * 
   * Allows users to share their fitness progress and achievements with the community.
   * Enables social motivation and community building through progress celebration.
   * 
   * Request body contains:
   * - shareType: Type of progress being shared (streak, achievement, milestone, etc.)
   * - shareTypeId: Optional specific ID for the shared content
   * - includeInviteLink: Whether to include user's invitation link (default: false)
   * - isPublic: Whether the share is publicly visible (default: true)
   * 
   * Features powered:
   * - Social progress sharing
   * - Community motivation and inspiration
   * - Viral user acquisition through sharing
   * - Achievement celebration
   * - [Placeholder] Automated progress share suggestions
   * 
   * Used in: Progress sharing interfaces, achievement celebration flows, social motivation
   */
  async shareProgress(dto: ShareProgressOperation['request']['body']): Promise<ShareProgressOperation['response']['body']> {
    return this.request<ShareProgressOperation['response']['body']>('/api/v1/users/me/social/progress-shares', { 
      method: 'POST', 
      body: JSON.stringify(dto) 
    });
  }

  /** 
   * GET /api/v1/social/progress-shares
   * 
   * Retrieves publicly shared progress posts from the community with filtering.
   * Enables users to discover and be inspired by others' fitness journeys.
   * 
   * Query parameters:
   * - shareType: Filter by type of progress share
   * - page: Page number for pagination (default: 1)
   * - limit: Number of shares per page (default: 50, max: 50)
   * 
   * Returns array of public share objects with:
   * - Share content and metadata
   * - Community reaction counts (claps, muscle, party emojis)
   * - Creation timestamps
   * - User identification
   * 
   * Features powered:
   * - Community inspiration feed
   * - Social motivation discovery
   * - Progress celebration browsing
   * - Community engagement tracking
   * - [Placeholder] Personalized feed algorithms
   * 
   * Used in: Community feeds, inspiration galleries, social discovery pages
   */
  async getPublicShares(dto: GetPublicSharesOperation['request']['query']): Promise<GetPublicSharesOperation['response']['body']> {
    return this.request<GetPublicSharesOperation['response']['body']>('/api/v1/social/progress-shares', { method: 'GET' }, {
      query: {
        shareType: dto.shareType,
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** 
   * GET /public/api/v1/social/progress-shares/:shareId
   * 
   * Retrieves detailed information about a specific public progress share.
   * Enables non-authenticated users to view shared progress (for viral sharing).
   * 
   * Path parameters:
   * - shareId: Unique identifier for the progress share
   * 
   * Returns detailed share object with:
   * - Complete share content and metadata
   * - Generated content and visualizations
   * - Community reaction counts
   * - Creation timestamps
   * 
   * Features powered:
   * - Viral progress sharing
   * - Public progress viewing (no auth required)
   * - Social media integration
   * - Community inspiration
   * - [Placeholder] Share analytics and viral tracking
   * 
   * Used in: Public share viewing, social media embeds, viral sharing links
   */
  async getShare(shareId: string): Promise<GetShareOperation['response']['body']> {
    return this.request<GetShareOperation['response']['body']>('/public/api/v1/social/progress-shares/:shareId', { method: 'GET' }, {
      params: { shareId }
    });
  }

  /** 
   * GET /api/v1/users/me/social/progress-shares
   * 
   * Retrieves the authenticated user's own progress shares with pagination.
   * Enables users to manage and review their sharing activity.
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of shares per page (default: 20, max: 100)
   * 
   * Returns array of user's shares with:
   * - Share content and settings
   * - Privacy and visibility settings
   * - Community engagement metrics
   * - Creation timestamps and status
   * 
   * Features powered:
   * - Personal sharing management
   * - Share history and analytics
   * - Privacy control and settings
   * - Sharing activity tracking
   * 
   * Used in: Personal sharing dashboards, share management interfaces, privacy controls
   */
  async getMyShares(dto: GetUserSharesOperation['request']['query']): Promise<GetUserSharesOperation['response']['body']> {
    return this.request<GetUserSharesOperation['response']['body']>('/api/v1/users/me/social/progress-shares', { method: 'GET' }, {
      query: {
        page: dto.page,
        limit: dto.limit
      }
    });
  }

  /** 
   * GET /api/v1/users/me/social/progress-shares/:shareId
   * 
   * Retrieves detailed information about a specific progress share owned by the user.
   * Includes full content and engagement metrics for management purposes.
   * 
   * Path parameters:
   * - shareId: Unique identifier for the progress share
   * 
   * Returns detailed share object with:
   * - Complete share content and metadata
   * - Privacy and visibility settings
   * - Community engagement metrics
   * - Generated content and visualizations
   * 
   * Features powered:
   * - Detailed share management
   * - Share analytics and insights
   * - Privacy control and settings
   * - Content management and editing
   * 
   * Used in: Share detail pages, share editing interfaces, analytics dashboards
   */
  async getMyShare(shareId: string): Promise<GetUserShareOperation['response']['body']> {
    return this.request<GetUserShareOperation['response']['body']>('/api/v1/users/me/social/progress-shares/:shareId', { method: 'GET' }, {
      params: { shareId }
    });
  }

  /** 
   * PUT /api/v1/users/me/social/progress-shares/:shareId/status
   * 
   * Updates the privacy and visibility settings of a user's progress share.
   * Enables users to control who can see their shared progress.
   * 
   * Path parameters:
   * - shareId: Unique identifier for the progress share
   * 
   * Request body contains:
   * - status: Share status (active, archived, deleted)
   * - isPublic: Whether the share is publicly visible
   * - includeInviteLink: Whether to include user's invitation link
   * 
   * Features powered:
   * - Privacy control and management
   * - Share visibility customization
   * - Data privacy compliance
   * - User autonomy in sharing
   * 
   * Used in: Share management interfaces, privacy settings, content control
   */
  async updateShareStatus(shareId: string, dto: UpdateShareStatusOperation['request']['body']): Promise<UpdateShareStatusOperation['response']['body']> {
    return this.request<UpdateShareStatusOperation['response']['body']>('/api/v1/users/me/social/progress-shares/:shareId/status', { 
      method: 'PUT', 
      body: JSON.stringify(dto) 
    }, {
      params: { shareId }
    });
  }

  /** 
   * DELETE /api/v1/social/progress-shares/:shareId
   * 
   * Permanently deletes a progress share owned by the user.
   * Removes the share from public visibility and user's sharing history.
   * 
   * Path parameters:
   * - shareId: Unique identifier for the progress share to delete
   * 
   * Features powered:
   * - Share cleanup and management
   * - Data privacy compliance
   * - Content lifecycle management
   * - User control over shared content
   * 
   * Used in: Share management interfaces, content deletion workflows, privacy controls
   */
  async deleteShare(shareId: string): Promise<DeleteShareOperation['response']['body']> {
    return this.request<DeleteShareOperation['response']['body']>('/api/v1/social/progress-shares/:shareId', { method: 'DELETE' }, {
      params: { shareId }
    });
  }

  /** 
   * POST /public/api/v1/social/progress-shares/:shareId/reactions
   * 
   * Allows users to react to public progress shares with emoji reactions.
   * Enables community engagement and social motivation without requiring authentication.
   * 
   * Path parameters:
   * - shareId: Unique identifier for the progress share
   * 
   * Request body contains:
   * - reactionType: Emoji reaction type (clap, muscle, party)
   * 
   * Features powered:
   * - Community engagement and motivation
   * - Social validation and support
   * - Viral sharing enhancement
   * - Non-authenticated user engagement
   * - [Placeholder] Reaction analytics and trending content
   * 
   * Used in: Public share viewing, social media integration, community engagement
   */
  async addShareReaction(dto: AddShareReactionOperation['request']): Promise<AddShareReactionOperation['response']['body']> {
    return this.request<AddShareReactionOperation['response']['body']>('/public/api/v1/social/progress-shares/:shareId/reactions', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { shareId: dto.params.shareId }
    });
  }

  // ---------- Article Learning & Knowledge Assessment ----------
  // Powers: Structured learning, knowledge validation, progress tracking, gamification

  /** 
   * POST /api/v1/users/me/articles/:articleId/read
   * 
   * Logs that a user has read a specific fitness article. Tracks reading progress
   * and enables personalized learning analytics and recommendations.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article being read
   * 
   * Features powered:
   * - Reading progress tracking
   * - Personalized content recommendations
   * - Learning analytics and insights
   * - Article completion tracking
   * - [Placeholder] Reading time analytics and engagement metrics
   * 
   * Used in: Article reading interfaces, progress tracking, learning analytics
   */
  async logRead(articleId: string): Promise<LogReadOperation['response']['body']> {
    return this.request<LogReadOperation['response']['body']>('/api/v1/users/me/articles/:articleId/read', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/quiz/start
   * 
   * Initiates a knowledge assessment quiz for a specific article. Creates a quiz
   * session and presents questions to validate the user's understanding.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Knowledge validation and assessment
   * - Learning progress tracking
   * - Quiz session management
   * - Knowledge retention measurement
   * - [Placeholder] Adaptive questioning based on user performance
   * 
   * Used in: Article quiz interfaces, knowledge assessment flows, learning validation
   */
  async startQuiz(articleId: string): Promise<StartQuizOperation['response']['body']> {
    return this.request<StartQuizOperation['response']['body']>('/api/v1/users/me/articles/:articleId/quiz/start', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/quiz/submit
   * 
   * Submits completed quiz answers for a specific article. Validates responses,
   * calculates scores, and updates learning progress and analytics.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Request body contains:
   * - quizAnswers: Array of user answers with question IDs, answer indices, and hint usage
   * 
   * Features powered:
   * - Knowledge assessment scoring
   * - Learning progress updates
   * - Quiz performance analytics
   * - Knowledge gap identification
   * - [Placeholder] Personalized remediation recommendations
   * 
   * Used in: Quiz submission interfaces, learning progress tracking, performance analytics
   */
  async submitQuiz(dto: SubmitQuizOperation['request']): Promise<SubmitQuizOperation['response']['body']> {
    return this.request<SubmitQuizOperation['response']['body']>('/api/v1/users/me/articles/:articleId/quiz/submit', { 
      method: 'POST', 
      body: JSON.stringify(dto.body) 
    }, {
      params: { articleId: dto.params.articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/quiz/retry
   * 
   * Allows users to retake a quiz for a specific article. Enables learning
   * reinforcement and improved knowledge retention through repetition.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Learning reinforcement through repetition
   * - Knowledge retention improvement
   * - Multiple attempt tracking
   * - Learning progress optimization
   * - [Placeholder] Spaced repetition scheduling
   * 
   * Used in: Quiz retry interfaces, learning reinforcement flows, knowledge retention
   */
  async retryQuiz(articleId: string): Promise<RetryQuizOperation['response']['body']> {
    return this.request<RetryQuizOperation['response']['body']>('/api/v1/users/me/articles/:articleId/quiz/retry', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/practical/start
   * 
   * Initiates a practical application session for a specific article. Enables
   * users to apply theoretical knowledge through hands-on activities.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Practical knowledge application
   * - Hands-on learning experiences
   * - Skill development tracking
   * - Application-based learning
   * - [Placeholder] Personalized practical exercises based on user goals
   * 
   * Used in: Practical application interfaces, hands-on learning flows, skill development
   */
  async startPractical(articleId: string): Promise<StartPracticalOperation['response']['body']> {
    return this.request<StartPracticalOperation['response']['body']>('/api/v1/users/me/articles/:articleId/practical/start', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/practical/complete
   * 
   * Marks a practical application session as completed. Tracks practical
   * skill development and updates learning progress analytics.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Practical skill completion tracking
   * - Application-based learning progress
   * - Skill development analytics
   * - Learning milestone achievement
   * - [Placeholder] Practical skill assessment and certification
   * 
   * Used in: Practical completion interfaces, skill development tracking, learning milestones
   */
  async completePractical(articleId: string): Promise<CompletePracticalOperation['response']['body']> {
    return this.request<CompletePracticalOperation['response']['body']>('/api/v1/users/me/articles/:articleId/practical/complete', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/practical/skip
   * 
   * Allows users to skip practical application sessions for specific articles.
   * Provides flexibility in learning paths while maintaining progress tracking.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Flexible learning path management
   * - User autonomy in learning choices
   * - Progress tracking for skipped content
   * - Learning path optimization
   * - [Placeholder] Alternative learning recommendations for skipped content
   * 
   * Used in: Learning path management, practical session interfaces, flexible learning flows
   */
  async skipPractical(articleId: string): Promise<SkipPracticalOperation['response']['body']> {
    return this.request<SkipPracticalOperation['response']['body']>('/api/v1/users/me/articles/:articleId/practical/skip', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * POST /api/v1/users/me/articles/:articleId/complete
   * 
   * Marks an article as fully completed after all learning activities (reading,
   * quiz, practical) are finished. Updates overall learning progress.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Features powered:
   * - Complete article learning tracking
   * - Learning milestone achievement
   * - Progress analytics and insights
   * - Avatar progression and gamification
   * - [Placeholder] Learning path recommendations for next articles
   * 
   * Used in: Article completion interfaces, learning milestone tracking, progress analytics
   */
  async completeArticle(articleId: string): Promise<CompleteArticleOperation['response']['body']> {
    return this.request<CompleteArticleOperation['response']['body']>('/api/v1/users/me/articles/:articleId/complete', { method: 'POST' }, {
      params: { articleId }
    });
  }

  /** 
   * GET /api/v1/users/me/articles
   * 
   * Retrieves the user's article learning progress with pagination support.
   * Provides comprehensive view of learning history and progress analytics.
   * 
   * Query parameters:
   * - page: Page number for pagination (default: 1)
   * - limit: Number of articles per page (default: 100, max: 100)
   * 
   * Returns array of article progress objects with:
   * - Article identification and status
   * - Reading progress (first/last read dates)
   * - Quiz performance (attempts, correctness, completion)
   * - Learning analytics and insights
   * 
   * Features powered:
   * - Learning progress dashboard
   * - Article completion tracking
   * - Learning analytics and insights
   * - Progress visualization and reporting
   * - [Placeholder] Learning streak tracking and achievements
   * 
   * Used in: Learning dashboards, progress tracking interfaces, analytics reports
   */
  async listUserArticles(dto: ListUserArticlesOperation['request']): Promise<ListUserArticlesOperation['response']['body']> {
    return this.request<ListUserArticlesOperation['response']['body']>('/api/v1/users/me/articles', { method: 'GET' }, {
      query: dto.query
    });
  }

  /** 
   * GET /api/v1/users/me/articles/:articleId
   * 
   * Retrieves detailed learning progress for a specific article including
   * comprehensive analytics and performance metrics.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Returns detailed article progress object with:
   * - Complete learning status and timeline
   * - Reading progress and engagement metrics
   * - Quiz performance and answer history
   * - Practical application tracking
   * - Learning analytics and insights
   * 
   * Features powered:
   * - Detailed learning analytics
   * - Individual article progress tracking
   * - Performance analysis and insights
   * - Learning optimization recommendations
   * - [Placeholder] Personalized learning path suggestions
   * 
   * Used in: Article detail pages, learning analytics dashboards, performance analysis
   */
  async getUserArticle(articleId: string): Promise<GetUserArticleOperation['response']['body']> {
    return this.request<GetUserArticleOperation['response']['body']>('/api/v1/users/me/articles/:articleId', { method: 'GET' }, {
      params: { articleId }
    });
  }

  // ---------- Calendar Integration & Reminders ----------
  // Powers: Calendar synchronization, reminder management, challenge scheduling, article reading reminders

  /** 
   * GET /api/v1/users/me/calendar/settings
   * 
   * Retrieves the user's calendar integration settings including reminder preferences,
   * timezone configuration, and calendar subscription information.
   * 
   * Returns calendar settings object with:
   * - calendarCode: Unique identifier for calendar subscription (nullable if not enabled)
   * - challengeReminderTime: Daily reminder time for challenges (HH:MM format)
   * - articleReminderFrequency: Frequency for article reading reminders (daily/weekly/biweekly)
   * - articleReminderTime: Time for article reading reminders (HH:MM format)
   * - timezone: User's timezone for proper scheduling
   * - enableCalendarIntegration: Whether calendar integration is enabled
   * - calendarUrl: Public URL for calendar subscription (nullable if not enabled)
   * - Creation and update timestamps
   * 
   * Features powered:
   * - Calendar integration management
   * - Reminder preference configuration
   * - Timezone-aware scheduling
   * - Calendar subscription setup
   * - User preference persistence
   * 
   * Used in: Calendar settings pages, reminder configuration interfaces, integration setup
   */
  async getCalendarSettings(): Promise<GetCalendarSettingsOperation['response']['body']> {
    return this.request<GetCalendarSettingsOperation['response']['body']>('/api/v1/users/me/calendar/settings', { method: 'GET' });
  }

  /** 
   * PATCH /api/v1/users/me/calendar/settings
   * 
   * Updates the user's calendar integration settings and reminder preferences.
   * Enables users to customize their calendar experience and reminder timing.
   * 
   * Request body supports updating:
   * - challengeReminderTime: Daily reminder time for challenges (HH:MM format, nullable to clear)
   * - articleReminderFrequency: Frequency for article reminders (daily/weekly/biweekly, nullable to clear)
   * - articleReminderTime: Time for article reading reminders (HH:MM format, nullable to clear)
   * - timezone: User's timezone for proper scheduling (nullable to clear)
   * - enableCalendarIntegration: Whether to enable calendar integration
   * 
   * Features powered:
   * - Personalized reminder scheduling
   * - Calendar integration toggle
   * - Timezone-aware reminder management
   * - Flexible reminder frequency control
   * - User preference customization
   * 
   * Used in: Calendar settings interfaces, reminder configuration flows, integration management
   */
  async updateCalendarSettings(dto: UpdateCalendarSettingsOperation['request']['body']): Promise<UpdateCalendarSettingsOperation['response']['body']> {
    return this.request<UpdateCalendarSettingsOperation['response']['body']>('/api/v1/users/me/calendar/settings', { 
      method: 'PATCH', 
      body: JSON.stringify(dto) 
    });
  }

  /** 
   * GET /api/v1/users/me/calendar/download
   * 
   * Downloads a static iCalendar (.ics) file containing the user's current
   * challenge reminders and article reading reminders. Perfect for users who
   * prefer simple download-and-import workflows over URL subscriptions.
   * 
   * Returns:
   * - Content-Type: text/calendar; charset=utf-8
   * - Content-Disposition: attachment; filename="fitjourney-calendar-{date}.ics"
   * - ICS content with current challenge and article reminders
   * 
   * Calendar content includes:
   * - Daily challenge reminders for active challenges (with RRULE for duration)
   * - Weekly/bi-weekly article reading reminders
   * - Challenge milestone celebrations
   * - Challenge end date notifications
   * - User-customized reminder times and frequencies
   * 
   * Features powered:
   * - Static calendar file generation
   * - Universal calendar app compatibility
   * - Offline calendar access
   * - User-controlled reminder timing
   * - Challenge-specific reminder customization
   * 
   * Used in: Calendar download interfaces, offline calendar management, simple integration workflows
   */
  async downloadUserCalendar(): Promise<DownloadUserCalendarOperation['response']['body']> {
    return this.request<DownloadUserCalendarOperation['response']['body']>('/api/v1/users/me/calendar/download', { method: 'GET' });
  }

  /** 
   * GET /public/api/v1/calendar/:calendarCode
   * 
   * Provides a dynamic calendar subscription URL that returns live iCalendar (.ics) content.
   * Enables users to subscribe to their FitJourney calendar for automatic updates as
   * their challenges and article progress changes.
   * 
   * Path parameters:
   * - calendarCode: Unique identifier for the user's calendar subscription
   * 
   * Returns:
   * - Content-Type: text/calendar; charset=utf-8
   * - Live ICS content that updates automatically
   * - Real-time challenge and article reminder updates
   * 
   * Calendar content includes:
   * - Dynamic challenge reminders that update as challenges progress
   * - Adaptive article reading reminders based on completion status
   * - Real-time milestone and achievement notifications
   * - Automatic challenge status updates (active → completed → locked)
   * - User preference changes reflected immediately
   * 
   * Features powered:
   * - Dynamic calendar subscription
   * - Real-time reminder updates
   * - Automatic challenge progress synchronization
   * - Live article completion tracking
   * - Seamless calendar app integration
   * - No manual re-download required
   * 
   * Used in: Calendar subscription URLs, dynamic integration workflows, real-time reminder management
   */
  async getPublicCalendar(calendarCode: string): Promise<GetPublicCalendarOperation['response']['body']> {
    return this.request<GetPublicCalendarOperation['response']['body']>('/public/api/v1/calendar/:calendarCode', { method: 'GET' }, {
      params: { calendarCode }
    });
  }

  // ---------- Statistics & Analytics ----------
  // Powers: Global analytics, article performance metrics, system insights

  /** 
   * GET /public/api/v1/statistics/global
   * 
   * Retrieves global statistics across all users and activities in the system.
   * Provides comprehensive insights into platform usage and engagement metrics.
   * 
   * Returns global statistics object with:
   * - userCount: Total number of registered users
   * - invitationJoinCount: Total invitations accepted across all users
   * - articleReadCount: Total article reads across all users
   * - articleCompletedCount: Total articles completed across all users
   * - articleCompletedWithPerfectScore: Total articles completed with perfect quiz scores
   * - challengesStarted: Total challenges started across all users
   * - challengesJoined: Total challenge participations across all users
   * - daysLogged: Total daily habit log entries across all users
   * - questionsAsked: Total questions asked in the community
   * - questionsAnswered: Total answers provided in the community
   * - progressShares: Total progress shares created by users
   * 
   * Features powered:
   * - Platform analytics and insights
   * - System performance monitoring
   * - Community engagement metrics
   * - Content performance analysis
   * - User growth tracking
   * - [Placeholder] Real-time analytics dashboard
   * 
   * Used in: Admin dashboards, platform analytics, system monitoring, public statistics
   */
  async getGlobalStatistics(): Promise<GetGlobalStatisticsOperation['response']['body']> {
    return this.request<GetGlobalStatisticsOperation['response']['body']>('/public/api/v1/statistics/global', { method: 'GET' });
  }

  /** 
   * GET /public/api/v1/statistics/articles/:articleId
   * 
   * Retrieves detailed statistics for a specific article including engagement
   * metrics and performance data across all users.
   * 
   * Path parameters:
   * - articleId: Unique identifier for the article
   * 
   * Returns article statistics object with:
   * - articleId: The article identifier
   * - readCount: Total number of times this article has been read
   * - completedCount: Total number of times this article has been completed
   * - completedWithPerfectScore: Total completions with perfect quiz scores
   * 
   * Features powered:
   * - Article performance analytics
   * - Content engagement tracking
   * - Learning effectiveness measurement
   * - Content optimization insights
   * - Popular content identification
   * - [Placeholder] Article recommendation algorithms
   * 
   * Used in: Article analytics dashboards, content performance reports, learning insights
   */
  async getArticleStatistics(articleId: string): Promise<GetArticleStatisticsOperation['response']['body']> {
    return this.request<GetArticleStatisticsOperation['response']['body']>('/public/api/v1/statistics/articles/:articleId', { method: 'GET' }, {
      params: { articleId }
    });
  }

}

export default ApiClient;


