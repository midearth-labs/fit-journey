import { type IProgressSharesRepository } from '$lib/server/repositories';
import { type IProgressContentHelper } from '$lib/server/helpers';
import { notFoundCheck, ValidationError } from '$lib/server/shared/errors';
import type { 
  AuthRequestContext,
  ShareProgressDto, 
  AddShareReactionDto, 
  GetUserSharesDto,
  GetPublicSharesDto,
  DeleteShareDto,
  GetUserShareDto,
  GetShareDto,
  UpdateShareStatusDto,
  NewProgressShareResponse, 
  MaybeAuthRequestContext,
  ProgressShareUserListResponse,
  ProgressSharePublicListResponse,
  ProgressShareUserDetailResponse,
  ProgressShareDetailResponse
} from '$lib/server/shared/interfaces';
import type { ProgressShareWithoutContent } from '../repositories/progress-shares.repository';
import type { ProgressShare } from '$lib/server/db/schema';

export type IProgressSharesService = {
  shareProgress(dto: ShareProgressDto): Promise<NewProgressShareResponse>;
  getPublicShares(dto: GetPublicSharesDto): Promise<ProgressSharePublicListResponse[]>;
  getUserShares(dto: GetUserSharesDto): Promise<ProgressShareUserListResponse[]>;
  getUserShare(dto: GetUserShareDto): Promise<ProgressShareUserDetailResponse>;
  updateStatus(dto: UpdateShareStatusDto): Promise<void>;
  deleteShare(dto: DeleteShareDto): Promise<void>;
};

export type IProgressSharesUnAuthenticatedService = {
    addShareReaction(dto: AddShareReactionDto): Promise<void>;
    getShare(dto: GetShareDto): Promise<ProgressShareDetailResponse>;
};
  

export class ProgressSharesUnAuthenticatedService implements IProgressSharesUnAuthenticatedService {
    constructor(
      private readonly dependencies: {
        readonly progressSharesRepository: IProgressSharesRepository;
      },
      private readonly requestContext: MaybeAuthRequestContext
    ) {}
  
    /**
     * Get a public progress share by ID
     * GET /public/api/v1/social/progress-shares/:shareId
     */
    async getShare(dto: GetShareDto): Promise<ProgressShareDetailResponse> {
      const { progressSharesRepository } = this.dependencies;

      const share = notFoundCheck(await progressSharesRepository.findActiveById(dto.shareId), 'Progress Share');
      
      return ProgressSharesUnAuthenticatedService.mapToPublicDetailResponse(share);
    }

    /**
     * Add reaction to a progress share
     * POST /public/api/v1/social/progress-shares/:shareId/reactions
     */
    async addShareReaction(dto: AddShareReactionDto): Promise<void> {
      const { progressSharesRepository } = this.dependencies;
      const { requestDate } = this.requestContext;
  
      // Increment reaction count atomically
      await progressSharesRepository.incrementActiveShareReactionCount(dto.shareId, dto.reactionType, requestDate);
    }

    public static mapToPublicDetailResponse(share: ProgressShare): ProgressShareDetailResponse {
      const { contentVersion, generatedContent } = share;
      return {
        ...ProgressSharesService.mapToPublicListResponse(share),
        contentVersion,
        generatedContent: generatedContent,
      };
    }
  }

export class ProgressSharesService implements IProgressSharesService {
  constructor(
    private readonly dependencies: {
      readonly progressSharesRepository: IProgressSharesRepository;
      readonly progressContentHelper: IProgressContentHelper;
    },
    private readonly requestContext: AuthRequestContext
  ) {}
  
    /**
     * Share user progress (challenge completion, avatar progression, quiz achievement)
     * POST /api/v1/users/me/social/progress-shares
     */
  async shareProgress(dto: ShareProgressDto): Promise<NewProgressShareResponse> {
    const { progressSharesRepository, progressContentHelper } = this.dependencies;
    const { user: { id: userId }, requestDate } = this.requestContext;

    // Generate content based on share type
    const generatedContent = await progressContentHelper.generateShareContent(dto.shareType, dto.shareTypeId, userId);
      
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
     * GET /api/v1/users/me/social/progress-shares
     */
    async getUserShares(dto: GetUserSharesDto): Promise<ProgressShareUserListResponse[]> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;
  
      const shares = await progressSharesRepository.findByUserId(userId, dto.page, dto.limit);
      
      return shares.map(share => ProgressSharesService.mapToUserListResponse(share));
    }
  
    /**
     * Get public progress shares
     * GET /api/v1/social/progress-shares
     */
    async getPublicShares(dto: GetPublicSharesDto): Promise<ProgressSharePublicListResponse[]> {
      const { progressSharesRepository } = this.dependencies;
  
      const shares = await progressSharesRepository.findPublicSharesByShareType(dto.shareType, dto.page, dto.limit)
      
      return shares.map(share => ProgressSharesService.mapToPublicListResponse(share));
    }
  
    /**
     * Get a specific progress share for the authenticated user
     * GET /api/v1/users/me/social/progress-shares/:shareId
     */
    async getUserShare(dto: GetUserShareDto): Promise<ProgressShareUserDetailResponse> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;

      const share = notFoundCheck(await progressSharesRepository.findByIdForUser(dto.shareId, userId), 'Progress Sharing');
      
      return ProgressSharesService.mapToUserDetailResponse(share);
    }

    /**
     * Update the status of a progress share
     * PUT /api/v1/users/me/social/progress-shares/:shareId/status
     */
    async updateStatus(dto: UpdateShareStatusDto): Promise<void> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId }, requestDate } = this.requestContext;
      const { shareId, status, isPublic, includeInviteLink } = dto;

      await progressSharesRepository.updateStatus({
        id: shareId,
        userId,
        status,
        isPublic,
        includeInviteLink,
        updatedAt: requestDate
      });
    }

    /**
     * Delete a progress share
     * DELETE /api/v1/social/progress-shares/:shareId
     */
    async deleteShare(dto: DeleteShareDto): Promise<void> {
      const { progressSharesRepository } = this.dependencies;
      const { user: { id: userId } } = this.requestContext;

      await progressSharesRepository.delete({ id: dto.shareId, userId });
    }
  
    public static mapToPublicListResponse(share: ProgressShareWithoutContent): ProgressSharePublicListResponse {
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

    private static mapToUserDetailResponse(share: ProgressShare): ProgressShareUserDetailResponse {
      const { contentVersion, generatedContent, includeInviteLink, isPublic, status } = share;
      return {
        ...ProgressSharesService.mapToPublicListResponse(share),
        contentVersion,
        generatedContent: generatedContent,
        includeInviteLink,
        isPublic,
        status,
      };
    }
  
  }
    