<script lang="ts">
	import { onMount } from 'svelte';
	import { contentService } from '$lib/services/content.service';
	import { progressStore } from '$lib/stores/progress';
	import type { Article, LearningPhase } from '$lib/types/content';

	let allArticles: Article[] = [];
	let phases: LearningPhase[] = [];
	let progress: any = {};

	onMount(async () => {
		try {
			const [articles, phasesData] = await Promise.all([
				contentService.loadAllArticles(),
				contentService.getLearningPhases()
			]);
			
			allArticles = articles;
			phases = phasesData;
			
			// Subscribe to progress changes
			progressStore.subscribe(value => {
				progress = value;
			});
		} catch (error) {
			console.error('Error loading progress page:', error);
		}
	});
</script>

<div class="container">
	<div class="page-header">
		<h2>Your Learning Progress</h2>
		<p>Track your journey through the 70-day fitness learning adventure</p>
	</div>
	
	{#if allArticles.length > 0}
		<div class="progress-overview">
			<div class="progress-summary">
				<div class="progress-card">
					<h3>Overall Progress</h3>
					<div class="progress-circle">
						<div class="progress-fill" style="width: {Math.round((progress.completedArticles?.length || 0) / allArticles.length) * 100}%"></div>
						<span class="progress-text">{Math.round((progress.completedArticles?.length || 0) / allArticles.length) * 100}%</span>
					</div>
					<p>{progress.completedArticles?.length || 0} of {allArticles.length} articles completed</p>
				</div>
				<div class="progress-card">
					<h3>Quiz Score</h3>
					<div class="score-display">
						<span class="score-number">{progress.totalScore || 0}</span>
						<span class="score-label">correct answers</span>
					</div>
				</div>
			</div>
			<div class="phases-progress">
				<h3>Phase Progress</h3>
				{#each phases as phase}
					{@const phaseArticles = allArticles.filter(a => a.day >= phase.dayRange[0] && a.day <= phase.dayRange[1])}
					{@const completedPhaseArticles = phaseArticles.filter(a => progress.completedArticles?.includes(a.id) || [])}
					{@const phaseProgress = Math.round((completedPhaseArticles.length / phaseArticles.length) * 100)}
					
					<div class="phase-progress-card">
						<div class="phase-info">
							<h4>{phase.name}</h4>
							<p>{phase.description}</p>
						</div>
						<div class="phase-progress-bar">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {phaseProgress}%"></div>
							</div>
							<span class="progress-text">{completedPhaseArticles.length}/{phaseArticles.length} articles</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="loading">
			<p>Loading progress...</p>
		</div>
	{/if}
</div>
