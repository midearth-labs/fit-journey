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
	generate(metadata: any, logs: any[]): Insight[] {
		const insights: Insight[] = [];

		if (!metadata) return insights;

		// Consistency insight
		if (logs.length >= 5) {
			const activeDays = logs.filter(
				(log) =>
					log.values?.dailyMovement ||
					log.values?.cleanEating ||
					log.values?.sleepQuality ||
					log.values?.hydration
			).length;

			if (activeDays >= 5) {
				insights.push({
					id: 'consistency',
					type: 'positive',
					title: 'Great Consistency!',
					message: `You've been active ${activeDays} out of ${logs.length} days this week`,
					icon: '🔥'
				});
			}
		}

		// Learning progress insight
		if (metadata.articlesCompletedCount > 0) {
			const quizRate =
				metadata.quizzesPassedCount > 0
					? (metadata.quizzesPassedCount / metadata.articlesCompletedCount) * 100
					: 0;

			if (quizRate >= 80) {
				insights.push({
					id: 'quiz_master',
					type: 'positive',
					title: 'Quiz Master!',
					message: `You're passing ${Math.round(quizRate)}% of your quizzes`,
					icon: '🎯'
				});
			}
		}

		// Engagement suggestion
		if (metadata.articlesCompletedCount >= 3 && metadata.challengesJoinedCount === 0) {
			insights.push({
				id: 'join_challenge',
				type: 'suggestion',
				title: 'Ready for a Challenge?',
				message: 'Try joining a community challenge to stay motivated',
				icon: '💪'
			});
		}

		// Community participation
		if (metadata.questionsAskedCount > 0 || metadata.questionsAnsweredCount > 0) {
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
