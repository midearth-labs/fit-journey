<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { contentService } from '$lib/services/content.service';
  import { FitnessPersonaCalculator } from '$lib/services/fitness-persona-calculator';
  import { personaAssessmentStore } from '$lib/stores/persona-assessment';
  import type { PersonaQuestion, LearningPath, PersonaAnswerOption, PersonaAssessmentResult } from '$lib/types/fitness-persona-calculator';

  interface Props {
    onComplete?: (result: PersonaAssessmentResult) => void;
  }
  
  const { onComplete = () => {} }: Props = $props();

  let questions: PersonaQuestion[] = $state([]);
  let learningPaths: LearningPath[] = $state([]);
  let currentQuestion: PersonaQuestion | null = $state(null);
  let isLoading = $state(true);
  let error: string | null = $state(null);
  let timeRemaining = $state(60); // 60 seconds total
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let isSubmitting = $state(false);
  let calculator: FitnessPersonaCalculator | null = null;

  // Reactive store values
  let progress = $derived($personaAssessmentStore);
  let currentQuestionIndex = $derived(progress.currentQuestionIndex);
  let isCompleted = $derived(progress.isCompleted);
  let answers = $derived(progress.answers);

  onMount(async () => {
    try {
      // Load questions and learning paths
      const [questionsData, learningPathsData] = await Promise.all([
        contentService.loadPersonaQuestions(),
        contentService.loadLearningPaths()
      ]);
      
      questions = questionsData.filter(q => q.is_active);
      learningPaths = learningPathsData.filter(p => p.is_active);
      calculator = new FitnessPersonaCalculator(learningPaths);
      
      // Set current question
      if (questions.length > 0 && currentQuestionIndex < questions.length) {
        currentQuestion = questions[currentQuestionIndex];
      }
      
      // Start timer if assessment is not completed and not already started
      if (!isCompleted && !progress.startTime) {
        startTimer();
      } else if (progress.startTime && !isCompleted) {
        // Resume timer if assessment was interrupted
        resumeTimer();
      }
      
      isLoading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load assessment data';
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function startTimer() {
    personaAssessmentStore.startAssessment();
    timeRemaining = 60;
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        handleTimeUp();
      }
    }, 1000);
  }

  function resumeTimer() {
    if (progress.startTime) {
      const elapsed = Math.floor((Date.now() - progress.startTime) / 1000);
      timeRemaining = Math.max(0, 60 - elapsed);
      
      if (timeRemaining > 0) {
        timerInterval = setInterval(() => {
          timeRemaining--;
          if (timeRemaining <= 0) {
            handleTimeUp();
          }
        }, 1000);
      } else {
        handleTimeUp();
      }
    }
  }

  function handleTimeUp() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // Auto-submit with current answers
    if (!isCompleted && Object.keys(answers).length > 0) {
      submitAssessment();
    }
  }

  function selectAnswer(answerIndex: number) {
    if (!currentQuestion || isSubmitting) return;
    
    personaAssessmentStore.answerQuestion(currentQuestion.id, answerIndex);
    
    // Move to next question or complete assessment
    if (currentQuestionIndex + 1 < questions.length) {
      currentQuestion = questions[currentQuestionIndex + 1];
    } else {
      // All questions answered, submit assessment
      submitAssessment();
    }
  }

  async function submitAssessment() {
    if (isSubmitting || isCompleted) return;
    
    isSubmitting = true;
    
    try {
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      
      // Calculate results using the persona calculator
      // Convert answers Record to Map for calculator
      const answersMap = new Map<string, PersonaAnswerOption>();
      Object.entries(answers).forEach(([questionId, answerIndex]) => {
        const question = questions.find(q => q.id === questionId);
        answersMap.set(questionId, question!.answers[answerIndex]!);
      });
      const result = calculator!.scoreAssessment(answersMap);
      
      // Complete the assessment
      personaAssessmentStore.completeAssessment(result);
      
      // Call the completion callback
      onComplete(result);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to calculate results';
    } finally {
      isSubmitting = false;
    }
  }

  function restartAssessment() {
    personaAssessmentStore.startAssessment();
    timeRemaining = 60;
    currentQuestionIndex = 0;
    currentQuestion = questions[0] || null;
    isCompleted = false;
    error = null;
    isSubmitting = false;
    startTimer();
  }

  function continueToRegistration() {
    if (!progress.result) return;
    
    // Navigate to registration with fromAssessment parameter
    goto('/auth/signup?fromAssessment=1');
  }

  function goBack() {
    if (currentQuestionIndex > 0) {
      personaAssessmentStore.goBackToQuestion(currentQuestionIndex - 1);
      currentQuestion = questions[currentQuestionIndex - 1];
    }
  }

  // Format time display
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate progress percentage
  let progressPercentage = $derived(questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0);
</script>

<div class="persona-assessment-container">
  {#if isLoading}
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading your personalized fitness assessment...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2>Oops! Something went wrong</h2>
      <p>{error}</p>
      <button onclick={restartAssessment} class="btn btn-primary">
        <i class="fas fa-redo"></i>
        Try Again
      </button>
    </div>
  {:else if isCompleted && progress.result}
    <div class="results-state">
      <div class="success-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h2>Assessment Complete!</h2>
      <div class="persona-result">
        <h3>Your Fitness Profile</h3>
        <p class="persona-description">{progress.result.primaryPersona}</p>
        
        <div class="recommended-path">
          <h4>Recommended Learning Path</h4>
          <div class="path-card primary">
            <div class="path-header">
              <div class="path-icon">
                <i class="fas fa-star"></i>
              </div>
              <div class="path-info">
                <h5>{progress.result.recommendedPath.name}</h5>
                <p>{progress.result.recommendedPath.description}</p>
              </div>
            </div>
            <div class="match-score">
              {progress.result.rankedPaths[0].matchPercentage}% match
            </div>
          </div>
        </div>
        
        <div class="alternative-paths">
          <h4>Alternative Options</h4>
          {#each progress.result.rankedPaths.slice(1, 4) as path, index}
            <div class="path-card alternative">
              <div class="path-header">
                <div class="path-icon">
                  <i class="fas fa-{index === 0 ? 'medal' : index === 1 ? 'award' : 'certificate'}"></i>
                </div>
                <div class="path-info">
                  <h5>{path.path.name}</h5>
                  <p>{path.path.description}</p>
                </div>
              </div>
              <div class="match-score">{path.matchPercentage}% match</div>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="assessment-stats">
        <div class="stat-item">
          <i class="fas fa-clock"></i>
          <span>Completed in {formatTime(Math.floor((progress.endTime! - progress.startTime!) / 1000))}</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-question-circle"></i>
          <span>Answered {Object.keys(answers).length} of {questions.length} questions</span>
        </div>
      </div>
      
      <div class="results-actions">
        <button onclick={continueToRegistration} class="btn btn-primary btn-lg">
          <i class="fas fa-user-plus"></i>
          Continue to Registration
        </button>
        <button onclick={restartAssessment} class="btn btn-outline">
          <i class="fas fa-redo"></i>
          Take Assessment Again
        </button>
      </div>
    </div>
  {:else if currentQuestion}
    <div class="assessment-state">
      <!-- Header with timer and progress -->
      <div class="assessment-header">
        <div class="timer">
          <i class="fas fa-clock"></i>
          <span class="timer-text" class:timer-warning={timeRemaining <= 10}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progressPercentage}%"></div>
          </div>
          <div class="question-counter">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </div>

      <!-- Question -->
      <div class="question-container">
        <div class="question-type">
          <i class="fas fa-brain"></i>
          <span>Fitness Assessment</span>
        </div>
        <h2 class="question-text">{currentQuestion.text}</h2>
        <p class="question-category">{currentQuestion.category}</p>
      </div>

      <!-- Answer options -->
      <div class="answers-container">
        {#each currentQuestion.answers as answer, index}
          <button
            class="answer-option"
            onclick={() => selectAnswer(index)}
            disabled={isSubmitting}
          >
            <div class="option-radio">
              {#if answers[currentQuestion.id] === index}
                <div class="radio-selected"></div>
              {/if}
            </div>
            <span class="answer-text">{answer.text}</span>
          </button>
        {/each}
      </div>

      <!-- Navigation -->
      <div class="assessment-navigation">
        {#if currentQuestionIndex > 0}
          <button onclick={goBack} class="btn btn-outline" disabled={isSubmitting}>
            <i class="fas fa-arrow-left"></i>
            Previous
          </button>
        {/if}
        
        <div class="assessment-actions">
          <button onclick={restartAssessment} class="btn btn-ghost" disabled={isSubmitting}>
            <i class="fas fa-redo"></i>
            Start Over
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="error-state">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2>No questions available</h2>
      <p>Unable to load assessment questions. Please try again.</p>
      <button onclick={restartAssessment} class="btn btn-primary">
        <i class="fas fa-redo"></i>
        Retry
      </button>
    </div>
  {/if}
</div>

<style>
  .persona-assessment-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-6);
    min-height: 60vh;
  }

  /* Loading State */
  .loading-state {
    text-align: center;
    padding: var(--space-16) var(--space-8);
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--gray-200);
    border-top: 4px solid var(--primary-color);
    border-radius: var(--radius-full);
    animation: spin 1s linear infinite;
    margin: 0 auto var(--space-4);
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-state p {
    color: var(--text-secondary);
    font-size: 1.125rem;
    font-weight: 500;
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: var(--space-8);
    background: var(--bg-card);
    border: 1px solid var(--danger-color);
    border-radius: var(--radius-xl);
    margin: var(--space-6) 0;
    box-shadow: var(--shadow-md);
  }

  .error-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 75, 75, 0.1);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-4);
    color: var(--danger-color);
    font-size: 1.5rem;
  }

  .error-state h2 {
    color: var(--danger-color);
    margin-bottom: var(--space-4);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .error-state p {
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
    line-height: 1.6;
  }

  /* Assessment State */
  .assessment-state {
    background: var(--bg-card);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    border: 1px solid var(--gray-200);
  }

  .assessment-header {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--text-inverse);
    padding: var(--space-6);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  .timer {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 700;
    font-size: 1.25rem;
  }

  .timer i {
    font-size: 1rem;
  }

  .timer-warning {
    color: var(--warning-color);
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .progress-section {
    flex: 1;
    margin: 0 var(--space-4);
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);
  }

  .progress-fill {
    height: 100%;
    background: var(--text-inverse);
    transition: width var(--transition-normal);
    border-radius: var(--radius-full);
  }

  .question-counter {
    font-weight: 500;
    font-size: 0.9rem;
    text-align: center;
  }

  .question-container {
    padding: var(--space-8);
    border-bottom: 1px solid var(--gray-200);
  }

  .question-type {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: var(--text-inverse);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    margin-bottom: var(--space-4);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .question-text {
    font-size: 1.5rem;
    margin-bottom: var(--space-2);
    color: var(--text-primary);
    line-height: 1.4;
    font-weight: 700;
  }

  .question-category {
    color: var(--text-muted);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
  }

  .answers-container {
    padding: var(--space-6) var(--space-8);
  }

  .answer-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--space-5);
    margin-bottom: var(--space-3);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-xl);
    background: var(--bg-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    position: relative;
    overflow: hidden;
  }

  .answer-option::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(88, 204, 2, 0.1), transparent);
    transition: left var(--transition-normal);
  }

  .answer-option:hover::before {
    left: 100%;
  }

  .answer-option:hover:not(:disabled) {
    border-color: var(--primary-color);
    background: var(--bg-card);
    transform: translateX(4px);
  }

  .answer-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .option-radio {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: 2px solid var(--gray-400);
    border-radius: var(--radius-full);
    margin-right: var(--space-4);
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }

  .answer-option:hover .option-radio {
    border-color: var(--primary-color);
  }

  .radio-selected {
    width: 12px;
    height: 12px;
    background-color: var(--primary-color);
    border-radius: var(--radius-full);
  }

  .answer-text {
    flex: 1;
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--text-primary);
  }

  .assessment-navigation {
    padding: var(--space-6) var(--space-8);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
    border-top: 1px solid var(--gray-200);
  }

  .assessment-actions {
    display: flex;
    gap: var(--space-3);
  }

  /* Results State */
  .results-state {
    text-align: center;
    padding: var(--space-8);
    background: var(--bg-card);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--gray-200);
  }

  .success-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--success-color), var(--primary-dark));
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-6);
    color: var(--text-inverse);
    font-size: 2rem;
    box-shadow: var(--shadow-lg);
  }

  .results-state h2 {
    color: var(--success-color);
    margin-bottom: var(--space-8);
    font-size: 2rem;
    font-weight: 700;
  }

  .persona-result {
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    margin-bottom: var(--space-8);
    border: 1px solid var(--gray-200);
  }

  .persona-result h3 {
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .persona-description {
    color: var(--text-secondary);
    font-size: 1.125rem;
    line-height: 1.6;
    margin-bottom: var(--space-8);
  }

  .recommended-path {
    margin-bottom: var(--space-8);
  }

  .recommended-path h4 {
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .path-card {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    border: 1px solid var(--gray-200);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .path-card.primary {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
  }

  .path-card.primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  }

  .path-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .path-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .path-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .path-info h5 {
    color: var(--text-primary);
    margin-bottom: var(--space-2);
    font-size: 1.25rem;
    font-weight: 700;
  }

  .path-info p {
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .match-score {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: var(--text-inverse);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    display: inline-block;
  }

  .alternative-paths {
    margin-bottom: var(--space-8);
  }

  .alternative-paths h4 {
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .alternative-paths .path-card {
    margin-bottom: var(--space-4);
  }

  .assessment-stats {
    display: flex;
    justify-content: center;
    gap: var(--space-8);
    margin-bottom: var(--space-8);
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-secondary);
    font-weight: 500;
  }

  .stat-item i {
    color: var(--primary-color);
    font-size: 1rem;
  }

  .results-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
    margin-top: var(--space-8);
  }

  .results-actions .btn-lg {
    padding: var(--space-4) var(--space-8);
    font-size: 1.1rem;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .persona-assessment-container {
      padding: var(--space-4);
    }

    .assessment-header {
      flex-direction: column;
      gap: var(--space-3);
      text-align: center;
    }

    .progress-section {
      margin: 0;
      width: 100%;
    }

    .question-container {
      padding: var(--space-6);
    }

    .question-text {
      font-size: 1.25rem;
    }

    .answers-container {
      padding: var(--space-4) var(--space-6);
    }

    .assessment-navigation {
      flex-direction: column;
      gap: var(--space-4);
    }

    .assessment-actions {
      width: 100%;
      justify-content: center;
    }

    .path-header {
      flex-direction: column;
      text-align: center;
      gap: var(--space-3);
    }

    .assessment-stats {
      flex-direction: column;
      gap: var(--space-4);
    }
  }

  @media (max-width: 480px) {
    .question-container {
      padding: var(--space-4);
    }

    .answers-container {
      padding: var(--space-3) var(--space-4);
    }

    .answer-option {
      padding: var(--space-4);
    }

    .assessment-navigation {
      padding: var(--space-4);
    }
  }
</style>