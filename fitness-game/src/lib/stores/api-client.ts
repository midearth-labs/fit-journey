import { writable } from 'svelte/store';
import ApiClient from '$lib/client/api-client';

// Create a singleton instance of the API client
const apiClient = new ApiClient('');

// Export as a writable store for consistency with other stores
export const apiClientStore = writable(apiClient);

// Export the instance directly for convenience
export { apiClient };
