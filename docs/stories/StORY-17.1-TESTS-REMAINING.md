# Story 17.1 — Tests & Checks to Complete

**Status**: ⏳ IN PROGRESS — App is running, tests partially written
**Created**: 2025-05-05

---

## ✅ Completed

- [x] Circular DI loop fixed (RoomService ↔ AuthService ↔ GameService)
- [x] `rooms-list.component.spec.ts` created (15 tests, all pass)
- [x] `room.service.spec.ts` tests exist and pass
- [x] App boots and runs at localhost:4200

---

## ⏳ Remaining — Tests (Phase 7 continued)

### 1. MemberService — NEW methods
| Method | Status | Missing tests |
|--------|--------|---------------|
| `getMembersByUserId(userId)` | ❌ Missing | query filter, empty results |
| `updateRoom(role)` | ❌ Missing | isOnline + lastSeenAt |

### 2. RoomService — NEW methods
| Method | Status | Missing tests |
|--------|--------|---------------|
| `archiveRoom()` — host OK | ❌ Missing | host can archive |
| `archiveRoom()` — non-host | ❌ Missing | throws "Only the host can archive" |
| `leaveRoom()` — host cleanup | ❌ Missing | room→idle, session cancel |
| `leaveRoom()` — non-host | ❌ Missing | just deletes member |
| `renameRoom()` | ❌ Missing | name update + broadcast |
| `startNewSession()` | ❌ Missing | idle check, creates session |
| `handleReconnection()` | ❌ Missing | null sessionId handling |
| `getMyRooms()` — anonymous | ❌ Missing | returns [] |
| `getMyRooms()` — showArchived | ❌ Missing | include/exclude archived |
| `getMyRooms()` — memberCount | ❌ Missing | enrichment verified |
| `getMyRooms()` — limit | ❌ Missing | pagination works |

### 3. RoomTileComponent — Spec file created
| File | Status |
|------|--------|
| `room-tile.component.ts` | ✅ Spec file exists |
| `room-tile.component.html` | ✅ Covered by spec |
| `room-tile.component.spec.ts` | ✅ Created |

Tests needed:
- `handleClick()` — idle → navigate, playing → reconnect, archived → no-op
- `handleAction()` — archive (host), leave (player), delete (host)
- `displayStatus` computed
- Room tile template rendering (status bar colors)

### 4. HomeComponent — Spec file exists
**`home.component.spec.ts` exists** — tests needed:
- Welcome header "Bienvenue {{ userName }}"
- Recent rooms carousel (3 max, sorted by $updatedAt)
- "Créer une partie" → navigate /room/create
- "Rejoindre une partie" → navigate /room/join
- "Mes parties" → navigate /rooms
- Loading state
- Error state

### 5. AppComponent — NO SPEC FILE
**Create `app.component.spec.ts`** — tests needed:
- Active session → navigate /game
- Logged in (no session) → navigate /home
- Anonymous → navigate /players

---

## 📋 Priority Order

1. **High** — RoomTileComponent spec file (critical UX feature)
2. **High** — RoomService tests (archiveRoom, leaveRoom, renameRoom, startNewSession)
3. **High** — MemberService tests (getMembersByUserId, updateRoom)
4. **Medium** — HomeComponent spec file
5. **Medium** — AppComponent spec file
6. **Low** — Edge cases
