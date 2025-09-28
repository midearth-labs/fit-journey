import type { Article, Question, Category } from '$lib/types/content';
import type { PersonaQuestion, LearningPath } from '$lib/types/fitness-persona-calculator';

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
    return this.loadData('persona-questions/questions.json');
  }

  async loadLearningPaths(): Promise<LearningPath[]> {
    return this.loadData('learning-paths/learning.json');
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

}

export const contentService = new ContentService();
