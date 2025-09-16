import { getDBInstance } from '$lib/server/db';
import { ContentDAOFactory } from '$lib/server/content/daos/dao-factory';
import { DateTimeHelper } from '$lib/server/helpers/date-time.helper';
import {
  UserRepository,
  UserProfileRepository,
  UserChallengeRepository,
  UserChallengeProgressRepository,
  UserHabitLogsRepository,
} from '$lib/server/repositories';
import { ChallengeService, ChallengeContentService, type IChallengeContentService, type IChallengeService, type AuthServices } from '$lib/server/services';
import { ContentLoader } from '$lib/server/content/utils/content-loader';
import { type Content } from '$lib/server/content/types';
import { createServiceFromClass, type ServiceCreatorFromRequestContext } from '../services/shared';
import type { AuthRequestContext } from './interfaces';

/**
 * Service factory that handles dependency injection for API routes
 * This ensures consistent service instantiation across all API endpoints
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  private readonly contentDAOFactory: ContentDAOFactory;
  private readonly dateTimeHelper: DateTimeHelper;
  
  // Repositories
  private readonly userRepository: UserRepository;
  private readonly userProfileRepository: UserProfileRepository;
  private readonly userChallengeRepository: UserChallengeRepository;
  private readonly userChallengeProgressRepository: UserChallengeProgressRepository;
  private readonly userHabitLogsRepository: UserHabitLogsRepository;
  
  // Services
  private readonly challengeContentServiceCreator: ServiceCreatorFromRequestContext<IChallengeContentService>;
  private readonly challengeServiceCreator: ServiceCreatorFromRequestContext<IChallengeService>;
  
  private constructor(content: Content) {
    const db = getDBInstance();
    this.contentDAOFactory = ContentDAOFactory.initializeDAOs(content);
    
    // Initialize helpers
    this.dateTimeHelper = new DateTimeHelper();
    
    // Initialize repositories
    this.userRepository = new UserRepository(db);
    this.userProfileRepository = new UserProfileRepository(db);
    this.userChallengeRepository = new UserChallengeRepository(db, this.dateTimeHelper, this.contentDAOFactory.getDAO('Challenge'));
    this.userChallengeProgressRepository = new UserChallengeProgressRepository(db);
    this.userHabitLogsRepository = new UserHabitLogsRepository(db);
    
    // Initialize services
    this.challengeContentServiceCreator = createServiceFromClass(
        ChallengeContentService,
        { challengeDAO: this.contentDAOFactory.getDAO('Challenge') }
    );
    
    this.challengeServiceCreator = createServiceFromClass(
      ChallengeService,
      { userChallengeRepository: this.userChallengeRepository, userChallengeProgressRepository: this.userChallengeProgressRepository, userHabitLogsRepository: this.userHabitLogsRepository, challengeDAO: this.contentDAOFactory.getDAO('Challenge'), dateTimeHelper: this.dateTimeHelper }
    );
  }
  
  /**
   * Get singleton instance of ServiceFactory
   */
  public static async getInstance(): Promise<ServiceFactory> {
    if (!ServiceFactory.instance) {
      const contentLoader = await ContentLoader.initialize();
      ServiceFactory.instance = new ServiceFactory(contentLoader.getContent());
    }
    return ServiceFactory.instance;
  }
  
  /**
   * Get ChallengeContentService instance
   */
  public getChallengeContentService(): ServiceCreatorFromRequestContext<IChallengeContentService> {
    return this.challengeContentServiceCreator;
  }
  
  /**
   * Get ChallengeService instance
   */
  public getChallengeService(): ServiceCreatorFromRequestContext<IChallengeService> {
    return this.challengeServiceCreator;
  }

  public getAuthServices(authRequestContext: AuthRequestContext): AuthServices {
    return {
      challengeContentService: () => this.challengeContentServiceCreator(authRequestContext),
      challengeService: () => this.challengeServiceCreator(authRequestContext),
    };
  }
  
  /**
   * Get all repositories (for advanced use cases)
   */
  public getRepositories() {
    return {
      userRepository: this.userRepository,
      userProfileRepository: this.userProfileRepository,
      userChallengeRepository: this.userChallengeRepository,
      userChallengeProgressRepository: this.userChallengeProgressRepository,
      userHabitLogsRepository: this.userHabitLogsRepository,
    };
  }
  
  /**
   * Get content DAO factory
   */
  public getContentDAOFactory(): ContentDAOFactory {
    return this.contentDAOFactory;
  }
  
  /**
   * Get date time helper
   */
  public getDateTimeHelper(): DateTimeHelper {
    return this.dateTimeHelper;
  }
}