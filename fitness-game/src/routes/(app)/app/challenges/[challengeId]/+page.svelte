<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { challengesStore } from '../stores/challenges.svelte';
	import { dashboardStore } from '../../dashboard/stores/dashboard.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { 
		ArrowLeft, 
		Edit, 
		Trash2, 
		LogOut, 
		Share, 
		Users, 
		Calendar, 
		Clock, 
		Target,
		Settings
	} from 'lucide-svelte';
	import ChallengeStatusBadge from '../components/ChallengeStatusBadge.svelte';
	import ChallengeMembersList from '../components/ChallengeMembersList.svelte';
	import ChallengeProgressChart from '../components/ChallengeProgressChart.svelte';
	import ChallengeLogHistory from '../components/ChallengeLogHistory.svelte';
	import LeaveChallengeDialog from '../components/LeaveChallengeDialog.svelte';
	import { 
		formatDateRange,
		getJoinTypeText, 
		canEditChallenge 
	} from '../utils/challenge-helpers';

	const challengeId = $derived($page.params.challengeId);
	const challenge = $derived(challengesStore.currentChallenge);
	const userChallenge = $derived(challengesStore.currentUserChallenge);
	const members = $derived(challengesStore.currentMembers);
	const loading = $derived(challengesStore.loading);
	const error = $derived(challengesStore.error);
	const userLogs = $derived(dashboardStore.logs);
	const profile = $derived(dashboardStore.profile);

	// Dialog states
	let showLeaveDialog = $state(false);

	// Load challenge data on mount
	onMount(async () => {
		if (challengeId) {
			await challengesStore.loadLogTypes();
			
			// First, try to load as a regular challenge (for viewing/joining)
			await challengesStore.loadChallengeDetail(challengeId);
			
			// If the user is the owner, also load the user challenge details (for management)
			if (challenge && profile && canEditChallenge(challenge, profile.id || '')) {
				await challengesStore.loadUserChallengeDetail(challengeId);
			}
			
			// Load members if we have challenge data
			if (challenge) {
				await challengesStore.loadChallengeMembers(challengeId, { page: 1, limit: 20 });
			}
		}
	});

	// Check if user can edit this challenge
	const canEdit = $derived.by(() => {
		if (!challenge || !profile) return false;
		return canEditChallenge(challenge, profile.id || '');
	});

	// Check if user is a member of this challenge
	const isMember = $derived.by(() => {
		if (!challenge || !profile) return false;
		// This would need to be determined from the API response
		// For now, assume user can view if they can access the page
		return true;
	});

	// Get the appropriate challenge data (user challenge for owners, regular challenge for others)
	const displayChallenge = $derived.by(() => {
		if (canEdit && userChallenge) {
			return userChallenge;
		}
		return challenge;
	});

	const logTypeDetails = $derived(
		(displayChallenge?.logTypes ?? []).map((key: string) => 
			challengesStore.getLogTypeByKey(key)
		).filter(logType => logType !== undefined)
	);

	// Handle edit challenge
	function handleEditChallenge() {
		goto(`/app/challenges/${challengeId}?edit=true`);
	}

	// Handle delete challenge
	async function handleDeleteChallenge() {
		if (confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
		try {
			if (challengeId) {
				await challengesStore.deleteChallenge(challengeId);
				goto('/app/challenges/my-challenges');
			}
		} catch (error) {
				console.error('Failed to delete challenge:', error);
			}
		}
	}

	// Handle leave challenge
	async function handleLeaveChallenge() {
		try {
			if (challengeId) {
				await challengesStore.leaveChallenge(challengeId);
				goto('/app/challenges/my-challenges');
			}
		} catch (error) {
			console.error('Failed to leave challenge:', error);
		}
	}

	// Handle share challenge
	function handleShareChallenge() {
		// TODO: Implement share functionality
		console.log('Share challenge:', challengeId);
	}

	// Handle members page change
	function handleMembersPageChange(newPage: number) {
		if (challengeId) {
			challengesStore.loadChallengeMembers(challengeId, { page: newPage, limit: 20 });
		}
	}
</script>

<svelte:head>
	<title>{displayChallenge?.name || 'Challenge'} - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Loading State -->
	{#if loading && !displayChallenge}
		<div class="space-y-6">
			<div class="flex items-center gap-4">
				<Skeleton class="h-10 w-10" />
				<div class="space-y-2">
					<Skeleton class="h-8 w-64" />
					<Skeleton class="h-4 w-48" />
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<Skeleton class="h-64" />
				<Skeleton class="h-64" />
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if error && !displayChallenge}
		<Card.Root class="border-destructive">
			<Card.Header>
				<Card.Title>Error Loading Challenge</Card.Title>
				<Card.Description>{error}</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button onclick={() => goto('/app/challenges')}>Back to Challenges</Button>
			</Card.Footer>
		</Card.Root>
	{/if}

	<!-- Challenge Content -->
	{#if displayChallenge}
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant="ghost" size="icon" onclick={() => goto('/app/challenges/my-challenges')}>
					<ArrowLeft class="h-4 w-4" />
				</Button>
				<div>
					<div class="flex items-center gap-3">
						<h1 class="text-3xl font-bold tracking-tight">{displayChallenge.name}</h1>
						<ChallengeStatusBadge status={displayChallenge.status} />
					</div>
					<p class="text-muted-foreground">
						{getJoinTypeText(displayChallenge.joinType)} challenge • {displayChallenge.membersCount} members
					</p>
				</div>
			</div>
			
			<div class="flex gap-2">
				{#if canEdit}
					<Button variant="outline" onclick={handleEditChallenge}>
						<Edit class="mr-2 h-4 w-4" />
						Edit
					</Button>
					<Button variant="outline" onclick={handleDeleteChallenge}>
						<Trash2 class="mr-2 h-4 w-4" />
						Delete
					</Button>
				{:else if isMember}
					<Button variant="outline" onclick={() => showLeaveDialog = true}>
						<LogOut class="mr-2 h-4 w-4" />
						Leave
					</Button>
				{/if}
				<Button variant="outline" onclick={handleShareChallenge}>
					<Share class="mr-2 h-4 w-4" />
					Share
				</Button>
			</div>
		</div>

		<!-- Overview Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Challenge Overview</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<h3 class="font-medium mb-2">Description</h3>
					<p class="text-muted-foreground">{displayChallenge.description}</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium">Duration</p>
							<p class="text-sm text-muted-foreground">
								{formatDateRange(displayChallenge.startDate, displayChallenge.endDate)}
							</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Clock class="h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium">Length</p>
							<p class="text-sm text-muted-foreground">{displayChallenge.durationDays} days</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Users class="h-4 w-4 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium">Members</p>
							<p class="text-sm text-muted-foreground">
								{displayChallenge.membersCount} / {displayChallenge.maxMembers}
							</p>
						</div>
					</div>
				</div>

				<div>
					<h3 class="font-medium mb-2">Track These Metrics</h3>
					<div class="flex flex-wrap gap-2">
						{#each logTypeDetails as logType}
							<Badge variant="outline">
								{logType.display_title}
							</Badge>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Tabbed Content -->
		<Tabs.Root value="progress" class="w-full">
			<Tabs.List class="grid w-full grid-cols-4">
				<Tabs.Trigger value="progress">Progress</Tabs.Trigger>
				<Tabs.Trigger value="members">Members</Tabs.Trigger>
				<Tabs.Trigger value="activity">My Activity</Tabs.Trigger>
				{#if isMember && !canEdit}
					<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
				{/if}
			</Tabs.List>

			<!-- Progress Tab -->
			<Tabs.Content value="progress" class="mt-6">
				<ChallengeProgressChart challenge={displayChallenge} {userLogs} />
			</Tabs.Content>

			<!-- Members Tab -->
			<Tabs.Content value="members" class="mt-6">
				<ChallengeMembersList 
					{members} 
					onPageChange={handleMembersPageChange} 
				/>
			</Tabs.Content>

			<!-- Activity Tab -->
			<Tabs.Content value="activity" class="mt-6">
				<ChallengeLogHistory challenge={displayChallenge} {userLogs} />
			</Tabs.Content>

			<!-- Settings Tab (for members only) -->
			{#if isMember && !canEdit}
				<Tabs.Content value="settings" class="mt-6">
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<Settings class="h-5 w-5" />
								Challenge Settings
							</Card.Title>
							<Card.Description>
								Manage your participation in this challenge
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div>
								<h3 class="font-medium mb-2">Share Log Keys</h3>
								<p class="text-sm text-muted-foreground mb-4">
									Select which metrics you want to share with other participants
								</p>
								<!-- TODO: Implement share log keys selection -->
								<div class="p-4 border rounded-lg">
									<p class="text-sm text-muted-foreground">
										Share settings will be implemented in a future update
									</p>
								</div>
							</div>
						</Card.Content>
						<Card.Footer>
							<Button variant="destructive" onclick={() => showLeaveDialog = true}>
								<LogOut class="mr-2 h-4 w-4" />
								Leave Challenge
							</Button>
						</Card.Footer>
					</Card.Root>
				</Tabs.Content>
			{/if}
		</Tabs.Root>
	{/if}
</div>

<!-- Leave Challenge Dialog -->
<LeaveChallengeDialog
	bind:open={showLeaveDialog}
	challengeName={challenge?.name || 'this challenge'}
	onLeave={handleLeaveChallenge}
/>
