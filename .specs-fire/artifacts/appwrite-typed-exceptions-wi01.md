# Audit Appwrite Catch Blocks - Work Item WI-01

**Run**: ketal-007  
**Intent**: appwrite-typed-exceptions  
**Date**: 2026-05-17

## Executive Summary

**Total catch blocks found**: 42  
**Files with catch blocks**: 8 (6 services + 2 integration tests)  
**Catch blocks requiring typed exceptions**: 42

### Issues by Type
| Type | Count | Severity | Notes |
|------|-------|----------|-------|
| `error` (implicit any) | 36 | High | No type annotation, Appwrite exceptions not handled |
| `error: unknown` | 2 | Medium | Manual probing detected (check error.code, error.message) |
| No error variable | 4 | Low | Silent catches with comment |


## Detailed Catch Block Analysis

### 1. auth.service.ts (16 catch blocks)

| Line | Code | Type | Issue | Priority |
|------|------|------|-------|----------|
| 93 | `catch {` | implicit any | Silent catch in init() | Low |
| 118 | `catch {` | implicit any | Silent catch in signUp() | Low |
| 136 | `catch (error) {` | implicit any | rethrow error without typing | High |
| 176 | `catch {` | implicit any | Silent catch in loginWithEmail() | Low |
| 183 | `catch (error) {` | implicit any | rethrow error without typing | High |
| 211-239 | Multiple `catch {` | implicit any | Silent catches in logout() cleanup | Low |
| 244 | `catch {` | implicit any | Silent catch in logout() session delete | Low |
| 281 | `catch (error: unknown)` | explicit unknown | **Manual probing**: checks `error.message.includes('session is active')` | Medium |
| 288 | `catch {` | implicit any | Silent catch fallback | Low |
| 323 | `catch {` | implicit any | Silent catch in getOrCreateSession() | Low |
| 330 | `catch (error) {` | implicit any | rethrow error without typing | High |

**Issues**:
- User-facing errors rethrown without AppwriteException typing
- Session creation errors should use `AppwriteException` for specific error codes

---

### 2. room.service.ts (7 catch blocks)

| Line | Code | Type | Issue | Priority |
|------|------|-------|-------|----------|
| 142 | `catch (error) {` | implicit any | Error converted to string, loses structure | High |
| 175 | `catch (error) {` | implicit any | Error converted to string | High |
| 202 | `catch (error) {` | implicit any | Error converted to string | High |
| 225 | `catch (error) {` | implicit any | Error converted to string | High |
| 244 | `catch (error: unknown)` | explicit unknown | **Manual probing**: checks `'code' in error`, `(error as { code: number }).code === 404` | Medium |
| 319 | `catch (error) {` | implicit any | Error converted to string | High |
| 343 | `catch (error) {` | implicit any | Error converted to string | High |

**Issues**:
- All error messages use string conversion template: `${error instanceof Error ? error.message : 'Unknown error'}`
- `getRoomById()` has manual 404 probing but should use `AppwriteException` type

---

### 3. member.service.ts (8 catch blocks)

| Line | Code | Type | Issue | Priority |
|------|------|-------|-------|----------|
| 122 | `catch (error) {` | implicit any | Error converted to string | High |
| 146 | `catch (error) {` | implicit any | Error converted to string | High |
| 198 | `catch (error) {` | implicit any | Error converted to string | High |
| 237 | `catch (error) {` | implicit any | Error converted to string | High |
| 291 | `catch (error) {` | implicit any | Error converted to string | High |
| 317 | `catch (error) {` | implicit any | Error converted to string | High |
| 332 | `catch (error) {` | implicit any | Error converted to string | High |
| 346 | `catch (error) {` | implicit any | Error converted to string | High |

**Issues**:
- All errors converted to string, losing Appwrite-specific error codes
- Member creation/update errors should use typed exceptions

---

### 4. game.service.ts (6 catch blocks)

| Line | Code | Type | Issue | Priority |
|------|------|-------|-------|----------|
| 281 | `catch (error) {` | implicit any | Logs `error.message`, silent fallback | Medium |
| 398 | `catch (error) {` | implicit any | Logs `error.message`, silent fallback | Medium |
| 445 | `catch (error) {` | implicit any | Logs `error.message`, silent fallback | Medium |
| 668 | `catch (error) {` | implicit any | Logs `error.message`, silent fallback | Medium |
| 1064 | `catch (error) {` | implicit any | Logs `error`, then fallback to local mode | Medium |
| 1110 | `catch (error) {` | implicit any | Logs `error.message`, rethrows error | High |

**Issues**:
- `beginGame()` fallback should use typed exception to distinguish network vs app errors
- Session update errors in room mode should be typed

---

### 5. ketal-session.service.ts (5 catch blocks)

| Line | Code | Type | Issue | Priority |
|------|------|-------|-------|----------|
| 286 | `catch (error) {` | implicit any | Logs error.message, throws generic Error | High |
| 344 | `catch (error) {` | implicit any | Logs error.message, throws generic Error | High |
| 385 | `catch (error) {` | implicit any | Logs error.message, throws generic Error | High |
| 423 | `catch (error) {` | implicit any | Logs error.message, throws generic Error | High |
| 458 | `catch (error) {` | implicit any | Logs error.message, throws generic Error | High |

**Issues**:
- All session lifecycle errors (start/update/cancel/end/get) use generic Error
- Should use `AppwriteException` to handle specific Appwrite error codes

---

### 6. local-mode.service.ts (1 catch block)

| Line | Code | Type | Issue | Priority |
|------|------|-------|-------|----------|
| 527 | `catch (error) {` | implicit any | Logs error.message | Low |

**Issues**:
- Local storage write errors should be typed

---

### 7. Integration Test Files (2 files)

| File | Catch Block |
|------|-------------|
| `realtime-ketal-sessions.integration.spec.ts` | Line 53: `catch (error)` |
| `realtime-document-modification.integration.spec.ts` | Line 55: `catch (error)` |

**Notes**: Test files - may need separate test-specific exception handling.

---

## Recommendations

### Priority 1: High-Impact Errors
- **auth.service.ts lines 136, 183, 330**: User login/signup errors rethrown without typing
- **room.service.ts lines 142-244**: Room CRUD operations lose error context
- **member.service.ts lines 122-346**: Member CRUD operations lose error context
- **game.service.ts line 1110**: Game start errors rethrown

### Priority 2: Medium-Impact Errors
- **room.service.ts line 244**: Manual 404 probing should use typed exception
- **auth.service.ts line 281**: Session active error probing should use typed exception

### Priority 3: Low-Impact Errors
- Silent catches with `catch {}` pattern

## Next Steps (WI-02)

1. **Create `AppwriteException` utility class**:
   - Extract Appwrite error code from error response
   - Map Appwrite error codes to typed exceptions
   - Provide `isAppwriteException()` guard

2. **Refactor auth.service.ts**:
   - Type all catch blocks with `AppwriteException`
   - Map error codes to user-facing messages

3. **Refactor room.service.ts**:
   - Use typed exceptions for room CRUD operations
   - Replace manual `error.code === 404` probing with type guards

4. **Refactor member.service.ts**:
   - Type all member errors with `AppwriteException`

5. **Refactor game.service.ts**:
   - Type session sync errors
   - Improve fallback logic in `beginGame()`

6. **Refactor ketal-session.service.ts**:
   - Type all session lifecycle errors

## Files Summary

| File | Catch Count | Type Issues | Priority |
|------|-------------|-------------|----------|
| auth.service.ts | 16 | 4 explicit any/unknown, 2 manual probing | High |
| room.service.ts | 7 | 5 implicit any, 1 manual probing | High |
| member.service.ts | 8 | 8 implicit any | High |
| game.service.ts | 6 | 6 implicit any | Medium |
| ketal-session.service.ts | 5 | 5 implicit any | High |
| local-mode.service.ts | 1 | 1 implicit any | Low |
| Integration tests | 2 | 2 implicit any | Test-only |

---

*Generated by work item WI-01 [run-ketal-007]*
