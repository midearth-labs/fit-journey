// src/services/date-time.service.ts

import { type DatesOnEarthAtInstant, type Offsets } from '$lib/server/shared/interfaces';

export type IDateTimeHelper = {
  getUnixTimestamp(date: Date): number;
  getUtcDateString(date: Date): string; // Returns YYYY-MM-DD format
  daysOffsetFromDateOnly(dateOnly: string, offset: number): string; // Returns date with offset days from date only (no time/timezone), return the date part only in ISO format
  
  // Challenge-specific date methods
  isDateInFuture(dateString: string, requestDate: Date): boolean; // Check if date is in the future
  getPossibleDatesOnEarthAtInstant(instant: Date): DatesOnEarthAtInstant; // Get all possible actual dates (YYYY-MM-DD) on earth at the time of the input date
  getDatesFromInstantWithOffset(instant: Date, offsets: Offsets): DatesOnEarthAtInstant;
};

export class DateTimeHelper implements IDateTimeHelper {
  // @TODO: this should be made static
  getUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  // @TODO: this should be made static
  getUtcDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // @TODO: use highest timezone time calc to compare.
  isDateInFuture(dateString: string, requestDate: Date): boolean {
    const { latest} = this.getPossibleDatesOnEarthAtInstant(requestDate);
    return dateString > latest;
  }

  getDatesFromInstantWithOffset(instant: Date, offsets: Offsets) {
    const offsetInstant = new Date(instant.getTime());
    if (offsets.days) {
      offsetInstant.setDate(offsetInstant.getDate() + offsets.days);
    }
    if (offsets.hours) {
      offsetInstant.setHours(offsetInstant.getHours() + offsets.hours);
    }
    if (offsets.minutes) {
      offsetInstant.setMinutes(offsetInstant.getMinutes() + offsets.minutes);
    }
    if (offsets.seconds) {
      offsetInstant.setSeconds(offsetInstant.getSeconds() + offsets.seconds);
    }
    if (offsets.milliseconds) {
      offsetInstant.setMilliseconds(offsetInstant.getMilliseconds() + offsets.milliseconds);
    }
    return this.getPossibleDatesOnEarthAtInstant(offsetInstant);
  }

  getPossibleDatesOnEarthAtInstant(instant: Date) {  
    // Get the milliseconds timestamp for easier manipulation, ensuring we preserve the instant.
    const ms = instant.getTime();

    const instantUTC = this.getUtcDateString(instant);
    // 1. Calculate the instant adjusted for the latest timezone (UTC-12:00).
    // This is 12 hours earlier than the UTC instant.
    const instantMinus12Hours = this.getUtcDateString(new Date(ms - (12 * 60 * 60 * 1000)));

    // 2. Calculate the instant adjusted for the earliest timezone (UTC+14:00).
    // This is 14 hours later than the UTC instant.
    const instantPlus14Hours = this.getUtcDateString(new Date(ms + (14 * 60 * 60 * 1000)));

    return {
      earliest: instantMinus12Hours,
      utc: instantUTC,
      latest: instantPlus14Hours,
    };
  }

  daysOffsetFromDateOnly(date: string, offset: number): string {
    const dateObj = new Date(date + "T00:00:00.000Z");
    dateObj.setDate(dateObj.getDate() + offset);
    return dateObj.toISOString().split('T')[0];
  }
}