
    // Types and Enums
    export enum PersonaTags {
      // Knowledge Level
      COMPLETE_BEGINNER = 'complete_beginner',
      SOME_KNOWLEDGE = 'some_knowledge',
      INTERMEDIATE = 'intermediate',
      
      // Time Availability
      TIME_POOR = 'time_poor',
      TIME_FLEXIBLE = 'time_flexible',
      WEEKEND_ONLY = 'weekend_only',
      
      // Motivation Type
      NEEDS_MOTIVATION = 'needs_motivation',
      SELF_MOTIVATED = 'self_motivated',
      SOCIALLY_MOTIVATED = 'socially_motivated',
      DATA_DRIVEN = 'data_driven',
      
      // Goals
      WEIGHT_LOSS = 'weight_loss',
      MUSCLE_GAIN = 'muscle_gain',
      HEALTH_FOCUS = 'health_focus',
      GENERAL_FITNESS = 'general_fitness',
      
      // Barriers
      GYM_ANXIETY = 'gym_anxiety',
      RESTART_ANXIETY = 'restart_anxiety',
      INJURY_CONCERN = 'injury_concern',
      NO_GYM_ACCESS = 'no_gym_access',
      
      // Life Situation
      BUSY_PARENT = 'busy_parent',
      BUSY_PROFESSIONAL = 'busy_professional',
      STUDENT = 'student',
      
      // Personality
      ANALYTICAL = 'analytical',
      ACTION_ORIENTED = 'action_oriented',
      CAUTIOUS = 'cautious',
      SOCIAL = 'social'
    }
    
    export type PersonaAnswerOption = {
      text: string;
      tags: PersonaTags[];
      weight?: number; // Optional weight multiplier for certain tags (default 1)
    }
    
    export type PersonaQuestion = {
      id: string;
      text: string;
      category: 'knowledge' | 'preference' | 'situation' | 'goals' | 'barriers';
      answers: PersonaAnswerOption[];
    }
  
    
    export type PersonaLearningPath = {
      id: string;
      name: string;
      description: string;
      articles: string[]; // Array of articles in order
      personaWeights: Partial<Record<PersonaTags, number>>; // How much each tag contributes to this path
    }
    
    export type PersonaQuizResult = {
      userPersonaScores: Map<PersonaTags, number>;
      rankedPaths: {
        path: PersonaLearningPath;
        matchScore: number;
        matchPercentage: number;
      }[];
      primaryPersona: string; // Description of user's primary characteristics
      recommendedPath: PersonaLearningPath;
    }