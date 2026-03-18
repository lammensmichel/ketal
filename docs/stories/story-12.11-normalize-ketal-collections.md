# Story 12.11: Normalize Ketal Collections in Backend Migrations

**Status**: Done
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: Critical (blocker for 12.10 and 12.12)
**Repo**: fug-backend

---

## Story

**As a** developer integrating Ketal with Appwrite,
**I want** the ketal data split into 3 normalized collections instead of 1 overloaded collection,
**So that** we stay under Appwrite's attribute limit and enable granular updates and realtime subscriptions.

---

## Context

The current `ketal_sessions` collection (migration 031) has ~22 attributes — hitting Appwrite's attribute limit. It also contains 8 dead attributes (`pyramidCards`, `busCards`, `pyramidRow`, `pyramidCardIndex`, `currentCard`, `busRiderId`, `busProgress`, `deck`) from a never-implemented multi-game architecture.

Since nothing is in production, we can **modify existing migration files directly** and wipe the backend.

---

## Acceptance Criteria

1. **AC1**: Migration 031 creates a lean `ketal_sessions` collection with only session-level attributes (~10 fields)
2. **AC2**: A new migration creates `ketal_players` collection with per-player attributes (~8 fields)
3. **AC3**: A new migration creates `ketal_cards` collection with card-state attributes (~4 fields)
4. **AC4**: Migration 034 (`ketal_sessions_missing_attributes`) is removed (attributes integrated into 031 or moved to new collections)
5. **AC5**: Dead attributes are removed: `pyramidCards`, `busCards`, `pyramidRow`, `pyramidCardIndex`, `currentCard`, `busRiderId`, `busProgress`, `deck`
6. **AC6**: Seed data in 033 is cleaned (`pyramidRows` removed from defaultSettings)
7. **AC7**: Backend starts cleanly after wipe (`make dev` → migrations run without errors)
8. **AC8**: Appropriate indexes are created for the new collections

---

## Tasks / Subtasks

- [x] **T1**: Modify migration `031_ketal_sessions.js` (AC: 1, 5)
  - [x] Remove all dead attributes: pyramidCards, busCards, pyramidRow, pyramidCardIndex, currentCard, busRiderId, busProgress, deck
  - [x] Integrate attributes from migration 034: turn, drinkingCards, givingCards, withSummary
  - [x] Remove `players` embedded JSON (moves to ketal_players)
  - [x] Keep: roomId, gameId, gameNumber, status, phase, turn, activePlayerId, withSummary, startedAt, finishedAt
- [x] **T2**: Create migration for `ketal_players` collection (AC: 2)
  - [x] Attributes: sessionId (string, required), memberId (string, required), displayName (string), order (integer), cards (string/JSON), choices (string/JSON), sipsTaken (integer), sipsGiven (integer), isReady (boolean)
  - [x] Permissions: same pattern as ketal_sessions
- [x] **T3**: Create migration for `ketal_cards` collection (AC: 3)
  - [x] Attributes: sessionId (string, required), drinkingCards (string/JSON), givingCards (string/JSON), deck (string/JSON — optional, for future use)
  - [x] Permissions: same pattern as ketal_sessions
- [x] **T4**: Delete migration `034_ketal_sessions_missing_attributes.js` (AC: 4)
- [x] **T5**: Clean seed data in `033_seed_games.js` — remove `pyramidRows` from defaultSettings (AC: 6)
- [x] **T6**: Update/create index migration for new collections (AC: 8)
  - [x] Index on ketal_players: sessionId
  - [x] Index on ketal_cards: sessionId
- [x] **T7**: Wipe backend and verify clean start (AC: 7)
  - [x] `make clean && make dev`
  - [x] Verify all migrations run successfully
  - [x] Verify collections exist with correct attributes in Appwrite console

---

## Dev Notes

### Target Schema

**ketal_sessions** (~10 attributes):
| Attribute | Type | Details |
|-----------|------|---------|
| roomId | string | required, 36 chars |
| gameId | string | default: 'ketal' |
| gameNumber | integer | required, 1-10000 |
| status | string | 'waiting' / 'playing' / 'finished' |
| phase | string | 'setup' / 'dealing' / 'pyramid' / 'finished' |
| turn | integer | 0-100, default: 0 |
| activePlayerId | string | 36 chars, nullable |
| withSummary | boolean | default: false |
| startedAt | datetime | nullable |
| finishedAt | datetime | nullable |

**ketal_players** (~9 attributes):
| Attribute | Type | Details |
|-----------|------|---------|
| sessionId | string | required, 36 chars (FK to ketal_sessions) |
| memberId | string | required, 36 chars (FK to game_members) |
| displayName | string | required |
| order | integer | 1-based player order |
| cards | string | JSON serialized CardType[] |
| choices | string | JSON serialized PlayerChoices |
| sipsTaken | integer | default: 0 |
| sipsGiven | integer | default: 0 |
| isReady | boolean | default: false |

**ketal_cards** (~4 attributes):
| Attribute | Type | Details |
|-----------|------|---------|
| sessionId | string | required, 36 chars (FK to ketal_sessions) |
| drinkingCards | string | JSON serialized, max 3000 chars |
| givingCards | string | JSON serialized, max 3000 chars |
| deck | string | JSON serialized, max 3000 chars (future use) |

### Migration file location
`fug-backend/migrations/migrations/`

### Migration numbering
- 031: ketal_sessions (modify existing)
- 033: seed (clean pyramidRows)
- 034: DELETE
- 035: ketal_players (new)
- 036: ketal_cards (new)
- 037: ketal_indexes (new, or extend 032)

### Note on phase naming
The phase value `'pyramid'` in Appwrite maps to Ketal's phase 2 (drinking/giving). It's a misnomer but changing it is out of scope — would require frontend mapping changes. Can be addressed later if desired.

### Testing

- Manual verification: wipe backend, run `make dev`, check Appwrite console
- Verify collection attributes match the schema tables above
- Verify indexes are created
- No automated tests in fug-backend migration system

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story drafted | SM |
| 2026-03-18 | 2.0 | Implemented and merged (fug-backend PR #1) | Dev |
