<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Sheet from '$lib/components/ui/sheet';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Lock, Calendar, Clock } from 'lucide-svelte';
	import { formatDateRange } from '../utils/challenge-helpers';
	import { onMount } from 'svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import type { ApiResponse } from '$lib/client/api-client';
	import type { AllLogKeysType } from '$lib/config/constants';

	// Type definition for challenge (using API response type)
	type PublicChallenge = ApiResponse['getChallenge'];

	let { 
		open = $bindable(false), 
		challenge, 
		onJoin 
	}: {
		open?: boolean;
		challenge: PublicChallenge;
		onJoin: (challengeId: string, shareLogKeys: AllLogKeysType[], inviteCode?: string) => Promise<void>;
	} = $props();

	let inviteCode = $state('');
	let shareLogKeys = $state<AllLogKeysType[]>([]);
	let submitting = $state(false);

	// Load log types on mount if not already loaded
	onMount(async () => {
		await challengesStore.loadLogTypes();
	});

	// Filter log types to only those in the challenge
	const availableLogTypes = $derived(
		challenge.logTypes.map((key: AllLogKeysType) => 
			challengesStore.getLogTypeByKey(key)
		).filter((logType) => logType !== undefined)
	);

	// Handle form submission
	async function handleSubmit() {
		submitting = true;
		try {
			await onJoin(
				challenge.id,
				shareLogKeys,
				challenge.joinType === 'invite-code' ? inviteCode : undefined
			);
			open = false;
			// Reset form
			inviteCode = '';
			shareLogKeys = [];
		} catch (error) {
			console.error('Failed to join challenge:', error);
		} finally {
			submitting = false;
		}
	}

	// Handle log type toggle
	function toggleLogType(logType: AllLogKeysType) {
		if (shareLogKeys.includes(logType)) {
			shareLogKeys = shareLogKeys.filter(t => t !== logType);
		} else {
			shareLogKeys = [...shareLogKeys, logType];
		}
	}

	// Handle dialog close
	function handleClose() {
		open = false;
		// Reset form
		inviteCode = '';
		shareLogKeys = [];
		submitting = false;
	}
</script>

<Sheet.Root bind:open onOpenChange={handleClose}>
	<Sheet.Content class="sm:max-w-lg">
		<Sheet.Header>
			<Sheet.Title>Join Challenge</Sheet.Title>
			<Sheet.Description>
				Join "{challenge.name}" and start tracking your progress
			</Sheet.Description>
		</Sheet.Header>

		<div class="space-y-6 py-6">
			<!-- Challenge Info -->
			<div class="space-y-4">
				<div>
					<h3 class="font-semibold text-lg">{challenge.name}</h3>
					{#if challenge.description}
						<p class="text-sm text-muted-foreground mt-1">
							{challenge.description}
						</p>
					{/if}
				</div>

				<div class="grid grid-cols-2 gap-4 text-sm">
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
					<div class="flex items-center gap-2">
						<Lock class="h-4 w-4 text-muted-foreground" />
						<span>{challenge.joinType === 'public' ? 'Public' : challenge.joinType === 'invite-code' ? 'Invite Only' : 'Personal'}</span>
					</div>
				</div>

				<!-- Log Types -->
				<div>
					<h4 class="font-medium mb-2">Track These Metrics:</h4>
					<div class="flex flex-wrap gap-1">
						{#each availableLogTypes as logType}
							<Badge variant="outline" class="text-xs">
								{logType.display_title || logType}
							</Badge>
						{/each}
					</div>
				</div>
			</div>

			<!-- Invite Code (if required) -->
			{#if challenge.joinType === 'invite-code'}
				<div class="space-y-2">
					<Label for="inviteCode">Invite Code *</Label>
					<Input
						id="inviteCode"
						bind:value={inviteCode}
						placeholder="Enter invite code"
						required
					/>
				</div>
			{/if}

			<!-- Share Log Keys -->
			<div class="space-y-4">
				<div>
					<h4 class="font-medium mb-2">Share Your Progress</h4>
					<p class="text-sm text-muted-foreground">
						Select which metrics you want to share with other participants
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3">
					{#each availableLogTypes as logType}
						<div class="flex items-center space-x-2">
							<Checkbox
								id={logType.id}
								checked={shareLogKeys.includes(logType.id)}
								onCheckedChange={() => toggleLogType(logType.id)}
							/>
							<Label for={logType.id} class="text-sm">
								{logType.display_title}
							</Label>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<Sheet.Footer class="flex gap-2">
			<Button
				variant="outline"
				onclick={handleClose}
				disabled={submitting}
			>
				Cancel
			</Button>
			<Button
				onclick={handleSubmit}
				disabled={submitting || (challenge.joinType === 'invite-code' && !inviteCode.trim())}
			>
				{submitting ? 'Joining...' : 'Join Challenge'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
