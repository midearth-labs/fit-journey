# UUID Management Solution Summary

## Problem Solved

The `nutrition-essentials.json` file contained question objects with inconsistent ID formats:
- Some questions had descriptive IDs like `q1-macros-protein-function`
- Some questions had UUIDs but they were duplicated across multiple questions
- This created data integrity issues and potential conflicts

## Solution Implemented

### 1. Scripts Created

#### `scripts/ensure-unique-uuids.ts`
- **Purpose**: Converts non-UUID question IDs to unique UUIDs
- **Features**:
  - Analyzes current question IDs before making changes
  - Only updates questions that don't already have UUIDs (unless `--force` flag is used)
  - Ensures all generated UUIDs are unique with collision detection
  - Updates the `updated_at` timestamp for modified questions
  - Validates results after processing
  - Supports force update mode to regenerate all UUIDs

#### `scripts/uuid-validator.ts`
- **Purpose**: Analyzes and validates question IDs in JSON files
- **Features**:
  - Checks if IDs are valid UUIDs using RFC 4122 standard
  - Identifies duplicate IDs
  - Provides detailed analysis of current state
  - Can be used as a standalone validation tool

#### `src/lib/utils/uuid-utils.ts`
- **Purpose**: Reusable UUID utility functions for the codebase
- **Features**:
  - `isValidUUID()` - Validates UUID format
  - `generateUUID()` - Generates new UUIDs
  - `ensureUniqueUUID()` - Ensures uniqueness
  - `validateUUIDs()` - Validates arrays of IDs
  - `convertToUniqueUUIDs()` - Converts arrays to unique UUIDs

### 2. Package.json Scripts Added

```json
{
  "scripts": {
    "ensure:uuids": "tsx scripts/ensure-unique-uuids.ts",
    "validate:uuids": "tsx scripts/uuid-validator.ts"
  }
}
```

### 3. Documentation

- `scripts/README.md` - Comprehensive documentation for the UUID management scripts
- This summary document

## Results Achieved

### Before
```
📊 Analysis Results:
  Total questions: 137
  UUID format: 118
  Non-UUID format: 19
  ❌ Duplicate IDs found: 56
  ⚠️  Non-UUID IDs found: 19
```

### After
```
📊 Analysis Results:
  Total questions: 137
  UUID format: 137
  Non-UUID format: 0
✅ All questions have unique UUIDs!
```

## Usage Examples

### Command Line Usage

```bash
# Analyze current state
npm run validate:uuids

# Convert non-UUID IDs to UUIDs (preserves existing UUIDs)
npm run ensure:uuids

# Force update all IDs to new UUIDs (including existing UUIDs)
npm run ensure:uuids -- --force

# Analyze specific file
npm run validate:uuids path/to/your/file.json
```

### Programmatic Usage

```typescript
import { 
  isValidUUID, 
  generateUUID, 
  ensureUniqueUUID, 
  validateUUIDs 
} from '@/lib/utils/uuid-utils';

// Check if an ID is a valid UUID
const isValid = isValidUUID("550e8400-e29b-41d4-a716-446655440001");

// Generate a new UUID
const newUUID = generateUUID();

// Ensure uniqueness
const existingUUIDs = new Set(["uuid1", "uuid2"]);
const uniqueId = ensureUniqueUUID("duplicate-uuid", existingUUIDs);

// Validate an array of IDs
const validation = validateUUIDs(["uuid1", "uuid2", "invalid-id"]);
```

## Safety Features

1. **Backup Recommendation**: Always backup files before running scripts
2. **Validation**: Scripts validate results after processing
3. **Preservation**: Existing UUIDs are preserved unless `--force` is used
4. **Uniqueness**: Guaranteed unique UUIDs with collision detection
5. **Error Handling**: Comprehensive error handling and reporting
6. **RFC 4122 Compliance**: All UUIDs follow the standard format

## Integration Options

The scripts can be integrated into build processes:

```json
{
  "scripts": {
    "prebuild": "npm run ensure:uuids",
    "validate:all": "npm run validate:content && npm run validate:uuids"
  }
}
```

## UUID Format

All generated UUIDs follow the RFC 4122 standard:
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

Where:
- `x` is any hexadecimal digit (0-9, a-f)
- `y` is one of 8, 9, a, or b
- The third group starts with 4
- The fourth group starts with 8, 9, a, or b

## Files Modified

1. `src/data/content/questions/nutrition-essentials.json` - Updated with unique UUIDs
2. `package.json` - Added new scripts
3. `scripts/ensure-unique-uuids.ts` - Created
4. `scripts/uuid-validator.ts` - Created
5. `scripts/README.md` - Created
6. `src/lib/utils/uuid-utils.ts` - Created
7. `UUID_MANAGEMENT_SUMMARY.md` - This file

## Future Enhancements

1. **Batch Processing**: Process multiple JSON files at once
2. **Database Integration**: Update database records with new UUIDs
3. **Migration Scripts**: Create database migration scripts
4. **API Endpoints**: Add validation endpoints to the API
5. **Monitoring**: Add UUID validation to CI/CD pipelines
