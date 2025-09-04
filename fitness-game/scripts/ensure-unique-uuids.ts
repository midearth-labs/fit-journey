import { readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { isValidUUID, analyzeQuestionIds } from './uuid-validator';
import { Question } from '@/data/content/types/question';


function ensureUniqueUUIDs(filePath: string, forceUpdate: boolean = false): void {
  try {
    // First, analyze the current state
    console.log('🔍 Analyzing current question IDs...\n');
    const analysis = analyzeQuestionIds(filePath);
    
    // If all IDs are already unique UUIDs and we're not forcing update, exit early
    if (!forceUpdate && analysis.duplicateIds.length === 0 && analysis.nonUuidIds.length === 0) {
      console.log('✅ All questions already have unique UUIDs! No changes needed.');
      return;
    }
    
    // Read the JSON file
    const fileContent = readFileSync(filePath, 'utf-8');
    const questions: Question[] = JSON.parse(fileContent);
    
    // Track existing UUIDs to ensure uniqueness
    const existingUUIDs = new Set<string>();
    
    // Collect all existing UUIDs first
    questions.forEach(question => {
      if (isValidUUID(question.id)) {
        existingUUIDs.add(question.id);
      }
    });
    
    // Generate unique UUIDs for each question that needs updating
    const updatedQuestions = questions.map((question, index) => {
      let newUUID: string;
      let wasUpdated = false;
      
      // If the ID is already a valid UUID and we're not forcing update, keep it
      if (isValidUUID(question.id) && !forceUpdate) {
        return question;
      }
      
      // Generate a unique UUID
      do {
        newUUID = randomUUID();
      } while (existingUUIDs.has(newUUID));
      
      existingUUIDs.add(newUUID);
      
      // Create updated question with new UUID
      const updatedQuestion: Question = {
        ...question,
        id: newUUID
      };
      
      console.log(`Question ${index + 1}: "${question.id}" → "${newUUID}"`);
      wasUpdated = true;
      
      return updatedQuestion;
    });
    
    // Write the updated JSON back to file
    const updatedContent = JSON.stringify(updatedQuestions, null, 2);
    writeFileSync(filePath, updatedContent, 'utf-8');
    
    console.log(`\n✅ Successfully updated questions with unique UUIDs`);
    console.log(`📁 File updated: ${filePath}`);
    
  } catch (error) {
    console.error('❌ Error processing file:', error);
    throw error;
  }
}

// Validation function to check for UUID uniqueness
function validateUUIDUniqueness(filePath: string): boolean {
  try {
    const analysis = analyzeQuestionIds(filePath);
    
    if (analysis.duplicateIds.length > 0) {
      console.error('❌ Found duplicate IDs:');
      analysis.duplicateIds.forEach(duplicate => console.error(`  - ${duplicate}`));
      return false;
    }
    
    if (analysis.nonUuidIds.length > 0) {
      console.error('❌ Found non-UUID IDs:');
      analysis.nonUuidIds.forEach(nonUuid => console.error(`  - ${nonUuid}`));
      return false;
    }
    
    console.log('✅ All IDs are unique UUIDs!');
    return true;
  } catch (error) {
    console.error('❌ Error validating UUIDs:', error);
    return false;
  }
}

// Main execution
if (require.main === module) {
  const filePath = process.argv[2] || path.join(__dirname, '../src/data/content/questions/nutrition-essentials.json');
  
  const forceUpdate = process.argv.includes('--force');
  
  console.log('🔄 Ensuring unique UUIDs for nutrition-essentials.json...\n');
  
  if (forceUpdate) {
    console.log('⚠️  Force update mode enabled - will update all IDs including existing UUIDs\n');
  }
  
  // Process the file
  ensureUniqueUUIDs(filePath, forceUpdate);
  
  // Validate the results
  console.log('\n🔍 Validating UUID uniqueness...');
  const isValid = validateUUIDUniqueness(filePath);
  
  if (isValid) {
    console.log('\n🎉 All done! The file now contains unique UUIDs for all questions.');
  } else {
    console.log('\n⚠️  Validation failed. Please check the file manually.');
    process.exit(1);
  }
}

export { ensureUniqueUUIDs, validateUUIDUniqueness };
