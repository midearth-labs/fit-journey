
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
  LearningPath,
  PersonaAnswerOption, 
  PersonaQuestion 
};
    
export type PersonaAssessmentResult = {
  userPersonaScores: Map<PersonaTags, number>;
  rankedPaths: {
    path: Pick<LearningPath, 'id' | 'name'>;
    matchScore: number;
    matchPercentage: number;
  }[];
  primaryPersona: string; // Description of user's primary characteristics
  recommendedPath: Pick<LearningPath, 'id' | 'name'>;
}