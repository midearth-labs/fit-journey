<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { contentService } from '$lib/services/content.service';
	import { guestGatingStore } from '$lib/stores/guest-gating';
	import GuestGatingModal from '$lib/components/GuestGatingModal.svelte';
	import type { Article } from '$lib/types/content';
	import { marked } from 'marked';

	interface Props {
		data: {
			session: any;
			user: any;
		};
	}

	const { data }: Props = $props();

	let article = $state<Article | null>(null);
	let renderedBody = $state('');
	let renderedPassages = $state<{ [key: string]: string }>({});
	let showGatingModal = $state(false);
	let isAuthenticated = $state(!!data.session);
	let categoryName = $state<string>('');

	onMount(async () => {
		const articleId = page.params.id;
		if (!articleId) return;
		
		try {
			article = await contentService.getArticleById(articleId);
			if (article) {
				const nonNullArticle = article;
				renderedBody = await renderMarkdown(nonNullArticle.body);
				if (nonNullArticle.passages) {
					for (const passage of nonNullArticle.passages) {
						renderedPassages[passage.id] = await renderMarkdown(passage.passage_text);
					}
				}
				
				// Load categories and find the category name
				
				const categories = await contentService.loadCategories();
				const category = categories.find(cat => cat.id === nonNullArticle.content_category_id);
				categoryName = category?.name || nonNullArticle.content_category_id;
				
				// Track article read for guest gating
				if (!isAuthenticated) {
					guestGatingStore.logArticleRead(articleId);
					
					// Check if we should show the gating modal
					if (guestGatingStore.shouldShowNudge()) {
						showGatingModal = true;
					}
				}
			}
		} catch (error) {
			console.error('Error loading article:', error);
		}
	});


	async function renderMarkdown(content: string): Promise<string> {
		return (await marked.parse(content)).replace(/<h1>.*?<\/h1>/g, '');
	}

	function handleCloseGatingModal() {
		showGatingModal = false;
	}
</script>

{#if article}
	<div class="container">
		<div class="article-header">
			<div class="article-meta">
				<span>Day {article.day}</span>
				<span>•</span>
				<span>{categoryName}</span>
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

<!-- Guest Gating Modal -->
<GuestGatingModal 
	isOpen={showGatingModal} 
	onClose={handleCloseGatingModal} 
/>

