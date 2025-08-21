# Fitness AI Game - Technical Design Document

## Overview

This document provides the detailed technical implementation plan for the Fitness AI Game, covering database schema, API design, component architecture, and implementation details.

## Database Schema Implementation

### Core Tables with Drizzle ORM

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, integer, boolean, date, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User table (auto-populated from Supabase Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  display_name: text('display_name'),
  avatar_gender: text('avatar_gender'), // 'male', 'female', 'non-binary'
  avatar_age_range: text('avatar_age_range'), // 'child', 'teen', 'young-adult', 'middle-age', 'senior'
  timezone: text('timezone').default('UTC'),
  preferred_reminder_time: text('preferred_reminder_time'), // '19:00'
  notification_preferences: jsonb('notification_preferences').$type<{
    daily: boolean;
    social: boolean;
    achievements: boolean;
  }>(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// User Profile table
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  current_state: text('current_state'), // FK to UserState
  current_streak_ids: jsonb('current_streak_ids').$type<{
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
  }>(),
  longest_streaks: jsonb('longest_streaks').$type<{
    workout_completed?: string;
    ate_clean?: string;
    slept_well?: string;
    hydrated?: string;
    quiz_completed?: string;
  }>(),
  last_activity_date: date('last_activity_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Game Sessions
export const gameSessions = pgTable('game_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  challenge_id: text('challenge_id').notNull(), // FK to DailyChallenge (static content)
  started_at: timestamp('started_at').defaultNow(),
  completed_at: timestamp('completed_at'),
  is_completed: boolean('is_completed').default(false),
  total_questions: integer('total_questions').notNull(),
  correct_answers: integer('correct_answers').default(0),
  time_spent_seconds: integer('time_spent_seconds'),
  attempt_count: integer('attempt_count').default(1),
});

// Question Attempts
export const questionAttempts = pgTable('question_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  game_session_id: uuid('game_session_id').references(() => gameSessions.id, { onDelete: 'cascade' }).notNull(),
  question_id: text('question_id').notNull(), // FK to Question (static content)
  selected_answer_index: integer('selected_answer_index').notNull(),
  is_correct: boolean('is_correct').notNull(),
  time_spent_seconds: integer('time_spent_seconds').notNull(),
  answered_at: timestamp('answered_at').defaultNow(),
  hint_used: boolean('hint_used').default(false),
});

// Streak Logs
export const streakLogs = pgTable('streak_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  entries: jsonb('entries').$type<{
    workout_completed: boolean;
    ate_clean: boolean;
    slept_well: boolean;
    hydrated: boolean;
    quiz_completed: boolean;
  }>().notNull(),
  logged_at: timestamp('logged_at').defaultNow(),
});

// Streak History
export const streakHistory = pgTable('streak_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  streak_length: integer('streak_length').notNull(),
  started_date: date('started_date').notNull(),
  ended_date: date('ended_date'),
  streak_type: text('streak_type').notNull(), // 'workout_completed', 'ate_clean', etc.
  created_at: timestamp('created_at').defaultNow(),
});

// User Achievements
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  achievement_id: text('achievement_id').notNull(), // FK to Achievement (static content)
  unlocked_at: timestamp('unlocked_at').defaultNow(),
});

// User State History
export const userStateHistory = pgTable('user_state_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  state_id: text('state_id').notNull(), // FK to UserState (static content)
  unlocked_at: timestamp('unlocked_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.user_id],
  }),
  gameSessions: many(gameSessions),
  questionAttempts: many(questionAttempts),
  streakLogs: many(streakLogs),
  streakHistory: many(streakHistory),
  userAchievements: many(userAchievements),
  userStateHistory: many(userStateHistory),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.user_id],
    references: [users.id],
  }),
}));

export const gameSessionsRelations = relations(gameSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [gameSessions.user_id],
    references: [users.id],
  }),
  questionAttempts: many(questionAttempts),
}));

export const questionAttemptsRelations = relations(questionAttempts, ({ one }) => ({
  gameSession: one(gameSessions, {
    fields: [questionAttempts.game_session_id],
    references: [gameSessions.id],
  }),
}));
```

## Static Content Structure

### Content Directory Organization

```
src/
├── static-content/
│   ├── content-categories/
│   │   ├── equipment.json
│   │   ├── form.json
│   │   ├── nutrition.json
│   │   ├── injury-prevention.json
│   │   ├── body-mechanics.json
│   │   ├── foundational-movements.json
│   │   └── exercise-identification.json
│   ├── questions/
│   │   ├── equipment.json
│   │   ├── form.json
│   │   ├── nutrition.json
│   │   ├── injury-prevention.json
│   │   ├── body-mechanics.json
│   │   ├── foundational-movements.json
│   │   └── exercise-identification.json
│   ├── passage-sets/
│   │   ├── equipment.json
│   │   ├── form.json
│   │   ├── nutrition.json
│   │   ├── injury-prevention.json
│   │   ├── body-mechanics.json
│   │   ├── foundational-movements.json
│   │   └── exercise-identification.json
│   ├── daily-challenges/
│   │   ├── challenge-1.json
│   │   ├── challenge-2.json
│   │   └── challenge-30.json
│   ├── user-states/
│   │   ├── average.json
│   │   ├── fit-healthy.json
│   │   ├── lean-tired.json
│   │   ├── injured-recovering.json
│   │   ├── fit-injured.json
│   │   └── muscular-strong.json
│   ├── achievements/
│   │   ├── streak-achievements.json
│   │   ├── knowledge-achievements.json
│   │   └── habit-achievements.json
│   └── streak-types/
│       └── streak-types.json
```

### Content Type Definitions

```typescript
// src/types/content.ts
export interface ContentCategory {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Question {
  id: string;
  content_category_id: string;
  knowledge_base_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'passage_based' | 'true_false';
  options: string[];
  correct_answer_index: number;
  explanation: string;
  hints: string[];
  difficulty_level: number;
  image_url?: string;
  passage_set_id?: string;
  is_standalone: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface PassageSet {
  id: string;
  content_category_id: string;
  title: string;
  passage_text: string;
  difficulty_level: number;
  estimated_read_time_minutes: number;
  question_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface DailyChallenge {
  id: string;
  content_category_id: string;
  day: number;
  challenge_structure: Array<{
    type: 'standalone' | 'passage';
    question_id?: string;
    passage_set_id?: string;
    question_ids?: string[];
  }>;
  total_questions: number;
  theme?: string;
  created_at: string;
  updated_at: string;
}

export interface UserState {
  id: string;
  unlock_condition: {
    type: 'streak' | 'score' | 'questions';
    value: number;
    streak_type?: string;
  };
  eval_order: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  unlock_condition: {
    type: 'streak' | 'questions';
    value: number;
    streak_type?: string;
  };
  is_hidden: boolean;
  category?: 'streaks' | 'knowledge' | 'social' | 'habits';
  created_at: string;
}

export interface StreakType {
  id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
}
```

## State Management Architecture

### Zustand Store Structure

```typescript
// src/store/auth-store.ts
import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user,
    isLoading: false 
  }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ 
    user: null, 
    isAuthenticated: false,
    isLoading: false 
  }),
}));

// src/store/game-store.ts
interface GameState {
  currentChallenge: DailyChallenge | null;
  currentSession: GameSession | null;
  currentQuestionIndex: number;
  answers: Record<string, number>;
  isCompleted: boolean;
  startChallenge: (challenge: DailyChallenge) => void;
  answerQuestion: (questionId: string, answerIndex: number) => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentChallenge: null,
  currentSession: null,
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
  startChallenge: (challenge) => set({ 
    currentChallenge: challenge,
    currentQuestionIndex: 0,
    answers: {},
    isCompleted: false
  }),
  answerQuestion: (questionId, answerIndex) => {
    const { answers } = get();
    set({ 
      answers: { ...answers, [questionId]: answerIndex },
      currentQuestionIndex: get().currentQuestionIndex + 1
    });
  },
  completeSession: () => set({ isCompleted: true }),
  resetSession: () => set({ 
    currentQuestionIndex: 0,
    answers: {},
    isCompleted: false
  }),
}));

// src/store/profile-store.ts
interface ProfileState {
  userProfile: UserProfile | null;
  currentStreaks: Record<string, number>;
  achievements: Achievement[];
  avatarState: UserState | null;
  setUserProfile: (profile: UserProfile) => void;
  updateStreaks: (streaks: Record<string, number>) => void;
  addAchievement: (achievement: Achievement) => void;
  setAvatarState: (state: UserState) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  userProfile: null,
  currentStreaks: {},
  achievements: [],
  avatarState: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  updateStreaks: (streaks) => set({ currentStreaks: streaks }),
  addAchievement: (achievement) => set((state) => ({
    achievements: [...state.achievements, achievement]
  })),
  setAvatarState: (state) => set({ avatarState: state }),
}));
```

## API Route Implementation

### Authentication Routes

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// src/app/api/auth/signup/route.ts
export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name } = await request.json();
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          current_state: 'average',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Game Session Routes

```typescript
// src/app/api/sessions/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gameSessions } from '@/lib/db/schema';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { challenge_id, total_questions } = await request.json();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [session] = await db.insert(gameSessions).values({
      user_id: user.id,
      challenge_id,
      total_questions,
      started_at: new Date(),
    }).returning();

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// src/app/api/sessions/[id]/complete/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { correct_answers, time_spent_seconds } = await request.json();
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [session] = await db
      .update(gameSessions)
      .set({
        is_completed: true,
        completed_at: new Date(),
        correct_answers,
        time_spent_seconds,
      })
      .where(eq(gameSessions.id, params.id))
      .returning();

    // Update streaks and check achievements
    await updateUserStreaks(user.id, 'quiz_completed');
    await checkAchievements(user.id);

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Component Architecture

### Core Game Components

```typescript
// src/components/game/daily-challenge.tsx
'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { QuestionRenderer } from './question-renderer';
import { PassageRenderer } from './passage-renderer';
import { ProgressTracker } from './progress-tracker';
import { ResultsDisplay } from './results-display';
import { DailyChallenge, GameSession } from '@/types';

interface DailyChallengeProps {
  challenge: DailyChallenge;
}

export function DailyChallenge({ challenge }: DailyChallengeProps) {
  const {
    currentSession,
    currentQuestionIndex,
    answers,
    isCompleted,
    startChallenge,
    completeSession,
  } = useGameStore();

  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    if (challenge && !currentSession) {
      startChallenge(challenge);
      startNewSession();
    }
  }, [challenge, currentSession]);

  const startNewSession = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challenge.id,
          total_questions: challenge.total_questions,
        }),
      });

      if (response.ok) {
        const { session: newSession } = await response.json();
        setSession(newSession);
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleQuestionAnswer = async (questionId: string, answerIndex: number) => {
    // Store answer locally
    useGameStore.getState().answerQuestion(questionId, answerIndex);

    // Record attempt in database
    try {
      await fetch('/api/questions/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_session_id: session?.id,
          question_id: questionId,
          selected_answer_index: answerIndex,
          is_correct: checkAnswer(questionId, answerIndex),
          time_spent_seconds: 0, // TODO: implement timing
        }),
      });
    } catch (error) {
      console.error('Failed to record answer:', error);
    }

    // Check if challenge is complete
    if (currentQuestionIndex >= challenge.total_questions - 1) {
      completeChallenge();
    }
  };

  const completeChallenge = async () => {
    if (!session) return;

    try {
      const correctCount = Object.values(answers).filter(
        (answer, index) => answer === getCorrectAnswer(index)
      ).length;

      await fetch(`/api/sessions/${session.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correct_answers: correctCount,
          time_spent_seconds: 0, // TODO: implement timing
        }),
      });

      completeSession();
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    }
  };

  if (isCompleted) {
    return <ResultsDisplay session={session} challenge={challenge} />;
  }

  const currentItem = challenge.challenge_structure[currentQuestionIndex];
  const isPassage = currentItem.type === 'passage';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ProgressTracker
        current={currentQuestionIndex + 1}
        total={challenge.total_questions}
        challenge={challenge}
      />
      
      {isPassage ? (
        <PassageRenderer
          passageSetId={currentItem.passage_set_id!}
          questionIds={currentItem.question_ids!}
          onAnswer={handleQuestionAnswer}
        />
      ) : (
        <QuestionRenderer
          questionId={currentItem.question_id!}
          onAnswer={handleQuestionAnswer}
        />
      )}
    </div>
  );
}
```

### Question Rendering Components

```typescript
// src/components/game/question-renderer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/types';
import { getQuestionById } from '@/lib/content';

interface QuestionRendererProps {
  questionId: string;
  onAnswer: (questionId: string, answerIndex: number) => void;
}

export function QuestionRenderer({ questionId, onAnswer }: QuestionRendererProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const loadQuestion = async () => {
      const q = await getQuestionById(questionId);
      setQuestion(q);
    };
    loadQuestion();
  }, [questionId]);

  if (!question) {
    return <div>Loading question...</div>;
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      onAnswer(questionId, selectedAnswer);
      setShowExplanation(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{question.question_text}</h2>
        
        {question.image_url && (
          <img
            src={question.image_url}
            alt="Question illustration"
            className="w-full max-w-md mx-auto mb-4 rounded"
          />
        )}

        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="mt-6 w-full bg-blue-600 text-white py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      </div>

      {showExplanation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Explanation</h3>
          <p className="text-green-700">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
```

## PWA Implementation

### Service Worker Configuration

```typescript
// src/app/sw.ts
/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache static content (questions, challenges, etc.)
registerRoute(
  ({ url }) => url.pathname.startsWith('/static-content/'),
  new CacheFirst({
    cacheName: 'static-content',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages',
  })
);

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Sync offline question attempts and habit logs
  const offlineData = await getOfflineData();
  
  for (const data of offlineData) {
    try {
      await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.body,
      });
      await removeOfflineData(data.id);
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }
}
```

### PWA Manifest

```json
// public/manifest.json
{
  "name": "Fitness AI Game",
  "short_name": "FitGame",
  "description": "Learn fitness through daily AI-powered challenges",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Content Generation Pipeline

### AI Content Generation Scripts

```typescript
// scripts/generate-content.ts
import { OpenAI } from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentGenerationConfig {
  category: string;
  questionCount: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

async function generateQuestions(config: ContentGenerationConfig) {
  const prompt = `
Generate ${config.questionCount} fitness questions for the category: ${config.category}

Requirements:
- Questions should be multiple choice with 4 options
- Include explanations for correct answers
- Vary difficulty levels appropriately
- Make questions engaging and educational
- Include relevant tags

Format as JSON array with the following structure:
{
  "id": "uuid",
  "content_category_id": "${config.category}",
  "question_text": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer_index": 0,
  "explanation": "Detailed explanation...",
  "difficulty_level": 1-5,
  "tags": ["tag1", "tag2"]
}

Generate questions with this difficulty distribution:
- Easy (1-2): ${config.difficultyDistribution.easy}
- Medium (3): ${config.difficultyDistribution.medium}
- Hard (4-5): ${config.difficultyDistribution.hard}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content generated');

    // Parse and validate the generated content
    const questions = JSON.parse(content);
    
    // Save to file
    const outputDir = join(__dirname, '../src/static-content/questions');
    mkdirSync(outputDir, { recursive: true });
    
    const filename = join(outputDir, `${config.category}.json`);
    writeFileSync(filename, JSON.stringify(questions, null, 2));
    
    console.log(`Generated ${questions.length} questions for ${config.category}`);
  } catch (error) {
    console.error(`Failed to generate content for ${config.category}:`, error);
  }
}

// Generate content for all categories
const categories = [
  'equipment',
  'form',
  'nutrition',
  'injury-prevention',
  'body-mechanics',
  'foundational-movements',
  'exercise-identification',
];

async function generateAllContent() {
  for (const category of categories) {
    await generateQuestions({
      category,
      questionCount: 50,
      difficultyDistribution: { easy: 20, medium: 20, hard: 10 },
    });
  }
}

generateAllContent().catch(console.error);
```

## Testing Strategy

### Unit Tests

```typescript
// src/components/game/__tests__/question-renderer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionRenderer } from '../question-renderer';
import { mockQuestion } from '@/mocks/question';

jest.mock('@/lib/content', () => ({
  getQuestionById: jest.fn(() => Promise.resolve(mockQuestion)),
}));

describe('QuestionRenderer', () => {
  it('renders question text and options', async () => {
    const onAnswer = jest.fn();
    render(<QuestionRenderer questionId="test-id" onAnswer={onAnswer} />);

    expect(await screen.findByText(mockQuestion.question_text)).toBeInTheDocument();
    
    mockQuestion.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('calls onAnswer when submit button is clicked', async () => {
    const onAnswer = jest.fn();
    render(<QuestionRenderer questionId="test-id" onAnswer={onAnswer} />);

    // Select an answer
    const firstOption = await screen.findByText(mockQuestion.options[0]);
    fireEvent.click(firstOption);

    // Submit
    const submitButton = screen.getByText('Submit Answer');
    fireEvent.click(submitButton);

    expect(onAnswer).toHaveBeenCalledWith('test-id', 0);
  });
});
```

### Integration Tests

```typescript
// src/app/api/__tests__/sessions.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '../sessions/start/route';
import { mockUser } from '@/mocks/user';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({ data: { user: mockUser }, error: null })),
    },
  })),
}));

describe('/api/sessions/start', () => {
  it('creates a new game session', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        challenge_id: 'challenge-1',
        total_questions: 10,
      },
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.session).toBeDefined();
    expect(data.session.challenge_id).toBe('challenge-1');
  });
});
```

## Performance Optimization

### Image Optimization

```typescript
// src/components/ui/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`
          duration-700 ease-in-out
          ${isLoading ? 'scale-110 blur-2xl grayscale' : 'scale-100 blur-0 grayscale-0'}
        `}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
}
```

### Lazy Loading

```typescript
// src/components/game/practice-mode.tsx
import { lazy, Suspense } from 'react';

const CategorySelector = lazy(() => import('./category-selector'));
const QuestionSet = lazy(() => import('./question-set'));

export function PracticeMode() {
  return (
    <div>
      <Suspense fallback={<div>Loading categories...</div>}>
        <CategorySelector />
      </Suspense>
      
      <Suspense fallback={<div>Loading questions...</div>}>
        <QuestionSet />
      </Suspense>
    </div>
  );
}
```

## Deployment Configuration

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/static-content/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3090
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_VERCEL_URL=your_vercel_url
```

This technical design document provides a comprehensive implementation plan that satisfies all the requirements while maintaining scalability, performance, and maintainability. The architecture leverages modern web technologies and follows best practices for PWA development, offline functionality, and real-time user engagement.
