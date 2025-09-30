export type Achievement = {
	id: string;
	name: string;
	description: string;
	earned: boolean;
	progress: (number);
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
			condition: (m: any) => m.articlesCompletedCount >= 1,
			progress: (m: any) => Math.min(1, m.articlesCompletedCount),
            hidden: false,
		},
		{
			id: 'knowledge_seeker',
			name: 'Knowledge Seeker',
			description: 'Pass 3 quizzes',
			condition: (m: any) => m.quizzesPassedCount >= 3,
			progress: (m: any) => Math.min(1, m.quizzesPassedCount / 3),
            hidden: false,
		},
		{
			id: 'habit_builder',
			name: 'Habit Builder',
			description: 'Log habits for 7 days',
			condition: (m: any) => m.daysLogged >= 7,
			progress: (m: any) => Math.min(1, m.daysLogged / 7),
            hidden: false,
		},
		{
			id: 'community_helper',
			name: 'Community Helper',
			description: 'Answer your first question',
			condition: (m: any) => m.questionsAnsweredCount >= 1,
			progress: (m: any) => Math.min(1, m.questionsAnsweredCount),
            hidden: false,
		},
		{
			id: 'week_warrior',
			name: 'Week Warrior',
			description: 'Complete 7 articles in a week',
			condition: (m: any) => (m.bestWeekArticles || 0) >= 7,
			progress: (m: any) => Math.min(1, (m.bestWeekArticles || 0) / 7),
            hidden: false,
		}
	];

	calculate(metadata: any): Achievement[] {
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
