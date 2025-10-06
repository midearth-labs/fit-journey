import { ApiClient, type ApiResponse } from '$lib/client/api-client';
import { contentService } from '$lib/services/content.service';
import { DEFAULT_VALUES, type AllLogKeysType } from '$lib/config/constants';
import { format, parseISO, subDays, addDays, eachDayOfInterval } from 'date-fns';
import type { LogType } from '$lib/server/content/types/log-type';

// Type inference from ApiClient methods
type GlobalStatistics = ApiResponse['getGlobalStatistics'];
type UserLogs = ApiResponse['listLogs'];
type UserChallenges = ApiResponse['listChallengesJoinedByUser'];

// Enhanced types for computed data
type LogStatus = {
		// Overall logging state for the date
		// e.g., 'logged' | 'partial' | 'missing' | 'unknown' | 'future' | 'locked'
	status: 'logged' | 'partial' | 'missing' | 'unknown' | 'future' | 'locked';
		// Keys logged in the five-star metrics for the date
		// e.g., ['sleep_quality', 'energy']
	fiveStarKeys: AllLogKeysType[];
		// Keys logged in the measurement metrics for the date
		// e.g., ['steps', 'water_intake']
	measurementKeys: AllLogKeysType[];
		// Union of all metric keys logged (five-star + measurement)
		// e.g., ['sleep_quality', 'energy', 'steps']
	allLoggedKeys: AllLogKeysType[];
		// Challenges that are active on this date
		// e.g., [{ id: 'c1', name: 'Hydration Streak', ... }]
	activeChallenges: UserChallenges;
		// Recommended keys (from active challenges) that are not yet logged
		// e.g., ['water_intake'] when hydration challenge is active but missing log
    missingRecommendedKeys: AllLogKeysType[];
}

type ChallengeProgress = {
		// Unique identifier of the challenge
		// e.g., 'challenge_123'
	id: string;
		// Human-readable challenge name
		// e.g., '30-Day Hydration'
	name: string;
		// Completion percentage (0–100) based on days with logs in the period
		// e.g., 66.7
	progress: number;
		// Remaining days in the challenge calculated from duration and logs
		// e.g., 10
	daysRemaining: number;
		// Number of days with at least one log during the challenge period
		// e.g., 12
	dailyLogCount: number;
		// Total number of days the challenge runs
		// e.g., 30
	durationDays: number;
		// Required log type identifiers for the challenge
		// e.g., ['water_intake', 'sleep_quality']
	requiredLogTypes: string[];
		// Current status of the challenge (source of truth from API)
		// e.g., 'active' | 'completed' | 'paused'
	status: UserChallenges[number]['status'];
}

type LogInsights = {
		// Current consecutive days with logs up to the reference date
		// e.g., 5
	currentStreak: number;
		// Longest ever consecutive days streak found in the dataset
		// e.g., 14
	longestStreak: number;
		// Total count of distinct days that have logs
		// e.g., 47
	totalDaysLogged: number;
		/**
		 * Actionable momentum per metric comparing latest 7-day window to previous 7-day window.
		 * When data is insufficient for either window, `{ missing: true }` is recorded for that key.
		 * Example:
		 * Map(
		 *   'sleep_quality' => { avg: +0.4, min: +1, max: +2 },
		 *   'water_intake' => { missing: true }
		 * )
		 */
	weeklyTrend: Map<AllLogKeysType, { avg: number; min: number; max: number } | {missing: true}>;
		// Percentage of days with logs in the last 7 days (0–100)
		// e.g., 71
	lastSevenDaysCompletion: number;
}

type ChartData = {
		/**
		 * Time-series points for trend visualization over the selected range.
		 * Example item: { date: '2025-10-01', displayDate: 'Oct 1', metricsCount: 3 }
		 */
		trendData: Array<{
			// ISO date string corresponding to the log
			// e.g., '2025-10-01'
			date: string;
			// Short, human-friendly date for chart labels
			// e.g., 'Oct 1'
			displayDate: string;
			// Count of metrics logged (five-star + measurement) for that date
			// e.g., 3
			metricsCount: number;
		}>;
		/**
		 * Calendar heatmap cells derived from daily activity and challenges.
		 * Example item:
		 * { date: '2025-10-01', displayDate: 'Oct 1', intensity: 0.6, challengeDay: true, hasLog: true }
		 */
		heatmapData: Array<{
			// ISO date string represented by the heatmap cell
			// e.g., '2025-10-01'
			date: string;
			// Short label for display inside the heatmap tooltip
			// e.g., 'Oct 1'
			displayDate: string;
			// Normalized activity intensity in [0, 1]
			// e.g., 0.6
			intensity: number;
			// Whether any challenge is active on this date
			// e.g., true
			challengeDay: boolean;
			// Whether at least one log exists for this date
			// e.g., true
			hasLog: boolean;
		}>;
		// Progress list for currently joined challenges (filtered to active where needed)
		// e.g., [{ id: 'c1', name: 'Hydration', progress: 40, ... }]
	challengeProgress: ChallengeProgress[];
		// Snapshot of insights used in the analytics views
		// e.g., { currentStreak: 3, longestStreak: 12, ... }
	insights: LogInsights;
}


/**
 * LogsView Store - Centralized data management for logs view
 * Handles fetching, caching, and efficient computation of logs-related data
 */
class LogsViewStore {
	// Core data
	#globalStats = $state<GlobalStatistics | null>(null);
	#sortedLogs = $state<UserLogs>([]);
	#sortedChallenges = $state<UserChallenges>([]);
	#logTypes = $state<LogType[]>([]);
	
	// Computed data structures for efficient lookups
	#logsByDate = $state<Map<string, UserLogs[0]>>(new Map());
	#challengesByDateRange = $state<Map<string, UserChallenges>>(new Map());
	
	// Computed insights and analytics
	#challengeProgress = $state<ChallengeProgress[]>([]);
	#insights = $state<LogInsights | null>(null);
	#chartData = $state<ChartData | null>(null);
	
	// State management
	#loading = $state(false);
	#error = $state<string | null>(null);
	#lastFetch = $state<number | null>(null);
	
	// Cache durations
	readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
	
	private apiClient: ApiClient;

	constructor() {
		this.apiClient = new ApiClient('', {
			'Content-Type': 'application/json'
		});
	}

	// Getters
	get globalStats() { return this.#globalStats; }
	get logs() { return this.#sortedLogs; }
	get challenges() { return this.#sortedChallenges; }
	get logTypes() { return this.#logTypes; }
	get loading() { return this.#loading; }
	get error() { return this.#error; }
	get insights() { return this.#insights; }
	get chartData() { return this.#chartData; }
	get challengeProgress() { return this.#challengeProgress; }

	/**
	 * Load all logs-related data
	 */
	async loadData(force = false) {
		const now = Date.now();
		
		if (!force && this.#lastFetch && now - this.#lastFetch < this.CACHE_DURATION) {
			return; // Use cached data
		}

		this.#loading = true;
		this.#error = null;

		try {
			// Load static data
			const [globalStats, logTypes] = await Promise.all([
				this.apiClient.getGlobalStatistics(),
				contentService.loadLogTypes()
			]);

			this.#globalStats = globalStats;
			this.#logTypes = logTypes;

			// Load period data (last 3 months)
			await this.loadPeriodData();
			
			this.#lastFetch = now;
		} catch (err: any) {
			this.#error = err.message || 'Failed to load logs data';
			console.error('LogsView load error:', err);
		} finally {
			this.#loading = false;
		}
	}

	/**
	 * Load logs and challenges for the current period
	 */
	async loadPeriodData() {
		if (!this.#globalStats) return;

		try {
			const latestDate = parseISO(this.#globalStats.serverDateRanges.latest);
			const fromDate = subDays(latestDate, 90).toISOString().split('T')[0];
			const toDate = latestDate.toISOString().split('T')[0];

			const [logsData, challengesData] = await Promise.all([
				this.apiClient.listLogs({ fromDate, toDate }),
				this.apiClient.listChallengesJoinedByUser({})
			]);

		    // Sort data once
			this.#sortedLogs = logsData.toSorted((a, b) => a.logDate.localeCompare(b.logDate));
			this.#sortedChallenges = challengesData.toSorted((a, b) => a.startDate.localeCompare(b.startDate));
			
			// Recompute all derived data
			this.computeDerivedData();
		} catch (err: any) {
			this.#error = err.message || 'Failed to load period data';
			console.error('Period data load error:', err);
		}
	}

	/**
	 * Compute all derived data structures for efficient lookups
	 * Optimized to compute challenge progress inline to avoid redundant log filtering
	 */
	private computeDerivedData() {
		// Build date maps for O(1) lookups - maps log dates to log objects
		this.#logsByDate = new Map<string, UserLogs[0]>(this.#sortedLogs.map(log => [log.logDate, log]));
		
		// Initialize challenge log counting map - tracks how many logs each challenge has
		// Key: challenge.id, Value: count of logs within challenge period
		const challengeLogCounts = new Map<string, number>();
		
		// Build challenge date ranges map (optimized algorithm)
		const localChallengesByDateRange = new Map<string, UserChallenges>();
		
		if (this.#sortedChallenges.length > 0) {
			// Find the overall date range across all challenges using string comparison
			// This minimizes the number of dates we need to iterate through
			const minStartDate = parseISO(this.#sortedChallenges[0].startDate);
			const maxEndDate = parseISO(this.#sortedChallenges.reduce((max, challenge) => {
				return challenge.endDate > max ? challenge.endDate : max;
			}, this.#sortedChallenges[0].endDate));

			// Generate dates only once for the entire range
			// This is the core optimization: single pass through all relevant dates
			eachDayOfInterval({ start: minStartDate, end: maxEndDate }).forEach(date => {
				const dateStr = format(date, 'yyyy-MM-dd');
				
				// Filter challenges that are active on this date using string comparison
				const challengesForDate = this.#sortedChallenges.filter(challenge => 
					dateStr >= challenge.startDate && dateStr <= challenge.endDate
				);
				
				if (challengesForDate.length > 0) {
					// Store challenges for this date for later lookup
					localChallengesByDateRange.set(dateStr, challengesForDate);
					
					// OPTIMIZATION: Count logs for each active challenge on this date
					// Instead of filtering all logs for each challenge later, we count as we go
					const logForDate = this.#logsByDate.get(dateStr);
					if (logForDate) {
						// Increment log count for each challenge that's active on this date
						challengesForDate.forEach(challenge => {
							const currentCount = challengeLogCounts.get(challenge.id) || 0;
							challengeLogCounts.set(challenge.id, currentCount + 1);
						});
					}
				}
			});
		}
		
		this.#challengesByDateRange = localChallengesByDateRange;

		// Compute challenge progress using pre-computed log counts
		// This eliminates the need for separate computeChallengeProgress() method
		this.#challengeProgress = this.#sortedChallenges.map(challenge => {
			// Use pre-computed log count instead of filtering logs again
			const dailyLogCount = challengeLogCounts.get(challenge.id) || 0;
			const progress = Math.min((dailyLogCount / challenge.durationDays) * 100, 100);
			const daysRemaining = Math.max(challenge.durationDays - dailyLogCount, 0);
			
			return {
				id: challenge.id,
				name: challenge.name,
				progress,
				daysRemaining,
				dailyLogCount,
				durationDays: challenge.durationDays,
				requiredLogTypes: challenge.logTypes,
				status: challenge.status
			};
		});
		
		// Compute insights
		this.computeInsights();
		
		// Compute chart data
		this.computeChartData();
	}

	/**
	 * Get log status for a specific date
	 */
	getLogStatusForDate(date: Date): LogStatus {
        let fiveStarKeys: AllLogKeysType[] = [], measurementKeys: AllLogKeysType[] = [];
        let allLoggedKeys: AllLogKeysType[] = [], missingRecommendedKeys: AllLogKeysType[] = [];
        let activeChallenges: UserChallenges = [];
        let status: LogStatus['status'] = 'unknown';

		if (this.#globalStats) {
            const maxDate = parseISO(this.#globalStats.serverDateRanges.latest);
            const minDate = subDays(parseISO(this.#globalStats.serverDateRanges.earliest), DEFAULT_VALUES.LOG_MUTATION_DAYS_BACK);
            const dateStr = format(date, 'yyyy-MM-dd');
            activeChallenges = this.#challengesByDateRange.get(dateStr) || [];
            const recommendedKeys = Array.from(
                new Set(
                    activeChallenges.flatMap(challenge => challenge.logTypes || [])
                )
            );
            const logEntry = this.#logsByDate.get(dateStr);
            
            if (logEntry) {
                fiveStarKeys = Object.keys(logEntry.values.fiveStar) as AllLogKeysType[];
                measurementKeys = Object.keys(logEntry.values.measurement) as AllLogKeysType[];
                allLoggedKeys = [...fiveStarKeys, ...measurementKeys] as AllLogKeysType[];
                missingRecommendedKeys = recommendedKeys.filter(metric => !allLoggedKeys.includes(metric));
            }

            if (date > maxDate) status = 'future';
            else if (date < minDate) status = 'locked';
            else if (logEntry) {
                // allLoggedKeys.length  should not be 0 but here for defensive programming
                status = allLoggedKeys.length === 0 || missingRecommendedKeys.length > 0 ? 'partial' : 'logged';
            } else {
                status = 'missing';
            }
        }
    
        return {
            status,
            fiveStarKeys,
            measurementKeys,
            allLoggedKeys,
            activeChallenges,
            missingRecommendedKeys
        };
	}

	/**
	 * Compute insights and analytics
	 */
	private computeInsights() {
		if (!this.#sortedLogs.length || !this.#globalStats) {
			this.#insights = {
				currentStreak: 0,
				longestStreak: 0,
				totalDaysLogged: 0,
				weeklyTrend: new Map(),
				lastSevenDaysCompletion: 0
			};
			return;
		}

		// Calculate streaks
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 0;

		// Current streak calculation
		// Check if streak is currently active by seeing if the most recent log
		// is on or very close to "today" (any of the server date ranges)
		let streakCurrentlyOn: boolean = false;
		const dateRanges = this.#globalStats.serverDateRanges;
		const lastLogDate = this.#sortedLogs[this.#sortedLogs.length - 1].logDate;
		
		// Check if the most recent log is on any of the server date ranges
		for (const date of [dateRanges.latest, dateRanges.utc, dateRanges.earliest]) {
			if (date === lastLogDate) {
				streakCurrentlyOn = true;
				break;
			}
		}
		
		// If streak is not currently active, currentStreak = 0
		if (!streakCurrentlyOn) {
			currentStreak = 0;
		} else {
			// Count consecutive days backwards from the most recent log
			currentStreak = 1; // Start with 1 for the most recent log
			
			// Iterate backwards through sortedLogs to count consecutive days
			for (let i = this.#sortedLogs.length - 2; i >= 0; i--) {
				const currentLogDate = parseISO(this.#sortedLogs[i].logDate);
				const nextLogDate = parseISO(this.#sortedLogs[i + 1].logDate);
				
				// Check if current log is exactly 1 day before the next log
				const expectedDate = subDays(nextLogDate, 1);
				if (currentLogDate.getTime() === expectedDate.getTime()) {
					currentStreak++;
				} else {
					// Gap found, stop counting
					break;
				}
			}
		}

		// Longest streak calculation
		// Find the longest consecutive sequence of logged days
        let currentConsecutiveStreak = 1;
        longestStreak = 1;
        
        // Iterate through sorted logs to find consecutive sequences
        for (let i = 1; i < this.#sortedLogs.length; i++) {
            const currentLogDate = parseISO(this.#sortedLogs[i].logDate);
            const previousLogDate = parseISO(this.#sortedLogs[i - 1].logDate);
            
            // Check if current log is exactly 1 day after the previous log
            const expectedDate = addDays(previousLogDate, 1);
            if (currentLogDate.getTime() === expectedDate.getTime()) {
                // Consecutive day found, increment current streak
                currentConsecutiveStreak++;
            } else {
                // Gap found, update longest streak and reset current streak
                longestStreak = Math.max(longestStreak, currentConsecutiveStreak);
                currentConsecutiveStreak = 1;
            }
        }
        
        // Don't forget to check the final streak
        longestStreak = Math.max(longestStreak, currentConsecutiveStreak);

		// Weekly trend (actionable momentum): latest 7 days vs previous 7 days
		const lastSevenDaysCalculationReferenceDate = streakCurrentlyOn ? lastLogDate : dateRanges.utc;
		const ref = parseISO(lastSevenDaysCalculationReferenceDate);
		
		const latestStart = format(subDays(ref, 6), 'yyyy-MM-dd');
		const latestEnd = format(ref, 'yyyy-MM-dd');
		
		const prevEndDate = subDays(ref, 7);
		const prevStartDate = subDays(prevEndDate, 6);
		const prevStart = format(prevStartDate, 'yyyy-MM-dd');
		const prevEnd = format(prevEndDate, 'yyyy-MM-dd');
		
		const avgFor = (start: string, end: string): number | null => {
			const logs = this.#sortedLogs.filter(l => l.logDate >= start && l.logDate <= end);
			if (!logs.length) return null;
			const sum = logs.reduce((s, l) => {
				const vals = Object.values(l.values.fiveStar) as number[];
				const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
				return s + avg;
			}, 0);
			return sum / logs.length;
		};
		
		// Build per-metric deltas (avg/min/max) comparing latest 7-day window vs previous 7-day window
		const latestWindowLogs = this.#sortedLogs.filter(l => l.logDate >= latestStart && l.logDate <= latestEnd);
		const prevWindowLogs = this.#sortedLogs.filter(l => l.logDate >= prevStart && l.logDate <= prevEnd);

		const collectMetricValues = (logs: UserLogs) => {
			const map = new Map<AllLogKeysType, number[]>();
			for (const log of logs) {
				[...Object.entries(log.values.fiveStar), ...Object.entries(log.values.measurement)].forEach(([key, value]) => {
                    const typedKey = key as AllLogKeysType;
                    const arr = map.get(typedKey) ?? [];
                    arr.push(value);
                    map.set(typedKey, arr);
				});
			}
			return map;
		};

		const latestMetricValues = collectMetricValues(latestWindowLogs);
		const prevMetricValues = collectMetricValues(prevWindowLogs);

		const computeStats = (values: number[]) => {
			const sum = values.reduce((s, v) => s + v, 0);
			const avg = sum / values.length;
			let min = values[0];
			let max = values[0];
			for (let i = 1; i < values.length; i++) {
				if (values[i] < min) min = values[i];
				if (values[i] > max) max = values[i];
			}
			return { avg, min, max };
		};

		const weeklyTrend = new Map<AllLogKeysType, { avg: number; min: number; max: number } | {missing: true}>();
		const allKeys = new Set<AllLogKeysType>([
			...Array.from(latestMetricValues.keys()),
			...Array.from(prevMetricValues.keys())
		]);
		for (const key of allKeys) {
			const latestVals = latestMetricValues.get(key);
			const prevVals = prevMetricValues.get(key);
			if (!latestVals || !prevVals) {
				weeklyTrend.set(key, { missing: true });
				continue;
			}
			const latestStats = computeStats(latestVals);
			const prevStats = computeStats(prevVals);
			weeklyTrend.set(key, {
				avg: latestStats.avg - prevStats.avg,
				min: latestStats.min - prevStats.min,
				max: latestStats.max - prevStats.max,
			});
		}

		// Calculate the last 7 days completion
		const lastSevenDaysStart = format(subDays(lastSevenDaysCalculationReferenceDate, 7), 'yyyy-MM-dd');
		const lastSevenDaysLogs = this.#sortedLogs.filter(log => {
			return log.logDate >= lastSevenDaysStart && log.logDate <= lastSevenDaysCalculationReferenceDate;
		});
		const lastSevenDaysCompletion = Math.round((lastSevenDaysLogs.length / 7) * 100);

		this.#insights = {
			currentStreak,
			longestStreak,
			totalDaysLogged: this.#sortedLogs.length,
			weeklyTrend,
			lastSevenDaysCompletion
		};
	}

	/**
	 * Compute chart data for analytics view
	 */
	private computeChartData() {
		if (!this.#sortedLogs.length || !this.#globalStats) {
			this.#chartData = {
				trendData: [],
				heatmapData: [],
				challengeProgress: [],
				insights: this.#insights || {
					currentStreak: 0,
					longestStreak: 0,
					totalDaysLogged: 0,
					weeklyTrend: new Map(),
					lastSevenDaysCompletion: 0
				}
			};
			return;
		}

		const now = parseISO(this.#globalStats.serverDateRanges.utc);
		const startDate = subDays(now, 30); // Default to 30 days for chart data
        const nowStr = format(now, 'yyyy-MM-dd');
        const startDateStr = format(startDate, 'yyyy-MM-dd');

		// Filter logs for selected time range
		const filteredLogs = this.#sortedLogs.filter(log => {
			return log.logDate >= startDateStr && log.logDate <= nowStr;
		});

		// Calculate trend data
		const trendData = filteredLogs.map(log => {
			const metricsCount = Object.values(log.values.fiveStar).length +
				Object.values(log.values.measurement).length;

			return {
				date: log.logDate,
				displayDate: format(parseISO(log.logDate), 'MMM d'),
				metricsCount,
			};
		});

		// Calculate heatmap data
		const heatmapData = eachDayOfInterval({ start: startDate, end: now }).map(date => {
			const dateStr = format(date, 'yyyy-MM-dd');
			const logEntry = this.#logsByDate.get(dateStr);
			
			let intensity = 0;
			let challengeDay = false;
			
			if (logEntry) {
				const fiveStarCount = Object.values(logEntry.values.fiveStar).length;
				const measurementCount = Object.values(logEntry.values.measurement).length;
				intensity = Math.min((fiveStarCount + measurementCount) / this.#logTypes.length, 1);
			}

			// Check if this date has active challenges
			challengeDay = this.#challengesByDateRange.has(dateStr);

			return {
				date: dateStr,
				displayDate: format(date, 'MMM d'),
				intensity,
				challengeDay,
				hasLog: !!logEntry
			};
		});

		this.#chartData = {
			trendData,
			heatmapData,
			challengeProgress: this.#challengeProgress.filter(cp => cp.status === 'active'),
			insights: this.#insights!
		};
	}

	/**
	 * Get suggested log types for a date based on challenges
	 */
	getSuggestedLogTypes(date: Date): LogType[] {
		const dateStr = format(date, 'yyyy-MM-dd');
		const challenges = this.#challengesByDateRange.get(dateStr) || [];
		const suggested = new Set<string>();
		
		challenges.forEach(challenge => {
			challenge.logTypes.forEach(logType => suggested.add(logType));
		});
		
		return this.#logTypes.filter(logType => suggested.has(logType.id));
	}

	/**
	 * Get existing log for a date
	 */
	getExistingLog(date: Date): UserLogs[0] | undefined {
		const dateStr = format(date, 'yyyy-MM-dd');
		return this.#logsByDate.get(dateStr);
	}

	/**
	 * Check if date is valid for logging
	 */
	isDateValidForLogging(date: Date): boolean {
		const logStatus = this.getLogStatusForDate(date);
		return  !['unknown', 'future', 'locked'].includes(logStatus.status);
	}

	/**
	 * Refresh data after a log submission
	 */
	async refresh() {
		await this.loadPeriodData();
	}

	/**
	 * Reset store state
	 */
	reset() {
		this.#globalStats = null;
		this.#sortedLogs = [];
		this.#sortedChallenges = [];
		this.#logTypes = [];
		this.#logsByDate = new Map();
		this.#challengesByDateRange = new Map();
		this.#challengeProgress = [];
		this.#insights = null;
		this.#chartData = null;
		this.#loading = false;
		this.#error = null;
		this.#lastFetch = null;
	}
}

export const logsViewStore = new LogsViewStore();
