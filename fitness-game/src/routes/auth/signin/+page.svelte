<script lang="ts">
  import SignInForm from '$lib/components/auth/SignInForm.svelte'
</script>

<svelte:head>
  <title>Sign In - FitJourney</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <SignInForm />
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
</style>
