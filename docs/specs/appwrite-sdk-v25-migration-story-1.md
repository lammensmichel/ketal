# Design Doc: Appwrite SDK v25 - Realtime Foundation & Type Alignment (Story 1)

## Context
The current implementation of the Ketal realtime system relies on a deprecated subscription pattern from older Appwrite SDK versions. Specifically, `client.subscribe(channel, callback)` is used, which returns a simple `() => void` function to unsubscribe. In v25, this method is deprecated in favor of the `Realtime` class approach, where `subscribe()` returns a `RealtimeSubscription` object containing highly structured methods: `.unsubscribe()`, `.update()`, and `.close()`. 

Failure to migrate will lead to type mismatches, deprecation warnings, and potential breakage when the functional return pattern is eventually removed from the SDK.

## Requirements

### Functional
1. **Modernized Subscription**: Replace `client.subscribe` with `new Realtime(client).subscribe`.
2. **Type Alignment**: Update the internal service interfaces to accommodate the new object-based subscription lifecycle.
3. **Backward Compatibility (Internal)**: Ensure that the high-level services consuming the `RealtimeService` do not require a complete logic rewrite, but rather an adjustment of how they call the "stop/unsubscribe" action.

### Non-Functional
1. **Type Safety**: Eliminate all `any` types in the subscription chain.
2. **Maintainability**: Align with current Appwrite v25 best practices to reduce technical debt.

## Architecture & Implementation Details

### 1. Core Provider: `AppwriteService`
The wrapper must move from a function-returning pattern to an object-returning pattern.

**Current Pattern (Legacy):**
```typescript
// Inside appwrite.service.ts
subscribe<T>(channel: string, callback: (event: T) => void): () => void {
  return this._client.subscribe(channel, callback); 
}
```

**Target Pattern (v25):**
```typescript
import { Realtime } from 'appwrite';

// Inside appwrite.service.ts
subscribe<T>(channel: string, callback: (event: T) => void): RealtimeSubscription {
  const realtime = new Realtime(this._client);
  return realtime.subscribe(channel, callback);
}
```

### 2. Consumer Interface: `RealtimeService`
The bridge between the core Appwrite client and the application components must be updated to reflect the change in the subscription object's structure.

**Proposed Interface Change:**
```typescript
// src/app/services/realtime/realtime.service.ts

export interface Subscription {
  unsubscribe: () => void; // Changed from function to method on object
  update: (callback: (event: any) => void) => void; 
  close: () => void;
}
```

### 3. Data Flow
1. **Component** calls `RealtimeService.subscribeToChannel(id, callback)`.
2. **RealtimeService** calls `AppwriteService.subscribe(id, callback)`.
3. **AppwriteService** returns the native Appwrite `RealtimeSubscription` object.
4. **RealtimeService** wraps/casts this to its own internal `Subscription` interface and returns it to the component.

## API / Interfaces

### Modified `Subscription` Interface
```typescript
/**
 * Represents a subscription to a realtime channel in Ketal.
 * Adapted for Appwrite v25 RealtimeSubscription object.
 */
export interface Subscription {
  /** Unsubscribes from the specific channel */
  unsubscribe: () => void;
  /** Allows updating the callback function without re-subscribing */
  update: (callback: (event: any) => void) => void;
  /** Closes the realtime connection entirely */
  close: () => void;
}
```

## Acceptance Criteria

1. [ ] **AppwriteService** successfully uses `new Realtime(client).subscribe()`.
2. [ ] **RealtimeService** interface updated to include `.unsubscribe()`, `.update()`, and `.close()`.
3. [ ] **Type Check**: `ng build` completes with zero type errors related to the new `Subscription` return types.
4. [ ] **Functionality**: All existing realtime listeners in the application still receive events correctly after the refactor.
5. [ ] **Deprecation Clean-up**: No "deprecated" warnings for `.subscribe()` appear in the console during runtime.

## Risks & Mitigations
* **Risk**: A component calls `subscription()` as a function instead of `subscription.unsubscribe()`.
* **Mitigation**: This is why Story 1 includes "Adapting the 2 sites that consume this wrapper" to ensure the transition from functional call to method call is completed in one atomic step.
