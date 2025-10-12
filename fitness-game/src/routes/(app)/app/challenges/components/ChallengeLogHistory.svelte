<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Activity, Filter } from 'lucide-svelte';
	import { getRelativeTime } from '../utils/challenge-helpers';
	import { onMount } from 'svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { AllLogKeysType, FiveStarLogKeysType, MeasurementLogKeysType } from '$lib/config/constants';

	// Type definitions
	type UserLog = ApiResponse['listLogs'][number];
	type ChallengeDetail = ApiResponse['getChallenge'] | ApiResponse['getUserChallenge'];
	type LogKeyType = AllLogKeysType | 'all';

	let { 
		challenge, 
		userLogs 
	} : {
		challenge: ChallengeDetail;
		userLogs: UserLog[];
	} = $props();

	let selectedLogType = $state<LogKeyType>('all');

	// Load log types on mount if not already loaded
	onMount(async () => {
		if (challengesStore.logTypes.length === 0) {
			await challengesStore.loadLogTypes();
		}
	});

	let filteredLogs = $derived.by(() => {
		if (selectedLogType === 'all') {
			return userLogs;
		}
		
		return userLogs.filter((log: UserLog) => {
			// Check if the log contains the selected log type
			//Keys are unique so we can use some to check if the log contains the selected log type across both fiveStar and measurement and any future log types
			return Object.values(log.values).some(value => selectedLogType in value);
		});
	});

	// Get available log types from the challenge
	const availableLogTypes = $derived.by(() => {
		return ['all', ...challenge.logTypes];
	});

	// Get log value with appropriate unit
	function getLogValueWithUnit(logType: string, value: number | undefined): string {
		if (value === undefined || value === null) return '-';
		
		// Add units for measurement types
		const measurementUnits: Record<MeasurementLogKeysType, string> = {
			'weight': ' lbs',
			'stepsWalked': ' steps',
			'cardioMinutes': ' min',
			'pushups': ' reps'
		};
		
		const unit = logType in measurementUnits ? measurementUnits[logType as MeasurementLogKeysType] : '';
		return value.toString() + unit;
	}

	// Check if a log has any values
	function countLogValues(log: UserLog): number {
		return Object.values(log.values)
		.map(value => Object.keys(value).length)
		.reduce((a, b) => a + b, 0);
	}

	// Get log type display name
	function getLogTypeDisplayName(logType: string): string {
		if (logType === 'all') return 'All Types';
		const logTypeDetail = challengesStore.getLogTypeByKey(logType);
		return logTypeDetail?.display_title || logType;
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Activity class="h-5 w-5" />
			<h3 class="text-lg font-semibold">My Activity</h3>
		</div>
		
		<!-- Filter -->
		<div class="flex items-center gap-2">
			<Filter class="h-4 w-4 text-muted-foreground" />
			<select 
				bind:value={selectedLogType}
				class="text-sm border rounded px-2 py-1"
			>
				{#each availableLogTypes as logType}
					<option value={logType}>
						{getLogTypeDisplayName(logType)}
					</option>
				{/each}
			</select>
		</div>
	</div>

	{#if filteredLogs.length > 0}
		<!-- Logs List -->
		<div class="space-y-3">
			{#each filteredLogs as log}
				<Card.Root>
					<Card.Content class="pt-4">
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
									<Calendar class="h-5 w-5 text-primary" />
								</div>
								<div>
									<h4 class="font-medium">
										{new Date(log.logDate).toLocaleDateString('en-US', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric'
										})}
									</h4>
									<p class="text-sm text-muted-foreground">
										{getRelativeTime(log.logDate)}
									</p>
								</div>
							</div>
							
							<Badge variant="outline">
								{countLogValues(log)} entries
							</Badge>
						</div>

						<!-- Log Values -->
						{#if countLogValues(log) > 0}
							<div class="mt-4 space-y-3">
								<!-- Five Star Values -->
								{#if Object.keys(log.values.fiveStar || {}).length > 0}
									<div>
										<h5 class="text-sm font-medium mb-2">Daily Ratings</h5>
										<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
											{#each Object.entries(log.values.fiveStar || {}) as [logType, value]}
												{@const numValue = value as number}
												<div class="flex items-center justify-between p-2 rounded border">
													<span class="text-sm">{getLogTypeDisplayName(logType)}</span>
													<div class="flex items-center gap-1">
														{#each [1, 2, 3, 4, 5] as star}
															<div class="h-3 w-3 rounded-full {star <= numValue ? 'bg-yellow-400' : 'bg-gray-200'}"></div>
														{/each}
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Measurement Values -->
								{#if Object.keys(log.values.measurement || {}).length > 0}
									<div>
										<h5 class="text-sm font-medium mb-2">Measurements</h5>
										<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
											{#each Object.entries(log.values.measurement || {}) as [logType, value]}
												{@const numValue = value as number}
												<div class="flex items-center justify-between p-2 rounded border">
													<span class="text-sm">{getLogTypeDisplayName(logType)}</span>
													<span class="text-sm font-medium">
														{getLogValueWithUnit(logType, numValue)}
													</span>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="mt-4 p-3 bg-muted/50 rounded-lg">
								<p class="text-sm text-muted-foreground text-center">
									No log entries for this date
								</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Summary -->
		<div class="flex items-center justify-between pt-4 border-t">
			<p class="text-sm text-muted-foreground">
				Showing {filteredLogs.length} of {userLogs.length} log entries
			</p>
			{#if selectedLogType !== 'all'}
				<Button 
					variant="outline" 
					size="sm"
					onclick={() => selectedLogType = 'all'}
				>
					Clear Filter
				</Button>
			{/if}
		</div>
	{:else}
		<!-- Empty State -->
		<Card.Root class="text-center py-12">
			<Card.Content>
				<Activity class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
				<h3 class="text-lg font-semibold mb-2">
					{selectedLogType === 'all' ? 'No Activity Yet' : 'No Activity for This Type'}
				</h3>
				<p class="text-muted-foreground mb-6">
					{selectedLogType === 'all' 
						? 'Start logging your daily activities to see your progress here!'
						: `No logs found for ${getLogTypeDisplayName(selectedLogType)}. Try a different filter or start logging this metric.`
					}
				</p>
				{#if selectedLogType !== 'all'}
					<Button 
						variant="outline"
						onclick={() => selectedLogType = 'all'}
					>
						Show All Activity
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
