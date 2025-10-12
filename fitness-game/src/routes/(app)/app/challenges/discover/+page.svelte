<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Search, Filter, ArrowLeft, Users } from 'lucide-svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import ChallengeCard from '../components/ChallengeCard.svelte';
	import { isChallengeJoinable } from '../utils/challenge-helpers';

	const publicChallenges = $derived(challengesStore.publicChallenges);
	const loading = $derived(challengesStore.loading);
	const error = $derived(challengesStore.error);

	let page = $state(1);
	let limit = $state(20);
	let searchTerm = $state('');
	let filteredChallenges = $derived.by(() => {
		if (!searchTerm) return publicChallenges;
		return publicChallenges.filter((challenge: any) => 
			challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(challenge.description && challenge.description.toLowerCase().includes(searchTerm.toLowerCase()))
		);
	});

	// Load challenges on mount
	onMount(() => {
		challengesStore.loadPublicChallenges({ page, limit });
	});

	// Handle join challenge
	async function handleJoinChallenge(challengeId: string, shareLogKeys: string[] = [], inviteCode?: string) {
		try {
			await challengesStore.joinChallenge(challengeId, shareLogKeys as any, inviteCode);
			// Navigate to the challenge detail page
			goto(`/app/challenges/${challengeId}`);
		} catch (error) {
			console.error('Failed to join challenge:', error);
		}
	}

	// Handle view challenge
	function handleViewChallenge(challengeId: string) {
		goto(`/app/challenges/${challengeId}`);
	}

	// Load more challenges
	async function loadMore() {
		page += 1;
		await challengesStore.loadPublicChallenges({ page, limit });
	}

	// Refresh challenges
	async function refreshChallenges() {
		page = 1;
		await challengesStore.loadPublicChallenges({ page, limit });
	}
</script>

<svelte:head>
	<title>Discover Challenges - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/app/challenges')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Discover Challenges</h1>
				<p class="text-muted-foreground">
					Join public challenges from the community
				</p>
			</div>
		</div>
		<Button variant="outline" onclick={refreshChallenges}>
			Refresh
		</Button>
	</div>

	<!-- Search and Filters -->
	<Card.Root>
		<Card.Content class="pt-6">
			<div class="flex gap-4">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						bind:value={searchTerm}
						placeholder="Search challenges..."
						class="pl-10"
					/>
				</div>
				<Button variant="outline">
					<Filter class="mr-2 h-4 w-4" />
					Filters
				</Button>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Error State -->
	{#if error}
		<Card.Root class="border-destructive">
			<Card.Header>
				<Card.Title>Error Loading Challenges</Card.Title>
				<Card.Description>{error}</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button onclick={refreshChallenges}>Try Again</Button>
			</Card.Footer>
		</Card.Root>
	{/if}

	<!-- Loading State -->
	{#if loading && publicChallenges.length === 0}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each [1, 2, 3, 4, 5, 6] as _}
				<Card.Root>
					<Card.Header>
						<Skeleton class="h-6 w-3/4" />
						<Skeleton class="h-4 w-full" />
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							<Skeleton class="h-4 w-full" />
							<Skeleton class="h-4 w-2/3" />
							<Skeleton class="h-4 w-1/2" />
						</div>
					</Card.Content>
					<Card.Footer>
						<Skeleton class="h-10 w-full" />
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	{/if}

	<!-- Challenges Grid -->
	{#if !loading || publicChallenges.length > 0}
		{#if filteredChallenges.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredChallenges as challenge}
					<ChallengeCard
						{challenge}
						onJoin={handleJoinChallenge}
						onView={handleViewChallenge}
						isJoined={false}
					/>
				{/each}
			</div>

			<!-- Load More Button -->
			{#if publicChallenges.length >= limit}
				<div class="flex justify-center">
					<Button 
						variant="outline" 
						onclick={loadMore}
						disabled={loading}
					>
						{loading ? 'Loading...' : 'Load More'}
					</Button>
				</div>
			{/if}
		{:else}
			<!-- Empty State -->
			<Card.Root class="text-center py-12">
				<Card.Content>
					<Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 class="text-lg font-semibold mb-2">
						{searchTerm ? 'No Challenges Found' : 'No Public Challenges'}
					</h3>
					<p class="text-muted-foreground mb-6">
						{searchTerm 
							? `No challenges match "${searchTerm}". Try a different search term.`
							: 'There are no public challenges available at the moment. Check back later or create your own challenge!'
						}
					</p>
					{#if searchTerm}
						<Button variant="outline" onclick={() => searchTerm = ''}>
							Clear Search
						</Button>
					{:else}
						<Button onclick={() => goto('/app/challenges/create')}>
							Create Challenge
						</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		{/if}
	{/if}
</div>
