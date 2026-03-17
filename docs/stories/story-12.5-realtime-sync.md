# Story 12.5: Implement Realtime Synchronization for Multiplayer

**Status**: InProgress
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: High
**Depends On**: Story 12.3, Story 12.4

---

## Story

**As a** player in a multiplayer room
**I want** to see other players' actions in real-time
**So that** the game feels responsive and synchronized across all devices

---

## Context

Appwrite Realtime permet de recevoir des notifications quand les documents changent. Le GameService doit s'abonner aux changements de la KetalSession et mettre à jour l'état local automatiquement.

---

## Acceptance Criteria

1. **AC1**: GameService s'abonne aux updates de la session active
2. **AC2**: Les changements de tour/phase sont reflétés immédiatement
3. **AC3**: Les choix des autres joueurs sont visibles en temps réel
4. **AC4**: Les cartes tirées par les autres joueurs apparaissent
5. **AC5**: La déconnexion/reconnexion gère correctement l'état
6. **AC6**: L'abonnement est nettoyé quand le jeu se termine ou la room est quittée

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 6): Gérer l'abonnement Realtime dans GameService
  - [ ] Créer `subscribeToSessionUpdates(sessionId: string)`
  - [ ] Stocker l'ID d'abonnement pour cleanup
  - [ ] Créer `unsubscribeFromSession()`
  - [ ] Appeler unsubscribe dans `resetGame()` et lors du leave room

- [ ] **T2** (AC: 2, 3, 4): Mapper les updates Realtime vers l'état local
  - [ ] Créer `handleSessionUpdate(session: KetalSession)`
  - [ ] Convertir `KetalSession` → `Game`
  - [ ] Mettre à jour `_game` signal
  - [ ] Gérer les updates partielles vs complètes

- [ ] **T3** (AC: 5): Gérer la reconnexion
  - [ ] Si déconnexion détectée, tenter de resync
  - [ ] Récupérer l'état complet de la session via API
  - [ ] Ré-abonner aux updates

- [ ] **T4**: Éviter les conflits de sync
  - [ ] Implémenter un flag `_isSyncing` pour éviter les boucles
  - [ ] Ne pas re-sauvegarder les données reçues en Realtime
  - [ ] Utiliser des timestamps ou versions si nécessaire

---

## Dev Notes

### Architecture Realtime

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Player 1      │     │    Appwrite     │     │   Player 2      │
│  (GameService)  │     │   (Realtime)    │     │  (GameService)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  updateSession()      │                       │
         │──────────────────────►│                       │
         │                       │  broadcast update     │
         │                       │──────────────────────►│
         │                       │                       │
         │◄──────────────────────│  broadcast update     │
         │   (own update)        │                       │
         │                       │                       │
```

### Implémentation Proposée

```typescript
private sessionSubscriptionId: string | null = null;
private _isSyncing = signal(false);

subscribeToSessionUpdates(sessionId: string): void {
  // Cleanup existing subscription
  this.unsubscribeFromSession();

  this.sessionSubscriptionId = this.ketalSessionService.subscribeToSession(
    sessionId,
    (updatedSession) => this.handleSessionUpdate(updatedSession)
  );
}

private handleSessionUpdate(session: KetalSession): void {
  // Avoid sync loops
  if (this._isSyncing()) return;

  const game = this.mapSessionToGame(session);
  this._game.set(game);
}

unsubscribeFromSession(): void {
  if (this.sessionSubscriptionId) {
    this.ketalSessionService.unsubscribe();
    this.sessionSubscriptionId = null;
  }
}
```

### Mapper KetalSession → Game

```typescript
private mapSessionToGame(session: KetalSession): Game {
  return {
    players: session.players.map(p => this.mapKetalPlayerToPlayerModel(p)),
    maxTurnCount: session.players.length * 4,
    turn: session.turn,
    phase: this.mapPhaseFromAppwrite(session.phase),
    drinkingCards: this.deserializeCards(session.drinkingCards),
    givingCards: this.deserializeCards(session.givingCards),
    activePlayer: this.findActivePlayer(session),
    status: this.mapStatusFromAppwrite(session.status),
    summary: session.withSummary,
  };
}
```

### Fichiers Concernés

- `src/app/services/game/game.service.ts`
- `src/app/services/ketal-session/ketal-session.service.ts`
- `src/app/services/realtime/realtime.service.ts`

---

## Testing

### Unit Tests
- [ ] Test: Subscription créée au début du jeu en mode room
- [ ] Test: Updates Realtime mappés correctement vers Game
- [ ] Test: Pas de sync loop (update reçu ne déclenche pas re-save)
- [ ] Test: Cleanup de subscription en fin de jeu

### Integration Tests
- [ ] Test: Deux instances reçoivent les updates mutuellement
- [ ] Test: Reconnexion après perte de connexion

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | SM Bob |
