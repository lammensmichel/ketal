# Story: 2.2 - Two-Phase Game System

**Status**: Done
**Epic**: Epic 2: Game Flow & State Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** the game to have two distinct phases (prediction and drinking/giving)
**So that** I can first make predictions and then experience the consequences

---

## Acceptance Criteria

1. [x] **AC1**: Phase 1 consists of 4 prediction rounds (color, plus/minus, in/out, suit)
2. [x] **AC2**: Phase 2 consists of 6 cards for drinking and giving sips
3. [x] **AC3**: Game automatically transitions from phase 1 to phase 2 after turn 4
4. [x] **AC4**: Phase state is tracked and accessible via computed signals
5. [x] **AC5**: UI adapts based on current phase

---

## Tasks

- [x] **T1** (AC: 1, 3): Implement phase transition logic in `pickCard()` method
- [x] **T2** (AC: 2): Implement `displayNewCard()` for phase 2 card handling
- [x] **T3** (AC: 4): Create computed signal for phase state
- [x] **T4** (AC: 5): Implement phase-aware UI in main-game component
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 267-293 | `pickCard()` handles phase transition when turn > 4 |
| `src/app/services/game/game.service.ts` | 346-373 | `displayNewCard()` manages phase 2 card display |
| `src/app/services/game/game.service.ts` | 34 | `phase` computed signal |
| `src/app/services/game/game.service.ts` | 413-421 | `getSipsNumber()` calculates sips based on card position |
| `src/app/_components/game/main-game/main-game.component.ts` | 1-16 | Main game component with phase-aware rendering |
| `src/app/_shared/_models/game.model.ts` | 8 | `phase` property in Game interface |

### Architecture Context
- Pattern: Phase is a numeric value (0=not started, 1=prediction, 2=drinking/giving)
- Constraints: Phase transition only occurs after all 4 turns complete
- Reference: CLAUDE.md - Game has two phases

### Implementation Hints
- Phase 1: Each turn corresponds to a prediction type (1=color, 2=plus/minus, 3=in/out, 4=suit)
- Phase 2: Alternates between drinking cards and giving cards (6 total)
- Sips escalate: 1, 2, 3, 4, 5, 6 for each card in phase 2

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test phase 1 has exactly 4 turns
- [x] Test auto-transition to phase 2 after turn 4
- [x] Test phase 2 handles 6 cards correctly
- [x] Test sips calculation for each card position

### Edge Cases
- [x] Handle phase transition with multiple players
- [x] Handle incomplete predictions before phase transition

---

## Dependencies

### Blocked By
- Story 2.1: Game Initialization

### Blocks
- Story 2.3: Turn-Based Selection
- Story 2.4: Active Player Rotation

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story - feature already implemented | Claude |

---

## Dev Agent Record

### Implementation Notes
The two-phase game system is implemented as follows:

**Phase 1 (Prediction Phase)**:
- Turns 1-4 map to prediction types: color, plus/minus, in/out, suit
- Each player makes a prediction and picks a card
- After the last player completes turn 4, phase transitions to 2

**Phase 2 (Drinking/Giving Phase)**:
- 6 cards are drawn alternating between drinking and giving
- `displayNewCard()` manages card display and sip assignment
- `getSipsNumber()` returns escalating sips (1-6)
- Players with matching cards drink or give sips
- Game status changes to 2 (finished) after 6th card

The transition logic in `pickCard()` (lines 281-288) checks if turn > 4 and sets phase = 2.

### Files Changed
- `/home/knabo/dev/ketal/src/app/services/game/game.service.ts`
- `/home/knabo/dev/ketal/src/app/_components/game/main-game/main-game.component.ts`

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
- Phase transitions work correctly

### Sign-off
Date: 2026-01-23
