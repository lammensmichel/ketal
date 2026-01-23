# Story: 9.4 - DiceBear Avatar Migration

**Status**: Done
**Epic**: Epic 9: Angular 19 Refactoring
**Created**: 2026-01-23
**Updated**: 2026-01-23
**Git Commit**: 0aef1cc

---

## Story

**As a** player
**I want** to see unique avatars for each player
**So that** I can easily identify players in the game

---

## Acceptance Criteria

1. [x] **AC1**: Player avatars are generated using DiceBear API
2. [x] **AC2**: Each player has a unique avatar based on their identifier
3. [x] **AC3**: Avatars load reliably (replacing deprecated placeskull.com)
4. [x] **AC4**: Avatar styling is consistent with game design

---

## Tasks

- [x] **T1** (AC: 1): Replace placeskull.com URLs with DiceBear API
- [x] **T2** (AC: 2): Generate unique seeds for avatar generation
- [x] **T3** (AC: 3): Update player.helper.ts with new avatar logic
- [x] **T4** (AC: 4): Update player-card.component.html template
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/_shared/_helpers/player.helper.ts` | Avatar URL generation |
| `src/app/_components/players/player-card/player-card.component.html` | Avatar display template |

### Architecture Context
- Pattern: External API for avatar generation
- Constraints: Must be reliable and performant
- Reference: DiceBear API documentation (https://www.dicebear.com/)

### Implementation Hints
- Use DiceBear URL format: `https://api.dicebear.com/7.x/{style}/svg?seed={seed}`
- Consider styles: avataaars, bottts, fun-emoji, lorelei, etc.
- Player name or ID can be used as seed for consistency

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test avatar URL generation produces valid URLs
- [x] Test unique seeds produce different avatars
- [x] Test avatar displays correctly in template

### Edge Cases
- [x] Handle API unavailability gracefully
- [x] Special characters in player names encoded properly

---

## Dependencies

### Blocked By
- None

### Blocks
- None

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | |
| 2026-01-23 | Marked as Done - implementation complete (git: 0aef1cc) | |

---

## Dev Agent Record

### Implementation Notes
Migrated from the deprecated placeskull.com service to DiceBear API for avatar generation. Each player now gets a unique avatar based on their player identifier used as a seed. This ensures consistent avatars across sessions while providing visually distinct representations for each player.

### Files Changed
- `src/app/_shared/_helpers/player.helper.ts`
- `src/app/_components/players/player-card/player-card.component.html`

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- DiceBear integration working correctly with unique avatars

### Sign-off
Date: 2026-01-23
