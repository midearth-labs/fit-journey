# FitJourney Theme Customization Guide

This guide explains how to customize the FitJourney dashboard theme colors and design.

## Overview

The FitJourney dashboard uses a **Light Green** theme built with:
- **Svelte 5** (latest reactive primitives with `$state`, `$derived`, etc.)
- **ShadCN Svelte** components
- **Tailwind CSS 4** with OKLCH color space
- **LayerChart** for data visualization

## Theme Architecture

### 1. Centralized Theme Configuration

The main theme configuration is located in:
```
src/lib/config/theme.ts
```

This file contains all color definitions, spacing, and radius values. **Edit this file to change the entire app's theme.**

### 2. CSS Variables

The CSS variables are defined in:
```
src/app.css
```

These variables are automatically applied from the theme configuration.

## Customizing Colors

### Method 1: Edit Theme Configuration (Recommended)

Edit `src/lib/config/theme.ts`:

```typescript
export const theme = {
  colors: {
    light: {
      // Change primary color (main brand color)
      primary: 'oklch(0.55 0.15 150)', // Green theme
      
      // Change to blue theme:
      // primary: 'oklch(0.55 0.15 250)',
      
      // Change to purple theme:
      // primary: 'oklch(0.55 0.15 310)',
    }
  }
}
```

### Method 2: Direct CSS Variable Editing

Edit `src/app.css` to directly modify CSS variables:

```css
:root {
  /* Primary - Change this for your brand color */
  --primary: oklch(0.55 0.15 150);
  --primary-foreground: oklch(0.99 0.005 142);
  
  /* Chart colors - Update for data visualization */
  --chart-1: oklch(0.55 0.15 150);
  --chart-2: oklch(0.65 0.12 160);
  /* ... more chart colors */
}
```

## Color Palette Reference

### Current Light Green Theme

| Color Variable | OKLCH Value | Usage |
|---------------|-------------|--------|
| `--primary` | `oklch(0.55 0.15 150)` | Primary buttons, links, accents |
| `--secondary` | `oklch(0.95 0.02 145)` | Secondary buttons, backgrounds |
| `--accent` | `oklch(0.92 0.03 145)` | Highlighted sections |
| `--muted` | `oklch(0.96 0.01 145)` | Subtle backgrounds |
| `--border` | `oklch(0.89 0.01 145)` | Card borders, dividers |

### Understanding OKLCH

OKLCH color format: `oklch(L C H)`
- **L** (Lightness): 0 to 1 (0 = black, 1 = white)
- **C** (Chroma): 0+ (0 = gray, higher = more saturated)
- **H** (Hue): 0-360 degrees
  - 0° = Red
  - 120° = Green
  - 150° = Teal/Green (FitJourney theme)
  - 240° = Blue
  - 300° = Purple

## Changing to Different Theme Colors

### Blue Theme Example

```css
:root {
  --primary: oklch(0.55 0.15 240);
  --primary-foreground: oklch(0.99 0.005 240);
  --secondary: oklch(0.95 0.02 235);
  --accent: oklch(0.92 0.03 235);
  --muted: oklch(0.96 0.01 235);
  --border: oklch(0.89 0.01 235);
  
  --chart-1: oklch(0.55 0.15 240);
  --chart-2: oklch(0.65 0.12 250);
  --chart-3: oklch(0.45 0.18 235);
  --chart-4: oklch(0.75 0.10 245);
  --chart-5: oklch(0.60 0.13 238);
}
```

### Purple Theme Example

```css
:root {
  --primary: oklch(0.55 0.15 310);
  --primary-foreground: oklch(0.99 0.005 310);
  --secondary: oklch(0.95 0.02 305);
  --accent: oklch(0.92 0.03 305);
  --muted: oklch(0.96 0.01 305);
  --border: oklch(0.89 0.01 305);
  
  --chart-1: oklch(0.55 0.15 310);
  --chart-2: oklch(0.65 0.12 320);
  --chart-3: oklch(0.45 0.18 305);
  --chart-4: oklch(0.75 0.10 315);
  --chart-5: oklch(0.60 0.13 308);
}
```

## Layout Customization

### Sidebar Width

Edit `src/routes/(app)/+layout.svelte`:

```svelte
<Sidebar.Root variant="inset" class="w-64"> <!-- Change width here -->
```

### Card Border Radius

Edit `src/app.css`:

```css
:root {
  --radius: 0.625rem; /* Default: 10px, change to 0.5rem (8px) or 1rem (16px) */
}
```

### Spacing

Global spacing is controlled by Tailwind's utility classes:
- `gap-4` (1rem spacing)
- `p-4` (1rem padding)
- Modify in `src/lib/config/theme.ts` for custom spacing scale

## Component Customization

### Cards

Cards use ShadCN Card component with these classes:
```svelte
<Card.Root class="border-border hover:shadow-lg transition-shadow">
```

### Buttons

Buttons use the primary color:
```svelte
<Button class="bg-primary hover:bg-primary/90">
```

### Charts

Charts use `--chart-1` through `--chart-5` variables:
```typescript
const chartConfig = {
  habits: {
    label: 'Habits',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig;
```

## Quick Theme Switcher

To quickly switch between preset themes, you can add theme variants to `app.css`:

```css
/* Add these classes to <body> or root element */
.theme-green {
  --primary: oklch(0.55 0.15 150);
  /* ... other green colors */
}

.theme-blue {
  --primary: oklch(0.55 0.15 240);
  /* ... other blue colors */
}

.theme-purple {
  --primary: oklch(0.55 0.15 310);
  /* ... other purple colors */
}
```

## Dark Mode

Dark mode colors are defined in the `.dark` selector in `app.css`. To customize:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.65 0.15 150); /* Lighter green for dark mode */
  /* ... other dark mode colors */
}
```

## Testing Your Changes

1. Edit color values in `src/app.css` or `src/lib/config/theme.ts`
2. Save the file
3. The dev server will hot-reload automatically
4. Check the dashboard at `/app/dashboard`

## Best Practices

1. **Maintain Contrast**: Ensure text remains readable on backgrounds
2. **Consistent Hue**: Keep related colors in the same hue family (±10-20 degrees)
3. **Lightness Range**: 
   - Backgrounds: 0.95-1.0
   - Text: 0.15-0.25
   - Primary: 0.45-0.65
4. **Test Accessibility**: Use browser DevTools to check contrast ratios (minimum 4.5:1 for normal text)

## Resources

- [OKLCH Color Picker](https://oklch.com/)
- [ShadCN Svelte Theming](https://shadcn-svelte.com/docs/theming)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [LayerChart Documentation](https://layerchart.com/)

## Support

For questions or issues with theme customization, refer to:
- FitJourney documentation
- ShadCN Svelte documentation
- Create an issue in the repository

