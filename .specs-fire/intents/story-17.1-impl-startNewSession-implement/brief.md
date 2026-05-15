---
id: story-17.1-impl-startNewSession-implement
title: Story 17.1 — implement startNewSession (currently a stub)
status: pending
created: 2026-05-15T11:00:00Z
priority: high
tag: story-17.1-completion
type: implementation-gap
---

# Intent: Story 17.1 — implement startNewSession (currently a stub)

## Context

Story 17.1's AC5 says `startNewSession(roomId)` must:
1. Verify the room exists and is `idle`.
2. Create a new `ketal_sessions` document (status: `'waiting'` or similar).
3. Create a `ketal_players` entry for the host so the host is auto-joined as a player.
4. Update the room with the new `currentSessionId` and status `'playing'`.
5. Return the new session.

Inspection of `src/app/services/room/room.service.ts:446-458` shows:

```ts
async startNewSession(roomId: string): Promise<any> {
  const room = await this.getRoomById(roomId);
  if (!room) throw new Error('Room not found');
  if (room.status !== 'idle') throw new Error('Room must be idle to start a new game');

  // Create new session
  // Add host as player
  return null;            // ← stub
}
```

The function is a STUB. It validates the room state and then returns `null` without doing any of the work.

## Goal

Implement the real session creation flow so that calling `startNewSession(roomId)` produces a usable session with the host pre-registered as a player.

## Users

Hosts starting a new game after a previous one ended.

## Problem

The "Démarrer une partie" button (or equivalent) wired to this method silently does nothing useful — the UI flow that depends on it (entering /room/{id} for a re-start, or the Home carousel's "play again" affordance) is broken at the boundary.

## Success Criteria

- `startNewSession` returns a fully-constructed session object (typed, not `any`).
- The new session document exists in Appwrite with the correct shape (status, gameId, roomId, players link, etc.).
- A `ketal_players` row for the host exists pointing at the new session.
- The room is updated: `currentSessionId = <new>`, `status = 'playing'`.
- A unit test mocks the database layer and asserts each of these writes.
- Optionally: a broadcast event `'session.started'` if other members of the room need to see it (align with renameRoom/leaveRoom decisions).

## Constraints

- Use `KetalSessionService` for session creation if it has a `createSession` helper; otherwise create it via `databases.createDocument` with the v24 object form (consistent with the rest of the codebase).
- The `Promise<any>` return type must be replaced with a real type (`KetalSession` or whatever the existing service uses).
- Match the schema introduced by migrations 030/031/034 (`ketal_sessions`, `ketal_players`).

## Scope

### In-scope

- `src/app/services/room/room.service.ts:446-458` — full implementation.
- Replace `Promise<any>` with the proper type.
- `src/app/services/room/room.service.spec.ts` — add tests covering the happy path, the "room not idle" guard, and the "room not found" guard.
- If a helper is added to `KetalSessionService`, add or extend its spec too.

### Out-of-scope

- UI changes — the button(s) that call this method already exist.
- Server-side functions / cron.

## Approach

1. Read `KetalSessionService` to find existing creation helpers and the `KetalSession` type shape.
2. If `createSession({roomId, gameId, hostUserId, ...})` exists, call it; if not, add a helper there and call it from `RoomService`.
3. Create a `ketal_players` row for the host (via the same service or `databases.createDocument`).
4. Call `this.updateRoom(roomId, { currentSessionId: <newId>, status: 'playing' })`.
5. Return the created session.
6. Add three unit tests: happy-path, not-idle guard, not-found guard.
7. Typecheck + run suite.

## Verification

- New tests green.
- Typecheck clean.
- Manual smoke: from a room that ended a game, host clicks "Démarrer une partie" → new session row exists in Appwrite, room is in `playing` status, host appears in players list.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: HIGH (multi-document write, error paths). Effort: ~60–90 min.
This is the biggest of the four implementation gaps.
