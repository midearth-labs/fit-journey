<script lang="ts">
    //@TODO: DELETE
  import { guestGatingStore, type GuestGatingState } from '$lib/stores/guest-gating';
  import { AuthUtils } from '$lib/utils/auth-utils';
  import GuestGatingModal from '$lib/components/GuestGatingModal.svelte';

  let showModal = $state(false);
  let selectedArticleId = $state('article1');
  let customArticleId = $state('');

  // Generate article options
  const articleOptions = Array.from({ length: 15 }, (_, i) => `article${i + 1}`);

  // Modern Svelte 5 approach: $effect with automatic cleanup
  let storeState = $state<GuestGatingState>({
    articlesRead: [],
    nudgeShownCount: 0,
    lastNudgeDismissedAt: null,
    articlesReadAtLastNudge: null,
    isRegistered: false,
  });

  let gatingState = $derived(storeState);
  let nextNudgeInfo = $derived(guestGatingStore.getNextNudgeInfo());

  // Modern Svelte 5: $effect handles subscription lifecycle automatically
  $effect(() => {
    const unsubscribe = guestGatingStore.subscribe(state => {
      storeState = state;
    });
    return unsubscribe; // Automatic cleanup when component unmounts
  });

  function simulateArticleRead() {
    const articleId = customArticleId.trim() || selectedArticleId;
    guestGatingStore.logArticleRead(articleId);
    
    // Check if we should show modal
    if (guestGatingStore.shouldShowNudge()) {
      showModal = true;
    }
  }

  function handleCloseModal() {
    showModal = false;
  }

  function resetGatingState() {
    guestGatingStore.reset();
  }

  function clearGatingState() {
    AuthUtils.clearGuestGatingState();
  }

  function markAsRegistered() {
    AuthUtils.markAsRegistered();
  }

  function formatTime(ms: number): string {
    if (ms === 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }
</script>

<div class="gating-test-container">
  <h2>Guest Article Gating Test</h2>
  
  <div class="test-controls">
    <div class="article-selection">
      <h3>Select Article to Read</h3>
      <div class="selection-row">
        <select bind:value={selectedArticleId} class="article-select">
          {#each articleOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
        <span class="or-text">or</span>
        <input 
          type="text" 
          bind:value={customArticleId} 
          placeholder="Custom article ID"
          class="custom-input"
        />
      </div>
      <button class="btn btn-primary" onclick={simulateArticleRead}>
        <i class="fas fa-book"></i>
        Log Article Read
      </button>
    </div>
    
    <div class="control-buttons">
      <button class="btn btn-outline" onclick={resetGatingState}>
        <i class="fas fa-refresh"></i>
        Reset State
      </button>
      
      <button class="btn btn-outline" onclick={clearGatingState}>
        <i class="fas fa-trash"></i>
        Clear State
      </button>
      
      <button class="btn btn-outline" onclick={markAsRegistered}>
        <i class="fas fa-user-check"></i>
        Mark as Registered
      </button>
    </div>
  </div>

  <div class="state-display">
    <div class="state-card">
      <h3>Current State</h3>
      <div class="state-item">
        <span class="label">Articles Read:</span>
        <span class="value">{gatingState.articlesRead.length}</span>
      </div>
      <div class="state-item">
        <span class="label">Article IDs:</span>
        <div class="article-list">
          {#if gatingState.articlesRead.length === 0}
            <span class="no-articles">No articles read yet</span>
          {:else}
            {#each gatingState.articlesRead as articleId}
              <span class="article-tag">{articleId}</span>
            {/each}
          {/if}
        </div>
      </div>
      <div class="state-item">
        <span class="label">Nudges Shown:</span>
        <span class="value">{gatingState.nudgeShownCount}</span>
      </div>
      <div class="state-item">
        <span class="label">Last Nudge Dismissed:</span>
        <span class="value">
          {gatingState.lastNudgeDismissedAt 
            ? new Date(gatingState.lastNudgeDismissedAt).toLocaleTimeString()
            : 'Never'
          }
        </span>
      </div>
      <div class="state-item">
        <span class="label">Articles at Last Nudge:</span>
        <div class="article-list">
          {#if gatingState.articlesReadAtLastNudge === null}
            <span class="no-articles">N/A</span>
          {:else if gatingState.articlesReadAtLastNudge.length === 0}
            <span class="no-articles">No articles</span>
          {:else}
            {#each gatingState.articlesReadAtLastNudge as articleId}
              <span class="article-tag">{articleId}</span>
            {/each}
          {/if}
        </div>
      </div>
      <div class="state-item">
        <span class="label">Is Registered:</span>
        <span class="value">{gatingState.isRegistered ? 'Yes' : 'No'}</span>
      </div>
    </div>

    <div class="state-card">
      <h3>Next Nudge Info</h3>
      <div class="state-item">
        <span class="label">Articles Until Next:</span>
        <span class="value">{nextNudgeInfo.articlesUntilNext}</span>
      </div>
      <div class="state-item">
        <span class="label">Time Until Next:</span>
        <span class="value">{formatTime(nextNudgeInfo.timeUntilNext)}</span>
      </div>
      <div class="state-item">
        <span class="label">Should Show Nudge:</span>
        <span class="value">{guestGatingStore.shouldShowNudge() ? 'Yes' : 'No'}</span>
      </div>
    </div>
  </div>

  <div class="config-info">
    <h3>Configuration</h3>
    <ul>
      <li>First nudge after: <strong>3 articles</strong></li>
      <li>Subsequent nudges after: <strong>2 articles</strong></li>
      <li>Time before re-nudge: <strong>24 hours</strong></li>
    </ul>
  </div>

  <div class="test-instructions">
    <h3>Test Instructions</h3>
    <ol>
      <li>Click "Simulate Article Read" 3 times to trigger the first nudge</li>
      <li>Dismiss the modal and continue reading articles</li>
      <li>After 2 more articles or 24 hours, the nudge should appear again</li>
      <li>Use "Mark as Registered" to simulate user registration</li>
      <li>Use "Clear State" to simulate successful login clearing the state</li>
    </ol>
  </div>
</div>

<!-- Guest Gating Modal -->
<GuestGatingModal 
  isOpen={showModal} 
  onClose={handleCloseModal} 
/>

<style>
  .gating-test-container {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--space-6);
  }

  .test-controls {
    display: flex;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
  }

  .article-selection {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    border: 1px solid var(--gray-200);
    flex: 1;
    min-width: 300px;
  }

  .article-selection h3 {
    margin: 0 0 var(--space-3);
    color: var(--text-primary);
    font-size: 1.1rem;
  }

  .selection-row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    flex-wrap: wrap;
  }

  .article-select {
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    background: var(--bg-subtle);
    color: var(--text-primary);
    font-size: 0.9rem;
    min-width: 120px;
  }

  .or-text {
    color: var(--text-secondary);
    font-size: 0.9rem;
    font-weight: 500;
  }

  .custom-input {
    padding: var(--space-2) var(--space-3);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    background: var(--bg-subtle);
    color: var(--text-primary);
    font-size: 0.9rem;
    min-width: 150px;
    flex: 1;
  }

  .custom-input:focus {
    border-color: var(--primary-color);
    outline: none;
  }

  .control-buttons {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .article-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .article-tag {
    background: var(--primary-color);
    color: white;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    font-size: 0.8rem;
    font-weight: 500;
  }

  .no-articles {
    color: var(--text-secondary);
    font-style: italic;
    font-size: 0.9rem;
  }

  .state-display {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .state-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    border: 1px solid var(--gray-200);
  }

  .state-card h3 {
    margin: 0 0 var(--space-3);
    color: var(--text-primary);
    font-size: 1.1rem;
  }

  .state-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--space-2);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--gray-100);
  }

  .state-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .label {
    font-weight: 500;
    color: var(--text-secondary);
  }

  .value {
    font-weight: 600;
    color: var(--text-primary);
  }

  .config-info,
  .test-instructions {
    background: var(--bg-subtle);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin-bottom: var(--space-4);
    border: 1px solid var(--gray-200);
  }

  .config-info h3,
  .test-instructions h3 {
    margin: 0 0 var(--space-3);
    color: var(--text-primary);
  }

  .config-info ul,
  .test-instructions ol {
    margin: 0;
    padding-left: var(--space-4);
  }

  .config-info li,
  .test-instructions li {
    margin-bottom: var(--space-2);
    color: var(--text-secondary);
  }

  .config-info strong {
    color: var(--primary-color);
  }

  /* Dark theme support */
  [data-theme="dark"] .state-card,
  [data-theme="dark"] .config-info,
  [data-theme="dark"] .test-instructions,
  [data-theme="dark"] .article-selection {
    background: var(--bg-card-dark);
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .state-item {
    border-color: var(--gray-700);
  }

  [data-theme="dark"] .article-select,
  [data-theme="dark"] .custom-input {
    background: var(--bg-subtle-dark);
    border-color: var(--gray-700);
    color: var(--text-primary-dark);
  }

  [data-theme="dark"] .custom-input:focus {
    border-color: var(--primary-color);
  }
</style>
