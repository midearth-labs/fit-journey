// src/services/date-time.service.ts

import { DatesOnEarthAtInstant, Offsets } from '../shared/interfaces';

export type IDateTimeService = {
  getUtcNow(): Date; // Returns current UTC Date object
  getUnixTimestamp(date: Date): number;
  getUtcDateString(date: Date): string; // Returns YYYY-MM-DD format
  
  // Challenge-specific date methods
  getTodayUtcDateString(): string; // Returns today's date in YYYY-MM-DD format
  getTwoWeeksFromTodayUtcDateString(): string; // Returns date 2 weeks from today
  getOneMonthFromDateUtcDateString(fromDate: string): string; // Returns date 1 month from given date
  getFortyEightHoursAgoUtcTimestamp(): Date; // Returns timestamp 48 hours ago
  isDateInFuture(dateString: string): boolean; // Check if date is in the future
  isDateBeforeStartDate(logDate: string, startDate: string): boolean; // Check if log date is before start date
  getChallengeEndDateUtcDateString(startDate: string, durationDays: number): string; // Calculate challenge end date
  isDateAfterChallengeEndDate(currentDate: string, endDate: string): boolean; // Check if current date is after challenge end
  getMaxLoggingDateUtcDateString(startDate: string, durationDays: number): string; // Get max date user can log habits
  isLogDateWithinChallengePeriod(logDate: string, startDate: string, durationDays: number): boolean; // Check if log date is within challenge period
  getPossibleDatesOnEarthAtInstant(instant: Date): DatesOnEarthAtInstant; // Get all possible actual dates (YYYY-MM-DD) on earth at the time of the input date
  getDatesFromInstantWithOffset(instant: Date, offsets: Offsets): DatesOnEarthAtInstant;
};

export class DateTimeService implements IDateTimeService {
  getUtcNow(): Date {
    return new Date(); // Returns current date/time in UTC
  }

  // @TODO: this should be made static
  getUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  // @TODO: this should be made static
  getUtcDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // @TODO: Challenge-specific date methods (I think these should be moved back to the challenge service as they are challenge specific)
  // or made static or in some utility module
  getTodayUtcDateString(): string {
    return this.getUtcNow().toISOString().split('T')[0];
  }

  getTwoWeeksFromTodayUtcDateString(): string {
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    return twoWeeksFromNow.toISOString().split('T')[0];
  }

  getOneMonthFromDateUtcDateString(fromDate: string): string {
    const fromDateObj = new Date(fromDate);
    const oneMonthLater = new Date(fromDateObj);
    oneMonthLater.setDate(oneMonthLater.getDate() + 31); // Using 31 days for "one month"
    return oneMonthLater.toISOString().split('T')[0];
  }

  getFortyEightHoursAgoUtcTimestamp(): Date {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setTime(fortyEightHoursAgo.getTime() - (48 * 60 * 60 * 1000));
    return fortyEightHoursAgo;
  }

  isDateInFuture(dateString: string): boolean {
    const today = this.getTodayUtcDateString();
    return dateString > today;
  }

  isDateBeforeStartDate(logDate: string, startDate: string): boolean {
    return logDate < startDate;
  }

  getChallengeEndDateUtcDateString(startDate: string, durationDays: number): string {
    const startDateObj = new Date(startDate);
    const endDate = new Date(startDateObj);
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate.toISOString().split('T')[0];
  }

  isDateAfterChallengeEndDate(currentDate: string, endDate: string): boolean {
    return currentDate > endDate;
  }

  getMaxLoggingDateUtcDateString(startDate: string, durationDays: number): string {
    // Users can log habits up to the challenge end date
    return this.getChallengeEndDateUtcDateString(startDate, durationDays);
  }

  isLogDateWithinChallengePeriod(logDate: string, startDate: string, durationDays: number): boolean {
    const endDate = this.getChallengeEndDateUtcDateString(startDate, durationDays);
    return logDate >= startDate && logDate <= endDate;
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
}