#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { QuestionSchema } from '../src/data/content/types/question';
import { KnowledgeBaseSchema } from '../src/data/content/types/knowledge-base';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalQuestions: number;
    passageBasedQuestions: number;
    knowledgeBasesChecked: number;
    totalKnowledgeBases: number;
    unvisitedKnowledgeBases: number;
    validGroups: number;
    invalidGroups: number;
    updatedQuestions: number;
    updatedFiles: number;
  };
}

interface QuestionGroup {
  knowledgeBaseId: string;
  questions: Array<{
    id: string;
    passage_set_id: string;
    question_text: string;
    originalIndex: number; // Track original position in file
  }>;
}

interface PassageValidation {
  passageId: string;
  expectedCount: number;
  actualCount: number;
  isValid: boolean;
}

interface UpdateResult {
  updatedQuestions: number;
  updatedFiles: number;
  details: string[];
}

function validatePassageQuestions(forceUpdate: boolean = false): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalQuestions: 0,
      passageBasedQuestions: 0,
      knowledgeBasesChecked: 0,
      totalKnowledgeBases: 0,
      unvisitedKnowledgeBases: 0,
      validGroups: 0,
      invalidGroups: 0,
      updatedQuestions: 0,
      updatedFiles: 0,
    }
  };

  const questionsDir = path.join(__dirname, '..', '..', 'static', 'content', 'questions');
  const knowledgeBaseDir = path.join(__dirname, '..', '..', 'static', 'content', 'knowledge-base');

  // Load all question files
  const questionFiles = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));
  
  // Load all knowledge base files
  const knowledgeBaseFiles = fs.readdirSync(knowledgeBaseDir).filter(file => file.endsWith('.json'));

  // Create a map of knowledge base ID to knowledge base data
  const knowledgeBaseMap = new Map<string, any>();
  
  for (const file of knowledgeBaseFiles) {
    try {
      const filePath = path.join(knowledgeBaseDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const knowledgeBases = JSON.parse(content);
      
      for (const kb of knowledgeBases) {
        // Validate against schema
        const parsed = KnowledgeBaseSchema.safeParse(kb);
        if (!parsed.success) {
          result.errors.push(`Knowledge base ${kb.id} in ${file} failed validation: ${parsed.error.message}`);
          result.isValid = false;
          continue;
        }
        
        knowledgeBaseMap.set(kb.id, parsed.data);
      }
    } catch (error) {
      result.errors.push(`Failed to load knowledge base file ${file}: ${error}`);
      result.isValid = false;
    }
  }

  // Track which knowledge bases still need to be visited (start with all, remove as we visit)
  const knowledgeBasesToVisit = new Set<string>(knowledgeBaseMap.keys());

  // Process each question file
  for (const file of questionFiles) {
    try {
      const filePath = path.join(questionsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const questions = JSON.parse(content);

      // Group questions by knowledge_base_id
      const questionGroups = new Map<string, QuestionGroup>();
      let fileUpdated = false;

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        result.summary.totalQuestions++;

        // Validate question against schema
        const parsed = QuestionSchema.safeParse(question);
        if (!parsed.success) {
          result.errors.push(`Question ${question.id} in ${file} failed validation: ${parsed.error.message}`);
          result.isValid = false;
          continue;
        }

        // Only process passage-based questions
        if (question.question_type === 'passage_based' && question.passage_set_id) {
          result.summary.passageBasedQuestions++;

          if (!questionGroups.has(question.knowledge_base_id)) {
            questionGroups.set(question.knowledge_base_id, {
              knowledgeBaseId: question.knowledge_base_id,
              questions: []
            });
          }

          questionGroups.get(question.knowledge_base_id)!.questions.push({
            id: question.id,
            passage_set_id: question.passage_set_id,
            question_text: question.question_text,
            originalIndex: i
          });
        }
      }

      // Validate each group and potentially update
      for (const [knowledgeBaseId, group] of questionGroups) {
        result.summary.knowledgeBasesChecked++;
        
        const knowledgeBase = knowledgeBaseMap.get(knowledgeBaseId);
        if (!knowledgeBase) {
          result.errors.push(`Knowledge base ${knowledgeBaseId} referenced in questions but not found in knowledge base files`);
          result.isValid = false;
          result.summary.invalidGroups++;
          continue;
        }

        // Remove this knowledge base from the "to visit" list
        knowledgeBasesToVisit.delete(knowledgeBaseId);

        const groupValidation = validateQuestionGroup(group, knowledgeBase, file);
        
        if (groupValidation.isValid) {
          result.summary.validGroups++;
        } else {
          result.summary.invalidGroups++;
          result.isValid = false;
          result.errors.push(...groupValidation.errors);
          
          // If forceUpdate is enabled, try to fix the issues
          if (forceUpdate) {
            const updateResult = updateQuestionGroup(group, knowledgeBase, questions, file);
            if (updateResult.updatedQuestions > 0) {
              result.summary.updatedQuestions += updateResult.updatedQuestions;
              fileUpdated = true;
              result.warnings.push(...updateResult.details);
            }
          }
        }
        
        result.warnings.push(...groupValidation.warnings);
      }

      // Save updated file if changes were made
      if (forceUpdate && fileUpdated) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf-8');
          result.summary.updatedFiles++;
          result.warnings.push(`Updated file: ${file}`);
        } catch (error) {
          result.errors.push(`Failed to save updated file ${file}: ${error}`);
        }
      }

    } catch (error) {
      result.errors.push(`Failed to load question file ${file}: ${error}`);
      result.isValid = false;
    }
  }

  // Check for unvisited knowledge bases (any remaining in knowledgeBasesToVisit)
  const unvisitedKnowledgeBases = Array.from(knowledgeBasesToVisit);
  
  // Update summary statistics
  result.summary.totalKnowledgeBases = knowledgeBaseMap.size;
  result.summary.unvisitedKnowledgeBases = unvisitedKnowledgeBases.length;
  
  if (unvisitedKnowledgeBases.length > 0) {
    result.errors.push(`Found ${unvisitedKnowledgeBases.length} knowledge base(s) that are not referenced by any passage-based questions: ${unvisitedKnowledgeBases.join(', ')}`);
    result.isValid = false;
  }

  return result;
}

function validateQuestionGroup(group: QuestionGroup, knowledgeBase: any, fileName: string): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isValid = true;

  const { questions } = group;
  const { passages } = knowledgeBase;

  // Check if total questions is a multiple of 4
  if (questions.length % 4 !== 0) {
    console.log(group)
    errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Total passage-based questions (${questions.length}) is not a multiple of 4`);
    isValid = false;
  }

  // Check if number of passages matches the expected number of groups
  const expectedPassageCount = questions.length / 4;
  if (passages.length !== expectedPassageCount) {
    errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Expected ${expectedPassageCount} passages but found ${passages.length} passages`);
    isValid = false;
  }

  // Group questions by passage_set_id
  const questionsByPassage = new Map<string, typeof questions>();
  for (const question of questions) {
    if (!questionsByPassage.has(question.passage_set_id)) {
      questionsByPassage.set(question.passage_set_id, []);
    }
    questionsByPassage.get(question.passage_set_id)!.push(question);
  }

  // Validate each passage group
  const passageValidations: PassageValidation[] = [];

  for (let i = 0; i < passages.length; i++) {
    const passage = passages[i];
    const passageQuestions = questionsByPassage.get(passage.id) || [];
    
    const validation: PassageValidation = {
      passageId: passage.id,
      expectedCount: 4,
      actualCount: passageQuestions.length,
      isValid: passageQuestions.length === 4
    };

    passageValidations.push(validation);

    if (!validation.isValid) {
      errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Passage ${passage.id} has ${validation.actualCount} questions, expected 4`);
      isValid = false;
    }

    // Check if all questions in this passage group have the same passage_set_id
    if (passageQuestions.length > 0) {
      const firstPassageId = passageQuestions[0].passage_set_id;
      const allSamePassageId = passageQuestions.every(q => q.passage_set_id === firstPassageId);
      
      if (!allSamePassageId) {
        errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Questions for passage ${passage.id} have inconsistent passage_set_id values`);
        isValid = false;
      }

      // Check if passage_set_id matches the passage.id
      if (firstPassageId !== passage.id) {
        errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Questions reference passage_set_id ${firstPassageId} but should reference ${passage.id}`);
        isValid = false;
      }
    }
  }

  // Check for orphaned passage_set_ids (questions that reference passages not in the knowledge base)
  for (const [passageSetId, passageQuestions] of questionsByPassage) {
    const passageExists = passages.some((p: any) => p.id === passageSetId);
    if (!passageExists) {
      errors.push(`Knowledge base ${group.knowledgeBaseId} in ${fileName}: Questions reference passage_set_id ${passageSetId} which does not exist in the knowledge base`);
      isValid = false;
    }
  }

  return { isValid, errors, warnings };
}

function updateQuestionGroup(group: QuestionGroup, knowledgeBase: any, allQuestions: any[], fileName: string): UpdateResult {
  const result: UpdateResult = {
    updatedQuestions: 0,
    updatedFiles: 0,
    details: []
  };

  const { questions } = group;
  const { passages } = knowledgeBase;

  // If we don't have the right number of passages, we can't auto-fix
  if (questions.length % 4 !== 0) {
    result.details.push(`Cannot auto-fix: ${questions.length} questions is not a multiple of 4`);
    return result;
  }

  const expectedPassageCount = questions.length / 4;
  if (passages.length !== expectedPassageCount) {
    result.details.push(`Cannot auto-fix: Expected ${expectedPassageCount} passages but found ${passages.length} passages`);
    return result;
  }

  // Group questions by passage_set_id
  const questionsByPassage = new Map<string, typeof questions>();
  for (const question of questions) {
    if (!questionsByPassage.has(question.passage_set_id)) {
      questionsByPassage.set(question.passage_set_id, []);
    }
    questionsByPassage.get(question.passage_set_id)!.push(question);
  }

  // Create a mapping of old passage_set_ids to correct passage IDs
  const passageMapping = new Map<string, string>();
  const usedPassageIds = new Set<string>();

  // First, handle questions that already reference valid passage IDs
  for (const passage of passages) {
    const existingQuestions = questionsByPassage.get(passage.id) || [];
    if (existingQuestions.length > 0) {
      usedPassageIds.add(passage.id);
      // If we have exactly 4 questions for this passage, mark it as correctly mapped
      if (existingQuestions.length === 4) {
        passageMapping.set(passage.id, passage.id);
      }
    }
  }

  // Now handle orphaned passage_set_ids by mapping them to unused passage IDs
  for (const [oldPassageId, passageQuestions] of questionsByPassage) {
    // Skip if this passage ID is already correctly mapped
    if (passageMapping.has(oldPassageId)) {
      continue;
    }

    // Find an unused passage ID
    let targetPassageId: string | null = null;
    for (const passage of passages) {
      if (!usedPassageIds.has(passage.id)) {
        targetPassageId = passage.id;
        usedPassageIds.add(passage.id);
        break;
      }
    }

    if (targetPassageId) {
      passageMapping.set(oldPassageId, targetPassageId);
      result.details.push(`Mapped orphaned passage_set_id "${oldPassageId}" to correct passage "${targetPassageId}"`);
    } else {
      result.details.push(`Could not find unused passage for orphaned passage_set_id "${oldPassageId}"`);
    }
  }

  // Apply the mapping to update the questions
  for (const [oldPassageId, newPassageId] of passageMapping) {
    if (oldPassageId !== newPassageId) {
      const questionsToUpdate = questionsByPassage.get(oldPassageId) || [];
      for (const question of questionsToUpdate) {
        // Update the question in the original array
        allQuestions[question.originalIndex].passage_set_id = newPassageId;
        result.updatedQuestions++;
      }
    }
  }

  return result;
}

// Main execution
if (require.main === module) {
  const forceUpdate = process.argv.includes('--force-update') || process.argv.includes('-f');
  
  if (forceUpdate) {
    console.log('🔧 Validating and auto-fixing passage-based questions...\n');
  } else {
    console.log('🔍 Validating passage-based questions...\n');
  }
  
  const result = validatePassageQuestions(forceUpdate);
  
  console.log('📊 SUMMARY:');
  console.log(`Total questions processed: ${result.summary.totalQuestions}`);
  console.log(`Passage-based questions: ${result.summary.passageBasedQuestions}`);
  console.log(`Total knowledge bases: ${result.summary.totalKnowledgeBases}`);
  console.log(`Knowledge bases checked: ${result.summary.knowledgeBasesChecked}`);
  console.log(`Unvisited knowledge bases: ${result.summary.unvisitedKnowledgeBases}`);
  console.log(`Valid groups: ${result.summary.validGroups}`);
  console.log(`Invalid groups: ${result.summary.invalidGroups}`);
  
  if (forceUpdate) {
    console.log(`Updated questions: ${result.summary.updatedQuestions}`);
    console.log(`Updated files: ${result.summary.updatedFiles}`);
  }
  
  console.log('');

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warning => console.log(`  ${warning}`));
    console.log('');
  }

  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach(error => console.log(`  ${error}`));
    console.log('');
  }

  if (result.isValid) {
    console.log('✅ All passage-based questions are valid!');
    if (forceUpdate && result.summary.updatedQuestions > 0) {
      console.log(`✅ Auto-fixed ${result.summary.updatedQuestions} questions in ${result.summary.updatedFiles} files`);
    }
    process.exit(0);
  } else {
    if (forceUpdate) {
      console.log('❌ Some validation errors could not be auto-fixed. Please fix the remaining errors manually.');
    } else {
      console.log('❌ Validation failed. Use --force-update to attempt automatic fixes.');
    }
    process.exit(1);
  }
}

export { validatePassageQuestions };
