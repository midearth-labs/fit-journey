/**
 * FitJourney Theme Configuration
 * 
 * This file centralizes all color and theme settings for easy customization.
 * All colors use OKLCH color space for better perceptual uniformity.
 * 
 * To change the theme:
 * 1. Update the color values below
 * 2. The changes will automatically apply across the entire application
 */

export const theme = {
	// Light Green Theme - Primary colors
	colors: {
		light: {
			// Base colors
			background: 'oklch(0.99 0.005 142)',
			foreground: 'oklch(0.15 0.02 152)',

			// Card colors
			card: 'oklch(1 0 0)',
			cardForeground: 'oklch(0.15 0.02 152)',

			// Popover colors
			popover: 'oklch(1 0 0)',
			popoverForeground: 'oklch(0.15 0.02 152)',

			// Primary - Fresh Green
			primary: 'oklch(0.55 0.15 150)',
			primaryForeground: 'oklch(0.99 0.005 142)',

			// Secondary - Light Green
			secondary: 'oklch(0.95 0.02 145)',
			secondaryForeground: 'oklch(0.25 0.04 152)',

			// Muted - Very Light Green
			muted: 'oklch(0.96 0.01 145)',
			mutedForeground: 'oklch(0.48 0.02 152)',

			// Accent - Vibrant Green
			accent: 'oklch(0.92 0.03 145)',
			accentForeground: 'oklch(0.25 0.04 152)',

			// Destructive
			destructive: 'oklch(0.577 0.245 27.325)',

			// Border & Input
			border: 'oklch(0.89 0.01 145)',
			input: 'oklch(0.89 0.01 145)',
			ring: 'oklch(0.55 0.15 150)',

			// Sidebar - Light Green
			sidebar: 'oklch(0.98 0.01 145)',
			sidebarForeground: 'oklch(0.25 0.04 152)',
			sidebarPrimary: 'oklch(0.55 0.15 150)',
			sidebarPrimaryForeground: 'oklch(0.99 0.005 142)',
			sidebarAccent: 'oklch(0.95 0.02 145)',
			sidebarAccentForeground: 'oklch(0.25 0.04 152)',
			sidebarBorder: 'oklch(0.89 0.01 145)',
			sidebarRing: 'oklch(0.55 0.15 150)'
		},
		dark: {
			// Dark mode colors (optional)
			background: 'oklch(0.145 0 0)',
			foreground: 'oklch(0.985 0 0)',
			card: 'oklch(0.205 0 0)',
			cardForeground: 'oklch(0.985 0 0)',
			popover: 'oklch(0.205 0 0)',
			popoverForeground: 'oklch(0.985 0 0)',
			primary: 'oklch(0.922 0 0)',
			primaryForeground: 'oklch(0.205 0 0)',
			secondary: 'oklch(0.269 0 0)',
			secondaryForeground: 'oklch(0.985 0 0)',
			muted: 'oklch(0.269 0 0)',
			mutedForeground: 'oklch(0.708 0 0)',
			accent: 'oklch(0.269 0 0)',
			accentForeground: 'oklch(0.985 0 0)',
			destructive: 'oklch(0.704 0.191 22.216)',
			border: 'oklch(1 0 0 / 10%)',
			input: 'oklch(1 0 0 / 15%)',
			ring: 'oklch(0.556 0 0)',
			sidebar: 'oklch(0.205 0 0)',
			sidebarForeground: 'oklch(0.985 0 0)',
			sidebarPrimary: 'oklch(0.488 0.243 264.376)',
			sidebarPrimaryForeground: 'oklch(0.985 0 0)',
			sidebarAccent: 'oklch(0.269 0 0)',
			sidebarAccentForeground: 'oklch(0.985 0 0)',
			sidebarBorder: 'oklch(1 0 0 / 10%)',
			sidebarRing: 'oklch(0.556 0 0)'
		}
	},

	// Chart colors - Green themed
	charts: {
		chart1: 'oklch(0.55 0.15 150)', // Primary green
		chart2: 'oklch(0.65 0.12 160)', // Light green
		chart3: 'oklch(0.45 0.18 145)', // Dark green
		chart4: 'oklch(0.75 0.10 155)', // Pale green
		chart5: 'oklch(0.60 0.13 148)' // Medium green
	},

	// Radius values
	radius: {
		sm: 'calc(0.625rem - 4px)',
		md: 'calc(0.625rem - 2px)',
		lg: '0.625rem',
		xl: 'calc(0.625rem + 4px)'
	},

	// Spacing (can be customized)
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem',
		'2xl': '3rem'
	}
} as const;

/**
 * Generate CSS variables from theme config
 */
export function generateCSSVariables(mode: 'light' | 'dark' = 'light') {
	const colors = theme.colors[mode];
	const charts = theme.charts;

	return {
		'--radius': theme.radius.lg,
		'--background': colors.background,
		'--foreground': colors.foreground,
		'--card': colors.card,
		'--card-foreground': colors.cardForeground,
		'--popover': colors.popover,
		'--popover-foreground': colors.popoverForeground,
		'--primary': colors.primary,
		'--primary-foreground': colors.primaryForeground,
		'--secondary': colors.secondary,
		'--secondary-foreground': colors.secondaryForeground,
		'--muted': colors.muted,
		'--muted-foreground': colors.mutedForeground,
		'--accent': colors.accent,
		'--accent-foreground': colors.accentForeground,
		'--destructive': colors.destructive,
		'--border': colors.border,
		'--input': colors.input,
		'--ring': colors.ring,
		'--chart-1': charts.chart1,
		'--chart-2': charts.chart2,
		'--chart-3': charts.chart3,
		'--chart-4': charts.chart4,
		'--chart-5': charts.chart5,
		'--sidebar': colors.sidebar,
		'--sidebar-foreground': colors.sidebarForeground,
		'--sidebar-primary': colors.sidebarPrimary,
		'--sidebar-primary-foreground': colors.sidebarPrimaryForeground,
		'--sidebar-accent': colors.sidebarAccent,
		'--sidebar-accent-foreground': colors.sidebarAccentForeground,
		'--sidebar-border': colors.sidebarBorder,
		'--sidebar-ring': colors.sidebarRing
	};
}

export type Theme = typeof theme;
export type ThemeColors = keyof typeof theme.colors.light;

