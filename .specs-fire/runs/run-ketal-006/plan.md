---
id: "wi-001"
intent: "players-footer-always-visible"
mode: "autopilot"
status: "plan"
title: "Merge footer @if blocks into always-visible panel with disabled button"
created: "2026-05-18T15:51:36Z"
---

# Run plan for wi-001

## Context

`footer.component.html` lines 367-382 use two separate `@if` blocks that conditionally render the start-game panel:

* **Block A** — `hasPlayers() && ...` → full button panel
* **Block B** — `needsMorePlayers() && ...` → "Minimum players" text only

Both toggle in/out as the player count changes (0 → 1 → 2+), causing layout shift.

## Goal

Merge into a single always-visible `prediction-panel` that:
1. Stays rendered whenever `isNewGame() && isPlayersPage()`
2. Contains a button with `[disabled]="!hasPlayers()"`
3. Uses `visibility: hidden` on the hint text (instead of structural removal) to preserve layout

## Changes Required

### src/app/_shared/_components/footer/footer.component.html
1. Merge the two `@if` blocks into one `@if (gameSrv.isNewGame() && isPlayersPage()) { ... }`
2. Inside: single `<div class="prediction-panel">` with button + hint
3. Button gets `[disabled]="!hasPlayers()"` 
4. Hint text uses `[class.minimum-players-hint--hidden]="hasPlayers()"` instead of `@if`

### src/app/_shared/_components/footer/footer.component.scss
1. Add `.minimum-players-hint` styles with `visibility: hidden` variant

## Risks

* Low — CSS-only change in scope, minimal JS template change
* Only touches footer on `/players` route during setup
