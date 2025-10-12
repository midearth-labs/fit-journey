# API Handler

A centralized handler for managing API and contentService calls with consistent error handling and loading states.

## Features

- **Centralized Error Handling**: Uses `ApiError.fullMessage` when available for detailed error information
- **Loading State Management**: Automatically manages loading states across all operations
- **Parallel Operations**: Support for executing multiple API calls in parallel
- **Reactive State**: Integrates with Svelte 5 reactive state management
- **Flexible Configuration**: Customizable error messages, loading behavior, and error handling

## Usage

### Basic Usage

```typescript
import { apiHandler, executeApi } from '$lib/client/api-handler';
import { ApiClient } from '$lib/client/api-client';
import { contentService } from '$lib/services/content.service';

// Single API operation
const result = await apiHandler.execute(
  () => apiClient.getMyProfile(),
  { errorMessage: 'Failed to load user profile' }
);

if (result.success && result.data) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  console.error(result.error);
}
```

### Parallel Operations

```typescript
// Multiple API operations in parallel
const result = await apiHandler.executeAll(
  [
    () => apiClient.getMyProfile(),
    () => apiClient.getMyMetadata(),
    () => contentService.loadCategories()
  ],
  { errorMessage: 'Failed to load dashboard data' }
);

if (result.success && result.data) {
  const [profile, metadata, categories] = result.data;
  // Handle success
}
```

### Store Integration

```typescript
import { apiHandler } from '$lib/client/api-handler';

class MyStore {
  #loading = $state(false);
  #error = $state<string | null>(null);

  constructor() {
    // Connect to global API handler
    apiHandler.onLoadingChange((loading) => {
      this.#loading = loading;
    });
    
    apiHandler.onErrorChange((error) => {
      this.#error = error;
    });
  }

  async loadData() {
    const result = await apiHandler.execute(
      () => this.apiClient.getData(),
      { errorMessage: 'Failed to load data' }
    );
    
    if (result.success && result.data) {
      // Update store state
      this.#data = result.data;
    }
  }
}
```

### Component Integration

```svelte
<script lang="ts">
  import { apiHandler } from '$lib/client/api-handler';
  
  let loading = $state(false);
  let error = $state<string | null>(null);
  
  // Connect to API handler
  $effect(() => {
    const unsubscribeLoading = apiHandler.onLoadingChange((isLoading) => {
      loading = isLoading;
    });

    const unsubscribeError = apiHandler.onErrorChange((err) => {
      error = err;
    });

    return () => {
      unsubscribeLoading();
      unsubscribeError();
    };
  });

  async function loadData() {
    const result = await apiHandler.execute(
      () => apiClient.getData(),
      { errorMessage: 'Failed to load data' }
    );
    
    if (result.success && result.data) {
      // Handle success
    }
  }
</script>

{#if loading}
  <div>Loading...</div>
{/if}

{#if error}
  <div class="error">{error}</div>
{/if}
```

## Configuration Options

### ApiHandlerOptions

```typescript
interface ApiHandlerOptions {
  /** Whether to show loading state during the operation */
  showLoading?: boolean;
  /** Whether to throw errors or handle them silently */
  throwOnError?: boolean;
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether to log errors to console */
  logErrors?: boolean;
}
```

### Examples

```typescript
// Silent operation (no loading state, no error logging)
const result = await apiHandler.execute(
  () => apiClient.getData(),
  { 
    showLoading: false, 
    logErrors: false,
    errorMessage: 'Custom error message'
  }
);

// Operation that throws on error
const result = await apiHandler.execute(
  () => apiClient.getData(),
  { throwOnError: true }
);
```

## Error Handling

The handler automatically extracts meaningful error messages:

1. **ApiError**: Uses `ApiError.fullMessage` if available, otherwise falls back to `ApiError.message`
2. **Error**: Uses `Error.message`
3. **String**: Uses the string directly
4. **Custom Message**: Uses the provided `errorMessage` option
5. **Fallback**: Uses "An unexpected error occurred"

## API Reference

### ApiHandler Class

#### Methods

- `execute<T>(operation, options?)`: Execute a single API operation
- `executeAll<T>(operations, options?)`: Execute multiple operations in parallel
- `onLoadingChange(callback)`: Subscribe to loading state changes
- `onErrorChange(callback)`: Subscribe to error state changes
- `clear()`: Clear all state
- `clearError()`: Clear only error state

### Convenience Functions

- `executeApi<T>(operation, options?)`: Execute a single operation
- `executeApiAll<T>(operations, options?)`: Execute multiple operations

### Global Instance

- `apiHandler`: Global instance of ApiHandler

## Migration Guide

### Before (Manual Error Handling)

```typescript
async loadData() {
  this.setLoading(true);
  try {
    const result = await this.apiClient.getData();
    this.#data = result;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
    this.setError(errorMessage);
  } finally {
    this.setLoading(false);
  }
}
```

### After (Using API Handler)

```typescript
async loadData() {
  const result = await apiHandler.execute(
    () => this.apiClient.getData(),
    { errorMessage: 'Failed to load data' }
  );
  
  if (result.success && result.data) {
    this.#data = result.data;
  }
}
```

## Benefits

1. **Reduced Duplication**: Eliminates repetitive error handling code
2. **Consistent Behavior**: Uniform error handling across the application
3. **Better Error Messages**: Uses `ApiError.fullMessage` for detailed error information
4. **Centralized State**: Single source of truth for loading and error states
5. **Type Safety**: Full TypeScript support with proper type inference
6. **Reactive Integration**: Seamless integration with Svelte 5 reactive state
