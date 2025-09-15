# UUID Management Scripts

This directory contains scripts for ensuring that all question objects in JSON files have unique UUID identifiers.

## Scripts Overview

### 1. `ensure-unique-uuids.ts`
**Purpose**: Converts non-UUID question IDs to unique UUIDs while preserving existing UUIDs.

**Features**:
- Analyzes current question IDs before making changes
- Only updates questions that don't already have UUIDs (unless `--force` flag is used)
- Ensures all generated UUIDs are unique
- Validates results after processing

**Usage**:
```bash
# Convert non-UUID IDs to UUIDs (preserves existing UUIDs)
npm run ensure:uuids

# Force update all IDs to new UUIDs (including existing UUIDs)
npm run ensure:uuids -- --force
```

### 2. `uuid-validator.ts`
**Purpose**: Analyzes and validates question IDs in JSON files.

**Features**:
- Checks if IDs are valid UUIDs
- Identifies duplicate IDs
- Provides detailed analysis of current state
- Can be used as a standalone validation tool

**Usage**:
```bash
# Analyze the default file (nutrition-essentials.json)
npm run validate:uuids

# Analyze a specific file
npm run validate:uuids path/to/your/file.json
```

## UUID Format

The scripts generate and validate UUIDs in the standard RFC 4122 format:
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

Where:
- `x` is any hexadecimal digit (0-9, a-f)
- `y` is one of 8, 9, a, or b
- The third group starts with 4
- The fourth group starts with 8, 9, a, or b

## Example Output

### Analysis Output
```
🔍 Analyzing question IDs in: ../src/data/content/questions/nutrition-essentials.json

📊 Analysis Results:
  Total questions: 150
  UUID format: 0
  Non-UUID format: 150
  ⚠️  Non-UUID IDs found: 150
    - Question 1: q1-macros-protein-function
    - Question 2: q2-macros-carb-timing
    - Question 3: q3-macros-protein-window
    - Question 4: q4-macros-fat-function
    - Question 5: q5-macros-protein-amount
    ... and 145 more
❌ File needs to be updated to ensure unique UUIDs
```

### Conversion Output
```
🔄 Ensuring unique UUIDs for nutrition-essentials.json...

🔍 Analyzing current question IDs...

Question 1: "q1-macros-protein-function" → "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
Question 2: "q2-macros-carb-timing" → "b2c3d4e5-f6g7-8901-bcde-f23456789012"
Question 3: "q3-macros-protein-window" → "c3d4e5f6-g7h8-9012-cdef-345678901234"
...

✅ Successfully updated questions with unique UUIDs
📁 File updated: ../src/data/content/questions/nutrition-essentials.json

🔍 Validating UUID uniqueness...
✅ All IDs are unique UUIDs!

🎉 All done! The file now contains unique UUIDs for all questions.
```

## Safety Features

1. **Backup**: Always backup your files before running these scripts
2. **Validation**: Scripts validate results after processing
3. **Preservation**: Existing UUIDs are preserved unless `--force` is used
4. **Uniqueness**: Guaranteed unique UUIDs with collision detection
5. **Error Handling**: Comprehensive error handling and reporting

## Integration

These scripts can be integrated into your build process by adding them to your `package.json` scripts:

```json
{
  "scripts": {
    "prebuild": "npm run ensure:uuids",
    "validate:all": "npm run validate:content && npm run validate:uuids"
  }
}
```

## File Structure

The scripts expect question objects to have this structure:
```typescript
interface Question {
  id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  sort_order: number;
  knowledge_base_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
  hints: string[];
  image_urls: string[];
  [key: string]: any; // Additional properties allowed
}
```

## Troubleshooting

### Common Issues

1. **File not found**: Ensure the file path is correct
2. **Invalid JSON**: Check that your JSON file is properly formatted
3. **Permission errors**: Ensure you have write permissions for the target file
4. **Duplicate UUIDs**: The script handles this automatically, but if it occurs, run with `--force`

### Debug Mode

For detailed debugging, you can modify the scripts to include more verbose logging by setting `console.log` statements to show additional information about the processing steps.

# Scripts

This directory contains utility scripts for the fitness game project.

## validate-passage-questions.ts

Validates passage-based questions according to the following rules:

1. **Multiple of 4**: Each group of questions for a knowledge base must be a multiple of 4
2. **Passage consistency**: Each group of 4 questions must have the same `passage_set_id`
3. **ID matching**: The `passage_set_id` must match the corresponding passage ID in the knowledge base
4. **Schema validation**: All questions and knowledge bases must pass their respective schema validation

### Usage

```bash
# Validate only (default)
npx tsx scripts/validate-passage-questions.ts

# Validate and auto-fix issues
npx tsx scripts/validate-passage-questions.ts --force-update
# or
npx tsx scripts/validate-passage-questions.ts -f
```

### Output

The script provides:
- **Summary statistics** of processed questions and validation results
- **Warnings** for valid groups and auto-fix actions
- **Errors** for invalid groups with specific details about what's wrong
- **Auto-fix functionality** when using `--force-update` flag
- **Exit code 0** if all validations pass, **exit code 1** if any errors are found

### Example Output

#### Validation Only
```
🔍 Validating passage-based questions...

📊 SUMMARY:
Total questions processed: 267
Passage-based questions: 124
Knowledge bases checked: 13
Valid groups: 3
Invalid groups: 10

⚠️  WARNINGS:
  Knowledge base f47ac10b-58cc-4372-a567-0e02b2c3d479 in fitness-foundation.json: Valid with 12 passage-based questions across 3 passages

❌ ERRORS:
  Knowledge base 6ba7b810-9dad-11d1-80b4-00c04fd430c8 in fitness-foundation.json: Questions reference passage_set_id taylor-doctor-visit which does not exist in the knowledge base

❌ Validation failed. Use --force-update to attempt automatic fixes.
```

#### With Auto-Fix
```
🔧 Validating and auto-fixing passage-based questions...

📊 SUMMARY:
Total questions processed: 267
Passage-based questions: 124
Knowledge bases checked: 13
Valid groups: 3
Invalid groups: 7
Updated questions: 24
Updated files: 2

⚠️  WARNINGS:
  Knowledge base f47ac10b-58cc-4372-a567-0e02b2c3d479 in fitness-foundation.json: Valid with 12 passage-based questions across 3 passages
  Mapped orphaned passage_set_id "taylor-doctor-visit" to correct passage "d8cfcceb-014f-401d-a386-d4dd96e3c823"
  Updated file: fitness-foundation.json

✅ All passage-based questions are valid!
✅ Auto-fixed 24 questions in 2 files
```

### Validation Rules

For a knowledge base with N passages, the validation ensures:

1. **Total questions = 4 × N** (must be a multiple of 4)
2. **Each passage has exactly 4 questions**
3. **All 4 questions for a passage have the same `passage_set_id`**
4. **The `passage_set_id` matches the passage's `id` in the knowledge base**

Example valid structure:
- Knowledge base has 2 passages: `passage-1` and `passage-2`
- Total passage-based questions: 8 (4 × 2)
- First 4 questions: `passage_set_id = "passage-1"`
- Next 4 questions: `passage_set_id = "passage-2"`

### Auto-Fix Logic

When using `--force-update`, the script will:

1. **Preserve correct mappings**: Questions that already reference valid passage IDs are left unchanged
2. **Map orphaned IDs**: Questions with `passage_set_id` values that don't exist in the knowledge base are mapped to unused passage IDs
3. **Maintain grouping**: The script ensures each passage gets exactly 4 questions
4. **Update files**: Modified question files are automatically saved with the corrected `passage_set_id` values

**Note**: The auto-fix can only work when:
- The total number of questions is a multiple of 4
- The number of passages matches the expected count (questions ÷ 4)
- There are enough unused passage IDs to map orphaned references
