<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ApiResponse } from '$lib/client/api-client';

	// Type inference from ApiClient
	type UserMetadata = ApiResponse['getMyMetadata']

	let { metadata } = $props<{ metadata: UserMetadata | null }>();

	let checklist = $state([
		{ id: 'read', label: "Read today's article", completed: false, optional: false },
		{ id: 'quiz', label: 'Take the quiz', completed: false, optional: true },
		{ id: 'log', label: 'Log your habits', completed: false, optional: false }
	]);

	const progress = $derived(
		(checklist.filter((item) => item.completed).length /
			checklist.filter((item) => !item.optional).length) *
			100
	);

	const todaysFocus = $derived.by(() => {
		if (!metadata) return null;

		const lastActivityDate = metadata.lastActivityAt
			? new Date(metadata.lastActivityAt)
			: new Date();
		const today = new Date();
		const hoursSinceActivity =
			(today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);

		// Priority logic for primary action
		if (hoursSinceActivity > 24) {
			return {
				type: 'article',
				title: 'Start with a quick read',
				estimatedMinutes: 5,
				actionButton: 'Read Now',
				action: () => goto('/app/articles/next')
			};
		}

		if (today.getHours() > 12) {
			return {
				type: 'habit',
				title: "Log today's habits",
				estimatedMinutes: 2,
				actionButton: 'Quick Check-in',
				action: () => goto('/app/habits')
			};
		}

		return {
			type: 'article',
			title: 'Continue your learning journey',
			estimatedMinutes: 10,
			actionButton: 'Next Article',
			action: () => goto('/app/articles/next')
		};
	});
</script>

<div class="focus-card">
	<h2 class="dashboard-card-title mb-6">Today's Focus</h2>

	{#if todaysFocus}
		<div class="focus-primary-action">
			<h3 class="focus-title">{todaysFocus.title}</h3>
			<p class="focus-time">{todaysFocus.estimatedMinutes} minutes</p>
			<button class="focus-button" onclick={todaysFocus.action}>
				{todaysFocus.actionButton}
			</button>
		</div>
	{/if}

	<div class="checklist">
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progress}%"></div>
		</div>

		{#each checklist as item}
			<label class="checklist-item">
				<input
					type="checkbox"
					class="checklist-checkbox"
					bind:checked={item.completed}
					disabled={item.optional && !item.completed}
				/>
				<span class="checklist-label" class:checklist-label-optional={item.optional}>
					{item.label}
				</span>
			</label>
		{/each}
	</div>

	<p class="positive-message mt-4">
		{#if progress === 0}
			Start with just one thing today!
		{:else if progress < 100}
			You're making progress!
		{:else}
			Amazing! You completed today's goals!
		{/if}
	</p>
</div>
