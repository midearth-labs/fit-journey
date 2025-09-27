# UI Artifacts and Components - FitJourney

This document outlines the UI artifacts and components within the `src/lib` directory, focusing on Svelte 5 patterns and modern frontend architecture. This excludes server-side code (`src/lib/server`) and focuses on client-side UI concerns.

## Architecture Overview

The UI layer follows a modern Svelte 5 architecture with:
- **Components**: Reusable UI components using Svelte 5's new syntax
- **Stores**: Reactive state management using Svelte stores
- **Services**: Client-side business logic and data fetching
- **Types**: TypeScript interfaces for type safety
- **Styles**: CSS custom properties and modern styling patterns

## Directory Structure

```
src/lib/
├── components/           # Reusable UI components
│   └── auth/            # Authentication components
├── stores/              # Reactive state management
├── services/            # Client-side business logic
├── types/               # TypeScript type definitions
└── index.ts            # Library exports
```

## Components

### Authentication Components (`components/auth/`)

#### SignInForm.svelte
- **Purpose**: User sign-in form with email/password and Google OAuth
- **Svelte 5 Features**:
  - Uses `$state()` for reactive variables (`email`, `password`, `loading`, `error`)
  - Form handling with server actions (`action="?/signin"`)
  - Conditional rendering with `{#if}` blocks
  - CSS custom properties for theming

**Key Patterns**:
```svelte
let email = $state('')
let password = $state('')
let loading = $state(false)
let error = $state('')
```

#### SignUpForm.svelte
- **Purpose**: User registration form with additional fields
- **Features**:
  - Inviter code support for referral system
  - Password confirmation validation
  - Display name field (optional)
  - Same OAuth integration as sign-in

**Key Patterns**:
```svelte
interface Props {
  data: {
    inviterCode?: string | null
  }
}
const { data }: Props = $props()
```

## Stores

### Progress Store (`stores/progress.ts`)

**Purpose**: Manages user learning progress and local storage persistence

**Key Features**:
- Tracks completed articles and questions
- Maintains current day and total score
- Category-specific progress tracking
- Browser-only localStorage integration
- Reactive updates with Svelte stores

**API**:
```typescript
interface Progress {
  completedArticles: string[];
  completedQuestions: Array<{ id: string; correct: boolean }>;
  currentDay: number;
  totalScore: number;
  categoryProgress: Record<string, any>;
}

// Store methods
progressStore.load()                    // Load from localStorage
progressStore.save(progress)            // Save to localStorage
progressStore.markArticleCompleted(id)  // Mark article as complete
progressStore.markQuestionCompleted(id, correct) // Track quiz results
```

## Services

### Content Service (`services/content.service.ts`)

**Purpose**: Client-side content management and data fetching

**Key Features**:
- Caching layer for API responses
- Content loading from static JSON files
- Article and question management
- Learning phase organization
- Error handling and fallbacks

**API**:
```typescript
// Content loading
contentService.loadCategories(): Promise<Category[]>
contentService.loadArticles(categoryId): Promise<Article[]>
contentService.loadQuestions(categoryId): Promise<Question[]>

// Article management
contentService.getArticleById(id): Promise<Article | null>
contentService.getQuestionsForArticle(id): Promise<Question[]>

// Learning phases
contentService.getLearningPhases(): Promise<LearningPhase[]>
```

### Fitness Persona Calculator (`services/fitness-persona-calculator.ts`)

**Purpose**: Calculates user fitness persona based on quiz responses

**Key Features**:
- Persona scoring algorithm
- Mutually exclusive tag groups
- Learning path matching
- Result ranking and recommendations

**API**:
```typescript
class FitnessPersonaCalculator {
  scoreQuiz(userAnswers: Map<string, PersonaAnswerOption>): PersonaQuizResult
}
```

## Types

### Content Types (`types/content.ts`)

**Core Interfaces**:
```typescript
interface Article {
  id: string;
  title: string;
  body: string;
  day: number;
  content_category_id: string;
  read_time: number;
  tags: string[];
  lede_image: { path: string; description: string };
  passages?: Array<{ id: string; title: string; passage_text: string }>;
  key_takeaways?: string[];
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'standalone' | 'passage_based';
  options: string[];
  correct_answer_index: number;
  knowledge_base_id: string;
  passage_set_id?: string;
}

interface LearningPhase {
  id: string;
  name: string;
  description: string;
  dayRange: [number, number];
  categories: string[];
  articles: Article[];
}
```

### Fitness Persona Types (`types/fitness-persona-calculator.ts`)

**Key Types**:
```typescript
type PersonaQuizResult = {
  userPersonaScores: Map<PersonaTags, number>;
  rankedPaths: Array<{
    path: LearningPath;
    matchScore: number;
    matchPercentage: number;
  }>;
  primaryPersona: string;
  recommendedPath: LearningPath;
}
```

## Styling System

### CSS Custom Properties (`app.css`)

**Color System**:
- Duolingo-inspired palette with primary green (`#58cc02`)
- Comprehensive neutral grays
- Semantic color tokens (success, warning, danger)
- Dark theme support with `[data-theme="dark"]`

**Design Tokens**:
```css
:root {
  --primary-color: #58cc02;
  --secondary-color: #1cb0f6;
  --accent-color: #ff9600;
  
  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* ... up to --space-24: 6rem */
  
  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Component Styling Patterns

**Common Classes**:
- `.btn` - Base button styles with variants (`.btn-primary`, `.btn-outline`, `.btn-ghost`)
- `.form-group` - Form field containers
- `.card` - Card-based layouts
- `.progress-bar` - Progress indicators
- `.fade-in` - Animation utilities

## Route Components Integration

### Layout Component (`routes/+layout.svelte`)

**Key Features**:
- Theme switching (light/dark)
- Navigation with active state detection
- User authentication state
- Progress store initialization
- Responsive header with user menu

**Svelte 5 Patterns**:
```svelte
let { data, children } = $props();
let { session } = $derived(data);
let theme = $state('light');
```

### Page Components

**Home Page (`routes/+page.svelte`)**:
- Hero section with animated progress ring
- Learning phases grid
- Recent articles carousel
- Statistics dashboard

**Article Page (`routes/article/[id]/+page.svelte`)**:
- Markdown rendering with `marked` library
- Character story passages
- Key takeaways section
- Navigation to quiz

## Static Assets

### Content Structure (`static/content/`)

**Organization**:
```
static/content/
├── categories/          # Category definitions
├── knowledge-base/     # Article content by category
├── questions/          # Quiz questions by category
├── learning-paths/    # Learning path definitions
├── persona-questions/ # Fitness persona quiz
└── avatar-assets/    # Character avatars
```

**Image Assets** (`static/images/`):
- Knowledge base illustrations
- Category icons
- Character avatars
- UI graphics

## API Client Integration

### Client-Side API (`client/api-client.ts`)

**Purpose**: Type-safe API communication with server endpoints

**Features**:
- Zod schema validation
- Request/response type safety
- Error handling
- URL parameter substitution
- Query parameter building

**Usage Pattern**:
```typescript
const apiClient = new ApiClient('/api/v1');
const userProfile = await apiClient.getMyProfile();
```

## Svelte 5 Best Practices

### State Management
- Use `$state()` for component-local reactive state
- Use `$derived()` for computed values
- Use `$props()` for component props with proper typing

### Event Handling
- Prefer `onclick` over `on:click` for simple handlers
- Use server actions for form submissions
- Implement proper loading states

### Styling
- Leverage CSS custom properties for theming
- Use semantic class names
- Implement responsive design patterns
- Support dark/light theme switching

### Performance
- Implement proper caching in services
- Use lazy loading for content
- Optimize image loading
- Minimize bundle size

## Development Guidelines

### Component Creation
1. Use TypeScript interfaces for props
2. Implement proper error boundaries
3. Add loading states for async operations
4. Follow accessibility best practices
5. Use semantic HTML elements

### State Management
1. Keep component state minimal
2. Use stores for cross-component state
3. Implement proper cleanup in `onMount`
4. Use localStorage for persistence when appropriate

### Styling
1. Use CSS custom properties for consistency
2. Implement mobile-first responsive design
3. Follow the established design system
4. Use meaningful class names
5. Support both light and dark themes

## Future Enhancements

### Planned UI Features
- Mobile-optimized navigation
- Progressive Web App capabilities
- Advanced animations and transitions
- Accessibility improvements
- Performance optimizations

### Component Library Expansion
- Reusable form components
- Data visualization components
- Interactive quiz components
- Social sharing components
- Progress tracking widgets

This documentation serves as a guide for developers working on the UI layer of FitJourney, ensuring consistency and maintainability across the codebase.
