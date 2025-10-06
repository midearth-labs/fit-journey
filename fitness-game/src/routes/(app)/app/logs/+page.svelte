<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Plus, TrendingUp, Target, BarChart3 } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { format, isSameDay } from 'date-fns';
	import LogFormPopover from './components/LogFormPopover.svelte';
	import LogsTableView from './components/LogsTableView.svelte';
	import LogsChartsView from './components/LogsChartsView.svelte';
	import { logsViewStore } from './stores/logs-view.svelte';

	// State
	let selectedDate = $state<Date>(new Date());
	let selectedView = $state<'calendar' | 'table' | 'charts'>('calendar');

	// Calendar helpers
	function getLogStatusForDate(date: Date) {
		return logsViewStore.getLogStatusForDate(date);
	}

	function getCalendarClassNames(date: Date) {
		const logStatus = getLogStatusForDate(date);
		return cn(
			'h-9 w-9 text-center text-sm p-0 font-normal',
			{
				'bg-green-100 text-green-800 hover:bg-green-200': logStatus.status === 'logged',
				'bg-yellow-100 text-yellow-800 hover:bg-yellow-200': logStatus.status === 'partial',
				'bg-red-100 text-red-800 hover:bg-red-200': logStatus.status === 'missing',
				'bg-gray-100 text-gray-400': logStatus.status === 'future' || logStatus.status === 'locked',
				'bg-blue-100 text-blue-800': isSameDay(date, selectedDate)
			}
		);
	}

	// Handle date selection
	function handleDateSelect(date: Date | undefined) {
		if (date) {
			selectedDate = date;
		}
	}

	// Handle log form submission
	async function handleLogSubmit() {
		await logsViewStore.refresh();
	}

	onMount(() => {
		logsViewStore.loadData();
	});
</script>

<svelte:head>
	<title>Logs - FitJourney</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Daily Logs</h1>
			<p class="text-muted-foreground">Track your wellness metrics and build healthy habits</p>
		</div>
		<Button onclick={() => (selectedView = 'calendar')} class="gap-2">
			<Plus class="h-4 w-4" />
			Track Today's Metrics
		</Button>
	</div>

	{#if logsViewStore.loading}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
				<p class="text-muted-foreground">Loading your logs...</p>
			</div>
		</div>
	{:else if logsViewStore.error}
		<div class="flex items-center justify-center h-64">
			<div class="text-center">
				<p class="text-destructive mb-4">{logsViewStore.error}</p>
				<Button onclick={() => logsViewStore.loadData(true)}>Try Again</Button>
			</div>
		</div>
	{:else}
		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Current Streak</CardTitle>
					<TrendingUp class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{logsViewStore.insights?.currentStreak || 0}</div>
					<p class="text-xs text-muted-foreground">days in a row</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Longest Streak</CardTitle>
					<Target class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{logsViewStore.insights?.longestStreak || 0}</div>
					<p class="text-xs text-muted-foreground">personal best</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Days</CardTitle>
					<BarChart3 class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{logsViewStore.insights?.totalDaysLogged || 0}</div>
					<p class="text-xs text-muted-foreground">logged</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">This Week</CardTitle>
					<TrendingUp class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{logsViewStore.insights?.lastSevenDaysCompletion || 0}%</div>
					<p class="text-xs text-muted-foreground">completion</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Active Challenges</CardTitle>
					<Target class="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{logsViewStore.challengeProgress.filter(cp => cp.status === 'active').length}</div>
					<p class="text-xs text-muted-foreground">in progress</p>
				</CardContent>
			</Card>
		</div>

		<!-- Main Content Tabs -->
		<Tabs bind:value={selectedView} class="space-y-4">
			<TabsList class="grid w-full grid-cols-3">
				<TabsTrigger value="calendar">Calendar</TabsTrigger>
				<TabsTrigger value="table">Table</TabsTrigger>
				<TabsTrigger value="charts">Analytics</TabsTrigger>
			</TabsList>

			<TabsContent value="calendar" class="space-y-4">
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<!-- Calendar Widget -->
					<Card class="lg:col-span-2">
						<CardHeader>
							<CardTitle>Log Calendar</CardTitle>
							<CardDescription>
								Click on any date to view or edit your logs
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Calendar type="multiple"
								value={[]}
							/>
						</CardContent>
					</Card>

					<!-- Selected Date Info -->
					<div class="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Selected Date</CardTitle>
								<CardDescription>
									{format(selectedDate, 'EEEE, MMMM d, yyyy')}
								</CardDescription>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="flex items-center gap-2">
									<Badge variant={
										getLogStatusForDate(selectedDate).status === 'logged' ? 'default' :
										getLogStatusForDate(selectedDate).status === 'partial' ? 'secondary' :
										getLogStatusForDate(selectedDate).status === 'missing' ? 'destructive' : 'outline'
									}>
										{getLogStatusForDate(selectedDate).status}
									</Badge>
								</div>

								<LogFormPopover
									{selectedDate}
									logTypes={logsViewStore.logTypes}
									challenges={logsViewStore.challenges}
									logs={logsViewStore.logs}
									onSubmit={handleLogSubmit}
								>
									<Button class="w-full" variant={
										getLogStatusForDate(selectedDate).status === 'logged' ? 'outline' : 'default'
									}>
										{getLogStatusForDate(selectedDate).status === 'logged' ? 'Edit Log' : 'Add Log'}
									</Button>
								</LogFormPopover>
							</CardContent>
						</Card>

						<!-- Legend -->
						<Card>
							<CardHeader>
								<CardTitle class="text-sm">Legend</CardTitle>
							</CardHeader>
							<CardContent class="space-y-2 text-sm">
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded bg-green-100 border border-green-200"></div>
									<span>Fully logged</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded bg-yellow-100 border border-yellow-200"></div>
									<span>Partially logged</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded bg-red-100 border border-red-200"></div>
									<span>Not logged</span>
								</div>
								<div class="flex items-center gap-2">
									<div class="h-3 w-3 rounded bg-gray-100 border border-gray-200"></div>
									<span>Future/Locked</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</TabsContent>

			<TabsContent value="table">
				<LogsTableView 
					logs={logsViewStore.logs} 
					challenges={logsViewStore.challenges} 
					logTypes={logsViewStore.logTypes} 
					onRefresh={() => logsViewStore.refresh()} 
				/>
			</TabsContent>

			<TabsContent value="charts">
				<LogsChartsView 
					logs={logsViewStore.logs} 
					challenges={logsViewStore.challenges} 
					logTypes={logsViewStore.logTypes} 
				/>
			</TabsContent>
		</Tabs>
	{/if}
</div>
