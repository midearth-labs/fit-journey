<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Trophy, Users, Plus, Search, Target, Calendar } from 'lucide-svelte';
	import { challengesStore } from './stores/challenges.svelte';
	import { dashboardStore } from '../dashboard/stores/dashboard.svelte';

	// Get metadata from dashboard store
	const metadata = $derived(dashboardStore.metadata);
	const loading = $derived(challengesStore.loading);

	// Load initial data
	onMount(async () => {
		// Load user's challenges for stats
		await Promise.all([
			challengesStore.loadOwnedChallenges({ page: 1, limit: 5 }),
			challengesStore.loadJoinedChallenges({ page: 1, limit: 5 })
		]);
	});

	// Calculate stats
	const stats = $derived({
		activeChallenges: challengesStore.joinedChallenges.filter(c => c.status === 'active').length,
		ownedChallenges: challengesStore.ownedChallenges.length,
		totalJoined: challengesStore.joinedChallenges.length
	});

	// Navigation functions
	function navigateToCreate() {
		goto('/app/challenges/create');
	}

	function navigateToDiscover() {
		goto('/app/challenges/discover');
	}

	function navigateToMyChallenges() {
		goto('/app/challenges/my-challenges');
	}
</script>

<svelte:head>
	<title>Challenges - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Challenges</h1>
			<p class="text-muted-foreground">
				Join challenges, track your progress, and achieve your fitness goals
			</p>
		</div>
		<Button onclick={navigateToCreate} class="bg-primary hover:bg-primary/90">
			<Plus class="mr-2 h-4 w-4" />
			Create Challenge
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Active Challenges</Card.Title>
				<Target class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.activeChallenges}</div>
				<p class="text-xs text-muted-foreground">
					Currently participating
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Challenges Created</Card.Title>
				<Trophy class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.ownedChallenges}</div>
				<p class="text-xs text-muted-foreground">
					Challenges you've created
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Joined</Card.Title>
				<Users class="h-4 w-4 text-primary" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{stats.totalJoined}</div>
				<p class="text-xs text-muted-foreground">
					All time challenges joined
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Quick Actions -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card.Root class="cursor-pointer hover:shadow-lg transition-shadow" onclick={navigateToDiscover}>
			<Card.Header>
				<div class="flex items-center gap-2">
					<Search class="h-5 w-5 text-primary" />
					<Card.Title>Discover Challenges</Card.Title>
				</div>
				<Card.Description>
					Browse and join public challenges from the community
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Badge variant="outline">Public</Badge>
					<Badge variant="outline">Community</Badge>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root class="cursor-pointer hover:shadow-lg transition-shadow" onclick={navigateToMyChallenges}>
			<Card.Header>
				<div class="flex items-center gap-2">
					<Calendar class="h-5 w-5 text-primary" />
					<Card.Title>My Challenges</Card.Title>
				</div>
				<Card.Description>
					Manage your created and joined challenges
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center gap-2">
					<Badge variant="outline">Owned: {stats.ownedChallenges}</Badge>
					<Badge variant="outline">Joined: {stats.totalJoined}</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Recent Activity -->
	{#if challengesStore.joinedChallenges.length > 0 || challengesStore.ownedChallenges.length > 0}
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">Recent Activity</h2>
			
			{#if challengesStore.joinedChallenges.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Recently Joined</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#each challengesStore.joinedChallenges.slice(0, 3) as challenge}
								<div class="flex items-center justify-between p-2 rounded-lg border">
									<div>
										<h4 class="font-medium">{challenge.name}</h4>
										<p class="text-sm text-muted-foreground">
											Joined {new Date(challenge.joinedAt).toLocaleDateString()}
										</p>
									</div>
									<Button 
										variant="outline" 
										size="sm"
										onclick={() => goto(`/app/challenges/${challenge.id}`)}
									>
										View
									</Button>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}

			{#if challengesStore.ownedChallenges.length > 0}
				<Card.Root>
					<Card.Header>
						<Card.Title class="text-lg">Recently Created</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							{#each challengesStore.ownedChallenges.slice(0, 3) as challenge}
								<div class="flex items-center justify-between p-2 rounded-lg border">
									<div>
										<h4 class="font-medium">{challenge.name}</h4>
										<p class="text-sm text-muted-foreground">
											Created {new Date(challenge.createdAt).toLocaleDateString()}
										</p>
									</div>
									<Button 
										variant="outline" 
										size="sm"
										onclick={() => goto(`/app/challenges/${challenge.id}`)}
									>
										Manage
									</Button>
								</div>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{:else}
		<!-- Empty State -->
		<Card.Root class="text-center py-12">
			<Card.Content>
				<Trophy class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
				<h3 class="text-lg font-semibold mb-2">No Challenges Yet</h3>
				<p class="text-muted-foreground mb-6">
					Get started by creating your first challenge or joining one from the community
				</p>
				<div class="flex gap-4 justify-center">
					<Button onclick={navigateToCreate}>
						<Plus class="mr-2 h-4 w-4" />
						Create Challenge
					</Button>
					<Button variant="outline" onclick={navigateToDiscover}>
						<Search class="mr-2 h-4 w-4" />
						Discover Challenges
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
