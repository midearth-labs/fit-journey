import {
  type SubmitUserChallengeQuizDto,
  type ListUserChallengeQuizSubmissionsDto,
  type UserChallengeProgressResponse,
  type AuthRequestContext,
} from '$lib/server/shared/interfaces';
import {
  ValidationError,
  InternalServerError,
  notFoundCheck
} from '$lib/server/shared/errors';
import { type IUserChallengeProgressRepository, type IUserChallengeRepository } from '$lib/server/repositories';
import { type UserChallenge, type UserChallengeProgress } from '$lib/server/db/schema';
import { type IChallengeDAO } from '$lib/server/content/daos';

export type IChallengeProgressService = {
  submitUserChallengeQuiz(dto: SubmitUserChallengeQuizDto): Promise<void>;
  listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto): Promise<UserChallengeProgressResponse[]>;
};

export class ChallengeProgressService implements IChallengeProgressService {
  constructor(
    private readonly dependencies: {
      readonly userChallengeRepository: IUserChallengeRepository;
      readonly userChallengeProgressRepository: IUserChallengeProgressRepository;
      readonly challengeDAO: IChallengeDAO;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

    /**
     * Submit a quiz for a challenge article
     * POST /api/v1/user-challenges/:userChallengeId/quizzes/:knowledgeBaseId
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

  /**
     * List quiz submissions for a user challenge
     * GET /api/v1/user-challenges/:userChallengeId/quizzes
     */
  async listUserChallengeQuizSubmissions(dto: ListUserChallengeQuizSubmissionsDto): Promise<UserChallengeProgressResponse[]> {
    const { user: { id: userId } } = this.requestContext;
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

  private isChallengeLoggable(status: UserChallenge['status']): boolean {
    return ['active', 'completed'].includes(status);
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


