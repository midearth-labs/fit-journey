# Dashboard Implementation

## Overview

The dashboard is a client-side rendered (CSR) implementation using Svelte 5 that displays personalized fitness progress, insights, and achievements. It follows a clean separation of concerns with data management in stores and pure rendering in components.

## Architecture

### Store-Based Data Management

All remote data actions are handled through `stores/dashboard.svelte.ts`:

- **dashboardStore**: Centralized state management
  - Fetches and caches dashboard data
  - Handles metadata, global stats, logs, profile, and challenges
  - Implements smart caching (5 min for metadata, 30 min for global stats)
  - Provides refresh and update methods

### Utilities

- **dashboard-config.ts**: Progressive disclosure configuration
  - Controls when features appear based on user engagement
  - Account age and activity-based feature unlocking

- **achievements.svelte.ts**: Achievement calculation logic
  - Micro-achievements system
  - Progress tracking
  - Earned vs in-progress filtering

- **insights.svelte.ts**: Smart insight generation
  - Analyzes user data and logs
  - Generates positive, neutral, and suggestion insights
  - Mood trend analysis

- **helpers.ts**: Utility functions for dates and formatting

### Components (Pure Rendering)

All components are presentational and receive data via props:

1. **HeaderSection.svelte**: Displays greeting and quick stats
2. **TodaysFocus.svelte**: Primary action card with checklist
3. **ProgressAnalytics.svelte**: Weekly habit visualization with mood tracking
4. **SmartInsights.svelte**: Displays personalized insights
5. **CommunityPulse.svelte**: Shows global statistics
6. **AchievementPanel.svelte**: Achievement cards (earned/in-progress)
7. **SafetyOptions.svelte**: Pause/adjust pace modals

### Styling

- **dashboard.css**: Dedicated CSS with Tailwind utilities
- Green theme matching main site (`#58cc02`)
- Responsive design with mobile-first approach
- Dark mode support (optional)

## Usage

### Basic Setup

The dashboard automatically loads on mount:

```svelte
<script>
  import { dashboardStore } from './stores/dashboard.svelte';
  
  onMount(async () => {
    await dashboardStore.loadDashboard();
  });
</script>
```

### Progressive Disclosure

Features appear based on user engagement:

```typescript
const config = new DashboardConfig(metadata);

if (config.showAnalytics) {
  // Show progress analytics
}

if (config.showAchievements) {
  // Show achievement panel
}
```

### Data Flow

1. **Initial Load**: `dashboardStore.loadDashboard()`
   - Fetches metadata, global stats, and logs in parallel
   - Caches results

2. **Lazy Loading**: Based on engagement
   - Profile loads if user has completed articles
   - Challenges load if user has joined challenges

3. **Refresh**: `dashboardStore.refresh()` forces reload

## Progressive Features

| Feature | Unlocks When |
|---------|-------------|
| Analytics | After 3 days |
| Detailed Analytics | After 14 days + 10 articles |
| Achievements | After 2 articles |
| Community | After 7 days |
| Insights | After 5 articles |
| Social Features | After 14 days |

## Health-First Design Principles

1. **Encouragement over pressure**
   - Never show "days missed"
   - Always show progress from starting point
   - Positive reinforcement language

2. **Progressive disclosure**
   - Features unlock as users are ready
   - No overwhelming initial experience

3. **Sustainable engagement**
   - No guilt-inducing metrics
   - Optional pacing adjustments
   - Pause options available

4. **Psychological safety**
   - "Escape hatches" for pacing
   - Flexible goals
   - No comparative rankings

## File Structure

```
dashboard/
├── +page.svelte              # Main dashboard page
├── dashboard.css             # Dashboard-specific styles
├── README.md                 # This file
├── components/
│   ├── HeaderSection.svelte
│   ├── TodaysFocus.svelte
│   ├── ProgressAnalytics.svelte
│   ├── SmartInsights.svelte
│   ├── CommunityPulse.svelte
│   ├── AchievementPanel.svelte
│   └── SafetyOptions.svelte
├── stores/
│   └── dashboard.svelte.ts   # Centralized data management
└── utils/
    ├── achievements.svelte.ts
    ├── insights.svelte.ts
    ├── dashboard-config.ts
    └── helpers.ts
```

## Performance Considerations

- **Caching**: 5-minute cache for metadata prevents excessive API calls
- **Lazy Loading**: Profile and challenges load only when needed
- **Parallel Requests**: Core data loads in parallel (max 3 calls)
- **CSR Only**: No SSR overhead, pure client-side rendering

## Extending the Dashboard

### Adding a New Component

1. Create component in `components/`
2. Import in `+page.svelte`
3. Add to dashboard grid
4. Update `dashboard-config.ts` if feature requires progressive disclosure

### Adding New Insights

1. Add insight logic to `insights.svelte.ts`
2. Define insight type ('positive' | 'neutral' | 'suggestion')
3. SmartInsights component will automatically render it

### Adding New Achievements

1. Add achievement definition to `achievements.svelte.ts`
2. Define condition and progress calculation
3. AchievementPanel will automatically display it
