import { writable } from '$lib/stores/local-storage-store';
import type { PersonaAnswerOption, PersonaAssessmentResult } from '$lib/types/fitness-persona-calculator';

interface PersonaAssessmentProgress {
  currentQuestionIndex: number;
  answers: Record<string, number>;
  isCompleted: boolean;
  result: PersonaAssessmentResult | null;
  startTime: number | null;
  endTime: number | null;
}

const defaultProgress: PersonaAssessmentProgress = {
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
  result: null,
  startTime: null,
  endTime: null
};

const BROWSER_STORAGE_KEY = 'fitjourney-persona-assessment';

function createPersonaAssessmentStore() {
  const { subscribe, set, update } = writable<PersonaAssessmentProgress>(BROWSER_STORAGE_KEY, defaultProgress);

  return {
    subscribe,
    set,
    update,
    startAssessment: () => {
      update(progress => ({
        ...defaultProgress,
        startTime: Date.now()
      }));
    },
    answerQuestion: (questionId: string, answerIndex: number) => {
      update(progress => {
        return {
          ...progress,
          answers: {
            ...progress.answers,
            [questionId]: answerIndex
          },
          currentQuestionIndex: progress.currentQuestionIndex + 1
        };
      });
    },
    completeAssessment: (result: PersonaAssessmentResult) => {
      update(progress => ({
        ...progress,
        isCompleted: true,
        result,
        endTime: Date.now()
      }));
    },
    goBackToQuestion: (questionIndex: number) => {
      update(progress => ({
        ...progress,
        currentQuestionIndex: questionIndex
      }));
    },
    getAssessmentDuration: (): number | null => {
      let duration: number | null = null;
      subscribe(progress => {
        if (progress.startTime && progress.endTime) {
          duration = progress.endTime - progress.startTime;
        }
      })();
      return duration;
    }
  };
}

export const personaAssessmentStore = createPersonaAssessmentStore();
