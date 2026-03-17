# Story: 2.3 - Turn-Based Selection

**Status**: Done
**Epic**: Epic 2: Game Flow & State Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to make different predictions during each of the 4 turns
**So that** I can make strategic choices that affect my drinking penalties

---

## Acceptance Criteria

1. [x] **AC1**: Turn 1 allows color selection (red/black)
2. [x] **AC2**: Turn 2 allows plus/minus selection (higher/lower)
3. [x] **AC3**: Turn 3 allows in/out selection (inside/outside range)
4. [x] **AC4**: Turn 4 allows suit selection (hearts/diamonds/clubs/spades)
5. [x] **AC5**: Turn auto-advances when all players have made their choice
6. [x] **AC6**: Turn state is tracked via computed signals

---

## Tasks

- [x] **T1** (AC: 1-4): Implement choice methods in FooterComponent
- [x] **T2** (AC: 1-4): Implement `setChoiceAndPickCard()` in GameService
- [x] **T3** (AC: 5): Implement `allPlayersMadeChoices()` validation
- [x] **T4** (AC: 6): Create computed signal for turn state
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/services/game/game.service.ts` | 317-323 | `setChoiceAndPickCard()` combines choice and card pick |
| `src/app/services/game/game.service.ts` | 81-89 | `setCardChoice()` updates player choice |
| `src/app/services/game/game.service.ts` | 295-315 | `allPlayersMadeChoices()` validates all players chose |
| `src/app/services/game/game.service.ts` | 33 | `turn` computed signal |
| `src/app/_shared/_components/footer/footer.component.ts` | 30-44 | Choice methods: `chooseColor()`, `plusOrMinus()`, `inOut()`, `chooseSuit()` |
| `src/app/_shared/_models/enums/drink_choice.enum.ts` | - | DrinkChoiceEnum defines choice types |

### Architecture Context
- Pattern: Each turn maps to a specific DrinkChoiceEnum value
- Constraints: Choices are stored as strings in player.choice object
- Reference: DrinkChoiceEnum (Color, PlusOrMinus, InAndOut, Suit)

### Implementation Hints
- FooterComponent provides UI buttons for each turn type
- `setChoiceAndPickCard()` is the main entry point for making choices
- Turn validation uses switch statement on game.turn value
- Player choices are persisted in player.choice object with enum keys

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test turn 1 accepts color choice
- [x] Test turn 2 accepts plus/minus choice
- [x] Test turn 3 accepts in/out choice
- [x] Test turn 4 accepts suit choice
- [x] Test turn advances after all players choose

### Edge Cases
- [x] Handle invalid choice for current turn
- [x] Handle player changing choice before card pick

---

## Dependencies

### Blocked By
- Story 2.1: Game Initialization
- Story 2.2: Two-Phase Game System

### Blocks
- Story 2.4: Active Player Rotation

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story - feature already implemented | Claude |

---

## Dev Agent Record

### Implementation Notes
Turn-based selection is implemented through the following flow:

1. **FooterComponent** provides UI methods for each turn:
   - `chooseColor(color)` - Turn 1
   - `plusOrMinus(selection)` - Turn 2
   - `inOut(selection)` - Turn 3
   - `chooseSuit(selection)` - Turn 4

2. Each method calls `GameService.setChoiceAndPickCard()` with the appropriate enum and value

3. **GameService** handles the logic:
   - `setCardChoice()` updates the player's choice object
   - `pickCard()` draws a card and calculates sips
   - Turn advances when last player in rotation completes

4. **Sip calculation** in `assignSipsForFirstTurn()` uses switch on game.turn:
   - Turn 1: Color match/mismatch (1 sip)
   - Turn 2: Plus/minus match (2 sips, 4 if equal)
   - Turn 3: In/out match (3 sips, 6 if on boundary)
   - Turn 4: Suit match (4 sips)

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
- All turn types work correctly

### Sign-off
Date: 2026-01-23
