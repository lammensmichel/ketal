# Work Item: Story 5 — Databases Migration (Ketal Session Service)

**ID**: `story-5-databases-ketal-session`
**Complexity**: Medium
**Execution Mode**: Confirm
**Status**: pending

## Description
Migrate the core session handling service which manages active game state and player sessions. This contains one of the highest densities of database calls in the app.

## Acceptance Criteria
- [ ] Refactor 9 call sites in `src/app/services/ketal-session/ketal-session.service.ts`.
- [ ] Update `src/app/services/ketal-session/ketal-session.service.spec.ts` with corresponding mock and assertion updates.
- [ ] Ensure game state persistence and retrieval remains stable across session lifecycle.

## Dependencies
- `story-4-databases-member`
