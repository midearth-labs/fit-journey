<script lang="ts">
	import { page } from '$app/stores';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import {
		House,
		BookOpen,
		Trophy,
		Users,
		Target,
		Calendar,
		Settings,
		CircleQuestionMark,
		Search,
		Bell,
		User,
		TrendingUp,
		Activity
	} from 'lucide-svelte';

	let { children } = $props();

	const navigationItems = [
		{ title: 'Dashboard', url: '/app/dashboard', icon: House },
		{ title: 'Learn', url: '/app/learn', icon: BookOpen },
		{ title: 'Challenges', url: '/app/challenges', icon: Trophy },
		{ title: 'Community', url: '/app/community', icon: Users },
		{ title: 'Goals', url: '/app/goals', icon: Target },
		{ title: 'Calendar', url: '/app/calendar', icon: Calendar }
	];

	const secondaryItems = [
		{ title: 'Progress', url: '/app/progress', icon: TrendingUp },
		{ title: 'Activity', url: '/app/activity', icon: Activity }
	];

	const footerItems = [
		{ title: 'Settings', url: '/app/settings', icon: Settings },
		{ title: 'Get Help', url: '/app/help', icon: CircleQuestionMark }
	];
</script>

<Sidebar.Provider>
	<Sidebar.Root variant="inset" class="border-sidebar-border">
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg" class="data-[state=open]:bg-sidebar-accent">
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
						>
							<Activity class="size-4" />
						</div>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-semibold">FitJourney</span>
							<span class="truncate text-xs text-muted-foreground">Your Fitness Path</span>
						</div>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>

		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Main Menu</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each navigationItems as item}
							<Sidebar.MenuItem>
								<a href={item.url} class="sidebar-menu-button" class:active={$page.url.pathname === item.url}>
									<item.icon class="size-4" />
									<span>{item.title}</span>
								</a>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>

			<Sidebar.Group>
				<Sidebar.GroupLabel>Insights</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each secondaryItems as item}
							<Sidebar.MenuItem>
								<a href={item.url} class="sidebar-menu-button" class:active={$page.url.pathname === item.url}>
									<item.icon class="size-4" />
									<span>{item.title}</span>
								</a>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>

		<Sidebar.Footer>
			<Sidebar.Menu>
				{#each footerItems as item}
					<Sidebar.MenuItem>
						<a href={item.url} class="sidebar-menu-button">
							<item.icon class="size-4" />
							<span>{item.title}</span>
						</a>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Root>

	<Sidebar.Inset>
		<!-- Top Header Bar -->
		<header
			class="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4"
		>
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mr-2 h-4" />

			<!-- Breadcrumb/Page Title -->
			<div class="flex-1">
				<h1 class="text-lg font-semibold text-foreground">
					{#if $page.url.pathname.includes('/dashboard')}
						Dashboard
					{:else}
						FitJourney
					{/if}
				</h1>
			</div>

			<!-- Quick Actions -->
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="icon" class="h-9 w-9">
					<Search class="h-4 w-4" />
					<span class="sr-only">Search</span>
				</Button>
				<Button variant="ghost" size="icon" class="h-9 w-9">
					<Bell class="h-4 w-4" />
					<span class="sr-only">Notifications</span>
				</Button>
				<Button variant="ghost" size="icon" class="h-9 w-9">
					<User class="h-4 w-4" />
					<span class="sr-only">Account</span>
				</Button>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<style>
	:global(.sidebar-menu-button) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--sidebar-foreground));
		text-decoration: none;
		transition: all 0.15s ease;
	}

	:global(.sidebar-menu-button:hover) {
		background-color: hsl(var(--sidebar-accent));
		color: hsl(var(--sidebar-accent-foreground));
	}

	:global(.sidebar-menu-button.active) {
		background-color: hsl(var(--sidebar-primary));
		color: hsl(var(--sidebar-primary-foreground));
	}
</style>

