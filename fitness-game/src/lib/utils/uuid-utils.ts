import { randomUUID } from 'crypto';

// UUID regex pattern (RFC 4122)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

/**
 * Checks if an ID is already in UUID format
 */
export function isUUIDFormat(id: string): boolean {
  return isValidUUID(id);
}

/**
 * Generates a unique UUID
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Ensures an ID is a unique UUID, generating a new one if needed
 */
export function ensureUniqueUUID(id: string, existingUUIDs: Set<string>): string {
  // If it's already a valid UUID and not in the existing set, return it
  if (isValidUUID(id) && !existingUUIDs.has(id)) {
    return id;
  }
  
  // Generate a new unique UUID
  let newUUID: string;
  do {
    newUUID = randomUUID();
  } while (existingUUIDs.has(newUUID));
  
  return newUUID;
}

/**
 * Validates that all IDs in an array are unique UUIDs
 */
export function validateUUIDs(ids: string[]): {
  isValid: boolean;
  duplicates: string[];
  nonUuidIds: string[];
  uniqueCount: number;
} {
  const uuidSet = new Set<string>();
  const duplicates: string[] = [];
  const nonUuidIds: string[] = [];
  
  ids.forEach((id, index) => {
    if (!isValidUUID(id)) {
      nonUuidIds.push(`Index ${index}: ${id}`);
    } else if (uuidSet.has(id)) {
      duplicates.push(`Index ${index}: ${id}`);
    } else {
      uuidSet.add(id);
    }
  });
  
  return {
    isValid: duplicates.length === 0 && nonUuidIds.length === 0,
    duplicates,
    nonUuidIds,
    uniqueCount: uuidSet.size
  };
}

/**
 * Converts an array of IDs to unique UUIDs
 */
export function convertToUniqueUUIDs(ids: string[]): string[] {
  const existingUUIDs = new Set<string>();
  const convertedIds: string[] = [];
  
  ids.forEach(id => {
    const uniqueId = ensureUniqueUUID(id, existingUUIDs);
    existingUUIDs.add(uniqueId);
    convertedIds.push(uniqueId);
  });
  
  return convertedIds;
}
