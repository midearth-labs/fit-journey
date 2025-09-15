<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import { progressStore } from '$lib/stores/progress';
	import type { Article, LearningPhase } from '$lib/types/content';

	let phases: LearningPhase[] = [];
	let recentArticles: Article[] = [];
	let overallProgress = 0;

	onMount(async () => {
		try {
			// Load phases
			phases = await contentService.getLearningPhases();
			
			// Load recent articles
			const allArticles = await contentService.loadAllArticles();
			recentArticles = allArticles.slice(0, 6);
			
			// Calculate overall progress
			progressStore.subscribe(value => {
				overallProgress = Math.round((value.completedArticles.length / allArticles.length) * 100);
			});
		} catch (error) {
			console.error('Error loading home page:', error);
		}
	});

	function getPhaseIcon(phaseId: string): string {
		const iconMap: Record<string, string> = {
			'phase-1': 'seedling',
			'phase-2': 'book-open',
			'phase-3': 'graduation-cap',
			'phase-4': 'tools',
			'phase-5': 'puzzle-piece',
			'phase-6': 'trophy'
		};
		return iconMap[phaseId] || 'book';
	}

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
</script>

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
				<i class="fas fa-star"></i>
				<span>Interactive Learning Platform</span>
			</div>
			<h1 class="hero-title">
				Master Fitness in
				<span class="gradient-text">70 Days</span>
			</h1>
			<p class="hero-description">
				Transform from fitness beginner to confident enthusiast through our engaging, 
				character-driven learning experience. Learn with real stories, not boring textbooks.
			</p>
			<div class="hero-stats">
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-calendar-alt"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">70</span>
						<span class="stat-label">Learning Days</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-layer-group"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">9</span>
						<span class="stat-label">Categories</span>
					</div>
				</div>
				<div class="stat-card">
					<div class="stat-icon">
						<i class="fas fa-question-circle"></i>
					</div>
					<div class="stat-content">
						<span class="stat-number">1000+</span>
						<span class="stat-label">Questions</span>
					</div>
				</div>
			</div>
			<div class="hero-actions">
				<a href="/categories" class="btn btn-primary btn-lg">
					<i class="fas fa-play"></i>
					Start Your Journey
				</a>
				<a href="/progress" class="btn btn-outline btn-lg">
					<i class="fas fa-chart-line"></i>
					View Progress
				</a>
			</div>
		</div>
		<div class="hero-visual">
			<div class="progress-ring-container">
				<div class="progress-ring">
					<svg class="progress-ring-svg" width="280" height="280">
						<circle class="progress-ring-circle-bg" cx="140" cy="140" r="120"></circle>
						<circle class="progress-ring-circle" cx="140" cy="140" r="120" style="stroke-dashoffset: {2 * Math.PI * 120 * (1 - overallProgress / 100)}"></circle>
					</svg>
					<div class="progress-content">
						<div class="progress-percentage">{overallProgress}%</div>
						<div class="progress-label">Complete</div>
						<div class="progress-days">
							<span>{Math.round((overallProgress / 100) * 70)}</span> of 70 days
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Learning Phases -->
<section class="phases-section">
	<div class="container">
		<h3>Your Learning Journey</h3>
		<div class="phases-grid">
			{#each phases as phase}
				<div class="phase-card fade-in">
					<div class="phase-header">
						<div class="phase-icon">
							<i class="fas fa-{getPhaseIcon(phase.id)}"></i>
						</div>
						<div>
							<h4 class="phase-title">{phase.name}</h4>
							<p class="phase-description">{phase.description}</p>
						</div>
					</div>
					<div class="phase-progress">
						<div class="progress-bar">
							<div class="progress-fill" style="width: {phase.articles.length > 0 ? (phase.articles.filter(a => $progressStore.completedArticles.includes(a.id)).length / phase.articles.length) * 100 : 0}%"></div>
						</div>
						<div class="progress-text">
							Days {phase.dayRange[0]}-{phase.dayRange[1]} • {phase.articles.length} articles
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Recent Articles -->
<section class="recent-section">
	<div class="container">
		<h3>Continue Learning</h3>
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
	</div>
</section>
