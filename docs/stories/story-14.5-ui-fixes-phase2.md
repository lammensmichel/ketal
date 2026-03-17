# Story 14.5: UI Fixes - Phase 2 Cards & Button Labels

**Status**: Draft
**Epic**: Epic 14: UX Polish
**Priority**: Medium

---

## Story

**As a** player in Phase 2 of the game
**I want** uniform card sizes and correct button labels
**So that** the UI is consistent and I understand what each button does

---

## Context

Several UI inconsistencies found during manual testing:

1. **Card sizes in footer**: Phase 2 "Tu bois" / "Tu donnes" cards have inconsistent sizes — the first card is larger than the overlapping ones due to `max-width: 100%` constraint
2. **Card sizes in player cards**: Player card widths are inconsistent on mobile due to `width: auto` + `flex: 1 1 0` responsive override
3. **"Nouvelle partie" button label**: The quit game button (`Button_QuitGame`) is translated as "Nouvelle partie" (New game) in French, which is misleading — it should say "Quitter" or "Arrêter la partie"
4. **English translation**: Verify `Button_QuitGame` English translation is also correct

---

## Acceptance Criteria

1. **AC1**: All 6 cards in "Tu bois" and "Tu donnes" rows have uniform width
2. **AC2**: Player cards in the game view have uniform width across all 4 card slots
3. **AC3**: The quit button label clearly indicates quitting/stopping, not starting a new game
4. **AC4**: Translations correct in both FR and EN

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Fix card sizes in footer Phase 2
  - [ ] Remove `max-width: 100%` from `playing-card.component.scss`

- [ ] **T2** (AC: 2): Fix player card sizes
  - [ ] Replace mobile responsive override in `player-card.component.scss` with uniform fixed width

- [ ] **T3** (AC: 3, 4): Fix quit button translation and icon
  - [ ] In `src/assets/i18n/fr.json`, change `Button_QuitGame` from "Nouvelle partie" to "Quitter"
  - [ ] Verify EN translation is correct
  - [ ] Check all other language files (nl, de)
  - [ ] Change icon from `circle-xmark` to a more appropriate icon (e.g. `power-off` or `right-from-bracket`) in `header.component.html`

---

## Dev Notes

### Files to modify

- `src/app/_shared/_components/playing-card/playing-card.component.scss` - Remove `max-width: 100%`
- `src/app/_components/players/player-card/player-card.component.scss` - Fix responsive card width
- `src/assets/i18n/fr.json` - Fix `Button_QuitGame` translation
- `src/assets/i18n/en.json` - Verify `Button_QuitGame`
- `src/assets/i18n/nl.json` - Verify/fix `Button_QuitGame`
- `src/assets/i18n/de.json` - Verify/fix `Button_QuitGame`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | - |
