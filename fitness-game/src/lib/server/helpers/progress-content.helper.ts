import { ValidationError } from '$lib/server/shared/errors';

export type ShareContentResult = {
  title: string;
  content: Record<string, unknown>;
  versionId: string;
};

export type IShareTypeGeneration = {
  generateContent(shareTypeId?: string, userId?: string): Promise<ShareContentResult>;
};

export type IProgressContentHelper = {
  generateShareContent(shareType: string, shareTypeId?: string, userId?: string): Promise<ShareContentResult>;
};

export class ProgressContentHelper implements IProgressContentHelper {
  private readonly shareTypeGenerators: Map<string, IShareTypeGeneration>;

  constructor() {
    this.shareTypeGenerators = new Map();
    this.initializeDefaultGenerators();
  }

  async generateShareContent(shareType: string, shareTypeId?: string, userId?: string): Promise<ShareContentResult> {
    const generator = this.shareTypeGenerators.get(shareType);
    
    if (!generator) {
      throw new ValidationError(`Unsupported share type: ${shareType}`);
    }

    return await generator.generateContent(shareTypeId, userId);
  }

  private initializeDefaultGenerators(): void {
    this.shareTypeGenerators.set('challenge_completion', new ChallengeCompletionGenerator());
    this.shareTypeGenerators.set('avatar_progression', new AvatarProgressionGenerator());
    this.shareTypeGenerators.set('quiz_achievement', new QuizAchievementGenerator());
    this.shareTypeGenerators.set('invitation_count', new InvitationCountGenerator());
  }
}

// Default implementations for each share type

class ChallengeCompletionGenerator implements IShareTypeGeneration {
  async generateContent(shareTypeId?: string, userId?: string): Promise<ShareContentResult> {
    const baseContent = {
      message: 'I just finished a fitness challenge! Ready to take on the next one!',
      stats: { challengeId: shareTypeId },
      image: undefined
    };

    return {
      title: 'Challenge Completed! 🎉',
      content: baseContent,
      versionId: '1.0'
    };
  }
}

class AvatarProgressionGenerator implements IShareTypeGeneration {
  async generateContent(shareTypeId?: string, userId?: string): Promise<ShareContentResult> {
    const baseContent = {
      message: 'My fitness avatar has leveled up! The journey continues!',
      stats: { level: 'up' },
      image: undefined
    };

    return {
      title: 'Avatar Level Up! ⭐',
      content: baseContent,
      versionId: '1.0'
    };
  }
}

class QuizAchievementGenerator implements IShareTypeGeneration {
  async generateContent(shareTypeId?: string, userId?: string): Promise<ShareContentResult> {
    const baseContent = {
      message: 'Perfect score on my fitness knowledge quiz!',
      stats: { score: '100%' },
      image: undefined
    };

    return {
      title: 'Quiz Master! 🧠',
      content: baseContent,
      versionId: '1.0'
    };
  }
}

class InvitationCountGenerator implements IShareTypeGeneration {
  async generateContent(shareTypeId?: string, userId?: string): Promise<ShareContentResult> {
    const invitationCount = shareTypeId ? parseInt(shareTypeId, 10) : 0;
    
    const baseContent = {
      message: `I've invited 100 friends to join my fitness journey!`,
      stats: { invitationCount: 100 },
      image: undefined
    };

    return {
      title: 'Fitness Ambassador! 👥',
      content: baseContent,
      versionId: '1.0'
    };
  }
}
