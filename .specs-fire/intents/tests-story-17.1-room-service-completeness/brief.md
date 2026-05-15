---
id: tests-story-17.1-room-service-completeness
title: Story 17.1 — complete room.service.spec.ts coverage
status: pending
created: 2026-05-15T11:00:00Z
priority: high
tag: story-17.1-completion
type: test-gap
---

# Intent: Story 17.1 — complete room.service.spec.ts coverage

## Context

Story 17.1 added several new methods to `RoomService`: `getMyRooms`, `renameRoom`, `archiveRoom`, `leaveRoom`, `startNewSession`, `handleReconnection`. The story's Phase 7 doc lists tests for each. Today, `room.service.spec.ts` has describe blocks only for `getMyRooms` (line 393) and `leaveRoom` (line 620). The other four methods are entirely untested.

Two of these methods are also implementation-broken (see intents `story-17.1-impl-renameRoom-broadcast`, `story-17.1-impl-startNewSession-implement`, `story-17.1-impl-leaveRoom-broadcast`) — tests added here will help drive those fixes.

## Goal

Bring `room.service.spec.ts` to full coverage of the new Story 17.1 methods, and round out the existing `getMyRooms` / `leaveRoom` blocks with the edge cases the spec doc calls out.

## Users

Developers — confidence in the room-lifecycle methods.

## Problem

Four service methods that drive real user flows (rename, archive, start-session, reconnect) have zero tests. The two methods that do have tests cover only one path each.

## Success Criteria

`room.service.spec.ts` contains describe blocks for:

- `getMyRooms`:
  - Filters by `userId` (already covered — verify).
  - Excludes archived rooms when `showArchived = false`.
  - Includes archived rooms when `showArchived = true`.
  - Sorts by `$updatedAt desc`.
  - Returns `[]` for anonymous users.
  - Enriches each room with `memberCount`.
  - Respects `limit` parameter.
- `renameRoom`:
  - Updates the room name.
  - Calls `RealtimeService.broadcastToRoom` with the right event/payload.
- `archiveRoom`:
  - Host can archive.
  - Non-host throws `'Only the host can archive a room'`.
  - Unauthenticated user throws.
- `leaveRoom`:
  - Non-host: deletes the member, leaves the room alone.
  - Host: deletes the member, sets room to `idle`, cancels the session, marks `hasLeft` on players.
  - Broadcasts a `member.left` event in both branches.
- `startNewSession`:
  - Happy path: creates session + ketal_player for host, updates room to `playing`.
  - Throws when room not found.
  - Throws when room status is not `idle`.
- `handleReconnection` (if part of RoomService — verify):
  - Returns null when no `currentSessionId`.
  - Loads the session and navigates appropriately.

All tests pass. Coverage report shows `room.service.ts` lines for the new methods all hit.

## Constraints

- Several tests will FAIL until corresponding impl-gap intents are completed (`story-17.1-impl-renameRoom-broadcast`, `story-17.1-impl-leaveRoom-broadcast`, `story-17.1-impl-startNewSession-implement`). Writing them first as TDD is fine; otherwise this intent should be run AFTER those.

## Scope

### In-scope

- Extending `src/app/services/room/room.service.spec.ts`.
- Possibly small updates to `test-helpers.ts` for the new mocks (KetalSessionService for cancellation).

### Out-of-scope

- The component-level spec (separate intent).
- The implementation fixes (separate impl-gap intents).

## Approach

1. Read the current spec to see what's already wired.
2. Add describe blocks for each method per the success-criteria list.
3. Mock `RealtimeService`, `MemberService`, `KetalSessionService`, `AuthService` as needed.
4. Run the suite; for any failing test, check whether it's the test code or the implementation code. If implementation, mark the failing test xit and reference the impl-gap intent. Better: do the impl-gap intent first.

## Verification

- `npm test` runs and (after impl-gap intents land) all new tests are green.

## Dependencies

- Stronger if the three impl-gap intents (`renameRoom-broadcast`, `leaveRoom-broadcast`, `startNewSession-implement`) land first.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW (additive). Effort: ~90 min.
