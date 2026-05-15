---
id: story-17.1-impl-room-tile-idle-click
title: Story 17.1 — make room-tile click navigate for idle rooms (incl. host)
status: pending
created: 2026-05-15T11:00:00Z
priority: medium
tag: story-17.1-completion
type: implementation-gap
---

# Intent: Story 17.1 — make room-tile click navigate for idle rooms

## Context

Story 17.1's AC8 says clicking a room tile routes by status:
- `idle` → `/room/<id>`
- `playing` → reconnect (load session, route to `/game`)
- `archived` → disabled

Inspection of `src/app/_components/room/room-tile/room-tile.component.ts:74-96` shows:
- `playing` correctly calls `handleReconnect()` which navigates `/game`.
- `archived` correctly disables the tile via the computed `isClickable()`.
- `idle` branch has an asymmetry: for hosts, the comment says "don't auto-navigate; let button handle action", so clicking the tile as the host does **nothing**. Players in idle rooms DO navigate.

The spec doesn't carve out the host. The result is that hosts can see their idle rooms in the carousel/list but can't click them to enter — they have to use a button. UX-wise this is confusing.

## Goal

Make clicking an `idle` room tile navigate to `/room/<id>` consistently for all roles (host AND player). If there is a real reason the host must use a button instead (e.g., to disambiguate from a "Start" action), state it in the code comment and update the spec doc — don't silently violate the AC.

## Users

Hosts navigating from the Home carousel or the `/rooms` list.

## Problem

UX asymmetry; AC8 partially unmet.

## Success Criteria

- Clicking an idle room tile navigates to `/room/<id>` for both host and non-host.
- `room-tile.component.spec.ts` (created via separate intent `tests-story-17.1-room-tile-component`) covers both branches.
- If the previous "host doesn't auto-navigate" behaviour is intentional, the story doc must be updated to reflect the carve-out — and that decision recorded with a `Why:` comment in the code.

## Constraints

- Don't break the existing action buttons in the tile (archive/leave/delete).
- Click on a button inside the tile must NOT bubble up and trigger the tile-level navigation (use `(click)="$event.stopPropagation()"` on action buttons if not already done).

## Scope

### In-scope

- `src/app/_components/room/room-tile/room-tile.component.ts:74-96` — adjust the idle branch.
- The component's template if click handlers need event-stop adjustments.
- `room-tile.component.spec.ts` (the new spec, created in a separate intent) — make sure both branches are covered.

### Out-of-scope

- Changing the actions menu logic.
- Reworking the `playing` reconnect path.

## Approach

1. Re-read the spec section and decide: is the host carve-out intentional (e.g., to force a "Resume" vs "Start new" choice via the button) or accidental?
2. If accidental → remove the host-specific guard; both roles navigate.
3. If intentional → keep but document the reason in code and update `docs/stories/story-17.1-rooms-list-entry-point.md` to reflect the actual behaviour. AC8 wording must match.
4. Verify the action buttons stop propagation (so clicking "Archive" doesn't accidentally navigate).
5. Typecheck + run suite.

## Verification

- Manual: from Home carousel, click an idle room as host → lands on `/room/<id>`.
- Spec: room-tile.component.spec.ts covers both branches.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW. Effort: ~15–30 min depending on the decision in step 1.
The audit flagged this as the smallest of the four gaps.
