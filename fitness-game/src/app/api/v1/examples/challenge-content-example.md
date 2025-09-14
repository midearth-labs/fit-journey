# ChallengeContentService API Examples

This document provides examples of how to use the ChallengeContentService API endpoints.

## Base URL
All endpoints are prefixed with `/api/v1`

## Authentication
All endpoints require authentication. Include the session cookie in your requests.

## Endpoints

### 1. Get All Challenges
**GET** `/api/v1/challenges`

Returns all available challenges.

#### Example Request
```bash
curl -X GET "http://localhost:3090/api/v1/challenges" \
  -H "Cookie: sb-access-token=your-session-token"
```

#### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "30-Day Fitness Journey",
      "description": "Transform your fitness habits in 30 days",
      "durationDays": 30,
      "articles": [
        {
          "knowledgeBaseId": "550e8400-e29b-41d4-a716-446655440001",
          "suggestedDay": 1
        }
      ],
      "habits": ["workout_completed", "ate_clean", "slept_well", "hydrated"]
    }
  ],
  "message": "Challenges retrieved successfully"
}
```

### 2. Get Challenge by ID
**GET** `/api/v1/challenges/{id}`

Returns a specific challenge by its ID.

#### Example Request
```bash
curl -X GET "http://localhost:3090/api/v1/challenges/550e8400-e29b-41d4-a716-446655440000" \
  -H "Cookie: sb-access-token=your-session-token"
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "30-Day Fitness Journey",
    "description": "Transform your fitness habits in 30 days",
    "durationDays": 30,
    "articles": [
      {
        "knowledgeBaseId": "550e8400-e29b-41d4-a716-446655440001",
        "suggestedDay": 1
      }
    ],
    "habits": ["workout_completed", "ate_clean", "slept_well", "hydrated"]
  },
  "message": "Challenge retrieved successfully"
}
```

## Error Responses

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "challengeId",
      "message": "Invalid uuid"
    }
  ]
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "error": "Challenge with ID 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

## TypeScript Usage

```typescript
// Using the API in a React component
import { useState, useEffect } from 'react';

interface Challenge {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  articles: Array<{
    knowledgeBaseId: string;
    suggestedDay: number;
  }>;
  habits: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function ChallengeList() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const response = await fetch('/api/v1/challenges', {
          credentials: 'include', // Include cookies for authentication
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch challenges');
        }
        
        const result: ApiResponse<Challenge[]> = await response.json();
        setChallenges(result.data);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChallenges();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Available Challenges</h2>
      {challenges.map(challenge => (
        <div key={challenge.id}>
          <h3>{challenge.name}</h3>
          <p>{challenge.description}</p>
          <p>Duration: {challenge.durationDays} days</p>
        </div>
      ))}
    </div>
  );
}
```

## Zod Schema Validation

The API automatically validates all requests and responses using Zod schemas:

```typescript
// Request validation example
const GetChallengeByIdRequestSchema = z.object({
  challengeId: UUIDSchema,
});

// Response validation example
const ChallengeApiResponseSchema = ApiResponseSchema(ChallengeResponseSchema);
```

This ensures type safety and consistent data validation across all endpoints.
