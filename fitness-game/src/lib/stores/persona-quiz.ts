import { writable } from '$lib/stores/local-storage-store';
import type { PersonaAnswerOption, PersonaQuizResult } from '$lib/types/fitness-persona-calculator';

interface PersonaQuizProgress {
  currentQuestionIndex: number;
  answers: Record<string, number>;
  isCompleted: boolean;
  result: PersonaQuizResult | null;
  startTime: number | null;
  endTime: number | null;
}

const defaultProgress: PersonaQuizProgress = {
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,
  result: null,
  startTime: null,
  endTime: null
};

const BROWSER_STORAGE_KEY = 'fitjourney-persona-quiz';

function createPersonaQuizStore() {
  const { subscribe, set, update } = writable<PersonaQuizProgress>(BROWSER_STORAGE_KEY, defaultProgress);

  return {
    subscribe,
    set,
    update,
    startQuiz: () => {
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
    completeQuiz: (result: PersonaQuizResult) => {
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
    getQuizDuration: (): number | null => {
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

export const personaQuizStore = createPersonaQuizStore();
