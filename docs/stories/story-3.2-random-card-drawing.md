# Story: 3.2 - Random Card Drawing

**Status**: Done
**Epic**: Card Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** game system
**I want** to draw random cards from the deck and remove them
**So that** each card is only dealt once during the game

---

## Acceptance Criteria

1. [x] **AC1**: Pick a random card from the current deck
2. [x] **AC2**: Remove the drawn card from the deck to prevent re-drawing
3. [x] **AC3**: Persist the updated deck to localStorage after each draw
4. [x] **AC4**: Return the drawn card for use in game logic

---

## Tasks

- [x] **T1** (AC: 1): Implement random index selection using Math.random() * deck.length
- [x] **T2** (AC: 2): Remove selected card from deck array using splice()
- [x] **T3** (AC: 3): Save updated deck back to localStorage
- [x] **T4** (AC: 4): Return the CardType object for game processing
- [x] **T5** (All): Write unit tests for random card drawing

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/_shared/_helpers/card-deck.helper.ts` | 57-70 | getRandomCard() - picks and removes random card |
| `src/app/services/game/game.service.ts` | 267-276 | pickCard() - calls getRandomCard() during gameplay |
| `src/app/services/game/game.service.ts` | 359 | displayNewCard() - uses getRandomCard() for phase 2 |

### Architecture Context
- Pattern: Deck state managed in localStorage, loaded fresh on each draw
- Constraints: Must handle empty deck edge case gracefully
- Reference: CardDeckHelperService injected into GameService

### Implementation Hints
- Load deck from localStorage on each draw to ensure consistency
- Use indexOf to find card position before splice
- Card removal is done in-place on the array

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Returns a valid CardType object
- [x] Deck size decreases by 1 after draw
- [x] Drawn card no longer exists in deck
- [x] localStorage is updated after draw

### Edge Cases
- [x] Drawing from single-card deck
- [x] Multiple consecutive draws maintain deck integrity
- [x] Deck state persists across service reinitializations

---

## Dependencies

### Blocked By
- Story 3.1: Deck Construction (requires deck to exist)

### Blocks
- Story 4.1: Prediction Phase Sips (requires cards for sip calculation)
- Story 4.2: Drinking/Giving Phase Sips (requires cards for matching)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
getRandomCard() loads deck from localStorage, selects random index, removes card via splice, saves updated deck, and returns the card. GameService calls this method in pickCard() for phase 1 and displayNewCard() for phase 2.

### Files Changed
- src/app/_shared/_helpers/card-deck.helper.ts
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
- Random selection and removal working correctly
- Persistence verified across game sessions

### Sign-off
Date: 2026-01-23
