# Story 12.6: Fix realtime room synchronization

**Status**: Done
**Epic**: Epic 12: FUG Backend Integration
**Priority**: Critical
**Depends On**: -
**Bug**: BUG-9

---

## Story

**As a** host in a multiplayer game room
**I want** to see players appear and disappear in real-time when they join or leave
**So that** I can manage the lobby and start the game when enough players have joined

---

## Context

The Appwrite realtime WebSocket is not connected in the lobby. When a player joins a room, the host does not see them appear. After page reload, the host loses their own membership (shows 0/10 players, "En attente de joueurs...").

### Observed symptoms
- No WebSocket connections detected in browser DevTools
- After reload, no GET request to fetch room members
- The lobby component does not re-fetch room data on init when navigated via URL

### Current architecture

The lobby subscribes to realtime via `RealtimeService.subscribeToMembers()`, which calls `AppwriteService.subscribe()` on the Appwrite Client. The `connected` signal is only set to `true` when a realtime event is received (inside `createSubscription` callback), meaning there is no proactive connection health check.

```
LobbyComponent.ngOnInit()
  ├── loadRoomMembers()     → memberService.getMembersByRoom(room.$id)
  └── subscribeToMemberUpdates()  → realtimeService.subscribeToMembers(room.$id, cb)
        └── AppwriteService.subscribe(channel, callback)
              └── client.subscribe(channel, callback)
```

### Root cause areas to investigate

1. **RoomService.currentRoom() is null on reload**: `currentRoom` is an in-memory signal. When the lobby is accessed via URL (`/room/:id`), the `currentRoom()` signal is `null` because no call to `joinRoom()` or `setCurrentRoom()` was made. Both `loadRoomMembers()` and `subscribeToMemberUpdates()` bail out early with `if (!room) return;`.

2. **No room restoration from URL**: The `LobbyComponent.ngOnInit()` reads `this.roomService.currentRoom()` but does not extract the room ID from the route params (`ActivatedRoute`) to fetch the room from Appwrite if it is not already in memory.

3. **Appwrite SDK vs server version mismatch**: The project uses Appwrite Web SDK `^21.5.0` (package.json). Verify compatibility with the Appwrite 1.5.7 server deployed via fug-backend.

4. **Host membership lost on reload**: When the host reloads, `currentRoom` is null, so `loadRoomMembers()` is never called. The `memberService._currentMember` signal is also reset to `null`. No logic exists to restore the current member from the backend on page load.

### Files to investigate

- `src/app/_components/room/lobby/lobby.component.ts` - No `ActivatedRoute` injection, no room fetch from route params
- `src/app/services/room/room.service.ts` - `currentRoom` is in-memory only, no persistence/restoration
- `src/app/services/realtime/realtime.service.ts` - Subscription depends on room being set
- `src/app/services/member/member.service.ts` - No `currentMember` restoration logic
- `src/app/services/appwrite/appwrite.service.ts` - `connected` signal only set on event receipt

---

## Acceptance Criteria

1. **AC1**: When a player joins a room, the host sees them appear in real-time without refresh
2. **AC2**: After page reload, the lobby correctly shows all current room members
3. **AC3**: The host retains their role and membership after reload
4. **AC4**: WebSocket connection to Appwrite realtime is established on lobby load
5. **AC5**: When a player leaves, they disappear from all other players' views

---

## Tasks / Subtasks

- [x] **T1** (AC: 2, 3): Restore room state from URL on lobby init
  - [x] Inject `ActivatedRoute` in `LobbyComponent`
  - [x] In `ngOnInit()`, if `currentRoom()` is null, extract room ID from route params
  - [x] Fetch room from Appwrite via `RoomService` (add `getRoomById(id)` method if missing)
  - [x] Call `roomService.setCurrentRoom(room)` to restore signal state

- [x] **T2** (AC: 2, 3): Restore current member on lobby init
  - [x] After room is restored, call `memberService.getMembersByRoom(roomId)`
  - [x] Identify current user via `AuthService` (userId or deviceId)
  - [x] Call `memberService.setCurrentMember()` with the matching member
  - [x] Ensure host role is preserved (check `room.hostMemberId` against member `$id`)

- [x] **T3** (AC: 1, 4, 5): Fix realtime subscription lifecycle
  - [x] Ensure `subscribeToMemberUpdates()` is called after room is restored (not just when room is already set)
  - [x] Verify WebSocket connection is established (check browser DevTools for `wss://` connection)
  - [x] Add error handling / retry logic if realtime subscription fails
  - [x] Test that member create/update/delete events trigger the callback

- [x] **T4** (AC: 4): Add connection status indicator
  - [x] Use `realtimeService.isConnected` signal in lobby template
  - [x] Display a visual indicator (e.g., green dot) when WebSocket is connected
  - [x] Display warning when disconnected

- [x] **T5** (AC: 1, 2, 3, 4, 5): Verify SDK and server compatibility
  - [x] Check Appwrite Web SDK `21.x` compatibility with Appwrite server version in fug-backend
  - [x] Test realtime subscription with a simple channel first
  - [x] Verify collection-level permissions allow realtime access for authenticated users

---

## Dev Notes

### LobbyComponent - Missing route param handling

The lobby currently reads room from the service signal but does not use `ActivatedRoute`:

```typescript
// Current: depends on in-memory signal
readonly currentRoom = this.roomService.currentRoom;

ngOnInit(): void {
  this.loadRoomMembers();       // Bails if currentRoom() is null
  this.subscribeToMemberUpdates(); // Bails if currentRoom() is null
  this.registerCleanup();
}
```

Proposed fix:

```typescript
private readonly route = inject(ActivatedRoute);

async ngOnInit(): Promise<void> {
  await this.restoreRoomFromRoute();
  this.loadRoomMembers();
  this.subscribeToMemberUpdates();
  this.registerCleanup();
}

private async restoreRoomFromRoute(): Promise<void> {
  if (this.currentRoom()) return; // Already set

  const roomId = this.route.snapshot.paramMap.get('id');
  if (!roomId) return;

  const room = await this.roomService.getRoomById(roomId);
  if (room) {
    this.roomService.setCurrentRoom(room);
  }
}
```

### RoomService - Missing getRoomById method

Add a method to fetch a room by its Appwrite document ID:

```typescript
async getRoomById(roomId: string): Promise<GameRoom | null> {
  try {
    const document = await this.appwrite.databases.getDocument(
      this.appwrite.databaseId, COLLECTION_GAME_ROOMS, roomId
    );
    return this.mapDocumentToGameRoom(document);
  } catch {
    return null;
  }
}
```

### Relevant routes (app-routing.module.ts)

```
/room/:id       → LobbyComponent
/room/:id/stats → RoomStatsComponent
/room/create    → CreateRoomComponent
/room/join      → JoinRoomComponent
/room/join/:code → JoinRoomComponent
```

---

## Testing

### Unit Tests
- [x] Test: Lobby fetches room from route params when `currentRoom()` is null
- [x] Test: Lobby fetches members after room is restored
- [x] Test: Current member is correctly identified and set after reload
- [x] Test: Host role is preserved after room restoration
- [x] Test: Realtime subscription is created after room restoration
- [x] Test: Member list updates when realtime event is received
- [x] Test: Unsubscribe is called on component destroy

### Manual Tests
- [x] Host creates room, player joins via code → host sees player appear without refresh
- [x] Host reloads page → lobby shows all members, host retains crown icon
- [x] Player leaves room → all other players see them disappear
- [x] Open browser DevTools Network tab → verify `wss://` connection on lobby load
- [x] Two browsers side by side → verify bidirectional realtime sync

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | - |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
