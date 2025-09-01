// Content Validator Utility
// Handles validation of content integrity and relationships

import { ValidationResult, ValidationError, ValidationWarning, ValidationSummary, Content } from '../types';
import { ContentLoader } from '../utils/content-loader';

export class ContentValidator {
  private validationErrors: ValidationError[] = [];
  private validationWarnings: ValidationWarning[] = [];
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

    // Validate individual content types

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
    const targetMap = this.content[targetType as keyof Content].map;
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
        StreakType: this.content.StreakType.map.size,
        AvatarAsset: this.content.AvatarAsset.map.size,
      }
    };
  }
}
