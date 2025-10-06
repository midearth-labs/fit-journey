
// Default Values
export const DEFAULT_VALUES = {
  TIMEZONE: 'UTC-7',
  REMINDER_TIME: '19:00',
  LOG_MUTATION_DAYS_BACK: 10,
} as const;

export const FIVE_STAR_LOG_KEYS = ['dailyMovement', 'cleanEating', 'sleepQuality', 'hydration', 'moodCheck', 'energyLevel'] as const;
export const MEASUREMENT_LOG_KEYS = ['weight', 'stepsWalked', 'cardioMinutes', 'pushups'] as const;
export const ALL_LOG_KEYS = [...FIVE_STAR_LOG_KEYS, ...MEASUREMENT_LOG_KEYS] as const;


export type AllLogKeysType = (typeof ALL_LOG_KEYS)[number];
export type FiveStarLogKeysType = (typeof FIVE_STAR_LOG_KEYS)[number];
export type MeasurementLogKeysType = (typeof MEASUREMENT_LOG_KEYS)[number];
export const FIVE_STAR_VALUES = [1, 2, 3, 4, 5] as const;
export type FiveStarValuesType = (typeof FIVE_STAR_VALUES)[number];
export const YES_NO_VALUES = [1, 0] as const;
export type YesNoValuesType = (typeof YES_NO_VALUES)[number];

// New JSONB types for the updated schema
export type FiveStarValuesPayload = Partial<Record<FiveStarLogKeysType, FiveStarValuesType>>;
export type MeasurementValuesPayload = Partial<Record<MeasurementLogKeysType, number>>;

// Updated DailyLogPayload to use the new structure
export type DailyLogValuePayload = {
  fiveStar: FiveStarValuesPayload;
  measurement: MeasurementValuesPayload;
};
