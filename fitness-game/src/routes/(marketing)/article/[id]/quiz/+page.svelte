<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { contentService } from '$lib/services/content.service';
	import { progressStore } from '$lib/stores/progress';
	import type { Article, Question } from '$lib/types/content';
	import { marked } from 'marked';

	let article: Article | null = null;
	let questions: Question[] = [];
	let currentQuestionIndex = 0;
	let answers: (number | null)[] = [];
	let selectedAnswer: number | null = null;
	let showResults = false;
	let score = 0;
	let renderedPassages: { [key: string]: string } = {};

	onMount(async () => {
		const articleId = $page.params.id;
		if (!articleId) return;
		
		try {
			const [articleData, questionsData] = await Promise.all([
				contentService.getArticleById(articleId),
				contentService.getQuestionsForArticle(articleId)
			]);
			
			article = articleData;
			questions = questionsData;
			answers = new Array(questions.length).fill(null);
			
			// Pre-render passage content
			if (article?.passages) {
				for (const passage of article.passages) {
					renderedPassages[passage.id] = await renderMarkdown(passage.passage_text);
				}
			}
		} catch (error) {
			console.error('Error loading quiz:', error);
		}
	});

	function selectAnswer(answerIndex: number) {
		selectedAnswer = answerIndex;
		answers[currentQuestionIndex] = answerIndex;
	}

	function nextQuestion() {
		if (currentQuestionIndex < questions.length - 1) {
			currentQuestionIndex++;
			selectedAnswer = answers[currentQuestionIndex];
		} else {
			finishQuiz();
		}
	}

	function previousQuestion() {
		if (currentQuestionIndex > 0) {
			currentQuestionIndex--;
			selectedAnswer = answers[currentQuestionIndex];
		}
	}

	function finishQuiz() {
		// Calculate score
		score = 0;
		questions.forEach((question, index) => {
			const userAnswer = answers[index];
			if (userAnswer === question.correct_answer_index) {
				score++;
				progressStore.markQuestionCompleted(question.id, true);
			} else {
				progressStore.markQuestionCompleted(question.id, false);
			}
		});
		
		// Mark article as completed
		if (article) {
			progressStore.markArticleCompleted(article.id);
		}
		
		showResults = true;
	}

	function exitQuiz() {
		if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
			goto(`/article/${$page.params.id}`);
		}
	}

	async function renderMarkdown(content: string): Promise<string> {
		return (await marked.parse(content)).replace(/<h1>.*?<\/h1>/g, '');
	}
</script>

<div class="container">
	<div class="quiz-header">
		<div class="quiz-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {((currentQuestionIndex + 1) / questions.length) * 100}%"></div>
			</div>
			<span>Question {currentQuestionIndex + 1} of {questions.length}</span>
		</div>
		<button class="btn btn-outline" onclick={exitQuiz}>Exit Quiz</button>
	</div>
	
	{#if showResults}
		<div class="quiz-results">
			<h2>Quiz Completed!</h2>
			<div class="score-display">
				<span class="score-number">{score}</span>
				<span class="score-label">out of {questions.length}</span>
			</div>
			<p class="score-percentage">{Math.round((score / questions.length) * 100)}%</p>
			<div class="quiz-actions">
				<button class="btn btn-primary" onclick={() => goto(`/article/${$page.params.id}`)}>
					Back to Article
				</button>
			</div>
		</div>
	{:else if questions.length > 0}
		<div class="quiz-content">
			<div class="question-container">
				{#if questions.length > 0}
					{@const question = questions[currentQuestionIndex]}
					{@const passage = question.question_type === 'passage_based' && question.passage_set_id ? 
						article?.passages?.find(p => p.id === question.passage_set_id) : null}
				
					{#if passage}
						<div class="passage-container">
							<h4 class="passage-title">{passage.title}</h4>
							<div class="passage-text">{@html renderedPassages[passage.id]}</div>
						</div>
					{/if}
					
					<div class="question-header">
						<span class="question-type">{question.question_type === 'standalone' ? 'Standalone' : 'Passage-based'}</span>
						<h3 class="question-text">{question.question_text}</h3>
					</div>
					<div class="question-options">
						{#each question.options as option, index}
							<button class="option" class:selected={selectedAnswer === index} onclick={() => selectAnswer(index)} aria-label="Select option {index + 1}">
								<div class="option-radio"></div>
								<div class="option-text">{option}</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="quiz-actions">
				<button class="btn btn-outline" disabled={currentQuestionIndex === 0} onclick={previousQuestion}>
					Previous
				</button>
				<button class="btn btn-primary" disabled={selectedAnswer === null} onclick={nextQuestion}>
					{currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
				</button>
			</div>
		</div>
	{:else}
		<div class="loading">
			<p>Loading quiz...</p>
		</div>
	{/if}
</div>

