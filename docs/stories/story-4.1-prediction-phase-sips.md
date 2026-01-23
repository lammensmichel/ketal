# Story: 4.1 - Prediction Phase Sips

**Status**: Done
**Epic**: Sips Calculation
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to receive sips based on my prediction accuracy during phase 1
**So that** the game has meaningful consequences for each guess

---

## Acceptance Criteria

1. [x] **AC1**: Turn 1 (Color): Award 1 sip for incorrect color prediction (red vs black)
2. [x] **AC2**: Turn 2 (Plus/Minus): Award 2 sips for wrong higher/lower guess, 4 sips if cards are equal
3. [x] **AC3**: Turn 3 (In/Out): Award 3 sips for wrong in/out guess, 6 sips if card matches boundary
4. [x] **AC4**: Turn 4 (Suit): Award 4 sips for incorrect suit prediction
5. [x] **AC5**: Add awarded sips to player's drunk counter

---

## Tasks

- [x] **T1** (AC: 1): Implement getSipsNumberForColorChoice() comparing prediction to card color
- [x] **T2** (AC: 2): Implement getSipsNumberForMinusChoice() with equal card bonus
- [x] **T3** (AC: 3): Implement getSipsNumberForInAndOutChoice() with boundary detection
- [x] **T4** (AC: 4): Implement getSipsNumberForSuitChoice() comparing suit strings
- [x] **T5** (AC: 5): Implement assignSipsForFirstTurn() switch dispatching to correct method
- [x] **T6** (All): Write unit tests for all sip calculation scenarios

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 156-165 | getSipsNumberForColorChoice() - 1 sip for wrong color |
| `src/app/services/game/game.service.ts` | 167-182 | getSipsNumberForMinusChoice() - 2/4 sips for plus/minus |
| `src/app/services/game/game.service.ts` | 184-198 | getSipsNumberForInAndOutChoice() - 3/6 sips for in/out |
| `src/app/services/game/game.service.ts` | 200-203 | getSipsNumberForSuitChoice() - 4 sips for wrong suit |
| `src/app/services/game/game.service.ts` | 205-232 | assignSipsForFirstTurn() - turn-based dispatch |
| `src/app/services/game/game.service.ts` | 234-247 | addPlayerSip() - updates player sip counters |

### Architecture Context
- Pattern: Private calculation methods called by assignSipsForFirstTurn() based on turn number
- Constraints: Phase 1 only (turns 1-4), all sips go to 'drunk' counter
- Reference: Uses CardService for color/value checks, PlayerHelperService for choice retrieval

### Implementation Hints
- Color: ColorsEnum.Red + isBlackCard OR ColorsEnum.Black + isRedCard = 1 sip
- Plus/Minus: Compare getCardValue() of previous and new card
- In/Out: Use lowestCard() and greatestCard() on first two cards as boundaries
- Suit: Direct string comparison between choice and card.suit
- Boundary hit (6 sips): newValue equals lowestValue or highestValue

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Turn 1: Correct color prediction = 0 sips
- [x] Turn 1: Wrong color prediction = 1 sip
- [x] Turn 2: Correct plus/minus = 0 sips
- [x] Turn 2: Wrong plus/minus = 2 sips
- [x] Turn 2: Equal cards = 4 sips
- [x] Turn 3: Correct in/out = 0 sips
- [x] Turn 3: Wrong in/out = 3 sips
- [x] Turn 3: Boundary match = 6 sips
- [x] Turn 4: Correct suit = 0 sips
- [x] Turn 4: Wrong suit = 4 sips

### Edge Cases
- [x] In/Out with same value for first two cards (no "in" possible)
- [x] Plus/Minus with Ace as first card (nothing higher)
- [x] Plus/Minus with 2 as first card (nothing lower)

---

## Dependencies

### Blocked By
- Story 3.2: Random Card Drawing (requires cards to evaluate)
- Story 3.3: Card Comparison Logic (requires value/color comparison)

### Blocks
- Story 4.3: Sip Counter Display (requires sips to display)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
All sip calculation methods are private to GameService. assignSipsForFirstTurn() uses switch on game.turn to call appropriate method. Results stored on card.sips and added to player.sips.drunk via addPlayerSip(). In/Out logic compares new card value against range defined by first two cards.

### Files Changed
- src/app/services/game/game.service.ts

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- All turn calculations verified correct
- Boundary conditions handled properly
- Sip counters update in real-time

### Sign-off
Date: 2026-01-23
