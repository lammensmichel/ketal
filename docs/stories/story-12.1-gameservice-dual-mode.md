# Story 12.1: GameService Dual-Mode Architecture

**Status**: InProgress
**Epic**: Epic 12: GameService Appwrite Integration
**Created**: 2026-01-24
**Priority**: High

---

## Story

**As a** developer
**I want** GameService to support both local (localStorage) and cloud (Appwrite) modes
**So that** the game can work offline and sync to Appwrite when a room is active

---

## Context

Le GameService actuel utilise uniquement localStorage via LocalService. Les services Appwrite (RoomService, KetalSessionService, MemberService) sont implémentés mais non connectés. Cette story crée l'architecture dual-mode qui permettra de basculer entre local et cloud.

---

## Acceptance Criteria

1. **AC1**: GameService détecte automatiquement le mode (local vs room/multiplayer)
2. **AC2**: En mode local, le comportement actuel (localStorage) est préservé
3. **AC3**: En mode room, les données sont persistées dans Appwrite via KetalSessionService
4. **AC4**: Un signal `gameMode` expose le mode actuel ('local' | 'room')
5. **AC5**: La transition entre modes est transparente pour les composants UI

---

## Tasks / Subtasks

- [x] **T1** (AC: 1, 4): Ajouter le signal de mode au GameService
  - [x] Créer signal `gameMode: Signal<'local' | 'room'>`
  - [x] Injecter RoomService et KetalSessionService
  - [x] Computed `isRoomMode` basé sur `roomService.currentRoom()`

- [x] **T2** (AC: 2): Extraire la logique localStorage dans une méthode privée
  - [x] Créer `saveToLocalStorage(game: Game)`
  - [x] Créer `loadFromLocalStorage(): Game | null`
  - [x] Refactorer `saveAndNotify()` pour utiliser ces méthodes

- [x] **T3** (AC: 3): Créer les méthodes de persistance Appwrite
  - [x] Créer `saveToAppwrite(game: Game)` - fully implemented with mappers
  - [x] Créer `loadFromAppwrite(sessionId: string): Game | null` - fully implemented with mappers
  - [x] Mapper les structures de données (Game ↔ KetalSession) - implemented in game-mappers.ts

- [x] **T4** (AC: 5): Unifier la logique de sauvegarde
  - [x] Modifier `saveAndNotify()` pour router vers local ou Appwrite selon le mode
  - [x] S'assurer que les composants UI n'ont pas besoin de changements

---

## Dev Notes

### Architecture Actuelle

```typescript
// GameService (actuel - localStorage only)
private saveAndNotify(game: Game): void {
  this.localSrv.saveData('game', JSON.stringify(game));
  this._game.set(JSON.parse(JSON.stringify(game)));
}
```

### Architecture Cible

```typescript
// GameService (dual-mode)
private readonly roomService = inject(RoomService);
private readonly ketalSessionService = inject(KetalSessionService);

readonly gameMode = computed(() =>
  this.roomService.currentRoom() ? 'room' : 'local'
);

private saveAndNotify(game: Game): void {
  if (this.gameMode() === 'room') {
    this.saveToAppwrite(game);
  } else {
    this.saveToLocalStorage(game);
  }
  this._game.set(JSON.parse(JSON.stringify(game)));
}
```

### Mapping Game ↔ KetalSession

| Game (local) | KetalSession (Appwrite) |
|--------------|-------------------------|
| players | players (KetalPlayer[]) |
| turn | turn |
| phase | phase (mapped: 1→'dealing', 2→'pyramid') |
| status | status (mapped: 0→'waiting', 1→'playing', 2→'finished') |
| drinkingCards | drinkingCards (serialized) |
| givingCards | givingCards (serialized) |
| activePlayer | activePlayerId |
| summary | withSummary |

### Fichiers Concernés

- `src/app/services/game/game.service.ts` (modifier)
- `src/app/services/ketal-session/ketal-session.service.ts` (existant)
- `src/app/services/room/room.service.ts` (existant)

---

## Testing

### Unit Tests
- [ ] Test: Mode détection (local quand pas de room, room quand room active)
- [ ] Test: localStorage préservé en mode local
- [ ] Test: Appwrite appelé en mode room
- [ ] Test: Mapping Game ↔ KetalSession correct

### Test Location
`src/app/services/game/game.service.spec.ts`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | SM Bob |

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Build verified successful with no compilation errors
- Lint passed with 0 errors (61 pre-existing warnings)

### Completion Notes List
1. Added imports for RoomService and KetalSessionService
2. Injected both services using `inject()` pattern
3. Added `gameMode` computed signal that returns 'room' if `roomService.currentRoom()` exists, else 'local'
4. Added `isRoomMode` computed signal for convenience
5. Extracted localStorage logic into `saveToLocalStorage()` and `loadFromLocalStorage()` private methods
6. Implemented full `saveToAppwrite()` and `loadFromAppwrite()` methods using mappers (from game-mappers.ts)
7. Modified `saveAndNotify()` to route to appropriate persistence method based on `gameMode()`
8. Exported `GameMode` type for external use
9. All existing functionality preserved - local mode works exactly as before
10. Added `_isSyncing` flag to prevent sync loops from realtime updates
11. Added MemberService injection for stats tracking
12. Added `syncToAppwrite()` method for explicit synchronization
13. Added `applySessionUpdate()` method for handling realtime session updates

### File List
- `/home/knabo/dev/ketal/src/app/services/game/game.service.ts` (modified)
- `/home/knabo/dev/ketal/src/app/services/game/game-mappers.ts` (new - added by concurrent session)

---

## QA Results
_To be filled by QA agent_
