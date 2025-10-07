import { getDBInstance } from '$lib/server/db';
import { ContentDAOFactory } from '$lib/server/content/daos/dao-factory';
import { DateTimeHelper, type IDateTimeHelper, ProgressContentHelper, type IProgressContentHelper, FeatureAccessControl, type IFeatureAccessControl, LearningPathHelper, type ILearningPathHelper, PartitionGenerator, type IPartitionGenerator } from '$lib/server/helpers';
import {
  type IUserRepository,
  UserRepository,
  type IUserMetadataRepository,
  UserMetadataRepository,
  type IUserArticlesRepository,
  UserArticlesRepository,
  type IUserLogsRepository,
  UserLogsRepository,
  type IQuestionsRepository,
  QuestionsRepository,
  type IQuestionReactionsRepository,
  QuestionReactionsRepository,
  type IAnswerReactionsRepository,
  AnswerReactionsRepository,
  type IAnswersRepository,
  AnswersRepository,
  type IProgressSharesRepository,
  ProgressSharesRepository,
  type IChallengesRepository,
  ChallengesRepository,
  type IChallengeSubscribersRepository,
  ChallengeSubscribersRepository,
  type IStatisticsRepository,
  StatisticsRepository,
} from '$lib/server/repositories';
import { LogService, UserProfileService, UserMetadataService, ArticleService, QuestionsService, ModerationService, AnswersService, ProgressSharesService, type AuthServices, type ILogService, type IUserProfileService, type IUserMetadataService, type IArticleService, type IQuestionsService, type IAnswersService, type IProgressSharesService, type IProgressSharesUnAuthenticatedService, ProgressSharesUnAuthenticatedService, type UnAuthServices, ChallengesService, type IChallengesService, StatisticsService, type IStatisticsService } from '$lib/server/services';
import { ContentLoader } from '$lib/server/content/utils/content-loader';
import { type Content } from '$lib/server/content/types';
import { createServiceFromClass, createUnAuthServiceFromClass, type ServiceCreatorFromMaybeAuthRequestContext, type ServiceCreatorFromRequestContext } from '../services/shared';
import type { AuthRequestContext, MaybeAuthRequestContext } from './interfaces';
import type { IContentDAOFactory } from '../content/daos';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export type IServiceFactory = {
  getAuthServices(authRequestContext: AuthRequestContext): AuthServices;
  getUnAuthServices(maybeAuthRequestContext: MaybeAuthRequestContext): UnAuthServices;
  learningPathHelper: ILearningPathHelper;
  contentDAOFactory: IContentDAOFactory;
};

/**
 * Service factory that handles dependency injection for API routes
 * This ensures consistent service instantiation across all API endpoints
 */
export class ServiceFactory implements IServiceFactory {
  private static instance: IServiceFactory;
  
  public readonly contentDAOFactory: IContentDAOFactory;
  private readonly dateTimeHelper: IDateTimeHelper;
  private readonly progressContentHelper: IProgressContentHelper;
  private readonly featureAccessControl: IFeatureAccessControl;
  public readonly learningPathHelper: ILearningPathHelper;
  private readonly partitionGenerator: IPartitionGenerator;
  
  // Repositories
  private readonly userRepository: IUserRepository;
  private readonly userMetadataRepository: IUserMetadataRepository;
  private readonly userArticlesRepository: IUserArticlesRepository;
  private readonly userLogsRepository: IUserLogsRepository;
  
  // Social Features Repositories
  private readonly questionsRepository: IQuestionsRepository;
  private readonly questionReactionsRepository: IQuestionReactionsRepository;
  private readonly answersRepository: IAnswersRepository;
  private readonly answerReactionsRepository: IAnswerReactionsRepository;
  private readonly progressSharesRepository: IProgressSharesRepository;
  private readonly challengesRepository: IChallengesRepository;
  private readonly challengeSubscribersRepository: IChallengeSubscribersRepository;
  private readonly statisticsRepository: IStatisticsRepository;
  
  // Services
  private readonly logServiceCreator: ServiceCreatorFromRequestContext<ILogService>;
  private readonly userProfileServiceCreator: ServiceCreatorFromRequestContext<IUserProfileService>;
  private readonly userMetadataServiceCreator: ServiceCreatorFromRequestContext<IUserMetadataService>;
  private readonly articleServiceCreator: ServiceCreatorFromRequestContext<IArticleService>;
  private readonly challengesServiceCreator: ServiceCreatorFromRequestContext<IChallengesService>;
  
  // Social Features Services
  private readonly moderationService: ModerationService;
  private readonly questionsServiceCreator: ServiceCreatorFromRequestContext<IQuestionsService>;
  private readonly answersServiceCreator: ServiceCreatorFromRequestContext<IAnswersService>;
  private readonly progressSharesServiceCreator: ServiceCreatorFromRequestContext<IProgressSharesService>;
  private readonly progressSharesUnAuthenticatedServiceCreator: ServiceCreatorFromMaybeAuthRequestContext<IProgressSharesUnAuthenticatedService>;
  private readonly statisticsServiceCreator: ServiceCreatorFromMaybeAuthRequestContext<IStatisticsService>;
  
  private constructor(content: Content, db: NodePgDatabase<any>) {
    this.contentDAOFactory = ContentDAOFactory.initializeDAOs(content);
    
    // Initialize helpers
    this.dateTimeHelper = new DateTimeHelper();
    this.progressContentHelper = new ProgressContentHelper();
    this.learningPathHelper = new LearningPathHelper(this.contentDAOFactory.getDAO('LearningPath'));
    this.partitionGenerator = new PartitionGenerator();
    
    // Initialize repositories
    this.userRepository = new UserRepository(db);
    this.userMetadataRepository = new UserMetadataRepository(db);
    // Initialize feature access control after repositories are ready
    this.featureAccessControl = new FeatureAccessControl(
      { userMetadataRepository: this.userMetadataRepository }
    );
    this.userArticlesRepository = new UserArticlesRepository(db, this.partitionGenerator);
    this.userLogsRepository = new UserLogsRepository(db, this.dateTimeHelper);
    
    // Initialize Social Features repositories
    this.questionsRepository = new QuestionsRepository(db);
    this.questionReactionsRepository = new QuestionReactionsRepository(db);
    this.answersRepository = new AnswersRepository(db);
    this.answerReactionsRepository = new AnswerReactionsRepository(db);
    this.progressSharesRepository = new ProgressSharesRepository(db);
    this.challengeSubscribersRepository = new ChallengeSubscribersRepository(db);
    this.challengesRepository = new ChallengesRepository(db, this.challengeSubscribersRepository, this.dateTimeHelper);
    this.statisticsRepository = new StatisticsRepository(db);
    
    // Initialize services
    this.logServiceCreator = createServiceFromClass(
      LogService,
      { challengesRepository: this.challengesRepository, userLogsRepository: this.userLogsRepository, dateTimeHelper: this.dateTimeHelper }
    );
    this.userProfileServiceCreator = createServiceFromClass(
      UserProfileService,
      { userRepository: this.userRepository, featureAccessControl: this.featureAccessControl }
    );
    this.userMetadataServiceCreator = createServiceFromClass(
      UserMetadataService,
      { userMetadataRepository: this.userMetadataRepository }
    );
    this.articleServiceCreator = createServiceFromClass(
      ArticleService,
      { userArticlesRepository: this.userArticlesRepository, knowledgeBaseDAO: this.contentDAOFactory.getDAO('KnowledgeBase'), questionsDAO: this.contentDAOFactory.getDAO('Question') }
    );
    
    // Initialize Social Features services
    this.moderationService = new ModerationService();
    this.questionsServiceCreator = createServiceFromClass(
      QuestionsService,
      { 
        questionsRepository: this.questionsRepository,
        questionReactionsRepository: this.questionReactionsRepository,
        moderationService: this.moderationService,
        featureAccessControl: this.featureAccessControl,
      }
    );
    this.answersServiceCreator = createServiceFromClass(
      AnswersService,
      { 
        answersRepository: this.answersRepository,
        questionsRepository: this.questionsRepository,
        moderationService: this.moderationService,
        answerReactionsRepository: this.answerReactionsRepository,
        featureAccessControl: this.featureAccessControl,
      }
    );
    this.progressSharesServiceCreator = createServiceFromClass(
      ProgressSharesService,
      { 
        progressSharesRepository: this.progressSharesRepository,
        progressContentHelper: this.progressContentHelper
      }
    );
    this.progressSharesUnAuthenticatedServiceCreator = createUnAuthServiceFromClass(
      ProgressSharesUnAuthenticatedService,
      { 
        progressSharesRepository: this.progressSharesRepository
      }
    );
    this.challengesServiceCreator = createServiceFromClass(
      ChallengesService,
      { challengesRepository: this.challengesRepository, challengeSubscribersRepository: this.challengeSubscribersRepository, dateTimeHelper: this.dateTimeHelper }
    );
    this.statisticsServiceCreator = createUnAuthServiceFromClass(
      StatisticsService,
      { statisticsRepository: this.statisticsRepository, dateTimeHelper: this.dateTimeHelper }
    );
  }
  
  /**
   * Get singleton instance of ServiceFactory
   */
  public static async getInstance(): Promise<IServiceFactory> {
    return ServiceFactory.getInstanceWithDB(getDBInstance());
  }
  
  /**
   * Get singleton instance of ServiceFactory
   */
  public static async getInstanceWithDB(db: NodePgDatabase<any>): Promise<IServiceFactory> {
    if (!ServiceFactory.instance) {
      const contentLoader = await ContentLoader.initialize();
      ServiceFactory.instance = new ServiceFactory(contentLoader.getContent(), db);
    }
    return ServiceFactory.instance;
  }
  
  public getAuthServices(authRequestContext: AuthRequestContext): AuthServices {
    return {
      logService: () => this.logServiceCreator(authRequestContext),
      userProfileService: () => this.userProfileServiceCreator(authRequestContext),
      userMetadataService: () => this.userMetadataServiceCreator(authRequestContext),
      articleService: () => this.articleServiceCreator(authRequestContext),
      questionsService: () => this.questionsServiceCreator(authRequestContext),
      answersService: () => this.answersServiceCreator(authRequestContext),
      progressSharesService: () => this.progressSharesServiceCreator(authRequestContext),
      challengesService: () => this.challengesServiceCreator(authRequestContext),
    };
  }

  public getUnAuthServices(maybeAuthRequestContext: MaybeAuthRequestContext): UnAuthServices {
    return {
      progressSharesUnAuthenticatedService: () => this.progressSharesUnAuthenticatedServiceCreator(maybeAuthRequestContext),
      statisticsService: () => this.statisticsServiceCreator(maybeAuthRequestContext),
    };
  }
  
}
