# Story: 3.3 - Card Comparison Logic

**Status**: Done
**Epic**: Card Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** game system
**I want** to compare card values and determine card properties
**So that** predictions can be evaluated and sips calculated correctly

---

## Acceptance Criteria

1. [x] **AC1**: Convert card face values to numeric values (Ace=14, King=13, Queen=12, Jack=11, 2-10 as numeric)
2. [x] **AC2**: Compare two cards and return relative order (-1, 0, or 1)
3. [x] **AC3**: Find the lowest card from an array of cards
4. [x] **AC4**: Find the highest card from an array of cards
5. [x] **AC5**: Determine if a card is red (hearts, diamonds) or black (spades, clubs)

---

## Tasks

- [x] **T1** (AC: 1): Implement getCardValue() with switch statement for face cards
- [x] **T2** (AC: 2): Implement lowerOrUpperCard() returning comparison result
- [x] **T3** (AC: 3): Implement lowestCard() iterating through card array
- [x] **T4** (AC: 4): Implement greatestCard() iterating through card array
- [x] **T5** (AC: 5): Implement isRedCard() and isBlackCard() checking suit
- [x] **T6** (All): Write unit tests for all comparison scenarios

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/card/card.service.ts` | 15-38 | getCardValue() - converts card to numeric value |
| `src/app/services/card/card.service.ts` | 46-60 | lowerOrUpperCard() - compares two cards |
| `src/app/services/card/card.service.ts` | 62-70 | lowestCard() - finds minimum in array |
| `src/app/services/card/card.service.ts` | 72-80 | greatestCard() - finds maximum in array |
| `src/app/services/card/card.service.ts` | 82-84 | isRedCard() - checks for hearts/diamonds |
| `src/app/services/card/card.service.ts` | 86-88 | isBlackCard() - checks for spades/clubs |

### Architecture Context
- Pattern: Pure utility service with no state, injectable via DI
- Constraints: Must handle null/undefined card gracefully (returns 0)
- Reference: Uses CardValueEnum and SuitsEnum for value mapping

### Implementation Hints
- Face card values: Ace=14, King=13, Queen=12, Jack=11
- Numeric cards use parseInt() on string value
- Comparison returns: -1 (less), 0 (equal), 1 (greater)
- Red suits: diams (diamonds), hearts
- Black suits: spades, clubs

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Ace returns 14
- [x] King returns 13, Queen returns 12, Jack returns 11
- [x] Numeric cards (2-10) return their integer values
- [x] Comparison of equal cards returns 0
- [x] Lower card comparison returns -1
- [x] Higher card comparison returns 1
- [x] lowestCard finds minimum correctly
- [x] greatestCard finds maximum correctly
- [x] Hearts and diamonds identified as red
- [x] Spades and clubs identified as black

### Edge Cases
- [x] Null/undefined card returns 0 for value
- [x] Single card array for lowest/greatest
- [x] Array with duplicate values

---

## Dependencies

### Blocked By
- None (pure utility service)

### Blocks
- Story 4.1: Prediction Phase Sips (uses comparison for plus/minus, in/out)
- Story 4.2: Drinking/Giving Phase Sips (uses value matching)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
CardService is a stateless utility service. getCardValue() uses switch statement for face cards and parseInt for numeric. lowerOrUpperCard() returns -1/0/1 for less/equal/greater. Color determination checks suit against SuitsEnum values.

### Files Changed
- src/app/services/card/card.service.ts

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- All card value conversions correct
- Comparison logic handles all cases
- Color detection matches game rules

### Sign-off
Date: 2026-01-23
