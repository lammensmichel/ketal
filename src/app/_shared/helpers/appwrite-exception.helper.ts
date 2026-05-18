import { AppwriteException } from 'appwrite';

/**
 * Check if an error is an AppwriteException instance
 * @param error - Unknown error to check
 * @returns true if error is an AppwriteException
 */
export function isAppwriteException(error: unknown): error is AppwriteException {
  return error instanceof AppwriteException;
}

/**
 * Get the Appwrite error code from an error
 * @param error - Unknown error
 * @returns The error code if available, null otherwise
 */
export function getAppwriteErrorCode(error: unknown): number | null {
  if (isAppwriteException(error)) {
    return error.code;
  }
  // Fallback: some environments serialize Appwrite errors as plain objects with a .code property
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const c = (error as any).code;
    if (typeof c === 'number') {
      return c;
    }
  }
  return null;
}

/**
 * Get the Appwrite error message from an error
 * @param error - Unknown error
 * @returns The error message if available, null otherwise
 */
export function getAppwriteMessage(error: unknown): string | null {
  if (isAppwriteException(error)) {
    return error.message;
  }
  // Fallback: extract .message from any Error-like object (plain Error thrown in tests / catch-all)
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as any).message;
    if (typeof m === 'string') {
      return m;
    }
  }
  return null;
}

/**
 * Get the Appwrite error type from an error
 * @param error - Unknown error
 * @returns The error type if available, null otherwise
 */
export function getAppwriteType(error: unknown): string | null {
  if (isAppwriteException(error)) {
    return error.type;
  }
  return null;
}
