---
id: tests-story-17.1-app-component-routing
title: Story 17.1 — add post-login routing tests to app.component.spec.ts
status: pending
created: 2026-05-15T11:00:00Z
priority: medium
tag: story-17.1-completion
type: test-gap
---

# Intent: Story 17.1 — add post-login routing tests to app.component.spec.ts

## Context

Story 17.1 introduced post-login routing logic in `AppComponent` (AC15-AC17):

- Anonymous → `/players` (highest priority).
- Active session → `/game` (priority over /home).
- Logged-in with no active session → `/home`.

Today `app.component.spec.ts` (317 lines) is substantial — it has thorough coverage of `withSummaryMode`, `onSummaryModeCheckChange`, `isPlayersPage`, `canShowSummary`, and signal reactivity. But the grep of its describe/it blocks shows **no tests for the actual routing decisions**. The auto-routing logic in `AppComponent` (lines around 76-94 per the audit) is unverified.

## Goal

Add unit tests asserting the three routing branches behave per the spec.

## Users

Developers — routing bugs here are catastrophic UX-wise (user lands on the wrong screen on every login).

## Problem

The most critical behaviour of `AppComponent` for Story 17.1 has no spec.

## Success Criteria

`app.component.spec.ts` adds a describe block (e.g. "post-login routing") with:

- Anonymous user → `router.navigate(['/players'])` is called; `/game` and `/home` are NOT.
- Logged in (non-anonymous) with an active session → `router.navigate(['/game'])` is called; `/players` and `/home` are NOT.
- Logged in (non-anonymous) with NO active session → `router.navigate(['/home'])` is called.
- Routing is triggered at the right lifecycle hook (likely a `constructor`/`effect`/`ngOnInit` — verify and assert).

All tests pass. The 30+ existing tests continue to pass.

## Constraints

- Use `jasmine.createSpyObj` for `Router`; assert with `expect(router.navigate).toHaveBeenCalledWith([...])`.
- Use signals for `AuthService` and `GameService`/`KetalSessionService` mocks to drive each branch.
- Don't refactor the existing tests; only add the new describe block.

## Scope

### In-scope

- Extending `src/app/app.component.spec.ts`.

### Out-of-scope

- Modifying `AppComponent` itself.
- Route-guard tests (separate concern).

## Approach

1. Re-read `app.component.ts` to identify exactly where the routing decision happens (constructor? effect? lifecycle hook?).
2. Reproduce the wiring in TestBed: provide spy `Router`, signal-backed `AuthService`/session services.
3. Drive each of the three branches; assert `router.navigate` was called with the right path.

## Verification

- `npm test` green; new tests visible and pass.
- AC15-AC17 are now backed by spec assertions.

## Notes

Origin: Story 17.1 audit dated 2026-05-15. Risk: LOW. Effort: ~30 min.
