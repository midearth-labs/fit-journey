import type { Article, Question, Category, LearningPhase } from '$lib/types/content';
import type { PersonaQuestion, PersonaLearningPath } from '$lib/types/fitness-persona-calculator';

class ContentService {
  private cache = new Map<string, any>();
  private baseUrl = '/content';

  async loadData<T>(path: string): Promise<T> {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const response = await fetch(`${this.baseUrl}/${path}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }
    
    const data = await response.json();
    this.cache.set(path, data);
    return data;
  }

  async loadCategories(): Promise<Category[]> {
    return this.loadData('categories/categories.json');
  }

  async loadArticles(categoryId: string): Promise<Article[]> {
    return this.loadData(`knowledge-base/${categoryId}.json`);
  }

  async loadQuestions(categoryId: string): Promise<Question[]> {
    return this.loadData(`questions/${categoryId}.json`);
  }

  async loadPersonaQuestions(): Promise<PersonaQuestion[]> {
    return this.loadData('persona-calculator/questions.json');
  }

  async loadPersonaLearningPaths(): Promise<PersonaLearningPath[]> {
    return this.loadData('persona-calculator/learning-paths.json');
  }

  async loadAllArticles(): Promise<Article[]> {
    const categories = await this.loadCategories();
    const allArticles: Article[] = [];

    for (const category of categories) {
      try {
        const articles = await this.loadArticles(category.id);
        allArticles.push(...articles);
      } catch (error) {
        console.warn(`Failed to load articles for category ${category.id}:`, error);
      }
    }

    return allArticles.sort((a, b) => a.day - b.day);
  }

  async getArticleById(articleId: string): Promise<Article | null> {
    const allArticles = await this.loadAllArticles();
    return allArticles.find(article => article.id === articleId) || null;
  }

  async getQuestionsForArticle(articleId: string): Promise<Question[]> {
    const allArticles = await this.loadAllArticles();
    const article = allArticles.find(article => article.id === articleId);
    
    if (!article) return [];

    try {
      const questions = await this.loadQuestions(article.content_category_id);
      return questions.filter(q => q.knowledge_base_id === articleId);
    } catch (error) {
      console.warn(`Failed to load questions for article ${articleId}:`, error);
      return [];
    }
  }

  async getLearningPhases(): Promise<LearningPhase[]> {
    const categories = await this.loadCategories();
    const allArticles = await this.loadAllArticles();

    const phases: LearningPhase[] = [
      {
        id: 'phase-1',
        name: 'Foundation Building',
        description: 'Essential knowledge base before specialized topics',
        dayRange: [1, 6],
        categories: ['fitness-foundation'],
        articles: allArticles.filter(a => a.day >= 1 && a.day <= 6)
      },
      {
        id: 'phase-2',
        name: 'Core Knowledge Introduction',
        description: 'Practical application foundations',
        dayRange: [7, 18],
        categories: ['nutrition-essentials', 'health-lifestyle', 'exercise-types-goals', 'body-mechanics'],
        articles: allArticles.filter(a => a.day >= 7 && a.day <= 18)
      },
      {
        id: 'phase-3',
        name: 'Movement Mastery',
        description: 'Advanced nutrition, movement literacy and goal refinement',
        dayRange: [19, 30],
        categories: ['nutrition-essentials', 'health-lifestyle', 'exercise-types-goals', 'body-mechanics'],
        articles: allArticles.filter(a => a.day >= 19 && a.day <= 30)
      },
      {
        id: 'phase-4',
        name: 'Practical Application',
        description: 'Hands-on implementation and technique mastery',
        dayRange: [31, 46],
        categories: ['equipment-gym-basics', 'exercise-fundamentals'],
        articles: allArticles.filter(a => a.day >= 31 && a.day <= 46)
      },
      {
        id: 'phase-5',
        name: 'Integration Foundation',
        description: 'Holistic wellness introduction',
        dayRange: [47, 52],
        categories: ['recovery-injury-prevention', 'mindset-motivation'],
        articles: allArticles.filter(a => a.day >= 47 && a.day <= 52)
      },
      {
        id: 'phase-6',
        name: 'Mastery & Sustainability',
        description: 'Long-term success and lifestyle integration',
        dayRange: [53, 70],
        categories: ['recovery-injury-prevention', 'mindset-motivation'],
        articles: allArticles.filter(a => a.day >= 53 && a.day <= 70)
      }
    ];

    return phases;
  }
}

export const contentService = new ContentService();
