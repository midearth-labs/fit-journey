import { guestGatingStore } from '$lib/stores/guest-gating';

/**
 * Authentication utilities for managing guest gating state
 */
export class AuthUtils {
  /**
   * Clear guest gating state after successful authentication
   * This should be called when a user successfully signs up or logs in
   */
  static clearGuestGatingState(): void {
    guestGatingStore.clear();
    console.log('Guest gating state cleared after authentication');
  }

  /**
   * Mark user as registered in guest gating store
   * This can be used to prevent further nudges for authenticated users
   */
  static markAsRegistered(): void {
    guestGatingStore.markAsRegistered();
    console.log('User marked as registered in guest gating store');
  }

  /**
   * Check if user came from guest gating flow
   * This can be used to show special onboarding for users who converted
   */
  static isFromGuestGating(): boolean {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('source') === 'guest-gating';
  }

  /**
   * Get guest gating conversion analytics
   * Useful for tracking conversion rates from guest browsing
   */
  static getConversionAnalytics() {
    return {
      articlesRead: guestGatingStore.subscribe(state => state.articlesRead),
      nudgeShownCount: guestGatingStore.subscribe(state => state.nudgeShownCount),
      lastNudgeDismissedAt: guestGatingStore.subscribe(state => state.lastNudgeDismissedAt),
    };
  }
}
