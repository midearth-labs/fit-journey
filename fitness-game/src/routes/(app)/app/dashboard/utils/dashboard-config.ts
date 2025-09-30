import type { ApiResponse } from '$lib/client/api-client';

// Type inference from ApiClient
type UserMetadata = ApiResponse['getMyMetadata']
type UserProfile = ApiResponse['getMyProfile']
type GlobalStatistics = ApiResponse['getGlobalStatistics']

/**
 * Dashboard Configuration - Controls progressive disclosure of features
 */
export class DashboardConfig {
	constructor(private metadata: UserMetadata | null, private profile: UserProfile | null, private globalStats: GlobalStatistics | null) {}

	get accountAgeDays(): number {
		if (!this.profile?.createdAt || !this.globalStats?.serverDate) return 0;
		const created = new Date(this.profile.createdAt);
		const now = new Date(this.globalStats.serverDate);
		return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
	}
	
	get engagementLevel(): number {
		return this.metadata?.articlesCompleted || 0;
	}

	get showAnalytics(): boolean {
		return this.accountAgeDays > 3;
	}

	get showDetailedAnalytics(): boolean {
		return this.accountAgeDays > 14 && this.engagementLevel > 10;
	}

	get showAchievements(): boolean {
		return this.engagementLevel > 2;
	}

	get showCommunity(): boolean {
		return this.accountAgeDays > 7;
	}

	get showInsights(): boolean {
		return this.engagementLevel > 5;
	}

	get showSocialFeatures(): boolean {
		return this.accountAgeDays > 14;
	}

	get showChallenges(): boolean {
		return this.accountAgeDays > 7 || (this.metadata?.challengesJoined || 0) > 0;
	}
}
