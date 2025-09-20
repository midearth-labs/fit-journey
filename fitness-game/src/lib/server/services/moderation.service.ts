export interface IModerationService {
  moderateContent(content: string, contentType: 'question_title' | 'question_body' | 'answer' | 'share'): Promise<ModerationResult>;
}

export type ModerationResult = {
  status: 'approved' | 'rejected' | 'needs_review';
  confidence: number;
  reasons?: string[];
};

export class ModerationService implements IModerationService {
  async moderateContent(content: string, contentType: 'question_title' | 'question_body' | 'answer' | 'share'): Promise<ModerationResult> {
    // Basic validation for now - in production this would integrate with AI moderation service
    
    // Check content length based on type
    const lengthChecks = this.validateContentLength(content, contentType);
    if (!lengthChecks.valid) {
      return {
        status: 'rejected',
        confidence: 1.0,
        reasons: [lengthChecks.reason!]
      };
    }
    
    // Basic spam detection
    const spamCheck = this.checkForSpam(content);
    if (spamCheck.isSpam) {
      return {
        status: 'rejected',
        confidence: 0.9,
        reasons: ['Content appears to be spam']
      };
    }
    
    // For now, approve most content (in production, integrate with OpenAI Moderation API)
    return {
      status: 'approved',
      confidence: 0.8,
      reasons: []
    };
  }

  private validateContentLength(content: string, contentType: 'question_title' | 'question_body' | 'answer' | 'share'): { valid: boolean; reason?: string } {
    const length = content.trim().length;
    
    switch (contentType) {
      case 'question_title':
        if (length < 10) return { valid: false, reason: 'Question title must be at least 10 characters' };
        if (length > 100) return { valid: false, reason: 'Question title must be no more than 100 characters' };
        break;
      case 'question_body':
      case 'answer':
        if (length < 10) return { valid: false, reason: 'Content must be at least 10 characters' };
        if (length > 2000) return { valid: false, reason: 'Content must be no more than 2000 characters' };
        break;
      case 'share':
        if (length < 10) return { valid: false, reason: 'Share content must be at least 10 characters' };
        if (length > 1000) return { valid: false, reason: 'Share content must be no more than 1000 characters' };
        break;
    }
    
    return { valid: true };
  }

  private checkForSpam(content: string): { isSpam: boolean; reason?: string } {
    const lowerContent = content.toLowerCase();
    
    // Check for excessive repetition
    const words = lowerContent.split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Only check words longer than 3 characters
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // Check if any word appears more than 30% of the time
    const totalWords = words.length;
    for (const [word, count] of wordCounts) {
      if (count / totalWords > 0.3) {
        return { isSpam: true, reason: 'Excessive word repetition detected' };
      }
    }
    
    // Check for excessive links
    const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
    if (linkCount > 3) {
      return { isSpam: true, reason: 'Too many links detected' };
    }
    
    return { isSpam: false };
  }
}
