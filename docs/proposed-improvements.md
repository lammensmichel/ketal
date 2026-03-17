# Ketal - Proposed Improvements

This document lists improvements identified during application testing on 2026-01-24.

## Screenshots Reference

All screenshots are in `docs/screenshots/`:
- `01-players-with-alice.png` - Player list with Alice
- `02-players-alice-bob.png` - Player list with Alice and Bob
- `03-login-page.png` - Login page
- `04-register-page-bug.png` - Register page (shows translation bug)
- `05-game-started.png` - Game started
- `06-game-phase1-color.png` - Phase 1 Turn 1: Color prediction
- `07-game-phase1-plusminus.png` - Phase 1 Turn 2: Higher/Lower prediction
- `08-game-phase1-inout.png` - Phase 1 Turn 3: In/Out prediction
- `09-game-phase1-suit.png` - Phase 1 Turn 4: Suit prediction
- `10-game-phase2-start.png` - Phase 2: Drinking/Giving phase start
- `11-game-finished.png` - Game finished with Restart button
- `12-register-page-fixed.png` - Register page after fix (shows correct title)

---

## Bug Fixes Applied

### BUG-001: Translation Key Not Found on Register Page - FIXED

**Priority:** High
**Status:** FIXED
**Screenshots:** `04-register-page-bug.png` (before), `12-register-page-fixed.png` (after)

**Description:**
On the register page, the title displayed `Label_App_Title` instead of the translated "Ketal" title. The translation key contained a typo with `¨` character.

**Files Fixed:**
- `src/app/_shared/_components/header/header.component.html:9`
- `src/assets/i18n/fr.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/de.json`
- `src/assets/i18n/nl.json`

**Fix Applied:**
Changed `Label_App_¨Title` to `Label_App_Title` in all files.

---

## UI/UX Improvements

### UX-001: Game Phase Indicator

**Priority:** Medium
**Screenshots:** `06-game-phase1-color.png` through `10-game-phase2-start.png`

**Description:**
During gameplay, there's no clear indication of which phase or turn the game is in. Players may be confused about the current game state.

**Proposed Solution:**
Add a visual indicator showing:
- Current phase (1 or 2)
- Current turn within the phase (1-4 for phase 1, 1-12 for phase 2)
- Progress bar or step indicator

---

### UX-002: Button Labels in Phase 1

**Priority:** Low
**Screenshots:** `06-game-phase1-color.png`, `07-game-phase1-plusminus.png`

**Description:**
Button labels like `chooseRed`, `chooseBlack`, `+`, `-` are displayed as-is. While functional, they could be more user-friendly with icons or translated labels.

**Proposed Solution:**
- Color prediction: Use colored buttons (red/black) with icon
- Plus/Minus: Use arrow icons (up/down) with translated labels
- In/Out: Use visual representation of card range
- Suit: Already uses suit symbols, which is good

---

### UX-003: Game Summary/Results Screen

**Priority:** Medium
**Screenshot:** `11-game-finished.png`

**Description:**
When the game ends, the UI shows all cards and a "Restart" button, but there's no clear summary of who drank the most, final scores, or game statistics.

**Proposed Solution:**
Add a game summary modal or section showing:
- Total sips per player (drunk + given)
- Winner/loser highlighting
- Option to share results
- "New Game" vs "Restart with same players" options

---

### UX-004: Player Turn Highlight

**Priority:** Medium
**Screenshots:** `06-game-phase1-color.png` through `09-game-phase1-suit.png`

**Description:**
The current player is shown at the bottom with their avatar and name, but it's not immediately obvious whose turn it is in the player list above.

**Proposed Solution:**
- Highlight the current player's card in the player list
- Add a visual indicator (glow, border, or animation) on the active player
- Consider pulsing animation on the action buttons

---

### UX-005: Card Animation

**Priority:** Low
**Screenshots:** `06-game-phase1-color.png` through `11-game-finished.png`

**Description:**
Cards appear instantly without animation. Adding subtle animations would improve the game feel.

**Proposed Solution:**
- Flip animation when cards are revealed
- Slide animation for new cards
- Highlight animation when cards match in phase 2

---

## Technical Improvements

### TECH-001: getPlayers() Performance Issue (FIXED)

**Priority:** Critical
**Status:** Fixed by sub-agent

**Description:**
The `getPlayers()` method in `PlayerHelperService` was creating a new array reference on each call when loading from localStorage. This could cause Angular's change detection to trigger infinite re-renders.

**Fix Applied:**
Modified `getPlayers()` to store loaded players in `this.players` and always return the same reference.

**Files Modified:**
- `src/app/_shared/_helpers/player.helper.ts`

---

### TECH-002: APP_INITIALIZER Timeout

**Priority:** High
**Status:** Temporarily disabled

**Description:**
The APP_INITIALIZER for authentication was disabled because it blocks app loading when fug-backend is not accessible.

**Location:**
`src/main.ts:50-56`

**Proposed Solution:**
1. Re-enable APP_INITIALIZER with proper timeout handling (already implemented in AuthService)
2. Add visual loading indicator during auth initialization
3. Consider lazy initialization of auth after app loads

---

## Feature Requests

### FEAT-001: Multiplayer Online Mode

**Priority:** High
**Related Stories:** 8.2, 10.1, 10.2

**Description:**
Full integration with fug-backend for online multiplayer:
- Create/join rooms via Appwrite
- Real-time game state synchronization
- User authentication and profiles

---

### FEAT-002: Game History

**Priority:** Low

**Description:**
Store game history so players can see past games, statistics, and trends.

**Proposed Features:**
- Game history list
- Per-player statistics
- Leaderboard

---

## Next Steps

1. Fix BUG-001 (translation typo) - Quick fix
2. Re-test APP_INITIALIZER with fug-backend running
3. Create BMAD stories for UX improvements
4. Continue Appwrite integration (Stories 8.2, 10.1, 10.2)
