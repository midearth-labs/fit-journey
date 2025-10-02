import type { Article, ArticleDetail, Question, Category, LogType, PersonaQuestion, LearningPath } from '$lib/types/content';

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
    return (await this.loadAllArticles()).filter(article => article.content_category_id === categoryId);
  }

  async loadQuestions(categoryId: string): Promise<Question[]> {
    return this.loadData(`questions/${categoryId}.json`);
  }

  async loadPersonaQuestions(): Promise<PersonaQuestion[]> {
    return this.loadData('persona-questions/questions.json');
  }

  async loadLogTypes(): Promise<LogType[]> {
    return this.loadData('log-types/log-types.json');
  }

  async loadLearningPaths(): Promise<LearningPath[]> {
    return this.loadData('learning-paths/learning.json');
  }

  async loadAllArticles(): Promise<Article[]> {
    return this.loadData(`knowledge-base/articles.json`);
  }

  async getArticleById(articleId: string): Promise<ArticleDetail | null> {
    return this.loadData(`knowledge-base/articles/${articleId}.article.json`);
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
