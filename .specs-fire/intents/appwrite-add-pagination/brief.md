---
id: appwrite-add-pagination
title: Appwrite — add cursor pagination to list queries
status: pending
created: 2026-05-15T10:30:00Z
priority: medium
---

# Intent: Appwrite — add cursor pagination to list queries

## Context

Several `listDocuments` calls fetch a single page (`Query.limit(100)` or default 25) and assume the entire collection fits. When members or rooms grow past the page size, callers silently see truncated results. The SDK provides `Query.cursorAfter(lastDocId)` for cursor-based pagination.

## Goal

Add a small `listAllDocuments` helper (or inline loop) for the call sites that semantically expect "all matching rows", and leave the genuinely-paginated UI calls alone.

## Users

End users of multiplayer rooms with many members; developers maintaining list endpoints.

## Problem

Today the app silently caps results. A room with >100 members loses members from listings; a user with >100 rooms can't see all of them.

## Success Criteria

- A reusable cursor-pagination helper exists (or is inlined consistently where needed).
- The audited call sites in `member.service.ts:135-139` and any `room.service.ts` listDocuments calls semantically requiring "all" return the full set.
- Unit test added that exercises a >page-size dataset (mocked).

## Constraints

- Keep memory in check: helper must stream / yield, not collect all results in one giant array if downstream can stream.
- No backward-incompatible API change for existing consumers.

## Scope

### In-scope

- `src/app/services/member/member.service.ts:135-139` — `getMembersByRoom`.
- `src/app/services/room/room.service.ts` — review all `listDocuments` calls and classify each as "single page" vs "needs all".
- Generic helper in `src/app/services/appwrite/` (or `_shared/_helpers/`) wrapping the cursor loop.

### Out-of-scope

- Rewriting the data model.
- Adding offset-based pagination (cursor-based is the SDK recommendation).

## Approach

1. Inventory all `databases.listDocuments` calls; mark each "needs-all" or "single-page".
2. Add `listAllDocuments({databaseId, collectionId, queries, pageSize=100})` helper that loops with `Query.cursorAfter` until `documents.length < pageSize`.
3. Switch each "needs-all" call site to the helper.
4. Add a unit test mocking three pages to verify the loop terminates correctly.

## Notes

Audit reference: see report attached to chat thread of 2026-05-15. Risk: MEDIUM (silent data truncation), Effort: ~30 min.
