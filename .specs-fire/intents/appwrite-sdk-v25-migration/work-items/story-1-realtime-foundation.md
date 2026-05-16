# Work Item: Story 1 — Realtime Foundation & Types

**ID**: `story-1-realtime-foundation`
**Complexity**: High
**Execution Mode**: Validate (Requires Design Doc)
**Status**: pending

## Description
The current subscription pattern in Appwrite is deprecated. We need to transition from the functional return type to the formal `RealtimeSubscription` object provided by the `new Realtime(client)` constructor in v25. This is a foundation piece because other services depend on the return types of the core wrappers.

## Acceptance Criteria
- [ ] `appwrite.service.ts`: Implement `new Realtime(client).subscribe()` and update implementation to return `RealtimeSubscription`.
- [ ] `realtime.service.ts`: Update the `Subscription` interface to include `unsubscribe`, `update`, and `close`.
- [ ] Fix any consumer sites that currently use `.unsubscribe()` as a function (it must now be a method on the object).
- [ ] Verify that `ng build` completes without type errors in the subscription chain.

## Dependencies
- None (Foundation)
