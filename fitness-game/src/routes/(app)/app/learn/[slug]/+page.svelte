<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { contentService } from '$lib/services/content.service';
  import ApiClient from '$lib/client/api-client';
  import { DynamicIcons } from '../../dynamic-icons';
  import { marked } from 'marked';
  
  // ShadCN components
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Separator } from '$lib/components/ui/separator';
  
  import type { ArticleDetail } from '$lib/types/content';
  import type { ApiResponse } from '$lib/client/api-client';

  const apiClient = new ApiClient('');

  let loading = $state(true);
  let error: string | null = $state(null);
  let article: ArticleDetail | null = $state(null);
  let userArticleProgress: ApiResponse['getUserArticle'] | null = $state(null);
  let articleStats: ApiResponse['getArticleStatistics'] | null = $state(null);
  let categoryName = $state<string>('');
  let renderedBody = $state('');
  let renderedPassages = $state<{ [key: string]: string }>({});
  let hasStartedReading = $state(false);

  // Extract UUID from slug (first 36 characters)
  function extractArticleId(slug: string): string {
    return slug.substring(0, 36);
  }

  async function renderMarkdown(content: string): Promise<string> {
    return (await marked.parse(content)).replace(/<h1>.*?<\/h1>/g, '');
  }

  async function startReading() {
    if (!article) return;
    
    try {
      await apiClient.logRead(article.id);
      hasStartedReading = true;
      
      // Reload user article progress
      await loadUserArticleProgress();
    } catch (err: any) {
      console.error('Failed to log read:', err);
      error = err?.message || 'Failed to start reading';
    }
  }

  async function loadUserArticleProgress() {
    if (!article) return;
    
    try {
      userArticleProgress = await apiClient.getUserArticle(article.id);
    } catch (err: any) {
      // Ignore 404 errors - user hasn't started this article yet
      if (err?.status !== 404) {
        console.error('Failed to load user article progress:', err);
      }
      userArticleProgress = null;
    }
  }

  async function loadArticleStats() {
    if (!article) return;
    
    try {
      articleStats = await apiClient.getArticleStatistics(article.id);
    } catch (err: any) {
      console.error('Failed to load article statistics:', err);
      articleStats = null;
    }
  }

  function getIconComponent(iconName: string) {
    const key = iconName as keyof typeof DynamicIcons;
    return DynamicIcons[key] ?? null;
  }

  async function loadData() {
    loading = true;
    error = null;
    
    try {
      const slug = page.params.slug;
      if (!slug) {
        error = 'Invalid article slug';
        return;
      }

      const articleId = extractArticleId(slug);
      
      // Load article details
      article = await contentService.getArticleById(articleId);
      if (!article) {
        error = 'Article not found';
        return;
      }
      const validArticle = article;

      // Render markdown content
      renderedBody = await renderMarkdown(validArticle.body);
      for (const passage of validArticle.passages) {
        renderedPassages[passage.id] = await renderMarkdown(passage.passage_text);
      }

      // Load category name
      const categories = await contentService.loadCategories();
      const category = categories.find(cat => cat.id === validArticle.content_category_id);
      categoryName = category?.name || validArticle.content_category_id || '';

      // Load user progress and stats in parallel
      await Promise.all([
        loadUserArticleProgress(),
        loadArticleStats()
      ]);

      // Check if user has started reading
      hasStartedReading = !!userArticleProgress;

    } catch (err: any) {
      console.error('Error loading article:', err);
      error = err?.message || 'Failed to load article';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
  {#if loading}
    <Card.Root>
      <Card.Header>
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </Card.Header>
      <Card.Content>
        <div class="space-y-4">
          <Skeleton class="h-64 w-full" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </Card.Content>
    </Card.Root>
  {:else if error}
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-destructive">Error</Card.Title>
        <Card.Description>{error}</Card.Description>
      </Card.Header>
    </Card.Root>
  {:else if article}
    <Card.Root>
      <Card.Header>
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              {#if getIconComponent(article.icon)}
                {@const Icon = getIconComponent(article.icon)}
                <Icon class="h-5 w-5 text-primary" />
              {/if}
              <Badge variant="outline">Day {article.day}</Badge>
              <Badge variant="secondary">{categoryName}</Badge>
              <Badge variant="outline">{article.read_time} min read</Badge>
            </div>
            
            <Card.Title class="text-2xl mb-4">{article.title}</Card.Title>
            
            <div class="flex flex-wrap gap-2 mb-4">
              {#each article.tags as tag}
                <Badge variant="outline">{tag}</Badge>
              {/each}
            </div>

            {#if article.lede_image}
              <div class="mb-6">
                <img 
                  src={article.lede_image.path} 
                  alt={article.lede_image.description}
                  title={article.lede_image.description}
                  class="w-full max-h-96 object-cover rounded-lg"
                />
              </div>
            {/if}

            {#if article.key_takeaways && article.key_takeaways.length > 0}
              <Card.Root class="mb-6">
                <Card.Header>
                  <Card.Title class="text-lg">Key Takeaways</Card.Title>
                </Card.Header>
                <Card.Content>
                  <ul class="space-y-2">
                    {#each article.key_takeaways as takeaway}
                      <li class="flex items-start gap-2">
                        <span class="text-primary mt-1">•</span>
                        <span>{takeaway}</span>
                      </li>
                    {/each}
                  </ul>
                </Card.Content>
              </Card.Root>
            {/if}

            {#if articleStats}
              <div class="mb-6 p-4 bg-muted rounded-lg">
                <p class="text-sm text-muted-foreground">
                  Join {articleStats.readCount} people who have read this article
                  {#if articleStats.completedCount > 0}
                    • {articleStats.completedCount} completed
                  {/if}
                </p>
              </div>
            {/if}
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        {#if !hasStartedReading}
          <div class="text-center py-8">
            <h3 class="text-lg font-semibold mb-4">Ready to start reading?</h3>
            <p class="text-muted-foreground mb-6">
              Click the button below to begin your learning journey with this article.
            </p>
            <Button size="lg" onclick={startReading}>
              Start Reading
            </Button>
          </div>
        {:else}
          <div class="prose prose-slate max-w-none">
            <div class="article-body">
              {@html renderedBody}
            </div>
          </div>

          {#if article.passages && article.passages.length > 0}
            <Separator class="my-8" />
            <div class="passages-section">
              <h3 class="text-xl font-semibold mb-4">Character Stories</h3>
              <div class="space-y-6">
                {#each article.passages as passage}
                  <Card.Root>
                    <Card.Header>
                      <Card.Title class="text-lg">{passage.title}</Card.Title>
                    </Card.Header>
                    <Card.Content>
                      <div class="prose prose-slate max-w-none">
                        {@html renderedPassages[passage.id]}
                      </div>
                    </Card.Content>
                  </Card.Root>
                {/each}
              </div>
            </div>
          {/if}

          {#if userArticleProgress}
            <Separator class="my-8" />
            <div class="flex gap-4">
              <Button variant="outline" onclick={() => window.history.back()}>
                Back to Articles
              </Button>
              {#if userArticleProgress.status === 'reading_in_progress'}
                <Button onclick={() => window.location.href = `${window.location.href}/knowledge-check`}>
                  Knowledge Check
                </Button>
              {/if}
            </div>
          {/if}
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>

