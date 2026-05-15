---
id: appwrite-sdk-v25-readiness-watch
title: Appwrite — watch for SDK v25 / server message-based subscribe support
status: pending
created: 2026-05-15T10:30:00Z
priority: low
type: watch
---

# Intent: Appwrite — watch for SDK v25 readiness

## Context

The Appwrite Web SDK v25.0.0 introduced a message-based realtime subscribe protocol: the WebSocket opens with only `?project=<id>` and channels are sent as a `{type:'subscribe', data:[...]}` message after the connection is open. The Appwrite Server 1.9.0 (and main branch as of 2026-05-15) does NOT implement the server-side handler for this message — `app/realtime.php` only handles `'ping'` and `'authentication'`, and validates channels in the URL query at handshake time. As a result, v25 + 1.9.0 fails with `1008 Missing channels`.

We have pinned the project to `appwrite@^24.2.0` (last URL-based version). This intent is a placeholder reminder to re-evaluate moving to v25+ when the server gains support.

## Goal

Move the project to the latest Appwrite Web SDK (v25 or later) once the server-side message-based subscribe handler ships.

## Users

Developers — gain access to v25 features (`unsubscribe()`/`update()` on individual subscriptions, slot-based channel changes without socket recreation, etc.).

## Problem

Today the SDK and server protocols are out of sync. We've held on v24.2.0 to keep realtime working. Once the server catches up we'll want to take the new SDK and its richer subscription lifecycle API.

## Success Criteria

- Appwrite Server image is at a version whose `app/realtime.php` contains a `case 'subscribe':` in the `onMessage` switch (i.e. handles message-based subscribe).
- Frontend pinned to `appwrite@^25.x` (or later URL-compatible-removed version).
- Realtime test suite passes with 0 "Missing channels" errors.
- `RealtimeSubscription` consumers (currently using just `.close()`) updated where it adds value (e.g. `update()` to swap channels in place without rebuilding the socket).

## Constraints

- Do NOT bump the SDK speculatively before the server change. The whole point is they have to ship together.

## Scope

### In-scope (when triggered)

- Verify server support by inspecting the realtime container's `app/realtime.php` for a subscribe message handler.
- Bump `appwrite` in `package.json` to the latest minor.
- Re-evaluate `RealtimeService.Subscription` interface to expose `unsubscribe`/`update`/`close` again.
- Migrate manual channel strings to the `Channel` builder if `appwrite-channel-builder` intent is still pending.

### Out-of-scope

- Doing the bump before the server is ready.

## Approach

1. **Watch trigger**: subscribe to Appwrite release notes; check each new server release for a realtime protocol change. Specifically grep the server source: `docker exec appwrite-realtime grep -n "case 'subscribe'" /usr/src/code/app/realtime.php` — when this returns a match, the server is ready.
2. **Optional** (cheap, fast): try a one-shot test by bumping SDK to the latest and running the realtime integration suite against the new server. If passes, proceed; if "Missing channels" still appears, revert.
3. Bump `package.json`, reinstall, run full test suite, smoke-test dev server.
4. If everything green, expose `unsubscribe`/`update` on our `Subscription` wrapper and consider call sites that benefit (e.g. swapping subscribed room without recreating the connection).

## Dependencies

- **Blocking (external)**: Appwrite Server release with `case 'subscribe'` in `app/realtime.php` `onMessage` switch.

## Notes

This is a watch item, not active work. Re-check monthly or when a new Appwrite server release lands. Reference: https://github.com/appwrite/appwrite/releases
