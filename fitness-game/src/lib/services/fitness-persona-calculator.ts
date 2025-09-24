import type { PersonaLearningPath, PersonaAnswerOption, PersonaQuizResult } from '../types/fitness-persona-calculator';
import { PersonaTags } from '../types/fitness-persona-calculator';

// Static mapping of PersonaTags to their descriptions
const personaDescriptions: Record<PersonaTags, string> = {
  // Knowledge Level
  [PersonaTags.COMPLETE_BEGINNER]: 'complete fitness beginner',
  [PersonaTags.SOME_KNOWLEDGE]: 'fitness learner with some experience',
  [PersonaTags.INTERMEDIATE]: 'intermediate fitness enthusiast',
  
  // Time Availability
  [PersonaTags.TIME_POOR]: 'time-constrained individual',
  [PersonaTags.TIME_FLEXIBLE]: 'flexible schedule exerciser',
  [PersonaTags.WEEKEND_ONLY]: 'weekend warrior',
  
  // Motivation Type
  [PersonaTags.NEEDS_MOTIVATION]: 'motivation-seeking learner',
  [PersonaTags.SELF_MOTIVATED]: 'self-driven exerciser',
  [PersonaTags.SOCIALLY_MOTIVATED]: 'socially-motivated exerciser',
  [PersonaTags.DATA_DRIVEN]: 'data-driven optimizer',
  
  // Goals
  [PersonaTags.WEIGHT_LOSS]: 'weight loss focused',
  [PersonaTags.MUSCLE_GAIN]: 'strength building focused',
  [PersonaTags.HEALTH_FOCUS]: 'health-conscious individual',
  [PersonaTags.GENERAL_FITNESS]: 'general fitness enthusiast',
  
  // Barriers
  [PersonaTags.GYM_ANXIETY]: 'gym-anxious beginner',
  [PersonaTags.RESTART_ANXIETY]: 'restart warrior',
  [PersonaTags.INJURY_CONCERN]: 'injury-conscious exerciser',
  [PersonaTags.NO_GYM_ACCESS]: 'home workout enthusiast',
  
  // Life Situation
  [PersonaTags.BUSY_PARENT]: 'busy parent',
  [PersonaTags.BUSY_PROFESSIONAL]: 'busy professional',
  [PersonaTags.STUDENT]: 'student athlete',
  
  // Personality
  [PersonaTags.ANALYTICAL]: 'analytical learner',
  [PersonaTags.ACTION_ORIENTED]: 'action-oriented starter',
  [PersonaTags.CAUTIOUS]: 'cautious exerciser',
  [PersonaTags.SOCIAL]: 'social exerciser'
};

// Mutually-exclusive persona groups. Only the highest-scoring tag in each group is retained.
const mutuallyExclusiveGroups: Map<string, PersonaTags[]> = new Map<string, PersonaTags[]>([
  [
    'knowledge',
    [
      PersonaTags.COMPLETE_BEGINNER,
      PersonaTags.SOME_KNOWLEDGE,
      PersonaTags.INTERMEDIATE
    ]
  ],
  [
    'time',
    [
      PersonaTags.TIME_POOR,
      PersonaTags.TIME_FLEXIBLE,
      PersonaTags.WEEKEND_ONLY
    ]
  ],
  [
    'motivation',
    [
      PersonaTags.NEEDS_MOTIVATION,
      PersonaTags.SELF_MOTIVATED,
      PersonaTags.SOCIALLY_MOTIVATED,
      PersonaTags.DATA_DRIVEN
    ]
  ],
  [
    'goals',
    [
      PersonaTags.WEIGHT_LOSS,
      PersonaTags.MUSCLE_GAIN,
      PersonaTags.HEALTH_FOCUS,
      PersonaTags.GENERAL_FITNESS
    ]
  ],
  [
    'barriers',
    [
      PersonaTags.GYM_ANXIETY,
      PersonaTags.RESTART_ANXIETY,
      PersonaTags.INJURY_CONCERN,
      PersonaTags.NO_GYM_ACCESS
    ]
  ],
  [
    'life',
    [
      PersonaTags.BUSY_PARENT,
      PersonaTags.BUSY_PROFESSIONAL,
      PersonaTags.STUDENT
    ]
  ],
  [
    'personality',
    [
      PersonaTags.ANALYTICAL,
      PersonaTags.ACTION_ORIENTED,
      PersonaTags.CAUTIOUS,
      PersonaTags.SOCIAL
    ]
  ]
]);

// Main Scoring Algorithm
export class FitnessPersonaCalculator {
    private paths: PersonaLearningPath[];
  
    constructor(paths: PersonaLearningPath[]) {
      this.paths = paths;
    }
  
    /**
     * Calculate user persona scores based on their answers
     */
    private calculatePersonaScores(answers: Map<string, PersonaAnswerOption>): Map<PersonaTags, number> {
      const personaScores = new Map<PersonaTags, number>();
  
      // Initialize all persona tags with 0
      Object.values(PersonaTags).forEach(tag => {
        personaScores.set(tag, 0);
      });
  
      // Accumulate scores from each answer
      answers.forEach((answer, questionId) => {
        const weight = answer.weight || 1;
        
        answer.tags.forEach(tag => {
          const currentScore = personaScores.get(tag) || 0;
          personaScores.set(tag, currentScore + weight);
        });
      });
  
      return personaScores;
    }

    /**
     * Reduce scores so that only the top-scoring tag in each mutually-exclusive
     * group remains. Ties are broken by the order of tags in the group.
     */
    private reduceToTopPerGroup(scores: Map<PersonaTags, number>): Map<PersonaTags, number> {
      // Create a new map to avoid mutating the original reference unexpectedly
      const reduced = new Map<PersonaTags, number>(scores);

      mutuallyExclusiveGroups.forEach((group) => {
        let bestTag: PersonaTags | null = null;
        let bestScore = -Infinity;

        group.forEach(tag => {
          const tagScore = reduced.get(tag) || 0;
          if (tagScore > bestScore) {
            bestScore = tagScore;
            bestTag = tag;
          }
        });

        // Zero-out all non-best tags in the group
        group.forEach(tag => {
          if (tag !== bestTag) {
            reduced.set(tag, 0);
          }
        });
      });

      return reduced;
    }
  
    /**
     * Calculate how well a learning path matches the user's persona
     */
    private calculatePathMatchScore(
      userPersona: Map<PersonaTags, number>,
      pathWeights: Partial<Record<PersonaTags, number>>
    ): number {
      let matchScore = 0;
      
      Object.entries(pathWeights).forEach(([tag, pathWeight]) => {
        // @@TODO: have a build script verify that the tags are valid in the PersonaTags enum
        const userScore = userPersona.get(tag as PersonaTags) || 0;
        matchScore += userScore * pathWeight;
      });
  
      return matchScore;
    }
  
    /**
     * Generate a description of the user's primary characteristics
     */
    private generatePersonaDescription(personaScores: Map<PersonaTags, number>): string {
      // Sort persona tags by score
      const sortedTags = Array.from(personaScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3); // Top 3 characteristics

      const topCharacteristics = sortedTags
        .map(([tag]) => personaDescriptions[tag])
        .filter(desc => desc);

      if (topCharacteristics.length === 0) return 'Balanced fitness learner';
      if (topCharacteristics.length === 1) return `A ${topCharacteristics[0]}`;
      
      return `A ${topCharacteristics.slice(0, -1).join(', ')} and ${topCharacteristics[topCharacteristics.length - 1]}`;
    }
  
    /**
     * Main scoring function
     */
    public scoreQuiz(userAnswers: Map<string, PersonaAnswerOption>): PersonaQuizResult {
      // Calculate user's persona scores
      const rawPersonaScores = this.calculatePersonaScores(userAnswers);
      const userPersonaScores = this.reduceToTopPerGroup(rawPersonaScores);
  
      // Calculate match scores for each path
      const pathScores = this.paths.map(path => {
        const matchScore = this.calculatePathMatchScore(userPersonaScores, path.personaWeights);
        return {
          path,
          matchScore,
          matchPercentage: 0 // Will be calculated after normalization
        };
      });
  
      // Sort paths by match score
      pathScores.sort((a, b) => b.matchScore - a.matchScore);
  
      // Calculate percentages (normalize to 0-100%)
      const maxScore = Math.max(...pathScores.map(p => p.matchScore));
      pathScores.forEach(ps => {
        ps.matchPercentage = maxScore > 0 ? Math.round((ps.matchScore / maxScore) * 100) : 0;
      });
  
      // Generate persona description
      const primaryPersona = this.generatePersonaDescription(userPersonaScores);
  
      return {
        userPersonaScores,
        rankedPaths: pathScores,
        primaryPersona,
        recommendedPath: pathScores[0].path
      };
    }
  }