import { db } from '@/lib/db';
import { ContentDAOFactory } from '@/data/content/utils/dao-factory';
import { DateTimeHelper } from '@/helpers/date-time.helper';
import {
  UserRepository,
  UserProfileRepository,
  UserChallengeRepository,
  UserChallengeProgressRepository,
  UserHabitLogsRepository,
} from '@/repositories';
import { ChallengeService, ChallengeContentService } from '@/services';
import { ContentLoader } from '@/data/content/utils/content-loader';
import { Content } from '@/data/content/types';

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
  private readonly challengeContentService: ChallengeContentService;
  private readonly challengeService: ChallengeService;
  
  private constructor(content: Content) {
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
    this.challengeContentService = new ChallengeContentService(
      this.contentDAOFactory.getDAO('Challenge')
    );
    
    this.challengeService = new ChallengeService(
      this.userChallengeRepository,
      this.userChallengeProgressRepository,
      this.userHabitLogsRepository,
      this.contentDAOFactory.getDAO('Challenge'),
      this.dateTimeHelper
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
  public getChallengeContentService(): ChallengeContentService {
    return this.challengeContentService;
  }
  
  /**
   * Get ChallengeService instance
   */
  public getChallengeService(): ChallengeService {
    return this.challengeService;
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
