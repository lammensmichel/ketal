# Work Item: Story 3 — Databases Migration (Room Service)

**ID**: `story-3-databases-room`
**Complexity**: Medium
**Execution Mode**: Confirm
**Status**: pending

## Description
Migrate all database operations within the Room service to use object-based parameters. This impacts game setup, room management, and state synchronization.

## Acceptance Criteria
- [ ] Refactor 6 call sites in `src/app/services/room/room.service.ts` (createDocument, deleteDocument, listDocuments, getDocument, updateDocument).
- [ ] Update `src/app/services/room/room.service.spec.ts`:
    - Adapt `callFake` logic to destruct object arguments.
    - Update assertions for parameter contents.
- [ ] Ensure room lifecycle (Join, Leave, Action) works correctly with new SDK patterns.

## Dependencies
- `story-2-account-api`
