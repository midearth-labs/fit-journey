<script lang="ts">
	import type { ApiResponse } from '$lib/client/api-client';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { TrendingUp } from 'lucide-svelte';

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
			const habitCount = [
				log?.values?.dailyMovement,
				log?.values?.cleanEating,
				log?.values?.sleepQuality,
				log?.values?.hydration
			].filter(Boolean).length;

			return {
				date,
				day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
				habitCount,
				movement: log?.values?.dailyMovement || false,
				nutrition: log?.values?.cleanEating || false,
				sleep: log?.values?.sleepQuality || false,
				hydration: log?.values?.hydration || false,
				mood: log?.values?.moodCheck || null,
				energy: log?.values?.energyLevel || null
			};
		});
	});

	const chartData = $derived(
		weeklyHabits.map((day) => ({
			day: day.day,
			habits: day.habitCount
		}))
	);

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

<Card.Root>
	<Card.Header>
		<Card.Title>Weekly Activity</Card.Title>
		<Card.Description>Your habit tracking for the past 7 days</Card.Description>
	</Card.Header>
	<Card.Content>
		<!-- Simple Bar Chart Visualization -->
		<div class="mb-6">
			<div class="flex items-end justify-between h-[160px] gap-2">
				{#each chartData as day}
					<div class="flex-1 flex flex-col items-center gap-2">
						<div class="flex-1 w-full flex items-end justify-center">
							<div
								class="w-full bg-primary/20 hover:bg-primary/30 rounded-t-lg transition-all cursor-pointer relative group"
								style="height: {(day.habits / 4) * 100}%"
								title="{day.day}: {day.habits} habits"
							>
								<div
									class="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
								>
									{day.habits} {day.habits === 1 ? 'habit' : 'habits'}
								</div>
							</div>
						</div>
						<span class="text-xs text-muted-foreground font-medium">{day.day}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Habit Grid -->
		<div class="mt-6 grid grid-cols-7 gap-2">
			{#each weeklyHabits as day}
				<div class="flex flex-col items-center gap-2">
					<div class="text-xs text-muted-foreground font-medium">
						{day.day}
					</div>
					<div class="flex flex-col gap-1">
						<div
							class="h-6 w-6 rounded-full flex items-center justify-center text-xs transition-all"
							class:bg-primary={day.movement}
							class:bg-muted={!day.movement}
							title="Movement"
						>
							💪
						</div>
						<div
							class="h-6 w-6 rounded-full flex items-center justify-center text-xs transition-all"
							class:bg-primary={day.nutrition}
							class:bg-muted={!day.nutrition}
							title="Nutrition"
						>
							🥗
						</div>
						<div
							class="h-6 w-6 rounded-full flex items-center justify-center text-xs transition-all"
							class:bg-primary={day.sleep}
							class:bg-muted={!day.sleep}
							title="Sleep"
						>
							😴
						</div>
						<div
							class="h-6 w-6 rounded-full flex items-center justify-center text-xs transition-all"
							class:bg-primary={day.hydration}
							class:bg-muted={!day.hydration}
							title="Hydration"
						>
							💧
						</div>
					</div>
					{#if day.mood}
						<div class="text-lg" title="Mood: {day.mood}/5">
							{['😔', '😐', '🙂', '😊', '😄'][day.mood - 1]}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card.Content>
	<Card.Footer class="flex-col items-start gap-2">
		<div class="flex w-full items-center gap-2 text-sm">
			<div class="flex items-center gap-2 font-medium leading-none text-primary">
				{#if activeDays === 0}
					Ready to start fresh this week!
				{:else if activeDays < 3}
					{activeDays} active {activeDays === 1 ? 'day' : 'days'} - building momentum!
				{:else if activeDays < 6}
					{activeDays} active days - great consistency!
				{:else}
					{activeDays} active days - outstanding week!
					<TrendingUp class="h-4 w-4" />
				{/if}
			</div>
		</div>
		{#if moodTrend && moodTrend.count >= 3}
			<div class="text-xs text-muted-foreground">
				{#if moodTrend.trend > 0}
					Your mood is trending upward! 📈
				{:else if moodTrend.average >= 3}
					You're maintaining good energy levels
				{:else}
					Remember: rest is part of progress too
				{/if}
			</div>
		{/if}
		{#if detailed && metadata}
			<div class="mt-4 w-full space-y-2 rounded-lg bg-muted/50 p-3">
				<h4 class="text-sm font-semibold">Personal Bests</h4>
				<div class="space-y-1 text-xs text-muted-foreground">
					<div class="flex justify-between">
						<span>Most articles in a week:</span>
						<Badge variant="secondary" class="bg-primary/10 text-primary">
							{metadata.bestWeekArticles || 0}
						</Badge>
					</div>
					<div class="flex justify-between">
						<span>Longest streak:</span>
						<Badge variant="secondary" class="bg-primary/10 text-primary">
							{metadata.longestStreak || 0} days
						</Badge>
					</div>
				</div>
			</div>
		{/if}
	</Card.Footer>
</Card.Root>
