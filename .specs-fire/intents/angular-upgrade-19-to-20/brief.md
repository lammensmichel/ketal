---
id: angular-upgrade-19-to-20
title: Angular — upgrade 19 → 20 (one step at a time)
status: pending
created: 2026-05-15T10:30:00Z
priority: high
---

# Intent: Angular — upgrade 19 → 20

## Context

The Ketal frontend is currently on Angular 19.2.17. Latest stable is Angular 21.2.13 (released 2025-11-19), so the project is two majors behind. Angular's official upgrade guidance is to step one major at a time using `ng update`, which runs migration schematics tailored to that hop. Skipping versions misses migrations and increases the chance of subtle regressions.

This intent covers ONLY 19 → 20. Subsequent hops are separate dependent intents (`angular-upgrade-20-to-21`, `angular-upgrade-21-to-22`).

## Goal

Move the application from Angular 19.2.x to the latest Angular 20.3.x patch release, applying all official migration schematics, and replacing any usages of APIs that v20 deprecates or supersedes with the modern equivalents Angular provides.

## Users

Developers — better tooling, performance, and access to v20 features. End users benefit from bundle / runtime improvements.

## Problem

Staying on 19 means missing 12 months of fixes, performance improvements, and new control-flow / signal refinements. v19 enters LTS soon; staying on it pushes us closer to unsupported territory.

## Success Criteria

- `package.json` shows all `@angular/*` packages at `^20.x` matching the latest 20 minor.
- `ng build` succeeds (development AND production configurations).
- `npm test` matches or exceeds the pre-upgrade pass rate (1017/1025 baseline).
- `npm run lint` clean.
- Manual dev-server smoke: home → create room → join room → start game → end game, no console errors.
- No usage of any API that v20's migration schematic flagged as deprecated/removed.

## Constraints

- Must use the official `ng update` flow. Do not hand-bump version numbers in `package.json`.
- Must NOT cascade into 20 → 21 in this intent — that's the next intent.
- Peer libs that depend on Angular must be bumped to v20-compatible versions in the same run (otherwise install fails).
- Use `--legacy-peer-deps` only if a peer conflict can't be resolved by bumping the offending package.

## Scope

### In-scope

- `ng update @angular/cli@20 @angular/core@20` (CLI bumps the rest of `@angular/*` automatically).
- Manually bump peers that don't follow the schematic: `@angular/material@20`, `@angular/cdk@20`, `@angular/animations`, `@ngx-translate/core`, `@ngx-translate/http-loader`, `angularx-qrcode`, `@fortawesome/angular-fontawesome`, `zone.js`, `typescript` (per the official version matrix).
- Run any schematic that auto-applies code migrations (`ng update` runs them; if any are interactive, accept the suggested transform).
- After upgrade: audit the code for patterns v20 supersedes (e.g. final pieces of NgModule, structural directives `*ngIf`/`*ngFor` that should now be `@if`/`@for`, any RxJS pattern v20 offers a signal-equivalent for, etc.). Replace them.

### Out-of-scope

- Upgrading to 21 or 22 (separate intents).
- Renaming files or large refactors unrelated to the upgrade.

## Approach (do this, in order)

1. Snapshot: commit current state, note baseline test pass count.
2. Read the official upgrade guide at the URL the `ng update` command prints (https://angular.dev/update-guide?v=19.0-20.0).
3. Run `ng update --next=false @angular/cli@20 @angular/core@20`. Accept all migration prompts that ship with it.
4. Bump peer libs reported as incompatible.
5. `npm install` (with `--legacy-peer-deps` only if needed; document the reason if used).
6. Run schematics manually if `ng update` listed any "manual migration available": `ng update @angular/core@20 --migrate-only --name=<name>`.
7. Build (`ng build`), test (`npm test`), lint (`npm run lint`).
8. Post-upgrade audit: search for APIs the v20 release notes mark deprecated and replace with the new form. Examples to grep for:
   - `*ngIf`, `*ngFor`, `*ngSwitch` → `@if`, `@for`, `@switch`.
   - `BrowserAnimationsModule` legacy patterns → `provideAnimationsAsync()` if not already done.
   - Any `inject()` migration suggestions.
9. Smoke-test the dev server in a browser.
10. Commit upgrade as a single atomic commit.

## Verification

- `npx ng version` shows `Angular CLI: 20.x`, `Angular: 20.x`.
- `ng build && npm test && npm run lint` all green.
- Dev server boots; primary flows unbroken.
- A short note added to `docs/` or a release-notes file capturing what changed.

## Dependencies

- None (this is the first hop).

## Notes

Use `ng update` — never hand-edit version numbers. After each `ng update`, search the diff and the migration log for any "manual change required" notes; do not skip them. The point of stepping one major at a time is that each hop's schematic knows exactly which patterns to transform.

Reference (Angular release schedule): https://angular.dev/reference/releases
