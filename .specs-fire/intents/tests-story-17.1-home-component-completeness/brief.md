---
id: tests-story-17.1-home-component-completeness
title: Story 17.1 — complete home.component.spec.ts coverage (carousel, states)
status: pending
created: 2026-05-15T11:00:00Z
priority: medium
tag: story-17.1-completion
type: test-gap
---

# Intent: Story 17.1 — complete home.component.spec.ts coverage

## Context

Story 17.1 redesigned the Home page (AC11-AC14): welcome header, recent-rooms carousel (max 3), CTAs, empty state. Today `home.component.spec.ts` (135 lines) covers the welcome header, CTA buttons, createGame happy-path/error/double-click guard, joinGame nav, and `userName` computed. It does NOT cover the carousel, the "Voir tout" link, the loading state, or the error state of the rooms fetch.

## Goal

Bring the existing spec to full Story 17.1 AC coverage on Home.

## Users

Developers — Home is the first screen logged-in users see; regressions here are user-visible immediately.

## Problem

Half the AC items for Home are unverified. The carousel and empty state in particular were added as part of 17.1 and have no protection.

## Success Criteria

`home.component.spec.ts` additions cover:

- Recent rooms carousel:
  - Renders the rooms returned by `RoomService.getMyRooms(3, true)` (or however the call is made — verify).
  - Caps at 3 tiles even if the service returns more.
  - Sorted order from the service is preserved (don't re-sort in the component).
- Empty state:
  - Renders "Vous n'avez encore aucune partie." when the rooms list is empty AND not loading.
- Loading state:
  - Renders a skeleton or loading indicator while the fetch is in flight.
- Error state:
  - Renders an error message if the fetch fails.
- "Voir tout" link:
  - Visible when there are rooms (or always — confirm).
  - Calls `goToRooms()` / navigates to `/rooms`.

All tests pass. The 9 existing test cases continue to pass.

## Constraints

- Don't reorganise the existing tests; only add new ones.
- Use signals + fakeAsync where appropriate (the existing spec already does for createGame).

## Scope

### In-scope

- Extending `src/app/_components/home/home.component.spec.ts`.

### Out-of-scope

- Modifying the component or template.
- Visual regression tests.

## Approach

1. Re-read `home.component.{ts,html}` to confirm exact signal/observable wiring for rooms data.
2. Add a describe block per state (loading/empty/error/populated).
3. Mock `RoomService.getMyRooms` to drive each branch.
4. For the carousel, render the component and use `By.css` to count tiles + assert content.

## Verification

- `npm test` green; new tests visible and pass.
- AC11–AC14 are now backed by spec assertions.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW. Effort: ~45 min.
