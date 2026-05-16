# Plan: fix-ketal-session-positional-args

## Intent ID
`appwrite-fix-ketal-session-positional-args`

## Approach

Convert 4 remaining positional Appwrite `databases.*` calls in `ketal-session.service.ts` to object-form parameters (`{ databaseId, collectionId, documentId?, data?, queries? }`).

The other `createDocument` calls (lines 206-221 and 244-253) are already object-form — confirmed. Only lines 227, 370-374, 376-380, and 382-386 need changing.

## Files to Modify

| File | Change |
|------|--------|
| `src/app/services/ketal-session/ketal-session.service.ts` | 4 positional → object-form conversions |
| `src/app/services/ketal-session/ketal-session.service.spec.ts` | Mock `createDocument` fakeFn destructuring updated for object params |

## Implementation Checklist

- [ ] Line 227: `createDocument(dbId, collId, ID.unique(), data)` → `{ databaseId: dbId, collectionId: collId, documentId: ID.unique(), data }`
- [ ] Lines 370-374: `getDocument(dbId, collId, sessionId)` → `{ databaseId: dbId, collectionId: collId, documentId: sessionId }`
- [ ] Lines 376-380: `listDocuments(dbId, collId, queries)` → `{ databaseId: dbId, collectionId: collId, queries }`
- [ ] Lines 382-386: second `listDocuments` → object-form
- [ ] Update test mock destructuring if tests break

## Tests

Update or verify assertions in `ketal-session.service.spec.ts`. The mocks currently use jasmine.createSpyObj without argument shape assertions; the `createDocument` callFake at line ~142 uses positional destructuring which may need update. Expected: 0 new failures from this change alone. Coverage target: >= 80%.
