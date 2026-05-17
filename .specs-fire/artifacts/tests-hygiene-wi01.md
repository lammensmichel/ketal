# WI-01: Standardize ID Generation & Validation

**Run**: `run-ketal-006`  
**Intent**: `tests-realtime-integration-hygiene`  
**Branch**: `feature/tests-realtime-hygiene`

## Context

Tests were using `Date.now()` or IDs with spaces, causing `document_already_exists` collisions when running tests multiple times.

## Solution

Replace all problematic ID generation with `ID.unique()` from Appwrite SDK, which generates UUID v4 identifiers that are globally unique.

## Files Modified

### 1. `src/app/services/appwrite/realtime-realtime-service.integration.spec.ts`

| Before | After |
|--------|-------|
| ```name: `Updated Room Name ${Date.now()}`,``` | ```name: `Updated Room Name ${ID.unique()}`,``` |
| ```name: `Collection Sub Test ${Date.now()}`,``` | ```name: `Collection Sub Test ${ID.unique()}`,``` |

**Status**: `ID` already imported from `appwrite` (line 4)

### 2. `src/app/services/appwrite/realtime-document-modification.integration.spec.ts`

| Before | After |
|--------|-------|
| ```const testRoomId = `test-close-${Date.now()}`;``` | ```const testRoomId = ID.unique();``` |

**Status**: `ID` already imported from `appwrite` (line 3)

## Import Verification

All files already had `import { ID } from 'appwrite';` — no new imports were needed.

## Build Status

✅ **Build successful** — `npx ng build --configuration development` completed without errors.

Output:
```
Build at: 2026-05-17T06:36:28.134Z - Hash: 7c71ff6f559051a3
✔ Browser application bundle generation complete.
✔ Copying assets complete.
✔ Index html generation complete.
```

## IDs Replaced Summary

| File | Line | Old Pattern | New Pattern |
|------|------|-------------|-------------|
| `realtime-realtime-service.integration.spec.ts` | 90 | `Date.now()` | `ID.unique()` |
| `realtime-realtime-service.integration.spec.ts` | 145 | `Date.now()` | `ID.unique()` |
| `realtime-document-modification.integration.spec.ts` | 234 | `` `test-close-${Date.now()}` `` | `ID.unique()` |

## Commit

```
FIRE: Standardize ID generation in realtime tests [run-ketal-006-wi-01]
```

## Next Work Item

**WI-02**: Standardize ID Generation in **non-realtime** integration tests

- Search for remaining `Date.now()` usage in `*.integration.spec.ts` files
- Check for IDs with spaces (e.g., `"test room"`, `"game room #1"`)
- Apply `ID.unique()` or `crypto.randomUUID()` where appropriate
- Test compilation + run tests
