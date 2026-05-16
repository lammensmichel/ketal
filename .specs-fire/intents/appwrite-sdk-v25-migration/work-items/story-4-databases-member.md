# Work Item: Story 4 — Databases Migration (Member Service)

**ID**: `story-4-databases-member`
**Complexity**: Medium
**Execution Mode**: Confirm
**Status**: pending

## Description
Migrate member management database calls to the updated v25 object parameter signature.

## Acceptance Criteria
- [ ] Refactor 8 call sites in `src/app/services/member/member.service.ts`.
- [ ] Update `src/app/services/member/member.service.spec.ts` with matching mock signatures and assertions.
- [ ] Verify member lifecycle (Add, Remove, Status) works correctly.

## Dependencies
- `story-3-databases-room`
