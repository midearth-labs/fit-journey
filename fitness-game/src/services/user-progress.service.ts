// src/services/user-progress.service.ts (updated)

import { IGameSessionRepository } from '@/repositories/game-session.repository';
import { 
  IUserProgressService, 
  IUserTimezoneService, 
  IDateTimeService, 
  IKnowledgeBaseService 
} from '@/shared/interfaces';
import { toZonedTime } from 'date-fns-tz';
import { differenceInCalendarDays } from 'date-fns';

export class UserProgressService implements IUserProgressService {
  constructor(
    private readonly gameSessionRepository: IGameSessionRepository,
    private readonly userTimezoneService: IUserTimezoneService,
    private readonly dateTimeService: IDateTimeService,
    private readonly knowledgeBaseService: IKnowledgeBaseService
  ) {}

  public async getCurrentDayForUser(userId: string): Promise<number> {
    const maxProgressionDay = this.knowledgeBaseService.getMaxProgressionDay();
    const nowUtc = this.dateTimeService.getUtcNow(); // Current UTC time

    // Use the new abstraction to get the last successful session
    const lastSuccessfulSession = await this.gameSessionRepository.findLastSessionByUserId(userId);

    if (!lastSuccessfulSession) {
      // If no successful sessions completed, user starts at Day 1
      return 1;
    }

    // Get the user's current timezone
    const userTimezone = await this.userTimezoneService.getUserTimezone(userId);

    // Convert both the last completion time AND current time to the user's timezone
    // to compare their calendar days consistently.
    const lastCompletionUtc = new Date(lastSuccessfulSession.completed_at); 
    const zonedLastCompletionDate = toZonedTime(lastCompletionUtc, userTimezone);
    const zonedNowDate = toZonedTime(nowUtc, userTimezone);

    // Calculate the difference in calendar days based on the user's timezone.
    // @TODO: check that this does what we expect. Look at the docs.
    const daysElapsedSinceLastCompletion = differenceInCalendarDays(zonedNowDate, zonedLastCompletionDate);

    let currentProgressionDay: number;

    if (daysElapsedSinceLastCompletion >= 1) {
      // If at least one calendar day has elapsed, advance by 1 day from the last successful day.
      currentProgressionDay = lastSuccessfulSession.day + 1;
    } else {
      // If 0 calendar days have elapsed (still same calendar day in user's timezone),
      // the user is still on the same "progression day" as their last successful session.
      // So, they are trying to start the day they just completed (or re-attempt a previous one).
      // The `GameSessionService.startOrResumeSession` will then check for a *completed* session for `currentProgressionDay`
      // and return 'completed' if found, otherwise let them start the already completed day again.
      currentProgressionDay = lastSuccessfulSession.day;
    }

    // Ensure the progression day does not exceed the maximum allowed day
    currentProgressionDay = Math.min(currentProgressionDay, maxProgressionDay);
    
    // Ensure the progression day is at least 1
    currentProgressionDay = Math.max(currentProgressionDay, 1);

    return currentProgressionDay;
  }
}