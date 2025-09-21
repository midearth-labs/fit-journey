import { type IProgressSharesRepository } from '$lib/server/repositories';
import { ValidationError } from '$lib/server/shared/errors';
import type { 
  AuthRequestContext,
  ShareProgressDto, 
  AddShareReactionDto, 
  GetUserSharesDto,
  GetPublicSharesDto,
  DeleteShareDto,
  ProgressShareResponse,
  NewProgressShareResponse, 
  MaybeAuthRequestContext
} from '$lib/server/shared/interfaces';

export type IProgressSharesService = {
  shareProgress(dto: ShareProgressDto): Promise<NewProgressShareResponse>;
  getPublicShares(dto: GetPublicSharesDto): Promise<ProgressShareResponse[]>;
  getUserShares(dto: GetUserSharesDto): Promise<ProgressShareResponse[]>;
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
          shareType: dto.shareType as any,
          shareTypeId: dto.shareTypeId || null,
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
    async getUserShares(dto: GetUserSharesDto): Promise<ProgressShareResponse[]> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;
  
      const page = dto.page || 1;
      const limit = dto.limit || 20;
      const offset = (page - 1) * limit;
      const shares = await progressSharesRepository.findByUserId(userId, dto.page, dto.limit);
      
      return shares.map(share => this.mapToResponse(share));
    }
  
    /**
     * Get public progress shares
     * GET /progress-shares
     */
    async getPublicShares(dto: GetPublicSharesDto): Promise<ProgressShareResponse[]> {
      const { progressSharesRepository } = this.dependencies;
  
      const shares = await progressSharesRepository.findPublicSharesByShareType(dto.shareType, dto.page, dto.limit)
      
      return shares.map(share => this.mapToResponse(share));
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
  
    private async generateShareContent(shareType: string, shareTypeId?: string, userId?: string): Promise<{content: any, versionId: string}> {
      // TODO: Implement content generation logic based on share type
      // This would integrate with content generation services
      const baseContent = {
        title: `${shareType.replace('_', ' ').toUpperCase()} Achievement!`,
        message: `I just completed a ${shareType.replace('_', ' ')} milestone!`,
        stats: {},
        image: undefined
      };
  
      switch (shareType) {
        case 'challenge_completion':
          return {
            content: {
              ...baseContent,
              title: 'Challenge Completed! 🎉',
              message: 'I just finished a fitness challenge! Ready to take on the next one!',
              stats: { challengeId: shareTypeId }
            },
            versionId: '1.0'
          };
        case 'avatar_progression':
          return {
            content: {
              ...baseContent,
            title: 'Avatar Level Up! ⭐',
              message: 'My fitness avatar has leveled up! The journey continues!',
              stats: { level: 'up' }
            },
            versionId: '1.0'
          };
        case 'quiz_achievement':
          return {
            content: {
              ...baseContent,
            title: 'Quiz Master! 🧠',
            message: 'Perfect score on my fitness knowledge quiz!',
              stats: { score: '100%' }
            },
            versionId: '1.0'
          };
        default:
          throw new ValidationError(`Unsupported share type: ${shareType}`);
      }
    }
  
    private mapToResponse(share: any): ProgressShareResponse {
      return {
        id: share.id,
        shareType: share.shareType,
        shareTypeId: share.shareTypeId || '',
        contentVersion: share.contentVersion,
        generatedContent: share.generatedContent,
        includeInviteLink: share.includeInviteLink,
        isPublic: share.isPublic,
        status: share.status,
        clapCount: share.clapCount,
        muscleCount: share.muscleCount,
        partyCount: share.partyCount,
        createdAt: share.createdAt.toISOString(),
        userId: share.userId
      };
    }
  }
    