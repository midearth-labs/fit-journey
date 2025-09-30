<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboardStore } from './stores/dashboard.svelte';
	import { DashboardConfig } from './utils/dashboard-config';
	import { AchievementCalculator } from './utils/achievements.svelte';
	import { InsightGenerator } from './utils/insights.svelte';

	import HeaderSection from './components/HeaderSection.svelte';
	import TodaysFocus from './components/TodaysFocus.svelte';
	import ProgressAnalytics from './components/ProgressAnalytics.svelte';
	import SmartInsights from './components/SmartInsights.svelte';
	import CommunityPulse from './components/CommunityPulse.svelte';
	import AchievementPanel from './components/AchievementPanel.svelte';
	import SafetyOptions from './components/SafetyOptions.svelte';

	import './dashboard.css';

	// Store state
	const metadata = $derived(dashboardStore.metadata);
	const globalStats = $derived(dashboardStore.globalStats);
	const logs = $derived(dashboardStore.logs);
	const profile = $derived(dashboardStore.profile);
	const challenges = $derived(dashboardStore.challenges);
	const loading = $derived(dashboardStore.loading);
	const error = $derived(dashboardStore.error);

	// Calculators
	const achievementCalc = new AchievementCalculator();
	const insightGen = new InsightGenerator();

	// Dashboard config
	const dashboardConfig = $derived(new DashboardConfig(metadata));

	// Calculate derived data
	const achievements = $derived(achievementCalc.calculate(metadata));
	const insights = $derived(insightGen.generate(metadata, logs));

	// Load dashboard data on mount
	onMount(async () => {
		await dashboardStore.loadDashboard();

		// Lazy load additional data based on engagement
		if (metadata?.articlesCompletedCount && metadata.articlesCompletedCount > 0) {
			await dashboardStore.loadProfile();
		}

		if (metadata?.challengesJoinedCount && metadata.challengesJoinedCount > 0) {
			await dashboardStore.loadChallenges();
		}
	});
</script>

<svelte:head>
	<title>Dashboard - FitJourney</title>
</svelte:head>

<div class="dashboard-container">
	{#if loading && !metadata}
		<!-- Loading skeleton -->
		<div class="space-y-6">
			<div class="skeleton h-32 rounded-2xl"></div>
			<div class="dashboard-grid">
				<div class="skeleton h-64 rounded-2xl"></div>
				<div class="skeleton h-64 rounded-2xl"></div>
				<div class="skeleton h-64 rounded-2xl"></div>
			</div>
		</div>
	{:else if error && !metadata}
		<!-- Error state -->
		<div class="error-banner">
			<p class="error-message">{error}</p>
			<button class="error-button" onclick={() => dashboardStore.refresh()}>Try Again</button>
		</div>
	{:else if metadata}
		<!-- Dashboard content -->
		<HeaderSection {metadata} {profile} />

		<main class="mt-8">
			<!-- Today's Focus - Full width -->
			<TodaysFocus {metadata} />

			<!-- Dashboard grid -->
			<div class="dashboard-grid">
				<!-- Progress Analytics -->
				{#if dashboardConfig.showAnalytics}
					<ProgressAnalytics {logs} {metadata} detailed={dashboardConfig.showDetailedAnalytics} />
				{/if}

				<!-- Smart Insights -->
				{#if dashboardConfig.showInsights}
					<SmartInsights {insights} />
				{/if}

				<!-- Community Pulse -->
				{#if dashboardConfig.showCommunity}
					<CommunityPulse {globalStats} anonymous={!dashboardConfig.showSocialFeatures} />
				{/if}

				<!-- Achievements -->
				{#if dashboardConfig.showAchievements}
					<AchievementPanel {achievements} />
				{/if}
			</div>

			<!-- Safety Options -->
			<SafetyOptions />
		</main>
	{:else}
		<!-- Empty state -->
		<div class="text-center py-12">
			<p class="text-gray-500">Loading your dashboard...</p>
		</div>
	{/if}
</div>
