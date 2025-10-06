<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { CalendarIcon, ChevronLeft, ChevronRight, Edit, Trash2, Download, Filter } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { format, parseISO, subDays, addDays, isWithinInterval } from 'date-fns';
	import { apiClient } from '$lib/stores/api-client';
	import { logsViewStore } from '../stores/logs-view.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { LogType } from '$lib/server/content/types/log-type';
	import LogFormPopover from './LogFormPopover.svelte';

	// Types
	type UserLogs = ApiResponse['listLogs'];
	type UserChallenges = ApiResponse['listChallengesJoinedByUser'];

	// Props
	let {
		logs,
		challenges,
		logTypes,
		onRefresh
	}: {
		logs: UserLogs;
		challenges: UserChallenges;
		logTypes: LogType[];
		onRefresh: () => void;
	} = $props();

	// State
	let currentPage = $state(1);
	let pageSize = $state(25);
	let selectedPeriod = $state<'7d' | '30d' | '90d' | 'custom'>('30d');
	let customStartDate = $state('');
	let customEndDate = $state('');
	let filterType = $state<'all' | 'with-challenges' | 'perfect-days' | 'missing-logs'>('all');
	let sortBy = $state<'date' | 'metrics' | 'challenges'>('date');
	let sortOrder = $state<'asc' | 'desc'>('desc');

	// Filtered and sorted logs
	const filteredLogs = $derived(() => {
		let filtered = [...logs];

		// Apply period filter
		if (selectedPeriod !== 'custom') {
			const now = new Date();
			let startDate: Date;
			
			switch (selectedPeriod) {
				case '7d':
					startDate = subDays(now, 7);
					break;
				case '30d':
					startDate = subDays(now, 30);
					break;
				case '90d':
					startDate = subDays(now, 90);
					break;
			}
			
			filtered = filtered.filter(log => {
				const logDate = parseISO(log.logDate);
				return logDate >= startDate && logDate <= now;
			});
		} else if (customStartDate && customEndDate) {
			filtered = filtered.filter(log => {
				const logDate = parseISO(log.logDate);
				const start = parseISO(customStartDate);
				const end = parseISO(customEndDate);
				return isWithinInterval(logDate, { start, end });
			});
		}

		// Apply type filter
		switch (filterType) {
			case 'with-challenges':
				filtered = filtered.filter(log => {
					const logDate = parseISO(log.logDate);
					return challenges.some(challenge => {
						const startDate = parseISO(challenge.startDate);
						const endDate = new Date(startDate);
						endDate.setDate(endDate.getDate() + challenge.durationDays);
						return challenge.status === 'active' && logDate >= startDate && logDate <= endDate;
					});
				});
				break;
			case 'perfect-days':
				filtered = filtered.filter(log => {
					const fiveStarCount = Object.values(log.values.fiveStar).filter(v => v !== undefined).length;
					const measurementCount = Object.values(log.values.measurement).filter(v => v !== undefined).length;
					return fiveStarCount + measurementCount >= 5; // Consider "perfect" if 5+ metrics
				});
				break;
			case 'missing-logs':
				// This would show dates without logs, but we only have logged dates
				// For now, show logs with minimal data
				filtered = filtered.filter(log => {
					const fiveStarCount = Object.values(log.values.fiveStar).filter(v => v !== undefined).length;
					const measurementCount = Object.values(log.values.measurement).filter(v => v !== undefined).length;
					return fiveStarCount + measurementCount <= 2;
				});
				break;
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0;
			
			switch (sortBy) {
				case 'date':
					comparison = a.logDate.localeCompare(b.logDate);
					break;
				case 'metrics':
					const aCount = Object.values(a.values.fiveStar).filter(v => v !== undefined).length +
						Object.values(a.values.measurement).filter(v => v !== undefined).length;
					const bCount = Object.values(b.values.fiveStar).filter(v => v !== undefined).length +
						Object.values(b.values.measurement).filter(v => v !== undefined).length;
					comparison = aCount - bCount;
					break;
				case 'challenges':
					const aChallenges = getActiveChallengesForDate(a.logDate).length;
					const bChallenges = getActiveChallengesForDate(b.logDate).length;
					comparison = aChallenges - bChallenges;
					break;
			}
			
			return sortOrder === 'asc' ? comparison : -comparison;
		});

		return filtered;
	});

	// Paginated logs
	const paginatedLogs = $derived(() => {
		const start = (currentPage - 1) * pageSize;
		const end = start + pageSize;
		return filteredLogs().slice(start, end);
	});

	// Total pages
	const totalPages = $derived(() => Math.ceil(filteredLogs().length / pageSize));

	// Get active challenges for a specific date
	function getActiveChallengesForDate(dateStr: string) {
		const logStatus = logsViewStore.getLogStatusForDate(parseISO(dateStr));
		return logStatus.activeChallenges;
	}

	// Get log status for a date
	function getLogStatus(log: UserLogs[0]): 'logged' | 'partial' | 'minimal' {
		const logStatus = logsViewStore.getLogStatusForDate(parseISO(log.logDate));
		if (logStatus.status === 'logged') return 'logged';
		if (logStatus.status === 'partial') return 'partial';
		return 'minimal';
	}

	// Get metrics count for a log
	function getMetricsCount(log: UserLogs[0]): number {
		const logStatus = logsViewStore.getLogStatusForDate(parseISO(log.logDate));
		return logStatus.allLoggedKeys.length;
	}

	// Handle log deletion
	async function handleDeleteLog(logDate: string) {
		if (!confirm('Are you sure you want to delete this log entry?')) return;
		
		try {
			await apiClient.deleteLog(logDate);
			await logsViewStore.refresh();
			onRefresh();
		} catch (err) {
			console.error('Error deleting log:', err);
			alert('Failed to delete log entry');
		}
	}

	// Handle period change
	function handlePeriodChange(period: string | null) {
		if (period) {
			selectedPeriod = period as typeof selectedPeriod;
			currentPage = 1; // Reset to first page
		}
	}

	// Handle page change
	function handlePageChange(page: number) {
		currentPage = page;
	}

	// Handle sort change
	function handleSort(column: typeof sortBy) {
		if (sortBy === column) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortOrder = 'desc';
		}
	}

	// Export data
	function exportData() {
		const csvContent = [
			['Date', 'Five Star Metrics', 'Measurement Metrics', 'Total Metrics', 'Active Challenges'],
			...filteredLogs().map(log => {
				const fiveStarCount = Object.values(log.values.fiveStar).filter(v => v !== undefined).length;
				const measurementCount = Object.values(log.values.measurement).filter(v => v !== undefined).length;
				const totalMetrics = fiveStarCount + measurementCount;
				const activeChallenges = getActiveChallengesForDate(log.logDate).length;
				
				return [
					log.logDate,
					fiveStarCount.toString(),
					measurementCount.toString(),
					totalMetrics.toString(),
					activeChallenges.toString()
				];
			})
		].map(row => row.join(',')).join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `logs-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Reset filters
	function resetFilters() {
		selectedPeriod = '30d';
		customStartDate = '';
		customEndDate = '';
		filterType = 'all';
		sortBy = 'date';
		sortOrder = 'desc';
		currentPage = 1;
	}
</script>

<div class="space-y-4">
	<!-- Filters and Controls -->
	<Card>
		<CardHeader>
			<CardTitle class="text-lg">Log History</CardTitle>
			<CardDescription>
				View and manage your daily log entries
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<!-- Period and Filter Controls -->
			<div class="flex flex-wrap gap-4 items-end">
				<!-- Period Selector -->
				<div class="space-y-2">
					<Label class="text-sm font-medium">Period</Label>
					<Select type="single" bind:value={selectedPeriod} onValueChange={(value) => handlePeriodChange(value)}>
						<SelectTrigger class="w-32">
							<span>{selectedPeriod}</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 3 months</SelectItem>
							<SelectItem value="custom">Custom range</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<!-- Custom Date Range -->
				{#if selectedPeriod === 'custom'}
					<div class="flex gap-2 items-end">
						<div class="space-y-2">
							<Label class="text-sm font-medium">From</Label>
							<Input
								type="date"
								bind:value={customStartDate}
								class="w-40"
							/>
						</div>
						<div class="space-y-2">
							<Label class="text-sm font-medium">To</Label>
							<Input
								type="date"
								bind:value={customEndDate}
								class="w-40"
							/>
						</div>
					</div>
				{/if}

				<!-- Filter Type -->
				<div class="space-y-2">
					<Label class="text-sm font-medium">Filter</Label>
					<Select type="single" bind:value={filterType} onValueChange={(value) => filterType = value as typeof filterType || 'all'}>
						<SelectTrigger class="w-40">
							<span>{filterType}</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All logs</SelectItem>
							<SelectItem value="with-challenges">With challenges</SelectItem>
							<SelectItem value="perfect-days">Perfect days</SelectItem>
							<SelectItem value="missing-logs">Minimal logs</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<!-- Actions -->
				<div class="flex gap-2 ml-auto">
					<Button variant="outline" size="sm" onclick={resetFilters}>
						<Filter class="h-4 w-4 mr-2" />
						Reset
					</Button>
					<Button variant="outline" size="sm" onclick={exportData}>
						<Download class="h-4 w-4 mr-2" />
						Export
					</Button>
				</div>
			</div>

			<!-- Results Summary -->
			<div class="text-sm text-muted-foreground">
				Showing {paginatedLogs().length} of {filteredLogs().length} log entries
			</div>
		</CardContent>
	</Card>

	<!-- Table -->
	<Card>
		<CardContent class="p-0">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead 
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => handleSort('date')}
						>
							<div class="flex items-center gap-2">
								Date
								{#if sortBy === 'date'}
									<span class="text-xs">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead 
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => handleSort('metrics')}
						>
							<div class="flex items-center gap-2">
								Metrics
								{#if sortBy === 'metrics'}
									<span class="text-xs">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead 
							class="cursor-pointer hover:bg-muted/50"
							onclick={() => handleSort('challenges')}
						>
							<div class="flex items-center gap-2">
								Challenges
								{#if sortBy === 'challenges'}
									<span class="text-xs">
										{sortOrder === 'asc' ? '↑' : '↓'}
									</span>
								{/if}
							</div>
						</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each paginatedLogs() as log}
						{@const activeChallenges = getActiveChallengesForDate(log.logDate)}
						{@const logStatus = getLogStatus(log)}
						{@const metricsCount = getMetricsCount(log)}
						<TableRow>
							<TableCell class="font-medium">
								{format(parseISO(log.logDate), 'MMM d, yyyy')}
							</TableCell>
							<TableCell>
								<div class="space-y-1">
									<div class="text-sm">
										{Object.values(log.values.fiveStar).filter(v => v !== undefined).length} five-star
									</div>
									<div class="text-sm text-muted-foreground">
										{Object.values(log.values.measurement).filter(v => v !== undefined).length} measurements
									</div>
								</div>
							</TableCell>
							<TableCell>
								{#if activeChallenges.length > 0}
									<div class="space-y-1">
										{#each activeChallenges as challenge}
											<Badge variant="outline" class="text-xs">
												{challenge.name}
											</Badge>
										{/each}
									</div>
								{:else}
									<span class="text-muted-foreground text-sm">None</span>
								{/if}
							</TableCell>
							<TableCell>
								<Badge variant={
									logStatus === 'logged' ? 'default' :
									logStatus === 'partial' ? 'secondary' : 'outline'
								}>
									{logStatus}
								</Badge>
							</TableCell>
							<TableCell>
								<div class="flex items-center gap-2">
									<LogFormPopover
										selectedDate={parseISO(log.logDate)}
										logTypes={logsViewStore.logTypes}
										challenges={logsViewStore.challenges}
										logs={logsViewStore.logs}
										onSubmit={onRefresh}
									>
										<Button variant="ghost" size="sm">
											<Edit class="h-4 w-4" />
										</Button>
									</LogFormPopover>
									<Button 
										variant="ghost" 
										size="sm"
										onclick={() => handleDeleteLog(log.logDate)}
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</CardContent>
	</Card>

	<!-- Pagination -->
	{#if totalPages() > 1}
		<Card>
			<CardContent class="flex items-center justify-between py-4">
				<div class="text-sm text-muted-foreground">
					Page {currentPage} of {totalPages()}
				</div>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === 1}
						onclick={() => handlePageChange(currentPage - 1)}
					>
						<ChevronLeft class="h-4 w-4" />
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={currentPage === totalPages()}
						onclick={() => handlePageChange(currentPage + 1)}
					>
						Next
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>
