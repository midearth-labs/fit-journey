import { ApiClient, type ApiResponse } from '$lib/client/api-client';
import { apiHandler, throwOnError } from '$lib/client/api-handler';
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
type CreateChallengeResponse = ApiResponse['createUserChallenge'];
type JoinChallengeResponse = ApiResponse['joinChallenge'];

// Request/Response types for operations
type CreateChallengeRequest = Parameters<ApiClient['createUserChallenge']>[0];
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

		// Connect to global API handler for loading and error states
		// Subscribe to API handler state changes
		apiHandler.onLoadingChange((loading) => {
			this.#loading = loading;
		});
		
		apiHandler.onErrorChange((error) => {
			this.#error = error;
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
	 * Load public challenges with pagination
	 */
	async loadPublicChallenges(query: { page?: number; limit?: number } = {}) {
		const result = await apiHandler.execute(
			() => this.apiClient.listPublicChallenges(query),
			{ errorMessage: 'Failed to load public challenges' }
		);
		
		if ('data' in result) {
			this.#publicChallenges = result.data || [];
		}
	}

	/**
	 * Load challenges owned by the user
	 */
	async loadOwnedChallenges(query: { page?: number; limit?: number } = {}) {
		const result = await apiHandler.execute(
			() => this.apiClient.listChallengesOwnedByUser(query),
			{ errorMessage: 'Failed to load owned challenges' }
		);
		
		if ('data' in result) {
			this.#ownedChallenges = result.data || [];
		}
	}

	/**
	 * Load challenges joined by the user
	 */
	async loadJoinedChallenges(query: { page?: number; limit?: number } = {}) {
		const result = await apiHandler.execute(
			() => this.apiClient.listChallengesJoinedByUser(query),
			{ errorMessage: 'Failed to load joined challenges' }
		);
		
		if ('data' in result) {
			this.#joinedChallenges = result.data || [];
		}
	}

	/**
	 * Load detailed information about a specific challenge (for viewing/joining)
	 */
	async loadChallengeDetail(challengeId: string) {
		const result = await apiHandler.execute(
			() => this.apiClient.getChallenge(challengeId),
			{ errorMessage: 'Failed to load challenge details' }
		);
		
		if ('data' in result) {
			this.#currentChallenge = result.data;
		}
	}

	/**
	 * Load detailed information about a user's owned challenge (for management)
	 */
	async loadUserChallengeDetail(challengeId: string) {
		const result = await apiHandler.execute(
			() => this.apiClient.getUserChallenge(challengeId),
			{ errorMessage: 'Failed to load user challenge details' }
		);
		
		if ('data' in result) {
			this.#currentUserChallenge = result.data;
		}
	}

	/**
	 * Load members for a specific challenge
	 */
	async loadChallengeMembers(challengeId: string, query: { page?: number; limit?: number } = {}) {
		const result = await apiHandler.execute(
			() => this.apiClient.listChallengeJoinedByUserMembers(challengeId, query),
			{ errorMessage: 'Failed to load challenge members' }
		);
		
		if ('data' in result) {
			this.#currentMembers = result.data || [];
		}
	}

	/**
	 * Create a new challenge
	 */
	async createChallenge(dto: CreateChallengeRequest): Promise<CreateChallengeResponse> {
		return throwOnError(await apiHandler.execute(
			async () => {
				const challenge = await this.apiClient.createUserChallenge(dto);
				// Refresh owned challenges to include the new one
				await this.loadOwnedChallenges();
				return challenge;
			},
			{ errorMessage: 'Failed to create challenge' }
		));
	}

	/**
	 * Update an existing challenge
	 */
	async updateChallenge(challengeId: string, dto: UpdateChallengeRequest['body']) {
		throwOnError(await apiHandler.execute(
			async () => {
				await this.apiClient.updateUserChallenge({
					params: { challengeId },
					query: {},
					body: dto
				});
			},
			{ errorMessage: 'Failed to update challenge' }
		));

		// Refresh the current challenge and owned challenges
		await Promise.all([
			this.loadChallengeDetail(challengeId),
			this.loadOwnedChallenges()
		]);
	}

	/**
	 * Delete a challenge
	 */
	async deleteChallenge(challengeId: string) {
		throwOnError(await apiHandler.execute(
			async () => {
				await this.apiClient.deleteUserChallenge(challengeId);
				// Refresh owned challenges to remove the deleted one
				await this.loadOwnedChallenges();
			},
			{ errorMessage: 'Failed to delete challenge' }
		));
	}

	/**
	 * Join a challenge
	 */
	async joinChallenge(challengeId: string, shareLogKeys: AllLogKeysType[], inviteCode?: string): Promise<JoinChallengeResponse> {
		const result = throwOnError(await apiHandler.execute(
			async () => {
				return await this.apiClient.joinChallenge({
					params: { challengeId },
					query: {},
					body: { inviteCode, shareLogKeys }
				});
			},
			{ errorMessage: 'Failed to join challenge' }
		));

		// Refresh joined challenges to include the new one
		await this.loadJoinedChallenges();

		return result;
	}

	/**
	 * Leave a challenge
	 */
	async leaveChallenge(challengeId: string) {
		throwOnError(await apiHandler.execute(
			async () => {
				return await this.apiClient.leaveChallenge(challengeId);
			},
			{ errorMessage: 'Failed to leave challenge' }
		));

		// Refresh joined challenges to remove the left one
		await this.loadJoinedChallenges();
	}

	/**
	 * Update challenge subscription settings
	 */
	async updateSubscription(challengeId: string, shareLogKeys: AllLogKeysType[]) {
		throwOnError(await apiHandler.execute(
			() => this.apiClient.updateChallengeJoinedByUserSubscription({
				params: { challengeId },
				query: {},
				body: { shareLogKeys }
			}),
			{ errorMessage: 'Failed to update subscription' }
		));
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
		const result = await apiHandler.execute(
			() => contentService.loadLogTypes(),
			{ errorMessage: 'Failed to load log types', showLoading: false }
		);
		
		if ('data' in result) {
			this.#logTypes = result.data;
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
