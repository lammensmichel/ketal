# WI-002: Angular 20 → 21 Upgrade Result

**Date**: 2026-05-16  
**Branch**: `feature/angular-20-to-21-upgrade`  
**Baseline commit**: 01860893  
**Status**: ✅ SUCCESS

---

## Summary

Successfully upgraded Angular from version 20.3.21 to 21.2.13 using `npx -y ng update @angular/cli@21 @angular/core@21`.

---

## New Versions

### Angular Packages
| Package | Old Version | New Version |
|---------|-------------|-------------|
| @angular/animations | ^20.3.21 | **^21.2.13** |
| @angular/common | ^20.3.21 | **^21.2.13** |
| @angular/compiler | ^20.3.21 | **^21.2.13** |
| @angular/core | ^20.3.21 | **^21.2.13** |
| @angular/forms | ^20.3.21 | **^21.2.13** |
| @angular/platform-browser | ^20.3.21 | **^21.2.13** |
| @angular/platform-browser-dynamic | ^20.3.21 | **^21.2.13** |
| @angular/router | ^20.3.21 | **^21.2.13** |
| @angular/compiler-cli | ^20.3.21 | **^21.2.13** |
| @angular/cdk | ^20.0.0 | *unchanged* |
| @angular/material | ^20.0.0 | *unchanged* |

### Angular CLI
| Package | Old Version | New Version |
|---------|-------------|-------------|
| @angular/cli | ~20.3.26 | **~21.2.11** |
| @angular-devkit/build-angular | ^20.3.26 | **^21.2.11** |

### Other Dependencies
| Package | Old Version | New Version |
|---------|-------------|-------------|
| typescript | ~5.8.3 | **~5.9.3** |

---

## Migrations Applied

### @angular/cli
1. ✅ Removed default karma configuration (already present without custom file)
2. ✅ Updated `moduleResolution` to `bundler` in tsconfig
3. ✅ Updated `lib` property to `es2022` in tsconfig files

### @angular/core
1. ✅ Added `BootstrapContext` to server rendering
2. ✅ Moved `ApplicationConfig` imports to `@angular/core`
3. ✅ Migrated deprecated bootstrap options to providers (`src/main.ts`)
4. ✅ Converted application to block control flow syntax (8 component files modified)
5. ✅ Verified `Router.lastSuccessfulNavigation` signal invocation

---

## Files Modified

### Core Configuration
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `src/main.ts`

### Component Files (Block Syntax Migration)
1. `src/app/_components/auth/login/login.component.ts`
2. `src/app/_components/auth/register/register.component.ts`
3. `src/app/_components/room/join-room/join-room.component.ts`
4. `src/app/_components/room/lobby/lobby.component.ts`
5. `src/app/_components/room/room-stats/room-stats.component.ts`
6. `src/app/_components/room/rooms-list/rooms-list.component.ts`
7. `src/app/_components/legal/terms/terms.component.ts`
8. `src/app/_components/room/create-room/create-room.component.ts`

**Total**: 12 files changed (3675 insertions, 2701 deletions)

---

## Peer Dependencies (Pending - WI-003)

The following packages remain at Angular 20.x and should be upgraded in **WI-003: Peer Dependencies**:

| Package | Current | Note |
|---------|---------|------|
| @angular/cdk | ^20.0.0 | Needs to match Angular version |
| @angular/material | ^20.0.0 | Needs to match Angular version |
| @angular-devkit/build-angular | ^21.2.11 | Updated ✅ |
| @angular-eslint/* packages | ^20.0.0 | Linting tools, optional upgrade |

---

## Errors Encountered

None. Upgrade completed successfully.

---

## Next Steps

1. Run `npm test` to verify all tests pass
2. Run `npm run lint:fix` to apply any linting fixes
3. Proceed to **WI-003: Peer Dependencies Upgrade**

---

## Verification

```bash
# Check versions
npx ng version
npm ls @angular/core @angular/cli

# Run tests
npm test

# Build (optional)
npm run build
```
