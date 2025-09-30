/**
 * Dashboard Configuration - Controls progressive disclosure of features
 */
export class DashboardConfig {
	constructor(private metadata: any | null) {}

	get accountAgeDays(): number {
		if (!this.metadata?.createdAt) return 0;
		const created = new Date(this.metadata.createdAt);
		const now = new Date();
		return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
	}

	get engagementLevel(): number {
		return this.metadata?.articlesCompletedCount || 0;
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
		return this.accountAgeDays > 7 || (this.metadata?.challengesJoinedCount || 0) > 0;
	}
}
