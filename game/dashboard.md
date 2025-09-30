# FitJourney Dashboard Implementation Specification (Svelte 5)

## Overview
This document specifies the authenticated user dashboard for FitJourney using Svelte 5, focusing on encouraging sustainable fitness habits without promoting obsessive behaviors. The dashboard prioritizes psychological safety, progressive disclosure, and positive reinforcement.

## Core Design Principles

1. **Encouragement over pressure** - Celebrate progress without shaming gaps
2. **Progressive disclosure** - Show features based on user readiness
3. **Sustainable engagement** - Avoid patterns that encourage obsessive checking
4. **Psychological safety** - Always provide "escape hatches" and adjustment options

## Project Structure
```
app/
├── dashboard/
│   ├── +page.svelte
│   ├── +page.server.ts
│   ├── components/
│   │   ├── HeaderSection.svelte
│   │   ├── TodaysFocus.svelte
│   │   ├── ProgressAnalytics.svelte
│   │   ├── SmartInsights.svelte
│   │   ├── CommunityPulse.svelte
│   │   ├── AchievementPanel.svelte
│   │   ├── NudgeContainer.svelte
│   │   └── SafetyOptions.svelte
│   └── utils/
│       ├── achievements.svelte.ts
│       ├── insights.svelte.ts
│       └── dashboard-config.ts
```

## API Client Setup

```typescript
// app/lib/api-client.ts
import ApiClient from '$lib/server/api-client';

export function createApiClient(fetch?: typeof window.fetch) {
  return new ApiClient('/api/v1', {
    'Content-Type': 'application/json'
  });
}
```

## Server-Side Data Loading

```typescript
// app/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { createApiClient } from '$lib/api-client';
import { getSevenDaysAgo, getToday } from '$lib/utils/dates';

export const load: PageServerLoad = async ({ fetch, cookies }) => {
  const client = createApiClient(fetch);
  
  try {
    // Load critical data in parallel (3 calls maximum)
    const [metadata, globalStats, recentLogs] = await Promise.all([
      client.getMyMetadata(),
      client.getGlobalStatistics(),
      client.listLogs({
        fromDate: getSevenDaysAgo(),
        toDate: getToday()
      })
    ]);
    
    return {
      metadata,
      globalStats,
      recentLogs,
      // These will be lazy-loaded client-side
      profile: null,
      challenges: null,
      articles: null
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    return {
      error: 'Failed to load dashboard data',
      metadata: null,
      globalStats: null,
      recentLogs: []
    };
  }
};
```

## Main Dashboard Component

```svelte
<!-- app/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { createApiClient } from '$lib/api-client';
  import HeaderSection from './components/HeaderSection.svelte';
  import TodaysFocus from './components/TodaysFocus.svelte';
  import ProgressAnalytics from './components/ProgressAnalytics.svelte';
  import SmartInsights from './components/SmartInsights.svelte';
  import CommunityPulse from './components/CommunityPulse.svelte';
  import AchievementPanel from './components/AchievementPanel.svelte';
  import NudgeContainer from './components/NudgeContainer.svelte';
  import SafetyOptions from './components/SafetyOptions.svelte';
  import { DashboardConfig } from './utils/dashboard-config';
  import { AchievementCalculator } from './utils/achievements.svelte';
  import { InsightGenerator } from './utils/insights.svelte';
  
  let { data } = $props();
  
  // Reactive state using $state rune
  let dashboardConfig = $state(new DashboardConfig(data.metadata));
  let achievements = $state<Achievement[]>([]);
  let insights = $state<Insight[]>([]);
  let profile = $state(null);
  let challenges = $state(null);
  
  const apiClient = createApiClient();
  const achievementCalc = new AchievementCalculator();
  const insightGen = new InsightGenerator();
  
  // Calculate derived data
  $effect(() => {
    if (data.metadata) {
      achievements = achievementCalc.calculate(data.metadata);
      insights = insightGen.generate(data.metadata, data.recentLogs);
    }
  });
  
  // Lazy load additional data based on user engagement
  onMount(async () => {
    if (data.metadata?.articlesCompletedCount > 0) {
      profile = await apiClient.getMyProfile();
    }
    
    if (data.metadata?.challengesJoinedCount > 0) {
      challenges = await apiClient.listChallengesJoinedByUser({ limit: 5 });
    }
  });
  
  // Calculate today's focus
  const todaysFocus = $derived.by(() => {
    if (!data.metadata) return null;
    
    const lastActivityDate = new Date(data.metadata.lastActivityAt);
    const today = new Date();
    const hoursSinceActivity = (today - lastActivityDate) / (1000 * 60 * 60);
    
    // Priority logic for primary action
    if (hoursSinceActivity > 24) {
      return {
        type: 'article',
        title: 'Start with a quick read',
        estimatedMinutes: 5,
        actionButton: 'Read Now'
      };
    }
    
    if (data.recentLogs.length === 0 && today.getHours() > 12) {
      return {
        type: 'habit',
        title: 'Log today\'s habits',
        estimatedMinutes: 2,
        actionButton: 'Quick Check-in'
      };
    }
    
    return {
      type: 'article',
      title: 'Continue your learning journey',
      estimatedMinutes: 10,
      actionButton: 'Next Article'
    };
  });
</script>

{#if data.error}
  <div class="error-fallback">
    <p>{data.error}</p>
    <button onclick={() => location.reload()}>Try Again</button>
  </div>
{:else}
  <div class="dashboard">
    <HeaderSection 
      metadata={data.metadata}
      {profile}
    />
    
    <main class="dashboard-grid">
      <TodaysFocus 
        focus={todaysFocus}
        metadata={data.metadata}
      />
      
      {#if dashboardConfig.showAnalytics}
        <ProgressAnalytics 
          logs={data.recentLogs}
          metadata={data.metadata}
          detailed={dashboardConfig.showDetailedAnalytics}
        />
      {/if}
      
      {#if dashboardConfig.showInsights}
        <SmartInsights {insights} />
      {/if}
      
      {#if dashboardConfig.showCommunity}
        <CommunityPulse 
          globalStats={data.globalStats}
          anonymous={!dashboardConfig.showSocialFeatures}
        />
      {/if}
      
      {#if dashboardConfig.showAchievements}
        <AchievementPanel {achievements} />
      {/if}
    </main>
    
    <NudgeContainer metadata={data.metadata} logs={data.recentLogs} />
    <SafetyOptions />
  </div>
{/if}

<style>
  .dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
  
  .error-fallback {
    text-align: center;
    padding: 2rem;
  }
</style>
```

## Component Examples

### HeaderSection Component

```svelte
<!-- app/dashboard/components/HeaderSection.svelte -->
<script lang="ts">
  import { getTimeBasedGreeting } from '$lib/utils/greetings';
  
  let { metadata, profile } = $props();
  
  const greeting = $derived(getTimeBasedGreeting());
  const daysActive = $derived.by(() => {
    if (!metadata?.createdAt) return 0;
    const created = new Date(metadata.createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  });
</script>

<header class="dashboard-header">
  <div class="greeting-section">
    <h1>{greeting}!</h1>
    <p class="subtitle">
      {#if daysActive > 0}
        Day {daysActive} of your journey
      {:else}
        Welcome to your fitness journey
      {/if}
    </p>
  </div>
  
  <div class="quick-stats">
    {#if metadata}
      <div class="stat">
        <span class="stat-value">{metadata.articlesCompletedCount}</span>
        <span class="stat-label">Articles</span>
      </div>
      <div class="stat">
        <span class="stat-value">{metadata.challengesJoinedCount}</span>
        <span class="stat-label">Challenges</span>
      </div>
    {/if}
  </div>
  
  {#if profile?.avatarGender}
    <div class="avatar">
      <!-- Avatar component here -->
    </div>
  {/if}
</header>

<style>
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    color: white;
  }
  
  .quick-stats {
    display: flex;
    gap: 2rem;
  }
  
  .stat {
    text-align: center;
  }
  
  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .stat-label {
    font-size: 0.875rem;
    opacity: 0.9;
  }
</style>
```

### TodaysFocus Component

```svelte
<!-- app/dashboard/components/TodaysFocus.svelte -->
<script lang="ts">
  import { createApiClient } from '$lib/api-client';
  
  let { focus, metadata } = $props();
  
  let checklist = $state([
    { id: 'read', label: 'Read today\'s article', completed: false, optional: false },
    { id: 'quiz', label: 'Take the quiz', completed: false, optional: true },
    { id: 'log', label: 'Log your habits', completed: false, optional: false }
  ]);
  
  const progress = $derived(
    (checklist.filter(item => item.completed).length / 
     checklist.filter(item => !item.optional).length) * 100
  );
  
  async function handlePrimaryAction() {
    const client = createApiClient();
    // Navigate to appropriate action
    if (focus?.type === 'article') {
      window.location.href = '/app/articles/next';
    } else if (focus?.type === 'habit') {
      // Open habit logging modal
    }
  }
</script>

<div class="focus-card">
  <h2>Today's Focus</h2>
  
  {#if focus}
    <div class="primary-action">
      <h3>{focus.title}</h3>
      <p class="time-estimate">{focus.estimatedMinutes} minutes</p>
      <button class="action-button" onclick={handlePrimaryAction}>
        {focus.actionButton}
      </button>
    </div>
  {/if}
  
  <div class="checklist">
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
    
    {#each checklist as item}
      <label class="checklist-item">
        <input 
          type="checkbox" 
          bind:checked={item.completed}
          disabled={item.optional && !item.completed}
        />
        <span class:optional={item.optional}>{item.label}</span>
      </label>
    {/each}
  </div>
  
  <p class="encouragement">
    {#if progress === 0}
      Start with just one thing today!
    {:else if progress < 100}
      You're making progress!
    {:else}
      Amazing! You completed today's goals!
    {/if}
  </p>
</div>

<style>
  .focus-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .primary-action {
    text-align: center;
    padding: 2rem 0;
  }
  
  .action-button {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 24px;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .action-button:hover {
    transform: translateY(-2px);
  }
  
  .progress-bar {
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    margin: 1rem 0;
  }
  
  .progress-fill {
    height: 100%;
    background: #667eea;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .checklist-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
  }
  
  .optional {
    opacity: 0.7;
  }
</style>
```

### ProgressAnalytics Component with Mood Tracking

```svelte
<!-- app/dashboard/components/ProgressAnalytics.svelte -->
<script lang="ts">
  let { logs, metadata, detailed } = $props();
  
  // Process logs into weekly habit data
  const weeklyHabits = $derived.by(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    return last7Days.map(date => {
      const log = logs.find(l => l.logDate === date);
      return {
        date,
        movement: log?.values?.dailyMovement || false,
        nutrition: log?.values?.cleanEating || false,
        sleep: log?.values?.sleepQuality || false,
        hydration: log?.values?.hydration || false,
        mood: log?.values?.moodCheck || null,
        energy: log?.values?.energyLevel || null
      };
    });
  });
  
  const activeDays = $derived(
    weeklyHabits.filter(day => 
      day.movement || day.nutrition || day.sleep || day.hydration
    ).length
  );
  
  const moodTrend = $derived.by(() => {
    const moods = weeklyHabits
      .filter(day => day.mood !== null)
      .map(day => day.mood);
    
    if (moods.length === 0) return null;
    
    const average = moods.reduce((a, b) => a + b, 0) / moods.length;
    const trend = moods.length > 1 
      ? moods[moods.length - 1] - moods[0]
      : 0;
    
    return { average, trend, count: moods.length };
  });
</script>

<div class="analytics-card">
  <h2>Your Week</h2>
  
  <div class="habit-grid">
    {#each weeklyHabits as day}
      <div class="day-column">
        <div class="day-label">
          {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
        </div>
        <div class="habit-dots">
          <div class="dot" class:active={day.movement} title="Movement">🏃</div>
          <div class="dot" class:active={day.nutrition} title="Nutrition">🥗</div>
          <div class="dot" class:active={day.sleep} title="Sleep">😴</div>
          <div class="dot" class:active={day.hydration} title="Hydration">💧</div>
        </div>
        {#if day.mood}
          <div class="mood-indicator" title="Mood: {day.mood}/5">
            {['😔', '😐', '🙂', '😊', '😄'][day.mood - 1]}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <div class="summary">
    <p class="positive-message">
      {#if activeDays === 0}
        Ready to start fresh this week!
      {:else if activeDays < 3}
        {activeDays} active {activeDays === 1 ? 'day' : 'days'} - building momentum!
      {:else if activeDays < 6}
        {activeDays} active days - great consistency!
      {:else}
        {activeDays} active days - outstanding week!
      {/if}
    </p>
    
    {#if moodTrend && moodTrend.count >= 3}
      <p class="mood-insight">
        {#if moodTrend.trend > 0}
          Your mood is trending upward! 📈
        {:else if moodTrend.average >= 3}
          You're maintaining good energy levels
        {:else}
          Remember: rest is part of progress too
        {/if}
      </p>
    {/if}
  </div>
  
  {#if detailed && metadata}
    <div class="detailed-stats">
      <h3>Personal Bests</h3>
      <ul>
        <li>Most articles in a week: {metadata.bestWeekArticles || 0}</li>
        <li>Most consistent habit: {metadata.strongestHabit || 'Movement'}</li>
      </ul>
    </div>
  {/if}
</div>

<style>
  .analytics-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .habit-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin: 1.5rem 0;
  }
  
  .day-column {
    text-align: center;
  }
  
  .day-label {
    font-size: 0.75rem;
    color: #6c757d;
    margin-bottom: 0.5rem;
  }
  
  .habit-dots {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: all 0.3s;
  }
  
  .dot.active {
    background: #667eea;
    transform: scale(1.1);
  }
  
  .mood-indicator {
    margin-top: 0.5rem;
    font-size: 1.25rem;
  }
  
  .positive-message {
    color: #667eea;
    font-weight: 500;
    text-align: center;
  }
</style>
```

### Achievement Calculator (Svelte 5 Class)

```typescript
// app/dashboard/utils/achievements.svelte.ts
export class AchievementCalculator {
  private achievements = [
    // Micro achievements
    { 
      id: 'first_steps',
      name: 'First Steps',
      description: 'Complete your first article',
      condition: (m: UserMetadata) => m.articlesCompletedCount >= 1,
      progress: (m: UserMetadata) => Math.min(1, m.articlesCompletedCount)
    },
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Pass 3 quizzes',
      condition: (m: UserMetadata) => m.quizzesPassedCount >= 3,
      progress: (m: UserMetadata) => m.quizzesPassedCount / 3
    },
    {
      id: 'habit_builder',
      name: 'Habit Builder',
      description: 'Log habits for 7 days',
      condition: (m: UserMetadata) => m.daysLogged >= 7,
      progress: (m: UserMetadata) => m.daysLogged / 7
    },
    {
      id: 'community_helper',
      name: 'Community Helper',
      description: 'Answer your first question',
      condition: (m: UserMetadata) => m.questionsAnsweredCount >= 1,
      progress: (m: UserMetadata) => Math.min(1, m.questionsAnsweredCount)
    },
    // Hidden achievements
    {
      id: 'perfect_score',
      name: 'Perfectionist',
      description: 'Get a perfect quiz score',
      condition: (m: UserMetadata) => m.perfectScoreCount >= 1,
      progress: (m: UserMetadata) => 1,
      hidden: true
    }
  ];
  
  calculate(metadata: UserMetadata): Achievement[] {
    return this.achievements
      .filter(a => !a.hidden || a.condition(metadata))
      .map(achievement => ({
        ...achievement,
        earned: achievement.condition(metadata),
        progress: achievement.progress(metadata),
        progressPercentage: Math.round(achievement.progress(metadata) * 100)
      }));
  }
  
  getNewAchievements(oldMetadata: UserMetadata, newMetadata: UserMetadata): string[] {
    const oldEarned = this.achievements.filter(a => a.condition(oldMetadata));
    const newEarned = this.achievements.filter(a => a.condition(newMetadata));
    return newEarned
      .filter(a => !oldEarned.includes(a))
      .map(a => a.id);
  }
}
```

### Dashboard Configuration

```typescript
// app/dashboard/utils/dashboard-config.ts
export class DashboardConfig {
  constructor(private metadata: UserMetadata | null) {}
  
  get accountAgeDays(): number {
    if (!this.metadata?.createdAt) return 0;
    const created = new Date(this.metadata.createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  }
  
  get engagementLevel(): number {
    return this.metadata?.articlesCompletedCount || 0;
  }
  
  get showAnalytics(): boolean {
    return this.accountAgeDays > 3;
  }
  
  get showDetailedAnalytics(): boolean {
    return this.accountAgeDays > 14 && this.engagementLevel > 10;
  }
  
  get showAchievements(): boolean {
    return this.engagementLevel > 2;
  }
  
  get showCommunity(): boolean {
    return this.accountAgeDays > 7;
  }
  
  get showInsights(): boolean {
    return this.engagementLevel > 5;
  }
  
  get showSocialFeatures(): boolean {
    return this.accountAgeDays > 14;
  }
  
  get showChallenges(): boolean {
    return this.accountAgeDays > 7 || (this.metadata?.challengesJoinedCount || 0) > 0;
  }
  
  get showCalendarIntegration(): boolean {
    return this.accountAgeDays > 21;
  }
}
```

### Safety Options Component

```svelte
<!-- app/dashboard/components/SafetyOptions.svelte -->
<script lang="ts">
  let showPauseModal = $state(false);
  let showAdjustModal = $state(false);
  
  function pauseJourney() {
    // API call to pause
    showPauseModal = true;
  }
  
  function adjustPace() {
    showAdjustModal = true;
  }
</script>

<div class="safety-container">
  <button class="safety-link" onclick={() => showAdjustModal = true}>
    Need to adjust your pace?
  </button>
  <button class="safety-link" onclick={() => showPauseModal = true}>
    Taking a break is okay
  </button>
</div>

{#if showPauseModal}
  <div class="modal">
    <div class="modal-content">
      <h3>Pause Your Journey</h3>
      <p>Your progress is saved. Come back whenever you're ready.</p>
      <button onclick={() => showPauseModal = false}>Cancel</button>
      <button onclick={pauseJourney}>Confirm Pause</button>
    </div>
  </div>
{/if}

{#if showAdjustModal}
  <div class="modal">
    <div class="modal-content">
      <h3>Adjust Your Pace</h3>
      <label>
        <input type="radio" name="pace" value="lighter" />
        Lighter schedule (5 min/day)
      </label>
      <label>
        <input type="radio" name="pace" value="habits" />
        Focus on habits only
      </label>
      <label>
        <input type="radio" name="pace" value="reading" />
        Just reading, no quizzes
      </label>
      <button onclick={() => showAdjustModal = false}>Apply Changes</button>
    </div>
  </div>
{/if}

<style>
  .safety-container {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e9ecef;
    text-align: center;
    opacity: 0.7;
  }
  
  .safety-link {
    background: none;
    border: none;
    color: #6c757d;
    text-decoration: underline;
    cursor: pointer;
    margin: 0 1rem;
    font-size: 0.875rem;
  }
  
  .safety-link:hover {
    color: #667eea;
  }
  
  .modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
  }
</style>
```

## Performance Optimizations

```typescript
// app/dashboard/stores/dashboard.svelte.ts
import { writable, derived } from 'svelte/store';

class DashboardStore {
  #metadata = $state(null);
  #globalStats = $state(null);
  #logs = $state([]);
  #lastFetch = $state(null);
  
  // Cache durations
  readonly METADATA_CACHE = 5 * 60 * 1000; // 5 minutes
  readonly GLOBAL_CACHE = 30 * 60 * 1000; // 30 minutes
  
  async loadDashboard(force = false) {
    const now = Date.now();
    
    if (!force && this.#lastFetch && (now - this.#lastFetch) < this.METADATA_CACHE) {
      return; // Use cached data
    }
    
    const client = createApiClient();
    
    const [metadata, globalStats, logs] = await Promise.all([
      client.getMyMetadata(),
      client.getGlobalStatistics(),
      client.listLogs({
        fromDate: getSevenDaysAgo(),
        toDate: getToday()
      })
    ]);
    
    this.#metadata = metadata;
    this.#globalStats = globalStats;
    this.#logs = logs;
    this.#lastFetch = now;
  }
  
  get metadata() { return this.#metadata; }
  get globalStats() { return this.#globalStats; }
  get logs() { return this.#logs; }
}

export const dashboardStore = new DashboardStore();
```

## Implementation Checklist

- [ ] Set up API client with proper error handling
- [ ] Create page server load function for SSR data
- [ ] Implement HeaderSection with greeting logic
- [ ] Build TodaysFocus with smart action determination
- [ ] Create ProgressAnalytics with mood tracking via logs
- [ ] Implement client-side achievement calculation
- [ ] Build progressive disclosure configuration class
- [ ] Add safety options with pause/adjust modals
- [ ] Create responsive grid layout
- [ ] Implement lazy loading for secondary data
- [ ] Add celebration animations for achievements
- [ ] Create encouraging empty states
- [ ] Set up caching strategy with stores
- [ ] Add loading states with skeletons
- [ ] Implement error boundaries
- [ ] Add accessibility features (ARIA labels)
- [ ] Test mobile responsiveness
- [ ] Add keyboard navigation support

## Health-Focused Implementation Notes

1. **Never Display**:
   - Days missed or gaps in activity
   - Comparative rankings against others
   - Negative trend indicators
   - "Behind schedule" messaging

2. **Always Display**:
   - Progress from personal starting point
   - Achievements earned (never missing ones)
   - Flexible pacing options
   - Encouragement regardless of activity level

3. **Language Patterns**:
   - "You're building..." not "You failed to..."
   - "When you're ready" not "You must..."
   - "Your journey" not "The required path"
   - "Explore" not "Complete by..."

4. **Mood Tracking**:
   - Optional field in daily logs
   - Used for insights, not as optimization metric
   - Never shown as "low mood days"
   - Only positive correlations highlighted