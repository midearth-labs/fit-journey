import type { LearningPath, PersonaAnswerOption, PersonaQuestion, PersonaAssessmentResult } from '../../types/fitness-persona-calculator';
import { FitnessPersonaCalculator } from '../../services/fitness-persona-calculator';

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Loads questions and learning paths from the static content directory using fs
 * for local testing purposes
 */
export function loadPersonaCalculatorData(): {
  questions: PersonaQuestion[];
  learningPaths: LearningPath[];
} {
  try {
    // Load questions
    const questionsPath = join(process.cwd(), 'static/content/persona-questions/questions.json');
    const questionsData = readFileSync(questionsPath, 'utf-8');
    const questions: PersonaQuestion[] = JSON.parse(questionsData);

    // Load learning paths
    const pathsPath = join(process.cwd(), 'static/content/learning-paths/learning.json');
    const pathsData = readFileSync(pathsPath, 'utf-8');
    const learningPaths: LearningPath[] = JSON.parse(pathsData);

    return {
      questions,
      learningPaths
    };
  } catch (error) {
    console.error('Error loading persona calculator data:', error);
    throw new Error(`Failed to load persona calculator data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Usage Example - Test function for persona calculator
 */
export async function runAssessmentExample(): Promise<PersonaAssessmentResult> {
  try {
    // Load data using the new function
    const { questions, learningPaths } = loadPersonaCalculatorData();

    // Simulate user answers
    const userAnswers = new Map<string, PersonaAnswerOption>([
      ['q1', questions[0].answers[1]], // Complete beginner
      ['q2', questions[1].answers[1]], // Started and stopped
      ['q3', questions[2].answers[1]], // 10-15 minutes (time poor)
      ['q4', questions[3].answers[1]], // Social motivation
      ['q5', questions[4].answers[0]], // Weight loss
      ['q6', questions[5].answers[0]], // Gym anxiety
      ['q7', questions[6].answers[2]], // Needs community
      ['q8', questions[7].answers[0]], // Busy parent
      ['q9', questions[8].answers[2]], // Tired
      ['q10', questions[9].answers[2]], // Quick workouts
    ]);
  
    const scorer = new FitnessPersonaCalculator(learningPaths);
    const result = scorer.scoreAssessment(userAnswers);
  
    console.log('Your Profile:', result.primaryPersona);
    console.log('\nRecommended Learning Path:', result.recommendedPath.name);
    console.log('Match Score:', result.rankedPaths[0].matchPercentage + '%');
    
    console.log('\nTop 3 Alternative Paths:');
    result.rankedPaths.slice(1, 4).forEach((path, index) => {
      console.log(`${index + 2}. ${path.path.name} (${path.matchPercentage}% match)`);
    });
  
    return result;
  } catch (error) {
    console.error('Error running assessment example:', error);
    throw error;
  }
}

/**
 * Test function to validate persona calculator functionality
 */
export async function testPersonaCalculator(): Promise<void> {
  console.log('🧪 Testing Persona Calculator...\n');
  
  try {
    const result = await runAssessmentExample();
    
    console.log('\n✅ Persona Calculator Test Results:');
    console.log(`- Primary Persona: ${result.primaryPersona}`);
    console.log(`- Recommended Path: ${result.recommendedPath.name}`);
    console.log(`- Total Paths Evaluated: ${result.rankedPaths.length}`);
    console.log(`- Top Match Score: ${result.rankedPaths[0].matchPercentage}%`);
    
    // Validate that we have reasonable results
    if (result.rankedPaths.length === 0) {
      throw new Error('No learning paths were evaluated');
    }
    
    if (result.rankedPaths[0].matchPercentage < 0 || result.rankedPaths[0].matchPercentage > 100) {
      throw new Error('Invalid match percentage calculated');
    }
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Persona Calculator Test Failed:', error);
    throw error;
  }
}

// Allow running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPersonaCalculator().catch(console.error);
}
