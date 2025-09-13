// Game Types
export type GameType =
  | 'equipment'
  | 'form'
  | 'nutrition'
  | 'injury-prevention'
  | 'anatomy';

export interface Question {
  id: string;
  gameType: GameType;
  difficulty: number; // 1-5 scale
  questionText: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  imageUrl?: string;
}

// Avatar Types
export type AvatarDemographic =
  | 'young-male'
  | 'young-female'
  | 'old-male'
  | 'old-female';

export type AvatarState =
  | 'muscular-strong'
  | 'lean-fit'
  | 'unfit-weak'
  | 'injured'
  | 'energetic'
  | 'tired';

export interface AvatarAsset {
  id: string;
  category: AvatarDemographic;
  state: AvatarState;
  imageUrl: string;
  metadata?: Record<string, unknown>;
}

// User Types
export interface UserProfile {
  id: string;
  userId: string;
  username?: string;
  avatarDemographic: AvatarDemographic;
  currentAvatarState: AvatarState;
  totalScore: number;
  gamesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}


// Social Types
export interface ShareableResult {
  userId: string;
  gameType: GameType;
  score: number;
  avatarState: AvatarState;
  message: string;
  imageUrl?: string;
}

// UI Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}
