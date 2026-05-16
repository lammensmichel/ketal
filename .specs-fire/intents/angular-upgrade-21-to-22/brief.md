---
id: angular-upgrade-21-to-22
title: Angular — upgrade 21 → 22
status: pending
created: 2026-05-15T10:30:00Z
priority: high
depends_on:
  - angular-upgrade-20-to-21
blocked_by_external: "Angular 22.0.0 stable (ETA week of 2026-06-01)"
---

# Intent: Angular — upgrade 21 → 22

## Context

Third hop in the multi-step Angular upgrade plan. Angular 22.0 is in `rc.0` at the time of writing; stable release is scheduled for the week of 2026-06-01. We will NOT upgrade until 22.0.0 GA. Once it ships, this intent runs the same `ng update` flow as the previous hops.

## Goal

Move the application from Angular 21.x to the latest stable Angular 22 release, applying all migration schematics, and replacing any v22-superseded APIs with the new idioms.

## Users

Developers — access to v22 features. End users get bundle and runtime improvements.

## Problem

Once 22.0.0 is out, staying on 21 starts the same staleness clock that motivated this whole plan.

## Success Criteria

- Angular 22.0.0 (or latest 22.x patch) **STABLE**, not RC, installed.
- All `@angular/*` at `^22.x`.
- `ng build` (dev + prod), `npm test`, `npm run lint` all green.
- No use of any API v22's schematic flagged as deprecated/removed.
- Dev server smoke pass on golden path.

## Constraints

- **WAIT** until `npm view @angular/core dist-tags.latest` reports `22.x`. Do NOT take an `rc` or `next` tag.
- Must complete `angular-upgrade-20-to-21` first.
- Must use `ng update`.
- Wait at least one week of v21 in `main` before running v22.

## Scope

### In-scope

- `ng update @angular/cli@22 @angular/core@22` and all dependent `@angular/*`.
- Peer libs to v22-compatible versions (re-check each at the time of upgrade — major-version compat is not guaranteed for community libs at GA week).
- Run schematics; accept all interactive transforms.
- After upgrade, audit the code for v22-replaceable patterns. Each Angular major retires some APIs and introduces cleaner versions — apply them.

### Out-of-scope

- Future hops (22 → 23).

## Approach (do this, in order)

1. Confirm `angular-upgrade-20-to-21` is on main and green for >7 days.
2. Confirm 22.0.0 GA is published: `npm view @angular/core dist-tags`.
3. Confirm peer libs (Material, CDK, translate, qrcode, fontawesome) have v22-compatible releases. If any are blocking, hold this intent until they ship.
4. Snapshot: commit current state, note baseline test pass count.
5. Read https://angular.dev/update-guide?v=21.0-22.0.
6. Run `ng update --next=false @angular/cli@22 @angular/core@22`. Accept all schematic prompts.
7. Bump peer libs to v22-compatible.
8. `npm install`.
9. Run "manual migration available" schematics: `ng update @angular/core@22 --migrate-only --name=<name>`.
10. Build, test, lint.
11. Post-upgrade audit: replace any v22-deprecated APIs with the new form. Read the release notes specifically for "deprecated" / "removed" sections.
12. Smoke-test in a browser.
13. Single atomic commit.

## Verification

- `npx ng version` shows `22.x`.
- All build/test/lint green.
- Dev server golden-path passes.

## Dependencies

- **Blocking (project)**: `angular-upgrade-20-to-21`.
- **Blocking (external)**: Angular 22.0.0 GA release (ETA week of 2026-06-01) plus v22-compatible releases of peer libs.

## Notes

Same discipline as prior hops: `ng update` runs schematics; after they run, search the diff for any v21-era patterns the schematic didn't auto-rewrite (often things in templates, custom decorators, or RxJS-heavy code) and apply the new idiom manually.

Reference: https://angular.dev/reference/releases
