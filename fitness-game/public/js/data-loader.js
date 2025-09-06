/**
 * Data Loader - Handles loading and caching of content data
 */
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.baseUrl = '../content';
    }

    /**
     * Load data from JSON file with caching
     * @param {string} path - Path to JSON file
     * @returns {Promise<any>} - Parsed JSON data
     */
    async loadData(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            const response = await fetch(`${this.baseUrl}/${path}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(path, data);
            return data;
        } catch (error) {
            console.error(`Error loading data from ${path}:`, error);
            throw error;
        }
    }

    /**
     * Load categories data
     * @returns {Promise<Array>} - Categories array
     */
    async loadCategories() {
        return await this.loadData('categories/categories.json');
    }

    /**
     * Load knowledge base articles for a specific category
     * @param {string} categoryId - Category ID
     * @returns {Promise<Array>} - Articles array
     */
    async loadArticles(categoryId) {
        return await this.loadData(`knowledge-base/${categoryId}.json`);
    }

    /**
     * Load questions for a specific category
     * @param {string} categoryId - Category ID
     * @returns {Promise<Array>} - Questions array
     */
    async loadQuestions(categoryId) {
        return await this.loadData(`questions/${categoryId}.json`);
    }

    /**
     * Load all articles across all categories
     * @returns {Promise<Array>} - All articles array
     */
    async loadAllArticles() {
        const categories = await this.loadCategories();
        const allArticles = [];

        for (const category of categories) {
            try {
                const articles = await this.loadArticles(category.id);
                allArticles.push(...articles);
            } catch (error) {
                console.warn(`Failed to load articles for category ${category.id}:`, error);
            }
        }

        // Sort by day number
        return allArticles.sort((a, b) => a.day - b.day);
    }

    /**
     * Get article by ID
     * @param {string} articleId - Article ID
     * @returns {Promise<Object|null>} - Article object or null
     */
    async getArticleById(articleId) {
        const allArticles = await this.loadAllArticles();
        return allArticles.find(article => article.id === articleId) || null;
    }

    /**
     * Get questions for a specific article
     * @param {string} articleId - Article ID
     * @returns {Promise<Array>} - Questions array
     */
    async getQuestionsForArticle(articleId) {
        const allArticles = await this.loadAllArticles();
        const article = allArticles.find(article => article.id === articleId);
        
        if (!article) {
            return [];
        }

        try {
            const questions = await this.loadQuestions(article.content_category_id);
            return questions.filter(q => q.knowledge_base_id === articleId);
        } catch (error) {
            console.warn(`Failed to load questions for article ${articleId}:`, error);
            return [];
        }
    }

    /**
     * Get articles by day range
     * @param {number} startDay - Start day
     * @param {number} endDay - End day
     * @returns {Promise<Array>} - Articles array
     */
    async getArticlesByDayRange(startDay, endDay) {
        const allArticles = await this.loadAllArticles();
        return allArticles.filter(article => 
            article.day >= startDay && article.day <= endDay
        );
    }

    /**
     * Get learning phases based on the 6-phase structure
     * @returns {Promise<Array>} - Phases array
     */
    async getLearningPhases() {
        const categories = await this.loadCategories();
        const allArticles = await this.loadAllArticles();

        const phases = [
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

    /**
     * Get user progress from localStorage
     * @returns {Object} - Progress object
     */
    getProgress() {
        const progress = localStorage.getItem('fitjourney-progress');
        return progress ? JSON.parse(progress) : {
            completedArticles: [],
            completedQuestions: [],
            currentDay: 1,
            totalScore: 0,
            categoryProgress: {}
        };
    }

    /**
     * Save user progress to localStorage
     * @param {Object} progress - Progress object
     */
    saveProgress(progress) {
        localStorage.setItem('fitjourney-progress', JSON.stringify(progress));
    }

    /**
     * Mark article as completed
     * @param {string} articleId - Article ID
     */
    markArticleCompleted(articleId) {
        const progress = this.getProgress();
        if (!progress.completedArticles.includes(articleId)) {
            progress.completedArticles.push(articleId);
            this.saveProgress(progress);
        }
    }

    /**
     * Mark question as completed
     * @param {string} questionId - Question ID
     * @param {boolean} correct - Whether answer was correct
     */
    markQuestionCompleted(questionId, correct) {
        const progress = this.getProgress();
        const existingIndex = progress.completedQuestions.findIndex(q => q.id === questionId);
        
        if (existingIndex >= 0) {
            progress.completedQuestions[existingIndex] = { id: questionId, correct };
        } else {
            progress.completedQuestions.push({ id: questionId, correct });
        }
        
        if (correct) {
            progress.totalScore += 1;
        }
        
        this.saveProgress(progress);
    }

    /**
     * Get overall progress percentage
     * @returns {Promise<number>} - Progress percentage (0-100)
     */
    async getOverallProgress() {
        const allArticles = await this.loadAllArticles();
        const progress = this.getProgress();
        return Math.round((progress.completedArticles.length / allArticles.length) * 100);
    }

    /**
     * Get category progress
     * @param {string} categoryId - Category ID
     * @returns {Promise<Object>} - Category progress object
     */
    async getCategoryProgress(categoryId) {
        const articles = await this.loadArticles(categoryId);
        const progress = this.getProgress();
        
        const completedArticles = articles.filter(article => 
            progress.completedArticles.includes(article.id)
        );
        
        return {
            completed: completedArticles.length,
            total: articles.length,
            percentage: Math.round((completedArticles.length / articles.length) * 100)
        };
    }
}

// Create global instance
window.dataLoader = new DataLoader();
