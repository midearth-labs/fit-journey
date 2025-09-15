<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import type { Article } from '$lib/types/content';

	let article: Article | null = null;

	onMount(async () => {
		const articleId = $page.params.id;
		if (!articleId) return;
		
		try {
			article = await contentService.getArticleById(articleId);
		} catch (error) {
			console.error('Error loading article:', error);
		}
	});

	function getCategoryName(categoryId: string): string {
		// @TODO: THIS SHOULD BE AUTOMATICALLY GENERATED FROM THE CATEGORIES
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

	function renderMarkdown(content: string): string {
		// Simple markdown rendering - in a real app you'd use a proper markdown parser
		return content
			.replace(/^### (.*$)/gim, '<h3>$1</h3>')
			.replace(/^## (.*$)/gim, '<h2>$1</h2>')
			.replace(/^# (.*$)/gim, '<h1>$1</h1>')
			.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
			.replace(/\*(.*)\*/gim, '<em>$1</em>')
			.replace(/\n/gim, '<br>');
	}
</script>

{#if article}
	<div class="container">
		<div class="article-header">
			<div class="article-meta">
				<span>Day {article.day}</span>
				<span>•</span>
				<span>{getCategoryName(article.content_category_id)}</span>
				<span>•</span>
				<span>{article.read_time} min read</span>
			</div>
			<h1>{article.title}</h1>
			<div class="article-tags">
				{#each article.tags as tag}
					<span class="tag">{tag}</span>
				{/each}
			</div>
			<div><img style="max-height: 400px;" src="{article?.lede_image.path}" alt="{article?.lede_image.description}" title="{article?.lede_image.description}" /></div>
		</div>
		<div class="article-content">
			<div class="article-body">
				{@html renderMarkdown(article.body)}
			</div>
			{#if article.passages && article.passages.length > 0}
				<div class="passages-section">
					<h3>Character Stories</h3>
					{#each article.passages as passage}
						<div class="passage-container">
							<h4 class="passage-title">{passage.title}</h4>
							<div class="passage-text">{@html renderMarkdown(passage.passage_text)}</div>
						</div>
					{/each}
				</div>
			{/if}
			{#if article.key_takeaways && article.key_takeaways.length > 0}
				<div class="key-takeaways">
					<h3>Key Takeaways</h3>
					<ul>
						{#each article.key_takeaways as takeaway}
							<li>{takeaway}</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
		<div class="article-actions">
			<button class="btn btn-primary" onclick={() => goto(`/article/${article?.id}/quiz`)}>Take Quiz</button>
			<button class="btn btn-outline" onclick={() => goto('/categories')}>Back to Categories</button>
		</div>
	</div>
{:else}
	<div class="container">
		<div class="loading">
			<p>Loading article...</p>
		</div>
	</div>
{/if}

