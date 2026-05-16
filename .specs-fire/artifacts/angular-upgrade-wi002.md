# Angular 19 → 20 Upgrade - WI-002 Artifact

**Run:** `run-ketal-003`  
**Work Item:** `WI-002` (Primary Angular & CLI Upgrade)  
**Status:** ✅ Completed  
**Date:** 2026-05-16

## Summary

Successfully upgraded the Ketal Angular application from version 19.2.17 to 20.3.21.

## New Versions

| Package | Old Version | New Version |
|---------|-------------|-------------|
| Angular CLI | 19.2.19 | 20.3.26 |
| Angular Core | 19.2.17 | 20.3.21 |
| Angular CDK | 19.2.19 | 20.2.14 |
| Angular Material | 19.2.19 | 20.2.14 |
| @angular-devkit/build-angular | 19.2.19 | 20.3.26 |
| @angular/compiler-cli | 19.2.17 | 20.3.21 |

## Packages Updated

### Dependencies
- `@angular/animations`: ^19.2.17 → ^20.3.21
- `@angular/cdk`: ^19.2.19 → ^20.0.0
- `@angular/common`: ^19.2.17 → ^20.3.21
- `@angular/compiler`: ^19.2.17 → ^20.3.21
- `@angular/core`: ^19.2.17 → ^20.3.21
- `@angular/forms`: ^19.2.17 → ^20.3.21
- `@angular/material`: ^19.2.19 → ^20.0.0
- `@angular/platform-browser`: ^19.2.17 → ^20.3.21
- `@angular/platform-browser-dynamic`: ^19.2.17 → ^20.3.21
- `@angular/router`: ^19.2.17 → ^20.3.21
- `@fortawesome/angular-fontawesome`: ^0.15.0 → ^3.0.0 (fixed peer dependency conflict)
- `angularx-qrcode`: ^21.0.4 → ^20.0.0 (fixed peer dependency conflict)

### Dev Dependencies
- `@angular-devkit/build-angular`: ^19.2.19 → ^20.3.26
- `@angular-eslint/builder`: ^19.8.1 → ^20.0.0
- `@angular-eslint/eslint-plugin`: ^19.8.1 → ^20.0.0
- `@angular-eslint/eslint-plugin-template`: ^19.8.1 → ^20.0.0
- `@angular-eslint/schematics`: ^19.8.1 → ^20.0.0
- `@angular-eslint/template-parser`: ^19.8.1 → ^20.0.0
- `@angular/cli`: ~19.2.19 → ~20.3.26
- `@angular/compiler-cli`: ^19.2.17 → ^20.3.21

## Conflicts Resolved

### Peer Dependency Conflicts
1. **angularx-qrcode** v21.0.4 required Angular 21 (`^21.0.0`), which was incompatible with Angular 20 upgrade.  
   **Resolution:** Downgraded to v20.0.0 which supports Angular 20.

2. **@fortawesome/angular-fontawesome** v0.15.0 had peer dependency on Angular 18+ but conflict with v4.0.0 requiring Angular 21.  
   **Resolution:** Downgraded to v3.0.0 which officially supports Angular 20 (`@angular/core: ^20.0.0`).

### Migration Migrations Applied
- Updated workspace generation defaults to maintain previous style guide behavior
- Updated `moduleResolution` to `bundler` in `tsconfig.json`
- Removed karma configuration files (default config now provided by build-angular)

## Build Verification

Build completed successfully with `ng build --configuration development`.  
Only informational warnings about unused TypeScript files (expected in test/config files).

## Files Modified

- `package.json` - Updated all Angular packages
- `package-lock.json` - npm lock file regenerated
- `angular.json` - Updated by Angular CLI migration
- `tsconfig.json` - Updated `moduleResolution` to `bundler`

## Next Work Item

**WI-003:** Post-Upgrade Stability & Build Verification  
- Run unit tests (`npm test`)
- Run linting (`npm run lint:fix`)
- Start dev server and verify hot reload works
- Verify browser compatibility

## Baseline Commit

`0be5c75b0bdbbf37d04b2ca45262e4eb8e66970f`
