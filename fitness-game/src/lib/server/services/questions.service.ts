import type { 
  AuthRequestContext,
  SubmitQuestionDto, 
  ListQuestionsDto,
  NewQuestionResponse, 
  ListQuestionsResponse,
  GetQuestionResponse,
  AddReactionDto,
  GetQuestionDto,
} from '$lib/server/shared/interfaces';
import type { IQuestionsRepository } from '$lib/server/repositories/questions.repository';
import type { IQuestionReactionsRepository } from '$lib/server/repositories/question-reactions.repository';
import type { IModerationService } from './moderation.service';
import type { IFeatureAccessControl } from '$lib/server/helpers/feature-access-control.helper';
import { notFoundCheck, ValidationError } from '$lib/server/shared/errors';
import type { Question } from '../db/schema';

export interface IQuestionsService {
  submitQuestion(dto: SubmitQuestionDto): Promise<NewQuestionResponse>;
  listQuestions(dto: ListQuestionsDto): Promise<ListQuestionsResponse[]>;
  getQuestion(dto: GetQuestionDto): Promise<GetQuestionResponse>;
  addReaction(dto: AddReactionDto): Promise<void>;
}

export class QuestionsService implements IQuestionsService {
  constructor(
    private readonly dependencies: {
      readonly questionsRepository: IQuestionsRepository;
      readonly questionReactionsRepository: IQuestionReactionsRepository;
      readonly moderationService: IModerationService;
      readonly featureAccessControl: IFeatureAccessControl;
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

    await this.dependencies.featureAccessControl.requireFeatureAccess(userId, 'askQuestionsEnabled');

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
  async listQuestions(dto: ListQuestionsDto): Promise<ListQuestionsResponse[]> {
    const { articleId, page = 1, limit = 20 } = dto;

    const questions = await this.dependencies.questionsRepository.findByArticleId(articleId, page, limit);
    
    return questions.map(question => this.mapToListQuestionsResponse(question));
  }

  /**
   * Get a question by ID
   * GET /social/questions/:questionId
   */
  async getQuestion(dto: GetQuestionDto): Promise<GetQuestionResponse> {
    const { questionId } = dto;

    // Verify question exists
    const question = notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');
    
    return this.mapToGetQuestionResponse(question);
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


    private mapToListQuestionsResponse(question: Question): ListQuestionsResponse {
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

    private mapToGetQuestionResponse(question: Question): GetQuestionResponse {
      return this.mapToListQuestionsResponse(question);
    }
}
