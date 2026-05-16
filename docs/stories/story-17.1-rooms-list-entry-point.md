# Story 17.1: Rooms list entry point + Home redesign

**Status**: ✅ Completed
**Epic**: Epic 17 — Rooms & Multiplayer
**Priority**: High
**Depends On**: Story 2.2 (Home), Story 15.6 (Lobby), Story 17.5 (TV / Spectator mode)

---

## Story

**As a** connected non-anonymous user
**I want** a `/rooms` page listing my rooms, plus a redesigned `/home` with a "Recent rooms" carousel
**So that** I can quickly re-enter an ongoing game, create a new room, or join one — and see where I left off.

---

## ✅ COMPLETED WORK

### Phase 1 — Migrations Backend (fug-backend)
| Migration | Collection | Action | Status |
|---|---|---|---|
| `037_fug_game_room_archived.js` | `fug_game_rooms` | `status` enum → `'idle' \| 'playing' \| 'archived'` | ✅ Applied |
| `038_ketal_sessions_terminate.js` | `ketal_sessions` | `status` enum → `'waiting' \| 'playing' \| 'finished' \| 'cancelled'` + `terminatedBy` | ✅ Applied |
| `039_ketal_players_hasLeft.js` | `ketal_players` | `hasLeft` boolean (default `false`) | ✅ Applied |

### Phase 2 — Service Layer (ketal)
- **MemberService**: `getMembersByUserId()` — query members by userId, `updateRoom()` — update isOnline/lastSeenAt
- **RoomService**: 
  - `RoomStatus` = `'idle' | 'playing' | 'archived'`, `GameRoom.archived?: boolean`
  - `GameRoomWithMemberCount` interface added
  - `getMyRooms(limit, showArchived)` — filtré par userId → filtered by archived → sorted `$updatedAt desc`
  - `renameRoom()`, `archiveRoom()`, `leaveRoom()`, `startNewSession()` — nouvelles méthodes
  - Injection de `MemberService` + `AuthService`

### Phase 3 — UI Components
- **RoomTileComponent** (`_components/room/room-tile/`) — tuile : statusbar colorée, nom+code, X/Y joueurs, actions
- **RoomsListComponent** (`_components/room/rooms-list/`) — page `/rooms`: grid 720px, empty/loading/error state, skeleton

### Phase 4 — Home Redesign
- Header "Bienvenue {{ userName }}"
- Carrousel "Mes parties récentes" (3 tuiles max, horizontal scroll)
- CTA "Créer une partie" + "Rejoindre une partie"
- **Tous boutons "Pause" supprimés**

### Phase 5 — Routing & Auth
- Route `/rooms` lazy-loaded
- AppComponent: `/game` (priorité) → `/home` (defaut) → `/players` (anon)
- SideMenu: "Mes rooms" visible connecté uniquement

### Phase 6 — Styles
- Room tile: statusbar, hover scale, colors
- Rooms grid: `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`
- Home carousel: `scroll-snap`, hide scrollbar
- Skeleton loader: pulse animation

---

## ✅ AC Checksum

| ID | Critère | Status |
|---|---|---|
| AC1 | 3 migrations | ✅ 037+038+039 appliquées |
| AC2 | `getMyRooms()` filtré userId | ✅ userId → roomIds → fetch → filter → sort |
| AC3 | `leaveRoom()` + broadcast | ✅ delete member + broadcast + host cleanup |
| AC4 | `renameRoom()` + broadcast | ✅ update + RealtimeService.broadcastToRoom |
| AC5 | Auto-host-in-session | ✅ startNewSession() avec ketal_player auto |
| AC6 | `RoomsListComponent` page /rooms | ✅ lazy-loaded, grid, states |
| AC7 | `RoomTileComponent` | ✅ status coloré, nom+code, X/Y, actions |
| AC8 | Click routing | ✅ idle → /room, playing → reconnect, archived → disabled |
| AC9 | Side-menu "Mes rooms" | ✅ visible connecté uniquement |
| AC10 | 720px + grid auto-fill | ✅ implémenté |
| AC11 | Header bienvenue | ✅ "Bienvenue {{ userName }}" |
| AC12 | Carrousel 3 tuiles | ✅ horizontal scroll, "Voir tout" |
| AC13 | CTAs + Plus de Pause | ✅ "Créer" + "Rejoindre", pause supprimé |
| AC14 | Empty state carrousel | ✅ "Vous n'avez encore aucune partie" |
| AC15 | Post-login → /home | ✅ defaut → /home |
| AC16 | Active session → /game | ✅ prioritaire |
| AC17 | Anonyme → /players | ✅ prioritaire |

---

## Build Status

- ✅ `ng build` — compile sans erreurs
- ⚠️ 1 règle selector (pré-existante) ignorée
- ⚠️ Warnings budget/unused files — non critiques

---

## Branches

- **Backend**: `feat/17.1-backend-m` (fug-backend) — migrations commit + push
- **Frontend**: `feat/17.1-angular-ui` (ketal) — tous les changements en staging
- **Stories docs**: `main` (ketal) — à mettre à jour avec merge

---

## ❌ NOT YET DONE — Tests (Phase 7)

Ces tests restent à écrire :

1. **`room.service.spec.ts`**:
   - `getMyRooms()` filtre par userId
   - Exclusion des rooms `archived`
   - `leaveRoom()` si Host → update ketal_sessions

2. **`rooms-list.component.spec.ts`**:
   - Affiche list quand non empty
   - Affiche "Aucune room" quand vide
   - Clic tuile → navigation correcte

---

## Merge Order

1. ✅ **fug-backend**: Merge `feat/17.1-backend-m` → `develop` (migrations)
2. ⏳ **ketal**: Merge `feat/17.1-angular-ui` → `feature/fug-backend-integration` (UI + services)
3. ⏳ **Tests**: Écrire Phase 7
4. ⏳ **Docs**: Mettre à jour story doc status → "Done"
