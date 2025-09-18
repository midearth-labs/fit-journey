import {
  type PutUserLogDto,
  type ListUserLogsDto,
  type UserLogResponse,
  type AuthRequestContext,
} from '$lib/server/shared/interfaces';
import { 
  ValidationError,
} from '$lib/server/shared/errors';
import { type AllLogKeysType } from '$lib/server/db/schema';
import { type IDateTimeHelper } from '../helpers/date-time.helper';
import { type IUserChallengeRepository, type IUserLogsRepository } from '$lib/server/repositories';
import { type UserLog } from '$lib/server/db/schema';


export type ILogService = {
    putUserLog(dto: PutUserLogDto): Promise<void>;
    listUserLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]>;
  };
  
export class LogService implements ILogService {
  constructor(
    private readonly dependencies: {
      readonly userChallengeRepository: IUserChallengeRepository;
      readonly userLogsRepository: IUserLogsRepository;
      readonly dateTimeHelper: IDateTimeHelper;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  
  /**
   * Put user challenge log
   * PUT /logs/:logDate
   */
  async putUserLog(dto: PutUserLogDto): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, dateTimeHelper, userLogsRepository } = this.dependencies;
    
    //@TODO: Use this to generate warnings in response, if challenge tracking keys are not set, and if log date is outside all active challenge period
    const {activeChallengeLoggingKeys, earliestStartDate, latestEndDate} = 
      await userChallengeRepository.findAllActiveChallengeMetadata(userId, { requestDate });

    // Validate log date is not in the future and not before start date
    // @TODO double check this logic, and also that you cant log for a date outside the challenge period range
    // Implement an isWithinRange method somewhere (maybe in the date-time service)
    if (dateTimeHelper.isDateInFuture(dto.logDate)) {
      throw new ValidationError('Cannot log tracked values for future dates');
    }

    // Transform DailyLogPayload into the expected array format
    const valuesArray = Object.entries(dto.values)
      .map(([key, value]) => ({ 
        // @TODO LATER: FIGURE OUT A WAY TO DO WITHOUT THE TYPE CASTING
        key: key as AllLogKeysType, 
        value: value
      }));

    // Upsert the log
    await userLogsRepository.upsert({
        userId,
        logDate: dto.logDate,
        createdAt: requestDate,
      }, valuesArray);
  }

  /**
   * List user challenge logs
   * GET /logs?from=YYYY-MM-DD&to=YYYY-MM-DD&userChallengeId=UUID
   */
  async listUserLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]> {
    const { user: { id: userId } } = this.requestContext;
    const { userChallengeRepository, userLogsRepository } = this.dependencies;

    // Validate date range
    // @TODO: add this to Zod refine validation
    if (dto.fromDate && dto.toDate && dto.fromDate > dto.toDate) {
      throw new ValidationError('From date must be before or equal to to date');
    }

    const findForUserChallenge = async (userChallengeId: string) => {
      const challenge = await userChallengeRepository.findById(userChallengeId, userId);
      if (challenge) {
        return userLogsRepository.findByUserChallengeAndDateRange(
          {id: userChallengeId, startDate: challenge.startDate},
          userId,
          dto.fromDate,
          dto.toDate
        );
      }
      return [];
    }

    const findForUser = async () => {
      return userLogsRepository.findByUserDateRange(
        userId,
        dto.fromDate,
        dto.toDate
      );
    };

    const logs = await (dto.userChallengeId ? findForUserChallenge(dto.userChallengeId) : findForUser());

    return this.mapToUserLogResponse(logs);
  }


  /**
   * Map database model to user log response DTO
   * Groups logs by date and creates a values object for each date
   */
  private mapToUserLogResponse(logs: UserLog[]): UserLogResponse[] {
    // Group logs by date
    const logsByDate = logs.reduce((acc, log) => {
      const dateKey = log.logDate;
      if (!acc.has(dateKey)) {
        acc.set(dateKey, {
          logDate: log.logDate,
          values: {},
        });
      }
      
      // Add the tracked value to the values object
      const entry = acc.get(dateKey)!;
      entry.values[log.logKey] = log.logValue;
      
      return acc;
    }, new Map<string, UserLogResponse>());

    // Convert to array and format timestamps
    return Object.values(logsByDate).map(log => ({
      logDate: log.logDate,
      values: log.values,
    }));
  }

}
