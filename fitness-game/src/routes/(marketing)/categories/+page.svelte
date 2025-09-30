<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import type { Category } from '$lib/types/content';

	let categories: Category[] = [];
	let categoryStats: Record<string, { articles: number; questions: number }> = {};

	onMount(async () => {
		try {
			categories = await contentService.loadCategories();
			
			// Load stats for each category
			for (const category of categories) {
				try {
					const [articles, questions] = await Promise.all([
						contentService.loadArticles(category.id),
						contentService.loadQuestions(category.id)
					]);
					categoryStats[category.id] = {
						articles: articles.length,
						questions: questions.length
					};
				} catch (error) {
					console.warn(`Failed to load stats for category ${category.id}:`, error);
					categoryStats[category.id] = { articles: 0, questions: 0 };
				}
			}
		} catch (error) {
			console.error('Error loading categories:', error);
		}
	});
</script>

<div class="container">
	<div class="page-header">
		<h2>Learning Categories</h2>
		<p>Choose a category to explore articles and start your learning journey</p>
	</div>
	<div class="categories-grid">
		{#each categories as category}
			<button class="category-card fade-in" onclick={() => goto(`/category/${category.id}`)} aria-label="View category: {category.name}">
				<div class="category-header">
					<div class="category-icon">
						<i class="fas fa-{category.icon_name}"></i>
					</div>
					<div class="category-info">
						<h3>{category.name}</h3>
						<p class="category-description">{category.description}</p>
						<div class="category-stats">
							<div class="category-stat">
								<i class="fas fa-book"></i>
								<span>{categoryStats[category.id]?.articles || 0} articles</span>
							</div>
							<div class="category-stat">
								<i class="fas fa-question-circle"></i>
								<span>{categoryStats[category.id]?.questions || 0} questions</span>
							</div>
						</div>
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>

