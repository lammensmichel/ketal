---
id: tests-story-17.1-member-service-completeness
title: Story 17.1 — add member.service tests for getMembersByUserId + updateRoom
status: pending
created: 2026-05-15T11:00:00Z
priority: medium
tag: story-17.1-completion
type: test-gap
---

# Intent: Story 17.1 — add member.service tests for new methods

## Context

Story 17.1 added two methods to `MemberService`:
- `getMembersByUserId(userId)` — query members across rooms by userId (used to find a user's rooms).
- `updateRoom(role)` (or similar — verify signature) — updates `isOnline` and `lastSeenAt` for the current member.

Today `member.service.spec.ts` has 0 references to `getMembersByUserId` (per grep) and only a passing reference to `updateRoom`. The Story 17.1 Phase 7 doc lists tests for both.

## Goal

Add unit tests covering both methods including their main branches and error paths.

## Users

Developers — covers the foundation of "show me my rooms" UX.

## Problem

These methods drive Home and `/rooms` data fetches. Untested means easy regression.

## Success Criteria

`member.service.spec.ts` contains describe blocks for:

- `getMembersByUserId`:
  - Returns matching members for a userId (happy path).
  - Returns `[]` when no members match.
  - Throws / surfaces error when the SDK call fails.
  - Parses `gameStats` JSON if part of the model (consistent with other read paths in the file).
- `updateRoom` (verify exact name — possibly `updateCurrentMember`):
  - Updates `isOnline` and `lastSeenAt` for the current member.
  - Does nothing / throws when there is no current member.
  - Throws when the SDK call fails.

All tests pass. Coverage on the relevant lines is full.

## Constraints

- Follow the existing patterns in `member.service.spec.ts` (uses `jasmine.objectContaining` for v25-style assertions per Story 4).

## Scope

### In-scope

- Extending `src/app/services/member/member.service.spec.ts`.

### Out-of-scope

- Modifying the service implementation.
- Integration tests against a real backend.

## Approach

1. Read the two methods in `member.service.ts` to enumerate branches.
2. Add describe blocks per the success criteria.
3. Use the existing mock setup (`createMockAppwriteService`) — extend if needed.
4. Run the suite.

## Verification

- `npm test` runs new tests green.
- Coverage report: `member.service.ts` lines for these methods all hit.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW. Effort: ~30 min.
