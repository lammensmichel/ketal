---
id: appwrite-channel-builder
title: Appwrite — use Channel builder instead of manual channel strings
status: pending
created: 2026-05-15T10:30:00Z
priority: low
---

# Intent: Appwrite — use Channel builder instead of manual channel strings

## Context

The Appwrite Web SDK exposes a `Channel` builder class (`Channel.tablesdb('db').table('id').row('id')`) that produces channel strings the realtime server expects. Confirmed exported from `appwrite@24.2.0` types (`types/index.d.ts: export { Channel } from './channel'`). The Ketal code currently builds channels by hand-concatenating strings, which is fragile to format changes.

## Goal

Replace the manual `tablesdb.${DB}.tables.${ID}.rows[.${ROW}]` string construction with the `Channel` builder so any future format change in the SDK propagates automatically.

## Users

Developers maintaining realtime subscription wiring.

## Problem

Hard-coded channel string format duplicates SDK knowledge in our code. If Appwrite renames the path (e.g. drops `tablesdb` for `tables`), we'd miss it silently — the SDK would still build correct strings.

## Success Criteria

- `buildDocumentChannel` and `buildCollectionChannel` in `realtime.service.ts` delegate to `Channel.tablesdb(...).table(...).row(...)`.
- All call sites continue to receive a `string` channel.
- Existing realtime unit and integration tests pass.

## Constraints

- Keep the helper signatures (`buildDocumentChannel(collectionId, documentId)`, `buildCollectionChannel(collectionId)`) so call sites don't change.
- `Channel` is a SDK runtime class — confirm it stringifies via `.toString()` before storing.

## Scope

### In-scope

- `src/app/services/realtime/realtime.service.ts:220-226` — `buildDocumentChannel`, `buildCollectionChannel`.
- Integration spec channel literals — leave as raw strings (they're test fixtures asserting the wire format).

### Out-of-scope

- Channel filtering by event (`.create`/`.update`/`.delete`) — those are payload-side filters, not channel suffixes here.

## Approach

1. Import `Channel` from `'appwrite'`.
2. Rewrite:
   ```ts
   buildDocumentChannel(collId, docId) {
     return Channel.tablesdb(DATABASE_ID).table(collId).row(docId).toString();
   }
   ```
3. Same for collection-level.
4. Run typecheck + realtime specs.

## Notes

Audit reference: see report attached to chat thread of 2026-05-15. Risk: LOW, Effort: ~10 min. Value: future-proofing.
