# Content Management Utilities

This directory contains utility classes and helpers for the Content Management System.

## DAO Classes

The Data Access Object (DAO) pattern is used to provide a consistent interface for accessing different content types:

- **`ContentCategoryDAO`** - Content categories with filtering and sorting
- **`QuestionDAO`** - Questions with category and difficulty filtering
- **`KnowledgeBaseDAO`** - Knowledge base articles with search capabilities
- **`PassageSetDAO`** - Reading passages with category filtering
- **`AvatarAssetDAO`** - Avatar visual assets with demographic filtering
- **`StreakTypeDAO`** - Habit tracking categories with progression logic
- **`DailyChallengeDAO`** - Daily challenges with difficulty distribution

## Base Classes

- **`BaseContentDAO<T>`** - Abstract base class providing common DAO functionality:
  - Generic content type support
  - Caching mechanisms
  - Filtering and sorting
  - Error handling

## Factory Pattern

- **`ContentDAOFactory`** - Creates and manages DAO instances for all content types
  - Centralized DAO creation
  - Consistent interface across content types
  - Easy access to all DAOs

## Content Loader

- **`ContentLoader`** - Handles loading and parsing of static content files
  - Automatic file discovery
  - JSON parsing and validation
  - Memory management and caching

## Usage Examples

### Creating DAOs
```typescript
import { ContentDAOFactory } from './dao-factory';

const factory = new ContentDAOFactory(content);
const questionDAO = factory.getDAO('Question');
const categoryDAO = factory.getDAO('ContentCategory');
```

### Using Base DAO Features
```typescript
import { QuestionDAO } from './daos/question-dao';

const questionDAO = new QuestionDAO(content.Question);

// Get all questions
const allQuestions = questionDAO.getAll();

// Get questions by category
const equipmentQuestions = questionDAO.getByCategory('equipment');

// Get questions by difficulty
const easyQuestions = questionDAO.getByDifficulty(1);
```

### Content Loading
```typescript
import { ContentLoader } from './content-loader';

const loader = await ContentLoader.initialize();
const questions = loader.getContentList('Question');
const categories = loader.getContentMap('ContentCategory');
```

## Architecture Benefits

- **Separation of Concerns**: Each DAO handles a specific content type
- **Code Reuse**: Common functionality in base classes
- **Type Safety**: Full TypeScript support throughout
- **Performance**: Efficient caching and indexing
- **Maintainability**: Clear structure and easy to extend
