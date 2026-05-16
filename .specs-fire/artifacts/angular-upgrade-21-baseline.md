# Angular 20 → 21 Upgrade — Baseline Snapshot

**Date**: 2026-05-16
**Branch**: `feature/angular-20-to-21-upgrade`
**Git Hash**: `f68ed8ec867483feb979c8a20be6c2046f277b48`

## Current Versions (Angular 20.x)

| Package | Version |
|---------|---------|
| @angular/core | ^20.3.21 |
| @angular/common | ^20.3.21 |
| @angular/compiler | ^20.3.21 |
| @angular/cdk | ^20.0.0 |
| @angular/material | ^20.0.0 |
| @angular/cli | ~20.3.26 |
| typescript | ~5.8.3 |

## Test Status

- **Tests**: 1089 tests
- **Status**: Running (timeout after 5 minutes at ~150 tests)
- **Browser**: Chrome Headless 147.0.0.0 (Linux)
- **Timeout**: Yes (5-minute limit enforced)

## Notes

- Branch is clean (no uncommitted changes)
- Tests started successfully after setting `CHROME_BIN=/usr/bin/chromium`
- Tests are progressing normally (success rate ~100% observed)
- Full test run would take ~3-5 minutes based on current pace

---

**Next Work Item**: WI-002 — Execute `ng update @angular/core @angular/cli --migrate-only --minimum=true --allow-dirty`
