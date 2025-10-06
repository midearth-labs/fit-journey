<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { TrendingUp, Target, BarChart3, Activity, Calendar } from 'lucide-svelte';
	import { logsViewStore } from '../stores/logs-view.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { LogType } from '$lib/server/content/types/log-type';

	// Types
	type UserLogs = ApiResponse['listLogs'];
	type UserChallenges = ApiResponse['listChallengesJoinedByUser'];

	// Props
	let {
		logs,
		challenges,
		logTypes
	}: {
		logs: UserLogs;
		challenges: UserChallenges;
		logTypes: LogType[];
	} = $props();

	// State
	let selectedTimeRange = $state<'7d' | '30d' | '90d'>('30d');

	// Use chart data from store
	const chartData = $derived.by(() => logsViewStore.chartData);

	// Weekly trend summary derived from Map structure
	const weeklyTrendStats = $derived(() => {
		const map = chartData?.insights.weeklyTrend;
		if (!map) {
			return { improving: 0, declining: 0, neutral: 0, best: null as null | [string, number], worst: null as null | [string, number] };
		}
		let improving = 0;
		let declining = 0;
		let neutral = 0;
		let best: null | [string, number] = null;
		let worst: null | [string, number] = null;
		for (const [key, val] of map.entries()) {
			if ('missing' in val) continue;
			const avg = val.avg;
			if (avg > 0) improving++;
			else if (avg < 0) declining++;
			else neutral++;
			if (best === null || avg > best[1]) best = [key, avg];
			if (worst === null || avg < worst[1]) worst = [key, avg];
		}
		return { improving, declining, neutral, best, worst };
	});

	// Get metric display name
	function getMetricDisplayName(metricId: string): string {
		const logType = logTypes.find(lt => lt.id === metricId);
		return logType?.display_title || metricId;
	}

	// Get intensity color for heatmap
	function getIntensityColor(intensity: number): string {
		if (intensity === 0) return 'bg-gray-100';
		if (intensity < 0.25) return 'bg-red-100';
		if (intensity < 0.5) return 'bg-orange-100';
		if (intensity < 0.75) return 'bg-yellow-100';
		return 'bg-green-100';
	}

	// Get intensity border color for heatmap
	function getIntensityBorderColor(intensity: number): string {
		if (intensity === 0) return 'border-gray-200';
		if (intensity < 0.25) return 'border-red-200';
		if (intensity < 0.5) return 'border-orange-200';
		if (intensity < 0.75) return 'border-yellow-200';
		return 'border-green-200';
	}
</script>

<div class="space-y-6">
	<!-- Controls -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Analytics & Insights</CardTitle>
			<CardDescription>
				Visualize your progress and identify patterns in your wellness journey
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="flex gap-4 items-center">
				<div class="space-y-2">
					<Label class="text-sm font-medium">Time Range</Label>
					<Select type="single" bind:value={selectedTimeRange} onValueChange={(value) => selectedTimeRange = value as typeof selectedTimeRange || '30d'}>
						<SelectTrigger class="w-32">
							<span>{selectedTimeRange}</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 3 months</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Insights Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Current Streak</CardTitle>
				<TrendingUp class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{chartData?.insights.currentStreak || 0}</div>
				<p class="text-xs text-muted-foreground">days in a row</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Longest Streak</CardTitle>
				<Target class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{chartData?.insights.longestStreak || 0}</div>
				<p class="text-xs text-muted-foreground">personal best</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Days</CardTitle>
				<Calendar class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{chartData?.insights.totalDaysLogged || 0}</div>
				<p class="text-xs text-muted-foreground">logged</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Weekly Trend</CardTitle>
				<BarChart3 class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">
					+{weeklyTrendStats().improving} / -{weeklyTrendStats().declining}
				</div>
				<p class="text-xs text-muted-foreground">metrics improving vs declining (last 7d vs prev)</p>
			</CardContent>
		</Card>
	</div>

	<!-- Charts Tabs -->
	<Tabs value="trend" class="space-y-4">
		<TabsList class="grid w-full grid-cols-3">
			<TabsTrigger value="trend">Trend Analysis</TabsTrigger>
			<TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
			<TabsTrigger value="challenges">Challenge Progress</TabsTrigger>
		</TabsList>

		<TabsContent value="trend" class="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle>Daily Trend</CardTitle>
						<CardDescription>
							Metrics logged over time
						</CardDescription>
					</CardHeader>
					<CardContent>
						{#if chartData?.trendData && chartData!.trendData.length > 0}
							<div class="space-y-4">
								<!-- Simple trend visualization (normalized by total available metrics) -->
								<div class="h-64 flex items-end justify-between gap-1">
									{#each chartData!.trendData as dataPoint}
										<div class="flex flex-col items-center gap-2 flex-1">
											<div 
												class="w-full bg-green-200 rounded transition-all duration-300 hover:bg-green-300"
												style="height: {(dataPoint.metricsCount / logTypes.length) * 100}%"
												title="Metrics Logged: {dataPoint.metricsCount}"
											></div>
										</div>
									{/each}
								</div>
								
								<!-- Legend -->
								<div class="flex items-center gap-4 text-sm">
									<div class="flex items-center gap-2">
										<div class="w-3 h-3 bg-green-200 rounded"></div>
										<span>Metrics Logged</span>
									</div>
								</div>
							</div>
						{:else}
							<div class="h-64 flex items-center justify-center text-muted-foreground">
								No data available for the selected time range
							</div>
						{/if}
					</CardContent>
				</Card>

			<!-- Removed best/worst metric callouts per product direction -->
		</TabsContent>

		<TabsContent value="heatmap" class="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Activity Heatmap</CardTitle>
					<CardDescription>
						Your daily logging activity intensity
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if chartData?.heatmapData && chartData!.heatmapData.length > 0}
						<div class="space-y-4">
							<!-- Heatmap Grid -->
							<div class="grid grid-cols-7 gap-1">
								{#each chartData!.heatmapData as dataPoint}
									<div 
										class="h-8 w-8 rounded border-2 flex items-center justify-center text-xs cursor-pointer transition-all duration-200 hover:scale-110 {getIntensityColor(dataPoint.intensity)} {getIntensityBorderColor(dataPoint.intensity)}"
										title="{dataPoint.displayDate}: {dataPoint.hasLog ? 'Logged' : 'No log'}"
									>
										{#if dataPoint.challengeDay}
											<div class="w-1 h-1 bg-blue-600 rounded-full"></div>
										{/if}
									</div>
								{/each}
							</div>
							
							<!-- Legend -->
							<div class="flex items-center gap-4 text-sm">
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
									<span>No activity</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
									<span>Low activity</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
									<span>Medium activity</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
									<span>High activity</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="w-1 h-1 bg-blue-600 rounded-full"></div>
									<span>Challenge day</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="h-64 flex items-center justify-center text-muted-foreground">
							No data available for the selected time range
						</div>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value="challenges" class="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Challenge Progress</CardTitle>
					<CardDescription>
						Your progress across active challenges
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if chartData?.challengeProgress && chartData!.challengeProgress.length > 0}
						<div class="space-y-4">
							{#each chartData!.challengeProgress as challenge}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<div>
											<h4 class="font-medium">{challenge.name}</h4>
											<p class="text-sm text-muted-foreground">
												{challenge.dailyLogCount}/{challenge.durationDays} days logged
											</p>
										</div>
										<Badge variant="outline">
											{challenge.progress.toFixed(0)}%
										</Badge>
									</div>
									
									<!-- Progress Bar -->
									<div class="w-full bg-gray-200 rounded-full h-2">
										<div 
											class="bg-blue-600 h-2 rounded-full transition-all duration-300"
											style="width: {challenge.progress}%"
										></div>
									</div>
									
									<!-- Required Log Types -->
									<div class="flex flex-wrap gap-1">
										{#each challenge.requiredLogTypes as logTypeId}
											<Badge variant="secondary" class="text-xs">
												{getMetricDisplayName(logTypeId)}
											</Badge>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="h-64 flex items-center justify-center text-muted-foreground">
							No active challenges
						</div>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
