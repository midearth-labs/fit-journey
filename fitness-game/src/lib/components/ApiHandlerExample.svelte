<script lang="ts">
	import { apiHandler } from '$lib/client/api-handler';
	import { ApiClient } from '$lib/client/api-client';
	import { contentService } from '$lib/services/content.service';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	// Example of using the API handler in a component
	let apiClient = new ApiClient('', {
		'Content-Type': 'application/json'
	});

	// Reactive state
	let loading = $state(false);
	let error = $state<string | null>(null);
	let data = $state<any>(null);

	// Connect to API handler
	$effect(() => {
		const unsubscribeLoading = apiHandler.onLoadingChange((isLoading) => {
			loading = isLoading;
		});

		const unsubscribeError = apiHandler.onErrorChange((err) => {
			error = err;
		});

		return () => {
			unsubscribeLoading();
			unsubscribeError();
		};
	});

	// Example API operations using the handler
	async function loadUserProfile() {
		const result = await apiHandler.execute(
			() => apiClient.getMyProfile(),
			{ errorMessage: 'Failed to load user profile' }
		);

		if (result.success && result.data) {
			data = result.data;
		}
	}

	async function loadContentData() {
		const result = await apiHandler.execute(
			() => contentService.loadCategories(),
			{ errorMessage: 'Failed to load content categories' }
		);

		if (result.success && result.data) {
			data = result.data;
		}
	}

	async function loadMultipleData() {
		const result = await apiHandler.executeAll(
			[
				() => apiClient.getMyProfile(),
				() => apiClient.getMyMetadata(),
				() => contentService.loadCategories()
			],
			{ errorMessage: 'Failed to load multiple data sources' }
		);

		if (result.success && result.data) {
			data = result.data;
		}
	}

	function clearError() {
		apiHandler.clearError();
	}

	function clearAll() {
		apiHandler.clear();
		data = null;
	}
</script>

<Card.Root class="w-full max-w-md">
	<Card.Header>
		<Card.Title>API Handler Example</Card.Title>
		<Card.Description>
			Demonstrates centralized error and loading state management
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if loading}
			<div class="text-center py-4">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
				<p class="text-sm text-gray-600 mt-2">Loading...</p>
			</div>
		{/if}

		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-md p-3">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Error</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{error}</p>
						</div>
						<div class="mt-4">
							<div class="-mx-2 -my-1.5 flex">
								<Button variant="outline" size="sm" onclick={clearError}>
									Dismiss
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if data && !loading}
			<div class="bg-green-50 border border-green-200 rounded-md p-3">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-green-800">Success</h3>
						<div class="mt-2 text-sm text-green-700">
							<p>Data loaded successfully!</p>
							<pre class="mt-2 text-xs bg-green-100 p-2 rounded overflow-auto max-h-32">{JSON.stringify(data, null, 2)}</pre>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<div class="space-y-2">
			<Button onclick={loadUserProfile} disabled={loading} class="w-full">
				Load User Profile
			</Button>
			<Button onclick={loadContentData} disabled={loading} class="w-full">
				Load Content Data
			</Button>
			<Button onclick={loadMultipleData} disabled={loading} class="w-full">
				Load Multiple Data Sources
			</Button>
			<Button onclick={clearAll} variant="outline" class="w-full">
				Clear All
			</Button>
		</div>
	</Card.Content>
</Card.Root>
