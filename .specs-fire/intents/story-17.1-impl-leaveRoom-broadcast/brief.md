---
id: story-17.1-impl-leaveRoom-broadcast
title: Story 17.1 — fix leaveRoom to broadcast + complete host cleanup
status: pending
created: 2026-05-15T11:00:00Z
priority: high
tag: story-17.1-completion
type: implementation-gap
---

# Intent: Story 17.1 — fix leaveRoom to broadcast + complete host cleanup

## Context

Story 17.1's AC3 says `leaveRoom(roomId)`:
1. Deletes the member record
2. If the leaver is the host: sets the room status to `idle` and cancels the current session
3. Broadcasts the leave so remaining members see it in real time

Inspection of `src/app/services/room/room.service.ts:410-441` shows:
- ✅ Deletes the member record (line 425).
- ⚠️ Host-cleanup branch is incomplete: it updates the room (line 431) but the "Cancel session" and "Set hasLeft=true for all players in session" comments at lines 432-433 are placeholders — no code follows.
- ❌ No broadcast call anywhere.

## Goal

Complete the host-cleanup branch (cancel the active session via KetalSessionService) and broadcast the leave event so the UI of other members reacts.

## Users

Players in multi-device rooms.

## Problem

When a host leaves, the session document is left in an inconsistent state and other members don't get a real-time signal. AC3 is ticked as done but the implementation only does the easy half.

## Success Criteria

- Member record deleted (unchanged).
- If host leaves: room → `idle`, `currentSessionId` cleared, AND the referenced session is properly cancelled via the session service (status='cancelled', terminatedBy=current user), AND all `ketal_players` rows in that session marked `hasLeft=true` for the host (or all of them if cancellation implies that).
- Broadcast `RealtimeService.broadcastToRoom(roomId, 'member.left', { memberId, role })` regardless of host/non-host.
- Unit tests cover both host-leaves and non-host-leaves branches.

## Constraints

- Don't change the function signature.
- Match the `SessionStatus` enum introduced by migration 038 (`'cancelled'`).
- The exact event names should align with anything already referenced in `RealtimeService` or constants files — check before inventing.

## Scope

### In-scope

- `src/app/services/room/room.service.ts:410-441` — fill in host cleanup, add broadcast.
- `src/app/services/room/room.service.spec.ts` — add tests for both branches.
- Possibly `src/app/services/ketal-session/ketal-session.service.ts` — confirm a `cancelSession(sessionId, terminatedBy)` API exists; if not, add one (or use existing `updateSession` with the right payload).

### Out-of-scope

- Server-side broadcast implementation (Appwrite Function).

## Approach

1. Read `KetalSessionService` to see how to cancel a session and mark players `hasLeft`. If a helper exists, use it; otherwise call `updateDocument` directly with the right enum value.
2. Inside the host branch, after `updateRoom(..., { status: 'idle', currentSessionId: null })`, call the session-cancel routine for `room.currentSessionId`.
3. After member deletion (regardless of role), call `this.realtime.broadcastToRoom(roomId, 'member.left', { memberId: myMember.$id, role: myMember.role })`.
4. Add unit tests: one host-leaves, one player-leaves, asserting both the DB calls and the broadcast.

## Verification

- New tests pass; existing tests untouched.
- Typecheck clean.
- Manual smoke: in two browser tabs, host leaves → remaining tab observes the room reverting to idle.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: MEDIUM (touches session lifecycle). Effort: ~45 min.
