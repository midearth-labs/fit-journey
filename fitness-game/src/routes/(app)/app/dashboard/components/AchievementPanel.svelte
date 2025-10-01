<script lang="ts">
	import type { Achievement } from '../utils/achievements.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Progress } from '$lib/components/ui/progress';
	import { Trophy, Lock, Target } from 'lucide-svelte';

	let { achievements } = $props<{ achievements: Achievement[] }>();

	const earnedAchievements = $derived(achievements.filter((a: Achievement) => a.earned));
	const inProgressAchievements = $derived(achievements.filter((a: Achievement) => !a.earned));
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2">
			<Trophy class="h-5 w-5 text-primary" />
			Achievements
		</Card.Title>
		<Card.Description>
			{earnedAchievements.length} earned, {inProgressAchievements.length} in progress
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		{#if earnedAchievements.length > 0}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-muted-foreground flex items-center gap-2">
					<Trophy class="h-4 w-4" />
					Earned ({earnedAchievements.length})
				</h3>
				<div class="grid gap-3">
					{#each earnedAchievements as achievement}
						<div
							class="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-all hover:shadow-md"
						>
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
							>
								🏆
							</div>
							<div class="flex-1 space-y-1">
								<div class="flex items-center justify-between">
									<h4 class="font-semibold text-foreground">{achievement.name}</h4>
									<Badge class="bg-primary/10 text-primary border-primary/20">Earned</Badge>
								</div>
								<p class="text-sm text-muted-foreground">{achievement.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if inProgressAchievements.length > 0}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-muted-foreground flex items-center gap-2">
					<Target class="h-4 w-4" />
					In Progress ({inProgressAchievements.length})
				</h3>
				<div class="grid gap-3">
					{#each inProgressAchievements as achievement}
						<div
							class="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:shadow-md"
						>
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
							>
								<Lock class="h-5 w-5" />
							</div>
							<div class="flex-1 space-y-2">
								<div class="space-y-1">
									<h4 class="font-semibold text-foreground">{achievement.name}</h4>
									<p class="text-sm text-muted-foreground">{achievement.description}</p>
								</div>
								<div class="space-y-1">
									<Progress value={achievement.progressPercentage} class="h-2" />
									<p class="text-xs text-muted-foreground">
										{achievement.progressPercentage}% complete
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if achievements.length === 0}
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<Trophy class="h-12 w-12 text-muted-foreground mb-3" />
				<p class="text-muted-foreground">Start your journey to unlock achievements! 🎯</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
