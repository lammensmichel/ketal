# Story 12.2: Connect Game Start to KetalSessionService

**Status**: InProgress
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: High
**Depends On**: Story 12.1

---

## Story

**As a** player in a room
**I want** the game to create a KetalSession in Appwrite when starting
**So that** all players in the room can see the game state in real-time

---

## Context

Quand `beginGame()` est appelé en mode room, une session Ketal doit être créée dans Appwrite. Cela permet la synchronisation entre les joueurs de la room.

---

## Acceptance Criteria

1. **AC1**: `beginGame()` crée une KetalSession via KetalSessionService en mode room
2. **AC2**: La room est mise à jour avec `currentSessionId` et `status: 'playing'`
3. **AC3**: Les joueurs sont convertis de `PlayerModel[]` à `KetalPlayer[]`
4. **AC4**: Le deck de cartes est initialisé dans la session
5. **AC5**: En mode local, le comportement actuel est préservé

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 5): Modifier `beginGame()` pour dual-mode
  - [ ] Vérifier `gameMode()` au début
  - [ ] Si 'room': appeler `startGameInRoom()`
  - [ ] Si 'local': conserver le comportement actuel

- [ ] **T2** (AC: 3): Créer le mapper PlayerModel → KetalPlayer
  - [ ] Convertir `PlayerModel.id` → `KetalPlayer.memberId`
  - [ ] Convertir `PlayerModel.name` → `KetalPlayer.displayName`
  - [ ] Convertir `PlayerModel.cards` → `KetalPlayer.cards` (sérialisé)
  - [ ] Initialiser `sipsGiven`, `sipsTaken`, `order`, `isReady`

- [ ] **T3** (AC: 1, 2, 4): Implémenter `startGameInRoom()`
  - [ ] Récupérer `roomId` de `roomService.currentRoom()`
  - [ ] Mapper les joueurs vers `KetalPlayer[]`
  - [ ] Appeler `ketalSessionService.startGame(roomId, players, withSummary)`
  - [ ] Souscrire aux updates realtime de la session

- [ ] **T4** (AC: 2): S'assurer que la room est mise à jour
  - [ ] Vérifier que `KetalSessionService.startGame()` met à jour la room
  - [ ] Room.currentSessionId = session.$id
  - [ ] Room.status = 'playing'

---

## Dev Notes

### Code Actuel

```typescript
beginGame(withSummaryMode = false): void {
  this.cardDeckHelperService.constructDeck();
  const players: PlayerModel[] = JSON.parse(this.localSrv.getData('players'));

  const newGame: Game = {
    players: players,
    maxTurnCount: players.length * 4,
    turn: 1,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: players[0],
    status: 1,
    summary: withSummaryMode,
  };

  this.saveAndNotify(newGame);
}
```

### Code Cible

```typescript
async beginGame(withSummaryMode = false): Promise<void> {
  this.cardDeckHelperService.constructDeck();

  if (this.gameMode() === 'room') {
    await this.startGameInRoom(withSummaryMode);
  } else {
    this.startGameLocally(withSummaryMode);
  }
}

private async startGameInRoom(withSummary: boolean): Promise<void> {
  const room = this.roomService.currentRoom();
  if (!room) return;

  const players = this.mapPlayersToKetalPlayers();
  const session = await this.ketalSessionService.startGame(
    room.$id,
    players,
    withSummary
  );

  // Subscribe to realtime updates
  this.subscribeToSessionUpdates(session.$id);

  // Convert session to local Game format
  const game = this.mapSessionToGame(session);
  this._game.set(game);
}
```

### PlayerModel → KetalPlayer Mapping

```typescript
private mapPlayersToKetalPlayers(): KetalPlayer[] {
  const players: PlayerModel[] = JSON.parse(this.localSrv.getData('players'));
  return players.map((p, index) => ({
    memberId: p.id,
    displayName: p.name,
    order: index + 1,
    cards: [],
    choices: { color: '', plus_or_minus: '', in_out: '', suit: '' },
    sipsGiven: 0,
    sipsTaken: 0,
    isReady: true,
  }));
}
```

### Fichiers Concernés

- `src/app/services/game/game.service.ts` (modifier)
- `src/app/_shared/_components/footer/footer.component.ts` (vérifier compatibilité async)

---

## Testing

### Unit Tests
- [ ] Test: `beginGame()` en mode local préserve le comportement
- [ ] Test: `beginGame()` en mode room crée une KetalSession
- [ ] Test: Mapping PlayerModel → KetalPlayer correct
- [ ] Test: Room mise à jour avec sessionId

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | SM Bob |
