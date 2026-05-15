---
id: story-17.1-impl-renameRoom-broadcast
title: Story 17.1 — fix renameRoom to actually broadcast
status: pending
created: 2026-05-15T11:00:00Z
priority: high
tag: story-17.1-completion
type: implementation-gap
---

# Intent: Story 17.1 — fix renameRoom to actually broadcast

## Context

Story 17.1's AC4 says `renameRoom(roomId, newName)` must broadcast the rename via `RealtimeService.broadcastToRoom`. The story doc declares this ✅ done, but inspection of `src/app/services/room/room.service.ts:372-376` shows:

```ts
async renameRoom(roomId: string, newName: string): Promise<GameRoom> {
  const room = await this.updateRoom(roomId, { name: newName });
  // Broadcast via RealtimeService    ← comment only, no call
  return room;
}
```

The broadcast call is **missing**. Other members in the same room currently don't receive a real-time notification when the room is renamed — they only see the new name after the next realtime row event from Appwrite (which fires on update but may not carry app-level context the UI needs).

## Goal

Implement the broadcast call so renames propagate to all members in real time as the spec requires.

## Users

Players in multi-device rooms — they should see name changes immediately.

## Problem

Silent gap between doc and code. AC4 ticked as done while the bridge isn't wired.

## Success Criteria

- After `renameRoom` resolves, `RealtimeService.broadcastToRoom(roomId, 'room.renamed', { name })` has been called.
- Existing call sites of `renameRoom` continue to work.
- A unit test in `room.service.spec.ts` proves the broadcast fires with the right payload.

## Constraints

- Don't change the function signature; callers must keep working.
- `RealtimeService.broadcastToRoom` is currently a stub that just logs — that's fine for now; the contract here is "the service calls it", not "the cloud function exists".

## Scope

### In-scope

- `src/app/services/room/room.service.ts:372-376` — add the broadcast call after the update.
- `src/app/services/room/room.service.spec.ts` — add a test asserting the broadcast was invoked.

### Out-of-scope

- Implementing real server-side fan-out via Appwrite Functions.
- Re-implementing the broadcast contract.

## Approach

1. Inject `RealtimeService` into `RoomService` (or confirm it's already injected — likely it is, since `RealtimeService.broadcastToRoom` is referenced elsewhere in the codebase).
2. Add the broadcast call: `this.realtime.broadcastToRoom(roomId, 'room.renamed', { roomId, name: newName });` (event name to be confirmed against any existing event constants).
3. Write the spec assertion using a spy on `realtime.broadcastToRoom`.
4. Run typecheck + suite.

## Verification

- `npm test` includes a new test in `room.service.spec.ts` that fails without the call and passes with it.
- `npx tsc --noEmit -p tsconfig.json` clean.

## Notes

Origin: Story 17.1 audit dated 2026-05-15 (see chat thread). Risk: LOW (additive). Effort: ~10 min.
