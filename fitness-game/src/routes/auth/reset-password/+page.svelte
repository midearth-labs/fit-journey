<script lang="ts">
  import { createClient } from '$lib/auth/supabase'
  
  let email = $state('')
  let loading = $state(false)
  let error = $state('')
  let success = $state(false)
  
  const supabase = createClient()
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    
    if (!email) {
      error = 'Please enter your email address'
      return
    }
    
    loading = true
    error = ''
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (resetError) throw resetError
      
      success = true
    } catch (err: any) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Reset Password - FitJourney</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-form">
      <div class="auth-header">
        <h2>Reset Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password</p>
      </div>
      
      {#if success}
        <div class="success-message">
          <i class="fas fa-check-circle"></i>
          <h3>Check your email</h3>
          <p>We've sent a password reset link to <strong>{email}</strong></p>
          <a href="/auth/signin" class="btn btn-primary">Back to Sign In</a>
        </div>
      {:else}
        <form onsubmit={handleSubmit}>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          
          {#if error}
            <div class="error-message">
              {error}
            </div>
          {/if}
          
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div class="auth-links">
          <a href="/auth/signin">Back to Sign In</a>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-gradient);
    padding: 2rem;
  }
  
  .auth-container {
    width: 100%;
    max-width: 500px;
  }
  
  .auth-form {
    background: var(--card-bg);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    padding: 2rem;
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
  
  .error-message {
    background: var(--error-bg);
    color: var(--error-color);
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
  
  .success-message {
    text-align: center;
    padding: 2rem 0;
  }
  
  .success-message i {
    font-size: 3rem;
    color: var(--success-color);
    margin-bottom: 1rem;
  }
  
  .success-message h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }
  
  .success-message p {
    margin: 0 0 2rem 0;
    color: var(--text-secondary);
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
  
  .auth-links {
    text-align: center;
    margin-top: 1.5rem;
  }
  
  .auth-links a {
    color: var(--primary-color);
    text-decoration: none;
  }
  
  .auth-links a:hover {
    text-decoration: underline;
  }
</style>
