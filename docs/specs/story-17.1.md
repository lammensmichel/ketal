# Story 17.1 - Migration Complete

## Overview
Compléter la migration et les broadcasts manquants pour la gestion des rooms.

## Implementation

### 1. renameRoom-broadcast ✅
**Fichier**: `src/app/services/room/room.service.ts` (lignes 386-391)

La méthode `renameRoom()` émet un événement `'room.renamed'` via RealtimeService pour tous les membres de la room.

```typescript
async renameRoom(roomId: string, newName: string): Promise<GameRoom> {
  const room = await this.updateRoom(roomId, { name: newName });
  this.realtime.broadcastToRoom(roomId, 'room.renamed', { name: newName, roomId });
  return room;
}
```

### 2. leaveRoom-broadcast ✅
**Fichier**: `src/app/services/room/room.service.ts` (lignes 425-498)

La méthode `leaveRoom()` émet plusieurs événements:
- `room.player_left` - pour TOUS les leavers (host et non-host) - émis HORS du if(host)
- `room.host_left` - uniquement quand le host quitte
- `room.host_transferred` - quand le host transfère à un autre joueur

**Bug fix**: `room.player_left` est maintenant émis pour tous les leavers (pas seulement les players).

### 3. startNewSession-implement ✅
**Fichiers**: 
- `src/app/services/room/room.service.ts` (ligne 535)
- `src/app/services/ketal-session/ketal-session.service.ts` (lignes 203-210)

`startGame()` accepte maintenant un paramètre `gamesPlayed` pour calculer le gameNumber:
```typescript
const gameNumber = gamesPlayed + 1;
```

`startNewSession()` dans RoomService passe `room.gamesPlayed` à `startGame()`.

### 4. room-tile-idle-click ✅
**Fichiers**:
- `src/app/_components/room/room-tile/room-tile.component.ts` (lignes 75-89)
- `src/app/_components/room/room-tile/room-tile.component.html` (ligne 32)

Le clic sur une room idle navigue vers `/room/:id` pour TOUS les users (host et player).
Les boutons d'action utilisent `$event.stopPropagation()` pour empêcher la navigation.

## Tests

### 5. room-tile-component ✅
**Fichier**: `src/app/_components/room/room-tile/room-tile.component.spec.ts` (490+ lignes)

Tests pour:
- Navigation idle click pour host
- Navigation idle click pour player
- StopPropagation sur les boutons d'action

### 6. room-service-completeness ✅
**Fichier**: `src/app/services/room/room.service.spec.ts` (1225+ lignes)

Tests pour:
- renameRoom avec broadcast
- leaveRoom (host, player, transfer)
- startNewSession

### 7. member-service-completeness ✅
**Fichier**: `src/app/services/member/member.service.spec.ts` (808+ lignes)

Tests pour:
- getMembersByUserId (query across rooms)
- updateRoom

### 8. home-component-completeness ✅
**Fichier**: `src/app/_components/home/home.component.spec.ts` (137+ lignes)

Tests pour:
- createGame (success, failure, double-click)
- joinGame navigation
- userName computed
- welcome header

### 9. app-component-routing ✅
**Fichier**: `src/app/app.component.spec.ts` (369+ lignes)

Tests pour:
- isPlayersPage (routing post-login)
- canShowSummary (auth status)

## Test Results
- Total: 1083 tests
- Passed: 1083 ✅
- Failed: 0
- Skipped: 5

## Commits
- 35c963b - Restore broadcasts + cancelSession + FIRE patches
- 75471d4 - idle-click navigation for all users
- fcd9ff9 - Break circular dependency (RoomService ↔ KetalSessionService)
- cd3bb04 - Realtime integration test fixes

## Branches
- feat/17.1-migration-complete (main)
- feat/17.1-angular-ui
- feat/17.1-backend-migrations

## Status
✅ Complete - All work items implemented and tested
