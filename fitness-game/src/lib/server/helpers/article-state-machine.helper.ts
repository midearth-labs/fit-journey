/**
 * Article State Machine Helper
 * 
 * This helper manages the state transitions for user article progress.
 * It provides a clear, testable state machine with preconditions and validation.
 */

export const ArticleLogStatusKeys = [
  'reading_in_progress',
  'knowledge_check_in_progress',
  'knowledge_check_complete',
  'practical_in_progress',
  'completed'
] as const;

export type ArticleLogStatus = (typeof ArticleLogStatusKeys)[number];

export type StateTransitionDetails = {
  articleId: string;
  hasPracticals?: boolean;
  quizAllCorrect?: boolean;
  userWantsToRetry?: boolean;
  userWantsToSkip?: boolean;
};

export type StateTransition = {
  preconditionStates: ArticleLogStatus[];
  preconditionCheck?: (currentState: ArticleLogStatus, details: StateTransitionDetails) => boolean;
  stateChange: (currentState: ArticleLogStatus, details: StateTransitionDetails) => ArticleLogStatus;
};

export const ARTICLE_STATE_TRANSITIONS: Record<string, StateTransition> = {
  LOG_READ: {
    preconditionStates: [
      "reading_in_progress", 
      "knowledge_check_complete", 
      "practical_in_progress"
    ],
    stateChange: (currentState, details) => "reading_in_progress"
  },
  
  START_QUIZ: {
    preconditionStates: [
      "reading_in_progress", 
      "knowledge_check_complete"
    ],
    stateChange: (currentState, details) => "knowledge_check_in_progress"
  },
  
  SUBMIT_QUIZ: {
    preconditionStates: ["knowledge_check_in_progress"],
    stateChange: (currentState, details) => "knowledge_check_complete"
  },
  
  RETRY_QUIZ: {
    preconditionStates: ["knowledge_check_complete"],
    preconditionCheck: (currentState, details) => details.userWantsToRetry === true,
    stateChange: (currentState, details) => "knowledge_check_in_progress"
  },
  
  START_PRACTICAL: {
    preconditionStates: ["knowledge_check_complete"],
    preconditionCheck: (currentState, details) => details.hasPracticals === true,
    stateChange: (currentState, details) => "practical_in_progress"
  },
  
  COMPLETE_PRACTICAL: {
    preconditionStates: ["practical_in_progress"],
    stateChange: (currentState, details) => "completed"
  },
  
  SKIP_PRACTICAL: {
    preconditionStates: ["knowledge_check_complete"],
    preconditionCheck: (currentState, details) => details.userWantsToSkip === true,
    stateChange: (currentState, details) => "completed"
  },
  
  COMPLETE_ARTICLE: {
    preconditionStates: [
      "reading_in_progress", 
      "knowledge_check_complete", 
      "practical_in_progress"
    ],
    stateChange: (currentState, details) => "completed"
  }
};

export class ArticleStateMachineHelper {
  /**
   * Validates a state transition and returns the new state if valid
   */
  static validateTransition(
    currentState: ArticleLogStatus, 
    transitionKey: string, 
    details: StateTransitionDetails
  ): { isValid: boolean; newState?: ArticleLogStatus; error?: string } {
    const transition = ARTICLE_STATE_TRANSITIONS[transitionKey];
    
    if (!transition) {
      return { isValid: false, error: `Invalid transition: ${transitionKey}` };
    }
    
    if (!transition.preconditionStates.includes(currentState)) {
      return { 
        isValid: false, 
        error: `Cannot transition from ${currentState} using ${transitionKey}` 
      };
    }
    
    if (transition.preconditionCheck && !transition.preconditionCheck(currentState, details)) {
      return { 
        isValid: false, 
        error: `Precondition check failed for transition ${transitionKey}` 
      };
    }
    
    const newState = transition.stateChange(currentState, details);
    return { isValid: true, newState };
  }
  
  /**
   * Returns all valid transitions for a given current state
   */
  static getValidTransitions(currentState: ArticleLogStatus): string[] {
    return Object.entries(ARTICLE_STATE_TRANSITIONS)
      .filter(([_, transition]) => transition.preconditionStates.includes(currentState))
      .map(([key, _]) => key);
  }
  
  /**
   * Gets the initial state for a new article
   */
  static getInitialState(): ArticleLogStatus {
    return "reading_in_progress";
  }
  
  /**
   * Checks if a state allows quiz operations
   */
  static canStartQuiz(currentState: ArticleLogStatus): boolean {
    return ["reading_in_progress", "knowledge_check_complete"].includes(currentState);
  }
  
  /**
   * Checks if a state allows practical operations
   */
  static canStartPractical(currentState: ArticleLogStatus): boolean {
    return currentState === "knowledge_check_complete";
  }
  
  /**
   * Checks if a state is considered "completed"
   */
  static isCompleted(currentState: ArticleLogStatus): boolean {
    return currentState === "completed";
  }
}
