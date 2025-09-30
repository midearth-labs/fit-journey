# Effective Data Fetching in Svelte 5

A comprehensive guide to avoid common pitfalls and optimize performance when fetching data in Svelte 5 applications.

---

## Core Principles

### 1. Avoid Excessive Network Calls

Repeatedly triggering network calls inside reactive statements can severely impact your app's responsiveness. With Svelte 5's new runes system, it's crucial to properly manage side effects to prevent accidental multiple fetches.

**Key Stats:**
- Reducing API overcalls by 30% can decrease page load times by nearly 20% on average
- Proper caching can reduce redundant data transfers by up to 40%

### 2. Implement Smart Caching

Cache fetched results locally to prevent redundant round-trips and speed up component rendering. This is especially important when navigating between routes that rely on the same endpoint.

### 3. Lifecycle Awareness

Always clean up requests when components unmount. Use AbortController with fetch to ensure cancelled requests don't pile up, potentially reducing memory consumption by up to 15%.

---

## Svelte 5 Updates: Key Changes

### Reactive Declarations → Runes

**Svelte 4:**
```javascript
let count = 0;
$: doubled = count * 2;
```

**Svelte 5:**
```javascript
let count = $state(0);
let doubled = $derived(count * 2);
```

### Effects for Side Effects

**Svelte 4:**
```javascript
$: {
  fetchData(userId);
}
```

**Svelte 5:**
```javascript
$effect(() => {
  fetchData(userId);
});
```

---

## Optimizing API Calls

### 1. Throttle and Debounce Requests

Implement debouncing when reacting to user input, especially in search fields. A 300ms delay before firing an API call dramatically cuts redundant traffic.

**Svelte 5 Example:**
```svelte
<script>
  let searchTerm = $state('');
  let debouncedSearch = $state('');
  let timeoutId;

  $effect(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedSearch = searchTerm;
    }, 300);

    return () => clearTimeout(timeoutId);
  });

  $effect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  });

  async function performSearch(term) {
    // API call here
  }
</script>

<input bind:value={searchTerm} placeholder="Search..." />
```

### 2. Batch Requests

Consolidate related queries into a single payload when possible. This can reduce loading times by up to 40%.

**Example:**
```javascript
async function fetchDashboardData() {
  const [users, notifications, activity] = await Promise.all([
    fetch('/api/users').then(r => r.json()),
    fetch('/api/notifications').then(r => r.json()),
    fetch('/api/activity').then(r => r.json())
  ]);

  return { users, notifications, activity };
}
```

### 3. Use AbortController for Cleanup

```svelte
<script>
  import { onMount } from 'svelte';

  let data = $state(null);
  let loading = $state(false);

  onMount(() => {
    const controller = new AbortController();
    
    async function fetchData() {
      loading = true;
      try {
        const response = await fetch('/api/data', {
          signal: controller.signal
        });
        data = await response.json();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch failed:', error);
        }
      } finally {
        loading = false;
      }
    }

    fetchData();

    return () => controller.abort();
  });
</script>
```

---

## Choosing the Right Fetching Strategy

### On-Demand Loading

Best for:
- Unpredictable user journeys
- Lower initial payload requirements
- Reducing memory footprint

**Pros:** Lower initial load, better for diverse paths
**Cons:** Potential delays during interaction

### Pre-Fetching

Best for:
- Predictable workflows
- Critical resources
- Guided user flows

**Pros:** Smooth transitions, reduced wait times
**Cons:** Wasteful if overused, increased initial load

### Hybrid Approach

Prioritize pre-loading for above-the-fold content, defer other requests until user interaction.

---

## Error Handling and Graceful Degradation

### Implement Exponential Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, i) + Math.random() * 1000, 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### User-Friendly Error Messages

Provide context-aware error messages:
- Distinguish between authentication errors and server timeouts
- Show cached content during connectivity issues
- Include actionable next steps

---

## Component Performance Optimization

### 1. Minimize Reactive Dependencies

**Svelte 5 Approach:**
```svelte
<script>
  let user = $state({ name: '', email: '', age: 0 });
  
  // Only derive what's needed
  let displayName = $derived(user.name.toUpperCase());
  
  // Avoid recalculating unnecessarily
  let isAdult = $derived(user.age >= 18);
</script>
```

### 2. Use Fine-Grained Reactivity

Break state into smaller, focused pieces:

```javascript
// Instead of:
let appState = $state({
  users: [],
  posts: [],
  comments: [],
  settings: {}
});

// Prefer:
let users = $state([]);
let posts = $state([]);
let comments = $state([]);
let settings = $state({});
```

### 3. Memoize Expensive Computations

```javascript
let items = $state([]);
let filter = $state('');

// Automatically memoized by Svelte 5
let filteredItems = $derived(
  items.filter(item => item.name.includes(filter))
);
```

---

## Svelte 5 State Management with Runes

### Basic Store Pattern

**store.svelte.js:**
```javascript
export function createUserStore() {
  let user = $state(null);
  let loading = $state(false);
  let error = $state(null);

  async function fetchUser(id) {
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      user = await response.json();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function reset() {
    user = null;
    loading = false;
    error = null;
  }

  return {
    get user() { return user; },
    get loading() { return loading; },
    get error() { return error; },
    fetchUser,
    reset
  };
}
```

**Usage:**
```svelte
<script>
  import { createUserStore } from './stores/user.svelte.js';

  const userStore = createUserStore();
  const { user, loading, error } = $derived(userStore);

  onMount(() => {
    userStore.fetchUser(123);
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else if user}
  <p>Welcome, {user.name}!</p>
{/if}
```

---

## TanStack Query-Like Implementation

This implementation provides a reactive query wrapper with features similar to TanStack Query:
- Automatic caching
- Background refetching
- Stale-while-revalidate
- Loading and error states
- Request deduplication

### Core Query Store

**query.svelte.js:**
```javascript
class QueryCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.staleTime) {
      return { ...entry, isStale: true };
    }
    
    return { ...entry, isStale: false };
  }

  set(key, data, staleTime) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime
    });
  }

  invalidate(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const globalCache = new QueryCache();

export function createQuery(options) {
  const {
    queryKey,
    queryFn,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    cacheTime = 10 * 60 * 1000, // 10 minutes default
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    retry = 3,
    retryDelay = (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled = true,
    onSuccess,
    onError
  } = options;

  // Reactive state
  let data = $state(null);
  let error = $state(null);
  let isLoading = $state(false);
  let isFetching = $state(false);
  let isError = $state(false);
  let isSuccess = $state(false);
  let isStale = $state(false);
  let status = $state('idle'); // 'idle' | 'loading' | 'success' | 'error'

  let abortController = null;
  let lastFetchTime = 0;
  let fetchPromise = null;

  // Generate cache key from queryKey array
  const cacheKey = JSON.stringify(queryKey);

  // Initialize from cache if available
  const cached = globalCache.get(cacheKey);
  if (cached) {
    data = cached.data;
    isStale = cached.isStale;
    status = 'success';
    isSuccess = true;
  }

  async function executeFetch(retryCount = 0) {
    // Prevent duplicate requests
    if (fetchPromise) return fetchPromise;

    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    isFetching = true;

    if (!data) {
      isLoading = true;
      status = 'loading';
    }

    fetchPromise = (async () => {
      try {
        const result = await queryFn({ 
          signal: abortController.signal,
          queryKey 
        });

        data = result;
        error = null;
        isError = false;
        isSuccess = true;
        isStale = false;
        status = 'success';
        lastFetchTime = Date.now();

        // Update cache
        globalCache.set(cacheKey, result, staleTime);

        onSuccess?.(result);

        return result;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }

        if (retryCount < retry) {
          const delay = retryDelay(retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeFetch(retryCount + 1);
        }

        error = err;
        isError = true;
        isSuccess = false;
        status = 'error';

        onError?.(err);

        throw err;
      } finally {
        isLoading = false;
        isFetching = false;
        fetchPromise = null;
        abortController = null;
      }
    })();

    return fetchPromise;
  }

  // Check if data is stale and refetch in background
  async function refetchIfStale() {
    const cached = globalCache.get(cacheKey);
    if (cached && cached.isStale && !isFetching) {
      isStale = true;
      await executeFetch();
    }
  }

  // Manual refetch
  async function refetch() {
    globalCache.invalidate(cacheKey);
    return executeFetch();
  }

  // Invalidate and refetch
  function invalidate() {
    globalCache.invalidate(cacheKey);
    isStale = true;
  }

  // Initial fetch effect
  $effect(() => {
    if (!enabled) return;

    const cached = globalCache.get(cacheKey);
    
    if (!cached || (refetchOnMount && cached.isStale)) {
      executeFetch();
    } else if (cached) {
      data = cached.data;
      isStale = cached.isStale;
      status = 'success';
      isSuccess = true;
      
      if (cached.isStale) {
        refetchIfStale();
      }
    }

    // Handle window focus refetch
    if (refetchOnWindowFocus) {
      const handleFocus = () => refetchIfStale();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  });

  return {
    get data() { return data; },
    get error() { return error; },
    get isLoading() { return isLoading; },
    get isFetching() { return isFetching; },
    get isError() { return isError; },
    get isSuccess() { return isSuccess; },
    get isStale() { return isStale; },
    get status() { return status; },
    refetch,
    invalidate
  };
}

// Mutation helper
export function createMutation(options) {
  const {
    mutationFn,
    onSuccess,
    onError,
    onSettled
  } = options;

  let data = $state(null);
  let error = $state(null);
  let isLoading = $state(false);
  let isError = $state(false);
  let isSuccess = $state(false);
  let status = $state('idle');

  async function mutate(variables) {
    isLoading = true;
    status = 'loading';
    error = null;
    isError = false;
    isSuccess = false;

    try {
      const result = await mutationFn(variables);
      
      data = result;
      isSuccess = true;
      status = 'success';
      
      onSuccess?.(result, variables);
      
      return result;
    } catch (err) {
      error = err;
      isError = true;
      status = 'error';
      
      onError?.(err, variables);
      
      throw err;
    } finally {
      isLoading = false;
      onSettled?.(data, error, variables);
    }
  }

  function reset() {
    data = null;
    error = null;
    isLoading = false;
    isError = false;
    isSuccess = false;
    status = 'idle';
  }

  return {
    get data() { return data; },
    get error() { return error; },
    get isLoading() { return isLoading; },
    get isError() { return isError; },
    get isSuccess() { return isSuccess; },
    get status() { return status; },
    mutate,
    mutateAsync: mutate,
    reset
  };
}

// Global cache invalidation helper
export function invalidateQueries(queryKey) {
  const cacheKey = queryKey ? JSON.stringify(queryKey) : null;
  globalCache.invalidate(cacheKey);
}
```

### Usage Examples

#### Basic Query

```svelte
<script>
  import { createQuery } from './lib/query.svelte.js';

  const userQuery = createQuery({
    queryKey: ['user', userId],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/users/${userId}`, { signal });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });
</script>

{#if userQuery.isLoading}
  <p>Loading user...</p>
{:else if userQuery.isError}
  <p>Error: {userQuery.error.message}</p>
  <button onclick={() => userQuery.refetch()}>Retry</button>
{:else if userQuery.isSuccess}
  <div>
    <h2>{userQuery.data.name}</h2>
    {#if userQuery.isStale || userQuery.isFetching}
      <span>Updating...</span>
    {/if}
  </div>
{/if}
```

#### Dependent Queries

```svelte
<script>
  import { createQuery } from './lib/query.svelte.js';

  let userId = $state(null);

  const userQuery = createQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      return res.json();
    },
    enabled: !!userId
  });

  const postsQuery = createQuery({
    queryKey: ['posts', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}/posts`);
      return res.json();
    },
    enabled: !!userId && userQuery.isSuccess
  });
</script>
```

#### Mutations with Cache Invalidation

```svelte
<script>
  import { createMutation, invalidateQueries } from './lib/query.svelte.js';

  const createPostMutation = createMutation({
    mutationFn: async (newPost) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch posts
      invalidateQueries(['posts']);
    }
  });

  async function handleSubmit(event) {
    const formData = new FormData(event.target);
    const newPost = Object.fromEntries(formData);
    
    try {
      await createPostMutation.mutate(newPost);
      alert('Post created!');
    } catch (error) {
      console.error(error);
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <input name="title" required />
  <button type="submit" disabled={createPostMutation.isLoading}>
    {createPostMutation.isLoading ? 'Creating...' : 'Create Post'}
  </button>
</form>
```

#### Paginated Query

```svelte
<script>
  import { createQuery } from './lib/query.svelte.js';

  let page = $state(1);

  const postsQuery = createQuery({
    queryKey: ['posts', { page }],
    queryFn: async () => {
      const res = await fetch(`/api/posts?page=${page}&limit=10`);
      return res.json();
    },
    staleTime: 30 * 1000 // 30 seconds
  });

  function nextPage() {
    page += 1;
  }

  function prevPage() {
    if (page > 1) page -= 1;
  }
</script>

{#if postsQuery.isLoading}
  <p>Loading posts...</p>
{:else if postsQuery.data}
  <div>
    {#each postsQuery.data.posts as post}
      <article>{post.title}</article>
    {/each}
    
    <nav>
      <button onclick={prevPage} disabled={page === 1}>Previous</button>
      <span>Page {page}</span>
      <button onclick={nextPage}>Next</button>
    </nav>
    
    {#if postsQuery.isFetching}
      <span>Refreshing...</span>
    {/if}
  </div>
{/if}
```

#### Search with Debouncing

```svelte
<script>
  import { createQuery } from './lib/query.svelte.js';

  let searchTerm = $state('');
  let debouncedTerm = $state('');
  let timeoutId;

  $effect(() => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedTerm = searchTerm;
    }, 300);
    
    return () => clearTimeout(timeoutId);
  });

  const searchQuery = createQuery({
    queryKey: ['search', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm) return [];
      const res = await fetch(`/api/search?q=${debouncedTerm}`);
      return res.json();
    },
    enabled: debouncedTerm.length > 0,
    staleTime: 60 * 1000 // 1 minute
  });
</script>

<input 
  type="search" 
  bind:value={searchTerm} 
  placeholder="Search..."
/>

{#if searchQuery.isFetching}
  <p>Searching...</p>
{:else if searchQuery.data}
  <ul>
    {#each searchQuery.data as result}
      <li>{result.name}</li>
    {/each}
  </ul>
{/if}
```

---

## Data Structure Optimization

### Use Maps Instead of Arrays for Lookups

```javascript
// Instead of O(n) lookup
let users = $state([]);
const user = users.find(u => u.id === targetId); // O(n)

// Use O(1) lookup
let usersMap = $state(new Map());
const user = usersMap.get(targetId); // O(1)
```

### Normalize Nested Data

```javascript
// Flatten hierarchical data
const normalizedData = {
  posts: new Map(),
  comments: new Map(),
  users: new Map()
};

// Instead of nested structure
const post = {
  id: 1,
  author: { id: 1, name: 'John' },
  comments: [
    { id: 1, author: { id: 2, name: 'Jane' }, text: '...' }
  ]
};

// Use references
const normalizedPost = {
  id: 1,
  authorId: 1,
  commentIds: [1]
};
```

---

## Lazy Loading Implementation

### With Intersection Observer

```svelte
<script>
  import { onMount } from 'svelte';

  let data = $state([]);
  let loading = $state(false);
  let page = $state(1);
  let loadMoreRef;

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef) {
      observer.observe(loadMoreRef);
    }

    return () => observer.disconnect();
  });

  async function loadMore() {
    loading = true;
    try {
      const response = await fetch(`/api/items?page=${page}`);
      const newItems = await response.json();
      data = [...data, ...newItems];
      page += 1;
    } finally {
      loading = false;
    }
  }
</script>

<div>
  {#each data as item}
    <article>{item.title}</article>
  {/each}
  
  <div bind:this={loadMoreRef}>
    {#if loading}
      <p>Loading more...</p>
    {/if}
  </div>
</div>
```

---

## Best Practices Summary

1. **Use Svelte 5 Runes Properly**
   - `$state()` for reactive values
   - `$derived()` for computed values
   - `$effect()` for side effects with cleanup

2. **Implement Smart Caching**
   - Cache API responses with appropriate stale times
   - Use cache keys based on query parameters
   - Implement background refetching for stale data

3. **Optimize Network Requests**
   - Debounce user input (300ms recommended)
   - Batch related requests when possible
   - Use AbortController for cleanup

4. **Handle Errors Gracefully**
   - Implement exponential backoff for retries
   - Provide clear, actionable error messages
   - Show cached data during connectivity issues

5. **Structure Data Efficiently**
   - Use Maps for O(1) lookups instead of arrays
   - Normalize nested data structures
   - Keep state granular and focused

6. **Lazy Load When Appropriate**
   - Use Intersection Observer for infinite scroll
   - Load components on-demand with dynamic imports
   - Prioritize critical content, defer the rest

7. **Monitor Performance**
   - Track Time to Interactive (TTI)
   - Monitor Core Web Vitals
   - Use browser DevTools for network analysis

---

## Migration Guide: Svelte 4 → Svelte 5

### Stores to Runes

**Before (Svelte 4):**
```javascript
import { writable, derived } from 'svelte/store';

const count = writable(0);
const doubled = derived(count, $count => $count * 2);
```

**After (Svelte 5):**
```javascript
let count = $state(0);
let doubled = $derived(count * 2);
```

### Reactive Statements to Effects

**Before (Svelte 4):**
```javascript
$: {
  console.log('Count changed:', count);
}
```

**After (Svelte 5):**
```javascript
$effect(() => {
  console.log('Count changed:', count);
});
```

### Component Props

**Before (Svelte 4):**
```javascript
export let name;
export let age = 0;
```

**After (Svelte 5):**
```javascript
let { name, age = 0 } = $props();
```

