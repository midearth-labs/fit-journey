import type { LearningPath, PersonaAnswerOption, PersonaAssessmentResult } from '../types/fitness-persona-calculator';
import type { PersonaTags } from '$lib/server/content/types/learning-paths';

// Static mapping of PersonaTags to their descriptions
const personaDescriptions: Record<PersonaTags, string> = {
  // Knowledge Level
  'complete_beginner': 'complete fitness beginner',
  'some_knowledge': 'fitness learner with some experience',
  'intermediate': 'intermediate fitness enthusiast',
  
  // Time Availability
  'time_poor': 'time-constrained individual',
  'time_flexible': 'flexible schedule exerciser',
  'weekend_only': 'weekend warrior',
  
  // Motivation Type
  'needs_motivation': 'motivation-seeking learner',
  'self_motivated': 'self-driven exerciser',
  'socially_motivated': 'socially-motivated exerciser',
  'data_driven': 'data-driven optimizer',
  
  // Goals
  'weight_loss': 'weight loss focused',
  'muscle_gain': 'strength building focused',
  'health_focus': 'health-conscious individual',
  'general_fitness': 'general fitness enthusiast',
  
  // Barriers
  'gym_anxiety': 'gym-anxious beginner',
  'restart_anxiety': 'restart warrior',
  'injury_concern': 'injury-conscious exerciser',
  'no_gym_access': 'home workout enthusiast',
  
  // Life Situation
  'busy_parent': 'busy parent',
  'busy_professional': 'busy professional',
  'student': 'student athlete',
  
  // Personality
  'analytical': 'analytical learner',
  'action_oriented': 'action-oriented starter',
  'cautious': 'cautious exerciser',
  'social': 'social exerciser'
};

// Mutually-exclusive persona groups. Only the highest-scoring tag in each group is retained.
const mutuallyExclusiveGroups: Map<string, PersonaTags[]> = new Map<string, PersonaTags[]>([
  [
    'knowledge',
    [
      'complete_beginner',
      'some_knowledge',
      'intermediate'
    ]
  ],
  [
    'time',
    [
      'time_poor',
      'time_flexible',
      'weekend_only'
    ]
  ],
  [
    'motivation',
    [
      'needs_motivation',
      'self_motivated',
      'socially_motivated',
      'data_driven'
    ]
  ],
  [
    'goals',
    [
      'weight_loss',
      'muscle_gain',
      'health_focus',
      'general_fitness'
    ]
  ],
  [
    'barriers',
    [
      'gym_anxiety',
      'restart_anxiety',
      'injury_concern',
      'no_gym_access'
    ]
  ],
  [
    'life',
    [
      'busy_parent',
      'busy_professional',
      'student'
    ]
  ],
  [
    'personality',
    [
      'analytical',
      'action_oriented',
      'cautious',
      'social'
    ]
  ]
]);

// Main Scoring Algorithm
export class FitnessPersonaCalculator {
    private paths: LearningPath[];
  
    constructor(paths: LearningPath[]) {
      this.paths = paths;
    }
  
    /**
     * Calculate user persona scores based on their answers
     */
    private calculatePersonaScores(answers: Map<string, PersonaAnswerOption>): Map<PersonaTags, number> {
      const personaScores = new Map<PersonaTags, number>();
  
      // Initialize all persona tags with 0
      // @@TODO: use PersonaTags enum instead of personaDescriptions
      const allPersonaTags: PersonaTags[] = Object.keys(personaDescriptions) as PersonaTags[];
      
      allPersonaTags.forEach(tag => {
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
    public scoreAssessment(userAnswers: Map<string, PersonaAnswerOption>): PersonaAssessmentResult {
      // Calculate user's persona scores
      const rawPersonaScores = this.calculatePersonaScores(userAnswers);
      const userPersonaScores = this.reduceToTopPerGroup(rawPersonaScores);
  
      // Calculate match scores for each path
      const pathScores = this.paths.map(path => {
        const matchScore = this.calculatePathMatchScore(userPersonaScores, path.personaWeights || {});
        return {
          path: { id: path.id, name: path.name },
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