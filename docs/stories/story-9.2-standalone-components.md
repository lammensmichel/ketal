# Story: 9.2 - Standalone Components Migration

**Status**: Done
**Epic**: Epic 9: Angular 19 Refactoring
**Created**: 2026-01-23
**Updated**: 2026-01-23
**Git Commit**: 1d8f7f6

---

## Story

**As a** developer
**I want** all components to be standalone without NgModule dependencies
**So that** the application benefits from better tree-shaking, simpler architecture, and faster compilation

---

## Acceptance Criteria

1. [x] **AC1**: All components use `standalone: true` in their decorator
2. [x] **AC2**: NgModule dependencies are removed from component files
3. [x] **AC3**: Routes use `loadComponent` for lazy loading
4. [x] **AC4**: Imports are tree-shakeable (directly importing what's needed)
5. [x] **AC5**: Application bootstraps without NgModules for components

---

## Tasks

- [x] **T1** (AC: 1): Add standalone: true to all component decorators
- [x] **T2** (AC: 2): Remove NgModule references from components
- [x] **T3** (AC: 3): Update app-routing.module.ts to use loadComponent
- [x] **T4** (AC: 4): Replace module imports with direct component/pipe/directive imports
- [x] **T5** (AC: 5): Update bootstrap configuration for standalone
- [x] **T6** (All): Write unit tests

---

## Dev Notes

### Relevant Files
| File | Description |
|------|-------------|
| `src/app/app-routing.module.ts` | Route configuration with loadComponent |
| `src/app/_components/game/main-game/main-game.component.ts` | Main game standalone component |
| `src/app/_components/game/game-room/game-room.component.ts` | Game room standalone component |
| `src/app/_components/game/game/game.component.ts` | Game standalone component |
| `src/app/_components/game/game-summary/game-summary.component.ts` | Summary standalone component |
| `src/app/_shared/_components/header/header.component.ts` | Header standalone component |
| `src/app/_shared/_components/footer/footer.component.ts` | Footer standalone component |
| `src/app/_shared/_components/playing-card/playing-card.component.ts` | Card standalone component |
| `src/main.ts` | Bootstrap configuration |

### Architecture Context
- Pattern: Angular 19 Standalone Components (no NgModules for components)
- Constraints: Must maintain all existing functionality
- Reference: Angular 19 standalone component documentation

### Implementation Hints
- Use `imports: [CommonModule, TranslateModule, ...]` directly in component decorator
- Routes become `{ path: 'game', loadComponent: () => import('./...').then(m => m.GameComponent) }`
- Remove all component declarations from NgModules

### Angular 19 Patterns to Use
- [x] Signals for state management
- [x] Standalone component
- [x] OnPush change detection
- [x] New control flow (@if, @for)
- [x] inject() for DI

---

## Testing Requirements

### Unit Tests
- [x] Test components compile as standalone
- [x] Test lazy loading works correctly
- [x] Test imports are correctly resolved

### Edge Cases
- [x] Circular dependencies avoided
- [x] Shared components properly imported where needed

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
All components were migrated to standalone architecture. Each component now declares its own imports directly in the @Component decorator, eliminating the need for NgModule declarations. Routes were updated to use loadComponent for lazy loading, improving initial bundle size and load times.

### Files Changed
- All component files in `src/app/_components/`
- All shared component files in `src/app/_shared/_components/`
- `src/app/app-routing.module.ts`
- `src/main.ts`

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA

---

## QA Results

### Review Status
APPROVED

### Findings
- Standalone migration complete, improved tree-shaking

### Sign-off
Date: 2026-01-23
