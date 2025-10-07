import { getDBInstance } from '$lib/server/db';
import { ServiceFactory, type IServiceFactory } from '$lib/server/shared/service-factory';
import { type AuthRequestContext } from '$lib/server/shared/interfaces';
import { type FiveStarValuesPayload, type MeasurementValuesPayload, ALL_LOG_KEYS } from '$lib/config/constants';
import { type ArticleLogStatusKeys } from '$lib/server/db/schema';
import { assert } from 'console';

/**
 * Database Seeding Script for User Data
 * 
 * This script creates comprehensive test data for a specific user including:
 * - User profile and metadata updates
 * - Article reading progress in various states
 * - Daily logs across the last month with realistic values
 * - Personal challenges with proper subscriptions
 * 
 * All operations are performed within a single transaction to ensure data integrity.
 */

// Target user ID for seeding
const TARGET_USER_ID = '25bab121-f6d2-4ce5-b0d1-2159e71ca63f';

// Valid learning path IDs from the content structure
const VALID_LEARNING_PATHS = ['path1', 'path2', 'path3', 'path5'];

// Sample article IDs from the learning paths (ensuring they exist)
const SAMPLE_ARTICLE_IDS = [
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', // What Is Fitness Really? Debunking the Instagram Myths
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Before You Start: The Safety Checklist Nobody Talks About
  '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // Fitness Can Meet You Where You Are (Yes, Even on Your Couch)
  '6ba7b812-9dad-11d1-80b4-00c04fd430c8', // Why the Tortoise Always Wins: The Science of Starting Slow
  '6ba7b814-9dad-11d1-80b4-00c04fd430c8', // When to DIY vs When to Get Help: Your Fitness Support Guide
  'd47ac10b-58cc-4372-a567-0e02b2c3d479', // Gym Anxiety is Real: Your Confidence-Building Toolkit
  'd47ac10b-58cc-4372-a567-0e02b2c3d481', // Motivation vs Discipline: Why Waiting to 'Feel Like It' Doesn't Work
  'd47ac10b-58cc-4372-a567-0e02b2c3d483', // Finding Your Fitness Tribe: Why Going Solo Is Harder
  '9ba7b810-9dad-11d1-80b4-00c04fd430c8', // Fundamental Movement Patterns: Some Core Building Blocks
  '9ba7b811-9dad-11d1-80b4-00c04fd430c8', // What is your core, and how do you engage it?
];

// Article status distribution (ensuring at least 4 are completed)
const ARTICLE_STATUSES: Array<{ status: typeof ArticleLogStatusKeys[number]; count: number }> = [
  { status: 'completed', count: 4 },
  { status: 'practical_in_progress', count: 2 },
  { status: 'knowledge_check_complete', count: 2 },
  { status: 'knowledge_check_in_progress', count: 1 },
  { status: 'reading_in_progress', count: 1 }
];

// Challenge log types combinations (ensuring uniqueness within each challenge)
const CHALLENGE_LOG_TYPES_COMBINATIONS: Array<Array<'dailyMovement' | 'cleanEating' | 'sleepQuality' | 'hydration' | 'weight' | 'stepsWalked' | 'cardioMinutes' | 'pushups' | 'moodCheck' | 'energyLevel'>> = [
  ['dailyMovement', 'cleanEating'],
  ['sleepQuality', 'hydration'],
  ['weight', 'stepsWalked'],
  ['cardioMinutes', 'pushups'],
  ['dailyMovement', 'sleepQuality', 'weight'],
  ['cleanEating', 'hydration', 'stepsWalked']
];

/**
 * Generate realistic five-star values based on day of week and progression
 */
function generateFiveStarValues(dayOffset: number): FiveStarValuesPayload {
  const baseDay = new Date();
  baseDay.setDate(baseDay.getDate() - dayOffset);
  const dayOfWeek = baseDay.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekend patterns (lower activity, higher relaxation)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  return {
    dailyMovement: (isWeekend ? Math.floor(Math.random() * 2) + 3 : Math.floor(Math.random() * 3) + 3) as 3 | 4 | 5,
    cleanEating: (Math.floor(Math.random() * 4) + 2) as 2 | 3 | 4 | 5,
    sleepQuality: (isWeekend ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 2) as 2 | 3 | 4 | 5,
    hydration: (Math.floor(Math.random() * 4) + 2) as 2 | 3 | 4 | 5,
    moodCheck: (Math.floor(Math.random() * 4) + 2) as 2 | 3 | 4 | 5,
    energyLevel: (isWeekend ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 4) + 2) as 2 | 3 | 4 | 5
  };
}

/**
 * Generate quiz answers for an article based on actual questions
 */
function getQuestionAnswers(articleId: string, correctnessPercentage: number, serviceFactory: IServiceFactory): Array<{
  questionId: string;
  answerIndex: number;
  hintUsed: boolean;
}> {
  const contentDAOFactory = serviceFactory.contentDAOFactory;
  const questionDAO = contentDAOFactory.getDAO('Question');
  
  // Get all questions and filter by article ID
  const allQuestions = questionDAO.getAll();
  const articleQuestions = allQuestions.filter((q) => q.knowledge_base_id === articleId);
  
  return articleQuestions.map((question) => {
    let answerIndex: number;
    
    // Use correctness percentage to determine if this answer should be correct
    if (Math.random() < correctnessPercentage) {
      // Use the correct answer
      answerIndex = question.correct_answer_index;
    } else {
      // Pick a random incorrect answer index
      const incorrectIndices = question.options
        .map((_: string, index: number) => index)
        .filter((index: number) => index !== question.correct_answer_index);
      
      if (incorrectIndices.length > 0) {
        answerIndex = incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
      } else {
        answerIndex = question.correct_answer_index; // Fallback to correct if no incorrect options
      }
    }
    
    // Randomize hint usage (20% chance)
    const hintUsed = Math.random() < 0.2;
    
    return {
      questionId: question.id,
      answerIndex,
      hintUsed
    };
  });
}

/**
 * Generate realistic measurement values with gradual changes
 */
function generateMeasurementValues(dayOffset: number, previousValues?: MeasurementValuesPayload): MeasurementValuesPayload {
  const baseWeight = 70; // Starting weight in kg
  const weightVariation = 0.5; // Max daily weight variation in kg
  
  // Generate weight with realistic variation
  let weight: number;
  if (previousValues?.weight) {
    const variation = (Math.random() - 0.5) * 2 * weightVariation; // -0.5 to +0.5 kg variation
    weight = Math.max(50, Math.min(120, previousValues.weight + variation)); // Clamp between 50-120 kg
  } else {
    weight = baseWeight + (Math.random() - 0.5) * 10; // 65-75 kg range
  }
  
  // Generate steps with realistic patterns
  const baseSteps = 8000;
  const stepsVariation = 3000;
  const steps = Math.max(0, Math.min(50000, baseSteps + (Math.random() - 0.5) * stepsVariation));
  
  // Generate cardio minutes (0-120 minutes)
  const cardioMinutes = Math.floor(Math.random() * 121);
  
  // Generate pushups (0-100)
  const pushups = Math.floor(Math.random() * 101);
  
  return {
    weight: Math.round(weight * 10) / 10, // Round to 1 decimal place
    stepsWalked: steps,
    cardioMinutes,
    pushups
  };
}

/**
 * Generate a date string for a given number of days ago
 */
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Generate a timestamp for a given number of days ago
 */
function getTimestamp(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Create AuthRequestContext for a specific date
 */
function createAuthContext(userId: string, requestDate: Date): AuthRequestContext {
  return {
    requestDate,
    requestId: crypto.randomUUID(),
    user: {
      id: userId,
      email: 'test@example.com',
      created_at: new Date().toISOString()
    }
  };
}

/**
 * Main seeding function
 */
async function seedUserData(): Promise<void> {
  console.log('🌱 Starting database seeding for user:', TARGET_USER_ID);
  
  // Initialize counters for validation
  let articlesCount = 0;
  let completedArticlesCount = 0;
  let completedWithPerfectScoreArticlesCount = 0;
  let perfectScoreArticlesCount = 0;
  let logsCount = 0;
  let challengesCount = 0;
  
  // Get database instance and create transaction
  const db = getDBInstance();
  
  await db.transaction(async (tx) => {
    console.log('📦 Initializing services with transactional database...');
    
    // Initialize service factory with transactional database
    const serviceFactory = await ServiceFactory.getInstanceWithDB(tx);
    
    // Create base auth context (we'll modify requestDate as needed)
    const baseRequestDate = new Date();
    const baseAuthContext = createAuthContext(TARGET_USER_ID, baseRequestDate);
    
    // Get service instances
    const authServices = serviceFactory.getAuthServices(baseAuthContext);
    const userProfileService = authServices.userProfileService();
    
    console.log('✅ Services initialized successfully');
    
    // Step 1: Update user profile and metadata
    console.log('👤 Updating user profile and metadata...');
    
    const profileUpdateData = {
      displayName: 'Oladipo',
      avatarGender: 'male' as const,
      avatarAgeRange: 'young-adult' as const,
      personalizationCountryCodes: ['US', 'CA'],
      learningPaths: VALID_LEARNING_PATHS.slice(0, 2), // Use first 2 learning paths
      timezone: 'UTC-7',
      preferredReminderTime: '19:00',
      notificationPreferences: {
        daily: true,
        social: true,
        fitness_level: true
      }
    };
    
    await userProfileService.updateUserProfile(profileUpdateData);
    
    console.log('✅ User profile and metadata updated');
    
    // Step 2: Create article reading progress
    console.log('📚 Creating article reading progress...');
    
    let articleIndex = 0;
    for (const statusConfig of ARTICLE_STATUSES) {
      for (let i = 0; i < statusConfig.count; i++) {
        const articleId = SAMPLE_ARTICLE_IDS[articleIndex];
        const readDate = getTimestamp(Math.floor(Math.random() * 30) + 1); // Random date in last 30 days
        
        // Create auth context for this specific date
        const articleAuthContext = createAuthContext(TARGET_USER_ID, readDate);
        const articleAuthServices = serviceFactory.getAuthServices(articleAuthContext);
        const articleServiceForDate = articleAuthServices.articleService();
        
        // Log read
        await articleServiceForDate.logRead({ articleId });
        articlesCount++;
        
        // Progress through states based on target status
        if (statusConfig.status === 'knowledge_check_in_progress') {
          await articleServiceForDate.startQuiz({ articleId });
        } else if (statusConfig.status === 'knowledge_check_complete') {
          assert(statusConfig.count === 2, "Expected 2 knowledge check complete articles");
          await articleServiceForDate.startQuiz({ articleId });
          // Simulate quiz completion with some correct answers
          await articleServiceForDate.submitQuiz({
            articleId,
            quizAnswers: getQuestionAnswers(articleId, i < 1 ? 1.0 : 0.85, serviceFactory)
          });
          if (i < 1) {
            perfectScoreArticlesCount++;
          }
        } else if (statusConfig.status === 'practical_in_progress') {
          await articleServiceForDate.startQuiz({ articleId });
          await articleServiceForDate.submitQuiz({
            articleId,
            quizAnswers: getQuestionAnswers(articleId, 0.90, serviceFactory)
          });
          await articleServiceForDate.startPractical({ articleId });
        } else if (statusConfig.status === 'completed') {
          assert(statusConfig.count === 4, "Expected 4 completed articles");
          await articleServiceForDate.startQuiz({ articleId });
          await articleServiceForDate.submitQuiz({
            articleId,
            quizAnswers: getQuestionAnswers(articleId, i < 2 ? 1.0 : 0.85, serviceFactory)
          });
          await articleServiceForDate.startPractical({ articleId });
          await articleServiceForDate.completePractical({ articleId });
          await articleServiceForDate.completeArticle({ articleId });
          completedArticlesCount++;
          if (i < 2) {
            perfectScoreArticlesCount++;
            completedWithPerfectScoreArticlesCount++;
          }
        }
        
        articleIndex++;
      }
    }
    
    console.log('✅ Article reading progress created');
    
    // Step 3: Create daily logs for the last month
    console.log('📊 Creating daily logs for the last month...');
    
    let previousMeasurementValues: MeasurementValuesPayload | undefined;
    
    // Create logs for the last 30 days, skipping some days randomly
    for (let dayOffset = 1; dayOffset <= 30; dayOffset++) {
      // Skip approximately 20% of days randomly
      if (Math.random() < 0.2) {
        continue;
      }
      
      const logDate = getDateString(dayOffset);
      const logTimestamp = getTimestamp(dayOffset);
      
      // Create auth context for this specific date
      const logAuthContext = createAuthContext(TARGET_USER_ID, logTimestamp);
      const logAuthServices = serviceFactory.getAuthServices(logAuthContext);
      const logServiceForDate = logAuthServices.logService();
      
      const fiveStarValues = generateFiveStarValues(dayOffset);
      const measurementValues = generateMeasurementValues(dayOffset, previousMeasurementValues);
      
      await logServiceForDate.putUserLog({
        logDate,
        values: {
          fiveStar: fiveStarValues,
          measurement: measurementValues
        }
      });
      
      logsCount++;
      previousMeasurementValues = measurementValues;
    }
    
    console.log('✅ Daily logs created');
    
    // Step 4: Create personal challenges
    console.log('🏆 Creating personal challenges...');
    
    const challengeIds: string[] = [];
    
    for (let i = 0; i < 6; i++) {
      const startDateOffset = Math.floor(Math.random() * 25) + 1; // Start between 1-25 days ago
      const durationDays = Math.floor(Math.random() * 5) + 3; // Duration between 3-7 days
      const startDate = getDateString(startDateOffset);
      
      const challengeData = {
        name: `Personal Challenge ${i + 1}`,
        description: `A personal fitness challenge focusing on ${CHALLENGE_LOG_TYPES_COMBINATIONS[i].join(' and ')}`,
        logTypes: CHALLENGE_LOG_TYPES_COMBINATIONS[i],
        joinType: 'personal' as const,
        startDate,
        durationDays,
        maxMembers: 1
      };
      
      const createChallengeRequestTimestamp = getTimestamp(startDateOffset + 2); // Request date is 2 days before startDate
      const challengeAuthContext = createAuthContext(TARGET_USER_ID, createChallengeRequestTimestamp);
      const challengeAuthServices = serviceFactory.getAuthServices(challengeAuthContext);
      const challengeServiceForDate = challengeAuthServices.challengesService();
      
      const challengeResponse = await challengeServiceForDate.createUserChallenge(challengeData);
      challengeIds.push(challengeResponse.id);
      challengesCount++;
      
      // Join the challenge (joinedAt should be 1 day before startDate)
      const joinRequestDate = getTimestamp(startDateOffset + 1); // 1 day before start
      const joinAuthContext = createAuthContext(TARGET_USER_ID, joinRequestDate);
      const joinAuthServices = serviceFactory.getAuthServices(joinAuthContext);
      const joinChallengeService = joinAuthServices.challengesService();
      
      // This should be a NO-OP and must not fail.
      await joinChallengeService.joinChallenge({
        challengeId: challengeResponse.id
      });
    }
    
    console.log('✅ Personal challenges created');
    
    console.log('🎉 Database seeding completed successfully!');

    await validateSeededData(serviceFactory, {
      articlesCount,
      logsCount,
      challengesCount,
      completedArticlesCount,
      completedWithPerfectScoreArticlesCount,
      perfectScoreArticlesCount
    });
  });
}

/**
 * Validation function to verify seeded data
 */
async function validateSeededData(
  serviceFactory: IServiceFactory, 
  expectedCounts: {
    articlesCount: number;
    logsCount: number;
    challengesCount: number;
    completedArticlesCount: number;
    completedWithPerfectScoreArticlesCount: number;
    perfectScoreArticlesCount: number;
  }
): Promise<void> {
  console.log('🔍 Validating seeded data...');
  console.log(JSON.stringify(expectedCounts, null, 2));
  
  const baseRequestDate = new Date();
  const baseAuthContext = createAuthContext(TARGET_USER_ID, baseRequestDate);
  
  const authServices = serviceFactory.getAuthServices(baseAuthContext);
  const unAuthServices = serviceFactory.getUnAuthServices(baseAuthContext);
  
  const userProfileService = authServices.userProfileService();
  const userMetadataService = authServices.userMetadataService();
  const articleService = authServices.articleService();
  const logService = authServices.logService();
  const challengesService = authServices.challengesService();
  const statisticsService = unAuthServices.statisticsService();
  
  // Validate user profile
  console.log('👤 Validating user profile...');
  const profile = await userProfileService.getUserProfile();
  console.log('✅ Profile:', profile.displayName, profile.avatarGender);
  
  // Assert profile values
  if (profile.displayName !== 'Oladipo') {
    throw new Error(`Expected displayName 'Oladipo', got '${profile.displayName}'`);
  }
  if (profile.avatarGender !== 'male') {
    throw new Error(`Expected avatarGender 'male', got '${profile.avatarGender}'`);
  }
  if (profile.avatarAgeRange !== 'young-adult') {
    throw new Error(`Expected avatarAgeRange 'young-adult', got '${profile.avatarAgeRange}'`);
  }
  if (!profile.learningPaths || profile.learningPaths.length !== 2) {
    throw new Error(`Expected 2 learning paths, got ${profile.learningPaths?.length || 0}`);
  }
  if (!profile.learningPaths.includes('path1') || !profile.learningPaths.includes('path2')) {
    throw new Error(`Expected learning paths to include 'path1' and 'path2', got ${profile.learningPaths}`);
  }
  console.log('✅ Profile assertions passed');
  
  // Validate user metadata
  console.log('📊 Validating user metadata...');
  const metadata = await userMetadataService.getUserMetadata();
  console.log('✅ Articles read:', metadata.articlesRead);
  console.log('✅ Articles completed:', metadata.articlesCompleted);
  
  // Assert metadata values based on seeded data
  if (metadata.articlesRead !== expectedCounts.articlesCount) {
    throw new Error(`Expected ${expectedCounts.articlesCount} articles read, got ${metadata.articlesRead}`);
  }
  if (metadata.articlesCompleted !== expectedCounts.completedArticlesCount) {
    throw new Error(`Expected ${expectedCounts.completedArticlesCount} articles completed, got ${metadata.articlesCompleted}`);
  }
  if (metadata.articlesCompletedWithPerfectScore !== expectedCounts.completedWithPerfectScoreArticlesCount) {
    throw new Error(`Expected ${expectedCounts.completedWithPerfectScoreArticlesCount} articles completed with perfect score, got ${metadata.articlesCompletedWithPerfectScore}`);
  }
  console.log('✅ Metadata assertions passed');
  
  // Validate articles
  console.log('📚 Validating articles...');
  const articles = await articleService.listUserArticles({ page: 0, limit: 50 });
  console.log('✅ Total articles:', articles.length);
  
  const completedArticles = articles.filter(a => a.status === 'completed');
  const practicalInProgressArticles = articles.filter(a => a.status === 'practical_in_progress');
  const knowledgeCheckCompleteArticles = articles.filter(a => a.status === 'knowledge_check_complete');
  const knowledgeCheckInProgressArticles = articles.filter(a => a.status === 'knowledge_check_in_progress');
  const readingInProgressArticles = articles.filter(a => a.status === 'reading_in_progress');
  const articlesWithPerfectScore = articles.filter(a => a.quizAllCorrectAnswers);
  
  console.log('✅ Completed articles:', completedArticles.length);
  console.log('✅ Practical in progress:', practicalInProgressArticles.length);
  console.log('✅ Knowledge check complete:', knowledgeCheckCompleteArticles.length);
  console.log('✅ Knowledge check in progress:', knowledgeCheckInProgressArticles.length);
  console.log('✅ Reading in progress:', readingInProgressArticles.length);
  console.log('✅ Articles with perfect score:', articlesWithPerfectScore.length);
  const toIds = (thisArticles: typeof articles) => thisArticles.map(a => a.articleId);
  
  // Assert article distribution matches expected seeding pattern
  if (articles.length !== expectedCounts.articlesCount) {
    throw new Error(`Expected exactly ${expectedCounts.articlesCount} articles, got ${articles.length}: ${toIds(articles)}`);
  }
  if (completedArticles.length !== expectedCounts.completedArticlesCount) {
    throw new Error(`Expected exactly ${expectedCounts.completedArticlesCount} completed articles, got ${completedArticles.length}: ${toIds(completedArticles)}`);
  }
  if (practicalInProgressArticles.length !== 2) {
    throw new Error(`Expected exactly 2 practical in progress articles, got ${practicalInProgressArticles.length}: ${toIds(practicalInProgressArticles)}`);
  }
  if (knowledgeCheckCompleteArticles.length !== 2) {
    throw new Error(`Expected exactly 2 knowledge check complete articles, got ${knowledgeCheckCompleteArticles.length}: ${toIds(knowledgeCheckCompleteArticles)}`);
  }
  if (knowledgeCheckInProgressArticles.length !== 1) {
    throw new Error(`Expected exactly 1 knowledge check in progress article, got ${knowledgeCheckInProgressArticles.length}: ${toIds(knowledgeCheckInProgressArticles)}`);
  }
  if (readingInProgressArticles.length !== 1) {
    throw new Error(`Expected exactly 1 reading in progress article, got ${readingInProgressArticles.length}: ${toIds(readingInProgressArticles)}`);
  }
  if (articlesWithPerfectScore.length !== expectedCounts.perfectScoreArticlesCount) {
    throw new Error(`Expected exactly ${expectedCounts.perfectScoreArticlesCount} articles with perfect score, got ${articlesWithPerfectScore.length}`);
  }
  // Assert article progression logic by getting detailed article data
  for (const article of articles) {
    const detailedArticle = await articleService.getUserArticle({ articleId: article.articleId });
    
    if (article.status === 'completed') {
      if (!detailedArticle.quizSubmittedAt) {
        throw new Error(`Completed article ${article.articleId} should have quizCompletedAt`);
      }
      if (detailedArticle.quizAllCorrectAnswers == null) {
        throw new Error(`Completed article ${article.articleId} should have quizAllCorrectAnswers defined`);
      }
    }
    if (article.status === 'practical_in_progress') {
      if (!detailedArticle.quizSubmittedAt) {
        throw new Error(`Practical in progress article ${article.articleId} should have quizCompletedAt`);
      }
    }
    if (article.status === 'knowledge_check_complete') {
      if (!detailedArticle.quizSubmittedAt) {
        throw new Error(`Knowledge check complete article ${article.articleId} should have quizCompletedAt`);
      }
    }
    
    // Assert quiz attempts are reasonable
    const expectedQuizAttempts = ['reading_in_progress', 'knowledge_check_in_progress'].includes(article.status) ? 0 : 1;
    if (detailedArticle.quizAttempts != expectedQuizAttempts) {
      throw new Error(`Article ${article.articleId} should have ${expectedQuizAttempts} quiz attempts but has ${detailedArticle.quizAttempts}`);
    }
    
    // Assert timestamps are logical
    if (detailedArticle.firstReadDate != detailedArticle.lastReadDate) {
        throw new Error(`Article ${article.articleId} firstReadDate should be same as lastReadDate but has ${detailedArticle.firstReadDate} and ${detailedArticle.lastReadDate}`);
    }
  }
  console.log('✅ Article assertions passed');
  
  // Validate logs
  console.log('📊 Validating logs...');
  const logs = await logService.listUserLogs({ page: 1, limit: 50 });
  console.log('✅ Total logs:', logs.length);
  
  // Assert log values match expected count
  if (logs.length !== expectedCounts.logsCount) {
    throw new Error(`Expected exactly ${expectedCounts.logsCount} logs, got ${logs.length}`);
  }
  
  // Assert log value ranges and consistency
  const logDates: string[] = [];
  for (const log of logs) {
    console.log("Validating log:", log.logDate);
    // Validate five-star values (1-5 range)
    const fiveStarValues = log.values.fiveStar;
    for (const [key, value] of Object.entries(fiveStarValues)) {
      if (value !== undefined && (value < 1 || value > 5)) {
        throw new Error(`Five-star value ${key} should be between 1-5, got ${value}`);
      }
    }
    
    // Validate measurement values
    const measurementValues = log.values.measurement;
    if (measurementValues.weight && (measurementValues.weight < 50 || measurementValues.weight > 120)) {
      throw new Error(`Weight should be between 50-120kg, got ${measurementValues.weight}`);
    }
    if (measurementValues.stepsWalked && (measurementValues.stepsWalked < 0 || measurementValues.stepsWalked > 50000)) {
      throw new Error(`Steps should be between 0-50000, got ${measurementValues.stepsWalked}`);
    }
    if (measurementValues.cardioMinutes && (measurementValues.cardioMinutes < 0 || measurementValues.cardioMinutes > 120)) {
      throw new Error(`Cardio minutes should be between 0-120, got ${measurementValues.cardioMinutes}`);
    }
    if (measurementValues.pushups && (measurementValues.pushups < 0 || measurementValues.pushups > 100)) {
      throw new Error(`Pushups should be between 0-100, got ${measurementValues.pushups}`);
    }
    
    // Collect log dates for consistency check
    logDates.push(log.logDate);
    
    // Assert log date is not in the future
    const logDateObj = new Date(log.logDate);
    const today = new Date();
    if (logDateObj > today) {
      throw new Error(`Log date ${log.logDate} should not be in the future`);
    }
    
    // Assert log date is within last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - (30 + 1)); // +1 for timezone difference buffer
    if (logDateObj < thirtyDaysAgo) {
      throw new Error(`Log date ${log.logDate} should be within last 30 days`);
    }
  }
  
  // Assert no duplicate log dates
  const uniqueLogDates = new Set(logDates);
  if (uniqueLogDates.size !== logDates.length) {
    throw new Error(`Found duplicate log dates: ${logDates.length} total, ${uniqueLogDates.size} unique`);
  }
  
  console.log('✅ Log assertions passed');
  
  // Validate challenges
  console.log('🏆 Validating challenges...');
  const ownedChallenges = await challengesService.listChallengesOwnedByUser({ page: 1, limit: 50 });
  const joinedChallenges = await challengesService.listChallengesJoinedByUser({ page: 1, limit: 50 });
  console.log('✅ Owned challenges:', ownedChallenges.length);
  console.log('✅ Joined challenges:', joinedChallenges.length);
  
  // Assert challenge counts
  if (ownedChallenges.length !== expectedCounts.challengesCount) {
    throw new Error(`Expected exactly ${expectedCounts.challengesCount} owned challenges, got ${ownedChallenges.length}`);
  }
  if (joinedChallenges.length !== expectedCounts.challengesCount) {
    throw new Error(`Expected exactly ${expectedCounts.challengesCount} joined challenges, got ${joinedChallenges.length}`);
  }
  
  // Assert challenge properties
  for (const challenge of ownedChallenges) {
    if (challenge.joinType !== 'personal') {
      throw new Error(`Expected all challenges to be personal type, got ${challenge.joinType}`);
    }
    if (challenge.maxMembers !== 1) {
      throw new Error(`Expected maxMembers to be 1, got ${challenge.maxMembers}`);
    }
    if (challenge.membersCount !== 1) {
      throw new Error(`Expected membersCount to be 1, got ${challenge.membersCount}`);
    }
    if (!['active', 'completed', 'locked'].includes(challenge.status)) {
      throw new Error(`Expected all challenges to be either active, completed, or locked, got ${challenge.status}`);
    }
    if (challenge.durationDays < 3 || challenge.durationDays > 7) {
      throw new Error(`Expected durationDays between 3-7, got ${challenge.durationDays}`);
    }
    if (!challenge.logTypes || challenge.logTypes.length === 0) {
      throw new Error(`Expected logTypes to be defined and non-empty`);
    }
    
    // Assert challenge date logic
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const today = new Date();
    
    if (startDate >= endDate) {
      throw new Error(`Challenge ${challenge.id} startDate should be before endDate`);
    }
    
    const calculatedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (calculatedDuration !== challenge.durationDays) {
      throw new Error(`Challenge ${challenge.id} durationDays (${challenge.durationDays}) doesn't match calculated duration (${calculatedDuration})`);
    }
    
    // Assert challenge is within last month
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - (30 + 1)); // +1 for timezone difference buffer
    if (startDate < thirtyDaysAgo) {
      throw new Error(`Challenge ${challenge.id} startDate should be within last 30 days`);
    }
    
    // Assert logTypes are valid
    const validLogTypes = ['dailyMovement', 'cleanEating', 'sleepQuality', 'hydration', 'weight', 'stepsWalked', 'cardioMinutes', 'pushups', 'moodCheck', 'energyLevel'];
    for (const logType of challenge.logTypes) {
      if (!validLogTypes.includes(logType)) {
        throw new Error(`Challenge ${challenge.id} has invalid logType: ${logType}`);
      }
    }
  }
  
  // Assert challenge subscriptions
  for (const challenge of joinedChallenges) {
    const subscription = await challengesService.getChallengeJoinedByUserSubscription({ challengeId: challenge.id });
    if (!subscription) {
      throw new Error(`Expected subscription for challenge ${challenge.id}`);
    }
  }
  console.log('✅ Challenge assertions passed');
  
  // Validate statistics
  console.log('📈 Validating global statistics...');
  const globalStats = await statisticsService.getGlobal();
  console.log('✅ Global stats:', {
    userCount: globalStats.userCount,
    articleReadCount: globalStats.articleReadCount,
    articleCompletedCount: globalStats.articleCompletedCount,
    articleCompletedWithPerfectScore: globalStats.articleCompletedWithPerfectScore,
    challengesStarted: globalStats.challengesStarted,
    challengesJoined: globalStats.challengesJoined,
    daysLogged: globalStats.daysLogged,
    invitationJoinCount: globalStats.invitationJoinCount,
    questionsAsked: globalStats.questionsAsked,
    questionsAnswered: globalStats.questionsAnswered,
    progressShares: globalStats.progressShares
  });
  
  // Assert global statistics aggregation
  if (globalStats.userCount !== 1) {
    throw new Error(`Expected 1 user in global stats, got ${globalStats.userCount}`);
  }
  if (globalStats.articleReadCount !== expectedCounts.articlesCount) {
    throw new Error(`Global articleReadCount (${globalStats.articleReadCount}) should be == user articlesRead (${expectedCounts.articlesCount})`);
  }
  if (globalStats.articleCompletedCount !== expectedCounts.completedArticlesCount) {
    throw new Error(`Global articleCompletedCount (${globalStats.articleCompletedCount}) should be == user articlesCompleted (${expectedCounts.completedArticlesCount})`);
  }
  
  // Assert perfect score statistics
  if (globalStats.articleCompletedWithPerfectScore !== expectedCounts.completedWithPerfectScoreArticlesCount) {
    throw new Error(`Global articleCompletedWithPerfectScore (${globalStats.articleCompletedWithPerfectScore}) should be == user articlesCompletedWithPerfectScore (${expectedCounts.completedWithPerfectScoreArticlesCount})`);
  }
  
  // Assert challenge statistics
  if (globalStats.challengesStarted !== expectedCounts.challengesCount) {
    throw new Error(`Global challengesStarted (${globalStats.challengesStarted}) should be == owned challenges (${expectedCounts.challengesCount})`);
  }
  if (globalStats.challengesJoined !== expectedCounts.challengesCount) {
    throw new Error(`Global challengesJoined (${globalStats.challengesJoined}) should be == joined challenges (${expectedCounts.challengesCount})`);
  }
  
  // Assert log statistics
  if (globalStats.daysLogged !== expectedCounts.logsCount) {
    throw new Error(`Global daysLogged (${globalStats.daysLogged}) should be == user logs (${expectedCounts.logsCount})`);
  }
  
  console.log('✅ Statistics assertions passed');
  
  console.log('✅ All data validation assertions passed successfully!');
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    await seedUserData();
    console.log('🎉 Seeding script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding script failed:', error);
    process.exit(1);
  }
}

// Execute the script
if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
