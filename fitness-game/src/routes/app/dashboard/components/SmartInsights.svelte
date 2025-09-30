<script lang="ts">
	import type { Insight } from '../utils/insights.svelte';

	let { insights } = $props<{ insights: Insight[] }>();
</script>

<div class="dashboard-card">
	<h2 class="dashboard-card-title">Smart Insights</h2>

	{#if insights.length === 0}
		<p class="text-center text-gray-500">Keep going! Insights will appear as you make progress.</p>
	{:else}
		<div class="insight-list">
			{#each insights as insight}
				<div
					class="insight-item"
					class:insight-positive={insight.type === 'positive'}
					class:insight-neutral={insight.type === 'neutral'}
					class:insight-suggestion={insight.type === 'suggestion'}
				>
					<div class="insight-icon">{insight.icon}</div>
					<div class="insight-content">
						<h3 class="insight-title">{insight.title}</h3>
						<p class="insight-message">{insight.message}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
