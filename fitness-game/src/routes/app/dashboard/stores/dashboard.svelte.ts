import { ApiClient } from '$lib/client/api-client';

/**
 * Dashboard Store - Centralized data management for dashboard
 * Handles fetching, caching, and state for dashboard data
 */
class DashboardStore {
	#metadata = $state<any>(null);
	#globalStats = $state<any>(null);
	#logs = $state<any[]>([]);
	#profile = $state<any>(null);
	#challenges = $state<any[]>([]);
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

		this.#loading = true;
		this.#error = null;

		try {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const today = new Date();

			const [metadata, globalStats, logs] = await Promise.all([
				this.apiClient.getMyMetadata(),
				this.apiClient.getGlobalStatistics(),
				this.apiClient.listLogs({
					fromDate: sevenDaysAgo.toISOString().split('T')[0],
					toDate: today.toISOString().split('T')[0]
				})
			]);

			this.#metadata = metadata;
			this.#globalStats = globalStats;
			this.#logs = logs || [];
			this.#lastFetch = now;
		} catch (err: any) {
			this.#error = err.message || 'Failed to load dashboard data';
			console.error('Dashboard load error:', err);
		} finally {
			this.#loading = false;
		}
	}

	/**
	 * Lazy load profile data
	 */
	async loadProfile() {
		if (this.#profile) return;

		try {
			this.#profile = await this.apiClient.getMyProfile();
		} catch (err) {
			console.error('Profile load error:', err);
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
	updateMetadata(updates: Partial<any>) {
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
