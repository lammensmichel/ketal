# Story: 4.3 - Sip Counter Display

**Status**: Done
**Epic**: Sips Calculation
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to see my current sip count with clear drunk vs given distinction
**So that** I know how much I need to drink and how much I can distribute

---

## Acceptance Criteria

1. [x] **AC1**: Calculate current turn sips based on game phase and last card
2. [x] **AC2**: Display drunk sips (negative/to drink) distinctly from given sips (positive/to give)
3. [x] **AC3**: Support absolute value display mode for UI flexibility
4. [x] **AC4**: Show real-time updates as cards are drawn
5. [x] **AC5**: Calculate total given sips from player's cards in summary mode

---

## Tasks

- [x] **T1** (AC: 1, 2): Implement getSipCnt() in PlayerHelperService with phase-aware logic
- [x] **T2** (AC: 3): Add absolute parameter to return Math.abs() when needed
- [x] **T3** (AC: 4): Call getSipCnt() from PlayerCardComponent bound to template
- [x] **T4** (AC: 5): Implement getTotalGivenSips() summing card.givenSips values
- [x] **T5** (All): Write unit tests for sip counter calculations

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/_shared/_helpers/player.helper.ts` | 70-116 | getSipCnt() - main sip calculation with phase logic |
| `src/app/_shared/_helpers/player.helper.ts` | 118-129 | getTotalGivenSips() - sum of givenSips on cards |
| `src/app/_components/players/player-card/player-card.component.ts` | 38-40 | getSipCount() - wrapper calling helper service |
| `src/app/_components/players/player-card/player-card.component.html` | - | Template displaying sip counts |

### Architecture Context
- Pattern: Helper service method called by component, computed from game state
- Constraints: Different logic for phase 1 vs phase 2, negative = drink, positive = give
- Reference: Uses CardService.getCardValue() for matching

### Implementation Hints
- Phase 1: Show sips for player who just drew (previousPlayer based on activePlayer)
- Phase 2: Calculate based on drinkingCards/givingCards arrays
- Negative values indicate drinking sips, positive indicate giving sips
- Absolute mode: wrap result in Math.abs() for display without sign
- isOdd check on total cards determines if last was drinking (odd) or giving (even)
- Loop player.cards comparing value to lastCard value, accumulate sips

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Phase 1: Returns 0 for non-previous player
- [x] Phase 1: Returns negative sips for previous player
- [x] Phase 2: Returns negative for drinking card matches
- [x] Phase 2: Returns positive for giving card matches
- [x] Absolute mode returns unsigned values
- [x] getTotalGivenSips sums all card.givenSips correctly
- [x] Multiple matching cards multiply sip count

### Edge Cases
- [x] First player in round (previous is last player)
- [x] Transition from phase 1 to phase 2 (activePlayer undefined)
- [x] No matching cards (returns 0)
- [x] Cards with undefined givenSips filtered out

---

## Dependencies

### Blocked By
- Story 4.1: Prediction Phase Sips (requires sips to be calculated)
- Story 4.2: Drinking/Giving Phase Sips (requires phase 2 sips)
- Story 3.4: Playing Card Display (player-card uses playing-card)

### Blocks
- None (end of epic chain)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
getSipCnt() has complex phase-aware logic. In phase 1, only shows sips for the player who just drew (found via activePlayer index - 1). In phase 2, calculates by comparing player's card values to the last drawn card. Uses maybeAbs helper for optional absolute value conversion. getTotalGivenSips() filters cards with non-zero givenSips and sums them.

### Files Changed
- src/app/_shared/_helpers/player.helper.ts
- src/app/_components/players/player-card/player-card.component.ts

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Sip counts update correctly in real-time
- Phase transitions handled smoothly
- Absolute/signed values display appropriately

### Sign-off
Date: 2026-01-23
