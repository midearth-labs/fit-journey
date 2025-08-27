# Content Management System - DAO Architecture

## Overview

This directory contains the refactored content management system using a DAO (Data Access Object) pattern. The new architecture provides better type safety, separation of concerns, and maintainability.

## Architecture

### Base Classes

- **`BaseContentDAO<T>`** - Abstract base class with common functionality:
  - Caching with TTL
  - Basic CRUD operations (getAll, getById, getByIds, getCount, exists)
  - Random selection and shuffling utilities
  - Cache management

- **`BaseFilterableDAO<T>`** - Extends base DAO for content types that support filtering:
  - Category-based filtering
  - Difficulty level filtering
  - Active status filtering
  - Pagination support (limit/offset)

- **`BaseSearchableDAO<T>`** - Extends base DAO for content types that support text search:
  - Text search across multiple fields
  - Category-restricted search
  - Configurable searchable fields

### Specialized DAOs

Each content type has its own specialized DAO that extends the appropriate base class:

- **`ContentCategoryDAO`** - Simple content type, extends `BaseContentDAO`
- **`QuestionDAO`** - Filterable content, extends `BaseFilterableDAO`
- **`KnowledgeBaseDAO`** - Both filterable and searchable, extends `BaseFilterableDAO`
- **`PassageSetDAO`** - Filterable content, extends `BaseFilterableDAO`
- **`AchievementDAO`** - Filterable content, extends `BaseFilterableDAO`
- **`UserStateDAO`** - Ordered content, extends `BaseContentDAO`
- **`AvatarAssetDAO`** - Filterable content, extends `BaseFilterableDAO`
- **`StreakTypeDAO`** - Ordered content, extends `BaseContentDAO`
- **`DailyChallengeDAO`** - Day-based content, extends `BaseContentDAO`

### Factory Pattern

- **`ContentDAOFactory`** - Creates and manages DAO instances:
  - Automatic DAO instantiation based on available content
  - Type-safe DAO retrieval
  - Cache management across all DAOs
  - Statistics and health monitoring

### Refactored Components

- **`ContentDistributor`** - Now orchestrates multiple DAOs instead of handling all content types generically
- **`ContentManagementSystem`** - Updated to work with the new DAO system

## Benefits

1. **Type Safety** - Each DAO knows exactly what type it's working with
2. **Single Responsibility** - Each DAO handles only its content type
3. **Code Reuse** - Common functionality in base classes
4. **Easy Extension** - New content types just need a new DAO
5. **Clean Interfaces** - Each DAO exposes only relevant methods
6. **Better Testing** - Can test each DAO independently
7. **Maintainability** - Clear separation of concerns

## Usage Example

```typescript
// Get a specific DAO
const questionDAO = daoFactory.getDAO('Question') as QuestionDAO;

// Use DAO-specific methods
const easyQuestions = questionDAO.getByDifficulty(1, { categoryId: 'fitness' });
const randomQuestions = questionDAO.getRandom(5);

// Search functionality (if supported)
const searchResults = questionDAO.search('exercise', { limit: 10 });
```

## Migration Notes

The refactoring maintains backward compatibility with the existing `ContentManagementSystem` interface while providing a more robust and maintainable internal architecture.
