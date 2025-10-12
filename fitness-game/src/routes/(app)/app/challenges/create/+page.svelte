<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Plus } from 'lucide-svelte';
	import { challengesStore } from '../stores/challenges.svelte';
	import ChallengeCreateForm from '../components/ChallengeCreateForm.svelte';
	import type { ChallengeFormData } from '../utils/challenge-validators';

	async function handleCreate(dto: ChallengeFormData) {
		try {
			const result = await challengesStore.createChallenge(dto as any);
			await goto(`/app/challenges/${result.id}`);
		} catch (error) {
			console.error('Failed to create challenge:', error);
			// Error is already handled by the store
		}
	}

	function handleCancel() {
		goto('/app/challenges');
	}
</script>

<svelte:head>
	<title>Create Challenge - FitJourney</title>
</svelte:head>

<div class="flex flex-1 flex-col gap-6 p-4 md:p-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<Button variant="ghost" size="icon" onclick={() => goto('/app/challenges')}>
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Create Challenge</h1>
			<p class="text-muted-foreground">
				Set up a new fitness challenge for yourself or the community
			</p>
		</div>
	</div>

	<!-- Create Form -->
	<div class="max-w-2xl">
		<ChallengeCreateForm onSubmit={handleCreate} onCancel={handleCancel} />
	</div>
</div>
