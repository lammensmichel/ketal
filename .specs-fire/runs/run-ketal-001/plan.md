# Implementation Plan: Story 1 — Realtime Foundation & Types (Validate Mode)

**Work Item**: `story-1-realtime-foundation`  
**Run**: `run-ketal-001`  
**Intent**: `appwrite-sdk-v25-migration`  
**Mode**: Validate (2 checkpoints)

---

## Current State (v24 Legacy Pattern)

```typescript
// appwrite.service.ts — returns () => void
subscribe<T>(channels: string | string[], callback): () => void {
  return this._client.subscribe(channels, callback);
}

// realtime.service.ts — wraps it in our Subscription interface
interface Subscription {
  id: string;
  channel: string;
  unsubscribe: () => void;      // <-- function reference from v24
}
```

The `RealtimeService.createSubscription()` stores the raw `() => void` function as `subscription.unsubscribe`. All existing consumers call `realtimeService.unsubscribe(id)` which calls that function.

---

## Target State (v25 RealtimeSubscription)

```typescript
// appwrite.service.ts — returns RealtimeSubscription object
import { Realtime, RealtimeSubscription } from 'appwrite';

subscribe<T>(channels: string | string[], callback): RealtimeSubscription {
  const realtime = new Realtime(this._client);
  return realtime.subscribe(channels, callback);
}

// realtime.service.ts — maps to our adapted Subscription interface
interface Subscription {
  id: string;
  channel: string;
  unsubscribe: () => void;     // calls realSub.unsubscribe()
  update: (callback: (event: any) => void) => void;   // optional
  close: () => void;           // calls realSub.close()
}
```

---

## Files to Modify

### 1. `src/app/services/appwrite/appwrite.service.ts` — Core wrapper change

**Changes:**
- Add import for `Realtime`, `RealtimeSubscription` from 'appwrite'
- Change `subscribe<T>` signature: return type from `() => void` → `RealtimeSubscription`
- Change implementation: `this._client.subscribe(...)` → `new Realtime(this._client).subscribe(channels, callback)`
- Update JSDoc example to show method-based unsubscribe (`.unsubscribe()` instead of `()`)

**No breaking changes for direct consumers** — only `RealtimeService` calls this, so no downstream consumer files need updating.

---

### 2. `src/app/services/realtime/realtime.service.ts` — Interface update + wrapper alignment

**Changes:**
- Expand `Subscription` interface to include `update` and `close` methods (align with v25)
- In `createSubscription<T>()`, adapt the returned `RealtimeSubscription` to our `Subscription`:
  - `subscription.unsubscribe` → delegates to `realSub.unsubscribe()`
  - `subscription.update` → delegates to `realSub.update(...)`
  - `subscription.close` → delegates to `realSub.close()`
- Store the native `RealtimeSubscription` internally so we can delegate properly

**Implementation approach:**
```typescript
// Internal storage wraps both: our typed interface + native subscription
interface SubscriptionInternal {
  id: string;
  channel: string;
  unsubscribe: () => void;
  update: (callback: (event: unknown) => void) => void;
  close: () => void;
  _native: RealtimeSubscription; // for internal delegate calls
}
```

---

### 3. Test files — Update mocks to match new types

#### `src/app/services/realtime/realtime.service.spec.ts` (if exists)
- Mock the native `RealtimeSubscription` shape returned by `appwriteService.subscribe()`

#### `src/app/testing/test-helpers.ts`
- Update `MockRealtimeService` to include `update` and `close` on mock `Subscription` objects
- Update jasmine spy definitions in spec files (lobby.component.spec.ts, etc.) to match new interface

---

### 4. No other consumer changes required

Exploration confirmed: **zero** files call `appwriteService.subscribe()` directly except `RealtimeService.createSubscription()`. All unsubscribe flows go through `RealtimeService.unsubscribe(id)`. The high-level API surface is unchanged — only internal types shift.

---

## Implementation Order

1. **`appwrite.service.ts`** — Change subscribe implementation (foundation layer)
2. **`realtime.service.ts`** — Update Subscription interface + createSubscription wrapper
3. **Test mocks & spec files** — Update jasmine spys, mock helpers, assertions
4. **Type check** — `ng build` to verify zero type errors in subscription chain

---

## Acceptance Criteria (from work item)

- [ ] `appwrite.service.ts`: implements `new Realtime(client).subscribe()` returning `RealtimeSubscription`
- [ ] `realtime.service.ts`: Subscription interface includes `unsubscribe`, `update`, `close`
- [ ] No consumer site uses `.unsubscribe()` as a function — all flows via proper method call
- [ ] `ng build` completes without type errors in subscription chain

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `new Realtime()` creates a fresh connection each call | Store a single `Realtime` instance on `AppwriteService`, reuse it per calls (see decision) |
| API surface breaking if consumers directly used `appwriteService.subscribe()` | Confirmed: zero direct consumers — only internal `RealtimeService` wrapper |
| `RealtimeSubscription.update()` signature differs from what we expect | Will inspect actual v25 SDK types and align callback signature exactly |

---

## Key Decisions (Draft)

1. **Singleton Realtime instance**: Instead of `new Realtime()` on every `subscribe()` call, store a single `Realtime` instance on `AppwriteService` to avoid creating multiple websocket connections.
2. **Backward-compatible Subscription interface**: Keep `id`, `channel` + add `update`/`close` as optional-compatible with existing code paths that only use `unsubscribe`.
