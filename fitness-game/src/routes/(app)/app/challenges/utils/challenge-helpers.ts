import type { ApiResponse } from '$lib/client/api-client';
import type { LogType } from '$lib/types/content';

type ChallengeStatus = ApiResponse['getChallenge']['status'];

/**
 * Format a date range for display
 * @param startDate - ISO date string
 * @param endDate - ISO date string
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: string, endDate: string): string {
	const start = new Date(startDate);
	const end = new Date(endDate);
	
	const startFormatted = start.toLocaleDateString('en-US', { 
		month: 'short', 
		day: 'numeric' 
	});
	
	const endFormatted = end.toLocaleDateString('en-US', { 
		month: 'short', 
		day: 'numeric',
		year: 'numeric'
	});
	
	return `${startFormatted} - ${endFormatted}`;
}

/**
 * Calculate challenge progress metrics
 * @param startDate - Challenge start date
 * @param endDate - Challenge end date
 * @param logsCount - Number of logs completed
 * @returns Progress metrics object
 */
export function calculateProgress(
	startDate: string,
	endDate: string,
	logsCount: number
): {
	totalDays: number;
	elapsedDays: number;
	completionRate: number;
	daysWithLogs: number;
} {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const now = new Date();
	
	// Calculate total days in challenge
	const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	
	// Calculate elapsed days (how many days have passed since start)
	const elapsedDays = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
	
	// Calculate completion rate based on elapsed days
	const completionRate = elapsedDays > 0 ? Math.min(100, (logsCount / elapsedDays) * 100) : 0;
	
	return {
		totalDays,
		elapsedDays: Math.min(elapsedDays, totalDays),
		completionRate: Math.round(completionRate),
		daysWithLogs: logsCount
	};
}

/**
 * Get Tailwind color class based on challenge status
 * @param status - Challenge status
 * @returns Tailwind color class string
 */
export function getChallengeStatusColor(status: ChallengeStatus): string {
	const colorMap: Record<ChallengeStatus, string> = {
		'not_started': 'text-gray-500 bg-gray-100',
		'active': 'text-green-600 bg-green-100',
		'completed': 'text-blue-600 bg-blue-100',
		'locked': 'text-red-600 bg-red-100',
		'inactive': 'text-gray-400 bg-gray-50'
	};
	
	return colorMap[status] || colorMap['inactive'];
}

/**
 * Check if a challenge can be joined
 * @param challenge - Challenge object
 * @returns Whether the challenge is joinable
 */
export function isChallengeJoinable(challenge: any): boolean {
	// Check if challenge is full
	if (challenge.membersCount >= challenge.maxMembers) {
		return false;
	}
	
	// Check if challenge status allows joining
	const joinableStatuses: ChallengeStatus[] = ['not_started', 'active'];
	return joinableStatuses.includes(challenge.status);
}

/**
 * Check if user can edit a challenge
 * @param challenge - Challenge object
 * @param userId - User ID to check ownership
 * @returns Whether the user can edit the challenge
 */
export function canEditChallenge(challenge: any, userId: string): boolean {
	return challenge.userId === userId;
}

/**
 * Format duration for display
 * @param days - Number of days
 * @returns Formatted duration string
 */
export function formatDuration(days: number): string {
	if (days === 1) return '1 day';
	if (days < 7) return `${days} days`;
	if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''}`;
	if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''}`;
	return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''}`;
}

/**
 * Get relative time string for a date
 * @param date - ISO date string
 * @returns Relative time string
 */
export function getRelativeTime(date: string): string {
	const now = new Date();
	const targetDate = new Date(date);
	const diffInMs = now.getTime() - targetDate.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	
	if (diffInDays === 0) return 'Today';
	if (diffInDays === 1) return 'Yesterday';
	if (diffInDays < 7) return `${diffInDays} days ago`;
	if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
	if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
	return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Check if a date is in the past
 * @param date - ISO date string
 * @returns Whether the date is in the past
 */
export function isDateInPast(date: string): boolean {
	return new Date(date) < new Date();
}

/**
 * Check if a date is today
 * @param date - ISO date string
 * @returns Whether the date is today
 */
export function isDateToday(date: string): boolean {
	const today = new Date();
	const targetDate = new Date(date);
	
	return today.toDateString() === targetDate.toDateString();
}

/**
 * Get the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export function getDaysBetween(startDate: string, endDate: string): number {
	const start = new Date(startDate);
	const end = new Date(endDate);
	
	return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get challenge status display text
 * @param status - Challenge status
 * @returns Display text for status
 */
export function getChallengeStatusText(status: ChallengeStatus): string {
	const statusTexts: Record<ChallengeStatus, string> = {
		'not_started': 'Not Started',
		'active': 'Active',
		'completed': 'Completed',
		'locked': 'Locked',
		'inactive': 'Inactive'
	};
	
	return statusTexts[status] || 'Unknown';
}

/**
 * Get join type display text
 * @param joinType - Join type
 * @returns Display text for join type
 */
export function getJoinTypeText(joinType: string): string {
	const joinTypeTexts: Record<string, string> = {
		'personal': 'Personal',
		'public': 'Public',
		'invite-code': 'Invite Only'
	};
	
	return joinTypeTexts[joinType] || joinType;
}
