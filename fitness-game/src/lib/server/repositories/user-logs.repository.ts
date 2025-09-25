import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { userLogs, type UserLog, type NewUserLog, type AllLogKeysType, type LogValueType, type Challenge } from '$lib/server/db/schema';
import type { IDateTimeHelper } from '../helpers/date-time.helper';
import { convertToUniqueTrackingKeys } from '../shared/utils';

type ChallengeFilterDetails = Pick<Challenge, 'id' | 'startDate' | 'durationDays' | 'goals'>;

export type IUserLogsRepository = {
    upsert<T extends number>(logData: Omit<NewUserLog, 'logKey' | 'logValue'>, values: Array<{key: AllLogKeysType, value: LogValueType<T>}>): Promise<boolean>;
    findByUserChallenge(challenge: ChallengeFilterDetails, userId: string): Promise<UserLog[]>;
    findByUserChallengeAndDateRange(challenge: ChallengeFilterDetails, userId: string, fromDate?: string, toDate?: string): Promise<UserLog[]>;
    findByUserChallengeAndDate(challenge: ChallengeFilterDetails, userId: string, logDate: string): Promise<UserLog[]>;
    findByUser(userId: string): Promise<UserLog[]>;
    findByUserDateRange(userId: string, fromDate?: string, toDate?: string): Promise<UserLog[]>;
    findByUserDate(userId: string, logDate: string): Promise<UserLog[]>;
  };
  

export class UserLogsRepository implements IUserLogsRepository {
  constructor(
    private db: NodePgDatabase<any>,
    private readonly dateTimeHelper: IDateTimeHelper,
  ) {}

  /**
   * Upsert multiple user log records
   * This handles both creating new records and updating existing ones
   * Uses the unique constraint on (userId, logKey, logDate)
   * Each value in the values array creates a separate row
   * 
   * Value handling:
   * - defined values: upsert using current logic
   * - null values: delete corresponding entries
   * - undefined values: ignore them
   */
  async upsert<T extends number>(logData: Omit<NewUserLog, 'logKey' | 'logValue'>, values: Array<{key: AllLogKeysType, value: LogValueType<T>}>): Promise<boolean> {
    const definedValues: Array<{key: AllLogKeysType, value: T}> = [];
    const keysToDelete: Array<AllLogKeysType> = [];
    
    // Partition values into defined, null, and undefined groups
    values.forEach(value => {
      if (value.value === null) {
        keysToDelete.push(value.key);
      } else if (value.value !== undefined) {
        definedValues.push({ key: value.key, value: value.value });
      }
      // undefined values are ignored
    });

    if (keysToDelete.length === 0 && definedValues.length === 0) {
      return false;
    }

    let affectedRows = 0;
    // Execute operations in a transaction
    await this.db.transaction(async (tx) => {
      // Handle defined values with upsert logic
      if (definedValues.length > 0) {
        const insertData = definedValues.map(value => ({
          ...logData,
          logKey: value.key,
          logValue: value.value,
          updatedAt: logData.createdAt
        }));

        const insertResult = await tx
          .insert(userLogs)
          .values(insertData)
          .onConflictDoUpdate({
            target: [userLogs.userId, userLogs.logKey, userLogs.logDate],
            set: {
              // Dynamically update logValue based on the conflicting row's logValue
              logValue: sql`EXCLUDED.log_value`,
              updatedAt: logData.createdAt,
            },
            // This makes sure we only update the log for the user
            setWhere: sql`${userLogs.userId} = EXCLUDED.userId`
          });
        
        affectedRows += insertResult.rowCount;
      }

      // Handle null values by deleting corresponding entries
      if (keysToDelete.length > 0) {
        const deleteResult = await tx
          .delete(userLogs)
          .where(
            and(
              eq(userLogs.userId, logData.userId),
              eq(userLogs.logDate, logData.logDate),
              inArray(userLogs.logKey, keysToDelete)
            )
          );
        
        affectedRows += deleteResult.rowCount;
      }
    });
    // @TODO: Add logic to correct the user challenge progress count in triggers
    
    return affectedRows > 0;
  }

  /**
   * Find all log records for a user
   */
  async findByUser(userId: string): Promise<UserLog[]> {
    return await this._findByUserDateRangeAndKeys(userId);
  }

  /**
   * Find log records for a user challenge
   * Uses the userChallenge's startDate as fromDate and calculates toDate as startDate + challenge.durationDays
   * Filters by the challenge's tracking keys
   */
  async findByUserChallenge(challenge: ChallengeFilterDetails, userId: string): Promise<UserLog[]> {
    return await this.findByUserChallengeAndDateRange(challenge, userId);
  }

  /**
   * Find habit logs for a user challenge within a date range
   */
  async findByUserChallengeAndDateRange(
    challenge: ChallengeFilterDetails,
    userId: string,
    userFromDate?: string, 
    userEndDate?: string
  ): Promise<UserLog[]> {
     const {id: challengeId, startDate: challengeStartDate, durationDays, goals} = challenge;
     // Get the challenge to access durationDays and tracking keys
     const challengeEndDate = this.dateTimeHelper.daysOffset(challengeStartDate, durationDays);
     const trackingKeys = convertToUniqueTrackingKeys(goals);

   // If userFromDate or userEndDate is provided, they must fall within the challenge period
     // Use the later date between userFromDate and startDate
     const fromDate = userFromDate ? 
       (userFromDate > challengeStartDate ? userFromDate : challengeStartDate) : 
       challengeStartDate;

     // Use the earlier date between userEndDate and challengeEndDate
     const toDate = userEndDate ? 
       (userEndDate < challengeEndDate ? userEndDate : challengeEndDate) : 
       challengeEndDate;

    // Both dates is out of bound
     if (fromDate > toDate) {
      return [];
     }
 
     return await this._findByUserDateRangeAndKeys(userId, fromDate, toDate, trackingKeys);
  }

  /**
   * Find log record for a specific date within a user challenge
   */
  async findByUserChallengeAndDate(
    challenge: ChallengeFilterDetails,
    userId: string,
    logDate: string
  ): Promise<UserLog[]> {
    return await this.findByUserChallengeAndDateRange(challenge, userId, logDate, logDate);
  }

  /**
   * Find log records for a user within a date range
   */
  async findByUserDateRange(
    userId: string,
    fromDate?: string, 
    toDate?: string
  ): Promise<UserLog[]> {
    return await this._findByUserDateRangeAndKeys(userId, fromDate, toDate);
  }

  /**
   * Find log record for a specific date within a user challenge
   */
  async findByUserDate( 
    userId: string,
    logDate: string
  ): Promise<UserLog[]> {
    return await this._findByUserDateRangeAndKeys(userId, logDate, logDate);
  }

  private async _findByUserDateRangeAndKeys(
    userId: string,
    fromDate?: string, 
    toDate?: string,
    keys?: AllLogKeysType[]
  ): Promise<UserLog[]> {
    const whereClause = [
        eq(userLogs.userId, userId),
        ...(fromDate ? [gte(userLogs.logDate, fromDate)] : []),
        ...(toDate ? [lte(userLogs.logDate, toDate)] : []),
        ...(keys ? [inArray(userLogs.logKey, keys)] : []),
    ];
    return await this.db
      .select()
      .from(userLogs)
      .where(
        and(
          ...whereClause
        )
      )
  }
}
