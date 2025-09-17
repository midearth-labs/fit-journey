import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, gte, lte, sql, inArray } from 'drizzle-orm';
import { userHabitLogs, type UserHabitLog, type NewUserHabitLog, type AllHabitLogKeysType, AllHabitLogKeys, type HabitLogValueType } from '$lib/server/db/schema';
import type { IChallengeDAO } from '../content/daos';
import type { IDateTimeHelper } from '../helpers/date-time.helper';

export type IUserHabitLogsRepository = {
    upsert(logData: Omit<NewUserHabitLog, 'logKey' | 'logValue'>, values: Array<{key: AllHabitLogKeysType, value: HabitLogValueType<number>}>): Promise<UserHabitLog[]>;
    findByUserChallenge(challenge: {id: string, startDate: string}, userId: string): Promise<UserHabitLog[]>;
    findByUserChallengeAndDateRange(challenge: {id: string, startDate: string}, userId: string, fromDate?: string, toDate?: string): Promise<UserHabitLog[]>;
    findByUserChallengeAndDate(challenge: {id: string, startDate: string}, userId: string, logDate: string): Promise<UserHabitLog[]>;
    findByUser(userId: string): Promise<UserHabitLog[]>;
    findByUserDateRange(userId: string, fromDate?: string, toDate?: string): Promise<UserHabitLog[]>;
    findByUserDate(userId: string, logDate: string): Promise<UserHabitLog[]>;
    delete(id: string, userId: string): Promise<boolean>;
  };
  

export class UserHabitLogsRepository implements IUserHabitLogsRepository {
  constructor(
    private db: NodePgDatabase<any>,
    private readonly challengeDAO: IChallengeDAO,
    private readonly dateTimeHelper: IDateTimeHelper,
  ) {}

  /**
   * Upsert multiple user habit log records
   * This handles both creating new records and updating existing ones
   * Uses the unique constraint on (userId, logKey, logDate)
   * Each value in the values array creates a separate row
   * 
   * Value handling:
   * - defined values: upsert using current logic
   * - null values: delete corresponding entries
   * - undefined values: ignore them
   */
  async upsert(logData: Omit<NewUserHabitLog, 'logKey' | 'logValue'>, values: Array<{key: AllHabitLogKeysType, value: HabitLogValueType<number>}>): Promise<UserHabitLog[]> {
    const definedValues: Array<{key: AllHabitLogKeysType, value: number}> = [];
    const keysToDelete: Array<AllHabitLogKeysType> = [];
    
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
      return [];
    }

    // Execute operations in a transaction
    return await this.db.transaction(async (tx) => {
      const results: UserHabitLog[] = [];

      // Handle defined values with upsert logic
      if (definedValues.length > 0) {
        const insertData = definedValues.map(value => ({
          ...logData,
          logKey: value.key,
          logValue: value.value,
          updatedAt: logData.createdAt
        }));

        const upsertedLogs = await tx
          .insert(userHabitLogs)
          .values(insertData)
          .onConflictDoUpdate({
            target: [userHabitLogs.userId, userHabitLogs.logKey, userHabitLogs.logDate],
            set: {
              // Dynamically update logValue based on the conflicting row's logValue
              logValue: sql`EXCLUDED.log_value`,
              updatedAt: logData.createdAt,
            },
            // This makes sure we only update the log for the user
            setWhere: sql`${userHabitLogs.userId} = ${logData.userId}`
          })
          .returning();
        
        results.push(...upsertedLogs);
      }

      // Handle null values by deleting corresponding entries
      if (keysToDelete.length > 0) {
        await tx
          .delete(userHabitLogs)
          .where(
            and(
              eq(userHabitLogs.userId, logData.userId),
              eq(userHabitLogs.logDate, logData.logDate),
              inArray(userHabitLogs.logKey, keysToDelete)
            )
          );
      }

      return results;
    });
    // @TODO: Add logic to correct the user challenge progress count in triggers
  }

  /**
   * Find all habit logs for a user
   */
  async findByUser(userId: string): Promise<UserHabitLog[]> {
    return await this._findByUserDateRangeAndKeys(userId);
  }

  /**
   * Find habit logs for a user challenge
   * Uses the userChallenge's startDate as fromDate and calculates toDate as startDate + challenge.durationDays
   * Filters by the challenge's habit keys
   */
  async findByUserChallenge({id: challengeId, startDate}: {id: string, startDate: string}, userId: string): Promise<UserHabitLog[]> {
    return await this.findByUserChallengeAndDateRange({id: challengeId, startDate}, userId);
  }

  /**
   * Find habit logs for a user challenge within a date range
   */
  async findByUserChallengeAndDateRange(
    challenge: {id: string, startDate: string},
    userId: string,
    userFromDate?: string, 
    userEndDate?: string
  ): Promise<UserHabitLog[]> {
     const {id: challengeId, startDate: challengeStartDate} = challenge;
     // Get the challenge to access durationDays and habits
     const {durationDays, habits: habitKeys} = this.challengeDAO.getByIdOrThrow(challengeId, () => new Error(`Challenge ${challengeId} not found`));
     const challengeEndDate = this.dateTimeHelper.daysOffset(challengeStartDate, durationDays);

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
 
     return await this._findByUserDateRangeAndKeys(userId, fromDate, toDate, habitKeys);
  }

  /**
   * Find habit log for a specific date within a user challenge
   */
  async findByUserChallengeAndDate(
    challenge: {id: string, startDate: string},
    userId: string,
    logDate: string
  ): Promise<UserHabitLog[]> {
    return await this.findByUserChallengeAndDateRange(challenge, userId, logDate, logDate);
  }

  /**
   * Find habit logs for a user within a date range
   */
  async findByUserDateRange(
    userId: string,
    fromDate?: string, 
    toDate?: string
  ): Promise<UserHabitLog[]> {
    return await this._findByUserDateRangeAndKeys(userId, fromDate, toDate);
  }

  /**
   * Find habit log for a specific date within a user challenge
   */
  async findByUserDate( 
    userId: string,
    logDate: string
  ): Promise<UserHabitLog[]> {
    return await this._findByUserDateRangeAndKeys(userId, logDate, logDate);
  }

  private async _findByUserDateRangeAndKeys(
    userId: string,
    fromDate?: string, 
    toDate?: string,
    keys?: AllHabitLogKeysType[]
  ): Promise<UserHabitLog[]> {
    const whereClause = [
        eq(userHabitLogs.userId, userId),
        ...(fromDate ? [gte(userHabitLogs.logDate, fromDate)] : []),
        ...(toDate ? [lte(userHabitLogs.logDate, toDate)] : []),
        ...(keys ? [inArray(userHabitLogs.logKey, keys)] : []),
    ];
    return await this.db
      .select()
      .from(userHabitLogs)
      .where(
        and(
          ...whereClause
        )
      )
  }


  /**
   * Delete a habit log record
   */
  // @TODO: check if this method is needed, delete if not
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(userHabitLogs)
      .where(
        and(
          eq(userHabitLogs.id, id),
          eq(userHabitLogs.userId, userId)
        )
      );
      // @TODO: Add logic to update the user challenge progress count
    
    return result.rowCount > 0;
  }
}
