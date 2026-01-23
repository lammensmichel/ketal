# Story: 2.1 - Game Initialization

**Status**: Done
**Epic**: Epic 2: Game Flow & State Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to start a new game with the registered players
**So that** the game begins in the correct initial state and can resume from localStorage if interrupted

---

## Acceptance Criteria

1. [x] **AC1**: Game starts with all registered players loaded from localStorage
2. [x] **AC2**: Initial game state is set to phase 1, status 1, turn 1
3. [x] **AC3**: First player is set as active player
4. [x] **AC4**: Game state is loaded from localStorage on service initialization
5. [x] **AC5**: Card deck is constructed when game begins

---

## Tasks

- [x] **T1** (AC: 1, 2, 3, 5): Implement `beginGame()` method in GameService
- [x] **T2** (AC: 4): Implement `loadGameFromStorage()` method
- [x] **T3** (AC: 1, 2, 3): Create footer button to trigger game start
- [x] **T4** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 423-440 | `beginGame()` method initializes game with players, sets phase/status/turn |
| `src/app/services/game/game.service.ts` | 48-51 | `loadGameFromStorage()` loads game from localStorage |
| `src/app/services/game/game.service.ts` | 53-65 | `createEmptyGame()` creates default empty game state |
| `src/app/services/game/game.service.ts` | 26 | Signal initialization with localStorage load |
| `src/app/_shared/_components/footer/footer.component.ts` | 102-105 | `beginGame()` triggers game start and navigation |

### Architecture Context
- Pattern: Signal-based state management with computed properties
- Constraints: Game state must be serializable to JSON for localStorage
- Reference: CLAUDE.md - Angular 19 Signals pattern

### Implementation Hints
- GameService uses `signal()` for reactive state management
- `beginGame()` accepts optional `withSummaryMode` parameter for extended game mode
- Card deck is constructed via CardDeckHelperService before game starts

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test game initializes with correct status (1)
- [x] Test game initializes with correct phase (1)
- [x] Test game initializes with correct turn (1)
- [x] Test first player is set as active player
- [x] Test game loads from localStorage on initialization

### Edge Cases
- [x] Handle empty player list gracefully
- [x] Handle corrupted localStorage data

---

## Dependencies

### Blocked By
- Story 1.x: Player Management (players must exist)

### Blocks
- Story 2.2: Two-Phase Game System
- Story 2.3: Turn-Based Selection

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story - feature already implemented | Claude |

---

## Dev Agent Record

### Implementation Notes
The game initialization is implemented in `GameService.beginGame()`. This method:
1. Constructs the card deck via `CardDeckHelperService`
2. Loads players from localStorage
3. Creates a new Game object with initial state (turn: 1, phase: 1, status: 1)
4. Sets the first player as active player
5. Saves and notifies subscribers via signals

The service also automatically loads existing game state from localStorage during initialization via the `loadGameFromStorage()` method called in the signal constructor.

### Files Changed
- `/home/knabo/dev/ketal/src/app/services/game/game.service.ts`
- `/home/knabo/dev/ketal/src/app/_shared/_components/footer/footer.component.ts`

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Implementation complete and functional

### Sign-off
Date: 2026-01-23
