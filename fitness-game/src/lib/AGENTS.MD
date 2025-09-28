# UI Artifacts and Components - FitJourney

This document outlines the UI artifacts and components within the `src/lib` directory, focusing on Svelte 5 patterns and modern frontend architecture. This excludes server-side code (`src/lib/server`) and focuses on client-side UI concerns.

## Architecture Overview

The UI layer follows a modern Svelte 5 architecture with:
- **Components**: Reusable UI components using Svelte 5's new syntax
- **Stores**: Reactive state management using Svelte stores
- **Services**: Client-side business logic and data fetching
- **Types**: TypeScript interfaces for type safety
- **Styles**: CSS custom properties and modern styling patterns

## Design System - Duolingo-Inspired UI/UX

### Core Design Principles

**1. Duolingo-Inspired Color Palette**
- **Primary Green**: `#58cc02` (Duolingo's signature green)
- **Secondary Blue**: `#1cb0f6` (complementary blue)
- **Accent Orange**: `#ff9600` (warning/attention)
- **Success Green**: `#58cc02` (achievements)
- **Danger Red**: `#ff4b4b` (errors)

**2. Typography System**
- **Primary Font**: Poppins (modern, friendly)
- **Secondary Font**: Inter (clean, readable)
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Responsive Sizing**: `clamp()` functions for fluid typography

**3. Spacing Scale**
- **Consistent Scale**: `--space-1` (0.25rem) to `--space-24` (6rem)
- **Grid System**: 8px base unit for consistent spacing
- **Component Padding**: Standardized padding using spacing variables

**4. Border Radius System**
- **Small**: `--radius-sm` (0.375rem) - buttons, inputs
- **Medium**: `--radius-md` (0.5rem) - cards, containers
- **Large**: `--radius-lg` (0.75rem) - large cards
- **Extra Large**: `--radius-xl` (1rem) - hero sections
- **Full**: `--radius-full` (9999px) - pills, badges

**5. Shadow System**
- **Small**: `--shadow-sm` - subtle elevation
- **Medium**: `--shadow-md` - standard cards
- **Large**: `--shadow-lg` - prominent elements
- **Extra Large**: `--shadow-xl` - hero sections
- **2XL**: `--shadow-2xl` - modals, overlays

### Component Design Patterns

**1. Card Components**
```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  transition: all var(--transition-normal);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

**2. Button System**
```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

**3. Form Elements**
```css
.form-group {
  margin-bottom: var(--space-4);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(88, 204, 2, 0.1);
}
```

**4. Progress Indicators**
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width var(--transition-normal);
}
```

### Animation System

**1. Transitions**
- **Fast**: `--transition-fast` (150ms) - hover states
- **Normal**: `--transition-normal` (250ms) - standard interactions
- **Slow**: `--transition-slow` (350ms) - complex animations

**2. Hover Effects**
- **Subtle Lift**: `transform: translateY(-2px)` for buttons
- **Card Elevation**: `transform: translateY(-4px)` for cards
- **Scale Effects**: `transform: scale(1.05)` for icons

**3. Loading States**
- **Spinner**: Rotating border animation
- **Skeleton**: Shimmer effect for loading content
- **Fade In**: `fade-in` class for content appearance

### Responsive Design Patterns

**1. Mobile-First Approach**
```css
/* Base styles for mobile */
.component {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--space-6);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--space-8);
  }
}
```

**2. Grid Systems**
```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
```

## Directory Structure

```
src/lib/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication components
│   └── PersonaQuiz.svelte # Fitness assessment component
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

### PersonaQuiz Component (`components/PersonaQuiz.svelte`)

**Purpose**: Interactive fitness assessment with timer and progress tracking

**Key Features**:
- **60-second timer** with visual countdown
- **Progress bar** showing completion percentage
- **Question navigation** with back/forward controls
- **Results display** with personalized recommendations
- **Error handling** with retry functionality
- **Responsive design** for mobile and desktop

**Svelte 5 Patterns**:
```svelte
let questions: PersonaQuestion[] = $state([]);
let currentQuestion: PersonaQuestion | null = $state(null);
let timeRemaining = $state(60);
let isSubmitting = $state(false);

$: progressPercentage = questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;
```

**Design System Integration**:
- Uses Duolingo color palette (`--primary-color`, `--secondary-color`)
- Implements card-based layout with hover effects
- Follows button system with proper variants
- Uses consistent spacing and typography scale
- Includes loading states and error handling

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

### Persona Quiz Store (`stores/persona-quiz.ts`)

**Purpose**: Manages fitness assessment state and progress

**Key Features**:
- Question progress tracking
- Answer storage and management
- Timer state management
- Results calculation and storage
- Local storage persistence

**API**:
```typescript
interface PersonaQuizProgress {
  currentQuestionIndex: number;
  answers: Record<string, number>;
  isCompleted: boolean;
  result: PersonaQuizResult | null;
  startTime: number | null;
  endTime: number | null;
}

// Store methods
personaQuizStore.startQuiz()           // Initialize quiz
personaQuizStore.answerQuestion(id, index) // Record answer
personaQuizStore.completeQuiz(result)  // Finish quiz
personaQuizStore.goBackToQuestion(index) // Navigate back
```

## Services

### Content Service (`services/content.service.ts`)

**Purpose**: Client-side content management and data fetching

**Key Features**:
- Caching layer for API responses
- Content loading from static JSON files
- Article and question management
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


// Persona quiz
contentService.loadPersonaQuestions(): Promise<PersonaQuestion[]>
contentService.loadLearningPaths(): Promise<LearningPath[]>
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


### Fitness Persona Types (`types/fitness-persona-calculator.ts`)



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
  --primary-dark: #4bb300;
  --primary-light: #7ceb00;
  --secondary-color: #1cb0f6;
  --accent-color: #ff9600;
  --danger-color: #ff4b4b;
  --warning-color: #ffc800;
  --success-color: #58cc02;
  
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
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Component Styling Patterns

**Common Classes**:
- `.btn` - Base button styles with variants (`.btn-primary`, `.btn-outline`, `.btn-ghost`)
- `.form-group` - Form field containers
- `.card` - Card-based layouts
- `.progress-bar` - Progress indicators
- `.fade-in` - Animation utilities

**Utility Classes**:
- `.text-center`, `.text-left`, `.text-right` - Text alignment
- `.mb-0`, `.mb-2`, `.mb-4`, `.mb-6`, `.mb-8` - Margin bottom
- `.mt-0`, `.mt-2`, `.mt-4`, `.mt-6`, `.mt-8` - Margin top
- `.hidden`, `.visible` - Display utilities

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
- **Conversion-focused design** with 60-Second Test as primary CTA
- **Hero section** with test preview and results preview
- **How it works** section with 3-step process
- **Sample content** with guest browsing and conversion prompts
- **Trust signals** section with "No Judgment Zone" messaging
- **Duolingo-inspired styling** with green color palette and card-based layout

**Persona Quiz Page (`routes/persona-quiz/+page.svelte`)**:
- **Welcome section** with feature highlights and assessment preview
- **Quiz integration** with PersonaQuiz component
- **Conversion flow** from assessment to personalized results
- **Consistent design** following the established design system

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
6. **Follow the Duolingo-inspired design system**
7. **Use consistent spacing and color tokens**
8. **Implement proper hover and focus states**

### State Management
1. Keep component state minimal
2. Use stores for cross-component state
3. Implement proper cleanup in `onMount`
4. Use localStorage for persistence when appropriate

### Styling
1. **Use CSS custom properties for consistency**
2. **Follow the established color palette**
3. **Implement mobile-first responsive design**
4. **Use the spacing scale consistently**
5. **Apply proper shadow and border radius values**
6. **Support both light and dark themes**

### Design System Compliance
1. **Always use the primary green (`#58cc02`) for main actions**
2. **Use the secondary blue (`#1cb0f6`) for complementary elements**
3. **Follow the card-based layout pattern**
4. **Implement consistent hover effects**
5. **Use the established typography scale**
6. **Apply proper spacing using CSS custom properties**

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

This documentation serves as a guide for developers working on the UI layer of FitJourney, ensuring consistency and maintainability across the codebase while maintaining the Duolingo-inspired design aesthetic.