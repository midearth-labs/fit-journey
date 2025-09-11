import { 
  IStreakLogRepository, 
  IStreakHistoryRepository, 
  IUserProfileRepository 
} from '@/repositories/';
import { 
  IStreakService, 
  IDateTimeService,
  StreakType,
  StreakCalculationResult,
  HabitLogDto,
  QuizCompletionDto,
  HabitType
} from '@/shared/interfaces';
import { 
  ResourceNotFoundError,
  ValidationError 
} from '@/shared/errors';
import { StreakLog, StreakHistory, UserProfile } from '@/lib/db/schema';

export class StreakService implements IStreakService {
  constructor(
    private readonly streakLogRepository: IStreakLogRepository,
    private readonly streakHistoryRepository: IStreakHistoryRepository,
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly dateTimeService: IDateTimeService
  ) {}

  async logHabits(dto: HabitLogDto): Promise<StreakCalculationResult[]> {
    const todayUtc = this.dateTimeService.getUtcDateString();
    
    // Get or create today's streak log
    let streakLog = await this.streakLogRepository.findByUserAndDate(dto.userId, todayUtc);
    
    if (!streakLog) {
      streakLog = await this.streakLogRepository.create({
        user_id: dto.userId,
        date_utc: todayUtc,
        entries: {
          workout_completed: dto.habits.workout_completed,
          ate_clean: dto.habits.ate_clean,
          slept_well: dto.habits.slept_well,
          hydrated: dto.habits.hydrated,
          quiz_completed: undefined,
          quiz_passed: undefined,
          all: undefined
        }
      });
    } 

    // Update the specific habit
    const updatedEntries = {
      ...streakLog.entries,
      workout_completed: dto.habits.workout_completed,
      ate_clean: dto.habits.ate_clean,
      slept_well: dto.habits.slept_well,
      hydrated: dto.habits.hydrated,
    };

    // Check if all habits are completed for "all" streak
    const allHabitsCompleted = Object.values(updatedEntries).every(entry => entry === true);
    updatedEntries.all = allHabitsCompleted;

    // Update the streak log
    const updatedLog = await this.streakLogRepository.update(streakLog.id, dto.userId, {
      entries: updatedEntries
    });

    if (!updatedLog) {
      throw new ResourceNotFoundError('Streak log');
    }

    // Calculate streaks for all updated habit types
    const results: StreakCalculationResult[] = [];
    
    // Process each habit type that was updated
    const habitTypes: HabitType[] = ['workout_completed', 'ate_clean', 'slept_well', 'hydrated'];
    
    for (const habitType of habitTypes) {
      if (dto.habits[habitType] !== undefined) {
        const streakResults = await this.calculateStreaksForHabit(dto.userId, habitType);
        
        // Update user profile with new streak information
        await this.updateUserProfileStreaks(dto.userId, streakResults);
        
        results.push({
          habitType: habitType,
          completed: dto.habits[habitType] || false,
          currentStreakLength: streakResults.currentStreak?.streak_length || 0,
          isNewStreak: streakResults.isNewStreak,
          isStreakExtended: streakResults.isStreakExtended
        });
      }
    }

    return results;
  }

  async logQuizCompletion(dto: QuizCompletionDto): Promise<StreakCalculationResult> {
    const todayUtc = this.dateTimeService.getUtcDateString();
    
    // Get or create today's streak log
    let streakLog = await this.streakLogRepository.findByUserAndDate(dto.userId, todayUtc);
    
    if (!streakLog) {
      streakLog = await this.streakLogRepository.create({
        user_id: dto.userId,
        date_utc: todayUtc,
        entries: {
          workout_completed: false,
          ate_clean: false,
          slept_well: false,
          hydrated: false,
          quiz_completed: false,
          quiz_passed: false,
          all: false
        }
      });
    }

    // Update quiz-related entries
    const updatedEntries = {
      ...streakLog.entries,
      quiz_completed: true,
      quiz_passed: dto.allCorrect
    };

    // Check if all habits are completed for "all" streak
    const allHabitsCompleted = Object.values(updatedEntries).every(entry => entry === true);
    updatedEntries.all = allHabitsCompleted;

    // Update the streak log
    const updatedLog = await this.streakLogRepository.update(streakLog.id, dto.userId, {
      entries: updatedEntries
    });

    if (!updatedLog) {
      throw new ResourceNotFoundError('Streak log');
    }

    // Calculate streaks for both quiz_completed and quiz_passed
    const quizCompletedResults = await this.calculateStreaksForHabit(dto.userId, 'quiz_completed');
    const quizPassedResults = dto.allCorrect 
      ? await this.calculateStreaksForHabit(dto.userId, 'quiz_passed')
      : null;

    // Update user profile with new streak information
    await this.updateUserProfileStreaks(dto.userId, quizCompletedResults);
    if (quizPassedResults) {
      await this.updateUserProfileStreaks(dto.userId, quizPassedResults);
    }

    return {
      habitType: 'quiz_completed',
      completed: true,
      currentStreakLength: quizCompletedResults.currentStreak?.streak_length || 0,
      isNewStreak: quizCompletedResults.isNewStreak,
      isStreakExtended: quizCompletedResults.isStreakExtended
    };
  }

  private async calculateStreaksForHabit(
    userId: string, 
    habitType: StreakType
  ): Promise<{
    currentStreak: StreakHistory | null;
    isNewStreak: boolean;
    isStreakExtended: boolean;
  }> {
    const todayUtc = this.dateTimeService.getUtcDateString();
    const yesterdayUtc = this.dateTimeService.getUtcDateString(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Get current streak for this habit type
    const currentStreak = await this.streakHistoryRepository.findCurrentStreakByUserAndType(
      userId, 
      habitType
    );

    // Get recent streak logs to check continuity
    const recentLogs = await this.streakLogRepository.findByUserInDateRange(
      userId, 
      yesterdayUtc, 
      todayUtc
    );

    const todayLog = recentLogs.find(log => log.date_utc === todayUtc);
    const yesterdayLog = recentLogs.find(log => log.date_utc === yesterdayUtc);

    if (!todayLog || !todayLog.entries[habitType]) {
      // No activity today, no streak change
      return {
        currentStreak,
        isNewStreak: false,
        isStreakExtended: false
      };
    }

    if (!currentStreak) {
      // No existing streak, create new one
      const newStreak = await this.streakHistoryRepository.create({
        user_id: userId,
        streak_type: habitType,
        streak_length: 1,
        started_date: todayUtc,
        ended_date: null
      });

      return {
        currentStreak: newStreak,
        isNewStreak: true,
        isStreakExtended: false
      };
    }

    // Check if yesterday's activity was completed
    const wasActiveYesterday = yesterdayLog && yesterdayLog.entries[habitType];

    if (wasActiveYesterday) {
      // Extend existing streak
      const updatedStreak = await this.streakHistoryRepository.update(currentStreak.id, userId, {
        streak_length: currentStreak.streak_length + 1
      });

      return {
        currentStreak: updatedStreak,
        isNewStreak: false,
        isStreakExtended: true
      };
    } else {
      // Streak broken, end current streak and start new one
      await this.streakHistoryRepository.update(currentStreak.id, userId, {
        ended_date: yesterdayUtc
      });

      const newStreak = await this.streakHistoryRepository.create({
        user_id: userId,
        streak_type: habitType,
        streak_length: 1,
        started_date: todayUtc,
        ended_date: null
      });

      return {
        currentStreak: newStreak,
        isNewStreak: true,
        isStreakExtended: false
      };
    }
  }

  private async updateUserProfileStreaks(
    userId: string, 
    streakResults: {
      currentStreak: StreakHistory | null;
      isNewStreak: boolean;
      isStreakExtended: boolean;
    }
  ): Promise<void> {
    if (!streakResults.currentStreak) return;

    const userProfile = await this.userProfileRepository.findByUserId(userId);
    if (!userProfile) {
      throw new ResourceNotFoundError('User profile');
    }

    const currentStreakIds = userProfile.current_streak_ids || {};
    const longestStreaks = userProfile.longest_streaks || {};

    // Update current streak ID
    // @TODO double check this
    currentStreakIds[streakResults.currentStreak.streak_type as StreakType] = streakResults.currentStreak.id;

    // Check if this is a new longest streak
    const longestStreak = await this.streakHistoryRepository.findLongestStreakByUserAndType(
      userId, 
      streakResults.currentStreak.streak_type
    );

    if (longestStreak && longestStreak.id === streakResults.currentStreak.id) {
      // @TODO double check this
      longestStreaks[streakResults.currentStreak.streak_type as StreakType] = streakResults.currentStreak.id;
    }

    // Update user profile
    await this.userProfileRepository.update(userProfile.id, {
      current_streak_ids: currentStreakIds,
      longest_streaks: longestStreaks,
      last_activity_date: this.dateTimeService.getUtcDateString()
    });
  }

  async getCurrentStreaks(userId: string): Promise<Record<StreakType, number>> {
    const userProfile = await this.userProfileRepository.findByUserId(userId);
    if (!userProfile || !userProfile.current_streak_ids) {
      return this.getEmptyStreakRecord();
    }

    const streakLengths: Record<StreakType, number> = this.getEmptyStreakRecord();

    for (const [streakType, streakId] of Object.entries(userProfile.current_streak_ids)) {
      if (streakId) {
        const streak = await this.streakHistoryRepository.findById(streakId, userId);
        if (streak) {
          streakLengths[streakType as StreakType] = streak.streak_length;
        }
      }
    }

    return streakLengths;
  }

  private getEmptyStreakRecord(): Record<StreakType, number> {
    return {
      workout_completed: 0,
      ate_clean: 0,
      slept_well: 0,
      hydrated: 0,
      quiz_completed: 0,
      quiz_passed: 0,
      all: 0
    };
  }
}
