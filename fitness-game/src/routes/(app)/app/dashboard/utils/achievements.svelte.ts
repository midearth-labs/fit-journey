import type { ApiResponse } from '$lib/client/api-client';

// Type inference from ApiClient
type UserMetadata = ApiResponse['getMyMetadata']

export type Achievement = {
	id: string;
	name: string;
	description: string;
	earned: boolean;
	progress: number;
	progressPercentage: number;
};

/**
 * Achievement Calculator - Calculates user achievements
 */
export class AchievementCalculator {
	private achievements = [
		// Micro achievements
		{
			id: 'first_steps',
			name: 'First Steps',
			description: 'Complete your first article',
			condition: (m: UserMetadata) => m.articlesCompleted >= 1,
			progress: (m: UserMetadata) => Math.min(1, m.articlesCompleted),
            hidden: false,
		},
		{
			id: 'knowledge_seeker',
			name: 'Knowledge Seeker',
			description: 'Pass 3 quizzes with perfect score',
			condition: (m: UserMetadata) => m.articlesCompletedWithPerfectScore >= 3,
			progress: (m: UserMetadata) => Math.min(1, m.articlesCompletedWithPerfectScore / 3),
            hidden: false,
		},
		{
			id: 'habit_builder',
			name: 'Habit Builder',
			description: 'Log habits for 7 days',
			condition: (m: UserMetadata) => m.daysLogged >= 7,
			progress: (m: UserMetadata) => Math.min(1, m.daysLogged / 7),
            hidden: false,
		},
		{
			id: 'community_helper',
			name: 'Community Helper',
			description: 'Answer your first question',
			condition: (m: UserMetadata) => m.questionsAnswered >= 1,
			progress: (m: UserMetadata) => Math.min(1, m.questionsAnswered),
            hidden: false,
		},
	];

	calculate(metadata: UserMetadata | null): Achievement[] {
		if (!metadata) return [];

		return this.achievements
			.filter((a) => !a.hidden || a.condition(metadata))
			.map((achievement) => ({
				...achievement,
				earned: achievement.condition(metadata),
				progress: achievement.progress(metadata),
				progressPercentage: Math.round(achievement.progress(metadata) * 100)
			}));
	}
}
