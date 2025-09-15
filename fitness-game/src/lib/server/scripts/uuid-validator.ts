
import fs from 'fs';
import path from 'path';
// UUID regex pattern (RFC 4122)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Checks if an ID is already in UUID format
 */
export function isUUIDFormat(id: string): boolean {
  return isValidUUID(id);
}

/**
 * Analyzes a JSON file to check the current state of question IDs
 */
export function analyzeQuestionIds(filePath: string): {
  totalQuestions: number;
  uuidCount: number;
  nonUuidCount: number;
  duplicateIds: string[];
  nonUuidIds: string[];
} {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    const idSet = new Set<string>();
    const duplicateIds: string[] = [];
    const nonUuidIds: string[] = [];
    let uuidCount = 0;
    
    questions.forEach((question: any, index: number) => {
      const id = question.id;
      
      if (idSet.has(id)) {
        duplicateIds.push(`Question ${index + 1}: ${id}`);
      } else {
        idSet.add(id);
      }
      
      if (isUUIDFormat(id)) {
        uuidCount++;
      } else {
        nonUuidIds.push(`Question ${index + 1}: ${id}`);
      }
    });
    
    return {
      totalQuestions: questions.length,
      uuidCount,
      nonUuidCount: questions.length - uuidCount,
      duplicateIds,
      nonUuidIds
    };
  } catch (error) {
    console.error('Error analyzing file:', error);
    throw error;
  }
}

/**
 * Validates that all question IDs in a file are unique UUIDs
 */
export function validateAllUUIDsUnique(filePath: string): boolean {
  const analysis = analyzeQuestionIds(filePath);
  
  console.log(`📊 Analysis Results:`);
  console.log(`  Total questions: ${analysis.totalQuestions}`);
  console.log(`  UUID format: ${analysis.uuidCount}`);
  console.log(`  Non-UUID format: ${analysis.nonUuidCount}`);
  
  if (analysis.duplicateIds.length > 0) {
    console.log(`  ❌ Duplicate IDs found: ${analysis.duplicateIds.length}`);
    analysis.duplicateIds.forEach(id => console.log(`    - ${id}`));
  }
  
  if (analysis.nonUuidIds.length > 0) {
    console.log(`  ⚠️  Non-UUID IDs found: ${analysis.nonUuidIds.length}`);
    analysis.nonUuidIds.slice(0, 5).forEach(id => console.log(`    - ${id}`));
    if (analysis.nonUuidIds.length > 5) {
      console.log(`    ... and ${analysis.nonUuidIds.length - 5} more`);
    }
  }
  
  const isValid = analysis.duplicateIds.length === 0 && analysis.nonUuidIds.length === 0;
  
  if (isValid) {
    console.log(`✅ All questions have unique UUIDs!`);
  } else {
    console.log(`❌ File needs to be updated to ensure unique UUIDs`);
  }
  
  return isValid;
}

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const questionsDir = path.join(process.cwd(), 'static', 'content', 'questions');

  try {
    // Get all JSON files in the questions directory
    const files = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
      console.log('No JSON files found in questions directory');
      process.exit(0);
    }

    let hasErrors = false;

    // Process each JSON file
    for (const file of files) {
      const filePath = path.join(questionsDir, file);
      console.log(`\n🔍 Analyzing question IDs in: ${file}\n`);
      
      try {
        const isValid = validateAllUUIDsUnique(filePath);
        if (!isValid) {
          hasErrors = true;
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error reading questions directory:', error);
    process.exit(1);
  }
}
