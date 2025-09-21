import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type IAnswersRepository, type IQuestionsRepository, type IUserChallengeRepository } from '$lib/server/repositories';
import { notFoundCheck, ValidationError } from '$lib/server/shared/errors';
import type { SubmitAnswerDto, ListAnswersDto, GetAnswerDto, AnswerResponse, NewAnswerResponse } from '$lib/server/shared/interfaces';
import type { IModerationService } from './moderation.service';
import type { QuestionAnswer } from '$lib/server/db/schema';

export type IAnswersService = {
  submitAnswer(dto: SubmitAnswerDto): Promise<NewAnswerResponse>;
  listAnswers(dto: ListAnswersDto): Promise<AnswerResponse[]>;
  getAnswer(dto: GetAnswerDto): Promise<AnswerResponse>;
};

export class AnswersService implements IAnswersService {
  constructor(
    private readonly dependencies: {
      readonly answersRepository: IAnswersRepository;
      readonly questionsRepository: IQuestionsRepository;
      readonly moderationService: IModerationService;
      readonly userChallengeRepository: IUserChallengeRepository;
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

    // Check if user is eligible for social features (completed at least one challenge)
    await this.checkSocialFeatureEligibility(userId);

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
  async listAnswers(dto: ListAnswersDto): Promise<AnswerResponse[]> {
    const { questionId, page = 1, limit = 20 } = dto;

    // Verify question exists
    // @TODO: make sure any notFound check that doesnt use the result, uses a more optimized checkExists method
    notFoundCheck(await this.dependencies.questionsRepository.findById(questionId), 'Question');

    const answers = await this.dependencies.answersRepository.findByQuestionId(questionId, page, limit);

    return answers.map(answer => this.mapToAnswerResponse(answer));
  }

  /**
   * Get an answer by ID
   * GET /social/questions/:questionId/answers/:answerId
   */
  async getAnswer(dto: GetAnswerDto): Promise<AnswerResponse> {
    const { questionId, answerId } = dto;

    const answer = notFoundCheck(await this.dependencies.answersRepository.findById(questionId, answerId), 'Answer');
    
    return this.mapToAnswerResponse(answer);
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

  private mapToAnswerResponse(answer: QuestionAnswer): AnswerResponse {
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

}
