<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PersonaQuiz from '$lib/components/PersonaQuiz.svelte';
  import { personaQuizStore } from '$lib/stores/persona-quiz';
  import type { PersonaQuizResult } from '$lib/types/fitness-persona-calculator';

  let showWelcome = true;
  let hasCompletedQuiz = false;

  onMount(() => {
    // Load the store to check if user has already completed the quiz
    //personaQuizStore.load();
    
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
    
    // Here you can add additional logic like:
    // - Save results to user profile
    // - Redirect to personalized dashboard
    // - Show additional onboarding steps
    // - Track analytics
    
    // For now, we'll just show a success message and option to continue
    setTimeout(() => {
      // You can redirect to a personalized dashboard or learning path
      // goto(`/learning-path/${result.recommendedPath.id}`);
      
      // Or show additional options
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
      <div class="welcome-content">
        <div class="welcome-header">
          <h1>🎯 Find Your Perfect Fitness Path</h1>
          <p class="subtitle">Take our 60-second assessment to discover your personalized learning journey</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Quick & Easy</h3>
            <p>Just 60 seconds to complete - no lengthy questionnaires</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Personalized</h3>
            <p>Get recommendations tailored to your fitness level and goals</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Smart Learning</h3>
            <p>Access content designed specifically for your learning style</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>Start Strong</h3>
            <p>Begin your fitness journey with confidence and clarity</p>
          </div>
        </div>

        <div class="assessment-preview">
          <h3>What You'll Discover:</h3>
          <ul>
            <li>Your fitness knowledge level and learning style</li>
            <li>Personalized learning path recommendations</li>
            <li>Content tailored to your goals and preferences</li>
            <li>Optimal pace and approach for your journey</li>
          </ul>
        </div>

        <div class="cta-section">
          <button on:click={startQuiz} class="start-quiz-btn">
            Start Your Assessment
            <span class="btn-icon">→</span>
          </button>
          
          {#if hasCompletedQuiz}
            <div class="quiz-options">
              <p>Already taken the assessment?</p>
              <button on:click={retakeQuiz} class="retake-btn">
                Retake Assessment
              </button>
              <button on:click={goToDashboard} class="dashboard-btn">
                Go to Dashboard
              </button>
            </div>
          {/if}
        </div>

        <div class="privacy-note">
          <p>🔒 Your responses are private and used only to personalize your experience</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="quiz-section">
      <div class="quiz-header-page">
        <button on:click={() => showWelcome = true} class="back-btn">
          ← Back to Overview
        </button>
        <h2>Fitness Assessment</h2>
      </div>
      
      <PersonaQuiz onComplete={handleQuizComplete} />
    </div>
  {/if}
</div>

<style>
  .persona-quiz-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 0;
  }

  /* Welcome Section */
  .welcome-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    padding: 2rem;
  }

  .welcome-content {
    max-width: 1000px;
    width: 100%;
    background: white;
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .welcome-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .welcome-header h1 {
    font-size: 3rem;
    color: #333;
    margin-bottom: 1rem;
    font-weight: 700;
  }

  .subtitle {
    font-size: 1.25rem;
    color: #666;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
  }

  /* Features Grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .feature-card {
    text-align: center;
    padding: 1.5rem;
    border-radius: 12px;
    background: #f8f9ff;
    border: 2px solid #e9ecef;
    transition: all 0.3s ease;
  }

  .feature-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #007bff;
  }

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .feature-card h3 {
    color: #333;
    margin-bottom: 0.75rem;
    font-size: 1.2rem;
  }

  .feature-card p {
    color: #666;
    line-height: 1.4;
    font-size: 0.95rem;
  }

  /* Assessment Preview */
  .assessment-preview {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 3rem;
  }

  .assessment-preview h3 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 1.3rem;
  }

  .assessment-preview ul {
    list-style: none;
    padding: 0;
  }

  .assessment-preview li {
    padding: 0.5rem 0;
    color: #555;
    position: relative;
    padding-left: 1.5rem;
  }

  .assessment-preview li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #28a745;
    font-weight: bold;
  }

  /* CTA Section */
  .cta-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .start-quiz-btn {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    border: none;
    padding: 1.25rem 3rem;
    font-size: 1.2rem;
    font-weight: 600;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 20px rgba(0, 123, 255, 0.3);
  }

  .start-quiz-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(0, 123, 255, 0.4);
  }

  .btn-icon {
    font-size: 1.1rem;
    transition: transform 0.3s ease;
  }

  .start-quiz-btn:hover .btn-icon {
    transform: translateX(4px);
  }

  .quiz-options {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #eee;
  }

  .quiz-options p {
    color: #666;
    margin-bottom: 1rem;
  }

  .retake-btn, .dashboard-btn {
    background: transparent;
    border: 2px solid #6c757d;
    color: #6c757d;
    padding: 0.75rem 1.5rem;
    margin: 0 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .retake-btn:hover, .dashboard-btn:hover {
    background: #6c757d;
    color: white;
  }

  /* Privacy Note */
  .privacy-note {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #eee;
  }

  .privacy-note p {
    color: #888;
    font-size: 0.9rem;
  }

  /* Quiz Section */
  .quiz-section {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .quiz-header-page {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .back-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .quiz-header-page h2 {
    color: white;
    font-size: 2rem;
    margin: 0;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .persona-quiz-page {
      padding: 1rem 0;
    }

    .welcome-content {
      padding: 2rem 1.5rem;
      margin: 1rem;
    }

    .welcome-header h1 {
      font-size: 2.2rem;
    }

    .subtitle {
      font-size: 1.1rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .start-quiz-btn {
      padding: 1rem 2rem;
      font-size: 1.1rem;
    }

    .quiz-section {
      padding: 0 1rem;
    }

    .quiz-header-page {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .quiz-header-page h2 {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .welcome-content {
      padding: 1.5rem 1rem;
    }

    .welcome-header h1 {
      font-size: 1.8rem;
    }

    .feature-card {
      padding: 1rem;
    }

    .assessment-preview {
      padding: 1.5rem;
    }

    .retake-btn, .dashboard-btn {
      display: block;
      width: 100%;
      margin: 0.5rem 0;
    }
  }
</style>
