<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { progressStore } from '$lib/stores/progress';
	import '../app.css';

	let { children } = $props();
	let theme = $state('light');

	onMount(() => {
		// Load saved theme
		const savedTheme = localStorage.getItem('fitjourney-theme') || 'light';
		theme = savedTheme;
		document.documentElement.setAttribute('data-theme', theme);
		
		// Load progress
		progressStore.load();
	});

	function toggleTheme() {
		theme = theme === 'dark' ? 'light' : 'dark';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('fitjourney-theme', theme);
	}

	function getCurrentPage(): string {
		const path = $page.url.pathname;
		if (path === '/') return 'home';
		if (path.startsWith('/categories')) return 'categories';
		if (path.startsWith('/progress')) return 'progress';
		return 'home';
	}
</script>

<svelte:head>
	<title>FitJourney - Master Fitness in 70 Days</title>
	<meta name="description" content="Transform your fitness knowledge with our interactive 70-day learning journey. Master nutrition, exercise, and wellness through engaging articles and quizzes." />
	<meta name="keywords" content="fitness learning, nutrition education, exercise knowledge, wellness journey, fitness quiz, health education" />
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
	<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💪</text></svg>">
</svelte:head>

<div class="app">
	<!-- Navigation Header -->
	<header class="header">
		<div class="container">
			<div class="nav-brand">
				<div class="brand-icon">
					<div class="icon-circle">
						<i class="fas fa-dumbbell"></i>
					</div>
				</div>
				<div class="brand-text">
					<h1>FitJourney</h1>
					<span class="brand-subtitle">Learn • Grow • Transform</span>
				</div>
			</div>
			<nav class="nav-menu">
				<a href="/" class="nav-link" class:active={getCurrentPage() === 'home'}>
					<i class="fas fa-home"></i>
					<span>Home</span>
				</a>
				<a href="/categories" class="nav-link" class:active={getCurrentPage() === 'categories'}>
					<i class="fas fa-th-large"></i>
					<span>Categories</span>
				</a>
				<a href="/progress" class="nav-link" class:active={getCurrentPage() === 'progress'}>
					<i class="fas fa-chart-line"></i>
					<span>Progress</span>
				</a>
			</nav>
			<div class="nav-actions">
				<div class="streak-indicator">
					<i class="fas fa-fire"></i>
					<span>0</span>
				</div>
				<button class="btn btn-ghost" onclick={toggleTheme} aria-label="Toggle theme">
					<i class="fas fa-{theme === 'dark' ? 'sun' : 'moon'}"></i>
				</button>
				<a href="/categories" class="btn btn-primary btn-sm">
					Start Learning
				</a>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="main-content">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="footer">
		<div class="container">
			<p>&copy; 2024 FitJourney. Your fitness learning companion.</p>
		</div>
	</footer>
</div>
