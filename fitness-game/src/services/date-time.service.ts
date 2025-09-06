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
}