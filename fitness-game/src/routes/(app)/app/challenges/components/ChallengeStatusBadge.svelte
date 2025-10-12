<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { getChallengeStatusText } from '../utils/challenge-helpers';

	type ChallengeStatus = 'not_started' | 'active' | 'completed' | 'locked' | 'inactive';

	let { status } = $props<{ status: ChallengeStatus }>();

	const statusConfig = {
		not_started: { label: 'Not Started', variant: 'secondary' as const },
		active: { label: 'Active', variant: 'default' as const },
		completed: { label: 'Completed', variant: 'outline' as const },
		locked: { label: 'Locked', variant: 'destructive' as const },
		inactive: { label: 'Inactive', variant: 'secondary' as const }
	};

	const config = $derived(statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive);
</script>

<Badge variant={config.variant}>{config.label}</Badge>
