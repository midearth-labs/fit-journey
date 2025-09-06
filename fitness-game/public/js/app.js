/**
 * Main Application Controller
 */
class FitJourneyApp {
    constructor() {
        this.currentPage = 'home';
        this.currentArticle = null;
        this.currentQuiz = null;
        this.quizState = {
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
            score: 0
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.setupEventListeners();
        await this.loadHomePage();
        this.updateProgress();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.closest('.nav-link').dataset.page;
                this.showPage(page);
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Start learning button
        document.getElementById('start-learning-btn')?.addEventListener('click', () => {
            this.showPage('categories');
        });

        // Quiz actions
        document.getElementById('start-quiz-btn')?.addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('exit-quiz-btn')?.addEventListener('click', () => {
            this.exitQuiz();
        });

        document.getElementById('next-question-btn')?.addEventListener('click', () => {
            this.nextQuestion();
        });

        document.getElementById('prev-question-btn')?.addEventListener('click', () => {
            this.previousQuestion();
        });

        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Add hover effects to cards
        this.addCardHoverEffects();
    }

    /**
     * Show specific page
     * @param {string} pageName - Page name to show
     */
    showPage(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // Load page-specific content
            this.loadPageContent(pageName);
        }
    }

    /**
     * Load content for specific page
     * @param {string} pageName - Page name
     */
    async loadPageContent(pageName) {
        switch (pageName) {
            case 'home':
                await this.loadHomePage();
                break;
            case 'categories':
                await this.loadCategoriesPage();
                break;
            case 'progress':
                await this.loadProgressPage();
                break;
        }
    }

    /**
     * Load home page content
     */
    async loadHomePage() {
        try {
            // Load phases
            const phases = await dataLoader.getLearningPhases();
            this.renderPhases(phases);

            // Load recent articles
            const allArticles = await dataLoader.loadAllArticles();
            const recentArticles = allArticles.slice(0, 6);
            this.renderRecentArticles(recentArticles);

            // Update overall progress
            const progress = await dataLoader.getOverallProgress();
            this.updateOverallProgress(progress);
        } catch (error) {
            console.error('Error loading home page:', error);
        }
    }

    /**
     * Load categories page
     */
    async loadCategoriesPage() {
        try {
            const categories = await dataLoader.loadCategories();
            this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories page:', error);
        }
    }

    /**
     * Load progress page
     */
    async loadProgressPage() {
        try {
            const progress = dataLoader.getProgress();
            const allArticles = await dataLoader.loadAllArticles();
            const phases = await dataLoader.getLearningPhases();
            
            this.renderProgressOverview(progress, allArticles, phases);
        } catch (error) {
            console.error('Error loading progress page:', error);
        }
    }

    /**
     * Render learning phases
     * @param {Array} phases - Phases array
     */
    renderPhases(phases) {
        const container = document.getElementById('phases-grid');
        if (!container) return;

        container.innerHTML = phases.map(phase => `
            <div class="phase-card fade-in">
                <div class="phase-header">
                    <div class="phase-icon">
                        <i class="fas fa-${this.getPhaseIcon(phase.id)}"></i>
                    </div>
                    <div>
                        <h4 class="phase-title">${phase.name}</h4>
                        <p class="phase-description">${phase.description}</p>
                    </div>
                </div>
                <div class="phase-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${phase.articles.length > 0 ? (phase.articles.filter(a => dataLoader.getProgress().completedArticles.includes(a.id)).length / phase.articles.length) * 100 : 0}%"></div>
                    </div>
                    <div class="progress-text">
                        Days ${phase.dayRange[0]}-${phase.dayRange[1]} • ${phase.articles.length} articles
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render recent articles
     * @param {Array} articles - Articles array
     */
    renderRecentArticles(articles) {
        const container = document.getElementById('recent-articles');
        if (!container) return;

        container.innerHTML = articles.map(article => `
            <div class="article-card fade-in" onclick="app.openArticle('${article.id}')">
                <div class="article-image">
                    <i class="fas fa-${this.getCategoryIcon(article.content_category_id)}"></i>
                </div>
                <div class="article-content">
                    <div class="article-meta">
                        <span>Day ${article.day}</span>
                        <span>•</span>
                        <span>${this.getCategoryName(article.content_category_id)}</span>
                    </div>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${this.getArticleExcerpt(article.body)}</p>
                    <div class="article-tags">
                        ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render categories
     * @param {Array} categories - Categories array
     */
    renderCategories(categories) {
        const container = document.getElementById('categories-grid');
        if (!container) return;

        container.innerHTML = categories.map(category => `
            <div class="category-card fade-in" onclick="app.openCategory('${category.id}')">
                <div class="category-header">
                    <div class="category-icon">
                        <i class="fas fa-${category.icon_name}"></i>
                    </div>
                    <div class="category-info">
                        <h3>${category.name}</h3>
                        <p class="category-description">${category.description}</p>
                        <div class="category-stats">
                            <div class="category-stat">
                                <i class="fas fa-book"></i>
                                <span id="article-count-${category.id}">Loading...</span>
                            </div>
                            <div class="category-stat">
                                <i class="fas fa-question-circle"></i>
                                <span id="question-count-${category.id}">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Load article and question counts for each category
        this.loadCategoryStats(categories);
    }

    /**
     * Load category statistics
     * @param {Array} categories - Categories array
     */
    async loadCategoryStats(categories) {
        for (const category of categories) {
            try {
                const [articles, questions] = await Promise.all([
                    dataLoader.loadArticles(category.id),
                    dataLoader.loadQuestions(category.id)
                ]);

                const articleCountEl = document.getElementById(`article-count-${category.id}`);
                const questionCountEl = document.getElementById(`question-count-${category.id}`);

                if (articleCountEl) articleCountEl.textContent = `${articles.length} articles`;
                if (questionCountEl) questionCountEl.textContent = `${questions.length} questions`;
            } catch (error) {
                console.warn(`Failed to load stats for category ${category.id}:`, error);
            }
        }
    }

    /**
     * Open category page
     * @param {string} categoryId - Category ID
     */
    async openCategory(categoryId) {
        try {
            const [category, articles] = await Promise.all([
                dataLoader.loadCategories().then(cats => cats.find(c => c.id === categoryId)),
                dataLoader.loadArticles(categoryId)
            ]);

            if (!category) return;

            // Update URL
            window.history.pushState({}, '', `#category/${categoryId}`);

            // Show category page
            this.showPage('category');

            // Render category header
            const headerEl = document.getElementById('category-header');
            if (headerEl) {
                headerEl.innerHTML = `
                    <div class="category-header">
                        <div class="category-icon">
                            <i class="fas fa-${category.icon_name}"></i>
                        </div>
                        <div>
                            <h2>${category.name}</h2>
                            <p>${category.description}</p>
                            <div class="learning-objectives">
                                <h4>Learning Objectives:</h4>
                                <ul>
                                    ${category.learning_objectives.map(obj => `<li>${obj}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Render articles
            const articlesEl = document.getElementById('category-articles');
            if (articlesEl) {
                articlesEl.innerHTML = articles.map(article => `
                    <div class="article-card fade-in" onclick="app.openArticle('${article.id}')">
                        <div class="article-image">
                            <i class="fas fa-${category.icon_name}"></i>
                        </div>
                        <div class="article-content">
                            <div class="article-meta">
                                <span>Day ${article.day}</span>
                                <span>•</span>
                                <span>${article.read_time} min read</span>
                            </div>
                            <h3 class="article-title">${article.title}</h3>
                            <p class="article-excerpt">${this.getArticleExcerpt(article.body)}</p>
                            <div class="article-tags">
                                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error opening category:', error);
        }
    }

    /**
     * Open article page
     * @param {string} articleId - Article ID
     */
    async openArticle(articleId) {
        try {
            const article = await dataLoader.getArticleById(articleId);
            if (!article) return;

            this.currentArticle = article;

            // Update URL
            window.history.pushState({}, '', `#article/${articleId}`);

            // Show article page
            this.showPage('article');

            // Render article header
            const headerEl = document.getElementById('article-header');
            if (headerEl) {
                headerEl.innerHTML = `
                    <div class="article-header">
                        <div class="article-meta">
                            <span>Day ${article.day}</span>
                            <span>•</span>
                            <span>${this.getCategoryName(article.content_category_id)}</span>
                            <span>•</span>
                            <span>${article.read_time} min read</span>
                        </div>
                        <h1>${article.title}</h1>
                        <div class="article-tags">
                            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div><img style="max-height: 400px;" src="./${article.lede_image.path}" alt="${article.lede_image.description}" title="${article.lede_image.description}" /></div>
                    </div>
                `;
            }

            // Render article content
            const contentEl = document.getElementById('article-content');
            if (contentEl) {
                contentEl.innerHTML = `
                    <div class="article-body">
                        ${this.renderMarkdown(article.body)}
                    </div>
                    ${article.passages && article.passages.length > 0 ? `
                        <div class="passages-section">
                            <h3>Character Stories</h3>
                            ${article.passages.map(passage => `
                                <div class="passage-container">
                                    <h4 class="passage-title">${passage.title}</h4>
                                    <div class="passage-text">${this.renderMarkdown(passage.passage_text)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${article.key_takeaways && article.key_takeaways.length > 0 ? `
                        <div class="key-takeaways">
                            <h3>Key Takeaways</h3>
                            <ul>
                                ${article.key_takeaways.map(takeaway => `<li>${takeaway}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                `;
            }
        } catch (error) {
            console.error('Error opening article:', error);
        }
    }

    /**
     * Start quiz for current article
     */
    async startQuiz() {
        if (!this.currentArticle) return;

        try {
            const questions = await dataLoader.getQuestionsForArticle(this.currentArticle.id);
            if (questions.length === 0) {
                alert('No questions available for this article.');
                return;
            }

            this.quizState = {
                questions: questions,
                currentQuestionIndex: 0,
                answers: new Array(questions.length).fill(null),
                score: 0
            };

            // Show quiz page
            this.showPage('quiz');

            // Render first question
            this.renderQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
        }
    }

    /**
     * Render current question
     */
    renderQuestion() {
        const question = this.quizState.questions[this.quizState.currentQuestionIndex];
        if (!question) return;

        const container = document.getElementById('question-container');
        if (!container) return;

        const progress = ((this.quizState.currentQuestionIndex + 1) / this.quizState.questions.length) * 100;
        document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
        document.getElementById('quiz-progress-text').textContent = 
            `Question ${this.quizState.currentQuestionIndex + 1} of ${this.quizState.questions.length}`;

        // Render passage if it's a passage-based question
        let passageHtml = '';
        if (question.question_type === 'passage_based' && question.passage_set_id) {
            const article = this.currentArticle;
            const passage = article.passages?.find(p => p.id === question.passage_set_id);
            if (passage) {
                passageHtml = `
                    <div class="passage-container">
                        <h4 class="passage-title">${passage.title}</h4>
                        <div class="passage-text">${this.renderMarkdown(passage.passage_text)}</div>
                    </div>
                `;
            }
        }

        container.innerHTML = `
            ${passageHtml}
            <div class="question-header">
                <span class="question-type">${question.question_type === 'standalone' ? 'Standalone' : 'Passage-based'}</span>
                <h3 class="question-text">${question.question_text}</h3>
            </div>
            <div class="question-options">
                ${question.options.map((option, index) => `
                    <div class="option" data-index="${index}" onclick="app.selectAnswer(${index})">
                        <div class="option-radio"></div>
                        <div class="option-text">${option}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Update navigation buttons
        document.getElementById('prev-question-btn').disabled = this.quizState.currentQuestionIndex === 0;
        document.getElementById('next-question-btn').textContent = 
            this.quizState.currentQuestionIndex === this.quizState.questions.length - 1 ? 'Finish Quiz' : 'Next';
    }

    /**
     * Select answer for current question
     * @param {number} answerIndex - Answer index
     */
    selectAnswer(answerIndex) {
        // Remove previous selection
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add selection to clicked option
        const selectedOption = document.querySelector(`[data-index="${answerIndex}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }

        // Store answer
        this.quizState.answers[this.quizState.currentQuestionIndex] = answerIndex;
    }

    /**
     * Go to next question
     */
    nextQuestion() {
        if (this.quizState.currentQuestionIndex < this.quizState.questions.length - 1) {
            this.quizState.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.finishQuiz();
        }
    }

    /**
     * Go to previous question
     */
    previousQuestion() {
        if (this.quizState.currentQuestionIndex > 0) {
            this.quizState.currentQuestionIndex--;
            this.renderQuestion();
        }
    }

    /**
     * Finish quiz and show results
     */
    finishQuiz() {
        // Calculate score
        let score = 0;
        this.quizState.questions.forEach((question, index) => {
            const userAnswer = this.quizState.answers[index];
            if (userAnswer === question.correct_answer_index) {
                score++;
                dataLoader.markQuestionCompleted(question.id, true);
            } else {
                dataLoader.markQuestionCompleted(question.id, false);
            }
        });

        // Mark article as completed
        if (this.currentArticle) {
            dataLoader.markArticleCompleted(this.currentArticle.id);
        }

        // Show results
        alert(`Quiz completed! You scored ${score}/${this.quizState.questions.length} (${Math.round((score / this.quizState.questions.length) * 100)}%)`);

        // Go back to article
        this.showPage('article');
        this.updateProgress();
    }

    /**
     * Exit quiz
     */
    exitQuiz() {
        if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
            this.showPage('article');
        }
    }

    /**
     * Render progress overview
     * @param {Object} progress - Progress object
     * @param {Array} allArticles - All articles
     * @param {Array} phases - Learning phases
     */
    renderProgressOverview(progress, allArticles, phases) {
        const container = document.getElementById('progress-overview');
        if (!container) return;

        const overallProgress = Math.round((progress.completedArticles.length / allArticles.length) * 100);

        container.innerHTML = `
            <div class="progress-summary">
                <div class="progress-card">
                    <h3>Overall Progress</h3>
                    <div class="progress-circle">
                        <div class="progress-fill" style="width: ${overallProgress}%"></div>
                        <span class="progress-text">${overallProgress}%</span>
                    </div>
                    <p>${progress.completedArticles.length} of ${allArticles.length} articles completed</p>
                </div>
                <div class="progress-card">
                    <h3>Quiz Score</h3>
                    <div class="score-display">
                        <span class="score-number">${progress.totalScore}</span>
                        <span class="score-label">correct answers</span>
                    </div>
                </div>
            </div>
            <div class="phases-progress">
                <h3>Phase Progress</h3>
                ${phases.map(phase => {
                    const phaseArticles = allArticles.filter(a => a.day >= phase.dayRange[0] && a.day <= phase.dayRange[1]);
                    const completedPhaseArticles = phaseArticles.filter(a => progress.completedArticles.includes(a.id));
                    const phaseProgress = Math.round((completedPhaseArticles.length / phaseArticles.length) * 100);
                    
                    return `
                        <div class="phase-progress-card">
                            <div class="phase-info">
                                <h4>${phase.name}</h4>
                                <p>${phase.description}</p>
                            </div>
                            <div class="phase-progress-bar">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${phaseProgress}%"></div>
                                </div>
                                <span class="progress-text">${completedPhaseArticles.length}/${phaseArticles.length} articles</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Update overall progress
     * @param {number} progress - Progress percentage
     */
    updateOverallProgress(progress) {
        const progressCircle = document.getElementById('progress-circle');
        const progressText = document.getElementById('progress-percentage');
        const completedDays = document.getElementById('completed-days');
        
        if (progressCircle) {
            const circumference = 2 * Math.PI * 120; // radius = 120
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDashoffset = offset;
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
        
        if (completedDays) {
            completedDays.textContent = Math.round((progress / 100) * 70);
        }
    }

    /**
     * Update progress throughout the app
     */
    async updateProgress() {
        const progress = await dataLoader.getOverallProgress();
        this.updateOverallProgress(progress);
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fitjourney-theme', newTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('#theme-toggle i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * Add card hover effects
     */
    addCardHoverEffects() {
        // Add intersection observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe all cards
        document.querySelectorAll('.phase-card, .category-card, .article-card').forEach(card => {
            observer.observe(card);
        });
    }

    /**
     * Add particle effects to hero section
     */
    addParticleEffects() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: var(--primary-color);
                border-radius: 50%;
                opacity: 0.3;
                animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            heroSection.appendChild(particle);
        }
    }

    /**
     * Render markdown content (basic implementation)
     * @param {string} markdown - Markdown content
     * @returns {string} - HTML content
     */
    renderMarkdown(content) {
        const parsed = marked.parse(content, {gfm: true, breaks: true});
        return parsed.replace(/<h1>.*?<\/h1>/g, '');
    }

    /**
     * Get article excerpt
     * @param {string} body - Article body
     * @returns {string} - Excerpt
     */
    getArticleExcerpt(body) {
        const plainText = body.replace(/[#*`]/g, '').replace(/\n/g, ' ');
        return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
    }

    /**
     * Get category name by ID
     * @param {string} categoryId - Category ID
     * @returns {string} - Category name
     */
    getCategoryName(categoryId) {
        const categoryMap = {
            'fitness-foundation': 'Fitness Foundation',
            'exercise-fundamentals': 'Exercise Fundamentals',
            'equipment-gym-basics': 'Equipment & Gym Basics',
            'nutrition-essentials': 'Nutrition Essentials',
            'exercise-types-goals': 'Exercise Types & Goals',
            'body-mechanics': 'Body Mechanics',
            'recovery-injury-prevention': 'Recovery & Injury Prevention',
            'mindset-motivation': 'Mindset & Motivation',
            'health-lifestyle': 'Health & Lifestyle'
        };
        return categoryMap[categoryId] || categoryId;
    }

    /**
     * Get category icon by ID
     * @param {string} categoryId - Category ID
     * @returns {string} - Icon name
     */
    getCategoryIcon(categoryId) {
        const iconMap = {
            'fitness-foundation': 'flag-checkered',
            'exercise-fundamentals': 'target',
            'equipment-gym-basics': 'dumbbell',
            'nutrition-essentials': 'apple',
            'exercise-types-goals': 'bullseye',
            'body-mechanics': 'body',
            'recovery-injury-prevention': 'shield',
            'mindset-motivation': 'brain',
            'health-lifestyle': 'heart'
        };
        return iconMap[categoryId] || 'book';
    }

    /**
     * Get phase icon by ID
     * @param {string} phaseId - Phase ID
     * @returns {string} - Icon name
     */
    getPhaseIcon(phaseId) {
        const iconMap = {
            'phase-1': 'seedling',
            'phase-2': 'book-open',
            'phase-3': 'graduation-cap',
            'phase-4': 'tools',
            'phase-5': 'puzzle-piece',
            'phase-6': 'trophy'
        };
        return iconMap[phaseId] || 'book';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FitJourneyApp();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('fitjourney-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash.startsWith('#category/')) {
            const categoryId = hash.split('/')[1];
            app.openCategory(categoryId);
        } else if (hash.startsWith('#article/')) {
            const articleId = hash.split('/')[1];
            app.openArticle(articleId);
        } else {
            app.showPage('home');
        }
    });
});

// Global functions for onclick handlers
window.showPage = (pageName) => window.app.showPage(pageName);
