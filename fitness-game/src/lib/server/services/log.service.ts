import {
  type PutUserLogDto,
  type ListUserLogsDto,
  type UserLogResponse,
  type AuthRequestContext,
  type DeleteUserLogDto,
  type FindUserLogDto,
} from '$lib/server/shared/interfaces';
import { 
  ValidationError,
} from '$lib/server/shared/errors';
import { type IDateTimeHelper } from '../helpers/date-time.helper';
import { type IChallengesRepository, type IUserLogsRepository } from '$lib/server/repositories';
import { type UserLog } from '$lib/server/db/schema';


export type ILogService = {
    putUserLog(dto: PutUserLogDto): Promise<void>;
    listUserLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]>;
    deleteUserLog(dto: DeleteUserLogDto): Promise<void>;
    findUserLog(dto: FindUserLogDto): Promise<UserLogResponse | null>;
  };
  
export class LogService implements ILogService {
  constructor(
    private readonly dependencies: {
      readonly challengesRepository: IChallengesRepository;
      readonly userLogsRepository: IUserLogsRepository;
      readonly dateTimeHelper: IDateTimeHelper;
    },
    private readonly requestContext: AuthRequestContext
  ) {}

  
  /**
   * Put user challenge log
   * PUT /api/v1/logs/:logDate
   */
  async putUserLog(dto: PutUserLogDto): Promise<void> {
    const { requestDate, user: { id: userId } } = this.requestContext;
    const { dateTimeHelper, userLogsRepository } = this.dependencies;
    
    // Validate log date is not in the future
    if (dateTimeHelper.isDateInFuture(dto.logDate, requestDate)) {
      throw new ValidationError('Cannot log tracked values for future dates');
    }
    //@TODO: add validation that date is not older than a week ago.

    // Upsert the log with the new structure
    await userLogsRepository.upsert({
        userId,
        logDate: dto.logDate,
        createdAt: requestDate,
        fiveStarValues: dto.values.fiveStar,
        measurementValues: dto.values.measurement,
      });
  }

  /**
   * List user challenge logs
   * GET /api/v1/logs
   */
  async listUserLogs(dto: ListUserLogsDto): Promise<UserLogResponse[]> {
    const { user: { id: userId } } = this.requestContext;
    const { userLogsRepository } = this.dependencies;

    // Validate date range
    // @TODO: add this to Zod refine validation
    if (dto.fromDate && dto.toDate && dto.fromDate > dto.toDate) {
      throw new ValidationError('From date must be before or equal to to date');
    }

    const logs = await userLogsRepository.findByUser(
      userId,
      dto.page,
      dto.limit,
      dto.fromDate,
      dto.toDate
    );

    return this.mapToUserLogResponse(logs);
  }

  /**
   * Delete user log for a specific date
   * DELETE /api/v1/logs/:logDate
   */
  async deleteUserLog(dto: DeleteUserLogDto): Promise<void> {
    const { user: { id: userId }, requestDate } = this.requestContext;
    const { userLogsRepository } = this.dependencies;

    const deleted = await userLogsRepository.deleteLog(userId, dto.logDate, requestDate);
    if (!deleted) {
      throw new ValidationError('Log entry not found for the specified date');
    }
  }

  /**
   * Find user log for a specific date
   * GET /api/v1/logs/:logDate
   */
  async findUserLog(dto: FindUserLogDto): Promise<UserLogResponse | null> {
    const { user: { id: userId } } = this.requestContext;
    const { userLogsRepository } = this.dependencies;

    const log = await userLogsRepository.findByUserOnDate(userId, dto.logDate);
    if (!log) {
      return null;
    }

    return this.mapSingleLogToResponse(log);
  }

  /**
   * Map database model to user log response DTO
   * Creates a values object from the JSONB fields
   */
  private mapToUserLogResponse(logs: UserLog[]): UserLogResponse[] {
    return logs.map(log => this.mapSingleLogToResponse(log));
  }

  /**
   * Map a single log to response format
   */
  private mapSingleLogToResponse(log: UserLog): UserLogResponse {
    return {
      logDate: log.logDate,
      values: {
        fiveStar: log.fiveStarValues,
        measurement: log.measurementValues,
      },
    };
  }

}
