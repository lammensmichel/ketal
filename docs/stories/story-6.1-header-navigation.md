# Story: 6.1 - Header Navigation

**Status**: Done
**Epic**: Epic 6 - UI Components
**Created**: 2026-01-23
**Updated**: 2026-01-23

---

## Story

**As a** user
**I want** header navigation with restart and language options
**So that** I can restart the game or change language at any time

---

## Acceptance Criteria

1. [x] **AC1**: Restart button visible in header during game
2. [x] **AC2**: Language selector dropdown in header
3. [x] **AC3**: Real-time language switching without page reload
4. [x] **AC4**: Current language visually indicated

---

## Tasks

- [x] **T1** (AC: 1): Add restart button to header.component.ts
- [x] **T2** (AC: 2): Implement language selector dropdown
- [x] **T3** (AC: 3): Integrate ngx-translate for real-time switching
- [x] **T4** (AC: 4): Style current language indicator
- [x] **T5** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/_shared/_components/header/header.component.ts` | Header component with navigation |
| `src/app/_shared/_components/header/header.component.html` | Header template |
| `src/app/_shared/_components/header/header.component.scss` | Header styles |
| `src/assets/i18n/` | Translation files (fr.json, en.json) |

### Architecture Context
- Pattern: ngx-translate for i18n
- Constraints: Language persisted to localStorage
- Reference: docs/architecture.md

### Implementation Hints
- Use TranslateService.use() for switching
- Store language preference in LocalService
- Bootstrap dropdown for language selector
- Confirm dialog before restart

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Restart button renders
- [x] Language selector displays options
- [x] Language switch updates UI
- [x] Current language indicated correctly

### Edge Cases
- [x] Language preference persisted on reload
- [x] Restart during active game (with confirmation)

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
| 2026-01-23 | Created story | Dev |
| 2026-01-23 | Marked as Done | Dev |

---

## Dev Agent Record

### Implementation Notes
Header component updated with restart button and language dropdown. Uses ngx-translate for seamless language switching. Language preference stored in localStorage via LocalService.

### Files Changed
- src/app/_shared/_components/header/header.component.ts
- src/app/_shared/_components/header/header.component.html
- src/app/_shared/_components/header/header.component.scss

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Restart functionality works with confirmation
- Language switching is instant
- Preference persists correctly

### Sign-off
Date: 2026-01-23
