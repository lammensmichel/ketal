# Story 12.4: Synchronize Sips (Gorgées) with Appwrite

**Status**: InProgress
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: High
**Depends On**: Story 12.3

---

## Story

**As a** player
**I want** my sips (given and taken) to be saved to Appwrite
**So that** the final stats are persisted and visible to all players

---

## Context

Les gorgées sont calculées durant les deux phases du jeu:
- Phase 1: Gorgées bues basées sur les prédictions incorrectes
- Phase 2: Gorgées bues/données basées sur les cartes tirées

Ces données doivent être synchronisées vers `KetalPlayer.sipsGiven` et `KetalPlayer.sipsTaken` dans Appwrite.

---

## Acceptance Criteria

1. **AC1**: `addPlayerSip()` met à jour les sips dans Appwrite en mode room
2. **AC2**: `KetalPlayer.sipsTaken` reflète les gorgées bues
3. **AC3**: `KetalPlayer.sipsGiven` reflète les gorgées données
4. **AC4**: Les cartes avec `givenSips` sont synchronisées
5. **AC5**: À la fin du jeu, `MemberService` est appelé pour mettre à jour les stats cumulées

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 2, 3): Modifier `addPlayerSip()` pour Appwrite
  - [ ] Calculer les nouveaux totaux `sipsTaken`/`sipsGiven`
  - [ ] Inclure dans la prochaine sync vers Appwrite

- [ ] **T2** (AC: 4): Synchroniser `givenSips` sur les cartes
  - [ ] Modifier `updatePlayerGivenSipsFromCard()`
  - [ ] S'assurer que `card.givenSips` est inclus dans la sérialisation

- [ ] **T3** (AC: 5): Appeler MemberService à la fin du jeu
  - [ ] Dans `setStatus(2)` (game finished), appeler `memberService.updateStats()`
  - [ ] Passer les totaux par joueur
  - [ ] Incrémenter `totalGamesPlayed`, `totalSipsGiven`, `totalSipsTaken`

- [ ] **T4**: Créer la méthode `finalizeGameStats()`
  - [ ] Calculer les totaux finaux par joueur
  - [ ] Appeler `memberService.updateMemberStats()` pour chaque joueur
  - [ ] Mettre à jour `room.gamesPlayed`

---

## Dev Notes

### Structure des Sips

```typescript
// PlayerModel (local)
sips: {
  drunk: number;  // Gorgées bues
  given: number;  // Gorgées données
}

// KetalPlayer (Appwrite)
sipsTaken: number;  // = drunk
sipsGiven: number;  // = given
```

### Mapping

```typescript
private mapSipsToAppwrite(player: PlayerModel): Partial<KetalPlayer> {
  return {
    sipsTaken: player.sips.drunk,
    sipsGiven: player.sips.given,
  };
}
```

### Finalisation des Stats

```typescript
private async finalizeGameStats(): Promise<void> {
  if (this.gameMode() !== 'room') return;

  const game = this._game();
  const room = this.roomService.currentRoom();
  if (!game || !room) return;

  // Update each member's cumulative stats
  for (const player of game.players) {
    await this.memberService.updateMemberStats(player.id, {
      sipsGiven: player.sips.given,
      sipsTaken: player.sips.drunk,
      gamesPlayed: 1,
    });
  }

  // End the session
  const session = this.ketalSessionService.currentSession();
  if (session) {
    await this.ketalSessionService.endGame(session.$id);
  }
}
```

### Fichiers Concernés

- `src/app/services/game/game.service.ts`
- `src/app/services/member/member.service.ts`
- `src/app/services/ketal-session/ketal-session.service.ts`

---

## Testing

### Unit Tests
- [ ] Test: `addPlayerSip()` synchronise vers Appwrite
- [ ] Test: `sipsTaken` et `sipsGiven` corrects après sync
- [ ] Test: Stats membres mises à jour en fin de partie
- [ ] Test: `givenSips` sur cartes synchronisé

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Story created | SM Bob |
