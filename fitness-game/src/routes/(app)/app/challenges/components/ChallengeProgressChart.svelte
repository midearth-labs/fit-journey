<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, Target, TrendingUp, Activity } from 'lucide-svelte';
	import { calculateProgress, formatDateRange } from '../utils/challenge-helpers';
	import type { ApiResponse } from '$lib/client/api-client';

	// Type definitions
	type ChallengeDetail = ApiResponse['getChallenge'] | ApiResponse['getUserChallenge'];
	type UserLog = ApiResponse['listLogs'][number];

	let { 
		challenge, 
		userLogs 
	} : {
		challenge: ChallengeDetail;
		userLogs: UserLog[];
	} = $props();

	// Calculate progress metrics
	const progressMetrics = $derived.by(() => {
		return calculateProgress(
			challenge.startDate,
			challenge.endDate,
			userLogs.length
		);
	});

	// Generate daily progress data
	const dailyProgress = $derived.by(() => {
		const startDate = new Date(challenge.startDate);
		const endDate = new Date(challenge.endDate);
		const now = new Date();
		const days = [];
		
		// Create a map of logs by date for quick lookup
		const logsByDate = new Map();
		userLogs.forEach((log: UserLog) => {
			logsByDate.set(log.logDate, log);
		});
		
		// Generate data for each day in the challenge
		for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
			const dateStr = d.toISOString().split('T')[0];
			const hasLog = logsByDate.has(dateStr);
			const isToday = d.toDateString() === now.toDateString();
			const isPast = d < now;
			
			days.push({
				date: dateStr,
				day: d.getDate(),
				dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
				hasLog,
				isToday,
				isPast,
				isFuture: d > now
			});
		}
		
		return days;
	});

	// Calculate completion streak
	const currentStreak = $derived.by(() => {
		let streak = 0;
		const sortedLogs = [...userLogs].sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
		
		for (const log of sortedLogs) {
			const logDate = new Date(log.logDate);
			const expectedDate = new Date();
			expectedDate.setDate(expectedDate.getDate() - streak);
			
			if (logDate.toDateString() === expectedDate.toDateString()) {
				streak++;
			} else {
				break;
			}
		}
		
		return streak;
	});

	// Get status color based on progress
	const getStatusColor = (day: { isFuture: boolean; hasLog: boolean; isPast: boolean; }) => {
		if (day.isFuture) return 'bg-muted';
		if (day.hasLog) return 'bg-primary';
		if (day.isPast) return 'bg-destructive/20';
		return 'bg-muted';
	};

	// Get status text
	const getStatusText = (day: { isFuture: boolean; hasLog: boolean; isPast: boolean; }) => {
		if (day.isFuture) return 'Future';
		if (day.hasLog) return 'Completed';
		if (day.isPast) return 'Missed';
		return 'Pending';
	};
</script>

<div class="space-y-6">
	<!-- Progress Overview -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Overall Progress</Card.Title>
				<Target class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{progressMetrics.completionRate}%</div>
				<Progress value={progressMetrics.completionRate} class="mt-2" />
				<p class="text-xs text-muted-foreground mt-1">
					{progressMetrics.daysWithLogs} of {progressMetrics.elapsedDays} days completed
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Current Streak</Card.Title>
				<TrendingUp class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{currentStreak}</div>
				<p class="text-xs text-muted-foreground">
					{currentStreak === 1 ? 'day' : 'days'} in a row
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Days Remaining</Card.Title>
				<Calendar class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">
					{Math.max(0, progressMetrics.totalDays - progressMetrics.elapsedDays)}
				</div>
				<p class="text-xs text-muted-foreground">
					of {progressMetrics.totalDays} total days
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Daily Progress Timeline -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Activity class="h-5 w-5" />
				Daily Progress
			</Card.Title>
			<Card.Description>
				Track your daily completion throughout the challenge
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<!-- Legend -->
				<div class="flex items-center gap-4 text-sm">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded bg-primary"></div>
						<span>Completed</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded bg-destructive/20"></div>
						<span>Missed</span>
					</div>
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded bg-muted"></div>
						<span>Future</span>
					</div>
				</div>

				<!-- Timeline Grid -->
				<div class="grid grid-cols-7 gap-2">
					{#each dailyProgress as day}
						<div class="flex flex-col items-center gap-1">
							<div
								class="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors {getStatusColor(day)}"
								class:ring-2={day.isToday}
								class:ring-primary={day.isToday}
								title="{day.date}: {getStatusText(day)}"
							>
								{day.day}
							</div>
							<span class="text-xs text-muted-foreground">
								{day.dayName}
							</span>
						</div>
					{/each}
				</div>

				<!-- Summary Stats -->
				<div class="flex items-center justify-between pt-4 border-t">
					<div class="flex items-center gap-4">
						<Badge variant="outline">
							Completed: {progressMetrics.daysWithLogs}
						</Badge>
						<Badge variant="outline">
							Missed: {Math.max(0, progressMetrics.elapsedDays - progressMetrics.daysWithLogs)}
						</Badge>
						<Badge variant="outline">
							Remaining: {Math.max(0, progressMetrics.totalDays - progressMetrics.elapsedDays)}
						</Badge>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Challenge Timeline -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Challenge Timeline</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-primary"></div>
						<span class="text-sm font-medium">Start</span>
					</div>
					<span class="text-sm text-muted-foreground">
						{new Date(challenge.startDate).toLocaleDateString()}
					</span>
				</div>
				
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-muted"></div>
						<span class="text-sm font-medium">Today</span>
					</div>
					<span class="text-sm text-muted-foreground">
						{new Date().toLocaleDateString()}
					</span>
				</div>
				
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-secondary"></div>
						<span class="text-sm font-medium">End</span>
					</div>
					<span class="text-sm text-muted-foreground">
						{new Date(challenge.endDate).toLocaleDateString()}
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
