import type { ApiRequest } from "$lib/client/api-client";
import type { AllLogKeysType } from "$lib/config/constants";

/**
 * Validation error interface
 */
export type ValidationError = {
	field: string;
	message: string;
}

/**
 * Validation result interface
 */
export type ValidationResult = {
	valid: boolean;
	errors: ValidationError[];
}

/**
 * Challenge form data interface (inferred from API types)
 */
export type ChallengeFormData = ApiRequest['createUserChallenge'];

/**
 * Validate challenge name
 * @param name - Challenge name
 * @returns Validation error or null
 */
export function validateChallengeName(name: string): string | null {
	if (!name || name.trim().length === 0) {
		return 'Challenge name is required';
	}
	
	return null;
}

/**
 * Validate challenge description
 * @param description - Challenge description
 * @returns Validation error or null
 */
export function validateChallengeDescription(description: string): string | null {
	if (!description || description.trim().length === 0) {
		return 'Challenge description is required';
	}
	
	return null;
}

/**
 * Validate log types selection
 * @param logTypes - Array of log types
 * @returns Validation error or null
 */
export function validateLogTypes(logTypes: AllLogKeysType[]): string | null {
	if (!logTypes || logTypes.length === 0) {
		return 'At least one log type must be selected';
	}
	
	return null;
}

/**
 * Validate start date
 * @param startDate - Start date string
 * @returns Validation error or null
 */
export function validateStartDate(startDate: string): string | null {
	if (!startDate) {
		return 'Start date is required';
	}

	return null;
}

/**
 * Validate duration in days
 * @param durationDays - Duration in days
 * @returns Validation error or null
 */
export function validateDuration(durationDays: number): string | null {
	if (!durationDays) {
		return 'Duration is required';
	}

	if (durationDays < 1) {
		return 'Duration must be at least 1 day';
	}

	return null;
}

/**
 * Validate join type
 * @param joinType - Join type
 * @returns Validation error or null
 */
export function validateJoinType(joinType: ChallengeFormData['joinType']): string | null {
	if (!joinType) {
		return 'Challenge join type is required';
	}
	
	return null;
}

/**
 * Validate max members
 * @param maxMembers - Maximum number of members
 * @param joinType - Join type
 * @returns Validation error or null
 */
export function validateMaxMembers(maxMembers: number | undefined): string | null {
	// Max members is only required for public and invite-code challenges
	if (!maxMembers || maxMembers < 1) {
        return 'Maximum members is required';
    }

	if (maxMembers < 1) {
        return 'Maximum members must be at least 1';
    }
	
	return null;
}

/**
 * Validate complete challenge form data
 * @param data - Challenge form data
 * @returns Validation result
 */
export function validateChallengeForm(data: ChallengeFormData): ValidationResult {
	const errors: ValidationError[] = [];
    const pushErrors = (field: string, message: string | null) => {
        if (message) errors.push({ field, message });
    };
	
	// Validate name
	pushErrors('name', validateChallengeName(data.name));
	
	// Validate description
	pushErrors('description', validateChallengeDescription(data.description));
	
	// Validate log types
	pushErrors('logTypes', validateLogTypes(data.logTypes));
	
	// Validate start date
	pushErrors('startDate', validateStartDate(data.startDate));
	
	// Validate duration
	pushErrors('durationDays', validateDuration(data.durationDays));
	
	// Validate join type
	pushErrors('joinType', validateJoinType(data.joinType));
	
	// Validate max members
	pushErrors('maxMembers', validateMaxMembers(data.maxMembers));
	
	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Get validation error for a specific field
 * @param errors - Array of validation errors
 * @param field - Field name
 * @returns Error message or null
 */
export function getFieldError(errors: ValidationError[], field: string): string | null {
	const error = errors.find(e => e.field === field);
	return error ? error.message : null;
}

/**
 * Check if a field has validation errors
 * @param errors - Array of validation errors
 * @param field - Field name
 * @returns Whether the field has errors
 */
export function hasFieldError(errors: ValidationError[], field: string): boolean {
	return errors.some(e => e.field === field);
}
