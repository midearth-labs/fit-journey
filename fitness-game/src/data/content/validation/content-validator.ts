// Content Validator Utility
// Handles validation of content integrity and relationships

import { ValidationResult, ValidationError, ValidationWarning, ValidationSummary } from '../types';
import { ContentType, ContentMaps } from '../types';
import { CONTENT_VALIDATION_RULES } from '../types/constants';

export class ContentValidator {
  private contentMaps: Partial<ContentMaps> = {};
  private validationErrors: ValidationError[] = [];
  private validationWarnings: ValidationWarning[] = [];

  constructor(contentMaps: Partial<ContentMaps>) {
    this.contentMaps = contentMaps;
  }

  /**
   * Validate all content for integrity and relationships
   */
  validateAllContent(): ValidationResult {
    this.validationErrors = [];
    this.validationWarnings = [];

    // Validate individual content types
    this.validateContentCategories();
    this.validateQuestions();
    this.validatePassageSets();
    this.validateKnowledgeBase();
    this.validateDailyChallenges();
    this.validateAchievements();
    this.validateUserStates();
    this.validateStreakTypes();
    this.validateAvatarAssets();

    // Validate cross-references
    this.validateCrossReferences();

    // Validate business rules
    this.validateBusinessRules();

    const summary = this.createValidationSummary();

    return {
      isValid: this.validationErrors.length === 0,
      errors: this.validationErrors,
      warnings: this.validationWarnings,
      summary
    };
  }

  /**
   * Validate content categories
   */
  private validateContentCategories(): void {
    const categories = this.contentMaps.ContentCategory;
    if (!categories) return;

    for (const [id, category] of categories) {
      // Validate required fields
      if (!category.name) {
        this.addError('ContentCategory', id, 'name', 'Name is required');
      }
      if (!category.description) {
        this.addError('ContentCategory', id, 'description', 'Description is required');
      }
      if (category.sort_order === undefined || category.sort_order === null) {
        this.addError('ContentCategory', id, 'sort_order', 'Sort order is required');
      }

      // Validate business rules
      if (category.sort_order < 0) {
        this.addError('ContentCategory', id, 'sort_order', 'Sort order must be non-negative');
      }
    }
  }

  /**
   * Validate questions
   */
  private validateQuestions(): void {
    const questions = this.contentMaps.Question;
    if (!questions) return;

    for (const [id, question] of questions) {
      // Validate required fields
      if (!question.question_text) {
        this.addError('Question', id, 'question_text', 'Question text is required');
      }
      if (!question.options || question.options.length === 0) {
        this.addError('Question', id, 'options', 'Options are required');
      }
      if (question.correct_answer_index === undefined || question.correct_answer_index === null) {
        this.addError('Question', id, 'correct_answer_index', 'Correct answer index is required');
      }
      if (!question.content_category_id) {
        this.addError('Question', id, 'content_category_id', 'Content category ID is required');
      }

      // Validate business rules
      if (question.options && question.options.length < CONTENT_VALIDATION_RULES.MIN_OPTIONS_PER_QUESTION) {
        this.addError('Question', id, 'options', `Must have at least ${CONTENT_VALIDATION_RULES.MIN_OPTIONS_PER_QUESTION} options`);
      }
      if (question.options && question.options.length > CONTENT_VALIDATION_RULES.MAX_OPTIONS_PER_QUESTION) {
        this.addError('Question', id, 'options', `Must have at most ${CONTENT_VALIDATION_RULES.MAX_OPTIONS_PER_QUESTION} options`);
      }
      if (question.correct_answer_index >= (question.options?.length || 0)) {
        this.addError('Question', id, 'correct_answer_index', 'Correct answer index must be within options range');
      }
      if (question.difficulty_level < CONTENT_VALIDATION_RULES.MIN_DIFFICULTY_LEVEL || 
          question.difficulty_level > CONTENT_VALIDATION_RULES.MAX_DIFFICULTY_LEVEL) {
        this.addError('Question', id, 'difficulty_level', `Difficulty level must be between ${CONTENT_VALIDATION_RULES.MIN_DIFFICULTY_LEVEL} and ${CONTENT_VALIDATION_RULES.MAX_DIFFICULTY_LEVEL}`);
      }

      // Validate content category reference
      this.validateReference('Question', id, 'content_category_id', 'ContentCategory', question.content_category_id);
    }
  }

  /**
   * Validate passage sets
   */
  private validatePassageSets(): void {
    const passages = this.contentMaps.PassageSet;
    if (!passages) return;

    for (const [id, passage] of passages) {
      // Validate required fields
      if (!passage.title) {
        this.addError('PassageSet', id, 'title', 'Title is required');
      }
      if (!passage.passage_text) {
        this.addError('PassageSet', id, 'passage_text', 'Passage text is required');
      }
      if (passage.question_count === undefined || passage.question_count === null) {
        this.addError('PassageSet', id, 'question_count', 'Question count is required');
      }
      if (!passage.content_category_id) {
        this.addError('PassageSet', id, 'content_category_id', 'Content category ID is required');
      }

      // Validate business rules
      if (passage.question_count < 1) {
        this.addError('PassageSet', id, 'question_count', 'Question count must be at least 1');
      }
      if (passage.estimated_read_time_minutes <= 0) {
        this.addError('PassageSet', id, 'estimated_read_time_minutes', 'Estimated read time must be positive');
      }

      // Validate content category reference
      this.validateReference('PassageSet', id, 'content_category_id', 'ContentCategory', passage.content_category_id);
    }
  }

  /**
   * Validate knowledge base
   */
  private validateKnowledgeBase(): void {
    const knowledgeBase = this.contentMaps.KnowledgeBase;
    if (!knowledgeBase) return;

    for (const [id, kb] of knowledgeBase) {
      // Validate required fields
      if (!kb.title) {
        this.addError('KnowledgeBase', id, 'title', 'Title is required');
      }
      if (!kb.description) {
        this.addError('KnowledgeBase', id, 'description', 'Description is required');
      }
      if (!kb.content_category_id) {
        this.addError('KnowledgeBase', id, 'content_category_id', 'Content category ID is required');
      }

      // Validate content category reference
      this.validateReference('KnowledgeBase', id, 'content_category_id', 'ContentCategory', kb.content_category_id);
    }
  }

  /**
   * Validate daily challenges
   */
  private validateDailyChallenges(): void {
    const challenges = this.contentMaps.DailyChallenge;
    if (!challenges) return;

    for (const [id, challenge] of challenges) {
      // Validate required fields
      if (!challenge.content_category_id) {
        this.addError('DailyChallenge', id, 'content_category_id', 'Content category ID is required');
      }
      if (challenge.day === undefined || challenge.day === null) {
        this.addError('DailyChallenge', id, 'day', 'Day number is required');
      }
      if (!challenge.challenge_structure || challenge.challenge_structure.length === 0) {
        this.addError('DailyChallenge', id, 'challenge_structure', 'Challenge structure is required');
      }
      if (challenge.total_questions === undefined || challenge.total_questions === null) {
        this.addError('DailyChallenge', id, 'total_questions', 'Total questions count is required');
      }

      // Validate business rules
      if (challenge.day < 1) {
        this.addError('DailyChallenge', id, 'day', 'Day number must be at least 1');
      }
      if (challenge.total_questions < CONTENT_VALIDATION_RULES.MIN_QUESTIONS_PER_DAILY_CHALLENGE) {
        this.addError('DailyChallenge', id, 'total_questions', `Must have at least ${CONTENT_VALIDATION_RULES.MIN_QUESTIONS_PER_DAILY_CHALLENGE} questions`);
      }
      if (challenge.total_questions > CONTENT_VALIDATION_RULES.MAX_QUESTIONS_PER_DAILY_CHALLENGE) {
        this.addError('DailyChallenge', id, 'total_questions', `Must have at most ${CONTENT_VALIDATION_RULES.MAX_QUESTIONS_PER_DAILY_CHALLENGE} questions`);
      }

      // Validate content category reference
      this.validateReference('DailyChallenge', id, 'content_category_id', 'ContentCategory', challenge.content_category_id);

      // Validate challenge structure
      this.validateChallengeStructure(id, challenge);
    }
  }

  /**
   * Validate challenge structure
   */
  private validateChallengeStructure(challengeId: string, challenge: any): void {
    if (!challenge.challenge_structure) return;

    let totalQuestions = 0;
    const seenQuestionIds = new Set<string>();
    const seenPassageIds = new Set<string>();

    for (const structure of challenge.challenge_structure) {
      if (structure.type === 'standalone') {
        if (structure.question_id) {
          totalQuestions++;
          seenQuestionIds.add(structure.question_id);
          this.validateReference('DailyChallenge', challengeId, 'challenge_structure.question_id', 'Question', structure.question_id);
        }
      } else if (structure.type === 'passage') {
        if (structure.passage_set_id) {
          seenPassageIds.add(structure.passage_set_id);
          this.validateReference('DailyChallenge', challengeId, 'challenge_structure.passage_set_id', 'PassageSet', structure.passage_set_id);
          
          if (structure.question_ids) {
            totalQuestions += structure.question_ids.length;
            for (const questionId of structure.question_ids) {
              seenQuestionIds.add(questionId);
              this.validateReference('DailyChallenge', challengeId, 'challenge_structure.question_ids', 'Question', questionId);
            }
          }
        }
      }
    }

    // Validate total questions count
    if (totalQuestions !== challenge.total_questions) {
      this.addError('DailyChallenge', challengeId, 'total_questions', 
        `Total questions count (${challenge.total_questions}) doesn't match actual questions in structure (${totalQuestions})`);
    }
  }

  /**
   * Validate achievements
   */
  private validateAchievements(): void {
    const achievements = this.contentMaps.Achievement;
    if (!achievements) return;

    for (const [id, achievement] of achievements) {
      // Validate required fields
      if (!achievement.name) {
        this.addError('Achievement', id, 'name', 'Name is required');
      }
      if (!achievement.description) {
        this.addError('Achievement', id, 'description', 'Description is required');
      }
      if (!achievement.unlock_condition) {
        this.addError('Achievement', id, 'unlock_condition', 'Unlock condition is required');
      }

      // Validate unlock condition
      this.validateUnlockCondition('Achievement', id, achievement.unlock_condition);
    }
  }

  /**
   * Validate user states
   */
  private validateUserStates(): void {
    const userStates = this.contentMaps.UserState;
    if (!userStates) return;

    for (const [id, state] of userStates) {
      // Validate required fields
      if (!state.unlock_condition) {
        this.addError('UserState', id, 'unlock_condition', 'Unlock condition is required');
      }
      if (state.eval_order === undefined || state.eval_order === null) {
        this.addError('UserState', id, 'eval_order', 'Evaluation order is required');
      }

      // Validate unlock condition
      this.validateUnlockCondition('UserState', id, state.unlock_condition);
    }
  }

  /**
   * Validate streak types
   */
  private validateStreakTypes(): void {
    const streakTypes = this.contentMaps.StreakType;
    if (!streakTypes) return;

    for (const [id, streakType] of streakTypes) {
      // Validate required fields
      if (!streakType.title) {
        this.addError('StreakType', id, 'title', 'Title is required');
      }
      if (!streakType.description) {
        this.addError('StreakType', id, 'description', 'Description is required');
      }
      if (streakType.sort_order === undefined || streakType.sort_order === null) {
        this.addError('StreakType', id, 'sort_order', 'Sort order is required');
      }
    }
  }

  /**
   * Validate avatar assets
   */
  private validateAvatarAssets(): void {
    const avatarAssets = this.contentMaps.AvatarAsset;
    if (!avatarAssets) return;

    for (const [id, asset] of avatarAssets) {
      // Validate required fields
      if (!asset.state_id) {
        this.addError('AvatarAsset', id, 'state_id', 'State ID is required');
      }
      if (!asset.gender) {
        this.addError('AvatarAsset', id, 'gender', 'Gender is required');
      }
      if (!asset.age_range) {
        this.addError('AvatarAsset', id, 'age_range', 'Age range is required');
      }
      if (!asset.image_url) {
        this.addError('AvatarAsset', id, 'image_url', 'Image URL is required');
      }

      // Validate state reference
      this.validateReference('AvatarAsset', id, 'state_id', 'UserState', asset.state_id);
    }
  }

  /**
   * Validate cross-references between content types
   */
  private validateCrossReferences(): void {
    // This would implement more complex cross-reference validation
    // For now, basic reference validation is done in individual validation methods
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(): void {
    // This would implement business rule validation
    // For now, basic business rules are validated in individual validation methods
  }

  /**
   * Validate unlock conditions
   */
  private validateUnlockCondition(entityType: string, entityId: string, unlockCondition: any): void {
    if (!unlockCondition.type) {
      this.addError(entityType, entityId, 'unlock_condition.type', 'Unlock condition type is required');
      return;
    }

    if (unlockCondition.value === undefined || unlockCondition.value === null) {
      this.addError(entityType, entityId, 'unlock_condition.value', 'Unlock condition value is required');
      return;
    }

    if (unlockCondition.value <= 0) {
      this.addError(entityType, entityId, 'unlock_condition.value', 'Unlock condition value must be positive');
    }

    // Validate streak type reference if applicable
    if (unlockCondition.type === 'streak' && unlockCondition.streak_type) {
      this.validateReference(entityType, entityId, 'unlock_condition.streak_type', 'StreakType', unlockCondition.streak_type);
    }

    // Validate content category reference if applicable
    if (unlockCondition.content_category_id) {
      this.validateReference(entityType, entityId, 'unlock_condition.content_category_id', 'ContentCategory', unlockCondition.content_category_id);
    }
  }

  /**
   * Validate reference to another entity
   */
  private validateReference(sourceType: string, sourceId: string, fieldName: string, targetType: string, targetId: string): void {
    const targetMap = this.contentMaps[targetType as keyof ContentMaps];
    if (!targetMap || !targetMap.has(targetId)) {
      this.addError(sourceType, sourceId, fieldName, `References non-existent ${targetType} with ID: ${targetId}`);
    }
  }

  /**
   * Add validation error
   */
  private addError(entityType: string, entityId: string, field: string, message: string): void {
    this.validationErrors.push({
      entityType,
      entityId,
      field,
      message,
      severity: 'error'
    });
  }

  /**
   * Add validation warning
   */
  private addWarning(entityType: string, entityId: string, field: string, message: string, suggestion?: string): void {
    this.validationWarnings.push({
      entityType,
      entityId,
      field,
      message,
      suggestion
    });
  }

  /**
   * Create validation summary
   */
  private createValidationSummary(): ValidationSummary {
    const totalEntities = Object.values(this.contentMaps).reduce((total, map) => total + (map?.size || 0), 0);
    const validEntities = totalEntities - this.validationErrors.length;

    return {
      totalEntities,
      validEntities,
      errorCount: this.validationErrors.length,
      warningCount: this.validationWarnings.length,
      criticalErrors: this.validationErrors.filter(e => e.severity === 'critical').length
    };
  }
}
