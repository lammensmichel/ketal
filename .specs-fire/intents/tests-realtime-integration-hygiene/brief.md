---
id: tests-realtime-integration-hygiene
title: Tests — fix realtime integration spec hygiene (ID.unique + cleanup)
status: pending
created: 2026-05-15T10:30:00Z
priority: medium
---

# Intent: Tests — fix realtime integration spec hygiene

## Context

After downgrading the SDK to `appwrite@^24.2.0`, the realtime protocol works correctly (0 "Missing channels" errors). The 4 remaining test failures are NOT realtime bugs but hygiene issues in the integration specs themselves:

- IDs are generated from `Date.now()` and reused across runs, causing `409 document_already_exists`.
- One spec builds a documentId with a space character, hitting `400 general_argument_invalid: Invalid documentId`.
- No `afterEach` cleanup, so the database accumulates test garbage.

## Goal

Make the realtime integration tests deterministic, repeatable on a live backend, and self-cleaning.

## Users

Developers running `npm test` against a running Appwrite backend.

## Problem

Re-running the test suite fails noisily on stale documents. The signal-to-noise ratio for "did realtime regress?" is poor.

## Success Criteria

- All realtime integration tests pass on a fresh `npm test` against a live backend.
- Re-running the suite immediately passes again (no stale-ID failures).
- The backend has no leftover `test-*` documents after the suite completes.

## Constraints

- Tests must keep targeting the real backend (these are integration tests by design).
- Cannot mutate production-shaped collections that other tests rely on — clean only what was created in this test.

## Scope

### In-scope

- `src/app/services/appwrite/realtime-document-modification.integration.spec.ts` — uses `Date.now()` IDs and a quoted string with space.
- `src/app/services/appwrite/realtime-ketal-sessions.integration.spec.ts` — same stale-ID pattern.
- Add `afterEach`/`afterAll` to delete created docs.

### Out-of-scope

- Changing the unit tests.
- Rewriting test framework choice.

## Approach

1. Import `ID` from `'appwrite'`; replace any `Date.now()`-based document IDs with `ID.unique()`.
2. Sweep for any documentId containing whitespace or starting with a special char — these violate Appwrite's ID rules.
3. In each `describe` block, track created doc IDs in an array and add `afterEach(async () => { for (const id of created) await databases.deleteDocument({...}); created.length = 0; })`.
4. Run `npm test` twice in a row against a live backend to verify idempotence.

## Notes

Audit reference: see report attached to chat thread of 2026-05-15. Risk: MEDIUM (test reliability), Effort: ~30 min. Once fixed, integration test count should be 4 failed → 0 failed.
