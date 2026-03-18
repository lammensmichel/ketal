# Story 12.7: Hide local game UI on room pages

**Status**: Done
**Epic**: Epic 12: FUG Backend Integration
**Priority**: Medium
**Depends On**: -
**Bug**: BUG-10

---

## Story

**As a** player navigating room pages (create, join, lobby)
**I want** the local game UI elements (summary checkbox, "Débuter la Grosse Guinze" button) to be hidden
**So that** I am not confused by local mode controls when using the multiplayer room flow

---

## Context

The summary toggle checkbox and the "Débuter la Grosse Guinze" button from local mode are visible on room pages (`/room/create`, `/room/join`, `/room/:id`). These controls belong to the local game flow and should only appear on the `/players` page.

### Current behavior

In `app.component.html`, the summary toggle is shown when:
```
gameSrv.isNewGame() && playerSrv.getPlayerNumber() > 1 && !isAuthPage()
```

This hides it on auth pages (`/login`, `/register`, `/forgot-password`) but does NOT check for room pages.

In `footer.component.html`, the "Débuter la Grosse Guinze" button is shown when:
```
hasPlayers() && gameSrv.isNewGame()
```

This only checks if local players exist and game is new, regardless of the current route.

The entire footer game UI block is wrapped with `@if (!isAuthPage())` which only excludes auth routes, not room routes.

### Expected behavior

- The summary toggle should only appear on `/players`
- The "Débuter" button should only appear on `/players`
- Room pages should never show local game controls

---

## Acceptance Criteria

1. **AC1**: Summary checkbox hidden on all `/room/*` pages (`/room/create`, `/room/join`, `/room/join/:code`, `/room/:id`, `/room/:id/stats`)
2. **AC2**: "Débuter la Grosse Guinze" button hidden on all `/room/*` pages
3. **AC3**: Local game UI only visible on `/players` page (not on `/game`, `/room/*`, `/login`, etc.)

---

## Tasks / Subtasks

- [x] **T1** (AC: 1, 3): Hide summary toggle on non-players pages
  - [x] In `app.component.ts`, add `isPlayersPage()` method checking `window.location.pathname === '/players'`
  - [x] In `app.component.html`, replace `!isAuthPage()` with `isPlayersPage()` in the summary toggle condition
  - [x] Verify the toggle only appears on `/players`

- [x] **T2** (AC: 2, 3): Hide "Débuter" button on non-players pages
  - [x] In `footer.component.ts`, add `isPlayersPage()` method checking `this.router.url === '/players'`
  - [x] In `footer.component.html`, add `&& isPlayersPage()` to the "Débuter" button condition

- [x] **T3** (AC: 1, 2, 3): Hide all local game footer UI on room pages
  - [x] In `footer.component.ts`, rename `AUTH_ROUTES` to `HIDDEN_ROUTES` and add `/room`, rename `isAuthPage()` to `isHiddenPage()`
  - [x] The outer `@if (!isAuthPage())` in footer template updated to `@if (!isHiddenPage())`

---

## Dev Notes

### Files to modify

- `src/app/app.component.html` - Summary toggle condition (line 6)
- `src/app/app.component.ts` - Add route check method
- `src/app/_shared/_components/footer/footer.component.html` - "Débuter" button condition (line 177), outer `@if` (line 2)
- `src/app/_shared/_components/footer/footer.component.ts` - Add route check method

### Current conditions to update

**app.component.html** (line 6):
```html
@if (gameSrv.isNewGame() && playerSrv.getPlayerNumber() > 1 && !isAuthPage()) {
```
Change to:
```html
@if (gameSrv.isNewGame() && playerSrv.getPlayerNumber() > 1 && isPlayersPage()) {
```

**footer.component.html** (line 177):
```html
@if (hasPlayers() && gameSrv.isNewGame()) {
```
Change to:
```html
@if (hasPlayers() && gameSrv.isNewGame() && isPlayersPage()) {
```

**footer.component.ts** - Add helper:
```typescript
const HIDDEN_ROUTES = ['/login', '/register', '/forgot-password', '/room'];

isPlayersPage(): boolean {
  return this.router.url === '/players';
}
```

### Room routes (from app-routing.module.ts)

```
/room/create     → CreateRoomComponent
/room/join       → JoinRoomComponent
/room/join/:code → JoinRoomComponent
/room/:id        → LobbyComponent
/room/:id/stats  → RoomStatsComponent
```

---

## Testing

### Unit Tests
- [ ] Test: Summary toggle not rendered when route is `/room/create`
- [ ] Test: Summary toggle not rendered when route is `/room/join`
- [ ] Test: Summary toggle not rendered when route is `/room/:id`
- [ ] Test: Summary toggle rendered when route is `/players` and conditions met
- [ ] Test: "Débuter" button not rendered when route is `/room/create`
- [ ] Test: "Débuter" button not rendered when route is `/room/:id`
- [ ] Test: "Débuter" button rendered when route is `/players` and players exist
- [ ] Test: Footer game controls hidden on `/game` page
- [ ] Test: `isPlayersPage()` returns true only for `/players`

### Manual Tests
- [ ] Navigate to `/room/create` → no summary toggle, no "Débuter" button
- [ ] Navigate to `/room/join` → no summary toggle, no "Débuter" button
- [ ] Navigate to `/room/:id` (lobby) → no summary toggle, no "Débuter" button
- [ ] Navigate to `/players` with 2+ players → summary toggle and "Débuter" button visible
- [ ] Navigate to `/game` → no summary toggle, no "Débuter" button

---

## Dev Agent Record

### Implementation Plan
- T1: Add `isPlayersPage()` to `app.component.ts`, use it in template for summary toggle
- T2: Add `isPlayersPage()` to `footer.component.ts`, use it for "Débuter" button
- T3: Rename `AUTH_ROUTES`/`isAuthPage()` to `HIDDEN_ROUTES`/`isHiddenPage()` with `/room` added

### Completion Notes
- Added `isPlayersPage()` method to both `AppComponent` and `FooterComponent`
- Summary toggle now only shows on `/players` page (was `!isAuthPage()`)
- "Débuter" button now requires `isPlayersPage()` in addition to existing conditions
- Footer outer wrapper renamed from `isAuthPage()` to `isHiddenPage()` with `/room` routes added
- Fixed pre-existing test compilation error (`getSipCount` → `sipCount` computed signal)
- All new unit tests pass (isPlayersPage, isHiddenPage, summary toggle visibility)
- 1 pre-existing test failure in `PlayerHelperService` unrelated to this story

### File List
- `src/app/app.component.ts` - Added `isPlayersPage()` method
- `src/app/app.component.html` - Updated summary toggle condition to use `isPlayersPage()`
- `src/app/app.component.spec.ts` - Added tests for `isPlayersPage()` and summary toggle visibility
- `src/app/_shared/_components/footer/footer.component.ts` - Renamed `AUTH_ROUTES`→`HIDDEN_ROUTES`, `isAuthPage()`→`isHiddenPage()`, added `isPlayersPage()`
- `src/app/_shared/_components/footer/footer.component.html` - Updated outer `@if` and "Débuter" button conditions
- `src/app/_shared/_components/footer/footer.component.spec.ts` - Added tests for `isHiddenPage()` and `isPlayersPage()`
- `src/app/_components/players/player-card/player-card.component.spec.ts` - Fixed pre-existing `getSipCount`→`sipCount` test

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | - |
| 2026-03-17 | 1.1 | Implementation complete | - |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
