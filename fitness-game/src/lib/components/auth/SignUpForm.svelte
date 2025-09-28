<script lang="ts">
  import { personaAssessmentStore } from '$lib/stores/persona-assessment';
  
  interface Props {
    data: {
      inviterCode?: string | null;
      fromAssessment?: boolean;
    }
  }
  
  const { data }: Props = $props()
  
  let email = $state('')
  let password = $state('')
  let confirmPassword = $state('')
  let displayName = $state('')
  let inviterCode = $state(data.inviterCode || '')
  let loading = $state(false)
  let error = $state('')
  
  // Get assessment results from store if fromAssessment is true
  let assessmentResults = $derived(data.fromAssessment ? $personaAssessmentStore.result : null);
  let learningPathIds = $derived(assessmentResults ? assessmentResults.rankedPaths.map(path => path.path.id).slice(0, 3) : []);
  
  // client only validates fields; submit handled by server actions
</script>

<div class="auth-form">
  <div class="auth-header">
    <h2>Sign Up</h2>
    <p>Join FitJourney and start your fitness journey</p>
    
    {#if data.fromAssessment && assessmentResults}
      <div class="personalized-paths">
        <div class="paths-badge">
          <i class="fas fa-star"></i>
          <span>Your Personalized Learning Paths</span>
        </div>
        <p class="paths-description">
          Based on your fitness assessment, we've prepared these learning paths just for you:
        </p>
        <div class="paths-list">
          {#each assessmentResults.rankedPaths.slice(0, 3) as pathResult}
            <div class="path-item">
              <i class="fas fa-check-circle"></i>
              <span>{pathResult.path.name} ({pathResult.matchPercentage}% match)</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <form method="POST" action="?/signup">
    {#if data.fromAssessment && learningPathIds.length > 0}
      <input type="hidden" name="learningPaths" value={learningPathIds.join(',')} />
    {/if}
    
    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        bind:value={email}
        required
        disabled={loading}
        placeholder="Enter your email"
      />
    </div>
    
    <div class="form-group">
      <label for="displayName">Display Name (Optional)</label>
      <input
        id="displayName"
        name="displayName"
        type="text"
        bind:value={displayName}
        disabled={loading}
        placeholder="Enter your display name"
      />
    </div>
    
    <div class="form-group">
      <label for="inviterCode">Inviter Code (Optional)</label>
      <input
        id="inviterCode"
        name="inviterCode"
        type="text"
        bind:value={inviterCode}
        disabled={loading}
        placeholder="Enter inviter code"
      />
      <small class="form-help">Enter the code shared by someone who invited you</small>
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        bind:value={password}
        required
        disabled={loading}
        placeholder="Create a password"
        minlength="6"
      />
    </div>
    
    <div class="form-group">
      <label for="confirmPassword">Confirm Password</label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        bind:value={confirmPassword}
        required
        disabled={loading}
        placeholder="Confirm your password"
      />
    </div>
    
    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
    
    <button type="submit" class="btn btn-primary" disabled={loading}>
      {loading ? 'Creating Account...' : 'Create Account'}
    </button>
  </form>
  
  <div class="auth-divider">
    <span>or</span>
  </div>
  
  <form method="POST" action="?/oauthGoogle">
    <input type="hidden" name="inviterCode" value={inviterCode} />
    {#if data.fromAssessment && learningPathIds.length > 0}
      <input type="hidden" name="learningPaths" value={learningPathIds.join(',')} />
    {/if}
    <button 
      type="submit" 
      class="btn btn-google" 
      disabled={loading}
    >
      <i class="fab fa-google"></i>
      Continue with Google
    </button>
  </form>
  
  <div class="auth-links">
    <a href="/auth/signin">Already have an account? Sign in</a>
  </div>
</div>

<style>
  .auth-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
  }
  
  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .auth-header h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
  }
  
  .auth-header p {
    margin: 0;
    color: var(--text-secondary);
  }

  .personalized-paths {
    background: linear-gradient(135deg, rgba(88, 204, 2, 0.05), rgba(28, 176, 246, 0.05));
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin-top: var(--space-4);
    border: 1px solid rgba(88, 204, 2, 0.2);
  }

  .paths-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    color: var(--text-inverse);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: var(--space-3);
  }

  .paths-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: var(--space-3);
    line-height: 1.5;
  }

  .paths-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .path-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .path-item i {
    color: var(--primary-color);
    font-size: 0.875rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .form-help {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  
  .error-message {
    background: var(--error-bg);
    color: var(--error-color);
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .btn {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 1rem;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: var(--primary-color);
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
  }
  
  .btn-google {
    background: white;
    color: #333;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .btn-google:hover:not(:disabled) {
    background: var(--hover-bg);
  }
  
  .auth-divider {
    text-align: center;
    margin: 1.5rem 0;
    position: relative;
  }
  
  .auth-divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--border-color);
  }
  
  .auth-divider span {
    background: var(--card-bg);
    padding: 0 1rem;
    color: var(--text-secondary);
  }
  
  .auth-links {
    text-align: center;
    margin-top: 1.5rem;
  }
  
  .auth-links a {
    display: block;
    color: var(--primary-color);
    text-decoration: none;
    margin-bottom: 0.5rem;
  }
  
  .auth-links a:hover {
    text-decoration: underline;
  }
</style>