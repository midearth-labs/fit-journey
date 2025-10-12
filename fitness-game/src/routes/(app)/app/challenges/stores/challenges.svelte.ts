import { ApiClient, type ApiResponse } from '$lib/client/api-client';
import type { AllLogKeysType } from '$lib/config/constants';
import { contentService } from '$lib/services/content.service';
import type { LogType } from '$lib/types/content';

// Type inference from ApiClient methods
type PublicChallenges = ApiResponse['listPublicChallenges'];
type OwnedChallenges = ApiResponse['listChallengesOwnedByUser'];
type JoinedChallenges = ApiResponse['listChallengesJoinedByUser'];
type ChallengeDetail = ApiResponse['getChallenge'];
type UserChallengeDetail = ApiResponse['getUserChallenge'];
type ChallengeMembers = ApiResponse['listChallengeJoinedByUserMembers'];
type CreateChallengeResponse = ApiResponse['createChallenge'];
type JoinChallengeResponse = ApiResponse['joinChallenge'];

// Request/Response types for operations
type CreateChallengeRequest = Parameters<ApiClient['createChallenge']>[0];
type UpdateChallengeRequest = Parameters<ApiClient['updateUserChallenge']>[0];

/**
 * Challenges Store - Centralized data management for challenges
 * Handles fetching, state management, and operations for all challenge-related data
 */
class ChallengesStore {
	// State using Svelte 5 $state rune
	#publicChallenges = $state<PublicChallenges>([]);
	#ownedChallenges = $state<OwnedChallenges>([]);
	#joinedChallenges = $state<JoinedChallenges>([]);
	#currentChallenge = $state<ChallengeDetail | null>(null);
	#currentUserChallenge = $state<UserChallengeDetail | null>(null);
	#currentMembers = $state<ChallengeMembers>([]);
	#logTypes = $state<LogType[]>([]);
	#loading = $state(false);
	#error = $state<string | null>(null);

	private apiClient: ApiClient;

	constructor() {
		this.apiClient = new ApiClient('', {
			'Content-Type': 'application/json'
		});
	}

	// Getters
	get publicChallenges() {
		return this.#publicChallenges;
	}

	get ownedChallenges() {
		return this.#ownedChallenges;
	}

	get joinedChallenges() {
		return this.#joinedChallenges;
	}

	get currentChallenge() {
		return this.#currentChallenge;
	}

	get currentUserChallenge() {
		return this.#currentUserChallenge;
	}

	get currentMembers() {
		return this.#currentMembers;
	}

	get logTypes() {
		return this.#logTypes;
	}

	get loading() {
		return this.#loading;
	}

	get error() {
		return this.#error;
	}

	/**
	 * Set loading state and clear error
	 */
	private setLoading(loading: boolean) {
		this.#loading = loading;
		if (loading) {
			this.#error = null;
		}
	}

	/**
	 * Set error state
	 */
	private setError(error: string) {
		this.#error = error;
		this.#loading = false;
	}

	/**
	 * Load public challenges with pagination
	 */
	async loadPublicChallenges(query: { page?: number; limit?: number } = {}) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.listPublicChallenges(query);
			this.#publicChallenges = result || [];
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load public challenges';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Load challenges owned by the user
	 */
	async loadOwnedChallenges(query: { page?: number; limit?: number } = {}) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.listChallengesOwnedByUser(query);
			this.#ownedChallenges = result || [];
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load owned challenges';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Load challenges joined by the user
	 */
	async loadJoinedChallenges(query: { page?: number; limit?: number } = {}) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.listChallengesJoinedByUser(query);
			this.#joinedChallenges = result || [];
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load joined challenges';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Load detailed information about a specific challenge (for viewing/joining)
	 */
	async loadChallengeDetail(challengeId: string) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.getChallenge(challengeId);
			this.#currentChallenge = result;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load challenge details';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Load detailed information about a user's owned challenge (for management)
	 */
	async loadUserChallengeDetail(challengeId: string) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.getUserChallenge(challengeId);
			this.#currentUserChallenge = result;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load user challenge details';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Load members for a specific challenge
	 */
	async loadChallengeMembers(challengeId: string, query: { page?: number; limit?: number } = {}) {
		this.setLoading(true);
		try {
			const result = await this.apiClient.listChallengeJoinedByUserMembers(challengeId, query);
			this.#currentMembers = result || [];
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load challenge members';
			this.setError(errorMessage);
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Create a new challenge
	 */
	async createChallenge(dto: CreateChallengeRequest): Promise<CreateChallengeResponse> {
		this.setLoading(true);
		try {
			const result = await this.apiClient.createChallenge(dto);
			// Refresh owned challenges to include the new one
			await this.loadOwnedChallenges();
			return result;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create challenge';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Update an existing challenge
	 */
	async updateChallenge(challengeId: string, dto: UpdateChallengeRequest['body']) {
		this.setLoading(true);
		try {
			await this.apiClient.updateUserChallenge({
				params: { challengeId },
				query: {},
				body: dto
			});
			// Refresh the current challenge and owned challenges
			await Promise.all([
				this.loadChallengeDetail(challengeId),
				this.loadOwnedChallenges()
			]);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update challenge';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Delete a challenge
	 */
	async deleteChallenge(challengeId: string) {
		this.setLoading(true);
		try {
			await this.apiClient.deleteUserChallenge(challengeId);
			// Refresh owned challenges to remove the deleted one
			await this.loadOwnedChallenges();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete challenge';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Join a challenge
	 */
	async joinChallenge(challengeId: string, shareLogKeys: AllLogKeysType[], inviteCode?: string): Promise<JoinChallengeResponse> {
		this.setLoading(true);
		try {
			const result = await this.apiClient.joinChallenge({
				params: { challengeId },
				query: {},
				body: { inviteCode, shareLogKeys }
			});
			// Refresh joined challenges to include the new one
			await this.loadJoinedChallenges();
			return result;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to join challenge';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Leave a challenge
	 */
	async leaveChallenge(challengeId: string) {
		this.setLoading(true);
		try {
			await this.apiClient.leaveChallenge(challengeId);
			// Refresh joined challenges to remove the left one
			await this.loadJoinedChallenges();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to leave challenge';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Update challenge subscription settings
	 */
	async updateSubscription(challengeId: string, shareLogKeys: AllLogKeysType[]) {
		this.setLoading(true);
		try {
			await this.apiClient.updateChallengeJoinedByUserSubscription({
				params: { challengeId },
				query: {},
				body: { shareLogKeys }
			});
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update subscription';
			this.setError(errorMessage);
			throw err;
		} finally {
			this.setLoading(false);
		}
	}

	/**
	 * Clear current challenge data
	 */
	clearCurrentChallenge() {
		this.#currentChallenge = null;
		this.#currentUserChallenge = null;
		this.#currentMembers = [];
	}

	/**
	 * Load log types from content service
	 */
	async loadLogTypes() {
		try {
			this.#logTypes = await contentService.loadLogTypes();
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load log types';
			console.error(errorMessage);
		}
	}

	/**
	 * Get log type by key
	 */
	getLogTypeByKey(key: string): LogType | undefined {
		return this.#logTypes.find(lt => lt.id === key);
	}

	/**
	 * Reset store state
	 */
	reset() {
		this.#publicChallenges = [];
		this.#ownedChallenges = [];
		this.#joinedChallenges = [];
		this.#currentChallenge = null;
		this.#currentUserChallenge = null;
		this.#currentMembers = [];
		this.#logTypes = [];
		this.#loading = false;
		this.#error = null;
	}
}

export const challengesStore = new ChallengesStore();
