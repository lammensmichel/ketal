# Story: 4.2 - Drinking/Giving Phase Sips

**Status**: Done
**Epic**: Sips Calculation
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to drink or give sips when cards are drawn in phase 2
**So that** matching cards in my hand have consequences

---

## Acceptance Criteria

1. [x] **AC1**: Alternate between drinking and giving cards (3 of each, 6 total)
2. [x] **AC2**: Sip count increments each card: 1, 2, 3, 4, 5, 6
3. [x] **AC3**: Match cards by value - players with matching cards drink/give
4. [x] **AC4**: Drinking cards add to player's drunk sips
5. [x] **AC5**: Giving cards add to player's given sips (in summary mode)
6. [x] **AC6**: End game (status=2) after 6th card

---

## Tasks

- [x] **T1** (AC: 1): Implement isGivingCard() checking drinkingCards.length > givingCards.length
- [x] **T2** (AC: 2): Implement getSipsNumber() calculating based on card counts
- [x] **T3** (AC: 3): Implement selectCardOnPlayer() marking matching cards as selected
- [x] **T4** (AC: 4, 5): Implement addSips() iterating players and matching by value
- [x] **T5** (AC: 6): Check givingCards.length === 6 in displayNewCard() to set status=2
- [x] **T6** (All): Write unit tests for phase 2 sip calculations

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 346-373 | displayNewCard() - main phase 2 card logic |
| `src/app/services/game/game.service.ts` | 375-385 | addSips() - awards sips to matching players |
| `src/app/services/game/game.service.ts` | 387-394 | saveCardAndSips() - persists card and sips |
| `src/app/services/game/game.service.ts` | 396-398 | isGivingCard() - determines card type |
| `src/app/services/game/game.service.ts` | 400-411 | selectCardOnPlayer() - highlights matching cards |
| `src/app/services/game/game.service.ts` | 413-421 | getSipsNumber() - calculates sip amount |

### Architecture Context
- Pattern: Alternating array fills (drinking, giving, drinking, giving...)
- Constraints: Phase 2 only, game ends when 6 giving cards drawn
- Reference: Summary mode enables givenSips tracking on individual cards

### Implementation Hints
- Card sequence: drink(1), give(2), drink(3), give(4), drink(5), give(6)
- getSipsNumber(): First card = 1, then max(drinkingLen, givingLen) + 1
- addSips(): Loop through players, for each card matching value add sipNb
- isGivingCard true = add to player.sips.given, false = add to player.sips.drunk
- In summary mode, giving cards also set card.givenSips for redistribution UI

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] First card is drinking card worth 1 sip
- [x] Second card is giving card worth 2 sips
- [x] Sip values increment correctly through all 6 cards
- [x] Multiple matching cards multiply sips
- [x] Non-matching cards receive 0 sips
- [x] Drinking sips go to 'drunk' counter
- [x] Giving sips go to 'given' counter
- [x] Game status changes to 2 after 6th card

### Edge Cases
- [x] Player with multiple matching cards (e.g., two 7s)
- [x] No players have matching cards for a drawn card
- [x] Summary mode off - givenSips not tracked
- [x] Rapid card drawing doesn't skip cards

---

## Dependencies

### Blocked By
- Story 3.2: Random Card Drawing (requires card drawing)
- Story 4.1: Prediction Phase Sips (player must have 4 cards from phase 1)

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
displayNewCard() orchestrates phase 2: deselects previous cards, checks for pending sip assignments (summary mode), draws new card, calculates sips, highlights matches, saves state. isGivingCard() uses array length comparison - when drinking has more than giving, next card is giving. getSipsNumber() returns position-based value (1-6).

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
- Drinking/giving alternation correct
- Sip increments verified 1-6
- Summary mode tracking functional

### Sign-off
Date: 2026-01-23
