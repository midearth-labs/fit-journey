<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Calendar, Activity } from 'lucide-svelte';
	import { getRelativeTime } from '../utils/challenge-helpers';

	// Type definition for challenge members
	type ChallengeMember = {
		id: string;
		userId: string | null;
		joinedAt: string;
	};

	let { 
		members, 
		page = $bindable(1), 
		onPageChange 
	} = $props<{
		members: ChallengeMember[];
		page?: number;
		onPageChange: (newPage: number) => void;
	}>();

	// Calculate activity status based on join date
	function getActivityStatus(joinedAt: string): { label: string; variant: 'default' | 'secondary' | 'outline' } {
		const joinDate = new Date(joinedAt);
		const now = new Date();
		const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
		
		if (daysSinceJoin === 0) {
			return { label: 'New', variant: 'default' };
		} else if (daysSinceJoin <= 7) {
			return { label: 'Active', variant: 'default' };
		} else if (daysSinceJoin <= 30) {
			return { label: 'Regular', variant: 'secondary' };
		} else {
			return { label: 'Long-term', variant: 'outline' };
		}
	}

	// Format member display name
	function getMemberDisplayName(member: ChallengeMember): string {
		return member.userId ? `User ${member.userId.slice(0, 8)}` : 'Anonymous';
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Users class="h-5 w-5" />
			<h3 class="text-lg font-semibold">Members</h3>
			<Badge variant="secondary">{members.length}</Badge>
		</div>
	</div>

	{#if members.length > 0}
		<!-- Members Table -->
		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Member</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head>Activity</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each members as member}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
										<Users class="h-4 w-4 text-primary" />
									</div>
									<div>
										<p class="font-medium">{getMemberDisplayName(member)}</p>
										<p class="text-xs text-muted-foreground">
											{member.userId ? 'Registered User' : 'Anonymous'}
										</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4 text-muted-foreground" />
									<div>
										<p class="text-sm">{new Date(member.joinedAt).toLocaleDateString()}</p>
										<p class="text-xs text-muted-foreground">
											{getRelativeTime(member.joinedAt)}
										</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell>
								{@const activity = getActivityStatus(member.joinedAt)}
								<Badge variant={activity.variant}>
									<Activity class="h-3 w-3 mr-1" />
									{activity.label}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<!-- Pagination -->
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Showing {members.length} member{members.length !== 1 ? 's' : ''}
			</p>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onclick={() => onPageChange(Math.max(1, page - 1))}
					disabled={page <= 1}
				>
					Previous
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => onPageChange(page + 1)}
					disabled={members.length < 20}
				>
					Next
				</Button>
			</div>
		</div>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-8">
			<Users class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
			<h3 class="text-lg font-semibold mb-2">No Members Yet</h3>
			<p class="text-muted-foreground">
				This challenge doesn't have any members yet. Share it to get others to join!
			</p>
		</div>
	{/if}
</div>
