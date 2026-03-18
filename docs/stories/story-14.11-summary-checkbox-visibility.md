# Story 14.11: Summary Checkbox Visibility Function

**Status**: Done
**Epic**: Epic 14: UX Polish
**Priority**: Medium

---

## Story

**As a** connected user
**I want** the summary checkbox to appear as soon as I'm logged in (not conditioned on 2+ players)
**So that** I can decide about the summary before adding players

---

## Context

Currently the checkbox is conditioned on `isNewGame && playerCount >= 2 && isPlayersPage && !isAnonymous`. It should appear as soon as the user is connected (not anonymous), regardless of player count.

The visibility should be controlled by a dedicated function (e.g., `canShowSummary()`) to allow future conditioning on paid subscription.

---

## Acceptance Criteria

1. **AC1**: Summary checkbox visible for connected users on /players page (even with 0 players)
2. **AC2**: Summary checkbox hidden for anonymous users
3. **AC3**: Visibility controlled by a `canShowSummary()` method (not inline template logic)
4. **AC4**: Method designed to be extensible for future subscription gating

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Found during MCP testing | QA |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
