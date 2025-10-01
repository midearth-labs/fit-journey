<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboardStore } from './stores/dashboard.svelte';
	import { DashboardConfig } from './utils/dashboard-config';
	import { AchievementCalculator } from './utils/achievements.svelte';
	import { InsightGenerator } from './utils/insights.svelte';

	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Tabs from '$lib/components/ui/tabs';

	import HeaderSection from './components/HeaderSection.svelte';
	import TodaysFocus from './components/TodaysFocus.svelte';
	import ProgressAnalytics from './components/ProgressAnalytics.svelte';
	import SmartInsights from './components/SmartInsights.svelte';
	import CommunityPulse from './components/CommunityPulse.svelte';
	import AchievementPanel from './components/AchievementPanel.svelte';
	import SafetyOptions from './components/SafetyOptions.svelte';

	import {
		TrendingUp,
		Users,
		BookOpen,
		Trophy,
		Target,
		Activity,
		Zap,
		Heart
	} from 'lucide-svelte';

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
	const dashboardConfig = $derived(new DashboardConfig(metadata, profile, globalStats));

	// Calculate derived data
	const achievements = $derived(achievementCalc.calculate(metadata));
	const insights = $derived(insightGen.generate(metadata, logs));

	// Stats cards data
	const statsCards = $derived([
		{
			title: 'Articles Read',
			value: metadata?.articlesCompleted || 0,
			icon: BookOpen,
			trend: '+12%',
			trendUp: true,
			description: 'Keep learning!'
		},
		{
			title: 'Active Challenges',
			value: metadata?.challengesJoined || 0,
			icon: Trophy,
			trend: 'In progress',
			trendUp: true,
			description: 'Stay committed'
		},
		{
			title: 'Questions Answered',
			value: metadata?.questionsAnswered || 0,
			icon: Users,
			trend: 'Helping others',
			trendUp: true,
			description: 'Great community!'
		},
		{
			title: 'Challenges Joined',
			value: metadata?.challengesJoined || 0,
			icon: Zap,
			trend: 'Active',
			trendUp: true,
			description: 'Stay strong!'
		}
	]);

	// Load dashboard data on mount
	onMount(async () => {
		await dashboardStore.loadDashboard();

		if (metadata?.challengesJoined && metadata.challengesJoined > 0) {
			await dashboardStore.loadChallenges();
		}
	});
</script>

<svelte:head>
	<title>Dashboard - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
	{#if loading && !metadata}
		<!-- Loading skeleton -->
		<div class="space-y-4">
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each [1, 2, 3, 4] as _}
					<Card.Root>
						<Card.Header class="space-y-2">
							<Skeleton class="h-4 w-[100px]" />
							<Skeleton class="h-8 w-[60px]" />
						</Card.Header>
					</Card.Root>
				{/each}
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Skeleton class="h-[400px] lg:col-span-4" />
				<Skeleton class="h-[400px] lg:col-span-3" />
			</div>
		</div>
	{:else if error && !metadata}
		<!-- Error state -->
		<Card.Root class="border-destructive">
			<Card.Header>
				<Card.Title>Unable to Load Dashboard</Card.Title>
				<Card.Description>{error}</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button onclick={() => dashboardStore.refresh()}>Try Again</Button>
			</Card.Footer>
		</Card.Root>
	{:else if metadata}
		<!-- Welcome Header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-3xl font-bold tracking-tight text-foreground">
					Welcome back, {profile?.displayName || 'Fitness Champion'}!
				</h2>
				<p class="text-muted-foreground">
					Here's what's happening with your fitness journey today.
				</p>
			</div>
			<Button class="bg-primary hover:bg-primary/90">
				<Target class="mr-2 h-4 w-4" />
				Quick Log
			</Button>
		</div>

		<!-- Stats Cards -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{#each statsCards as stat}
				<Card.Root class="border-border hover:shadow-lg transition-shadow">
					<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
						<Card.Title class="text-sm font-medium text-muted-foreground">
							{stat.title}
						</Card.Title>
						<stat.icon class="h-4 w-4 text-primary" />
					</Card.Header>
					<Card.Content>
						<div class="text-2xl font-bold text-foreground">{stat.value}</div>
						<p class="text-xs text-muted-foreground flex items-center gap-1 mt-1">
							{#if stat.trendUp}
								<TrendingUp class="h-3 w-3 text-primary" />
							{/if}
							<span class="text-primary">{stat.trend}</span>
							<span class="ml-1">{stat.description}</span>
						</p>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Main Content Grid -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
			<!-- Today's Focus - Takes more space -->
			<Card.Root class="lg:col-span-4">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Activity class="h-5 w-5 text-primary" />
						Today's Focus
					</Card.Title>
					<Card.Description>Your personalized daily action plan</Card.Description>
				</Card.Header>
				<Card.Content>
					<TodaysFocus {metadata} />
				</Card.Content>
			</Card.Root>

			<!-- Quick Stats -->
			<Card.Root class="lg:col-span-3">
				<Card.Header>
					<Card.Title>Quick Stats</Card.Title>
					<Card.Description>Your week at a glance</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Weekly Goal</span>
							<span class="font-medium">75%</span>
						</div>
						<Progress value={75} class="h-2" />
					</div>
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Total Articles</span>
							<Badge variant="secondary" class="bg-primary/10 text-primary border-primary/20">
								{metadata?.articlesCompleted || 0}
							</Badge>
						</div>
					</div>
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Habit Consistency</span>
							<span class="font-medium text-primary">Excellent</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Analytics and Insights -->
		<Tabs.Root value="analytics" class="w-full">
			<Tabs.List class="grid w-full grid-cols-3 lg:w-[400px]">
				<Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
				<Tabs.Trigger value="insights">Insights</Tabs.Trigger>
				<Tabs.Trigger value="community">Community</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="analytics" class="mt-4">
				<div class="grid gap-4 md:grid-cols-2">
					{#if dashboardConfig.showAnalytics}
						<ProgressAnalytics {logs} {metadata} detailed={dashboardConfig.showDetailedAnalytics} />
					{/if}
					{#if dashboardConfig.showAchievements}
						<AchievementPanel {achievements} />
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="insights" class="mt-4">
				{#if dashboardConfig.showInsights}
					<SmartInsights {insights} />
				{/if}
			</Tabs.Content>
			<Tabs.Content value="community" class="mt-4">
				{#if dashboardConfig.showCommunity}
					<CommunityPulse {globalStats} anonymous={!dashboardConfig.showSocialFeatures} />
				{/if}
			</Tabs.Content>
		</Tabs.Root>

		<!-- Safety Options -->
		<SafetyOptions />
	{:else}
		<!-- Empty state -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Getting Started</Card.Title>
				<Card.Description>Loading your personalized dashboard...</Card.Description>
			</Card.Header>
			<Card.Content class="flex justify-center py-8">
				<Heart class="h-12 w-12 text-primary animate-pulse" />
			</Card.Content>
		</Card.Root>
	{/if}
</div>
