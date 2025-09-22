<script lang="ts">
  import { createClient } from '$lib/auth/supabase'
  import { goto } from '$app/navigation'
  
  interface Props {
    data: {
      inviterCode?: string | null
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
  
  const supabase = createClient()
  
  // UUID validation function
  function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
  
  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      error = 'Please fill in all fields'
      return
    }
    
    if (password !== confirmPassword) {
      error = 'Passwords do not match'
      return
    }
    
    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }
    
    // Validate inviterCode if provided
    if (inviterCode && !isValidUUID(inviterCode)) {
      error = 'Invalid inviter code format'
      return
    }
    
    loading = true
    error = ''
    
    try {
      // Prepare metadata
      const metadata: Record<string, any> = {}
      if (displayName.trim()) {
        metadata.name = displayName.trim()
      }
      if (inviterCode && isValidUUID(inviterCode)) {
        metadata.inviter_code = inviterCode
      }
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })
      
      if (signUpError) throw signUpError
      
      goto('/')
    } catch (err: any) {
      error = err.message
    } finally {
      loading = false
    }
  }
  
  async function handleGoogleSignIn() {
    loading = true
    error = ''
    
    try {
      // Build redirect URL with inviterCode if provided
      let redirectUrl = `${window.location.origin}/auth/callback`
      if (inviterCode && isValidUUID(inviterCode)) {
        redirectUrl += `?inviterCode=${encodeURIComponent(inviterCode)}`
      }
      
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      })
      
      if (signInError) throw signInError
    } catch (err: any) {
      error = err.message
      loading = false
    }
  }
</script>

<div class="auth-form">
  <div class="auth-header">
    <h2>Sign Up</h2>
    <p>Join FitJourney and start your fitness journey</p>
  </div>
  
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
    
    <div class="form-group">
      <label for="displayName">Display Name (Optional)</label>
      <input
        id="displayName"
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
  
  <button 
    type="button" 
    class="btn btn-google" 
    onclick={handleGoogleSignIn}
    disabled={loading}
  >
    <i class="fab fa-google"></i>
    Continue with Google
  </button>
  
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
