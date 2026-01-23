# Story: 3.1 - Deck Construction

**Status**: Done
**Epic**: Card Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** game system
**I want** to construct a standard 52-card deck that auto-doubles for large player counts
**So that** there are enough cards for all players throughout the game

---

## Acceptance Criteria

1. [x] **AC1**: Build a complete 52-card deck with 4 suits (hearts, diamonds, clubs, spades) and 13 values (2-10, J, Q, K, A)
2. [x] **AC2**: Automatically double the deck (104 cards) when more than 10 players are in the game
3. [x] **AC3**: Store the constructed deck in localStorage for game persistence
4. [x] **AC4**: Provide ability to reset/clear the deck when starting a new game

---

## Tasks

- [x] **T1** (AC: 1): Create constructOneDeck() method to build 52-card array iterating suits and values
- [x] **T2** (AC: 1, 2): Create constructDeck() method that calls constructOneDeck() once or twice based on player count
- [x] **T3** (AC: 3): Save constructed deck to localStorage using LocalService
- [x] **T4** (AC: 4): Implement resetCards() method to clear deck from memory and storage
- [x] **T5** (All): Write unit tests for deck construction scenarios

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/_shared/_helpers/card-deck.helper.ts` | 25-41 | constructOneDeck() - builds single 52-card deck |
| `src/app/_shared/_helpers/card-deck.helper.ts` | 43-55 | constructDeck() - orchestrates deck creation with auto-double |
| `src/app/_shared/_helpers/card-deck.helper.ts` | 72-75 | resetCards() - clears deck state |
| `src/app/_shared/_models/enums/suits.enum.ts` | - | SuitsEnum defining hearts, diams, clubs, spades |
| `src/app/_shared/_models/enums/card_value.enum.ts` | - | CardValueEnum defining 2-10, J, Q, K, A |
| `src/app/_shared/_models/card-type.model.ts` | - | CardType interface for card objects |

### Architecture Context
- Pattern: Service-based helper injected via Angular DI
- Constraints: Must support 2-23 players; deck doubles at >10 players
- Reference: Card images stored as SVG at assets/images/cards/svg/

### Implementation Hints
- Card object includes: suit, icon (HTML entity), value, img path, sips, selected, givenSips
- Deck stored as JSON string in localStorage under 'cardDeck' key
- Player count accessed via PlayerHelperService.players.length

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Deck contains exactly 52 cards with <=10 players
- [x] Deck contains exactly 104 cards with >10 players
- [x] All 4 suits present in constructed deck
- [x] All 13 values present per suit
- [x] Deck persists to localStorage after construction

### Edge Cases
- [x] Exactly 10 players (should be single deck)
- [x] Exactly 11 players (should be double deck)
- [x] Reset clears both memory and storage

---

## Dependencies

### Blocked By
- None

### Blocks
- Story 3.2: Random Card Drawing (requires constructed deck)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
Deck construction implemented in CardDeckHelperService. Uses nested loops over possibleSuits and possibleValues arrays from enums. Auto-double logic checks playerSrv.players.length > 10. Cards stored with SVG image paths following naming convention: {value}_{suit}.svg

### Files Changed
- src/app/_shared/_helpers/card-deck.helper.ts

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Implementation matches acceptance criteria
- Deck construction handles all player count scenarios

### Sign-off
Date: 2026-01-23
