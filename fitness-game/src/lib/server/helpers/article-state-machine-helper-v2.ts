import { type NewUserArticle, type UserArticle } from '$lib/server/db/schema';
import { ValidationError, notFoundCheck } from '$lib/server/shared/errors';
import type { KnowledgeBaseList, Question } from '../content/types';

export const ArticleLogStatusKeys = [
    'reading_in_progress',
    'knowledge_check_in_progress',
    'knowledge_check_complete',
    'practical_in_progress',
    'completed'
  ] as const;
  
  export type ArticleLogStatus = (typeof ArticleLogStatusKeys)[number];
  
/**
 * Article State Machine Helper v2
 *
 * Generic, strongly-typed transition engine that delegates persistence to a
 * repository method `transactionUpdateArticle`. Service methods should only
 * call `transitionTo(transitions, repo, userId, articleId, key, details)`.
 *
 * The engine enforces:
 *  - Not-exists handling via optional `notExistsStateChange`
 *  - Precondition states check
 *  - Optional `preconditionCheck`
 *  - Required `existsStateChange`
 *
 * Consumers define a const transitions map with per-key Details types to get
 * fully inferred parameter types for `transitionTo`.
 */

export type StateTransitionDetailsBase = {
  readonly articleId: string;
  readonly requestDate: Date;
  readonly userId: string;
  readonly article: KnowledgeBaseList;
};
type OverrideFields = 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'articleId';
export type UpdateArticle = Omit<UserArticle, OverrideFields>;
export type OverrideArticleFields = Pick<UserArticle, OverrideFields>;
export type PartialUpdateArticle = Partial<UpdateArticle>;

export type StateTransitionV2<Details extends StateTransitionDetailsBase> = {
  /**
   * When no existing `UserArticle` row is found. If omitted, a not-found
   * validation error will be thrown.
   */
  readonly notExistsStateChange?: (details: Details) => NewUserArticle;

  /**
   * Allowed current states for this transition when an article already exists.
   */
  readonly preconditionStates: ReadonlyArray<ArticleLogStatus>;

  /**
   * Optional additional guard. Return false to reject the transition.
   */
  readonly preconditionCheck?: (currentArticle: UpdateArticle, details: Details) => Promise<void>;

  /**
   * Compute the next `UserArticle` snapshot from the current one.
   */
  readonly existsStateChange: (currentArticle: UpdateArticle, details: Details) => PartialUpdateArticle;
};

export type TransitionMapV2 = Record<string, StateTransitionV2<any>>;

export type TransitionDetailsOf<TMap extends TransitionMapV2, K extends keyof TMap> =
  TMap[K] extends StateTransitionV2<infer D> ? D : never;

/**
 * Repository contract required by the V2 state machine engine.
 *
 * Implementations should:
 *  - Begin a DB transaction
 *  - Select the `UserArticle` with `FOR UPDATE`
 *  - Invoke `callback(existingArticle)` (allowing it to throw for rollback)
 *  - Insert when not exists; Update when exists
 *  - Return `{ id }` of the upserted row
 */
export type ArticleTransactionCallback = (existingArticle: UserArticle | null) => Promise<NewUserArticle | PartialUpdateArticle> 
export interface IUserArticlesStateTxRepository {
  transactionUpdateArticle(
    userId: string,
    articleId: string,
    requestDate: Date,
    callback: ArticleTransactionCallback
  ): Promise<{ id: UserArticle['id'] }>;
}

/**
 * Transition runner. Delegates all persistence to the repository while keeping
 * transition rules inside the state machine.
 */
export async function transitionTo<TMap extends TransitionMapV2, K extends keyof TMap & string>(
  transitions: TMap,
  repo: IUserArticlesStateTxRepository,
  userId: string,
  articleId: string,
  requestDate: Date,
  key: K,
  details: TransitionDetailsOf<TMap, K>
): Promise<{ id: UserArticle['id'] }> {
  const definition = transitions[key];

  return await repo.transactionUpdateArticle(userId, articleId, requestDate, async (existing) => {
    // Not existing row path
    if (!existing) {
      if (definition.notExistsStateChange) {
        const next = definition.notExistsStateChange(details);
        return next;
      }

      // If no `notExistsStateChange`, this is a not-found scenario for this transition
      notFoundCheck(null, 'User Article');
      // `notFoundCheck` throws, but keep TS happy with a fallback
      throw new ValidationError('Article not found');
    }

    // Existing row path: preconditions
    if (!definition.preconditionStates.includes(existing.status)) {
      throw new ValidationError(
        `Cannot transition from ${existing.status} using ${String(key)}`
      );
    }

    await definition.preconditionCheck?.(existing, details);

    // Compute next snapshot
    const next = definition.existsStateChange(existing, details);
    return next;
  });
}

/**
 * Utility to narrow transition keys and detail types via a const object.
 * Example usage:
 *
 * const transitions = defineTransitions({
 *   START_QUIZ: {
 *     preconditionStates: ['reading_in_progress', 'knowledge_check_complete'],
 *     existsStateChange: (current, details: { articleId: string; requestDate: Date }) => ({
 *       status: 'knowledge_check_in_progress',
 *       quizStartedAt: details.requestDate,
 *       updatedAt: details.requestDate,
 *     })
 *   }
 * } as const);
 */
export function defineTransitions<TMap extends TransitionMapV2>(map: TMap) {
  return map;
}


// Concrete transitions map built on V2 engine
export const ARTICLE_STATE_TRANSITIONS_V2 = defineTransitions({
  LOG_READ: {
    preconditionStates: [
      'reading_in_progress',
      //'knowledge_check_complete',
      //'practical_in_progress'
    ],
    notExistsStateChange: (details: { requestDate: Date; }) => {
      const now = details.requestDate;
      // Build a fresh snapshot; repository will persist it
      return {
        status: 'reading_in_progress',
        firstReadDate: now,
        lastReadDate: now,
        quizAttempts: 0,
      } satisfies NewUserArticle;
    },
    existsStateChange: (_, details: { requestDate: Date }) => {
      const now = details.requestDate;
      return {
        status: 'reading_in_progress',
        lastReadDate: now,
      } satisfies PartialUpdateArticle;
    },
  },

  START_QUIZ: {
    preconditionStates: [
      'reading_in_progress',
    ],
    existsStateChange: (_, details: StateTransitionDetailsBase) => {
      const now = details.requestDate;
      return {
        status: 'knowledge_check_in_progress',
        quizStartedAt: now,
      } satisfies PartialUpdateArticle;
    },
  },

  SUBMIT_QUIZ: {
    preconditionStates: ['knowledge_check_in_progress'],
    existsStateChange: (current, details: StateTransitionDetailsBase & {
      answersWithQuestions: Array<{ question: Question; answer: { questionId: string; answerIndex: number; hintUsed: boolean } }>,
    }) => {
      const { answersWithQuestions, requestDate: now } = details;
      
      // Process each answer and validate against the correct answer
      const quizAnswers = answersWithQuestions.map(answerWithQuestion => {
        const {question, answer} = answerWithQuestion;
        
        return {
          question_id: answer.questionId,
          answer_index: answer.answerIndex,
          is_correct: answer.answerIndex === question.correct_answer_index,
          hint_used: answer.hintUsed,
        };
      });

      const allCorrect = quizAnswers.every(answer => answer.is_correct);
      return {
        status: 'knowledge_check_complete',
        quizAllCorrectAnswers: allCorrect,
        quizAnswers,
        quizFirstAttemptedAt: current.quizFirstAttemptedAt ?? now,
        quizCompletedAt: now,
        quizAttempts: current.quizAttempts + 1,
      } satisfies PartialUpdateArticle;
    },
  },

  RETRY_QUIZ: {
    preconditionStates: ['knowledge_check_complete'],
    preconditionCheck: async (current, details: StateTransitionDetailsBase & { userWantsToRetry?: boolean }) => {
        if (current.quizAllCorrectAnswers) {
            if (details.userWantsToRetry) {
                console.warn('Quiz for this article has already been submitted. Resetting prior submission.');
            } else {
                throw new ValidationError('Quiz for this article has already been submitted with a perfect score. Do you really want to retry?');
            }
        }
    },
    existsStateChange: (_, details: StateTransitionDetailsBase & { userWantsToRetry?: boolean }) => {
      const now = details.requestDate;
      return {
        status: 'knowledge_check_in_progress',
        quizAllCorrectAnswers: false,
        quizAnswers: null,
        quizStartedAt: now,
        quizCompletedAt: null,
      } satisfies PartialUpdateArticle;
    },
  },

  START_PRACTICAL: {
    preconditionStates: ['knowledge_check_complete'],
    preconditionCheck: async (_, details: StateTransitionDetailsBase) => {
        if ((details.article.practicals ?? []).length === 0) {
            throw new ValidationError('This article does not have practical activities.');
        }
    },
    existsStateChange: () => {
      return {
        status: 'practical_in_progress',
      } satisfies PartialUpdateArticle;
    },
  },

  COMPLETE_PRACTICAL: {
    preconditionStates: ['practical_in_progress'],
    existsStateChange: (_, details: StateTransitionDetailsBase) => {
      return {
        status: 'completed',
      } satisfies PartialUpdateArticle;
    },
  },

  SKIP_PRACTICAL: {
    preconditionStates: ['knowledge_check_complete'],
    existsStateChange: (_, details: StateTransitionDetailsBase) => {
      return {
        status: 'completed',
      } satisfies PartialUpdateArticle;
    },
  },

  COMPLETE_ARTICLE: {
    preconditionStates: [
      'knowledge_check_complete',
      'practical_in_progress'
    ],
    existsStateChange: (_, details: StateTransitionDetailsBase) => {
      return {
        status: 'completed',
      } satisfies PartialUpdateArticle;
    },
  },
} as const);


