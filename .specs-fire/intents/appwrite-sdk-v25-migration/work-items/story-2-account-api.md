# Work Item: Story 2 — Account API Migration

**ID**: `story-2-account-api`
**Complexity**: Medium
**Execution Mode**: Confirm
**Status**: pending

## Description
Migrate the `Account` service calls from positional arguments to the new object-based parameter pattern required by v25. This affects authentication flows including login, logout, and account creation.

## Acceptance Criteria
- [ ] Refactor 6 call sites in `src/app/services/auth/auth.service.ts`.
- [ ] Update `src/app/services/auth/auth.service.spec.ts`:
    - Redefine mocks to match object signatures.
    - Use `jasmine.objectContaining` for parameter assertions.
- [ ] Verify auth flows (Login, OAuth, Logout) remain functional via integration check if possible or pure unit test success.

## Dependencies
- `story-1-realtime-foundation` (Implicitly relies on core client stability)
