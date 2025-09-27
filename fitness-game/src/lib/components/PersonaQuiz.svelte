<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { contentService } from '$lib/services/content.service';
  import { FitnessPersonaCalculator } from '$lib/services/fitness-persona-calculator';
  import { personaQuizStore } from '$lib/stores/persona-quiz';
  import type { PersonaQuestion, LearningPath, PersonaAnswerOption, PersonaQuizResult } from '$lib/types/fitness-persona-calculator';

  export let onComplete: (result: PersonaQuizResult) => void = () => {};

  let questions: PersonaQuestion[] = [];
  let learningPaths: LearningPath[] = [];
  let currentQuestion: PersonaQuestion | null = null;
  let isLoading = true;
  let error: string | null = null;
  let timeRemaining = 60; // 60 seconds total
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let isSubmitting = false;
  let calculator: FitnessPersonaCalculator | null = null;

  // Reactive store values
  $: progress = $personaQuizStore;
  $: currentQuestionIndex = progress.currentQuestionIndex;
  $: isCompleted = progress.isCompleted;
  $: answers = progress.answers;

  onMount(async () => {
    // Load progress from localStorage
    //personaQuizStore.load();
    
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
      
      // Start timer if quiz is not completed and not already started
      if (!isCompleted && !progress.startTime) {
        startTimer();
      } else if (progress.startTime && !isCompleted) {
        // Resume timer if quiz was interrupted
        resumeTimer();
      }
      
      isLoading = false;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load quiz data';
      isLoading = false;
    }
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function startTimer() {
    personaQuizStore.startQuiz();
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
      if (!isCompleted && answers.size > 0) {
        submitQuiz();
      }
  }

  function selectAnswer(answerIndex: number) {
    if (!currentQuestion || isSubmitting) return;
    
    personaQuizStore.answerQuestion(currentQuestion.id, answerIndex);
    
    // Move to next question or complete quiz
    if (currentQuestionIndex + 1 < questions.length) {
      currentQuestion = questions[currentQuestionIndex + 1];
    } else {
      // All questions answered, submit quiz
      submitQuiz();
    }
  }

  async function submitQuiz() {
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
      const result = calculator!.scoreQuiz(answersMap);
      
      // Complete the quiz
      personaQuizStore.completeQuiz(result);
      
      // Call the completion callback
      onComplete(result);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to calculate results';
    } finally {
      isSubmitting = false;
    }
  }

  function restartQuiz() {
    personaQuizStore.startQuiz();
    timeRemaining = 60;
    currentQuestionIndex = 0;
    currentQuestion = questions[0] || null;
    isCompleted = false;
    error = null;
    isSubmitting = false;
    startTimer();
  }

  function goBack() {
    if (currentQuestionIndex > 0) {
      personaQuizStore.goBackToQuestion(currentQuestionIndex - 1);
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
  $: progressPercentage = questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;
</script>

<div class="persona-quiz-container">
  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading your personalized fitness assessment...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <h2>Oops! Something went wrong</h2>
      <p>{error}</p>
      <button on:click={restartQuiz} class="btn-primary">Try Again</button>
    </div>
  {:else if isCompleted && progress.result}
    <div class="results-state">
      <div class="success-icon">🎉</div>
      <h2>Assessment Complete!</h2>
      <div class="persona-result">
        <h3>Your Fitness Profile</h3>
        <p class="persona-description">{progress.result.primaryPersona}</p>
        
        <div class="recommended-path">
          <h4>Recommended Learning Path</h4>
          <div class="path-card">
            <h5>{progress.result.recommendedPath.name}</h5>
            <p>{progress.result.recommendedPath.description}</p>
            <div class="match-score">
              {progress.result.rankedPaths[0].matchPercentage}% match
            </div>
          </div>
        </div>
        
        <div class="alternative-paths">
          <h4>Alternative Options</h4>
          {#each progress.result.rankedPaths.slice(1, 4) as path, index}
            <div class="path-card alternative">
              <h5>{path.path.name}</h5>
              <p>{path.path.description}</p>
              <div class="match-score">{path.matchPercentage}% match</div>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="quiz-stats">
        <p>Completed in {formatTime(Math.floor((progress.endTime! - progress.startTime!) / 1000))}</p>
        <p>Answered {answers.size} of {questions.length} questions</p>
      </div>
      
      <button on:click={restartQuiz} class="btn-secondary">Take Assessment Again</button>
    </div>
  {:else if currentQuestion}
    <div class="quiz-state">
      <!-- Header with timer and progress -->
      <div class="quiz-header">
        <div class="timer">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text" class:timer-warning={timeRemaining <= 10}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: {progressPercentage}%"></div>
        </div>
        
        <div class="question-counter">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <!-- Question -->
      <div class="question-container">
        <h2 class="question-text">{currentQuestion.text}</h2>
        <p class="question-category">{currentQuestion.category}</p>
      </div>

      <!-- Answer options -->
      <div class="answers-container">
        {#each currentQuestion.answers as answer, index}
          <button
            class="answer-option"
            on:click={() => selectAnswer(index)}
            disabled={isSubmitting}
          >
            <span class="answer-letter">{String.fromCharCode(65 + index)}</span>
            <span class="answer-text">{answer.text}</span>
          </button>
        {/each}
      </div>

      <!-- Navigation -->
      <div class="quiz-navigation">
        {#if currentQuestionIndex > 0}
          <button on:click={goBack} class="btn-secondary" disabled={isSubmitting}>
            ← Previous
          </button>
        {/if}
        
        <div class="quiz-actions">
          <button on:click={restartQuiz} class="btn-outline" disabled={isSubmitting}>
            Start Over
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="error-state">
      <h2>No questions available</h2>
      <p>Unable to load quiz questions. Please try again.</p>
      <button on:click={restartQuiz} class="btn-primary">Retry</button>
    </div>
  {/if}
</div>

<style>
  .persona-quiz-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 60vh;
  }

  /* Loading State */
  .loading-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Error State */
  .error-state {
    text-align: center;
    padding: 2rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    margin: 2rem 0;
  }

  .error-state h2 {
    color: #c33;
    margin-bottom: 1rem;
  }

  /* Quiz State */
  .quiz-state {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .quiz-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: bold;
    font-size: 1.2rem;
  }

  .timer-warning {
    color: #ff6b6b;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    margin: 0 1rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: white;
    transition: width 0.3s ease;
  }

  .question-counter {
    font-weight: 500;
  }

  .question-container {
    padding: 2rem;
    border-bottom: 1px solid #eee;
  }

  .question-text {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #333;
    line-height: 1.4;
  }

  .question-category {
    color: #666;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .answers-container {
    padding: 1.5rem 2rem;
  }

  .answer-option {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }

  .answer-option:hover:not(:disabled) {
    border-color: #007bff;
    background: #f8f9ff;
    transform: translateY(-1px);
  }

  .answer-option:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .answer-letter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #007bff;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .answer-text {
    flex: 1;
    font-size: 1rem;
    line-height: 1.4;
  }

  .quiz-navigation {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    border-top: 1px solid #eee;
  }

  .quiz-actions {
    display: flex;
    gap: 1rem;
  }

  /* Results State */
  .results-state {
    text-align: center;
    padding: 2rem;
  }

  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .results-state h2 {
    color: #28a745;
    margin-bottom: 2rem;
  }

  .persona-result {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: left;
  }

  .persona-description {
    font-size: 1.2rem;
    color: #007bff;
    font-weight: 500;
    margin: 1rem 0 2rem;
    padding: 1rem;
    background: #f8f9ff;
    border-radius: 8px;
    border-left: 4px solid #007bff;
  }

  .recommended-path {
    margin-bottom: 2rem;
  }

  .path-card {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1rem 0;
    transition: all 0.2s ease;
  }

  .path-card.alternative {
    border-color: #dee2e6;
  }

  .path-card h5 {
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .path-card p {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.4;
  }

  .match-score {
    display: inline-block;
    background: #007bff;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .alternative-paths .match-score {
    background: #6c757d;
  }

  .quiz-stats {
    margin: 2rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    color: #666;
  }

  .quiz-stats p {
    margin: 0.5rem 0;
  }

  /* Buttons */
  .btn-primary, .btn-secondary, .btn-outline {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 1rem;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-outline {
    background: transparent;
    color: #6c757d;
    border: 2px solid #6c757d;
  }

  .btn-outline:hover:not(:disabled) {
    background: #6c757d;
    color: white;
  }

  .btn-primary:disabled, .btn-secondary:disabled, .btn-outline:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .persona-quiz-container {
      padding: 1rem;
    }

    .quiz-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .progress-bar {
      margin: 0;
      order: 2;
    }

    .question-text {
      font-size: 1.25rem;
    }

    .answer-option {
      padding: 0.75rem;
    }

    .quiz-navigation {
      flex-direction: column;
      gap: 1rem;
    }

    .quiz-actions {
      justify-content: center;
    }
  }
</style>
