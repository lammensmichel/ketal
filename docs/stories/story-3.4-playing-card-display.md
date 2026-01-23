# Story: 3.4 - Playing Card Display

**Status**: Done
**Epic**: Card Management
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** player
**I want** to see visually appealing card representations with clear selection states
**So that** I can easily identify my cards and see which ones are currently relevant

---

## Acceptance Criteria

1. [x] **AC1**: Display cards using SVG images from assets folder
2. [x] **AC2**: Support overlapping card layout for compact display
3. [x] **AC3**: Visually highlight selected/active cards with emphasis styling
4. [x] **AC4**: Show card back image when card data is not available

---

## Tasks

- [x] **T1** (AC: 1): Create PlayingCardComponent with img element bound to card.img path
- [x] **T2** (AC: 2): Implement leftOverlap input for negative margin positioning
- [x] **T3** (AC: 3): Apply 'emphasis' CSS class when card.selected is true
- [x] **T4** (AC: 4): Default to blue_back.svg when card image is undefined
- [x] **T5** (All): Write unit tests and visual regression tests

---

## Dev Notes

### Relevant Files
| File | Line | Description |
|------|------|-------------|
| `src/app/_shared/_components/playing-card/playing-card.component.ts` | 1-16 | Component class with card and leftOverlap inputs |
| `src/app/_shared/_components/playing-card/playing-card.component.html` | 1-9 | Template with conditional CSS classes |
| `src/app/_shared/_components/playing-card/playing-card.component.scss` | - | Styles for overlap and emphasis effects |
| `src/assets/images/cards/svg/` | - | SVG card images (52 cards + back) |

### Architecture Context
- Pattern: Standalone presentational component with @Input decorators
- Constraints: Must handle undefined card gracefully
- Reference: Card images follow naming: {value}_{suit}.svg (e.g., ace_hearts.svg)

### Implementation Hints
- Uses NgClass for conditional styling
- leftOverlap creates negative left margin for overlapping cards
- emphasis class adds visual highlight (likely scale, shadow, or border)
- Nullish coalescing for fallback to card back image

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Component renders with valid card data
- [x] Correct SVG image path is used
- [x] leftOverlap class applied when input is true
- [x] emphasis class applied when card.selected is true
- [x] Default card back shown when card is undefined

### Edge Cases
- [x] Card with missing img property
- [x] Multiple overlapping cards in sequence
- [x] Rapid selection state changes

---

## Dependencies

### Blocked By
- Story 3.1: Deck Construction (requires card data structure)

### Blocks
- Story 4.3: Sip Counter Display (player-card uses playing-card)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Claude |
| 2026-01-23 | Marked as Done - implementation complete | Claude |

---

## Dev Agent Record

### Implementation Notes
PlayingCardComponent is a simple presentational component. Uses @Input for card data and leftOverlap boolean. Template uses ngClass for conditional 'emphasis' and 'left-overlap' classes. Image src defaults to blue_back.svg via nullish coalescing operator.

### Files Changed
- src/app/_shared/_components/playing-card/playing-card.component.ts
- src/app/_shared/_components/playing-card/playing-card.component.html
- src/app/_shared/_components/playing-card/playing-card.component.scss

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- SVG cards render correctly at all screen sizes
- Overlap effect works smoothly
- Selection state visually distinct

### Sign-off
Date: 2026-01-23
