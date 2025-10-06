<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { cn } from '$lib/utils';

	export let open: boolean = false;
	export let align: 'start' | 'center' | 'end' = 'center';
	export let side: 'top' | 'right' | 'bottom' | 'left' = 'bottom';
	export let sideOffset: number = 4;

	const dispatch = createEventDispatcher<{
		openChange: boolean;
	}>();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		dispatch('openChange', newOpen);
	}
</script>

<div class="relative inline-block">
	<slot {open} {align} {side} {sideOffset} on:openChange={handleOpenChange} />
</div>
