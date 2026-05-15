---
id: appwrite-fix-ketal-session-positional-args
title: Appwrite — convert ketal-session.service to object-form parameters
status: pending
created: 2026-05-15T10:30:00Z
priority: high
---

# Intent: Appwrite — convert ketal-session.service to object-form parameters

## Context

The Ketal codebase migrated the Appwrite SDK call surface to object-form parameters across `auth.service.ts`, `room.service.ts`, and `member.service.ts` (Stories 2–4 of intent `appwrite-sdk-v25-migration`). Four call sites in `ketal-session.service.ts` were missed and still use positional arguments. The pinned SDK is now `appwrite@^24.2.0` (downgraded from v25 because the message-based realtime protocol in v25 is not yet supported by Appwrite Server 1.9.0). v24 still accepts both forms but the rest of the codebase uses object-form exclusively; the inconsistency is brittle and confusing.

## Goal

Bring the four remaining `databases.*` call sites in `ketal-session.service.ts` to object-form parameters so the whole service surface is uniform and forward-compatible.

## Users

Internal — developers maintaining the Appwrite-backed services.

## Problem

Mixing positional and object-form calls in the same service makes it harder to copy patterns between methods, breaks search/replace assumptions, and reintroduces ordering bugs that the object-form refactor was meant to eliminate.

## Success Criteria

- All `databases.*` calls in `ketal-session.service.ts` use object-form parameters.
- `npx tsc --noEmit -p tsconfig.json` passes.
- Existing `ketal-session.service.spec.ts` continues to pass; mocks updated if assertions break.
- No behaviour change observable from callers.

## Constraints

- SDK pinned to `appwrite@^24.2.0`; do NOT bump.
- Do not introduce TablesDB calls — stay on `databases.*` API for consistency.

## Scope

### In-scope (verified by audit)

- `src/app/services/ketal-session/ketal-session.service.ts:227` — `createDocument` inside `.map()`.
- `src/app/services/ketal-session/ketal-session.service.ts:370-373` — `getDocument(dbId, collId, docId)`.
- `src/app/services/ketal-session/ketal-session.service.ts:376-379` — `listDocuments(dbId, collId, [queries])`.
- `src/app/services/ketal-session/ketal-session.service.ts:382-385` — second `listDocuments(dbId, collId, [queries])`.

### Out-of-scope

- Other Appwrite service migrations.
- Test hygiene fixes (separate intent).

## Approach

1. Read each cited call site, convert to `databases.createDocument({databaseId, collectionId, documentId, data, permissions?})` etc.
2. Run typecheck and the affected spec.
3. If a spec breaks because a mock asserted positional args, switch the assertion to `jasmine.objectContaining({...})`.

## Notes

Audit reference: see report attached to chat thread of 2026-05-15. Risk: HIGH (brittle), Effort: ~15 min.
