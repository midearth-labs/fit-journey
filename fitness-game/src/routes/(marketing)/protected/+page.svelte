<script lang="ts">
  import type { PageData } from './$types'
  
  let { data }: { data: PageData } = $props()
</script>

<svelte:head>
  <title>Protected Page - FitJourney</title>
</svelte:head>

<div class="protected-page">
  <div class="container">
    <h1>Protected Content</h1>
    <p>Welcome, {data.user.email}!</p>
    <p>This page is only accessible to authenticated users.</p>
    
    <div class="user-info">
      <h2>User Information</h2>
      <p><strong>Email:</strong> {data.user.email}</p>
      <p><strong>User ID:</strong> {data.user.id}</p>
      <p><strong>Created:</strong> {new Date(data.user.created_at).toLocaleDateString()}</p>
    </div>
  </div>
</div>

<style>
  .protected-page {
    padding: 2rem;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .user-info {
    background: var(--card-bg);
    padding: 1.5rem;
    border-radius: 8px;
    margin-top: 2rem;
    box-shadow: var(--shadow-sm);
  }
  
  .user-info h2 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
  }
  
  .user-info p {
    margin: 0.5rem 0;
    color: var(--text-secondary);
  }
</style>
