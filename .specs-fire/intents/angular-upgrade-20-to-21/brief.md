---
id: angular-upgrade-20-to-21
title: Angular — upgrade 20 → 21
status: pending
created: 2026-05-15T10:30:00Z
priority: high
depends_on:
  - angular-upgrade-19-to-20
---

# Intent: Angular — upgrade 20 → 21

## Context

Second hop in the multi-step Angular upgrade plan. Angular 21.0 was released 2025-11-19 and is the current stable major. This intent runs the same `ng update` flow as `angular-upgrade-19-to-20`, but targeting 21, and audits the code for v21-specific replacements.

## Goal

Move the application from Angular 20.x to the latest Angular 21.2.x patch release, applying the v20→v21 migration schematics, and replacing any v21-superseded APIs with the new idioms.

## Users

Developers — access to v21 features (refined signals, control flow improvements, new ng-template inlining patterns, etc.). End users get bundle and runtime improvements.

## Problem

Once we've validated v20 in production we want to close the gap to current stable so the team isn't perpetually behind.

## Success Criteria

- All `@angular/*` at `^21.x` matching latest 21 minor.
- `ng build` (dev + prod), `npm test`, `npm run lint` all green.
- No usage of any API v21's migration schematic flagged as deprecated/removed.
- Dev server smoke pass on golden path.

## Constraints

- Must complete `angular-upgrade-19-to-20` first — never skip a major.
- Must use `ng update`; do not hand-edit `package.json` versions.
- Wait at least one week of v20 in `main` before running v21 (catch any v20 regressions in normal use).

## Scope

### In-scope

- `ng update @angular/cli@21 @angular/core@21` and all dependent `@angular/*`.
- Peer libs: `@angular/material@21`, `@angular/cdk@21`, plus other peers (translate, qrcode, fontawesome, zone.js, typescript) bumped to v21-compatible.
- Run schematics; accept all interactive transforms.
- After upgrade, audit the code for v21-replaceable patterns (e.g. any remaining structural directives, RxJS-based code that has a signal equivalent in v21, deprecated lifecycle hooks, etc.).

### Out-of-scope

- v21 → v22 (next intent).

## Approach (do this, in order)

1. Confirm `angular-upgrade-19-to-20` is on main, green for >7 days.
2. Snapshot: commit current state, note baseline test pass count.
3. Read https://angular.dev/update-guide?v=20.0-21.0.
4. Run `ng update --next=false @angular/cli@21 @angular/core@21`. Accept all schematic prompts.
5. Bump peer libs to v21-compatible.
6. `npm install`.
7. Run any "manual migration available" schematic: `ng update @angular/core@21 --migrate-only --name=<name>`.
8. Build, test, lint.
9. Post-upgrade audit: search for any APIs the v21 release notes mark deprecated/replaced. Apply the new idiom (signal-based variants, new control-flow refinements, etc.).
10. Smoke-test in a browser.
11. Single atomic commit.

## Verification

- `npx ng version` shows `21.x`.
- All build/test/lint green.
- Dev server golden-path passes.

## Dependencies

- **Blocking**: `angular-upgrade-19-to-20` must be completed first.

## Notes

Use `ng update` for every hop. After each, deliberately search the diff for `*ng`-prefixed structural directives, manual subscribe patterns, and other v20-era idioms that v21 supersedes — schematics catch most of this but not all.

Reference: https://angular.dev/reference/releases
