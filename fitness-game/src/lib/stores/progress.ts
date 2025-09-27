import { writable } from '$lib/stores/local-storage-store';

interface Progress {
  completedArticles: string[];
  completedQuestions: Array<{ id: string; correct: boolean }>;
  currentDay: number;
  totalScore: number;
  categoryProgress: Record<string, any>;
}

const defaultProgress: Progress = {
  completedArticles: [],
  completedQuestions: [],
  currentDay: 1,
  totalScore: 0,
  categoryProgress: {}
};

const BROWSER_STORAGE_KEY = 'fitjourney-progress';

function createProgressStore() {
  const { subscribe, set, update } = writable<Progress>(BROWSER_STORAGE_KEY, defaultProgress);

  return {
    subscribe,
    set,
    update,
    markArticleCompleted: (articleId: string) => {
      update(progress => {
        if (!progress.completedArticles.includes(articleId)) {
          progress.completedArticles.push(articleId);
        }
        return progress;
      });
    },
    markQuestionCompleted: (questionId: string, correct: boolean) => {
      update(progress => {
        const existingIndex = progress.completedQuestions.findIndex(q => q.id === questionId);
        
        if (existingIndex >= 0) {
          progress.completedQuestions[existingIndex] = { id: questionId, correct };
        } else {
          progress.completedQuestions.push({ id: questionId, correct });
        }
        
        if (correct) {
          progress.totalScore += 1;
        }
        
        return progress;
      });
    }
  };
}

export const progressStore = createProgressStore();
