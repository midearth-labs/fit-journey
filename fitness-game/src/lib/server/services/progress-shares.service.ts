import { type IProgressSharesRepository } from '$lib/server/repositories';
import { ValidationError } from '$lib/server/shared/errors';
import type { 
  AuthRequestContext,
  ShareProgressDto, 
  AddShareReactionDto, 
  GetUserSharesDto,
  GetPublicSharesDto,
  DeleteShareDto,
  NewProgressShareResponse, 
  MaybeAuthRequestContext,
  ProgressShareUserListResponse,
  ProgressSharePublicListResponse
} from '$lib/server/shared/interfaces';
import type { ProgressShareWithoutContent } from '../repositories/progress-shares.repository';

export type IProgressSharesService = {
  shareProgress(dto: ShareProgressDto): Promise<NewProgressShareResponse>;
  getPublicShares(dto: GetPublicSharesDto): Promise<ProgressSharePublicListResponse[]>;
  getUserShares(dto: GetUserSharesDto): Promise<ProgressShareUserListResponse[]>;
  deleteShare(dto: DeleteShareDto): Promise<void>;
};

//@TODO: add getShare method.
export type IProgressSharesUnAuthenticatedService = {
    addShareReaction(dto: AddShareReactionDto): Promise<void>;
};
  

export class ProgressSharesUnAuthenticatedService implements IProgressSharesUnAuthenticatedService {
    constructor(
      private readonly dependencies: {
        readonly progressSharesRepository: IProgressSharesRepository;
      },
      private readonly requestContext: MaybeAuthRequestContext
    ) {}
  
    /**
     * Add reaction to a progress share
     * POST /progress-shares/:shareId/reactions
     */
    async addShareReaction(dto: AddShareReactionDto): Promise<void> {
      const { progressSharesRepository } = this.dependencies;
      const { requestDate } = this.requestContext;
  
      // Increment reaction count atomically
      await progressSharesRepository.incrementActiveShareReactionCount(dto.shareId, dto.reactionType, requestDate);
    }
  }

  export class ProgressSharesService implements IProgressSharesService {
    constructor(
      private readonly dependencies: {
        readonly progressSharesRepository: IProgressSharesRepository;
      },
      private readonly requestContext: AuthRequestContext
    ) {}
  
    /**
     * Share user progress (challenge completion, avatar progression, quiz achievement)
     * POST /progress-shares
     */
    async shareProgress(dto: ShareProgressDto): Promise<NewProgressShareResponse> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId }, requestDate } = this.requestContext;
  
      // Generate content based on share type
      const generatedContent = await this.generateShareContent(dto.shareType, dto.shareTypeId, userId);
      
      const { id } = await progressSharesRepository.create({
          userId,
          shareType: dto.shareType,
          shareTypeId: dto.shareTypeId || null,
          title: generatedContent.title,
          contentVersion: generatedContent.versionId,
          generatedContent: generatedContent.content,
          includeInviteLink: dto.includeInviteLink,
          isPublic: dto.isPublic,
          createdAt: requestDate,
        });
      return { id };
    }
  
    /**
     * Get user's progress shares
     * GET /users/me/progress-shares
     */
    async getUserShares(dto: GetUserSharesDto): Promise<ProgressShareUserListResponse[]> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;
  
      const shares = await progressSharesRepository.findByUserId(userId, dto.page, dto.limit);
      
      return shares.map(share => ProgressSharesService.mapToUserListResponse(share));
    }
  
    /**
     * Get public progress shares
     * GET /progress-shares
     */
    async getPublicShares(dto: GetPublicSharesDto): Promise<ProgressSharePublicListResponse[]> {
      const { progressSharesRepository } = this.dependencies;
  
      const shares = await progressSharesRepository.findPublicSharesByShareType(dto.shareType, dto.page, dto.limit)
      
      return shares.map(share => ProgressSharesService.mapToPublicListResponse(share));
    }
  
    /**
     * Delete a progress share
     * DELETE /progress-shares/:shareId
     */
    async deleteShare(dto: DeleteShareDto): Promise<void> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;
  
      await progressSharesRepository.delete({ id: dto.shareId, userId });
    }
  
    private static mapToPublicListResponse(share: ProgressShareWithoutContent): ProgressSharePublicListResponse {
      const { id, userId, shareType, title, clapCount, muscleCount, partyCount, createdAt } = share;
      return {
        id,
        userId,
        shareType,
        title,
        clapCount,
        muscleCount,
        partyCount,
        createdAt: createdAt.toISOString(),
        
      };
    }
  
    private static mapToUserListResponse(share: ProgressShareWithoutContent): ProgressShareUserListResponse {
      const { includeInviteLink, isPublic, status } = share;
      return {
        ...ProgressSharesService.mapToPublicListResponse(share),
        includeInviteLink,
        isPublic,
        status,
      };
    }
  
    private async generateShareContent(shareType: string, shareTypeId?: string, userId?: string): Promise<{title: string, content: any, versionId: string}> {
      // TODO: Implement content generation logic based on share type
      // This would integrate with content generation services
      const baseContent = {
        message: `I just completed a ${shareType.replace('_', ' ')} milestone!`,
        stats: {},
        image: undefined
      };
  
      switch (shareType) {
        case 'challenge_completion':
          return {
            title: 'Challenge Completed! 🎉',
            content: {
              ...baseContent,
              message: 'I just finished a fitness challenge! Ready to take on the next one!',
              stats: { challengeId: shareTypeId }
            },
            versionId: '1.0'
          };
        case 'avatar_progression':
          return {
            title: 'Avatar Level Up! ⭐',
            content: {
              ...baseContent,
              message: 'My fitness avatar has leveled up! The journey continues!',
              stats: { level: 'up' }
            },
            versionId: '1.0'
          };
        case 'quiz_achievement':
          return {
            title: 'Avatar Level Up! ⭐',
            content: {
              ...baseContent,
            message: 'Perfect score on my fitness knowledge quiz!',
              stats: { score: '100%' }
            },
            versionId: '1.0'
          };
        default:
          throw new ValidationError(`Unsupported share type: ${shareType}`);
      }
    }
  }
    