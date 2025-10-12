<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import { AlertTriangle } from 'lucide-svelte';

	let { 
		open = $bindable(false), 
		challengeName, 
		onLeave 
	} = $props<{
		open?: boolean;
		challengeName: string;
		onLeave: () => Promise<void>;
	}>();

	let leaving = $state(false);

	// Handle leave challenge
	async function handleLeave() {
		leaving = true;
		try {
			await onLeave();
			open = false;
		} catch (error) {
			console.error('Failed to leave challenge:', error);
		} finally {
			leaving = false;
		}
	}

	// Handle dialog close
	function handleClose() {
		open = false;
		leaving = false;
	}
</script>

<Sheet.Root bind:open onOpenChange={handleClose}>
	<Sheet.Content class="sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title class="flex items-center gap-2">
				<AlertTriangle class="h-5 w-5 text-destructive" />
				Leave Challenge
			</Sheet.Title>
			<Sheet.Description>
				Are you sure you want to leave "{challengeName}"? This action cannot be undone.
			</Sheet.Description>
		</Sheet.Header>

		<div class="py-6">
			<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
				<div class="flex items-start gap-3">
					<AlertTriangle class="h-5 w-5 text-destructive mt-0.5" />
					<div class="space-y-1">
						<h4 class="font-medium text-destructive">Warning</h4>
						<p class="text-sm text-muted-foreground">
							You will lose access to this challenge and all your progress data will be removed from the challenge leaderboard.
						</p>
					</div>
				</div>
			</div>
		</div>

		<Sheet.Footer class="flex gap-2">
			<Button
				variant="outline"
				onclick={handleClose}
				disabled={leaving}
			>
				Cancel
			</Button>
			<Button
				variant="destructive"
				onclick={handleLeave}
				disabled={leaving}
			>
				{leaving ? 'Leaving...' : 'Leave Challenge'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
