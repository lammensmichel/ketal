# GameService Appwrite Integration

**Created**: 2026-01-24
**Status**: In Progress
**Branch**: feature/fug-backend-integration
**Epic**: Epic 12: GameService Appwrite Integration

---

## Summary

Implementing dual-mode architecture for GameService to support both local (localStorage) and cloud (Appwrite) modes. This enables offline play with localStorage while providing seamless multiplayer synchronization through Appwrite realtime when players are in a room.

---

## Stories

| Story | Title | Status | Priority |
|-------|-------|--------|----------|
| 12.1 | GameService Dual-Mode Architecture | InProgress | High |
| 12.2 | Connect Game Start to KetalSessionService | InProgress | High |
| 12.3 | Synchronize Player Choices and Cards | InProgress | High |
| 12.4 | Synchronize Sips (Gorgees) | InProgress | High |
| 12.5 | Implement Realtime Synchronization | InProgress | High |

---

## Architecture Changes

### Dual-Mode Pattern

The GameService now supports two operational modes:

```
┌─────────────────────────────────────────────────────────────┐
│                      GameService                             │
├─────────────────────────────────────────────────────────────┤
│  gameMode: Signal<'local' | 'room'>                         │
│                                                              │
│  ┌─────────────────┐          ┌─────────────────┐           │
│  │   Local Mode    │          │    Room Mode    │           │
│  │  (localStorage) │          │   (Appwrite)    │           │
│  └────────┬────────┘          └────────┬────────┘           │
│           │                            │                     │
│           ▼                            ▼                     │
│  saveToLocalStorage()         saveToAppwrite()               │
│  loadFromLocalStorage()       loadFromAppwrite()             │
│                                        │                     │
│                                        ▼                     │
│                               KetalSessionService            │
│                               (Realtime sync)                │
└─────────────────────────────────────────────────────────────┘
```

### Mode Detection

```typescript
readonly gameMode = computed(() =>
  this.roomService.currentRoom() ? 'room' : 'local'
);
```

### Data Mapping (Game <-> KetalSession)

| Game (local) | KetalSession (Appwrite) |
|--------------|-------------------------|
| players | players (KetalPlayer[]) |
| turn | turn |
| phase | phase ('dealing' / 'pyramid') |
| status | status ('waiting' / 'playing' / 'finished') |
| drinkingCards | drinkingCards (serialized) |
| givingCards | givingCards (serialized) |
| activePlayer | activePlayerId |
| summary | withSummary |

### Realtime Synchronization Flow

```
Player Action
     │
     ▼
GameService.saveAndNotify()
     │
     ├──► Local Mode: localStorage
     │
     └──► Room Mode: KetalSessionService.updateSession()
                              │
                              ▼
                     Appwrite Database
                              │
                              ▼
                     Realtime Broadcast
                              │
                              ▼
                  Other Players' GameService
                     handleSessionUpdate()
```

---

## Files to Modify

### Core Service
- `src/app/services/game/game.service.ts` - Add dual-mode architecture

### Supporting Services (existing, to be connected)
- `src/app/services/ketal-session/ketal-session.service.ts` - Session CRUD
- `src/app/services/room/room.service.ts` - Room state
- `src/app/services/member/member.service.ts` - Member stats
- `src/app/services/realtime/realtime.service.ts` - Realtime subscriptions

### Components (verify compatibility)
- `src/app/_shared/_components/footer/footer.component.ts` - Async beginGame()

### Tests
- `src/app/services/game/game.service.spec.ts` - Unit tests for dual-mode

---

## Key Implementation Details

### Story 12.1: Dual-Mode Foundation
- Add `gameMode` computed signal
- Extract localStorage methods
- Create Appwrite method placeholders
- Route `saveAndNotify()` based on mode

### Story 12.2: Game Start
- Modify `beginGame()` for async operation
- Create `startGameInRoom()` method
- Map `PlayerModel[]` to `KetalPlayer[]`
- Create KetalSession in Appwrite

### Story 12.3: Choices and Cards
- Sync player choices to Appwrite
- Sync drawn cards to Appwrite
- Handle turn/phase transitions
- Subscribe to realtime updates

### Story 12.4: Sips Synchronization
- Sync `sipsTaken` and `sipsGiven`
- Update member cumulative stats on game end
- Call `MemberService.updateMemberStats()`

### Story 12.5: Realtime
- Subscribe to session updates
- Map `KetalSession` to `Game`
- Handle sync loops prevention
- Manage disconnect/reconnect

---

## Progress Log

### 2026-01-24
- Epic 12 stories created and moved to InProgress status
- Implementation tracking document created
- Architecture documentation updated in CLAUDE.md

---

## Completion Checklist

- [ ] All 5 stories implemented
- [ ] Unit tests passing
- [ ] Local mode regression tested
- [ ] Room mode integration tested
- [ ] Realtime sync verified with 2+ players
- [ ] Documentation updated
