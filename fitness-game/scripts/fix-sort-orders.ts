import fs from 'fs';
import path from 'path';

interface Question {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
  knowledge_base_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  hints: string[];
  image_urls: string[];
}

function fixSortOrders(filePath: string): void {
  console.log(`\nProcessing file: ${path.basename(filePath)}`);
  
  try {
    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions: Question[] = JSON.parse(fileContent);
    
    // Group questions by knowledge_base_id
    const groupedQuestions = new Map<string, Question[]>();
    
    for (const question of questions) {
      const kbId = question.knowledge_base_id;
      if (!groupedQuestions.has(kbId)) {
        groupedQuestions.set(kbId, []);
      }
      groupedQuestions.get(kbId)!.push(question);
    }
    
    let totalFixed = 0;
    let totalChecked = 0;
    
    // Process each knowledge_base_id group
    for (const [kbId, kbQuestions] of groupedQuestions) {
      console.log(`  Knowledge base ID: ${kbId} (${kbQuestions.length} questions)`);
      
      // Sort questions by their current sort_order to maintain relative order
      kbQuestions.sort((a, b) => a.sort_order - b.sort_order);
      
      let needsUpdate = false;
      
      // Check and fix sort_order values
      for (let i = 0; i < kbQuestions.length; i++) {
        const question = kbQuestions[i];
        const expectedSortOrder = i + 1; // 1-based indexing
        totalChecked++;
        
        if (question.sort_order !== expectedSortOrder) {
          console.log(`    Question ${question.id}: sort_order ${question.sort_order} → ${expectedSortOrder}`);
          question.sort_order = expectedSortOrder;
          needsUpdate = true;
          totalFixed++;
        }
      }
      
      if (needsUpdate) {
        console.log(`    ✓ Updated ${kbQuestions.length} questions for knowledge_base_id: ${kbId}`);
      } else {
        console.log(`    ✓ All sort_orders are correct for knowledge_base_id: ${kbId}`);
      }
    }
    
    // Write back to file if any changes were made
    if (totalFixed > 0) {
      
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
      console.log(`  ✓ File updated: ${totalFixed} sort_order values fixed`);
    } else {
      console.log(`  ✓ No changes needed`);
    }
    
    console.log(`  Summary: ${totalChecked} questions checked, ${totalFixed} fixed`);
    
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error);
  }
}

function main(): void {
  const questionsDir = path.join(__dirname, '..', 'src', 'data', 'content', 'questions');
  
  if (!fs.existsSync(questionsDir)) {
    console.error(`Directory not found: ${questionsDir}`);
    process.exit(1);
  }
  
  console.log('🔍 Validating and fixing sort_order values in question files...');
  console.log(`📁 Processing directory: ${questionsDir}`);
  
  // Get all JSON files in the questions directory
  const files = fs.readdirSync(questionsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(questionsDir, file));
  
  if (files.length === 0) {
    console.log('No JSON files found in the questions directory.');
    return;
  }
  
  console.log(`Found ${files.length} JSON files to process:`);
  files.forEach(file => console.log(`  - ${path.basename(file)}`));
  
  let totalFilesProcessed = 0;
  let totalFilesUpdated = 0;
  
  // Process each file
  for (const file of files) {
    const originalContent = fs.readFileSync(file, 'utf-8');
    fixSortOrders(file);
    const updatedContent = fs.readFileSync(file, 'utf-8');
    
    totalFilesProcessed++;
    if (originalContent !== updatedContent) {
      totalFilesUpdated++;
    }
  }
  
  console.log('\n🎉 Processing complete!');
  console.log(`📊 Summary: ${totalFilesProcessed} files processed, ${totalFilesUpdated} files updated`);
}

// Run the script
main(); 