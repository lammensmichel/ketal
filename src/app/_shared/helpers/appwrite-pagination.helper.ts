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

  // Sans limite explicite, Appwrite applique sa valeur par defaut (25), ce qui
  // multiplie inutilement les allers-retours. Les deux specs de MemberService
  // assertent deja la presence de limit=100 : la limite avait donc ete perdue.
  //
  // Si l'appelant fournit sa propre limite, on la traite comme un PLAFOND
  // volontaire et on ne renvoie que cette page — c'est l'usage de FriendService,
  // qui passe Query.limit(20) pour borner une recherche. Paginer par-dessus
  // reviendrait a ignorer le plafond demande.
  const callerSetsLimit = (queries ?? []).some((q) => q.includes('"limit"') || q.includes("'limit'"));
  const pageSize = 100;

  do {
    // Only add cursor query if we have a valid cursor from previous page
    const pageQueries: string[] = queries
      ? queries.slice() // Make a copy
      : [];

    if (!callerSetsLimit) {
      pageQueries.push(Query.limit(pageSize));
    }

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

    // On s'arrete des qu'une page est incomplete, et non seulement quand elle est
    // vide : sans cela un resultat tenant exactement en N pages coute une requete
    // supplementaire a chaque appel. Et si le serveur renvoyait indefiniment la
    // meme page, la boucle ne terminerait jamais.
    const lastPageFull = !callerSetsLimit && response.documents.length === pageSize;
    cursor = lastPageFull ? response.documents[response.documents.length - 1].$id : null;
  } while (cursor);

  return { documents: allDocuments };
}
