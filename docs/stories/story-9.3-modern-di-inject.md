# Story: 9.3 - Modern DI with inject() Function

**Status**: Done
**Epic**: Epic 9: Angular 19 Refactoring
**Created**: 2026-01-23
**Updated**: 2026-01-23
**Git Commit**: 1d8f7f6

---

## Story

**As a** developer
**I want** to use the inject() function instead of constructor injection
**So that** the codebase follows modern Angular 19 patterns with cleaner, more flexible dependency injection

---

## Acceptance Criteria

1. [x] **AC1**: All services use inject() for dependency injection
2. [x] **AC2**: All components use inject() for dependency injection
3. [x] **AC3**: Constructor injection is removed throughout the codebase
4. [x] **AC4**: Type safety is maintained with proper typing
5. [x] **AC5**: All functionality remains unchanged

---

## Tasks

- [x] **T1** (AC: 1): Convert all service constructors to use inject()
- [x] **T2** (AC: 2): Convert all component constructors to use inject()
- [x] **T3** (AC: 3): Remove constructor parameters for DI
- [x] **T4** (AC: 4): Ensure proper TypeScript typing for injected dependencies
- [x] **T5** (AC: 5): Verify all features work correctly
- [x] **T6** (All): Update unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/services/game/game.service.ts` | Game service with inject() |
| `src/app/services/card/card.service.ts` | Card service with inject() |
| `src/app/services/local/local.service.ts` | Local storage service with inject() |
| `src/app/services/websocket/websocket.service.ts` | WebSocket service with inject() |
| `src/app/_shared/_helpers/player.helper.ts` | Player helper with inject() |
| `src/app/_shared/_helpers/card-deck.helper.ts` | Card deck helper with inject() |
| `src/app/_shared/_helpers/language.helper.ts` | Language helper with inject() |
| All component files | Components with inject() |

### Architecture Context
- Pattern: Angular 19 inject() function for dependency injection
- Constraints: Must be called in injection context (constructor or field initializer)
- Reference: Angular 19 inject() documentation

### Implementation Hints
- Replace `constructor(private service: MyService)` with `private service = inject(MyService)`
- inject() can be used at class field level for cleaner code
- Maintains same functionality with more flexible pattern

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test services initialize correctly with inject()
- [x] Test components can access injected services
- [x] Test mock injection works in tests

### Edge Cases
- [x] Optional dependencies handled with inject(Service, { optional: true })
- [x] Token-based injection works correctly

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
| 2026-01-23 | Marked as Done - implementation complete (git: 1d8f7f6) | |

---

## Dev Agent Record

### Implementation Notes
All dependency injection was migrated from constructor-based to the inject() function pattern. This modern approach allows for cleaner code with dependencies declared as class fields rather than constructor parameters. The pattern also enables better tree-shaking and more flexible injection contexts.

### Files Changed
- All service files in `src/app/services/`
- All helper files in `src/app/_shared/_helpers/`
- All component files in `src/app/_components/`
- All shared component files in `src/app/_shared/_components/`

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Modern DI pattern implemented consistently throughout codebase

### Sign-off
Date: 2026-01-23
