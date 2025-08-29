# Content Generation Approach - Updated Design

## Overview

This document outlines the updated approach for AI-powered content generation in the FitJourney game, ensuring proper content dependencies and natural learning progression.

## Content Generation Order & Dependencies

### Phase 1: Independent Content (No Dependencies)

#### 1.1 ContentCategory Generation
- **Purpose**: Define the 7 main fitness categories
- **Output**: 7 ContentCategory entities
- **Dependencies**: None
- **Context**: Basic fitness domain knowledge

#### 1.2 AvatarAsset Generation  
- **Purpose**: Create visual assets for different fitness levels
- **Output**: Avatar assets for fitness levels -5 to +5
- **Dependencies**: None
- **Context**: Fitness level ranges and visual representation

#### 1.3 StreakType Generation
- **Purpose**: Define habit tracking categories
- **Output**: Habit categories for streak management
- **Dependencies**: None
- **Context**: Fitness habit patterns

### Phase 2: Primary Dependencies (ContentCategory Context)

#### 2.1 KnowledgeBase Generation
- **Purpose**: Create educational content for each fitness category
- **Output**: Multi-part KnowledgeBase articles per category
- **Dependencies**: ContentCategory (for context)
- **Structure**: 
  - Part 1: Introduction and fundamentals
  - Part 2: Intermediate concepts
  - Part 3: Advanced topics
  - Part 4: Practical applications
  - Part 5: Expert insights
- **Context**: Full ContentCategory definition + fitness education best practices

### Phase 3: Secondary Dependencies (KnowledgeBase Parts + ContentCategory)

#### 3.1 PassageSet Generation
- **Purpose**: Create reading passages aligned with KnowledgeBase parts
- **Output**: 20+ passages per category, aligned with KnowledgeBase progression
- **Dependencies**: 
  - Primary: Specific KnowledgeBase part
  - Secondary: Previous KnowledgeBase parts for continuity
  - Tertiary: ContentCategory definition
- **Context**: 
  - Full KnowledgeBase part content
  - Previous KnowledgeBase parts for progression
  - ContentCategory for overall theme

#### 3.2 Standalone Question Generation
- **Purpose**: Create questions that test KnowledgeBase understanding
- **Output**: 50+ questions per category, linked to KnowledgeBase parts
- **Dependencies**:
  - Primary: Specific KnowledgeBase part
  - Secondary: ContentCategory definition
- **Context**:
  - Full KnowledgeBase part content
  - ContentCategory for difficulty and theme
- **Difficulty Distribution**: 3 easy, 4 medium, 3 hard per part

### Phase 4: Tertiary Dependencies (Passage + KnowledgeBase + ContentCategory)

#### 4.1 Passage-based Question Generation
- **Purpose**: Create questions that test passage comprehension
- **Output**: 3-5 questions per passage
- **Dependencies**:
  - Primary: Associated Passage
  - Secondary: Related KnowledgeBase parts
  - Tertiary: ContentCategory definition
- **Context**:
  - Full Passage content
  - Related KnowledgeBase parts for learning objectives
  - ContentCategory for overall context

### Phase 5: Final Integration (All Content Types)

#### 5.1 DailyChallenge Generation
- **Purpose**: Create daily challenges using available content
- **Output**: 30+ daily challenges with proper structure
- **Dependencies**: All previous content types
- **Context**: 
  - Sample Questions and Passages
  - ContentCategory themes
  - Difficulty balancing

## LLM Prompt Engineering Strategy

### Prompt Structure for Each Content Type

#### Independent Content Prompts
- Clear entity definition and requirements
- Expected response structure (JSON schema)
- Example output format
- Questions for user clarification

#### Dependent Content Prompts
- **Primary Context**: Full definition of primary dependency
- **Secondary Context**: Relevant secondary dependencies
- **Tertiary Context**: Overall category context
- **Progression Instructions**: How content should build upon previous parts
- **Relationship Guidelines**: How to maintain content connections

### Example: PassageSet Generation Prompt

```
Generate a PassageSet for fitness category "{category_name}".

PRIMARY CONTEXT:
- KnowledgeBase Part {N}: {full_part_content}
- Learning objectives: {objectives}

SECONDARY CONTEXT:
- Previous KnowledgeBase Parts: {summary_of_parts_1_to_N-1}
- Overall progression: {how_part_N_fits_in_sequence}

TERTIARY CONTEXT:
- ContentCategory: {full_category_definition}
- Fitness domain: {domain_context}

REQUIREMENTS:
- Passage should directly support KnowledgeBase Part {N} learning objectives
- Maintain continuity with previous parts
- Include 3-5 comprehension questions
- Reading level: {specified_level}
- Estimated read time: {specified_time}

OUTPUT FORMAT: {JSON_schema}
```

## Content Validation Strategy

### Build-Time Validation
1. **Schema Validation**: All content must pass Zod schema validation
2. **Reference Validation**: All cross-references must point to existing entities
3. **Progression Validation**: KnowledgeBase parts must maintain sequential order
4. **Relationship Validation**: Content relationships must maintain integrity
5. **Business Rule Validation**: Content must follow fitness education best practices

### Content Integrity Checks
- KnowledgeBase parts are numbered sequentially
- PassageSet references valid KnowledgeBase parts
- Questions reference valid content (KnowledgeBase parts or Passages)
- DailyChallenge references valid Questions and Passages
- All content maintains proper categorization

## Benefits of This Approach

### 1. Natural Learning Progression
- Content builds upon previous knowledge systematically
- Users progress through fitness concepts logically
- Knowledge retention improves through structured learning

### 2. Content Coherence
- All content within a category maintains thematic consistency
- Passages directly support KnowledgeBase learning objectives
- Questions test comprehension of specific content

### 3. Maintainability
- Clear dependency relationships make content updates easier
- Content generation follows predictable patterns
- Validation ensures content integrity

### 4. Scalability
- Multi-part structure allows for comprehensive topic coverage
- New content can be added following established patterns
- Content relationships scale with content volume

## Implementation Notes

### Content Generation Scripts
- Scripts must be executed in dependency order
- Each script validates its dependencies before generation
- Generated content is validated before proceeding to next phase

### Content Storage
- All content stored as JSON files in repository
- File naming follows dependency structure
- Content relationships maintained through explicit references

### Build Process
- Content validation runs before build completion
- Build fails if content integrity issues detected
- Content relationships validated during build process

This approach ensures that the FitJourney game delivers high-quality, coherent fitness education content that follows natural learning progression while maintaining technical integrity and scalability.
