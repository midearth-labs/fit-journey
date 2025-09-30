<script lang="ts">
	import type { Achievement } from '../utils/achievements.svelte';

	let { achievements } = $props<{ achievements: Achievement[] }>();

	const earnedAchievements = $derived(achievements.filter((a: Achievement) => a.earned));
	const inProgressAchievements = $derived(achievements.filter((a: Achievement) => !a.earned));
</script>

<div class="dashboard-card">
	<h2 class="dashboard-card-title">Achievements</h2>

	{#if earnedAchievements.length > 0}
		<div class="mb-6">
			<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
				Earned ({earnedAchievements.length})
			</h3>
			<div class="achievement-grid">
				{#each earnedAchievements as achievement}
					<div class="achievement-item achievement-earned">
						<div class="achievement-header">
							<span class="achievement-name">{achievement.name}</span>
							<span class="achievement-badge">🏆</span>
						</div>
						<p class="achievement-description">{achievement.description}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if inProgressAchievements.length > 0}
		<div>
			<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
				In Progress
			</h3>
			<div class="achievement-grid">
				{#each inProgressAchievements as achievement}
					<div class="achievement-item achievement-locked">
						<div class="achievement-header">
							<span class="achievement-name">{achievement.name}</span>
							<span class="achievement-badge">🔒</span>
						</div>
						<p class="achievement-description">{achievement.description}</p>
						<div class="achievement-progress">
							<div
								class="achievement-progress-fill"
								style="width: {achievement.progressPercentage}%"
							></div>
						</div>
						<p class="mt-1 text-xs text-gray-500">{achievement.progressPercentage}% complete</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if achievements.length === 0}
		<p class="text-center text-gray-500">Start your journey to unlock achievements! 🎯</p>
	{/if}
</div>
