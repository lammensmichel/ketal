import { Databases, Query } from 'appwrite';

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
