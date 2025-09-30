<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import type { Article } from '$lib/types/content';

	let recentArticles: Article[] = $state([]);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			// Load recent articles for guest browsing
			const allArticles = await contentService.loadAllArticles();
			recentArticles = allArticles.slice(0, 6);
			isLoading = false;
		} catch (error) {
			console.error('Error loading home page:', error);
			isLoading = false;
		}
	});

	function getCategoryIcon(categoryId: string): string {
		const iconMap: Record<string, string> = {
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

	function getCategoryName(categoryId: string): string {
		const nameMap: Record<string, string> = {
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
		return nameMap[categoryId] || categoryId;
	}

	function getArticleExcerpt(body: string): string {
		const plainText = body.replace(/[#*`]/g, '').replace(/\n/g, ' ');
		return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
	}

	function startPersonaTest() {
		goto('/persona-assessment');
	}

	function browseArticles() {
		goto('/categories');
	}
</script>

<svelte:head>
	<title>FitJourney - Discover Your Perfect Fitness Path</title>
	<meta name="description" content="Take our 60-second fitness assessment to discover your personalized learning path and transform your fitness journey." />
</svelte:head>

<div class="hero-section">
	<div class="hero-background">
		<div class="floating-elements">
			<div class="floating-element element-1">💪</div>
			<div class="floating-element element-2">🏃‍♀️</div>
			<div class="floating-element element-3">🥗</div>
			<div class="floating-element element-4">🧘‍♀️</div>
			<div class="floating-element element-5">🏋️‍♂️</div>
		</div>
	</div>
	<div class="container">
		<div class="hero-content">
			<div class="hero-badge">
				<i class="fas fa-brain"></i>
				<span>Personalized Fitness Assessment</span>
			</div>
			<h1 class="hero-title">
				Discover Your Perfect
				<span class="gradient-text">Fitness Path</span>
			</h1>
			<p class="hero-description">
				Take our 60-second fitness assessment to get your personalized learning plan. 
				No overwhelming choices, just the right path for you.
			</p>
			<div class="hero-stats">
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-clock"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">60</span>
						<span class="stat-label">Seconds</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-user-check"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">100%</span>
						<span class="stat-label">Personalized</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-rocket"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">70</span>
						<span class="stat-label">Day Plan</span>
					</div>
				</div>
			</div>
			<div class="hero-actions">
				<button class="btn btn-primary btn-lg" onclick={startPersonaTest}>
					<i class="fas fa-brain"></i>
					Take Your 60-Second Fitness IQ Test
				</button>
				<button class="btn btn-outline btn-lg" onclick={browseArticles}>
					<i class="fas fa-book"></i>
					Browse Articles (Guest)
				</button>
			</div>
		</div>
		<div class="hero-visual">
			<div class="test-preview-container">
				<div class="test-preview">
					<div class="test-icon">
						<i class="fas fa-brain"></i>
					</div>
					<div class="test-content">
						<h3>Quick & Easy</h3>
						<p>Answer a few questions about your fitness goals and preferences</p>
					</div>
				</div>
				<div class="arrow-down">
					<i class="fas fa-arrow-down"></i>
				</div>
				<div class="result-preview">
					<div class="result-icon">
						<i class="fas fa-chart-line"></i>
					</div>
					<div class="result-content">
						<h3>Personalized Plan</h3>
						<p>Get your custom 70-day fitness journey tailored just for you</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- How It Works -->
<section class="how-it-works-section">
	<div class="container">
		<div class="section-title">
			<h2>How It Works</h2>
			<p>Get your personalized fitness journey in just three simple steps</p>
		</div>
		<div class="steps-grid">
			<div class="step-card fade-in">
				<div class="step-number">1</div>
				<div class="step-content">
					<h3>Take the Test</h3>
					<p>Answer 10 quick questions about your fitness goals, experience, and preferences</p>
				</div>
			</div>
			<div class="step-card fade-in">
				<div class="step-number">2</div>
				<div class="step-content">
					<h3>Get Your Profile</h3>
					<p>Discover your fitness persona and recommended learning path</p>
				</div>
			</div>
			<div class="step-card fade-in">
				<div class="step-number">3</div>
				<div class="step-content">
					<h3>Start Your Journey</h3>
					<p>Unlock your personalized 70-day fitness plan and begin your transformation</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Guest Articles Preview -->
<section class="articles-preview-section">
	<div class="container">
		<div class="section-title">
			<h2>Sample Our Content</h2>
			<p>Browse a few articles to see what you'll learn</p>
		</div>
		{#if isLoading}
			<div class="loading">
				<p>Loading articles...</p>
			</div>
		{:else}
			<div class="articles-grid">
				{#each recentArticles as article}
					<button class="article-card fade-in" onclick={() => goto(`/article/${article.id}`)} aria-label="Read article: {article.title}">
						<div class="article-image">
							<i class="fas fa-{getCategoryIcon(article.content_category_id)}"></i>
						</div>
						<div class="article-content">
							<div class="article-meta">
								<span>Day {article.day}</span>
								<span>•</span>
								<span>{getCategoryName(article.content_category_id)}</span>
							</div>
							<h3 class="article-title">{article.title}</h3>
							<p class="article-excerpt">{getArticleExcerpt(article.body)}</p>
							<div class="article-tags">
								{#each article.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
		<div class="articles-cta">
			<p>Want to see more? Take the test to unlock your personalized learning path!</p>
			<button class="btn btn-primary" onclick={startPersonaTest}>
				<i class="fas fa-brain"></i>
				Take the Test Now
			</button>
		</div>
	</div>
</section>

<!-- Trust Signals -->
<section class="trust-section">
	<div class="container">
		<div class="section-title">
			<h2>Why Choose FitJourney?</h2>
			<p>Join thousands of beginners who've transformed their fitness journey</p>
		</div>
		<div class="trust-grid">
			<div class="trust-card fade-in">
				<div class="trust-icon">
					<i class="fas fa-shield-alt"></i>
				</div>
				<h3>No Judgment Zone</h3>
				<p>Start wherever you are. We meet you at your current fitness level.</p>
			</div>
			<div class="trust-card fade-in">
				<div class="trust-icon">
					<i class="fas fa-user-friends"></i>
				</div>
				<h3>Community Support</h3>
				<p>Join thousands of beginners on their fitness journey.</p>
			</div>
			<div class="trust-card fade-in">
				<div class="trust-icon">
					<i class="fas fa-graduation-cap"></i>
				</div>
				<h3>Expert-Backed</h3>
				<p>Content created by fitness professionals and reviewed by experts.</p>
			</div>
		</div>
	</div>
</section>

<style>
	/* Hero Visual - Test Preview */
	.test-preview-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-8);
	}

	.test-preview, .result-preview {
		background: var(--bg-card);
		padding: var(--space-8);
		border-radius: var(--radius-2xl);
		text-align: center;
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--gray-200);
		min-width: 280px;
		position: relative;
		overflow: hidden;
		transition: all var(--transition-normal);
	}

	.test-preview::before, .result-preview::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
	}

	.test-preview:hover, .result-preview:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-xl);
	}

	.test-icon, .result-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		border-radius: var(--radius-xl);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-inverse);
		font-size: 1.5rem;
		margin: 0 auto var(--space-4) auto;
		box-shadow: var(--shadow-md);
	}

	.test-content h3, .result-content h3 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-3);
		color: var(--text-primary);
	}

	.test-content p, .result-content p {
		color: var(--text-secondary);
		line-height: 1.6;
		font-size: 0.95rem;
	}

	.arrow-down {
		font-size: 2rem;
		color: var(--primary-color);
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-10px); }
		60% { transform: translateY(-5px); }
	}

	/* How It Works Section */
	.how-it-works-section {
		padding: var(--space-20) 0;
		background: var(--bg-secondary);
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-8);
	}

	.step-card {
		background: var(--bg-card);
		padding: var(--space-8);
		border-radius: var(--radius-2xl);
		text-align: center;
		box-shadow: var(--shadow-md);
		border: 1px solid var(--gray-200);
		position: relative;
		overflow: hidden;
		transition: all var(--transition-normal);
	}

	.step-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
	}

	.step-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-xl);
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		color: var(--text-inverse);
		border-radius: var(--radius-full);
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-4);
		box-shadow: var(--shadow-md);
	}

	.step-content h3 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-3);
		color: var(--text-primary);
	}

	.step-content p {
		color: var(--text-secondary);
		line-height: 1.6;
		font-size: 0.95rem;
	}

	/* Articles Preview Section */
	.articles-preview-section {
		padding: var(--space-20) 0;
		background: var(--bg-primary);
	}

	.articles-cta {
		text-align: center;
		background: linear-gradient(135deg, rgba(88, 204, 2, 0.05), rgba(28, 176, 246, 0.05));
		padding: var(--space-8);
		border-radius: var(--radius-2xl);
		border: 2px dashed var(--primary-color);
		margin-top: var(--space-8);
	}

	.articles-cta p {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: var(--space-4);
		font-weight: 500;
	}

	/* Trust Section */
	.trust-section {
		padding: var(--space-20) 0;
		background: var(--bg-secondary);
	}

	.trust-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-8);
	}

	.trust-card {
		background: var(--bg-card);
		padding: var(--space-8);
		border-radius: var(--radius-2xl);
		text-align: center;
		box-shadow: var(--shadow-md);
		border: 1px solid var(--gray-200);
		position: relative;
		overflow: hidden;
		transition: all var(--transition-normal);
	}

	.trust-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
	}

	.trust-card:hover {
		transform: translateY(-8px);
		box-shadow: var(--shadow-xl);
	}

	.trust-icon {
		width: 64px;
		height: 64px;
		background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
		border-radius: var(--radius-xl);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-inverse);
		font-size: 1.5rem;
		margin: 0 auto var(--space-4) auto;
		box-shadow: var(--shadow-md);
	}

	.trust-card h3 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: var(--space-3);
		color: var(--text-primary);
	}

	.trust-card p {
		color: var(--text-secondary);
		line-height: 1.6;
		font-size: 0.95rem;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.hero-section .container {
			grid-template-columns: 1fr;
			gap: var(--space-12);
			text-align: center;
		}
		
		.hero-stats {
			grid-template-columns: repeat(3, 1fr);
			gap: var(--space-4);
		}
		
		.steps-grid {
			grid-template-columns: 1fr;
		}
		
		.trust-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.hero-stats {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}
		
		.hero-actions {
			flex-direction: column;
			align-items: center;
		}
		
		.btn {
			width: 100%;
			justify-content: center;
		}
		
		.test-preview, .result-preview {
			min-width: auto;
			width: 100%;
		}
		
		.articles-grid {
			grid-template-columns: 1fr;
		}
	}
</style>