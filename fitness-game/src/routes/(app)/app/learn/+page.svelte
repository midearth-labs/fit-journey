<script lang="ts">
  import { onMount } from 'svelte';
  import { contentService } from '$lib/services/content.service';
  import ApiClient, { type ApiResponse } from '$lib/client/api-client';
  import { DynamicIcons } from '../dynamic-icons';
  import type { Article, LearningPath } from '$lib/types/content';

  // shadcn components
  import * as Card from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  const apiClient = new ApiClient('');

  let loading = $state(true);
  let error: string | null = $state(null);

  let allArticles: Article[] = $state([]);
  let learningPaths: LearningPath[] = $state([]);
  let sortedLearningPaths: LearningPath[] = $state([]);
  let selectedLearningPathId: string | null = $state(null);

  // user data
  let userProfile: ApiResponse['getMyProfile'] | null = $state(null);
  let userArticlesProgress: Record<string, ApiResponse['listUserArticles'][number]> = $state({}); // key by articleId

  // pagination
  let page = $state(1);
  let perPage = $state(10);

  let filteredAndSortedArticles = $derived.by(() => {
    if (!selectedLearningPathId) return allArticles;
    const lp = sortedLearningPaths.find((p) => p.id === selectedLearningPathId);
    if (!lp || !Array.isArray(lp.articles)) return allArticles;

    const orderIndex = new Map<string, number>();
    lp.articles.forEach((article, idx) => article?.id && orderIndex.set(article.id, idx));

    // Sort: first those in LP order, then others in original order
    return [...allArticles].sort((a, b) => {
      const ai = orderIndex.has(a.id) ? orderIndex.get(a.id)! : Number.POSITIVE_INFINITY;
      const bi = orderIndex.has(b.id) ? orderIndex.get(b.id)! : Number.POSITIVE_INFINITY;
      if (ai !== bi) return ai - bi;
      return 0;
    });
  });

  function totalPages(): number {
    return Math.max(1, Math.ceil(filteredAndSortedArticles.length / perPage));
  }
  function pageItems(): Article[] {
    const start = (page - 1) * perPage;
    const arr = filteredAndSortedArticles;
    return arr.slice(start, start + perPage);
  }

  function setPage(next: number) {
    page = Math.max(1, Math.min(totalPages(), next));
  }

  function setPerPage(n: number) {
    perPage = n;
    setPage(1);
  }

  function slugify(input: string): string {
    return (input || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  function getArticleStatus(articleId: string) {
    const progress = userArticlesProgress[articleId];
    if (!progress) return { status: 'unread' };
    return { status: progress.status ?? 'unread' };
  }

  function getArticleReadDate(articleId: string) {
    const progress = userArticlesProgress[articleId];
    if (!progress) return 'N/A';
    const dateStr = progress.lastReadDate;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

  function getKnowledgeCheck(articleId: string) {
    const p = userArticlesProgress[articleId];
    if (!p) return 'N/A';
    const attempts = p.quizAttempts;
    const score = p.quizAllCorrectAnswers ? 100 : null;
    const completed = p.status === 'completed';
    if (!completed && attempts === 0) return 'N/A';
    if (completed && score === 100) return `Completed with 100% score (${attempts} attempt${attempts === 1 ? '' : 's'})`;
    if (completed) return `Completed (${attempts} attempt${attempts === 1 ? '' : 's'})`;
    return attempts > 0 ? `${p.status} : Attempted (${attempts})` : 'N/A';
  }

  function getIconComponent(iconName: string) {
    const key = iconName as keyof typeof DynamicIcons;
    return DynamicIcons[key] ?? null;
  }

  async function loadData() {
    loading = true;
    error = null;
    try {
      const [articles, paths, profile, userArticles] = await Promise.all([
        contentService.loadAllArticles(),
        contentService.loadLearningPaths(),
        apiClient.getMyProfile(),
        apiClient.listUserArticles({ query: { page: 1, limit: 200 } })
      ]);

      allArticles = articles;
      learningPaths = paths;
      userProfile = profile;

      // normalize user articles into map by articleId
      const progressArray = userArticles;
      const map: Record<string, ApiResponse['listUserArticles'][number]> = {};
      for (const p of progressArray) {
        map[p.articleId] = p;
      }
      userArticlesProgress = map;

      // sort learning paths by user's preferences first
      const userLPs: string[] = Array.isArray(userProfile?.learningPaths) ? userProfile.learningPaths : [];
      if (userLPs.length > 0) {
        const set = new Set(userLPs);
        const preferred = learningPaths.filter((lp) => set.has(lp.id));
        const rest = learningPaths.filter((lp) => !set.has(lp.id));
        sortedLearningPaths = [...preferred, ...rest];
      } else {
        sortedLearningPaths = [...learningPaths];
      }

      // preselect first learning path if any
      if (sortedLearningPaths.length > 0) {
        selectedLearningPathId = sortedLearningPaths[0].id;
      }
    } catch (e: any) {
      error = e?.message ?? 'Failed to load data';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadData();
  });
</script>

<div class="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
  <Card.Root>
    <Card.Header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Card.Title class="text-xl">Learn</Card.Title>
        <Card.Description>Browse articles and track your progress</Card.Description>
      </div>
      <div class="flex items-center gap-3">
        <div class="w-[260px]">
          <label class="sr-only" for="lp">Learning-Paths</label>
          <select id="lp" class="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            bind:value={selectedLearningPathId}
            onchange={() => setPage(1)}
          >
            {#each sortedLearningPaths as lp}
              <option value={lp.id}>{lp.name}</option>
            {/each}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">Items per page</span>
          <select class="h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            bind:value={perPage}
            onchange={(e) => setPerPage(parseInt((e.target as HTMLSelectElement).value))}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
    </Card.Header>

    <Card.Content>
      {#if loading}
        <div class="space-y-3">
          {#each Array.from({ length: 6 }) as _}
            <div class="flex items-center gap-3">
              <Skeleton class="h-5 w-5" />
              <Skeleton class="h-4 w-[40%]" />
              <Skeleton class="h-4 w-[15%] ml-auto" />
            </div>
          {/each}
        </div>
      {:else if error}
        <div class="text-sm text-destructive">{error}</div>
      {:else}
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[48px]">Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Read date</TableHead>
                <TableHead>Knowledge check</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each pageItems() as article (article.id)}
                {@const Icon = getIconComponent(article.icon)}
                <TableRow>
                  <TableCell>
                    {#if Icon}
                      <Icon class="h-5 w-5 text-primary" />
                    {:else}
                      <span class="inline-block h-5 w-5 rounded bg-muted"></span>
                    {/if}
                  </TableCell>
                  <TableCell class="max-w-[420px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <a class="underline-offset-2 hover:underline" href={`/app/learn/${article.id}-${slugify(article.title)}`}>
                            {article.title}
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div class="max-w-[360px] text-sm whitespace-pre-line">
                            {article.key_takeaways.join('\n')}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {#if getArticleStatus(article.id).status === 'unread'}
                      <Badge variant="secondary">unread</Badge>
                    {:else}
                      <Badge variant="default">{getArticleStatus(article.id).status}</Badge>
                    {/if}
                  </TableCell>
                  <TableCell>{getArticleReadDate(article.id)}</TableCell>
                  <TableCell>{getKnowledgeCheck(article.id)}</TableCell>
                  <TableCell>
                    <div class="flex flex-wrap gap-1">
                      {#each article.tags as tag}
                        <Badge variant="outline">{tag}</Badge>
                      {/each}
                    </div>
                  </TableCell>
                </TableRow>
              {/each}
            </TableBody>
          </Table>
        </div>

        <div class="mt-4 flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            Page {page} of {totalPages()} — {filteredAndSortedArticles.length} items
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" aria-label="First" onclick={() => setPage(1)} disabled={page === 1}>&laquo;</Button>
            <Button variant="outline" size="sm" aria-label="Prev" onclick={() => setPage(page - 1)} disabled={page === 1}>Prev</Button>
            <Button variant="outline" size="sm" aria-label="Next" onclick={() => setPage(page + 1)} disabled={page === totalPages()}>Next</Button>
            <Button variant="outline" size="sm" aria-label="Last" onclick={() => setPage(totalPages())} disabled={page === totalPages()}>&raquo;</Button>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>

<style>
</style>


