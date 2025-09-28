import { writable } from '$lib/stores/local-storage-store';

/**
 * Guest Article Gating Store
 * 
 * Manages the state for guest article gating nudges that encourage registration
 * without blocking content access. Uses localStorage for persistence.
 * 
 * Configuration:
 * - N: Number of articles before first nudge (default: 3)
 * - O: Number of subsequent articles before re-nudge (default: 2) 
 * - T: Time elapsed before re-nudge (default: 24 hours)
 */

export type GuestGatingState = {
  articlesRead: string[]; // List of unique article IDs that have been read
  lastNudgeDismissedAt: number | null;
  articlesReadAtLastNudge: string[] | null; // Track article IDs when last nudge was dismissed
  nudgeShownCount: number;
  isRegistered: boolean;
}

const STORAGE_KEY = 'fitjourney-guest-gating';

// Default configuration
const CONFIG = {
  FIRST_NUDGE_AFTER: 3,        // N: Show first nudge after 3 articles
  SUBSEQUENT_NUDGE_AFTER: 2,   // O: Show subsequent nudges after 2 more articles
  TIME_BEFORE_RENUDGE: 24 * 60 * 60 * 1000, // T: 24 hours in milliseconds
} as const;

const defaultState: GuestGatingState = {
  articlesRead: [],
  lastNudgeDismissedAt: null,
  articlesReadAtLastNudge: null,
  nudgeShownCount: 0,
  isRegistered: false,
};

function createGuestGatingStore() {
  const { subscribe, set, update } = writable<GuestGatingState>(STORAGE_KEY, defaultState);

  return {
    subscribe,
    set,
    update,
    
    /**
     * Log that a specific article was read (with deduplication)
     */
    logArticleRead: function (articleId: string) {
      update(state => {
        // Add article ID if not already in the list (deduplication)
        const updatedArticles = state.articlesRead.includes(articleId) 
          ? state.articlesRead 
          : [...state.articlesRead, articleId];
        
        return {
          ...state,
          articlesRead: updatedArticles,
        };
      });
    },

    /**
     * Record that a nudge was dismissed
     */
    dismissNudge: function () {
      update(state => ({
        ...state,
        lastNudgeDismissedAt: Date.now(),
        articlesReadAtLastNudge: [...state.articlesRead], // Store current article list
        nudgeShownCount: state.nudgeShownCount + 1,
      }));
    },

    /**
     * Mark user as registered (clears gating state)
     */
    markAsRegistered: function () {
      update(state => ({
        ...state,
        isRegistered: true,
      }));
    },

    /**
     * Check if a nudge should be shown
     */
    shouldShowNudge: function (): boolean {
      let shouldShow = false;
      
      subscribe(state => {
        // Don't show nudges for registered users
        if (state.isRegistered) {
          shouldShow = false;
          return;
        }

        // First nudge: after N articles
        if (state.nudgeShownCount === 0) {
          shouldShow = state.articlesRead.length >= CONFIG.FIRST_NUDGE_AFTER;
        } else {
          // Subsequent nudges: after O articles OR T time elapsed
          const articlesSinceLastNudge = state.articlesReadAtLastNudge !== null 
            ? state.articlesRead.length - state.articlesReadAtLastNudge.length
            : state.articlesRead.length - CONFIG.FIRST_NUDGE_AFTER;
          const timeSinceLastNudge = state.lastNudgeDismissedAt ? Date.now() - state.lastNudgeDismissedAt : Infinity;
          
          shouldShow = articlesSinceLastNudge >= CONFIG.SUBSEQUENT_NUDGE_AFTER || 
                      timeSinceLastNudge >= CONFIG.TIME_BEFORE_RENUDGE;
        }
      })();

      return shouldShow;
    },

    /**
     * Get the next nudge trigger info for debugging/display
     */
    getNextNudgeInfo: function () {
      let info = { articlesUntilNext: 0, timeUntilNext: 0 };
      
      subscribe(state => {
        if (state.isRegistered) {
          info = { articlesUntilNext: 0, timeUntilNext: 0 };
          return;
        }

        if (state.nudgeShownCount === 0) {
          // First nudge
          info.articlesUntilNext = Math.max(0, CONFIG.FIRST_NUDGE_AFTER - state.articlesRead.length);
          info.timeUntilNext = 0;
        } else {
          // Subsequent nudges
          const articlesSinceLastNudge = state.articlesReadAtLastNudge !== null 
            ? state.articlesRead.length - state.articlesReadAtLastNudge.length
            : state.articlesRead.length - CONFIG.FIRST_NUDGE_AFTER;
          const timeSinceLastNudge = state.lastNudgeDismissedAt ? Date.now() - state.lastNudgeDismissedAt : 0;
          
          info.articlesUntilNext = Math.max(0, CONFIG.SUBSEQUENT_NUDGE_AFTER - articlesSinceLastNudge);
          info.timeUntilNext = Math.max(0, CONFIG.TIME_BEFORE_RENUDGE - timeSinceLastNudge);
        }
      })();

      return info;
    },

    /**
     * Clear all gating state (called after successful registration)
     */
    clear: function () {
      set(defaultState);
    },

    /**
     * Reset for testing purposes
     */
    reset: function () {
      set(defaultState);
    }
  };
}

export const guestGatingStore = createGuestGatingStore();