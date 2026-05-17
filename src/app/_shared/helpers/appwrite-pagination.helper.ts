import { Databases, Query } from 'appwrite';

/**
 * Fetches all documents from an Appwrite collection using cursor-based pagination.
 *
 * This helper automatically handles pagination by iterating through pages using
 * the cursorAfter mechanism, ensuring all documents are returned regardless of
 * collection size.
 *
 * @param databases - Appwrite Databases instance
 * @param databaseId - Database ID
 * @param collectionId - Collection ID
 * @param queries - Optional array of Query strings to filter results
 * @returns Promise resolving to an object containing all documents in the collection
 * @throws AppwriteException if the database or collection doesn't exist or permission is denied
 *
 * @example
 * ```typescript
 * const allMembers = await listAllDocuments(
 *   databases,
 *   'fug',
 *   'members',
 *   [Query.equal('roomId', 'room-123')]
 * );
 * ```
 */
export async function listAllDocuments(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  queries?: string[]
): Promise<{ documents: import('appwrite').Models.Document[] }> {
  const allDocuments: import('appwrite').Models.Document[] = [];
  let cursor: string | null = null;

  do {
    // Only add cursor query if we have a valid cursor from previous page
    const pageQueries: string[] = queries
      ? queries.slice() // Make a copy
      : [];

    // Add cursor after the existing queries (if we have one)
    if (cursor) {
      pageQueries.push(Query.cursorAfter(cursor));
    }

    const response = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: pageQueries,
    });

    allDocuments.push(...response.documents);
    cursor = response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : null;
  } while (cursor);

  return { documents: allDocuments };
}
