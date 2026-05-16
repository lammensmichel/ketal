# Angular 21 Upgrade - Work Item WI-003
## Peer Dependencies & Installation

**Status**: ✅ Completed  
**Branch**: `feature/angular-20-to-21-upgrade`  
**Date**: 2026-05-16  

---

## Versions Before Upgrade

| Package | Before |
|---------|--------|
| @angular/cdk | ^20.2.14 |
| @angular/material | ^20.2.14 |
| @angular-eslint/builder | ^20.0.0 |
| @angular-eslint/eslint-plugin | ^20.0.0 |
| @angular-eslint/eslint-plugin-template | ^20.0.0 |
| @angular-eslint/schematics | ^20.0.0 |
| @angular-eslint/template-parser | ^20.0.0 |
| @fortawesome/angular-fontawesome | ^3.0.0 |
| angularx-qrcode | ^20.0.0 |
| zone.js | ~0.15.1 |
| typescript | ~5.9.3 |

---

## Upgrades Performed

### 1. Angular Material & CDK
```bash
npx -y ng update @angular/material@21 @angular/cdk@21
```
- ✅ Updated to v21.2.11

### 2. Angular ESLint Packages
Updated manually in package.json:
- ✅ @angular-eslint/builder → ^21.0.0
- ✅ @angular-eslint/eslint-plugin → ^21.0.0
- ✅ @angular-eslint/eslint-plugin-template → ^21.0.0
- ✅ @angular-eslint/schematics → ^21.0.0
- ✅ @angular-eslint/template-parser → ^21.0.0

### 3. Compatibility Fixes
- ✅ @fortawesome/angular-fontawesome → ^4.0.0 ( Angular 21 compatible)
- ✅ angularx-qrcode → ^21.0.5 (Angular 21 compatible)

---

## Versions After Upgrade

| Package | After |
|---------|-------|
| @angular/cdk | ^21.2.11 |
| @angular/material | ^21.2.11 |
| @angular-eslint/builder | ^21.0.0 |
| @angular-eslint/eslint-plugin | ^21.0.0 |
| @angular-eslint/eslint-plugin-template | ^21.0.0 |
| @angular-eslint/schematics | ^21.0.0 |
| @angular-eslint/template-parser | ^21.0.0 |
| @fortawesome/angular-fontawesome | ^4.0.0 |
| angularx-qrcode | ^21.0.5 |
| zone.js | ~0.15.1 (compatible) |
| typescript | ~5.9.3 (compatible) |

---

## npm install Result

```
added 13 packages, removed 46 packages, changed 15 packages
found 0 vulnerabilities
```

---

## Git Commits

- **Commit 1**: `995cb49` - Angular core upgraded to 21.2.13 + CLI 21.2.11
- **Commit 2**: `FIRE: Angular Material CDK upgraded to 21.2.11 [run-ketal-004-wi-003]`
- **Commit 3**: `FIRE: Peer dependencies updated for Angular 21 [run-ketal-004-wi-003]`

---

## Compatibility Notes

| Package | Status | Notes |
|---------|--------|-------|
| zone.js | ✅ Compatible | 0.15.x works with Angular 21 (requires 0.14.x+) |
| typescript | ✅ Compatible | 5.9.3 works (Angular 21 recommends 5.8.x range) |
| @fortawesome/angular-fontawesome | ✅ Updated | 4.0.0 required for Angular 21 support |
| angularx-qrcode | ✅ Updated | 21.0.5 required for Angular 21 support |

---

## Next Work Item: WI-004 (Post-Upgrade Audit & Migration)

- Run `ngcc` compilation check
- Verify Angular compiler settings
- Check for deprecated APIs
- Review migration guides for any remaining changes
- Run `ng update` without arguments to check for remaining updates
