# Story: 2.5 - Game Reset

**Status**: Done
**Epic**: Epic 2: Game Flow & State Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to reset the game and start over
**So that** I can play multiple rounds without reloading the application

---

## Acceptance Criteria

1. [x] **AC1**: All game state is cleared (cards, sips, choices)
2. [x] **AC2**: Game status is reset to 0 (new game)
3. [x] **AC3**: Phase and turn are reset to 0
4. [x] **AC4**: Player data is preserved but their game state is reset
5. [x] **AC5**: Navigation redirects to player setup page
6. [x] **AC6**: Reset is available from header component

---

## Tasks

- [x] **T1** (AC: 1-4): Implement `resetGame()` method in GameService
- [x] **T2** (AC: 5, 6): Implement `restartGame()` in HeaderComponent with navigation
- [x] **T3** (AC: 5, 6): Implement `restartGame()` in FooterComponent with navigation
- [x] **T4** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 133-150 | `resetGame()` clears all game state |
| `src/app/_shared/_components/header/header.component.ts` | 32-35 | `restartGame()` triggers reset and navigation |
| `src/app/_shared/_components/footer/footer.component.ts` | 46-51 | `restartGame()` with sip validation |

### Architecture Context
- Pattern: Reset preserves players but clears their game-specific data
- Constraints: Must handle summary mode sip validation before reset
- Reference: FooterComponent validates all sips given before allowing reset

### Implementation Hints
- `resetGame()` iterates all players and resets: sips, cards, choices
- Player array itself is preserved (names, avatars remain)
- `playerHelper.savePlayerToStorage()` persists reset player state
- HeaderComponent provides simple reset, FooterComponent adds validation

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test game status resets to 0
- [x] Test phase resets to 0
- [x] Test turn resets to 0
- [x] Test player sips reset to 0
- [x] Test player cards cleared
- [x] Test player choices cleared
- [x] Test navigation to /players occurs

### Edge Cases
- [x] Handle reset during phase 2 with pending sips
- [x] Handle reset when no game is active

---

## Dependencies

### Blocked By
- Story 2.1: Game Initialization

### Blocks
- None (terminal feature)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story - feature already implemented | Claude |

---

## Dev Agent Record

### Implementation Notes
Game reset is implemented in `GameService.resetGame()` (lines 133-150):

```typescript
resetGame(): void {
  this.updateGame((game) => {
    game.givingCards = [];
    game.drinkingCards = [];
    game.phase = 0;
    game.turn = 0;
    game.activePlayer = undefined;
    game.status = 0;

    game.players.forEach((player) => {
      player.sips = { drunk: 0, given: 0 };
      player.cards = [];
      player.choice = { color: '', plus_or_minus: '', in_out: '', suit: '' };
    });

    this.playerHelper.savePlayerToStorage(game.players);
  });
}
```

**Reset Operations:**
1. Clear drinking and giving card arrays
2. Reset phase to 0 (not started)
3. Reset turn to 0
4. Clear activePlayer
5. Set status to 0 (new game)
6. For each player: reset sips, clear cards, clear choices
7. Persist player state to localStorage

**UI Integration:**
- HeaderComponent.restartGame() calls resetGame() and navigates to /players
- FooterComponent.restartGame() validates sips are given first (in summary mode)

### Files Changed
- `/home/knabo/dev/ketal/src/app/services/game/game.service.ts`
- `/home/knabo/dev/ketal/src/app/_shared/_components/header/header.component.ts`
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
- Reset properly clears all game state

### Sign-off
Date: 2026-01-23
