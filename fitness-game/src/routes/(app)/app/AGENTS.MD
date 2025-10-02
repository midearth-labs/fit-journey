
You are an expert in Svelte 5, SvelteKit, TypeScript, and modern web development.

Key Principles
- Write concise, technical code with accurate Svelte 5 and SvelteKit examples.
- Leverage SvelteKit's client-side rendering (CSR) capabilities ONLY.
- Use descriptive variable names and follow Svelte and SvelteKit conventions.
- Organize files using SvelteKit's file-based routing system.

Code Style and Structure
- Write concise, technical TypeScript or JavaScript code with accurate examples.
- Use functional and declarative programming patterns; avoid unnecessary classes except for state machines.
- Prefer iteration and modularization over code duplication.
- Structure files: component logic, markup, styles, helpers, types.
- Follow Svelte's official documentation for setup and configuration: https://svelte.dev/docs

Naming Conventions
- Use lowercase with hyphens for component files (e.g., `components/auth-form.svelte`).
- Use PascalCase for component names in imports and usage.
- Use camelCase for variables, functions, and props.

TypeScript Usage
- Use TypeScript for all code; prefer types over interfaces.
- Avoid enums; use const objects instead.
- Use functional components with TypeScript interfaces for props.
- Enable strict mode in TypeScript for better type safety.

Svelte Runes
- `$state`: Declare reactive state
  ```typescript
  let count = $state(0);
  ```
- `$derived`: Compute derived values
  ```typescript
  let doubled = $derived(count * 2);
  ```
- `$effect`: Manage side effects and lifecycle
  ```typescript
  $effect(() => {
    console.log(`Count is now ${count}`);
  });
  ```
- `$props`: Declare component props
  ```typescript
  let { optionalProp = 42, requiredProp } = $props();
  ```
- `$bindable`: Create two-way bindable props (IF NEEDED)
  ```typescript
  let { bindableProp = $bindable() } = $props();
  ```
- `$inspect`: Debug reactive state (development only)
  ```typescript
  $inspect(count);
  ```

UI and Styling
- Use Tailwind CSS for utility-first styling approach.
- Leverage Shadcn components for pre-built, customizable UI elements.
- Import Shadcn components from `$lib/components/ui`.
- Organize Tailwind classes using the `cn()` utility from `$lib/utils`.
- Use Svelte's built-in transition and animation features.
- Use Talwind reference: "@import "tailwindcss" reference;
- Use latest Tailwind utility classes

Shadcn Color Conventions
- Use `background` and `foreground` convention for colors.
- Define CSS variables without color space function:
  ```css
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  ```
- Usage example:
  ```svelte
  <div class="bg-primary text-primary-foreground">Hello</div>
  ```
- Key color variables:
  - `--background`, `--foreground`: Default body colors
  - `--muted`, `--muted-foreground`: Muted backgrounds
  - `--card`, `--card-foreground`: Card backgrounds
  - `--popover`, `--popover-foreground`: Popover backgrounds
  - `--border`: Default border color
  - `--input`: Input border color
  - `--primary`, `--primary-foreground`: Primary button colors
  - `--secondary`, `--secondary-foreground`: Secondary button colors
  - `--accent`, `--accent-foreground`: Accent colors
  - `--destructive`, `--destructive-foreground`: Destructive action colors
  - `--ring`: Focus ring color
  - `--radius`: Border radius for components

SvelteKit Project Structure
- Use the recommended SvelteKit project structure:
  ```
  - src/
    - lib/
    - routes/
    - app.html
  - static/
  - svelte.config.js
  - vite.config.js
  ```

Component Development
- Create .svelte files for Svelte components.
- Use .svelte.ts files for component logic and state machines.
- Implement proper component composition and reusability.
- Use Svelte's props for data passing.
- Leverage Svelte's reactive declarations for local state management.

State Management
- Use classes for complex state management (state machines):
  ```typescript
  // counter.svelte.ts
  class Counter {
    count = $state(0);
    incrementor = $state(1);
    
    increment() {
      this.count += this.incrementor;
    }
    
    resetCount() {
      this.count = 0;
    }
    
    resetIncrementor() {
      this.incrementor = 1;
    }
  }

  export const counter = new Counter();
  ```
- Use in components:
  ```svelte
  <script lang="ts">
  import { counter } from './counter.svelte.ts';
  </script>

  <button on:click={() => counter.increment()}>
    Count: {counter.count}
  </button>
  ```

Routing and Pages
- Utilize SvelteKit's file-based routing system in the src/routes/ directory.
- Implement dynamic routes using [slug] syntax.
- Use load functions for client-side data fetching.
- Implement proper error handling with +error.svelte pages.

Performance Optimization
- Leverage Svelte's compile-time optimizations.
- Use `{#key}` blocks to force re-rendering of components when needed.
- Implement code splitting using dynamic imports for large applications.
- Profile and monitor performance using browser developer tools.
- Use `$effect.tracking()` to optimize effect dependencies.
- Implement proper lazy loading for images and other assets.

SEO and Meta Tags
- Do not worry about SEO within this dashboard. 

Accessibility
- Ensure proper semantic HTML structure in Svelte components.
- Implement ARIA attributes where necessary.
- Ensure keyboard navigation support for interactive elements.
- Use Svelte's bind:this for managing focus programmatically.

Key Conventions
1. Embrace Svelte's simplicity and avoid over-engineering solutions.
5. Follow Svelte's best practices for component composition and state management.
6. Ensure cross-browser compatibility by testing on multiple platforms.

Documentation
- Svelte 5 Runes: https://svelte-5-preview.vercel.app/docs/runes
- Svelte Documentation: https://svelte.dev/docs
- SvelteKit Documentation: https://kit.svelte.dev/docs
- Paraglide.js Documentation: https://inlang.com/m/gerre34r/library-inlang-paraglideJs/usage

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

*CRITICAL*
- This directory and sub-directories contain CSR Only pages. Do not use SSR or SSG. Use dynamic imports to help with javascript asset loading performance.

---

## FitJourney Dashboard Architecture

### Design System

#### ShadCN Svelte Integration

Use ShadCN Svelte components for consistent, accessible UI:

```bash
# Install components as needed
npx shadcn-svelte@latest add [component-name]
```

Do not use module scripts within "filename.svelte" files, the exports wont work, rather put the exports and types in "filename.ts", and then have "filename.svelte" import what it needs from those. 
```
<script lang="ts" module>
</script>
```
Use "bind:value" where needed as opposed to manual value/state setting via callbacks. 
Avoid the use of "any", or unnecessary type casting and also assuming field properties, rather inspect the type structure of all APIS or static content request and responses and use those exactly.


**Installed Components:**
- `card` - Container components
- `sidebar` - Navigation sidebar
- `button` - Interactive buttons
- `badge` - Status indicators
- `progress` - Progress bars
- `tabs` - Tabbed content
- `skeleton` - Loading states
- `tooltip` - Contextual help
- `separator` - Visual dividers
- `sheet` - Modal overlays

**Usage:**
```svelte
<script>
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Header>
  <Card.Content>
    <!-- Content -->
  </Card.Content>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card.Root>
```

#### Theme Configuration (OKLCH Color Space)

**Centralized Theme Location:**
- Primary: `/src/app.css` - CSS variables
- Secondary: `/src/lib/config/theme.ts` - Programmatic access

**Light Green Theme (Default):**
```css
:root {
  /* Primary - Fresh Green */
  --primary: oklch(0.55 0.15 150);
  --primary-foreground: oklch(0.99 0.005 142);
  
  /* Secondary - Light Green */
  --secondary: oklch(0.95 0.02 145);
  --secondary-foreground: oklch(0.25 0.04 152);
  
  /* Accent - Vibrant Green */
  --accent: oklch(0.92 0.03 145);
  --accent-foreground: oklch(0.25 0.04 152);
  
  /* Muted - Very Light Green */
  --muted: oklch(0.96 0.01 145);
  --muted-foreground: oklch(0.48 0.02 152);
  
  /* Chart colors - Green themed */
  --chart-1: oklch(0.55 0.15 150);
  --chart-2: oklch(0.65 0.12 160);
  --chart-3: oklch(0.45 0.18 145);
  --chart-4: oklch(0.75 0.10 155);
  --chart-5: oklch(0.60 0.13 148);
}
```

**OKLCH Format:** `oklch(L C H)`
- **L** (Lightness): 0-1 (0=black, 1=white)
- **C** (Chroma): 0+ (saturation)
- **H** (Hue): 0-360° (150°=green, 240°=blue, 310°=purple)

**Quick Theme Change:**
```css
/* Blue Theme: Change hue from 150 to 240 */
--primary: oklch(0.55 0.15 240);

/* Purple Theme: Change hue from 150 to 310 */
--primary: oklch(0.55 0.15 310);
```

#### Icon System (Lucide Svelte)

Use lucide-svelte for consistent iconography:

```svelte
<script>
  import { Home, BookOpen, Trophy, Settings } from 'lucide-svelte';
</script>

<Home class="h-4 w-4" />
<BookOpen class="h-5 w-5 text-primary" />
```

**Dynamic Icons (Svelte 5):**
```svelte
<script>
  import { Home } from 'lucide-svelte';
  
  let { icon } = $props();
</script>

<!-- Svelte 5 - components are dynamic by default -->
<icon.component class="h-4 w-4" />
```

---

### Layout Architecture

#### Full-Width Dashboard Layout

**Structure:**
```
├── Sidebar (collapsible)
│   ├── Header (logo/brand)
│   ├── Main Navigation
│   ├── Secondary Navigation
│   └── Footer Links
├── Main Content Area
│   ├── Top Header Bar
│   │   ├── Page Title
│   │   └── Quick Actions
│   └── Dynamic Content
```

**Implementation:**
```svelte
<!-- +layout.svelte -->
<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { Button } from '$lib/components/ui/button';
  
  let { children } = $props();
</script>

<Sidebar.Provider>
  <Sidebar.Root variant="inset">
    <Sidebar.Header>
      <!-- Brand/Logo -->
    </Sidebar.Header>
    
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Main Menu</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <!-- Navigation Items -->
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
    
    <Sidebar.Footer>
      <!-- Settings/Help -->
    </Sidebar.Footer>
  </Sidebar.Root>
  
  <Sidebar.Inset>
    <header class="sticky top-0 z-10">
      <Sidebar.Trigger />
      <!-- Page title & quick actions -->
    </header>
    
    <main>
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
```

#### Responsive Grid System

**Dashboard Grid:**
```svelte
<!-- Full-width container -->
<div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
  <!-- Stats Cards - 4 columns on large screens -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <!-- 4 stat cards -->
  </div>
  
  <!-- Main Content - Asymmetric grid -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
    <!-- Primary content: 4/7 width -->
    <Card.Root class="lg:col-span-4">
      <!-- Today's Focus -->
    </Card.Root>
    
    <!-- Secondary content: 3/7 width -->
    <Card.Root class="lg:col-span-3">
      <!-- Quick Stats -->
    </Card.Root>
  </div>
  
  <!-- Tabbed Content -->
  <Tabs.Root value="analytics">
    <Tabs.List class="grid w-full grid-cols-3 lg:w-[400px]">
      <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
      <Tabs.Trigger value="insights">Insights</Tabs.Trigger>
      <Tabs.Trigger value="community">Community</Tabs.Trigger>
    </Tabs.List>
    <!-- Tab content -->
  </Tabs.Root>
</div>
```

---

### Health-Focused Design Principles

#### Core Tenets

1. **Encouragement over Pressure**
   - No negative messaging ("missed days")
   - Progress from personal baseline
   - Positive reinforcement only

2. **Progressive Disclosure**
   - Features unlock based on engagement
   - No overwhelming new users
   - Gradual complexity introduction

3. **Sustainable Engagement**
   - No obsessive checking patterns
   - Flexible pacing options
   - "Escape hatches" always visible

4. **Psychological Safety**
   - "Pause journey" option
   - Adjust pace anytime
   - No judgment for inactivity

#### Implementation Patterns

**Language Guidelines:**
```typescript
// ✅ Good - Encouraging
"Building momentum!"
"You're making progress!"
"When you're ready..."

// ❌ Avoid - Pressuring
"You failed to..."
"You must complete..."
"Behind schedule"
```

**Progressive Disclosure Example:**
```typescript
// utils/dashboard-config.ts
export class DashboardConfig {
  constructor(private metadata, private profile, private globalStats) {}
  
  get accountAgeDays(): number {
    const created = new Date(this.profile?.createdAt);
    const now = new Date(this.globalStats?.serverDate);
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }
  
  get engagementLevel(): number {
    return this.metadata?.articlesCompleted || 0;
  }
  
  // Show analytics after 3 days
  get showAnalytics(): boolean {
    return this.accountAgeDays > 3;
  }
  
  // Show detailed analytics after 14 days + 10 articles
  get showDetailedAnalytics(): boolean {
    return this.accountAgeDays > 14 && this.engagementLevel > 10;
  }
  
  // Show community features after 7 days
  get showCommunity(): boolean {
    return this.accountAgeDays > 7;
  }
}
```

**Safety Options Component:**
```svelte
<script>
  let showPauseModal = $state(false);
  let showAdjustModal = $state(false);
</script>

<div class="mt-8 border-t pt-4 opacity-70">
  <button 
    class="text-sm text-muted-foreground underline"
    onclick={() => showAdjustModal = true}
  >
    Need to adjust your pace?
  </button>
  
  <button 
    class="ml-4 text-sm text-muted-foreground underline"
    onclick={() => showPauseModal = true}
  >
    Taking a break is okay
  </button>
</div>

<!-- Modals for pause/adjust -->
```

---

### Dashboard State Management

#### Store Architecture (Svelte 5)

**Dashboard Store Pattern:**
```typescript
// stores/dashboard.svelte.ts
import { ApiClient } from '$lib/client/api-client';

class DashboardStore {
  #metadata = $state(null);
  #globalStats = $state(null);
  #logs = $state([]);
  #profile = $state(null);
  #loading = $state(false);
  #error = $state(null);
  #lastFetch = $state(null);
  
  readonly METADATA_CACHE = 5 * 60 * 1000; // 5 minutes
  
  private apiClient: ApiClient;
  
  constructor() {
    this.apiClient = new ApiClient('', {
      'Content-Type': 'application/json'
    });
  }
  
  get metadata() { return this.#metadata; }
  get globalStats() { return this.#globalStats; }
  get logs() { return this.#logs; }
  get profile() { return this.#profile; }
  get loading() { return this.#loading; }
  get error() { return this.#error; }
  
  async loadDashboard(force = false) {
    const now = Date.now();
    
    // Use cache if fresh
    if (!force && this.#lastFetch && 
        (now - this.#lastFetch) < this.METADATA_CACHE) {
      return;
    }
    
    this.#loading = true;
    this.#error = null;
    
    try {
      // Parallel loading of critical data
      const [globalStats, profile, metadata, logs] = await Promise.all([
        this.apiClient.getGlobalStatistics(),
        this.apiClient.getMyProfile(),
        this.apiClient.getMyMetadata(),
        this.apiClient.listLogs({ page: 1, limit: 7 })
      ]);
      
      this.#profile = profile;
      this.#metadata = metadata;
      this.#globalStats = globalStats;
      this.#logs = logs || [];
      this.#lastFetch = now;
    } catch (err) {
      this.#error = err.message || 'Failed to load dashboard';
    } finally {
      this.#loading = false;
    }
  }
  
  async refresh() {
    await this.loadDashboard(true);
  }
}

export const dashboardStore = new DashboardStore();
```

**Usage in Components:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { dashboardStore } from './stores/dashboard.svelte';
  
  // Reactive derivations
  const metadata = $derived(dashboardStore.metadata);
  const loading = $derived(dashboardStore.loading);
  const error = $derived(dashboardStore.error);
  
  onMount(() => {
    dashboardStore.loadDashboard();
  });
</script>

{#if loading && !metadata}
  <Skeleton />
{:else if error}
  <ErrorCard {error} onRetry={() => dashboardStore.refresh()} />
{:else if metadata}
  <!-- Dashboard content -->
{/if}
```

---

### Component Patterns

#### Stat Cards with Trends

```svelte
<script lang="ts">
  import * as Card from '$lib/components/ui/card';
  import { TrendingUp, BookOpen } from 'lucide-svelte';
  
  const statsCards = $derived([
    {
      title: 'Articles Read',
      value: metadata?.articlesCompleted || 0,
      icon: BookOpen,
      trend: '+12%',
      trendUp: true,
      description: 'Keep learning!'
    }
    // ... more cards
  ]);
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {#each statsCards as stat}
    <Card.Root class="hover:shadow-lg transition-shadow">
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium text-muted-foreground">
          {stat.title}
        </Card.Title>
        <stat.icon class="h-4 w-4 text-primary" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{stat.value}</div>
        <p class="text-xs text-muted-foreground flex items-center gap-1">
          {#if stat.trendUp}
            <TrendingUp class="h-3 w-3 text-primary" />
          {/if}
          <span class="text-primary">{stat.trend}</span>
          <span>{stat.description}</span>
        </p>
      </Card.Content>
    </Card.Root>
  {/each}
</div>
```

#### Weekly Activity Chart

**Custom Bar Chart:**
```svelte
<script lang="ts">
  const chartData = $derived(
    weeklyHabits.map((day) => ({
      day: day.day,
      habits: day.habitCount
    }))
  );
</script>

<div class="flex items-end justify-between h-[160px] gap-2">
  {#each chartData as day}
    <div class="flex-1 flex flex-col items-center gap-2">
      <div class="flex-1 w-full flex items-end justify-center">
        <div
          class="w-full bg-primary/20 hover:bg-primary/30 rounded-t-lg transition-all cursor-pointer relative group"
          style="height: {(day.habits / 4) * 100}%"
          title="{day.day}: {day.habits} habits"
        >
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            {day.habits} {day.habits === 1 ? 'habit' : 'habits'}
          </div>
        </div>
      </div>
      <span class="text-xs text-muted-foreground">{day.day}</span>
    </div>
  {/each}
</div>
```

#### Achievement System

```typescript
// utils/achievements.svelte.ts
export class AchievementCalculator {
  private achievements = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first article',
      condition: (m: UserMetadata) => m.articlesCompleted >= 1,
      progress: (m: UserMetadata) => Math.min(1, m.articlesCompleted)
    },
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Complete 10 articles',
      condition: (m: UserMetadata) => m.articlesCompleted >= 10,
      progress: (m: UserMetadata) => m.articlesCompleted / 10
    }
    // ... more achievements
  ];
  
  calculate(metadata: UserMetadata): Achievement[] {
    return this.achievements
      .filter(a => !a.hidden || a.condition(metadata))
      .map(achievement => ({
        ...achievement,
        earned: achievement.condition(metadata),
        progress: achievement.progress(metadata),
        progressPercentage: Math.round(achievement.progress(metadata) * 100)
      }));
  }
}
```

**Achievement Display:**
```svelte
<script lang="ts">
  import { Trophy, Lock } from 'lucide-svelte';
  import { Progress } from '$lib/components/ui/progress';
  
  let { achievements } = $props();
  
  const earned = $derived(achievements.filter(a => a.earned));
  const inProgress = $derived(achievements.filter(a => !a.earned));
</script>

<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Trophy class="h-5 w-5 text-primary" />
      Achievements
    </Card.Title>
  </Card.Header>
  <Card.Content>
    {#each earned as achievement}
      <div class="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          🏆
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">{achievement.name}</h4>
          <p class="text-sm text-muted-foreground">{achievement.description}</p>
        </div>
      </div>
    {/each}
    
    {#each inProgress as achievement}
      <div class="flex items-start gap-3 rounded-lg border p-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Lock class="h-5 w-5" />
        </div>
        <div class="flex-1">
          <h4 class="font-semibold">{achievement.name}</h4>
          <p class="text-sm text-muted-foreground">{achievement.description}</p>
          <Progress value={achievement.progressPercentage} class="h-2 mt-2" />
          <p class="text-xs text-muted-foreground mt-1">
            {achievement.progressPercentage}% complete
          </p>
        </div>
      </div>
    {/each}
  </Card.Content>
</Card.Root>
```

---

### Performance Optimization

#### Loading States

**Skeleton Components:**
```svelte
<script>
  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

{#if loading}
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {#each [1, 2, 3, 4] as _}
      <Card.Root>
        <Card.Header class="space-y-2">
          <Skeleton class="h-4 w-[100px]" />
          <Skeleton class="h-8 w-[60px]" />
        </Card.Header>
      </Card.Root>
    {/each}
  </div>
{/if}
```

#### Error Handling

**Error Card Pattern:**
```svelte
{#if error}
  <Card.Root class="border-destructive">
    <Card.Header>
      <Card.Title>Unable to Load Dashboard</Card.Title>
      <Card.Description>{error}</Card.Description>
    </Card.Header>
    <Card.Footer>
      <Button onclick={() => dashboardStore.refresh()}>
        Try Again
      </Button>
    </Card.Footer>
  </Card.Root>
{/if}
```

#### Lazy Loading

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  
  let profile = $state(null);
  let challenges = $state(null);
  
  onMount(async () => {
    // Lazy load secondary data after initial render
    if (metadata?.articlesCompleted > 0) {
      profile = await apiClient.getMyProfile();
    }
    
    if (metadata?.challengesJoined > 0) {
      challenges = await apiClient.listChallenges();
    }
  });
</script>
```

---

### Accessibility Best Practices

1. **Semantic HTML**
   ```svelte
   <nav aria-label="Main navigation">
     <a href="/dashboard" aria-current={$page.url.pathname === '/dashboard'}>
       Dashboard
     </a>
   </nav>
   ```

2. **ARIA Labels**
   ```svelte
   <Button variant="ghost" size="icon" aria-label="Search">
     <Search class="h-4 w-4" />
   </Button>
   ```

3. **Keyboard Navigation**
   ```svelte
   <div 
     role="button" 
     tabindex="0"
     onkeydown={(e) => e.key === 'Enter' && handleClick()}
   >
     <!-- Interactive element -->
   </div>
   ```

4. **Color Contrast**
   - Ensure text meets WCAG AA standards (4.5:1 ratio)
   - Test with browser DevTools
   - Use sufficient contrast between primary and background colors

---

### Documentation References

**Dashboard Implementation:**
- Full documentation: `/DASHBOARD_IMPLEMENTATION.md`
- Theme customization: `/THEME_CUSTOMIZATION.md`
- Quick reference: `/UPGRADE_SUMMARY.md`

**External Resources:**
- ShadCN Svelte: https://shadcn-svelte.com/
- OKLCH Color Picker: https://oklch.com/
- Lucide Icons: https://lucide.dev/
- Dashboard Example: https://shadcn-svelte.com/examples/dashboard