<script lang="ts">
  import SignUpForm from '$lib/components/auth/SignUpForm.svelte'
</script>

<svelte:head>
  <title>Sign Up - FitJourney</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <SignUpForm />
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
