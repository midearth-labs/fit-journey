import { ApiError } from './api-client';

/**
 * Configuration options for API operations
 */
export type ApiHandlerOptions = {
  /** Whether to show loading state during the operation */
  showLoading?: boolean;
  /** Fallback error message to display */
  fallbackMessage?: string;
  /** Custom error message to display */
  customErrorMessage?: string;
  /** Whether to log errors to console */
  logErrors?: boolean;
}

/**
 * Result of an API operation
 */
export type ApiHandlerResult<T> = 
{
  data: T 
} | 
{
  error: string | null;
}

/**
 * Utility function to throw an error if the result is unsuccessful
 * @param result The API handler result
 * @returns The data if successful, otherwise throws an error
 */
export function throwOnError<T>(result: ApiHandlerResult<T>): T {
  if ('error' in result) {
    throw new Error(result.error || 'Operation failed');
  }
  return result.data;
}

/**
 * Centralized API handler for managing loading states and error handling
 * Provides consistent error handling across all API and contentService calls
 */
export class ApiHandler {
  private loadingCallbacks: Set<(loading: boolean) => void> = new Set();
  private errorCallbacks: Set<(error: string | null) => void> = new Set();

  /**
   * Register loading state callback
   */
  onLoadingChange(callback: (loading: boolean) => void) {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  /**
   * Register error state callback
   */
  onErrorChange(callback: (error: string | null) => void) {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Set loading state and notify all callbacks
   */
  private setLoading(loading: boolean) {
    this.loadingCallbacks.forEach(callback => callback(loading));
  }

  /**
   * Set error state and notify all callbacks
   */
  private setError(error: string | null) {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  /**
   * Execute an API operation with consistent error and loading handling
   */
  async execute<T>(
    operation: () => Promise<T>,
    options: ApiHandlerOptions = {}
  ): Promise<ApiHandlerResult<T>> {
    const result = await this.executeAll([operation], options);
    
    // Extract the single result from the array
    if ('error' in result) {
      return { error: result.error };
    }
    
    return { data: result.data[0] };
  }

  /**
   * Execute multiple API operations in parallel
   */
  async executeAll<T extends readonly unknown[]>(
    operations: { [K in keyof T]: () => Promise<T[K]> },
    options: ApiHandlerOptions = {}
  ): Promise<ApiHandlerResult<T>> {
    const {
      showLoading = true,
      fallbackMessage,
      customErrorMessage,
      logErrors = true
    } = options;

    if (showLoading) {
      this.setLoading(true);
    }
    
    // Clear any previous errors
    this.setError(null);

    try {
      const data = await Promise.all(operations.map(op => op()));
      
      if (showLoading) {
        this.setLoading(false);
      }

      return { data: data as unknown as T };
    } catch (err: unknown) {
      const errorMessage = this.extractErrorMessage(err, customErrorMessage, fallbackMessage);
      
      if (logErrors) {
        console.error('Parallel API operations failed:', errorMessage);
      }

      if (showLoading) {
        this.setLoading(false);
      }

      this.setError(errorMessage);

      return { error: errorMessage };
    }
  }

  /**
   * Extract meaningful error message from various error types
   */
  private extractErrorMessage(err: unknown, customMessage?: string, fallbackMessage?: string): string {
    if (customMessage) {
      return customMessage;
    }

    if (err instanceof ApiError) {
      // Use ApiError.fullMessage if available, otherwise fall back to message
      return err.fullMessage || err.message;
    }

    if (err instanceof Error) {
      return err.message;
    }

    if (typeof err === 'string') {
      return err;
    }

    return fallbackMessage || 'An unexpected error occurred';
  }

  /**
   * Clear all state
   */
  clear() {
    this.setLoading(false);
    this.setError(null);
  }

  /**
   * Clear only error state
   */
  clearError() {
    this.setError(null);
  }
}

/**
 * Global API handler instance
 */
export const apiHandler = new ApiHandler();

/**
 * Convenience function for executing API operations
 */
export async function executeApi<T>(
  operation: () => Promise<T>,
  options: ApiHandlerOptions = {}
): Promise<ApiHandlerResult<T>> {
  return apiHandler.execute(operation, options);
}

/**
 * Convenience function for executing multiple API operations in parallel
 */
export async function executeApiAll<T extends readonly unknown[]>(
  operations: { [K in keyof T]: () => Promise<T[K]> },
  options: ApiHandlerOptions = {}
): Promise<ApiHandlerResult<T>> {
  return apiHandler.executeAll(operations, options);
}
