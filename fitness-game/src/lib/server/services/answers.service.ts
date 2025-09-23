import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IAnswersRepository, type IQuestionsRepository, type IAnswerReactionsRepository } from '$lib/server/repositories';
import type { IFeatureAccessControl } from '$lib/server/helpers/feature-access-control.helper';
import { notFoundCheck, ValidationError } from '$lib/server/shared/errors';
import type { SubmitAnswerDto, ListAnswersDto, GetAnswerDto, GetAnswerResponse, NewAnswerResponse, ListAnswersResponse, AddAnswerReactionDto } from '$lib/server/shared/interfaces';
import type { IModerationService } from './moderation.service';
import type { QuestionAnswer } from '$lib/server/db/schema';

export type IAnswersService = {
  submitAnswer(dto: SubmitAnswerDto): Promise<NewAnswerResponse>;
  listAnswers(dto: ListAnswersDto): Promise<ListAnswersResponse[]>;
  getAnswer(dto: GetAnswerDto): Promise<GetAnswerResponse>;
  addReaction(dto: AddAnswerReactionDto): Promise<void>;
};

export class AnswersService implements IAnswersService {
  constructor(
    private readonly dependencies: {
      readonly answersRepository: IAnswersRepository;
      readonly questionsRepository: IQuestionsRepository;
      readonly moderationService: IModerationService;
      readonly answerReactionsRepository: IAnswerReactionsRepository;
      readonly featureAccessControl: IFeatureAccessControl;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  /**
   * Submit an answer to a question
   * POST /social/questions/:questionId/answers
   */
  async submitAnswer(dto: SubmitAnswerDto): Promise<NewAnswerResponse> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { questionId, answer, isAnonymous } = dto;

    await this.dependencies.featureAccessControl.requireFeatureAccess(userId, 'answerQuestionsEnabled');

    // Verify question exists
    // @TODO: make sure any notFound check that doesnt use the result, uses a more optimized checkExists method
    notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');

    // Moderate content
    const answerModeration = await this.dependencies.moderationService.moderateContent(answer, 'answer');
    if (answerModeration.status === 'rejected') {
      // @TODO: log the moderation rejection
      throw new ValidationError('Answer rejected by moderation');
    }

    // Create answer
    const answerResult = await this.dependencies.answersRepository.create({
      questionId,
      userId,
      answer,
      isAnonymous,
      status: answerModeration.status === 'approved' ? 'approved' : 'pending',
      moderationNotes: { answer: answerModeration.reasons ?? [] },
      createdAt: requestDate,
    });

    return { id: answerResult.id };
  }

  /**
   * List answers for a question
   * GET /social/questions/:questionId/answers
   */
  async listAnswers(dto: ListAnswersDto): Promise<ListAnswersResponse[]> {
    const { questionId, page = 1, limit = 20 } = dto;

    // Verify question exists
    // @TODO: make sure any notFound check that doesnt use the result, uses a more optimized checkExists method
    notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');

    const answers = await this.dependencies.answersRepository.findByQuestionId(questionId, page, limit);

    return answers.map(answer => this.mapToListAnswersResponse(answer));
  }

  /**
   * Get an answer by ID
   * GET /social/questions/:questionId/answers/:answerId
   */
  async getAnswer(dto: GetAnswerDto): Promise<GetAnswerResponse> {
    const { questionId, answerId } = dto;

    const answer = notFoundCheck(await this.dependencies.answersRepository.findById(questionId, answerId), 'Answer');
    
    return this.mapToGetAnswerResponse(answer);
  }

  /**
   * Add a reaction to an answer
   * POST /social/questions/:questionId/answers/:answerId/reactions
   */
  async addReaction(dto: AddAnswerReactionDto): Promise<void> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { questionId, answerId, reactionType } = dto;

    // Verify answer exists and belongs to the question
    notFoundCheck(await this.dependencies.answersRepository.findById(questionId, answerId), 'Answer');

    await this.dependencies.answerReactionsRepository.upsertAnswerReaction({
      answerId,
      userId,
      reactionType,
      createdAt: requestDate,
    });
  }


  private mapToListAnswersResponse(answer: QuestionAnswer): ListAnswersResponse {
    return {
      id: answer.id,
      answer: answer.answer,
      status: answer.status,
      helpfulCount: answer.helpfulCount,
      notHelpfulCount: answer.notHelpfulCount,
      createdAt: answer.createdAt.toISOString(),
      userId: answer.isAnonymous ? null : answer.userId,
    };
  }

  private mapToGetAnswerResponse(answer: QuestionAnswer): GetAnswerResponse {
    return this.mapToListAnswersResponse(answer);
  }

}
