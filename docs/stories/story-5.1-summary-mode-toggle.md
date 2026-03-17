# Story: 5.1 - Summary Mode Toggle

**Status**: Done
**Epic**: Epic 5 - Summary Mode
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** game host
**I want** to enable or disable summary mode before starting the game
**So that** I can choose whether to track detailed sip distribution throughout the game

---

## Acceptance Criteria

1. [x] **AC1**: Summary mode toggle is visible in the game setup screen before game starts
2. [x] **AC2**: Toggle is only enabled when there are 2 or more players
3. [x] **AC3**: When enabled, a modal appears for sip distribution during gameplay
4. [x] **AC4**: Game state persists the summary mode setting

---

## Tasks

- [x] **T1** (AC: 1): Add summary mode toggle UI to app.component.ts
- [x] **T2** (AC: 2): Implement player count validation (minimum 2 players)
- [x] **T3** (AC: 3, 4): Add withSummaryMode signal to game.service.ts
- [x] **T4** (AC: 4): Persist summary mode setting in localStorage
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/app.component.ts` | Main app component with summary mode toggle |
| `src/app/services/game/game.service.ts` | Game state management with withSummaryMode signal |
| `src/app/services/local/local.service.ts` | localStorage persistence |

### Architecture Context
- Pattern: Signals for reactive state management
- Constraints: Toggle must be disabled during active game
- Reference: docs/architecture.md

### Implementation Hints
- Use WritableSignal<boolean> for withSummaryMode
- Computed signal to check player count >= 2
- Disable toggle when game.status > 0

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Toggle renders correctly
- [x] Toggle disabled with < 2 players
- [x] Toggle enabled with >= 2 players
- [x] Signal updates correctly on toggle

### Edge Cases
- [x] Player removed bringing count below 2
- [x] Game started with summary mode enabled

---

## Dependencies

### Blocked By
- None

### Blocks
- Story 5.2: Game Summary Display
- Story 5.3: Manual Sip Assignment

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | Dev |
| 2026-01-23 | Marked as Done | Dev |

---

## Dev Agent Record

### Implementation Notes
Summary mode toggle implemented using Angular 19 signals. The withSummaryMode signal in GameService controls the feature flag. Player count validation uses a computed signal.

### Files Changed
- src/app/app.component.ts
- src/app/services/game/game.service.ts
- src/app/services/local/local.service.ts

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- All acceptance criteria verified
- Toggle behavior correct

### Sign-off
Date: 2026-01-23
