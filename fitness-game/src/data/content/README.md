# Content Management Directory Structure

This directory contains all static content for the FitJourney game, organized by content type and category.

## Directory Structure

```
src/data/content/
├── categories/           # ContentCategory definitions
├── questions/           # Question content by category
├── passages/            # PassageSet content by category
├── knowledge-base/      # KnowledgeBase articles by category
├── daily-challenges/    # DailyChallenge definitions
├── achievements/        # Achievement definitions
├── user-states/         # UserState definitions
├── streak-types/        # StreakType definitions
├── avatar-assets/       # AvatarAsset definitions
├── schemas/            # Zod validation schemas
├── types/              # TypeScript type definitions
├── utils/              # Content management utilities
└── validation/         # Content validation logic
```

## Content File Naming Convention

- **Categories**: `categories.json`
- **Questions**: `{category-id}.json` (e.g., `equipment.json`, `form.json`)
- **Passages**: `{category-id}-passages.json` (e.g., `equipment-passages.json`)
- **Knowledge Base**: `{category-id}-knowledge.json` (e.g., `equipment-knowledge.json`)
- **Daily Challenges**: `daily-challenges.json`
- **Achievements**: `achievements.json`
- **User States**: `user-states.json`
- **Streak Types**: `streak-types.json`
- **Avatar Assets**: `avatar-assets.json`

## Content Validation

All content files are validated at build time using Zod schemas to ensure:
- Required fields are present
- Data types are correct
- Cross-references are valid
- Business rules are followed

## Content Generation

Content is generated offline using AI tools (Google Gemini) and reviewed by humans before commit.
No runtime content generation to minimize costs and latency.
