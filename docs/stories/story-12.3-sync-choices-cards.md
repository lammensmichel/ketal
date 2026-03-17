# Story 12.3: Synchronize Player Choices and Cards with Appwrite

**Status**: InProgress
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: High
**Depends On**: Story 12.2

---

## Story

**As a** player in a multiplayer game
**I want** my card choices and drawn cards to be saved to Appwrite
**So that** other players can see the game progress in real-time

---

## Context

Durant la phase 1 (prédictions), chaque joueur fait des choix (couleur, +/-, in/out, couleur de carte) et reçoit des cartes. Ces données doivent être synchronisées vers Appwrite pour le mode multiplayer.

---

## Acceptance Criteria

1. **AC1**: `setCardChoice()` persiste le choix dans Appwrite en mode room
2. **AC2**: `addCardToPlayer()` persiste la carte dans Appwrite en mode room
3. **AC3**: `pickCard()` met à jour la session avec le nouveau joueur actif
4. **AC4**: La transition de tour/phase est synchronisée
5. **AC5**: Les autres joueurs reçoivent les updates via Realtime

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Modifier `setCardChoice()` pour Appwrite
  - [ ] Après mise à jour locale, appeler `syncPlayerToAppwrite()`
  - [ ] Mettre à jour `KetalPlayer.choices` dans la session

- [ ] **T2** (AC: 2): Modifier `addCardToPlayer()` pour Appwrite
  - [ ] Sérialiser la carte ajoutée
  - [ ] Mettre à jour `KetalPlayer.cards` dans la session

- [ ] **T3** (AC: 3, 4): Modifier `pickCard()` pour synchroniser
  - [ ] Après calcul du prochain joueur/tour/phase
  - [ ] Appeler `ketalSessionService.updateSession()` avec les changements
  - [ ] Inclure: `turn`, `phase`, `activePlayerId`, `players`

- [ ] **T4** (AC: 5): Implémenter la réception des updates Realtime
  - [ ] Dans `subscribeToSessionUpdates()`, mapper les changements vers `_game`
  - [ ] Mettre à jour les joueurs locaux avec les données Appwrite
  - [ ] Déclencher le rafraîchissement UI via le signal

---

## Dev Notes

### Flow de Synchronisation

```
Player fait un choix
       │
       ▼
setCardChoice() ──► Update _game signal
       │
       ▼
pickCard() ──► Draw card, calculate sips
       │
       ▼
addCardToPlayer() ──► Update player.cards
       │
       ▼
saveAndNotify() ──► Si mode room: updateSession()
       │                           │
       ▼                           ▼
localStorage (local)    Appwrite (room)
                               │
                               ▼
                        Realtime broadcast
                               │
                               ▼
                      Other players receive
```

### Méthode de Sync Proposée

```typescript
private async syncToAppwrite(): Promise<void> {
  if (this.gameMode() !== 'room') return;

  const session = this.ketalSessionService.currentSession();
  if (!session) return;

  const game = this._game();
  if (!game) return;

  await this.ketalSessionService.updateSession(session.$id, {
    turn: game.turn,
    phase: this.mapPhaseToAppwrite(game.phase),
    activePlayerId: game.activePlayer?.id ?? null,
    players: this.mapPlayersForAppwrite(game.players),
    status: this.mapStatusToAppwrite(game.status),
  });
}
```

### Sérialisation des Cartes

```typescript
// PlayerModel.cards (local)
cards: CardType[] = [
  { value: 'K', suit: 'hearts', img: '...', sips: 2, selected: false }
]

// KetalPlayer.cards (Appwrite) - stringified
cards: string[] = [
  '{"value":"K","suit":"hearts","img":"...","sips":2,"selected":false}'
]
```

### Fichiers Concernés

- `src/app/services/game/game.service.ts`
- `src/app/services/ketal-session/ketal-session.service.ts`

---

## Testing

### Unit Tests
- [ ] Test: Choix synchronisé vers Appwrite
- [ ] Test: Carte ajoutée synchronisée
- [ ] Test: Transition tour/phase synchronisée
- [ ] Test: Realtime updates mappés correctement

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | SM Bob |
