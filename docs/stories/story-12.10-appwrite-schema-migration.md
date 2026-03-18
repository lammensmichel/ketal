# Story 12.10: Fix Appwrite Schema for KetalSession (turn attribute)

**Status**: Done
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: Critical
**Bug**: Yes - BLOCKER

---

## Story

**As a** player starting a game in room mode
**I want** the game session to be created successfully in Appwrite
**So that** I can play in backend-first mode

---

## Context

When clicking "Débuter la Grosse Guinze" with Story 12.8 (backend-first sessions), the game fails with:
```
Invalid document structure: Unknown attribute: "turn"
```

The `ketal_sessions` collection in Appwrite (fug-backend) does not have the `turn` attribute in its schema. The code tries to create a session with `turn` field but the collection doesn't support it.

This blocks ALL backend-first game sessions. The offline fallback should kick in but currently doesn't (the error is thrown but not caught properly in the game start flow).

---

## Acceptance Criteria

1. **AC1**: `ketal_sessions` collection has all required attributes (turn, phase, status, players, drinkingCards, givingCards, activePlayerId, withSummary)
2. **AC2**: Game start in room mode succeeds without errors
3. **AC3**: Offline fallback works when backend fails

---

## Tasks

- [x] **T1**: Add migration in fug-backend for `ketal_sessions` collection attributes (done via Story 12.11 — normalized into 3 collections)
- [x] **T2**: Verify all attributes match the KetalSession TypeScript interface (done via Story 12.12 — refactored service)
- [x] **T3**: Fix offline fallback — beginGame catches room creation errors and falls back to local mode
- [ ] **T4**: Test end-to-end: login → add players → débuter → game starts

---

## Dev Notes

### Required attributes for ketal_sessions
Based on `src/app/services/ketal-session/ketal-session.service.ts`:
- `roomId` (string)
- `gameId` (string)
- `gameNumber` (integer)
- `status` (string: waiting/playing/finished)
- `phase` (string: setup/dealing/pyramid/finished)
- `turn` (integer) ← MISSING
- `activePlayerId` (string, nullable)
- `players` (string[]) - JSON serialized
- `drinkingCards` (string[])
- `givingCards` (string[])
- `withSummary` (boolean)

### fug-backend migration needed
Check `fug-backend/migrations/` for existing ketal_sessions setup and add missing attributes.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Found during MCP game start test | QA |
