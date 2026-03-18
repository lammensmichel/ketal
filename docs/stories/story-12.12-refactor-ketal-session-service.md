# Story 12.12: Refactor KetalSessionService for Normalized Collections

**Status**: Draft
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: Critical
**Depends on**: Story 12.11 (backend migrations must be done first)

---

## Story

**As a** player in room mode,
**I want** the game to use normalized Appwrite collections for session, players, and cards,
**So that** multiplayer games work reliably without hitting Appwrite attribute limits.

---

## Context

Story 12.11 splits `ketal_sessions` into 3 collections: `ketal_sessions`, `ketal_players`, `ketal_cards`. This story adapts the frontend code to work with the new schema.

The main impact is on `KetalSessionService` which currently does everything through a single collection. It needs to be refactored to manage 3 collections with separate CRUD operations and realtime subscriptions.

---

## Acceptance Criteria

1. **AC1**: `KetalSession` interface updated — `players`, `drinkingCards`, `givingCards` removed from session
2. **AC2**: New `KetalPlayer` Appwrite CRUD — create/update/delete players in `ketal_players` collection
3. **AC3**: New `KetalCards` Appwrite CRUD — create/update cards in `ketal_cards` collection
4. **AC4**: Game mappers updated to map between local Game model and the 3 collections
5. **AC5**: Realtime subscriptions updated to listen to all 3 collections
6. **AC6**: GameService dual-mode logic works with new structure (room mode creates/syncs across 3 collections)
7. **AC7**: Local mode (localStorage) continues to work unchanged
8. **AC8**: All existing Karma tests pass or are updated
9. **AC9**: Game flow works end-to-end in room mode: create session → add players → play → sync state

---

## Tasks / Subtasks

- [ ] **T1**: Update KetalSession interface and create new interfaces (AC: 1)
  - [ ] Remove `players`, `drinkingCards`, `givingCards` from `KetalSession`
  - [ ] Create `KetalPlayerDoc` interface (sessionId, memberId, displayName, order, cards, choices, sipsTaken, sipsGiven, isReady)
  - [ ] Create `KetalCardsDoc` interface (sessionId, drinkingCards, givingCards, deck)
- [ ] **T2**: Refactor KetalSessionService — split into collection-specific methods (AC: 2, 3)
  - [ ] Add `ketal_players` collection ID constant
  - [ ] Add `ketal_cards` collection ID constant
  - [ ] `createSession()` — only creates session doc (no embedded players/cards)
  - [ ] `createPlayer(sessionId, player)` — creates doc in ketal_players
  - [ ] `createCards(sessionId)` — creates doc in ketal_cards with empty arrays
  - [ ] `updatePlayer(playerId, data)` — granular player update
  - [ ] `updateCards(cardsDocId, data)` — update drinking/giving cards
  - [ ] `getPlayersBySession(sessionId)` — query ketal_players by sessionId
  - [ ] `getCardsBySession(sessionId)` — query ketal_cards by sessionId
  - [ ] `deleteSession(sessionId)` — cascade delete session + players + cards
- [ ] **T3**: Update game-mappers.ts (AC: 4)
  - [ ] `mapGameToSession()` — only maps session-level fields (status, phase, turn, activePlayerId, withSummary)
  - [ ] `mapGameToPlayers()` — maps PlayerModel[] to KetalPlayerDoc[]
  - [ ] `mapGameToCards()` — maps drinkingCards/givingCards
  - [ ] `mapSessionToGame()` — reconstruct Game from session + players + cards docs
  - [ ] `mapKetalPlayerToPlayerModel()` / `mapPlayerModelToKetalPlayer()` — keep existing logic
- [ ] **T4**: Update GameService room-mode methods (AC: 6)
  - [ ] `beginGame()` — create session, then create player docs, then create cards doc
  - [ ] `syncToAppwrite()` — determine what changed and update only the relevant collection(s)
  - [ ] `loadFromAppwrite()` — fetch session + players + cards, reconstruct game state
- [ ] **T5**: Update RealtimeService subscriptions (AC: 5)
  - [ ] Subscribe to `ketal_sessions` collection (session state changes)
  - [ ] Subscribe to `ketal_players` collection filtered by sessionId (player updates)
  - [ ] Subscribe to `ketal_cards` collection filtered by sessionId (card updates)
  - [ ] Merge realtime events into unified game state updates
- [ ] **T6**: Verify local mode unchanged (AC: 7)
  - [ ] Ensure localStorage game persistence is not affected
  - [ ] Run existing local mode tests
- [ ] **T7**: Update tests (AC: 8)
  - [ ] Update KetalSessionService tests for new methods
  - [ ] Update game-mappers tests for new mapping functions
  - [ ] Update GameService tests for multi-collection flow
  - [ ] Ensure all existing tests pass or are adapted

---

## Dev Notes

### Key Files to Modify

| File | Changes |
|------|---------|
| `src/app/services/ketal-session/ketal-session.service.ts` | Major refactor — split into 3-collection CRUD |
| `src/app/services/game/game-mappers.ts` | New mapping functions for players/cards collections |
| `src/app/services/game/game.service.ts` | Update beginGame, sync, load methods |
| `src/app/services/realtime/realtime.service.ts` | Add subscriptions for new collections |
| `src/app/services/ketal-session/ketal-session.service.spec.ts` | Update tests |
| `src/app/services/game/game-mappers.spec.ts` | Update tests |
| `src/app/services/game/game.service.spec.ts` | Update tests |

### Current Data Flow (before)
```
GameService → KetalSessionService.createSession(fullData) → 1 Appwrite doc
GameService → KetalSessionService.updateSession(fullData) → 1 Appwrite doc
Realtime → 1 subscription → full session updates
```

### Target Data Flow (after)
```
GameService → KetalSessionService.createSession(sessionData) → ketal_sessions doc
           → KetalSessionService.createPlayer(playerData) × N → ketal_players docs
           → KetalSessionService.createCards(cardsData) → ketal_cards doc

Updates:
  Session change (turn, phase, status) → updateSession()
  Player change (sips, cards, choices) → updatePlayer()
  Cards change (drinkingCards, givingCards) → updateCards()

Realtime → 3 subscriptions → merged into game state signal
```

### Serialization

Keep the same JSON serialization strategy:
- `cards`, `choices` in ketal_players: `JSON.stringify()` on write, `JSON.parse()` on read
- `drinkingCards`, `givingCards` in ketal_cards: same pattern
- Handle both string and array formats on read (realtime may send raw arrays)

### Appwrite Collection IDs

Collection IDs are defined in the environment config or as constants. Match the IDs used in the backend migrations (story 12.11).

### GameService Dual-Mode

`gameMode = computed(() => roomService.currentRoom() ? 'room' : 'local')`

- **Local mode**: No changes needed. localStorage persistence via LocalModeService is independent.
- **Room mode**: All Appwrite interactions go through the refactored KetalSessionService.

### Testing

- **Framework**: Karma/Jasmine
- **Test location**: `.spec.ts` files co-located with source files
- **Pattern**: Mock Appwrite SDK calls, test mapping logic, test service methods independently
- **Coverage**: 80% threshold (existing project standard)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story drafted | SM |
