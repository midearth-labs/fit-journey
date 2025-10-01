<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import type { Category, Article } from '$lib/types/content';

	let category: Category | null = null;
	let articles: Article[] = [];

	onMount(async () => {
		const categoryId = $page.params.id;
		if (!categoryId) return;
		
		try {
			const [categories, categoryArticles] = await Promise.all([
				contentService.loadCategories(),
				contentService.loadArticles(categoryId)
			]);
			
			category = categories.find(c => c.id === categoryId) || null;
			articles = categoryArticles;
		} catch (error) {
			console.error('Error loading category:', error);
		}
	});

	function getArticleExcerpt(body: string): string {
		const plainText = body.replace(/[#*`]/g, '').replace(/\n/g, ' ');
		return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
	}
</script>

<div class="container">
	<div class="page-header">
		<button class="btn btn-outline back-btn" onclick={() => goto('/categories')}>
			<i class="fas fa-arrow-left"></i> Back to Categories
		</button>
		{#if category}
			<div class="category-header">
				<div class="category-icon">
					<i class="fas fa-{category.icon_name}"></i>
				</div>
				<div>
					<h2>{category.name}</h2>
					<p>{category.description}</p>
					<div class="learning-objectives">
						<h4>Learning Objectives:</h4>
						<ul>
							{#each category.learning_objectives as objective}
								<li>{objective}</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>
	<div class="articles-list">
		{#each articles as article}
			<button class="article-card fade-in" onclick={() => goto(`/article/${article.id}`)} aria-label="Read article: {article.title}">
				<div class="article-image">
					<i class="fas fa-{category?.icon_name || 'book'}"></i>
				</div>
				<div class="article-content">
					<div class="article-meta">
						<span>Day {article.day}</span>
						<span>•</span>
						<span>{article.read_time} min read</span>
					</div>
					<h3 class="article-title">{article.title}</h3>
					<p class="article-excerpt">{getArticleExcerpt(article.key_takeaways.join(' '))}</p>
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

