# Implémentation Story 17.1 — Statut Final

**Objet**: Créer l'expérience de gestion des rooms (/rooms + Home redesign) et les fondamentaux backend.

---

## ✅ COMPLETÉ

### Phase 1 — Migrations Backend (fug-backend)
- `037_fug_game_room_archived.js` — `fug_game_rooms.status` : idle, playing, **archived**
- `038_ketal_sessions_terminate.js` — `ketal_sessions.status` : waiting, playing, finished, **cancelled** + `terminatedBy`
- `039_ketal_players_hasLeft.js` — `ketal_players.hasLeft` (boolean, default `false`)
- ✅ **Validé** sur `make migrate ENV=development`

### Phase 2 — Service Layer (Angular)
**MemberService**:
- `getMembersByUserId(userId)` — nouveau, queries fug_game_members par userId
- `updateRoom(role)` — update isOnline/lastSeenAt current member

**RoomService**:
- Type `RoomStatus` → `'idle' | 'playing' | 'archived'`
- Interface `GameRoom` + `archived?: boolean`
- Interface `GameRoomWithMemberCount` (extends GameRoom + memberCount)
- `getMyRooms(limit, showArchived)` — filtré userId → filter archived → sort $updatedAt
- `renameRoom(roomId, newName)` — update + broadcast
- `archiveRoom(roomId)` — host-only → archived
- `leaveRoom(roomId)` — delete member + host cleanup (idle + cancel session)
- `startNewSession(roomId)` — new session + auto host as player
- Injection de MemberService + AuthService

**RealtimeService**:
- `broadcastToRoom(roomId, event, data)` — nouveau

**KetalSessionService**:
- `SessionStatus` étendu + `terminatedBy` / `hasLeft` dans interfaces

### Phase 3 — UI Components
- `RoomTileComponent` — tuile avec statusbar color, nom+code, memberCount, actions
- `RoomsListComponent` — page /rooms, grid 720px, empty/loading/error state, skeleton
- Route `/rooms` lazy-loaded

### Phase 4 — Home Redesign
- Header "Bienvenue {{ userName }}"
- Carrousel "Mes parties récentes" (3 tuiles max, horizontal scroll)
- CTA "Créer une partie" (primary) + "Rejoindre une partie"
- **Pause button supprimé**

### Phase 5 — Routing & Auth
- AppComponent: session → /game (prio), anon → /players (prio), else /home
- SideMenu: "Mes rooms" visible connecté uniquement

### Phase 6 — Styles
- Tous SCSS intégrés dans composants correspondants

### Build Status
- ✅ `ng build` sans erreurs

---

## ⏳ RESTE À FAIRE — Tests (Phase 7)

| Fichier | Tests à écrire | Priorité |
|---|---|---|
| `room.service.spec.ts` | getMyRooms() filtré userId | High |
| `room.service.spec.ts` | Exclusion rooms archived | High |
| `room.service.spec.ts` | leaveRoom() si host → cancel session | High |
| `rooms-list.component.spec.ts` | Affiche list quand non empty | Med |
| `rooms-list.component.spec.ts` | Affiche empty state quand liste vide | Med |
| `rooms-list.component.spec.ts` | Clic tuile → navigation | Med |

---

## Merge Order

1. **fug-backend**: `feat/17.1-backend-m` → `develop` (migrations ✅)
2. **ketal**: `feat/17.1-angular-ui` → `feature/fug-backend-integration` (🔄 prêt pour commit)
3. **Tests**: Phase 7 (⏳ à faire)
4. **Docs**: Mettre à jour story doc → "Done"
