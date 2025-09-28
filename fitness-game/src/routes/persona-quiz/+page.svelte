<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PersonaQuiz from '$lib/components/PersonaQuiz.svelte';
  import { personaQuizStore } from '$lib/stores/persona-quiz';
  import type { PersonaQuizResult } from '$lib/types/fitness-persona-calculator';

  let showWelcome = $state(true);
  let hasCompletedQuiz = $state(false);

  onMount(() => {
    // Subscribe to store changes to check completion status
    const unsubscribe = personaQuizStore.subscribe(progress => {
      if (progress.isCompleted) {
        hasCompletedQuiz = true;
        showWelcome = false;
      }
    });
    
    // Clean up subscription
    return unsubscribe;
  });

  function startQuiz() {
    showWelcome = false;
  }

  function handleQuizComplete(result: PersonaQuizResult) {
    console.log('Quiz completed with result:', result);
    
    // Redirect to results page or show conversion flow
    setTimeout(() => {
      // For now, show success message
      alert(`Great! Your personalized fitness profile is ready. Recommended path: ${result.recommendedPath.name}`);
    }, 2000);
  }

  function goToDashboard() {
    goto('/progress');
  }

  function retakeQuiz() {
    personaQuizStore.startQuiz();
    showWelcome = true;
    hasCompletedQuiz = false;
  }
</script>

<svelte:head>
  <title>Fitness Assessment - Find Your Perfect Learning Path</title>
  <meta name="description" content="Take our 60-second fitness assessment to discover your personalized learning path and fitness profile." />
</svelte:head>

<div class="persona-quiz-page">
  {#if showWelcome}
    <div class="welcome-section">
      <div class="container">
        <div class="welcome-content">
          <div class="welcome-header">
            <div class="welcome-badge">
              <i class="fas fa-brain"></i>
              <span>Personalized Assessment</span>
            </div>
            <h1>Find Your Perfect <span class="gradient-text">Fitness Path</span></h1>
            <p class="subtitle">Take our 60-second assessment to discover your personalized learning journey</p>
          </div>

          <div class="features-grid">
            <div class="feature-card fade-in">
              <div class="feature-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3>Quick & Easy</h3>
              <p>Just 60 seconds to complete - no lengthy questionnaires</p>
            </div>
            
            <div class="feature-card fade-in">
              <div class="feature-icon">
                <i class="fas fa-user-check"></i>
              </div>
              <h3>Personalized</h3>
              <p>Get recommendations tailored to your fitness level and goals</p>
            </div>
            
            <div class="feature-card fade-in">
              <div class="feature-icon">
                <i class="fas fa-graduation-cap"></i>
              </div>
              <h3>Smart Learning</h3>
              <p>Access content designed specifically for your learning style</p>
            </div>
            
            <div class="feature-card fade-in">
              <div class="feature-icon">
                <i class="fas fa-rocket"></i>
              </div>
              <h3>Start Strong</h3>
              <p>Begin your fitness journey with confidence and clarity</p>
            </div>
          </div>

          <div class="assessment-preview">
            <h3>What You'll Discover:</h3>
            <div class="preview-list">
              <div class="preview-item">
                <i class="fas fa-check"></i>
                <span>Your fitness knowledge level and learning style</span>
              </div>
              <div class="preview-item">
                <i class="fas fa-check"></i>
                <span>Personalized learning path recommendations</span>
              </div>
              <div class="preview-item">
                <i class="fas fa-check"></i>
                <span>Content tailored to your goals and preferences</span>
              </div>
              <div class="preview-item">
                <i class="fas fa-check"></i>
                <span>Optimal pace and approach for your journey</span>
              </div>
            </div>
          </div>

          <div class="cta-section">
            <button onclick={startQuiz} class="btn btn-primary btn-lg">
              <i class="fas fa-brain"></i>
              Start Your Assessment
            </button>
            
            {#if hasCompletedQuiz}
              <div class="quiz-options">
                <p>Already taken the assessment?</p>
                <div class="quiz-actions">
                  <button onclick={retakeQuiz} class="btn btn-outline">
                    <i class="fas fa-redo"></i>
                    Retake Assessment
                  </button>
                  <button onclick={goToDashboard} class="btn btn-outline">
                    <i class="fas fa-chart-line"></i>
                    Go to Dashboard
                  </button>
                </div>
              </div>
            {/if}
          </div>

          <div class="privacy-note">
            <i class="fas fa-shield-alt"></i>
            <p>Your responses are private and used only to personalize your experience</p>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="quiz-section">
      <div class="container">
        <div class="quiz-header-page">
          <button onclick={() => showWelcome = true} class="btn btn-ghost">
            <i class="fas fa-arrow-left"></i>
            Back to Overview
          </button>
          <h2>Fitness Assessment</h2>
        </div>
        
        <PersonaQuiz onComplete={handleQuizComplete} />
      </div>
    </div>
  {/if}
</div>

<style>
  .persona-quiz-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%);
    padding: var(--space-8) 0;
  }

  /* Welcome Section */
  .welcome-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
  }

  .welcome-content {
    max-width: 1000px;
    width: 100%;
    background: var(--bg-card);
    border-radius: var(--radius-2xl);
    padding: var(--space-12);
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--gray-200);
  }

  .welcome-header {
    text-align: center;
    margin-bottom: var(--space-12);
  }

  .welcome-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: rgba(88, 204, 2, 0.1);
    color: var(--primary-color);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: var(--space-6);
    border: 1px solid rgba(88, 204, 2, 0.2);
  }

  .welcome-header h1 {
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: var(--space-6);
    color: var(--text-primary);
  }

  .subtitle {
    font-size: 1.25rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-6);
    margin-bottom: var(--space-12);
  }

  .feature-card {
    text-align: center;
    padding: var(--space-6);
    border-radius: var(--radius-xl);
    background: var(--bg-secondary);
    border: 1px solid var(--gray-200);
    transition: all var(--transition-normal);
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    transform: scaleX(0);
    transition: transform var(--transition-normal);
  }

  .feature-card:hover::before {
    transform: scaleX(1);
  }

  .feature-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-color);
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-inverse);
    font-size: 1.25rem;
    margin: 0 auto var(--space-4) auto;
    box-shadow: var(--shadow-md);
  }

  .feature-card h3 {
    color: var(--text-primary);
    margin-bottom: var(--space-3);
    font-size: 1.2rem;
    font-weight: 700;
  }

  .feature-card p {
    color: var(--text-secondary);
    line-height: 1.5;
    font-size: 0.95rem;
  }

  /* Assessment Preview */
  .assessment-preview {
    background: linear-gradient(135deg, rgba(88, 204, 2, 0.05), rgba(28, 176, 246, 0.05));
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    margin-bottom: var(--space-12);
    border-left: 4px solid var(--primary-color);
  }

  .assessment-preview h3 {
    color: var(--text-primary);
    margin-bottom: var(--space-6);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .preview-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .preview-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--text-secondary);
    font-size: 1rem;
    line-height: 1.5;
  }

  .preview-item i {
    color: var(--primary-color);
    font-size: 1rem;
    width: 16px;
    text-align: center;
  }

  /* CTA Section */
  .cta-section {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .quiz-options {
    margin-top: var(--space-8);
    padding-top: var(--space-8);
    border-top: 1px solid var(--gray-200);
  }

  .quiz-options p {
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
    font-weight: 500;
  }

  .quiz-actions {
    display: flex;
    gap: var(--space-4);
    justify-content: center;
    flex-wrap: wrap;
  }

  /* Privacy Note */
  .privacy-note {
    text-align: center;
    padding-top: var(--space-8);
    border-top: 1px solid var(--gray-200);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  .privacy-note i {
    color: var(--primary-color);
    font-size: 1rem;
  }

  .privacy-note p {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin: 0;
  }

  /* Quiz Section */
  .quiz-section {
    padding: var(--space-8) 0;
  }

  .quiz-header-page {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .quiz-header-page h2 {
    color: var(--text-primary);
    font-size: 2rem;
    margin: 0;
    font-weight: 700;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .persona-quiz-page {
      padding: var(--space-4) 0;
    }

    .welcome-content {
      padding: var(--space-8) var(--space-6);
      margin: var(--space-4);
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--space-4);
    }

    .quiz-header-page {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .quiz-header-page h2 {
      font-size: 1.5rem;
    }

    .quiz-actions {
      flex-direction: column;
      align-items: center;
    }

    .btn {
      width: 100%;
      max-width: 300px;
    }
  }

  @media (max-width: 480px) {
    .welcome-content {
      padding: var(--space-6) var(--space-4);
    }

    .feature-card {
      padding: var(--space-4);
    }

    .assessment-preview {
      padding: var(--space-6);
    }
  }
</style>