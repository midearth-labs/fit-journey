<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Calendar, Users, Target, Clock } from 'lucide-svelte';
	import { validateChallengeForm, type ChallengeFormData, type ValidationError } from '../utils/challenge-validators';
	import { challengesStore } from '../stores/challenges.svelte';
	import type { AllLogKeysType } from '$lib/config/constants';
	// Constants for challenge validation
	const CHALLENGE_CONSTANTS = {
		MAX_CHALLENGE_DURATION_DAYS: 365,
		MAX_MEMBER_COUNT: 100
	};

	let { onSubmit, onCancel } = $props<{
		onSubmit: (data: ChallengeFormData) => Promise<void>;
		onCancel: () => void;
	}>();

	// Form state
	let formData = $state<ChallengeFormData>({
		name: '',
		description: '',
		logTypes: [],
		startDate: '',
		durationDays: 7,
		joinType: 'personal',
		maxMembers: 1
	});

	let validationErrors = $state<ValidationError[]>([]);
	let isSubmitting = $state(false);
	let logTypesData = $derived(challengesStore.logTypes);

	// Load log types on mount
	onMount(async () => {
		try {
			await challengesStore.loadLogTypes();
		} catch (error) {
			console.error('Failed to load log types:', error);
		}
	});

	// Validation
	function validateForm() {
		const result = validateChallengeForm(formData);
		validationErrors = result.errors;
		return result.valid;
	}

	// Handle form submission
	async function handleSubmit() {
		if (!validateForm()) return;

		isSubmitting = true;
		try {
			await onSubmit(formData);
		} catch (error) {
			console.error('Failed to create challenge:', error);
		} finally {
			isSubmitting = false;
		}
	}

	// Handle log type toggle
	function toggleLogType(logType: AllLogKeysType) {
		if (formData.logTypes.includes(logType)) {
			formData.logTypes = formData.logTypes.filter(t => t !== logType);
		} else {
			formData.logTypes = [...formData.logTypes, logType];
		}
		// Clear validation errors for logTypes when user makes changes
		validationErrors = validationErrors.filter(e => e.field !== 'logTypes');
	}

	// Handle join type change
	function handleJoinTypeChange(value: string) {
		formData.joinType = value as 'personal' | 'public' | 'invite-code';
		// Set default maxMembers based on join type
		if (formData.joinType === 'personal') {
			formData.maxMembers = 1;
		} else if (formData.joinType === 'public') {
			formData.maxMembers = 10;
		}
		// Clear validation errors for joinType and maxMembers
		validationErrors = validationErrors.filter(e => e.field !== 'joinType' && e.field !== 'maxMembers');
	}

	// Duration presets
	const durationPresets = [7, 14, 30, 60];

	// Get validation error for a field
	function getFieldError(field: string): string | null {
		const error = validationErrors.find(e => e.field === field);
		return error ? error.message : null;
	}

	// Check if field has error
	function hasFieldError(field: string): boolean {
		return validationErrors.some(e => e.field === field);
	}

</script>

<form onsubmit={handleSubmit} class="space-y-6">
	<!-- Challenge Name -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Target class="h-5 w-5" />
				Challenge Details
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Challenge Name *</Label>
					<Input
						id="name"
						value={formData.name}
						oninput={(e) => formData.name = (e.target as HTMLInputElement).value}
						placeholder="Enter challenge name"
						maxlength={120}
						class={hasFieldError('name') ? 'border-destructive' : ''}
					/>
				{#if getFieldError('name')}
					<p class="text-sm text-destructive">{getFieldError('name')}</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					{formData.name.length}/120 characters
				</p>
			</div>

			<div class="space-y-2">
				<Label for="description">Description *</Label>
				<Textarea
					id="description"
					value={formData.description}
					oninput={(e: any) => formData.description = (e.target as HTMLTextAreaElement).value}
					placeholder="Describe your challenge goals and requirements"
					maxlength={2000}
					rows={4}
					class={hasFieldError('description') ? 'border-destructive' : ''}
				/>
				{#if getFieldError('description')}
					<p class="text-sm text-destructive">{getFieldError('description')}</p>
				{/if}
				<p class="text-xs text-muted-foreground">
					{formData.description.length}/2000 characters
				</p>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Log Types -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Track These Metrics</Card.Title>
			<Card.Description>
				Select which metrics participants should track during this challenge
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-4">
				{#each logTypesData as logType}
					<div class="flex items-center space-x-2">
						<Checkbox
							id={logType.id}
							checked={formData.logTypes.includes(logType.id)}
							onCheckedChange={() => toggleLogType(logType.id)}
						/>
						<Label for={logType.id} class="text-sm">
							{logType.display_title}
						</Label>
						{#if logType.description}
							<span class="text-xs text-muted-foreground">- {logType.description}</span>
						{/if}
					</div>
				{/each}
			</div>
			{#if getFieldError('logTypes')}
				<p class="text-sm text-destructive mt-2">{getFieldError('logTypes')}</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Schedule -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Schedule
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label for="startDate">Start Date *</Label>
				<Input
					id="startDate"
					type="date"
					bind:value={formData.startDate}
					min={new Date().toISOString().split('T')[0]}
					class={hasFieldError('startDate') ? 'border-destructive' : ''}
				/>
				{#if getFieldError('startDate')}
					<p class="text-sm text-destructive">{getFieldError('startDate')}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="duration">Duration (Days) *</Label>
				<div class="flex gap-2">
					<Input
						id="duration"
						type="number"
						value={formData.durationDays}
						oninput={(e) => formData.durationDays = parseInt((e.target as HTMLInputElement).value) || 1}
						min={1}
						max={CHALLENGE_CONSTANTS.MAX_CHALLENGE_DURATION_DAYS}
						class={hasFieldError('durationDays') ? 'border-destructive' : ''}
					/>
					<div class="flex gap-1">
						{#each durationPresets as preset}
							<Button
								type="button"
								variant={formData.durationDays === preset ? 'default' : 'outline'}
								size="sm"
								onclick={() => formData.durationDays = preset}
							>
								{preset}
							</Button>
						{/each}
					</div>
				</div>
				{#if getFieldError('durationDays')}
					<p class="text-sm text-destructive">{getFieldError('durationDays')}</p>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Join Type and Members -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Users class="h-5 w-5" />
				Access & Members
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="space-y-2">
				<Label>Who can join this challenge?</Label>
				<RadioGroup.Root
					bind:value={formData.joinType}
					onValueChange={handleJoinTypeChange}
				>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="personal" id="personal" />
						<Label for="personal">Personal (Just me)</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="public" id="public" />
						<Label for="public">Public (Anyone can join)</Label>
					</div>
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value="invite-code" id="invite-code" />
						<Label for="invite-code">Invite Only (With code)</Label>
					</div>
				</RadioGroup.Root>
				{#if getFieldError('joinType')}
					<p class="text-sm text-destructive">{getFieldError('joinType')}</p>
				{/if}
			</div>

			{#if formData.joinType === 'public' || formData.joinType === 'invite-code'}
				<div class="space-y-2">
					<Label for="maxMembers">Maximum Members</Label>
					<Input
						id="maxMembers"
						type="number"
						value={formData.maxMembers}
						oninput={(e) => formData.maxMembers = parseInt((e.target as HTMLInputElement).value) || 1}
						min={1}
						max={CHALLENGE_CONSTANTS.MAX_MEMBER_COUNT}
						class={hasFieldError('maxMembers') ? 'border-destructive' : ''}
					/>
					{#if getFieldError('maxMembers')}
						<p class="text-sm text-destructive">{getFieldError('maxMembers')}</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						Maximum {CHALLENGE_CONSTANTS.MAX_MEMBER_COUNT} members allowed
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Form Actions -->
	<div class="flex gap-4">
		<Button
			type="button"
			variant="outline"
			onclick={onCancel}
			disabled={isSubmitting}
		>
			Cancel
		</Button>
		<Button
			type="submit"
			disabled={isSubmitting}
		>
			{isSubmitting ? 'Creating...' : 'Create Challenge'}
		</Button>
	</div>
</form>
