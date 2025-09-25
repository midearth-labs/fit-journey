
// Re-export types from server content types
import type { 
  PersonaTags, 
  LearningPath 
} from '$lib/server/content/types/learning-paths';

import type { 
  PersonaAnswerOption, 
  PersonaQuestion 
} from '$lib/server/content/types/persona-question';

export type { 
  PersonaTags, 
  LearningPath as PersonaLearningPath,
  PersonaAnswerOption, 
  PersonaQuestion 
};
    
export type PersonaQuizResult = {
  userPersonaScores: Map<PersonaTags, number>;
  rankedPaths: {
    path: LearningPath;
    matchScore: number;
    matchPercentage: number;
  }[];
  primaryPersona: string; // Description of user's primary characteristics
  recommendedPath: LearningPath;
}