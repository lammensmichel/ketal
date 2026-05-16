---
id: tests-story-17.1-room-tile-component
title: Story 17.1 — create room-tile.component.spec.ts (file is missing)
status: pending
created: 2026-05-15T11:00:00Z
priority: high
tag: story-17.1-completion
type: test-gap
---

# Intent: Story 17.1 — create room-tile.component.spec.ts

## Context

`src/app/_components/room/room-tile/room-tile.component.ts` is a core UI component for Story 17.1 (the per-room tile shown in the Home carousel and `/rooms` page). The story's Phase 7 doc and follow-up `StORY-17.1-TESTS-REMAINING.md` both list a spec for this component as required. Today **no spec file exists** for `room-tile.component`.

## Goal

Add a comprehensive `room-tile.component.spec.ts` covering all the behaviour AC7 and AC8 enumerate.

## Users

Developers — protection against regression for a heavily-clicked piece of UI.

## Problem

No unit coverage for status-based rendering, click routing, action buttons, or the host/player conditional logic. Bugs already exist here (see `story-17.1-impl-room-tile-idle-click`); they'd be caught earlier with this spec in place.

## Success Criteria

- `src/app/_components/room/room-tile/room-tile.component.spec.ts` exists.
- Tests cover:
  - `displayStatus` computed for each status (`idle`, `playing`, `archived`).
  - Template renders the colored status bar for each status (assert class or computed-style).
  - Template renders name, code, and `X/Y players`.
  - `handleClick()` for status='idle' → calls `router.navigate(['/room', id])` (after the impl fix in intent `story-17.1-impl-room-tile-idle-click`).
  - `handleClick()` for status='playing' → calls `handleReconnect()` then navigates to `/game`.
  - `handleClick()` for status='archived' → no navigation.
  - `handleAction('archive')` → calls `roomService.archiveRoom(id)`, button visible only for host.
  - `handleAction('leave')` → calls `roomService.leaveRoom(id)`, button visible for non-host.
  - `handleAction('delete')` → calls the right service path (verify with the component code).
  - Action button click does NOT bubble up to trigger the tile-level navigation.
- All tests pass.

## Constraints

- Use the existing test-helper patterns: `createMockRoomService`, etc. (see `src/app/testing/test-helpers.ts`).
- Mock the router with `jasmine.createSpyObj`.
- Avoid integration: this is a pure unit spec.

## Scope

### In-scope

- Brand-new `room-tile.component.spec.ts`.
- Possibly small extensions to `test-helpers.ts` if a needed mock isn't yet provided.

### Out-of-scope

- Modifying the component itself (handled by impl intent `story-17.1-impl-room-tile-idle-click`).
- Visual regression / Percy-style tests.

## Approach

1. Read the component + its template to enumerate all branches.
2. Set up `TestBed.configureTestingModule` with stubbed RoomService, Router, AuthService, etc.
3. Write a describe block per public method + a "template" describe for rendering assertions.
4. Run the spec; iterate until green.

## Verification

- `npm test` reports the new spec runs and passes.
- Coverage report shows `room-tile.component.ts` lines all hit.

## Dependencies

- Implementation intent `story-17.1-impl-room-tile-idle-click` should land first; otherwise the idle-click test will fail intentionally until that fix is merged. The two intents can also be done as a pair in one run.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW (additive). Effort: ~45 min.
