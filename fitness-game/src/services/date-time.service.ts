// src/services/date-time.service.ts

import { IDateTimeService } from '../shared/interfaces';

export class DateTimeService implements IDateTimeService {
  getUtcNow(): Date {
    return new Date(); // Returns current date/time in UTC
  }

  getUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  getUtcDateString(date?: Date): string {
    return date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  }

  // Challenge-specific date methods
  getTodayUtcDateString(): string {
    return new Date().toISOString().split('T')[0];
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
}