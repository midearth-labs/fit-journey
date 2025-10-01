import type { ApiResponse } from '$lib/client/api-client';

// Type inference from ApiClient
type UserMetadata = ApiResponse['getMyMetadata']
type UserLogs = ApiResponse['listLogs']

export type Insight = {
	id: string;
	type: 'positive' | 'neutral' | 'suggestion';
	title: string;
	message: string;
	icon: string;
};

/**
 * Insight Generator - Generates smart insights from user data
 */
export class InsightGenerator {
	generate(metadata: UserMetadata | null, logs: UserLogs | null): Insight[] {
		const insights: Insight[] = [];

		if (!metadata || !logs) return insights;
		console.log('logs', logs);

		// Consistency insight
		if (logs.length >= 4) {
			insights.push({
				id: 'consistency',
				type: 'positive',
				title: 'Great Consistency!',
				message: `You've been active and tracking yourself for ${logs.length} out of the last 7 days`,
				icon: '🔥'
			});
		}

		// Learning progress insight
		if (metadata.articlesCompleted > 0) {
			const quizRate =
				metadata.articlesCompletedWithPerfectScore > 0
					? (metadata.articlesCompletedWithPerfectScore / metadata.articlesCompleted) * 100
					: 0;

			if (quizRate >= 80) {
				insights.push({
					id: 'quiz_master',
					type: 'positive',
					title: 'Quiz Master!',
					message: `You're passing ${Math.round(quizRate)}% of your quizzes with perfect score`,
					icon: '🎯'
				});
			}
		}

		// Engagement suggestion
		if (metadata.articlesCompleted >= 3 && metadata.challengesJoined === 0) {
			insights.push({
				id: 'join_challenge',
				type: 'suggestion',
				title: 'Ready for a Challenge?',
				message: 'Try creating your personal challenge or joining a community challenge to stay motivated',
				icon: '💪'
			});
		}

		// Community participation
		if (metadata.questionsAsked > 0 || metadata.questionsAnswered > 0) {
			insights.push({
				id: 'community_active',
				type: 'positive',
				title: 'Community Star!',
				message: "You're actively helping the community grow",
				icon: '⭐'
			});
		}

		return insights;
	}
}
