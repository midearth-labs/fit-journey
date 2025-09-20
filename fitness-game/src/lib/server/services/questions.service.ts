import type { 
  AuthRequestContext,
  SubmitQuestionDto, 
  ListQuestionsDto,
  NewQuestionResponse, 
  QuestionResponse,
  AddReactionDto,
  GetQuestionDto,
} from '$lib/server/shared/interfaces';
import type { IQuestionsRepository } from '$lib/server/repositories/questions.repository';
import type { IQuestionReactionsRepository } from '$lib/server/repositories/question-reactions.repository';
import type { IModerationService } from './moderation.service';
import type { IUserChallengeRepository } from '$lib/server/repositories/user-challenge.repository';
import { notFoundCheck, ValidationError } from '$lib/server/shared/errors';
import type { Question } from '../db/schema';

export interface IQuestionsService {
  submitQuestion(dto: SubmitQuestionDto): Promise<NewQuestionResponse>;
  listQuestions(dto: ListQuestionsDto): Promise<QuestionResponse[]>;
  getQuestion(dto: GetQuestionDto): Promise<QuestionResponse>;
  addReaction(dto: AddReactionDto): Promise<void>;
}

export class QuestionsService implements IQuestionsService {
  constructor(
    private readonly dependencies: {
      readonly questionsRepository: IQuestionsRepository;
      readonly questionReactionsRepository: IQuestionReactionsRepository;
      readonly moderationService: IModerationService;
      readonly userChallengeRepository: IUserChallengeRepository;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Submit a new question for articles
   * POST /social/questions
   */
  async submitQuestion(dto: SubmitQuestionDto): Promise<NewQuestionResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { articleIds, title, body, isAnonymous } = dto;

    // Check if user is eligible for social features (completed at least one challenge)
    await this.checkSocialFeatureEligibility(userId);

    // Moderate content
    const titleModeration = await this.dependencies.moderationService.moderateContent(title, 'question_title');
    if (titleModeration.status === 'rejected') {
        // @TODO: log the moderation rejection
        throw new ValidationError('Content title rejected by moderation');
    }
    const bodyModeration = await this.dependencies.moderationService.moderateContent(body, 'question_body');
    if (bodyModeration.status === 'rejected') {
      // @TODO: log the moderation rejection
      throw new ValidationError('Content body rejected by moderation');
    }

    // Create question
    const question = await this.dependencies.questionsRepository.create({
      userId,
      title,
      body,
      isAnonymous,
      status: (titleModeration.status === 'approved' && bodyModeration.status === 'approved') ? 'approved' : 'pending',
      moderationNotes: {
        title: titleModeration.reasons ?? [],
        body: bodyModeration.reasons ?? [],
      },
      createdAt: requestDate,
    }, articleIds);

    return {id: question.id};;
  }

  /**
   * List questions for a specific article
   * GET /social/questions?articleId=:articleId
   */
  async listQuestions(dto: ListQuestionsDto): Promise<QuestionResponse[]> {
    const { articleId, page = 1, limit = 20 } = dto;

    const questions = await this.dependencies.questionsRepository.findByArticleId(articleId, page, limit);
    
    return questions.map(question => this.mapToQuestionResponse(question));
  }

  /**
   * Get a question by ID
   * GET /social/questions/:questionId
   */
  async getQuestion(dto: GetQuestionDto): Promise<QuestionResponse> {
    const { questionId } = dto;

    // Verify question exists
    const question = notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');
    
    return this.mapToQuestionResponse(question);
  }

  /**
   * Add a reaction to a question
   * POST /social/questions/:questionId/reactions
   */
  async addReaction(dto: AddReactionDto): Promise<void> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { questionId, reactionType } = dto;

    // Verify question exists
    notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');

    await this.dependencies.questionReactionsRepository.upsertQuestionReaction({
      questionId,
      userId,
      reactionType,
      createdAt: requestDate,
    });
  }

  // #TODO: cache the result of this function, or otherwise add a user flag on the user object on challenge completion
  private async checkSocialFeatureEligibility(userId: string): Promise<void> {
    // Check if user has completed at least one challenge
    const userChallenges = await this.dependencies.userChallengeRepository.findByUserId(userId);
    const { requestDate } = this.requestContext;
    const completedChallenges = userChallenges.filter(challenge => 
      challenge.implicitStatus({ referenceDate: requestDate }) === 'completed'
    );
    
    if (completedChallenges.length === 0) {
      throw new ValidationError('Complete your first challenge to join the community!');
    }
  }

  private mapToQuestionResponse(question: Question): QuestionResponse {
    return {
      id: question.id,
      title: question.title,
      body: question.body,
      status: question.status,
      helpfulCount: question.helpfulCount,
      notHelpfulCount: question.notHelpfulCount,
      createdAt: question.createdAt.toISOString(),
      updatedAt: question.updatedAt.toISOString(),
      userId: question.isAnonymous ? null : question.userId
    };
  }
}
