<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { ArrowLeft, Plus, Settings, Trash2, Users, Edit } from 'lucide-svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import ChallengeCard from '../components/ChallengeCard.svelte';
	import { canEditChallenge } from '../utils/challenge-helpers';

	const ownedChallenges = $derived(challengesStore.ownedChallenges);
	const joinedChallenges = $derived(challengesStore.joinedChallenges);
	const loading = $derived(challengesStore.loading);
	const error = $derived(challengesStore.error);

	let activeTab = $state('joined');
	let ownedPage = $state(1);
	let joinedPage = $state(1);
	let limit = $state(20);

	// Load challenges on mount
	onMount(() => {
		Promise.all([
			challengesStore.loadOwnedChallenges({ page: ownedPage, limit }),
			challengesStore.loadJoinedChallenges({ page: joinedPage, limit })
		]);
	});

	// Handle view challenge
	function handleViewChallenge(challengeId: string) {
		goto(`/app/challenges/${challengeId}`);
	}

	// Handle edit challenge
	function handleEditChallenge(challengeId: string) {
		goto(`/app/challenges/${challengeId}?edit=true`);
	}

	// Handle delete challenge
	async function handleDeleteChallenge(challengeId: string) {
		if (confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
			try {
				await challengesStore.deleteChallenge(challengeId);
			} catch (error) {
				console.error('Failed to delete challenge:', error);
			}
		}
	}

	// Handle leave challenge
	async function handleLeaveChallenge(challengeId: string) {
		if (confirm('Are you sure you want to leave this challenge?')) {
			try {
				await challengesStore.leaveChallenge(challengeId);
			} catch (error) {
				console.error('Failed to leave challenge:', error);
			}
		}
	}

	// Load more for owned challenges
	async function loadMoreOwned() {
		ownedPage += 1;
		await challengesStore.loadOwnedChallenges({ page: ownedPage, limit });
	}

	// Load more for joined challenges
	async function loadMoreJoined() {
		joinedPage += 1;
		await challengesStore.loadJoinedChallenges({ page: joinedPage, limit });
	}

	// Refresh challenges
	async function refreshChallenges() {
		ownedPage = 1;
		joinedPage = 1;
		await Promise.all([
			challengesStore.loadOwnedChallenges({ page: ownedPage, limit }),
			challengesStore.loadJoinedChallenges({ page: joinedPage, limit })
		]);
	}
</script>

<svelte:head>
	<title>My Challenges - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/app/challenges')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">My Challenges</h1>
				<p class="text-muted-foreground">
					Manage your created and joined challenges
				</p>
			</div>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={refreshChallenges}>
				Refresh
			</Button>
			<Button onclick={() => goto('/app/challenges/create')}>
				<Plus class="mr-2 h-4 w-4" />
				Create Challenge
			</Button>
		</div>
	</div>

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

	<!-- Tabs -->
	<Tabs.Root bind:value={activeTab} class="w-full">
		<Tabs.List class="grid w-full grid-cols-2">
			<Tabs.Trigger value="joined">
				Joined Challenges
				<Badge variant="secondary" class="ml-2">
					{joinedChallenges.length}
				</Badge>
			</Tabs.Trigger>
			<Tabs.Trigger value="owned">
				Created by Me
				<Badge variant="secondary" class="ml-2">
					{ownedChallenges.length}
				</Badge>
			</Tabs.Trigger>
		</Tabs.List>

		<!-- Joined Challenges Tab -->
		<Tabs.Content value="joined" class="mt-6">
			{#if loading && joinedChallenges.length === 0}
				<!-- Loading State -->
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
			{:else if joinedChallenges.length > 0}
				<!-- Joined Challenges Grid -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each joinedChallenges as challenge}
						<Card.Root class="hover:shadow-lg transition-shadow">
							<Card.Header>
								<div class="flex items-start justify-between">
									<Card.Title class="text-lg">{challenge.name}</Card.Title>
									<div class="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleViewChallenge(challenge.id)}
										>
											<Settings class="h-4 w-4" />
										</Button>
									</div>
								</div>
								<Card.Description>
									Joined {new Date(challenge.joinedAt).toLocaleDateString()}
								</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="space-y-2">
									<div class="flex items-center gap-2 text-sm">
										<Users class="h-4 w-4" />
										<span>{challenge.membersCount} members</span>
									</div>
									<div class="flex flex-wrap gap-1">
										{#each challenge.logTypes.slice(0, 3) as logType}
											<Badge variant="outline" class="text-xs">
												{logType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
											</Badge>
										{/each}
									</div>
								</div>
							</Card.Content>
							<Card.Footer class="flex gap-2">
								<Button 
									class="flex-1"
									onclick={() => handleViewChallenge(challenge.id)}
								>
									View Details
								</Button>
								<Button 
									variant="outline"
									onclick={() => handleLeaveChallenge(challenge.id)}
								>
									Leave
								</Button>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>

				<!-- Load More for Joined -->
				{#if joinedChallenges.length >= limit}
					<div class="flex justify-center mt-6">
						<Button 
							variant="outline" 
							onclick={loadMoreJoined}
							disabled={loading}
						>
							{loading ? 'Loading...' : 'Load More'}
						</Button>
					</div>
				{/if}
			{:else}
				<!-- Empty State for Joined -->
				<Card.Root class="text-center py-12">
					<Card.Content>
						<Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 class="text-lg font-semibold mb-2">No Joined Challenges</h3>
						<p class="text-muted-foreground mb-6">
							You haven't joined any challenges yet. Discover public challenges to get started!
						</p>
						<Button onclick={() => goto('/app/challenges/discover')}>
							Discover Challenges
						</Button>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>

		<!-- Owned Challenges Tab -->
		<Tabs.Content value="owned" class="mt-6">
			{#if loading && ownedChallenges.length === 0}
				<!-- Loading State -->
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
			{:else if ownedChallenges.length > 0}
				<!-- Owned Challenges Grid -->
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each ownedChallenges as challenge}
						<Card.Root class="hover:shadow-lg transition-shadow">
							<Card.Header>
								<div class="flex items-start justify-between">
									<Card.Title class="text-lg">{challenge.name}</Card.Title>
									<div class="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleEditChallenge(challenge.id)}
										>
											<Edit class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onclick={() => handleDeleteChallenge(challenge.id)}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
								<Card.Description>
									Created {new Date(challenge.createdAt).toLocaleDateString()}
								</Card.Description>
							</Card.Header>
							<Card.Content>
								<div class="space-y-2">
									<div class="flex items-center gap-2 text-sm">
										<Users class="h-4 w-4" />
										<span>{challenge.membersCount} members</span>
									</div>
									<div class="flex flex-wrap gap-1">
										{#each challenge.logTypes.slice(0, 3) as logType}
											<Badge variant="outline" class="text-xs">
												{logType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
											</Badge>
										{/each}
									</div>
								</div>
							</Card.Content>
							<Card.Footer class="flex gap-2">
								<Button 
									class="flex-1"
									onclick={() => handleViewChallenge(challenge.id)}
								>
									Manage
								</Button>
								<Button 
									variant="outline"
									onclick={() => handleEditChallenge(challenge.id)}
								>
									Edit
								</Button>
							</Card.Footer>
						</Card.Root>
					{/each}
				</div>

				<!-- Load More for Owned -->
				{#if ownedChallenges.length >= limit}
					<div class="flex justify-center mt-6">
						<Button 
							variant="outline" 
							onclick={loadMoreOwned}
							disabled={loading}
						>
							{loading ? 'Loading...' : 'Load More'}
						</Button>
					</div>
				{/if}
			{:else}
				<!-- Empty State for Owned -->
				<Card.Root class="text-center py-12">
					<Card.Content>
						<Plus class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 class="text-lg font-semibold mb-2">No Created Challenges</h3>
						<p class="text-muted-foreground mb-6">
							You haven't created any challenges yet. Create your first challenge to get started!
						</p>
						<Button onclick={() => goto('/app/challenges/create')}>
							<Plus class="mr-2 h-4 w-4" />
							Create Challenge
						</Button>
					</Card.Content>
				</Card.Root>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
