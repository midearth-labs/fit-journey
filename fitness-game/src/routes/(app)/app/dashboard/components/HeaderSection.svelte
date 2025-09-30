<script lang="ts">
	import type { ApiResponse } from '$lib/client/api-client';

	// Type inference from ApiClient
	type UserMetadata = ApiResponse['getMyMetadata']
	type UserProfile = ApiResponse['getMyProfile']

	let { metadata, profile } = $props<{ metadata: UserMetadata | null; profile: UserProfile | null }>();

	function getTimeBasedGreeting(): string {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	}

	const greeting = $derived(getTimeBasedGreeting());
	const daysActive = $derived.by(() => {
		if (!metadata?.createdAt) return 0;
		const created = new Date(metadata.createdAt);
		const now = new Date();
		return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
	});
</script>

<header class="dashboard-header">
	<div class="flex-1">
		<h1 class="dashboard-greeting">{greeting}!</h1>
		<p class="dashboard-subtitle">
			{#if daysActive > 0}
				Day {daysActive} of your journey
			{:else}
				Welcome to your fitness journey
			{/if}
		</p>
	</div>

	<div class="quick-stats">
		{#if metadata}
			<div class="stat-item">
				<span class="stat-value">{metadata.articlesCompletedCount || 0}</span>
				<span class="stat-label">Articles</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{metadata.challengesJoinedCount || 0}</span>
				<span class="stat-label">Challenges</span>
			</div>
			<div class="stat-item">
				<span class="stat-value">{metadata.currentStreak || 0}</span>
				<span class="stat-label">Day Streak</span>
			</div>
		{/if}
	</div>
</header>
