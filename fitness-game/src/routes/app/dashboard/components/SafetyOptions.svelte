<script lang="ts">
	let showPauseModal = $state(false);
	let showAdjustModal = $state(false);
	let selectedPace = $state<string>('');

	function handlePause() {
		// Handle pause logic
		showPauseModal = false;
		// Could call API to pause journey
	}

	function handleAdjustPace() {
		// Handle pace adjustment logic
		showAdjustModal = false;
		// Could call API to update pace settings
	}
</script>

<div class="safety-container">
	<button class="safety-link" onclick={() => (showAdjustModal = true)}>
		Need to adjust your pace?
	</button>
	<button class="safety-link" onclick={() => (showPauseModal = true)}>
		Taking a break is okay
	</button>
</div>

{#if showPauseModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (showPauseModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3 class="modal-title">Pause Your Journey</h3>
			<p class="modal-text">Your progress is saved. Come back whenever you're ready.</p>
			<div class="modal-buttons">
				<button class="modal-button modal-button-secondary" onclick={() => (showPauseModal = false)}>
					Cancel
				</button>
				<button class="modal-button modal-button-primary" onclick={handlePause}>
					Confirm Pause
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showAdjustModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={() => (showAdjustModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3 class="modal-title">Adjust Your Pace</h3>
			<div class="space-y-3">
				<label class="radio-option">
					<input type="radio" name="pace" value="lighter" bind:group={selectedPace} />
					<span>Lighter schedule (5 min/day)</span>
				</label>
				<label class="radio-option">
					<input type="radio" name="pace" value="habits" bind:group={selectedPace} />
					<span>Focus on habits only</span>
				</label>
				<label class="radio-option">
					<input type="radio" name="pace" value="reading" bind:group={selectedPace} />
					<span>Just reading, no quizzes</span>
				</label>
			</div>
			<div class="modal-buttons mt-6">
				<button
					class="modal-button modal-button-secondary"
					onclick={() => (showAdjustModal = false)}
				>
					Cancel
				</button>
				<button class="modal-button modal-button-primary" onclick={handleAdjustPace}>
					Apply Changes
				</button>
			</div>
		</div>
	</div>
{/if}
