/**
 * Dashboard Helper Utilities
 */

/**
 * Get a date N days ago in ISO format
 */
export function getDaysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date.toISOString().split('T')[0];
}

/**
 * Get today's date in ISO format
 */
export function getToday(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Get 7 days ago date in ISO format
 */
export function getSevenDaysAgo(): string {
	return getDaysAgo(7);
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

/**
 * Get time-based greeting
 */
export function getTimeBasedGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

/**
 * Calculate days between two dates
 */
export function getDaysBetween(date1: Date, date2: Date): number {
	const oneDay = 1000 * 60 * 60 * 24;
	const diffTime = Math.abs(date2.getTime() - date1.getTime());
	return Math.floor(diffTime / oneDay);
}
