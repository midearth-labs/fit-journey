import { ApiClient, type ApiResponse } from '$lib/client/api-client';
import { apiHandler } from '$lib/client/api-handler';

// Type inference from ApiClient methods
type UserMetadata = ApiResponse['getMyMetadata']
type GlobalStatistics = ApiResponse['getGlobalStatistics']
type UserLogs = ApiResponse['listLogs']
type UserProfile = ApiResponse['getMyProfile']
type UserChallenges = ApiResponse['listChallengesJoinedByUser']

/**
 * Dashboard Store - Centralized data management for dashboard
 * Handles fetching, caching, and state for dashboard data
 */
class DashboardStore {
	#metadata = $state<UserMetadata | null>(null);
	#globalStats = $state<GlobalStatistics | null>(null);
	#logs = $state<UserLogs>([]);
	#profile = $state<UserProfile | null>(null);
	#challenges = $state<UserChallenges>([]);
	#lastFetch = $state<number | null>(null);
	#loading = $state(false);
	#error = $state<string | null>(null);

	// Cache durations
	readonly METADATA_CACHE = 5 * 60 * 1000; // 5 minutes
	readonly GLOBAL_CACHE = 30 * 60 * 1000; // 30 minutes

	private apiClient: ApiClient;

	constructor() {
		this.apiClient = new ApiClient('', {
			'Content-Type': 'application/json'
		});

		// Connect to global API handler for loading and error states
		this.#loading = false;
		this.#error = null;
		
		// Subscribe to API handler state changes
		apiHandler.onLoadingChange((loading) => {
			this.#loading = loading;
		});
		
		apiHandler.onErrorChange((error) => {
			this.#error = error;
		});
	}

	get metadata() {
		return this.#metadata;
	}

	get globalStats() {
		return this.#globalStats;
	}

	get logs() {
		return this.#logs;
	}

	get profile() {
		return this.#profile;
	}

	get challenges() {
		return this.#challenges;
	}

	get loading() {
		return this.#loading;
	}

	get error() {
		return this.#error;
	}

	/**
	 * Load core dashboard data
	 */
	async loadDashboard(force = false) {
		const now = Date.now();

		if (!force && this.#lastFetch && now - this.#lastFetch < this.METADATA_CACHE) {
			return; // Use cached data
		}

		const result = await apiHandler.executeAll(
			[
				() => this.apiClient.getGlobalStatistics(),
				() => this.apiClient.getMyProfile(),
				() => this.apiClient.getMyMetadata(),
				() => this.apiClient.listLogs({page: 1, limit: 7})
			],
			{ fallbackMessage: 'Failed to load dashboard data' }
		);

		if ('data' in result) {
			const [globalStats, profile, metadata, logs] = result.data;
			this.#profile = profile;
			this.#metadata = metadata;
			this.#globalStats = globalStats;
			this.#logs = logs || [];
			this.#lastFetch = now;
		}
	}

	/**
	 * Lazy load challenges data
	 */
	async loadChallenges() {
		if (this.#challenges.length > 0) return;

		try {
			const result = await this.apiClient.listChallengesJoinedByUser({ limit: 5 });
			this.#challenges = result || [];
		} catch (err) {
			console.error('Challenges load error:', err);
		}
	}

	/**
	 * Refresh dashboard data
	 */
	async refresh() {
		await this.loadDashboard(true);
	}

	/**
	 * Update metadata (e.g., after completing an action)
	 */
	updateMetadata(updates: Partial<UserMetadata>) {
		if (this.#metadata) {
			this.#metadata = { ...this.#metadata, ...updates };
		}
	}

	/**
	 * Reset store state
	 */
	reset() {
		this.#metadata = null;
		this.#globalStats = null;
		this.#logs = [];
		this.#profile = null;
		this.#challenges = [];
		this.#lastFetch = null;
		this.#loading = false;
		this.#error = null;
	}
}

export const dashboardStore = new DashboardStore();
