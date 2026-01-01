/**
 * Checks if a string is null, undefined, empty, or contains only whitespace.
 * Replaces typescript-string-operations String.isNullOrWhiteSpace()
 *
 * @param value - The string to check
 * @returns true if the value is null, undefined, empty, or whitespace-only
 */
export function isNullOrWhiteSpace(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim().length === 0;
}
