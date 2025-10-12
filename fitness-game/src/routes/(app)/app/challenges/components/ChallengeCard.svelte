<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Users, Calendar, Clock } from 'lucide-svelte';
	import ChallengeStatusBadge from './ChallengeStatusBadge.svelte';
	import { formatDateRange } from '../utils/challenge-helpers';
	import { onMount } from 'svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { AllLogKeysType } from '$lib/config/constants';

	// Type definitions based on API responses
	type PublicChallenge = ApiResponse['getChallenge'];
	type OwnedChallenge = ApiResponse['getUserChallenge'];
	type JoinedChallenge = ApiResponse['listChallengesJoinedByUser'][0];

	let { 
		challenge, 
		onJoin, 
		onView, 
		isJoined = false 
	} : {
		challenge: PublicChallenge | OwnedChallenge | JoinedChallenge;
		onJoin?: (id: string) => void;
		onView?: (id: string) => void;
		isJoined?: boolean;
	} = $props();

	// Load log types on mount if not already loaded
	onMount(() => {
		if (challengesStore.logTypes.length === 0) {
			challengesStore.loadLogTypes();
		}
	});

	// Use derived to get log type details
	const logTypeDetails = $derived(
		challenge.logTypes.map((key: AllLogKeysType) => 
			challengesStore.getLogTypeByKey(key)
		).filter((logType) => logType !== undefined)
	);

	// Truncate description for card display
	const truncatedDescription = $derived(
		challenge.description ? 
		(challenge.description.length > 120 ? challenge.description.slice(0, 120) + '...' : challenge.description) :
		'No description provided'
	);
</script>

<Card.Root class="hover:shadow-lg transition-shadow">
	<Card.Header>
		<div class="flex items-start justify-between">
			<Card.Title class="text-lg">{challenge.name}</Card.Title>
			<ChallengeStatusBadge status={challenge.status} />
		</div>
		<Card.Description class="text-sm text-muted-foreground">
			{truncatedDescription}
		</Card.Description>
	</Card.Header>
	
	<Card.Content>
		<div class="space-y-3">
			<!-- Challenge Details -->
			<div class="space-y-2 text-sm">
				<div class="flex items-center gap-2">
					<Calendar class="h-4 w-4 text-muted-foreground" />
					<span>{formatDateRange(challenge.startDate, challenge.endDate)}</span>
				</div>
				<div class="flex items-center gap-2">
					<Clock class="h-4 w-4 text-muted-foreground" />
					<span>{challenge.durationDays} days</span>
				</div>
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4 text-muted-foreground" />
					<span>{challenge.membersCount} / {challenge.maxMembers} members</span>
				</div>
			</div>
			
			<!-- Log Types -->
			<div class="flex flex-wrap gap-1">
				{#each logTypeDetails.slice(0, 3) as logType}
					<Badge variant="outline" class="text-xs">
						{logType.display_title}
					</Badge>
				{/each}
				{#if challenge.logTypes.length > 3}
					<Badge variant="outline" class="text-xs">
						+{challenge.logTypes.length - 3} more
					</Badge>
				{/if}
			</div>
		</div>
	</Card.Content>
	
	<Card.Footer>
		{#if isJoined}
			<Button 
				onclick={() => onView?.(challenge.id)} 
				class="w-full"
				variant="default"
			>
				View Details
			</Button>
		{:else}
			<Button 
				onclick={() => onJoin?.(challenge.id)} 
				class="w-full"
				variant="default"
			>
				Join Challenge
			</Button>
		{/if}
	</Card.Footer>
</Card.Root>
