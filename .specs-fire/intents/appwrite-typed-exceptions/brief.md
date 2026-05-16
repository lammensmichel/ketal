---
id: appwrite-typed-exceptions
title: Appwrite — type catch blocks as AppwriteException
status: pending
created: 2026-05-15T10:30:00Z
priority: low
---

# Intent: Appwrite — type catch blocks as AppwriteException

## Context

The Appwrite SDK exports `AppwriteException` with structured `.code`, `.type`, and `.response` fields. Several `catch` blocks in the codebase treat errors as `unknown` or `any`, then probe them manually via property access. Using the typed exception makes the intent explicit and prevents silent regressions if the SDK changes its error shape.

## Goal

Catch Appwrite errors as `AppwriteException` and route on `.code`/`.type`, falling back to generic handling for non-Appwrite errors.

## Users

Developers maintaining error-handling paths.

## Problem

Catch blocks currently look like `catch (error: unknown)` followed by ad-hoc `(error as any).code === 404` checks. This is brittle and obscures intent.

## Success Criteria

- Audited catch sites use `instanceof AppwriteException` to gate access to `.code`/`.type`.
- Non-Appwrite errors still flow through (don't swallow them).
- No behaviour change for callers.

## Constraints

- Keep existing user-visible error messages and logs identical.

## Scope

### In-scope

- `src/app/services/room/room.service.ts:242`.
- `src/app/services/ketal-session/ketal-session.service.ts` around lines 268, 327, 361.
- Any other `catch` blocks doing ad-hoc `.code` probing on Appwrite calls — sweep with grep before finishing.

### Out-of-scope

- Reworking error UX or toast messaging.

## Approach

1. `grep -nE "catch \(.*\) \{[^}]*\.code" src/app/services` to find the sites.
2. Import `AppwriteException` from `'appwrite'`.
3. Rewrite `catch (error: unknown) { if ((error as any).code === X) ... }` to:
   ```ts
   catch (error: unknown) {
     if (error instanceof AppwriteException && error.code === X) { ... }
     throw error;
   }
   ```
4. Typecheck + run impacted specs.

## Notes

Audit reference: see report attached to chat thread of 2026-05-15. Risk: LOW, Effort: ~20 min.
