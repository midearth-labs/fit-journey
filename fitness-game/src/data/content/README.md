# Content Management System

This directory contains the content management system for the FitJourney fitness game. The system manages static content that is loaded at runtime and provides a consistent interface for accessing game content.

## Directory Structure

```
src/data/content/
├── types/              # Type definitions for all content types
├── utils/              # Utility classes and helpers
├── validation/         # Content validation system
├── categories/         # ContentCategory definitions
├── questions/          # Question definitions
├── passages/           # PassageSet definitions
├── knowledge-base/     # KnowledgeBase articles
├── daily-challenges/   # DailyChallenge definitions
├── streak-types/       # StreakType definitions
├── avatar-assets/      # AvatarAsset definitions
└── schemas/            # JSON schemas for validation
```

## Content Types

The system supports the following content types:

- **ContentCategory**: Content categorization and organization
- **Question**: Quiz questions with multiple choice answers
- **PassageSet**: Reading passages with associated questions
- **KnowledgeBase**: Educational articles and fitness knowledge
- **DailyChallenge**: Daily quiz challenges
- **StreakType**: Habit tracking categories
- **AvatarAsset**: User avatar visual assets

## Usage

The content management system is initialized when the application starts and provides access to all game content through a unified interface.

```typescript
// @TODO: Update this to reflect reality
import { ContentManagementSystem } from './content-management-system';

const cms = new ContentManagementSystem();
await cms.initialize();

// Access content through the system
const questions = cms.getContentLoader().getContentList('Question');
const categories = cms.getContentLoader().getContentList('ContentCategory');
```

## Content Loading

Content is loaded from JSON files stored in the repository. Each content type has its own directory containing the JSON files. The system automatically loads all content files and provides them through a consistent API.

## Validation

The content validation system ensures data integrity and consistency across all content types. It validates required fields, data types, and cross-references between content entities.

## Content Generation

Content is generated offline using AI tools and stored as static JSON files. This approach minimizes runtime costs while providing engaging, personalized experiences.
