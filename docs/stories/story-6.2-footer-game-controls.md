# Story: 6.2 - Footer Game Controls

**Status**: Done
**Epic**: Epic 6 - UI Components
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** game host
**I want** context-aware game controls in the footer
**So that** I can manage game flow with appropriate actions for each phase

---

## Acceptance Criteria

1. [x] **AC1**: Phase-specific buttons display based on game state
2. [x] **AC2**: Start game button visible when game status is new (0)
3. [x] **AC3**: Display summary button visible when game is finished (status 2)
4. [x] **AC4**: Next turn/phase buttons during active gameplay

---

## Tasks

- [x] **T1** (AC: 1): Implement phase-aware button rendering
- [x] **T2** (AC: 2): Add start game button with player validation
- [x] **T3** (AC: 3): Add display summary button for finished games
- [x] **T4** (AC: 4): Implement next turn/phase controls
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/_shared/_components/footer/footer.component.ts` | Footer with game controls |
| `src/app/_shared/_components/footer/footer.component.html` | Footer template |
| `src/app/_shared/_components/footer/footer.component.scss` | Footer styles |
| `src/app/services/game/game.service.ts` | Game state management |

### Architecture Context
- Pattern: Computed signals for button visibility
- Constraints: Buttons must respect game state machine
- Reference: docs/architecture.md

### Implementation Hints
- Use @switch for button rendering based on game.status
- Computed signals for canStart, canAdvance, canShowSummary
- Integrate with game service methods
- Bootstrap button styling

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Start button visible for new game
- [x] Next buttons visible during gameplay
- [x] Summary button visible for finished game
- [x] Buttons disabled when criteria not met

### Edge Cases
- [x] Single player (start disabled)
- [x] Mid-turn button states
- [x] Phase transitions

---

## Dependencies

### Blocked By
- None

### Blocks
- Story 5.4: Sip Distribution Validation (footer integration)

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Dev |
| 2026-01-23 | Marked as Done | Dev |

---

## Dev Agent Record

### Implementation Notes
Footer component renders context-aware buttons using @switch control flow. Computed signals determine button visibility and enabled state based on game service signals.

### Files Changed
- src/app/_shared/_components/footer/footer.component.ts
- src/app/_shared/_components/footer/footer.component.html
- src/app/_shared/_components/footer/footer.component.scss

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Button states correct for all phases
- Transitions work smoothly
- Styling consistent

### Sign-off
Date: 2026-01-23
