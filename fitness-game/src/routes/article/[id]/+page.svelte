<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import type { Article } from '$lib/types/content';
	import { marked } from 'marked';

	let article: Article | null = null;
	let renderedBody: string = '';
	let renderedPassages: { [key: string]: string } = {};

	onMount(async () => {
		const articleId = $page.params.id;
		if (!articleId) return;
		
		try {
			article = await contentService.getArticleById(articleId);
			if (article) {
				renderedBody = await renderMarkdown(article.body);
				if (article.passages) {
					for (const passage of article.passages) {
						renderedPassages[passage.id] = await renderMarkdown(passage.passage_text);
					}
				}
			}
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

	async function renderMarkdown(content: string): Promise<string> {
		return (await marked.parse(content)).replace(/<h1>.*?<\/h1>/g, '');
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
				{@html renderedBody}
			</div>
			{#if article.passages && article.passages.length > 0}
				<div class="passages-section">
					<h3>Character Stories</h3>
					{#each article.passages as passage}
						<div class="passage-container">
							<h4 class="passage-title">{passage.title}</h4>
							<div class="passage-text">{@html renderedPassages[passage.id]}</div>
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

