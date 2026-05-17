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
