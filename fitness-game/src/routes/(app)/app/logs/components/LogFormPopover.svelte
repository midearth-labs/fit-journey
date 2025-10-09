<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Separator } from '$lib/components/ui/separator';
	import { Star, Target, Info } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { format, parseISO } from 'date-fns';
	import { apiClient } from '$lib/stores/api-client';
	import { logsViewStore } from '../stores/logs-view.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { LogType } from '$lib/server/content/types/log-type';
	import type { FiveStarValuesPayload, MeasurementValuesPayload } from '$lib/config/constants';

	// Types
	type UserLogs = ApiResponse['listLogs'];
	type UserChallenges = ApiResponse['listChallengesJoinedByUser'];

	// Props
	let {
		selectedDate,
		logTypes,
		challenges,
		logs,
		onSubmit,
		children
	}: {
		selectedDate: Date;
		logTypes: LogType[];
		challenges: UserChallenges;
		logs: UserLogs;
		onSubmit: () => void;
		children: any;
	} = $props();

	// State
	let isOpen = $state(false);
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	// Form state
	let fiveStarValues = $state<FiveStarValuesPayload>({});
	let measurementValues = $state<MeasurementValuesPayload>({});

	// Unit conversion state
	let unitConversions = $state<Record<string, { primary: number; display: number; unit: string }>>({});

	// Check if date is valid for logging
	const isDateValid = $derived.by(() => logsViewStore.isDateValidForLogging(selectedDate));

	// Get existing log for selected date
	const existingLog = $derived.by(() => logsViewStore.getExistingLog(selectedDate));

	// Get active challenges for selected date
	const activeChallenges = $derived.by(() => {
		const logStatus = logsViewStore.getLogStatusForDate(selectedDate);
		return logStatus.activeChallenges;
	});

	// Get suggested log types from active challenges
	const suggestedLogTypes = $derived.by(() => logsViewStore.getSuggestedLogTypes(selectedDate));

	// Separate log types into suggested and standard
	const suggestedLogTypesList = $derived.by(() => suggestedLogTypes);
	const standardLogTypesList = $derived.by(() => {
		return logTypes.filter(logType => !suggestedLogTypes.some(suggested => suggested.id === logType.id));
	});

	// Initialize form with existing data
	$effect(() => {
		if (existingLog && isOpen) {
			fiveStarValues = { ...existingLog!.values.fiveStar };
			measurementValues = { ...existingLog!.values.measurement };
			
			// Initialize unit conversions
			Object.entries(measurementValues).forEach(([key, value]) => {
				if (value !== undefined) {
					const logType = logTypes.find(lt => lt.id === key);
					if (logType && logType.type.type === 'float' && logType.type.unit === 'kgs') {
						unitConversions[key] = {
							primary: value,
							display: value * 2.20462, // kg to lbs
							unit: 'lbs'
						};
					}
				}
			});
		} else if (isOpen) {
			// Reset form for new log
			fiveStarValues = {};
			measurementValues = {};
			unitConversions = {};
		}
	});

	// Load global stats for date validation
	async function loadGlobalStats() {
		// No longer needed - handled by store
	}

	// Handle form submission
	async function handleSubmit() {
		if (!isDateValid) {
			error = 'Cannot log for this date';
			return;
		}

		try {
			isLoading = true;
			error = null;

			const dateStr = format(selectedDate, 'yyyy-MM-dd');
			
			// Prepare payload
			const payload = {
				values: {
					fiveStar: fiveStarValues,
					measurement: measurementValues
				}
			};

			// Submit log
			await apiClient.putLog(dateStr, payload);

			// Close popover and notify parent
			isOpen = false;
			onSubmit();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save log';
			console.error('Error submitting log:', err);
		} finally {
			isLoading = false;
		}
	}

	// Handle star rating change
	function handleStarChange(logTypeId: string, value: number) {
		fiveStarValues = {
			...fiveStarValues,
			[logTypeId]: value
		};
	}

	// Handle measurement change
	function handleMeasurementChange(logTypeId: string, value: number) {
		measurementValues = {
			...measurementValues,
			[logTypeId]: value
		};
	}

	// Handle unit conversion
	function handleUnitConversion(logTypeId: string, displayValue: number, isDisplayUnit: boolean) {
		const logType = logTypes.find(lt => lt.id === logTypeId);
		if (!logType || logType.type.type !== 'float' || logType.type.unit !== 'kgs') return;

		let primaryValue: number;
		let displayValueNew: number;

		if (isDisplayUnit) {
			// Converting from display unit (lbs) to primary unit (kgs)
			primaryValue = displayValue / 2.20462;
			displayValueNew = displayValue;
		} else {
			// Converting from primary unit (kgs) to display unit (lbs)
			primaryValue = displayValue;
			displayValueNew = displayValue * 2.20462;
		}

		unitConversions[logTypeId] = {
			primary: primaryValue,
			display: displayValueNew,
			unit: 'lbs'
		};

		measurementValues = {
			...measurementValues,
			[logTypeId]: primaryValue
		};
	}

	// Check if form has any values
	const hasValues = $derived.by(() => Object.keys(fiveStarValues).length > 0 || Object.keys(measurementValues).length > 0);

	// Open popover and load data
	async function handleOpenChange(open: boolean) {
		isOpen = open;
		// No longer need to load global stats - handled by store
	}
</script>

<Popover bind:open={isOpen} onOpenChange={handleOpenChange}>
	<PopoverTrigger>
		{@render children()}
	</PopoverTrigger>
	<PopoverContent class="w-96 max-h-[80vh] overflow-y-auto" align="start">
		<div class="space-y-4">
			<!-- Header -->
			<div class="space-y-2">
				<h3 class="font-semibold">Log Metrics</h3>
				<p class="text-sm text-muted-foreground">
					{format(selectedDate, 'EEEE, MMMM d, yyyy')}
				</p>
				{#if !isDateValid}
					<Badge variant="destructive" class="text-xs">
						Date outside allowed range
					</Badge>
				{/if}
			</div>

			{#if error}
				<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}

			<!-- Challenge Context -->
			{#if activeChallenges.length > 0}
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm flex items-center gap-2">
							<Target class="h-4 w-4" />
							Active Challenges
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-2">
						{#each activeChallenges as challenge}
							<div class="flex items-center justify-between text-sm">
								<span>{challenge.name}</span>
								<Badge variant="outline" class="text-xs">
									{logsViewStore.challengeProgress.find(cp => cp.id === challenge.id)?.dailyLogCount || 0}/{challenge.durationDays} days
								</Badge>
							</div>
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Suggested Metrics -->
			{#if suggestedLogTypesList.length > 0}
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm flex items-center gap-2">
							<Target class="h-4 w-4" />
							Suggested for Challenges
						</CardTitle>
						<CardDescription class="text-xs">
							These metrics align with your active challenges
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						{#each suggestedLogTypesList as logType}
							{#if logType.type.type === '5star'}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Label for={logType.id} class="text-sm font-medium">
											{logType.display_title}
										</Label>
										<Badge variant="secondary" class="text-xs">
											<Target class="h-3 w-3 mr-1" />
											Suggested
										</Badge>
									</div>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<button
												type="button"
												class={cn(
													"p-1 rounded transition-colors",
													(i + 1) <= (fiveStarValues[logType.id as keyof typeof fiveStarValues] || 0) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
												)}
												onclick={() => handleStarChange(logType.id, i + 1)}
											>
												<Star class="h-5 w-5 fill-current" />
											</button>
										{/each}
										{#if fiveStarValues[logType.id as keyof typeof fiveStarValues]}
											<span class="ml-2 text-sm text-muted-foreground">{fiveStarValues[logType.id as keyof typeof fiveStarValues]}/5</span>
										{/if}
									</div>
									{#if logType.description}
										<p class="text-xs text-muted-foreground">{logType.description}</p>
									{/if}
								</div>
							{:else if logType.type.type === 'float' || logType.type.type === 'integer'}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Label for={logType.id} class="text-sm font-medium">
											{logType.display_title}
										</Label>
										<Badge variant="secondary" class="text-xs">
											<Target class="h-3 w-3 mr-1" />
											Suggested
										</Badge>
									</div>
									
									{#if logType.id === 'weight' && logType.type.type === 'float' && logType.type.unit === 'kgs' && unitConversions[logType.id]}
										<!-- Unit conversion inputs -->
										<div class="grid grid-cols-2 gap-2">
											<div>
												<Label for={`${logType.id}-kg`} class="text-xs text-muted-foreground">kg</Label>
												<Input
													id={`${logType.id}-kg`}
													type="number"
													step="0.1"
													min={logType.type.min}
													max={logType.type.max}
													bind:value={unitConversions[logType.id].primary}
													placeholder="0.0"
												/>
											</div>
											<div>
												<Label for={`${logType.id}-lbs`} class="text-xs text-muted-foreground">lbs</Label>
												<Input
													id={`${logType.id}-lbs`}
													type="number"
													step="0.1"
													bind:value={unitConversions[logType.id].display}
													placeholder="0.0"
												/>
											</div>
										</div>
									{:else}
										<!-- Standard input -->
										<Input
											id={logType.id}
											type="number"
											step={logType.type.type === 'float' ? '0.1' : '1'}
											min={logType.type.min}
											max={logType.type.max}
											bind:value={measurementValues[logType.id as keyof typeof measurementValues]}
											placeholder="0"
										/>
									{/if}
									
									{#if logType.description}
										<p class="text-xs text-muted-foreground">{logType.description}</p>
									{/if}
								</div>
							{/if}
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Standard Metrics -->
			{#if standardLogTypesList.length > 0}
				<Card>
					<CardHeader class="pb-3">
						<CardTitle class="text-sm">Additional Metrics</CardTitle>
						<CardDescription class="text-xs">
							Track additional metrics for personal insights
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4">
						{#each standardLogTypesList as logType}
							{#if logType.type.type === '5star'}
								<div class="space-y-2">
									<Label for={logType.id} class="text-sm font-medium">
										{logType.display_title}
									</Label>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<button
												type="button"
												class={cn(
													"p-1 rounded transition-colors",
													(i + 1) <= (fiveStarValues[logType.id as keyof typeof fiveStarValues] || 0) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
												)}
												onclick={() => handleStarChange(logType.id, i + 1)}
											>
												<Star class="h-5 w-5 fill-current" />
											</button>
										{/each}
										{#if fiveStarValues[logType.id as keyof typeof fiveStarValues]}
											<span class="ml-2 text-sm text-muted-foreground">{fiveStarValues[logType.id as keyof typeof fiveStarValues]}/5</span>
										{/if}
									</div>
									{#if logType.description}
										<p class="text-xs text-muted-foreground">{logType.description}</p>
									{/if}
								</div>
							{:else if logType.type.type === 'float' || logType.type.type === 'integer'}
								<div class="space-y-2">
									<Label for={logType.id} class="text-sm font-medium">
										{logType.display_title}
									</Label>
									<Input
										id={logType.id}
										type="number"
										step={logType.type.type === 'float' ? '0.1' : '1'}
										min={logType.type.min}
										max={logType.type.max}
										bind:value={measurementValues[logType.id as keyof typeof measurementValues]}
										placeholder="0"
									/>
									{#if logType.description}
										<p class="text-xs text-muted-foreground">{logType.description}</p>
									{/if}
								</div>
							{/if}
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Actions -->
			<div class="flex gap-2 pt-4">
				<Button
					variant="outline"
					onclick={() => (isOpen = false)}
					class="flex-1"
				>
					Cancel
				</Button>
				<Button
					onclick={handleSubmit}
					disabled={!hasValues || !isDateValid || isLoading}
					class="flex-1"
				>
					{isLoading ? 'Saving...' : 'Save Log'}
				</Button>
			</div>
		</div>
	</PopoverContent>
</Popover>