<script lang="ts">
  import SignUpForm from '$lib/components/auth/SignUpForm.svelte'
  import type { PageData } from './$types'
  
  const { data } = $props<{ data: PageData }>()
  
  // Transform page data to component data
  const signUpData = {
    inviterCode: data.inviterCode,
    fromAssessment: data.fromAssessment
  }
</script>

<svelte:head>
  <title>Sign Up - FitJourney</title>
</svelte:head>

<div class="auth-page">
  <div class="auth-container">
    <SignUpForm data={signUpData} />
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
