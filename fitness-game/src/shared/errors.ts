export const notFoundCheck = <T>(item: T, itemName: string) => {
  if (!item) {
    throw new ResourceNotFoundError(itemName);
  }
  return item;
}

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ResourceNotFoundError extends BaseError {
  constructor(resource: string) {
    super(`${resource} not found.`);
  }
}

export class AuthorizationError extends BaseError {
  constructor(message: string = 'User is not authorized to perform this action.') {
    super(message);
  }
}

export class ValidationError extends BaseError {}

export class SessionAlreadyCompletedError extends BaseError {
  constructor() {
    super('Session for the current day has already been successfully completed.');
  }
}

export class CrossDaySubmissionError extends ValidationError {
  constructor() {
    super('This session was started on a previous day. Please start a new session.');
  }
}

export class NoRetriesLeftError extends ValidationError {
  constructor() {
    super('No retries are left for this session.');
  }
}


