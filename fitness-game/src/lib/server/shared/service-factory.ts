import { getDBInstance } from '$lib/server/db';
import { ContentDAOFactory } from '$lib/server/content/daos/dao-factory';
import { DateTimeHelper } from '$lib/server/helpers/date-time.helper';
import {
  UserRepository,
  UserMetadataRepository,
  UserChallengeRepository,
  UserChallengeProgressRepository,
  UserLogsRepository,
} from '$lib/server/repositories';
import { ChallengeService, ChallengeContentService, LogService, ChallengeProgressService, UserProfileService, type IChallengeContentService, type IChallengeService, type IChallengeProgressService, type AuthServices, type ILogService, type IUserProfileService } from '$lib/server/services';
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
  private readonly userMetadataRepository: UserMetadataRepository;
  private readonly userChallengeRepository: UserChallengeRepository;
  private readonly userChallengeProgressRepository: UserChallengeProgressRepository;
  private readonly userLogsRepository: UserLogsRepository;
  
  // Services
  private readonly challengeContentServiceCreator: ServiceCreatorFromRequestContext<IChallengeContentService>;
  private readonly challengeServiceCreator: ServiceCreatorFromRequestContext<IChallengeService>;
  private readonly challengeProgressServiceCreator: ServiceCreatorFromRequestContext<IChallengeProgressService>;
  private readonly logServiceCreator: ServiceCreatorFromRequestContext<ILogService>;
  private readonly userProfileServiceCreator: ServiceCreatorFromRequestContext<IUserProfileService>;
  
  private constructor(content: Content) {
    const db = getDBInstance();
    this.contentDAOFactory = ContentDAOFactory.initializeDAOs(content);
    
    // Initialize helpers
    this.dateTimeHelper = new DateTimeHelper();
    
    // Initialize repositories
    this.userRepository = new UserRepository(db);
    this.userMetadataRepository = new UserMetadataRepository(db);
    this.userChallengeRepository = new UserChallengeRepository(db, this.dateTimeHelper, this.contentDAOFactory.getDAO('Challenge'));
    this.userChallengeProgressRepository = new UserChallengeProgressRepository(db);
    this.userLogsRepository = new UserLogsRepository(db, this.contentDAOFactory.getDAO('Challenge'), this.dateTimeHelper);
    
    // Initialize services
    this.challengeContentServiceCreator = createServiceFromClass(
        ChallengeContentService,
        { challengeDAO: this.contentDAOFactory.getDAO('Challenge') }
    );
    
    this.challengeServiceCreator = createServiceFromClass(
      ChallengeService,
      { userChallengeRepository: this.userChallengeRepository, dateTimeHelper: this.dateTimeHelper }
    );
    this.challengeProgressServiceCreator = createServiceFromClass(
      ChallengeProgressService,
      { userChallengeRepository: this.userChallengeRepository, userChallengeProgressRepository: this.userChallengeProgressRepository, challengeDAO: this.contentDAOFactory.getDAO('Challenge') }
    );
    this.logServiceCreator = createServiceFromClass(
      LogService,
      { userChallengeRepository: this.userChallengeRepository, userLogsRepository: this.userLogsRepository, dateTimeHelper: this.dateTimeHelper }
    );
    this.userProfileServiceCreator = createServiceFromClass(
      UserProfileService,
      { userRepository: this.userRepository }
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
  
  public getAuthServices(authRequestContext: AuthRequestContext): AuthServices {
    return {
      challengeContentService: () => this.challengeContentServiceCreator(authRequestContext),
      challengeService: () => this.challengeServiceCreator(authRequestContext),
      challengeProgressService: () => this.challengeProgressServiceCreator(authRequestContext),
      logService: () => this.logServiceCreator(authRequestContext),
      userProfileService: () => this.userProfileServiceCreator(authRequestContext),
    };
  }
  
  /**
   * Get all repositories (for advanced use cases)
   */
  public getRepositories() {
    return {
      userRepository: this.userRepository,
      userMetadataRepository: this.userMetadataRepository,
      userChallengeRepository: this.userChallengeRepository,
      userChallengeProgressRepository: this.userChallengeProgressRepository,
      userLogsRepository: this.userLogsRepository,
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