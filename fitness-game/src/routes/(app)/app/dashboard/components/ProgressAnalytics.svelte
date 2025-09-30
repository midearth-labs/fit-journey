<script lang="ts">
	import type { ApiResponse } from '$lib/client/api-client';

	// Type inference from ApiClient
	type UserMetadata = ApiResponse['getMyMetadata']
	type UserLogs = ApiResponse['listLogs']

	let { logs, metadata, detailed = false } = $props<{
		logs: UserLogs;
		metadata: UserMetadata | null;
		detailed?: boolean;
	}>();

	// Process logs into weekly habit data
	const weeklyHabits = $derived.by(() => {
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			return date.toISOString().split('T')[0];
		});

		return last7Days.map((date) => {
			const log = logs.find((l: any) => l.logDate === date);
			return {
				date,
				movement: log?.values?.dailyMovement || false,
				nutrition: log?.values?.cleanEating || false,
				sleep: log?.values?.sleepQuality || false,
				hydration: log?.values?.hydration || false,
				mood: log?.values?.moodCheck || null,
				energy: log?.values?.energyLevel || null
			};
		});
	});

	const activeDays = $derived(
		weeklyHabits.filter(
			(day) => day.movement || day.nutrition || day.sleep || day.hydration
		).length
	);

	const moodTrend = $derived.by(() => {
		const moods = weeklyHabits.filter((day) => day.mood !== null).map((day) => day.mood);

		if (moods.length === 0) return null;

		const average = moods.reduce((a, b) => a + b, 0) / moods.length;
		const trend = moods.length > 1 ? moods[moods.length - 1] - moods[0] : 0;

		return { average, trend, count: moods.length };
	});
</script>

<div class="dashboard-card">
	<h2 class="dashboard-card-title">Your Week</h2>

	<div class="habit-grid">
		{#each weeklyHabits as day}
			<div class="day-column">
				<div class="day-label">
					{new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
				</div>
				<div class="habit-dots">
					<div class="habit-dot" class:habit-dot-active={day.movement} title="Movement">💪</div>
					<div class="habit-dot" class:habit-dot-active={day.nutrition} title="Nutrition">🥗</div>
					<div class="habit-dot" class:habit-dot-active={day.sleep} title="Sleep">😴</div>
					<div class="habit-dot" class:habit-dot-active={day.hydration} title="Hydration">💧</div>
				</div>
				{#if day.mood}
					<div class="mood-indicator" title="Mood: {day.mood}/5">
						{['😔', '😐', '🙂', '😊', '😄'][day.mood - 1]}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-4">
		<p class="positive-message">
			{#if activeDays === 0}
				Ready to start fresh this week!
			{:else if activeDays < 3}
				{activeDays}
				active {activeDays === 1 ? 'day' : 'days'} - building momentum!
			{:else if activeDays < 6}
				{activeDays} active days - great consistency!
			{:else}
				{activeDays} active days - outstanding week!
			{/if}
		</p>

		{#if moodTrend && moodTrend.count >= 3}
			<p class="mood-insight">
				{#if moodTrend.trend > 0}
					Your mood is trending upward! 📈
				{:else if moodTrend.average >= 3}
					You're maintaining good energy levels
				{:else}
					Remember: rest is part of progress too
				{/if}
			</p>
		{/if}
	</div>

	{#if detailed && metadata}
		<div class="mt-6 rounded-xl bg-gray-50 p-4">
			<h3 class="mb-3 font-bold text-gray-900">Personal Bests</h3>
			<ul class="space-y-2 text-sm text-gray-600">
				<li>Most articles in a week: {metadata.bestWeekArticles || 0}</li>
				<li>Longest streak: {metadata.longestStreak || 0} days</li>
			</ul>
		</div>
	{/if}
</div>
