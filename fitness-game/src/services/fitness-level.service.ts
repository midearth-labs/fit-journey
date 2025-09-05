import { 
  IFitnessLevelHistoryRepository, 
  IUserProfileRepository,
  IStreakLogRepository 
} from '@/repositories';
import { 
  IFitnessLevelService, 
  IDateTimeService,
  FitnessLevelCalculationDto,
  FitnessLevelResult
} from '@/shared/interfaces';
import { ResourceNotFoundError } from '@/shared/errors';

export class FitnessLevelService implements IFitnessLevelService {
  constructor(
    private readonly fitnessLevelHistoryRepository: IFitnessLevelHistoryRepository,
    private readonly userProfileRepository: IUserProfileRepository,
    private readonly streakLogRepository: IStreakLogRepository,
    private readonly dateTimeService: IDateTimeService
  ) {}

  async calculateFitnessLevel(dto: FitnessLevelCalculationDto): Promise<FitnessLevelResult> {
    // Get user's recent activity (last 30 days)
    const thirtyDaysAgo = this.dateTimeService.getUtcDateString(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const today = this.dateTimeService.getUtcDateString();

    const recentLogs = await this.streakLogRepository.findByUserInDateRange(
      dto.userId, 
      thirtyDaysAgo, 
      today
    );

    // Calculate fitness level based on quiz performance and habit completion
    const fitnessLevel = this.calculateLevelFromActivity(recentLogs, dto.quizPerformance);

    // Get current fitness level
    const userProfile = await this.userProfileRepository.findByUserId(dto.userId);
    if (!userProfile) {
      throw new ResourceNotFoundError('User profile');
    }

    const currentLevel = userProfile.current_fitness_level;
    const levelChanged = currentLevel !== fitnessLevel;

    if (levelChanged) {
      // Create new fitness level history entry
      await this.fitnessLevelHistoryRepository.create({
        user_id: dto.userId,
        fitness_level: fitnessLevel,
        calculated_at: this.dateTimeService.getUtcNow()
      });

      // Update user profile
      await this.userProfileRepository.update(userProfile.id, {
        current_fitness_level: fitnessLevel
      });
    }

    return {
      newFitnessLevel: fitnessLevel,
      previousFitnessLevel: currentLevel,
      levelChanged,
      calculationDate: this.dateTimeService.getUtcNow()
    };
  }

  private calculateLevelFromActivity(
    recentLogs: any[], 
    quizPerformance?: { accuracy: number; consistency: number }
  ): number {
    let level = 0; // Start at neutral level

    // Calculate habit completion score (0-1)
    const habitScore = this.calculateHabitScore(recentLogs);
    
    // Calculate quiz performance score (0-1)
    const quizScore = quizPerformance 
      ? (quizPerformance.accuracy + quizPerformance.consistency) / 2 
      : 0.5;

    // Combine scores with weights
    const combinedScore = (habitScore * 0.6) + (quizScore * 0.4);

    // Convert to fitness level (-5 to +5)
    if (combinedScore >= 0.9) level = 5;
    else if (combinedScore >= 0.8) level = 4;
    else if (combinedScore >= 0.7) level = 3;
    else if (combinedScore >= 0.6) level = 2;
    else if (combinedScore >= 0.5) level = 1;
    else if (combinedScore >= 0.4) level = 0;
    else if (combinedScore >= 0.3) level = -1;
    else if (combinedScore >= 0.2) level = -2;
    else if (combinedScore >= 0.1) level = -3;
    else if (combinedScore >= 0.05) level = -4;
    else level = -5;

    return level;
  }

  private calculateHabitScore(recentLogs: any[]): number {
    if (recentLogs.length === 0) return 0.5; // Neutral if no data

    let totalScore = 0;
    let dayCount = 0;

    for (const log of recentLogs) {
      const entries = log.entries;
      const dayScore = (
        (entries.workout_completed ? 1 : 0) +
        (entries.ate_clean ? 1 : 0) +
        (entries.slept_well ? 1 : 0) +
        (entries.hydrated ? 1 : 0) +
        (entries.quiz_completed ? 1 : 0)
      ) / 5; // 5 habits total

      totalScore += dayScore;
      dayCount++;
    }

    return dayCount > 0 ? totalScore / dayCount : 0.5;
  }

  async getFitnessLevelHistory(userId: string, limit?: number): Promise<any[]> {
    return this.fitnessLevelHistoryRepository.findByUser(userId, limit);
  }
}
