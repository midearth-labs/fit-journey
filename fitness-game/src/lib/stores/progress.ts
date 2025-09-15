import { writable } from 'svelte/store';
import { browser } from '$app/environment';

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

function createProgressStore() {
  const { subscribe, set, update } = writable<Progress>(defaultProgress);

  return {
    subscribe,
    load: () => {
      if (browser) {
        const stored = localStorage.getItem('fitjourney-progress');
        if (stored) {
          set(JSON.parse(stored));
        }
      }
    },
    save: (progress: Progress) => {
      if (browser) {
        localStorage.setItem('fitjourney-progress', JSON.stringify(progress));
        set(progress);
      }
    },
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
