<script lang="ts">
	import type { ApiResponse } from '$lib/client/api-client';

	// Type inference from ApiClient
	type GlobalStatistics = ApiResponse['getGlobalStatistics']

	let { globalStats, anonymous = false } = $props<{ globalStats: GlobalStatistics | null; anonymous?: boolean }>();
</script>

<div class="dashboard-card">
	<h2 class="dashboard-card-title">Community Pulse</h2>

	{#if globalStats}
		<div class="community-stats">
			<div class="community-stat">
				<span class="community-stat-value">{globalStats.totalArticlesRead || 0}</span>
				<span class="community-stat-label">Articles Read</span>
			</div>
			<div class="community-stat">
				<span class="community-stat-value">{globalStats.totalActiveUsers || 0}</span>
				<span class="community-stat-label">Active Members</span>
			</div>
			<div class="community-stat">
				<span class="community-stat-value">{globalStats.totalChallengesActive || 0}</span>
				<span class="community-stat-label">Active Challenges</span>
			</div>
			<div class="community-stat">
				<span class="community-stat-value">{globalStats.totalQuestionsAnswered || 0}</span>
				<span class="community-stat-label">Questions Answered</span>
			</div>
		</div>

		{#if !anonymous}
			<p class="mt-4 text-center text-sm text-gray-600">
				You're part of a growing community making progress together! 🌟
			</p>
		{/if}
	{:else}
		<p class="text-center text-gray-500">Loading community stats...</p>
	{/if}
</div>
