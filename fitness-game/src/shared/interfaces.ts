// --- Data Structures ---

import { GameSession } from "@/db/schema"; // Import GameSession type for UserProgressService

export type KnowledgeBaseArticleSummary = {
  id: string;
  day: number;
};

// Key is the question ID, value is an object the correct option index
export type CorrectAssessment = Record<string, { correctOptionIndex: number }>;

export type GameSessionJwtPayload = {
  sub: string; // User ID
  article_id: string;
  day_number: number;
  attempts_count: number;
  iat: number; // Issued At (Unix timestamp)
};

// --- Service Interfaces (for Dependency Injection) ---

export interface IKnowledgeBaseService {
  getArticleForDay(day: number): Promise<KnowledgeBaseArticleSummary | null>;
  getAssessmentForArticle(articleId: string): Promise<CorrectAssessment | null>;
  getMaxProgressionDay(): number; // Added to define the upper limit of the progression
}

export interface IJwtService {
  sign(payload: Record<string, any>, expiresIn: string | number): string;
  verify<T>(token: string): T;
}

export interface IUserProgressService {
  // Method to determine the current day for the user's progression
  getCurrentDayForUser(userId: string): Promise<number>; 
  // You might have other methods here, like updating user's max completed day etc.
}

export interface IUserTimezoneService {
  // Returns the user's current timezone string (e.g., "America/New_York", "Europe/London")
  getUserTimezone(userId: string): Promise<string>;
}

export interface IDateTimeService {
  getUtcNow(): Date; // Returns current UTC Date object
  getUnixTimestamp(date: Date): number;
}

// --- DTOs for Service Methods ---

export type StartSessionDto = {
  userId: string;
};

export type SubmitAnswersDto = {
  userId: string; // Authenticated user ID
  sessionToken: string;
  userAnswers: {
    questionId: string;
    selectedOptionIndex: number;
    hintUsed: boolean;
  }[];
};

export type ListUserSessionsDto = {
  userId: string;
  page: number;
  limit: number;
};

// --- Output Types for Service Methods ---

export type StartSessionOutput = 
  | { status: 'completed' }
  | { 
      status: 'in-progress'; 
      sessionToken: string;
      articleSummary: KnowledgeBaseArticleSummary;
    };

export type SubmitAnswersOutput =
  | { status: 'completed'; }
  | { 
      status: 'retry'; 
      retriesLeft: number;
      incorrectQuestions: string[];
      newSessionToken: string;
    }
  | { status: 'failed'; };


