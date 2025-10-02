// Content Validator Utility
// Handles validation of content integrity and relationships

import { type ValidationResult, type ValidationError, type ValidationWarning, type ValidationInfo, type ValidationSummary, type Content, type Question } from '../types';
import { ContentLoader } from '../utils/content-loader';

type UniquenessCheckValueType = string | number | null | undefined;
type ReferenceCheckValueType = string | null | undefined;

export class ContentValidator {
    private validationErrors: ValidationError[] = [];
    private validationWarnings: ValidationWarning[] = [];
    private validationInfos: ValidationInfo[] = [];
  private content: Content;

  constructor(content: Content) {
    this.content = content;
  }

  /**
   * Validate all content
   */
  static async validateContent(): Promise<ValidationResult> {
    const contentLoader = await ContentLoader.initialize();
    
    const content = contentLoader.getContent();
      
    if (!content || Object.keys(content).length === 0) {
      throw new Error('No content loaded for validation');
    }

    console.log('Validating content...');

    const result = new ContentValidator(content).validateAllContent();
    
    if (result.isValid) {
      console.log('Content validation passed successfully');
    } else {
      console.error(`Content validation failed with ${result.errors.length} errors and ${result.warnings.length} warnings`);
      ContentValidator.logValidationErrors(result);
    }
    
    return result;
  }


  /**
   * Log validation errors
   */
  private static logValidationErrors(result: ValidationResult): void {
    console.error('=== Content Validation Errors ===');
    
    for (const error of result.errors) {
      console.error(`${error.entityType} ${error.entityId}: ${error.field} - ${error.message}`);
    }
    
    if (result.warnings.length > 0) {
      console.warn('=== Content Validation Warnings ===');
      for (const warning of result.warnings) {
        console.warn(`${warning.entityType} ${warning.entityId}: ${warning.field} - ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`  Suggestion: ${warning.suggestion}`);
        }
      }
    }
    
    console.error(`Validation Summary: ${result.summary.totalEntities} total entities, ${result.summary.errorCount} errors, ${result.summary.warningCount} warnings`);
  }


  /**
   * Validate all content for integrity and relationships
   */
  validateAllContent(): ValidationResult {
    this.validationErrors = [];
    this.validationWarnings = [];

    // Validate business rules
    this.validateBusinessRules();

    // Validate cross-references
    this.validateCrossReferences();

    const summary = this.createValidationSummary();

    return {
      isValid: this.validationErrors.length === 0,
      errors: this.validationErrors,
      warnings: this.validationWarnings,
      summary
    };
  }

  /**
   * Validate cross-references between content types
   */
  private validateCrossReferences(): void {
    // This would implement more complex cross-reference validation
    // For now, basic reference validation is done in individual validation methods
    this.validateKnowledgeBaseReferences();
    this.validateQuestionReferences
  }

  /**
   * Validate business rules
   */
  private validateBusinessRules(): void {
    // Validate individual content types
    this.validateKnowledgeBase();
  }

  private validateKnowledgeBase(): void {
    // Validate uniqueness of key properties
    this.validateUniqueness('KnowledgeBase', (entity) => entity.day, 'day', false);
    this.validateUniqueness('KnowledgeBase', (entity) => entity.slug, 'slug', false);
    this.validateUniqueness('KnowledgeBase', (entity) => entity.title, 'title', false);
    this.validateUniqueness('KnowledgeBase', (entity) => entity.passages.map((passage) => passage.id), 'passage id', false);
    this.validateKnowledgeBaseQuestionCounts();
  }

  /**
   * Validates that each KnowledgeBase has the correct number of associated questions
   * based on the formula: 11 + (4 * number of passages)
   */
  private validateKnowledgeBaseQuestionCounts(): void {
    // Build map of questions per knowledge base
    const questionsByKnowledgeBase = new Map<string, Map<string, Question>>();

    // Populate the map with all questions
    for (const [questionId, question] of this.content.Question.map) {
      const knowledgeBaseId = question.knowledge_base_id;
      if (!questionsByKnowledgeBase.has(knowledgeBaseId)) {
        questionsByKnowledgeBase.set(knowledgeBaseId, new Map());
      }
      questionsByKnowledgeBase.get(knowledgeBaseId)?.set(questionId, question);
    }

    // Validate question count for each knowledge base
    for (const [knowledgeBaseId, knowledgeBase] of this.content.KnowledgeBase.map) {
      const numPassages = knowledgeBase.passages.length;
      const expectedQuestions = 11 + (4 * numPassages);
      
      const actualQuestions = questionsByKnowledgeBase.get(knowledgeBaseId)?.size || 0;

      if (actualQuestions !== expectedQuestions) {
        this.addError(
          'KnowledgeBase',
          knowledgeBaseId,
          'questions',
          `Knowledge base has ${actualQuestions} questions but should have ${expectedQuestions} ` +
          `(11 standalone + 4 questions per passage * ${numPassages} passages)`
        );
      }
    }
  }

  private validateKnowledgeBaseReferences(): void {
    // Validate that all content_category_id references exist in ContentCategory
    this.validateNonNullReference(
      'KnowledgeBase',
      (entity) => entity.content_category_id,
      'content_category_id',
      'ContentCategory'
    );
  }

  private validateQuestionReferences(): void {
    // Validate that all content_category_id references exist in ContentCategory
    this.validateNonNullReference(
      'Question',
      (entity) => entity.knowledge_base_id,
      'knowledge_base_id',
      'KnowledgeBase'
    );

    // @TODO: Validate that all passage_set_id references exist in PassageSet
  }

  /**
   * Validate uniqueness of a property across all entities of a given type
   * @param entityType - The type of content entity to validate (e.g., 'KnowledgeBase')
   * @param valueExtractor - Function to extract the value to check for uniqueness
   * @param fieldName - Human-readable name of the field for error messages
   * @param skipNullUndefined - Whether to skip null/undefined values in the check
   */
  private validateUniqueness<T extends keyof Content>(
    entityType: T,
    valueExtractor: (entity: Content[T]['list'][0]) => UniquenessCheckValueType | Array<UniquenessCheckValueType>,
    fieldName: string,
    skipNullUndefined: boolean = true
  ): void {
    const entityMap = this.content[entityType].map;
    if (!entityMap) {
      this.addError(entityType, 'validation', fieldName, `No ${entityType} entities found for uniqueness validation`);
      return;
    }

    const seenValues = new Map<UniquenessCheckValueType, string[]>();
    const duplicateEntities: string[] = [];

    // Collect all values and track which entities have them
    for (const [entityId, entity] of entityMap) {
      const values = this.coalesceToArray(valueExtractor(entity));
      
      for (const value of values) {
        // Skip null/undefined values if requested
        if (skipNullUndefined && (value === null || value === undefined)) {
          continue;
        }
  
        if (!seenValues.has(value)) {
          seenValues.set(value, []);
        }
        seenValues.get(value)!.push(entityId);
      }
    }

    // Check for duplicates
    for (const [value, entityIds] of seenValues) {
      if (entityIds.length > 1) {
        duplicateEntities.push(...entityIds);
        this.addError(
          entityType,
          entityIds.join(', '),
          fieldName,
          `Duplicate ${fieldName} value "${value}" found in ${entityIds.length} entities: ${entityIds.join(', ')}`
        );
      }
    }

    // Add summary warning if duplicates found
    if (duplicateEntities.length > 0) {
      this.addWarning(
        entityType,
        'summary',
        fieldName,
        `Found ${duplicateEntities.length} entities with duplicate ${fieldName} values`,
        `Ensure all ${entityType} entities have unique ${fieldName} values for proper content management`
      );
    }
  }

  /*
  * Coalesce a value to an array
  * @param value - The value to coalesce to an array
  * @returns The value as an array
  */
  private coalesceToArray<T>(value: T | undefined | null) {
    // If the value is an array, return the array. Otherwise, return an array with the value.
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  }

  /**
   * Validate that extracted values from one Content entity exist as keys in another Content entity
   * Always skip null/undefined values in the check
   * @param sourceEntityType - The type of content entity to validate references from
   * @param sourceValueExtractor - Function to extract the reference value to check
   * @param sourceFieldName - Human-readable name of the source field for error messages
   * @param targetEntityType - The type of content entity to check references against
   */
  private validateNonNullReference<T extends keyof Content, U extends keyof Content>(
    sourceEntityType: T,
    sourceValueExtractor: (entity: Content[T]['list'][0]) => ReferenceCheckValueType,
    sourceFieldName: string,
    targetEntityType: U,
  ): void {
    const sourceEntityMap = this.content[sourceEntityType].map;
    const targetEntityMap = this.content[targetEntityType].map;

    if (!sourceEntityMap) {
      this.addError(sourceEntityType, 'validation', sourceFieldName, `No ${sourceEntityType} entities found for reference validation`);
      return;
    }

    if (!targetEntityMap) {
      this.addError(targetEntityType, 'validation', sourceFieldName, `No ${targetEntityType} entities found to validate references against`);
      return;
    }

    const invalidReferences: string[] = [];
    const referenceCounts = new Map<string, number>();

    // Check each source entity's reference value
    for (const [entityId, entity] of sourceEntityMap) {
      const referenceValue = sourceValueExtractor(entity);
      
      // Skip null/undefined values if requested
      if (referenceValue === null || referenceValue === undefined) {
        continue;
      }

      // Count references for summary
      referenceCounts.set(referenceValue, (referenceCounts.get(referenceValue) || 0) + 1);

      // Check if reference exists in target entity map
      if (!targetEntityMap.has(referenceValue)) {
        invalidReferences.push(entityId);
        this.addError(
          sourceEntityType,
          entityId,
          sourceFieldName,
          `References non-existent ${targetEntityType} with ID: ${referenceValue}`
        );
      }
    }

    // Add summary warning if invalid references found
    if (invalidReferences.length > 0) {
      this.addWarning(
        sourceEntityType,
        'summary',
        sourceFieldName,
        `Found ${invalidReferences.length} entities with invalid ${sourceFieldName} references`,
        `Ensure all ${sourceFieldName} values correspond to existing ${targetEntityType} entities`
      );
    }

    // Add summary info about reference usage
    if (referenceCounts.size > 0) {
      const totalReferences = Array.from(referenceCounts.values()).reduce((sum, count) => sum + count, 0);
      this.addInfo(
        sourceEntityType,
        'summary',
        sourceFieldName,
        `Found ${totalReferences} total references to ${targetEntityType} across ${referenceCounts.size} unique values`,
      );
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
   * Add validation info
   */
  private addInfo(entityType: string, entityId: string, field: string, message: string): void {
    this.validationInfos.push({
      entityType,
      entityId,
      field,
      message
    });
  }

  /**
   * Create validation summary
   */
  private createValidationSummary(): ValidationSummary {
    const totalEntities = Object.values(this.content).reduce((total, content) => total + (content?.map?.size || 0), 0);
    const validEntities = totalEntities - this.validationErrors.length;

    return {
      totalEntities,
      validEntities,
      errorCount: this.validationErrors.length,
      warningCount: this.validationWarnings.length,
      criticalErrors: this.validationErrors.filter(e => e.severity === 'critical').length,
      countsByType: {
        ContentCategory: this.content.ContentCategory.map.size,
        Question: this.content.Question.map.size,
        KnowledgeBase: this.content.KnowledgeBase.map.size,
        LogType: this.content.LogType.map.size,
        //AvatarAsset: this.content.AvatarAsset.map.size,
        LearningPath: this.content.LearningPath.map.size,
        PersonaQuestion: this.content.PersonaQuestion.map.size,
      }
    };
  }
}
