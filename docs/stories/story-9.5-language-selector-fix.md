# Story: 9.5 - Language Selector Fix

**Status**: Done
**Epic**: Epic 9: Angular 19 Refactoring
**Created**: 2026-01-23
**Updated**: 2026-01-23
**Git Commit**: eb01c33

---

## Story

**As a** player
**I want** the language selector to update correctly after selection
**So that** I can see the current language state and change it reliably

---

## Acceptance Criteria

1. [x] **AC1**: Language selector reflects the currently selected language
2. [x] **AC2**: Selector updates immediately when language is changed
3. [x] **AC3**: Visual state is consistent with actual language state
4. [x] **AC4**: No page reload required for selector to update

---

## Tasks

- [x] **T1** (AC: 1, 2): Fix language selector binding in header.component.ts
- [x] **T2** (AC: 3): Ensure OnPush change detection triggers correctly
- [x] **T3** (AC: 4): Use signals for reactive language state
- [x] **T4** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/_shared/_components/header/header.component.ts` | Header with language selector |
| `src/app/_shared/_helpers/language.helper.ts` | Language state management |

### Architecture Context
- Pattern: Signal-based reactive state with OnPush change detection
- Constraints: Must work with OnPush change detection
- Reference: Angular 19 Signals documentation

### Implementation Hints
- Ensure language state is a signal for reactivity
- Use computed() if needed for derived display values
- Verify change detection is triggered on language change

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test selector initial state matches current language
- [x] Test selector updates after language change
- [x] Test multiple rapid language changes handled correctly

### Edge Cases
- [x] Initial load with stored language preference
- [x] Switching between same language (no-op case)

---

## Dependencies

### Blocked By
- Story 7.1 (Multi-Language Support)

### Blocks
- None

---

## Change Log

| Date | Description | Author |
|------|-------------|--------|
| 2026-01-23 | Created story | |
| 2026-01-23 | Marked as Done - implementation complete (git: eb01c33) | |

---

## Dev Agent Record

### Implementation Notes
Fixed an issue where the language selector in the header was not updating its visual state after a language selection was made. The fix involved ensuring the language state was properly tracked as a signal and that OnPush change detection was triggered when the language changed. The selector now correctly reflects the current language state at all times.

### Files Changed
- `src/app/_shared/_components/header/header.component.ts`

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Language selector now updates correctly after selection

### Sign-off
Date: 2026-01-23
