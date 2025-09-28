<script lang="ts">
  import { goto } from '$app/navigation';
  import { guestGatingStore, type GuestGatingState } from '$lib/stores/guest-gating';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  const { isOpen, onClose }: Props = $props();
  type GuestGatingSubState = Pick<GuestGatingState, 'articlesRead' | 'nudgeShownCount'>;
  
  // Modern Svelte 5 approach: $state for reactive state
  let storeState = $state<GuestGatingSubState>({
    articlesRead: [],
    nudgeShownCount: 0,
  });

  let gatingState = $derived(storeState);

  // Modern Svelte 5: $effect handles subscription lifecycle automatically
  $effect(() => {
    const unsubscribe = guestGatingStore.subscribe(state => {
      storeState = {
        articlesRead: state.articlesRead,
        nudgeShownCount: state.nudgeShownCount,
      };
    });
    return unsubscribe; // Automatic cleanup when component unmounts
  });

  function handleDismiss() {
    guestGatingStore.dismissNudge();
    onClose();
  }

  function handleSignUp() {
    // Navigate to signup with a special parameter to indicate this came from gating
    goto('/auth/signup?source=guest-gating');
    handleDismiss();
  }

  function handleSignIn() {
    // Navigate to signin with a special parameter
    goto('/auth/signin?source=guest-gating');
    handleDismiss();
  }

  // Prevent body scroll when modal is open
  $effect(() => {
    if (isOpen && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });
</script>

{#if isOpen}
  <!-- Modal Overlay -->
  <div 
    class="modal-overlay" 
    onkeydown={(e) => e.key === 'Escape' && handleDismiss()}
    role="dialog" 
    aria-modal="true"
    aria-labelledby="gating-modal-title"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div 
      class="modal-content" 
      role="document"
    >
      <!-- Close Button -->
      <button 
        class="close-button" 
        onclick={handleDismiss}
        aria-label="Close modal"
      >
        <i class="fas fa-times"></i>
      </button>

      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-icon">
          <i class="fas fa-star"></i>
        </div>
        <h2 id="gating-modal-title" class="modal-title">
          You're on a roll! 🎉
        </h2>
        <p class="modal-subtitle">
          You've read {gatingState.articlesRead.length} article{gatingState.articlesRead.length !== 1 ? 's' : ''} and you're clearly serious about your fitness journey.
        </p>
      </div>

      <!-- Modal Body -->
      <div class="modal-body">
        <div class="benefits-grid">
          <div class="benefit-item">
            <div class="benefit-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="benefit-content">
              <h3>Track Your Progress</h3>
              <p>See your learning journey with personalized analytics and streak tracking</p>
            </div>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <div class="benefit-content">
              <h3>Unlock Challenges</h3>
              <p>Join personalized 7-day challenges tailored to your fitness goals</p>
            </div>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="benefit-content">
              <h3>Join the Community</h3>
              <p>Connect with others on similar fitness journeys and share your progress</p>
            </div>
          </div>

          <div class="benefit-item">
            <div class="benefit-icon">
              <i class="fas fa-brain"></i>
            </div>
            <div class="benefit-content">
              <h3>Get Personalized Content</h3>
              <p>Access your 60-second fitness assessment results and recommended learning path</p>
            </div>
          </div>
        </div>

        <!-- Trust Signals -->
        <div class="trust-signals">
          <div class="trust-item">
            <i class="fas fa-shield-alt"></i>
            <span>100% Free</span>
          </div>
          <div class="trust-item">
            <i class="fas fa-lock"></i>
            <span>Private by Default</span>
          </div>
          <div class="trust-item">
            <i class="fas fa-heart"></i>
            <span>No Judgment Zone</span>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="modal-actions">
          <button 
            class="btn btn-primary btn-lg" 
            onclick={handleSignUp}
          >
            <i class="fas fa-user-plus"></i>
            Create Free Account
          </button>
          <button 
            class="btn btn-outline btn-lg" 
            onclick={handleSignIn}
          >
            <i class="fas fa-sign-in-alt"></i>
            Sign In
          </button>
        </div>
        <p class="modal-footer-text">
          Takes less than 30 seconds • No credit card required
        </p>
        <button 
          class="btn btn-ghost btn-sm" 
          onclick={handleDismiss}
        >
          Continue Reading (I'll decide later)
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: var(--space-4);
    animation: fadeIn 0.3s ease-out;
  }

  .modal-content {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-2xl);
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    animation: slideUp 0.3s ease-out;
    border: 1px solid var(--gray-200);
  }

  .close-button {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    background: none;
    border: none;
    color: var(--gray-500);
    font-size: 1.25rem;
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);
    z-index: 10;
  }

  .close-button:hover {
    background: var(--gray-100);
    color: var(--gray-700);
  }

  .modal-header {
    text-align: center;
    padding: var(--space-8) var(--space-6) var(--space-6);
  }

  .modal-icon {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--space-4);
    box-shadow: var(--shadow-lg);
  }

  .modal-icon i {
    font-size: 2rem;
    color: white;
  }

  .modal-title {
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--space-3);
    line-height: 1.2;
  }

  .modal-subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin: 0;
  }

  .modal-body {
    padding: 0 var(--space-6) var(--space-6);
  }

  .benefits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-subtle);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-100);
    transition: all var(--transition-fast);
  }

  .benefit-item:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  .benefit-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .benefit-icon i {
    color: white;
    font-size: 1.1rem;
  }

  .benefit-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 var(--space-1);
  }

  .benefit-content p {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.4;
  }

  .trust-signals {
    display: flex;
    justify-content: center;
    gap: var(--space-6);
    padding: var(--space-4);
    background: var(--bg-subtle);
    border-radius: var(--radius-lg);
    border: 1px solid var(--gray-100);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .trust-item i {
    color: var(--success-color);
    font-size: 1rem;
  }

  .modal-footer {
    padding: var(--space-6);
    text-align: center;
    border-top: 1px solid var(--gray-100);
    background: var(--bg-subtle);
    border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  }

  .modal-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .modal-footer-text {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin: 0 0 var(--space-3);
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Responsive Design */
  @media (max-width: 640px) {
    .modal-content {
      margin: var(--space-2);
      max-height: calc(100vh - var(--space-4));
    }

    .modal-header {
      padding: var(--space-6) var(--space-4) var(--space-4);
    }

    .modal-body {
      padding: 0 var(--space-4) var(--space-4);
    }

    .modal-footer {
      padding: var(--space-4);
    }

    .benefits-grid {
      grid-template-columns: 1fr;
      gap: var(--space-3);
    }

    .benefit-item {
      padding: var(--space-3);
    }

    .trust-signals {
      flex-direction: column;
      gap: var(--space-3);
    }

    .modal-actions {
      flex-direction: column;
    }

    .modal-actions .btn {
      width: 100%;
    }
  }

  /* Dark theme support */
  [data-theme="dark"] .modal-content {
    background: var(--bg-card-dark);
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .benefit-item {
    background: var(--bg-subtle-dark);
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .trust-signals {
    background: var(--bg-subtle-dark);
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .modal-footer {
    background: var(--bg-subtle-dark);
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .close-button:hover {
    background: var(--gray-800);
    color: var(--gray-300);
  }
</style>
