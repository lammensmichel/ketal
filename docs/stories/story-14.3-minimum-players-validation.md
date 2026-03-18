# Story 14.3: Validation minimum 2 joueurs pour lancer une partie

**Status**: Done
**Epic**: Epic 14: Account & Monetization Gate
**Priority**: High
**Depends On**: -

---

## Story

**As a** joueur sur l'ecran des joueurs
**I want** que le bouton "Debuter la Grosse Guinze" ne soit visible qu'avec 2 joueurs ou plus
**So that** je ne puisse pas lancer une partie solo, ce qui n'a pas de sens pour un jeu a boire multijoueur

---

## Context

Actuellement, le bouton "Debuter la Grosse Guinze" apparait des qu'il y a au moins 1 joueur. Or le jeu necessite au minimum 2 joueurs pour fonctionner (predictions, distribution de gorgees entre joueurs, etc.).

### Comportement actuel
```
hasPlayers(): boolean {
  return this.playerHelper?.getPlayers()?.length > 0;  // ← 1 joueur suffit
}

<!-- Template -->
@if (hasPlayers() && gameSrv.isNewGame()) {
  <!-- Bouton "Debuter la Grosse Guinze" visible avec 1 seul joueur -->
}
```

### Comportement cible
```
hasEnoughPlayers(): boolean {
  return this.playerHelper?.getPlayers()?.length > 1;  // ← minimum 2 joueurs
}

<!-- Template -->
@if (hasEnoughPlayers() && gameSrv.isNewGame()) {
  <!-- Bouton visible uniquement avec 2+ joueurs -->
}
```

---

## Acceptance Criteria

1. **AC1**: Le bouton "Debuter la Grosse Guinze" est cache quand il y a 0 joueur
2. **AC2**: Le bouton "Debuter la Grosse Guinze" est cache quand il y a 1 seul joueur
3. **AC3**: Le bouton "Debuter la Grosse Guinze" est visible quand il y a 2 joueurs ou plus
4. **AC4**: Le toggle resume reste cache avec 1 seul joueur (comportement existant preservee)

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 2, 3): Modifier la validation du nombre de joueurs
  - [ ] Dans `footer.component.ts` : renommer `hasPlayers()` en `hasEnoughPlayers()` ou modifier la condition pour verifier `length > 1`
  - [ ] Dans `footer.component.html` ligne 177 : mettre a jour la reference vers la nouvelle methode

- [ ] **T2** (AC: 4): Verifier la coherence avec le toggle resume
  - [ ] S'assurer que le toggle resume reste aussi conditionne a 2+ joueurs (deja le cas via `playerSrv.getPlayerNumber() > 1` dans `app.component.ts`)

- [ ] **T3**: Mettre a jour les tests unitaires
  - [ ] Mettre a jour les tests existants de `hasPlayers()` dans `footer.component.spec.ts`
  - [ ] Ajouter un test pour le cas 1 joueur (bouton cache)
  - [ ] Ajouter un test pour le cas 2 joueurs (bouton visible)

---

## Dev Notes

### Fichiers concernes

- `src/app/_shared/_components/footer/footer.component.ts` (ligne 106-107) - Modifier la methode `hasPlayers()`
- `src/app/_shared/_components/footer/footer.component.html` (ligne 177) - Mettre a jour la reference `@if`
- `src/app/_shared/_components/footer/footer.component.spec.ts` - Mettre a jour les tests

### Fix propose

Option A : Modifier `hasPlayers()` directement
```typescript
hasPlayers(): boolean {
  return this.playerHelper?.getPlayers()?.length > 1;
}
```

Option B : Creer une methode plus explicite (recommandee)
```typescript
hasEnoughPlayers(): boolean {
  return this.playerHelper?.getPlayers()?.length > 1;
}
```

Si option B, mettre a jour le template :
```html
@if (hasEnoughPlayers() && gameSrv.isNewGame()) {
```

### Impact

- Fix isole dans le footer component
- Pas d'impact sur le game service ou la logique de jeu
- Le toggle resume dans `app.component.ts` a deja la bonne logique (`playerSrv.getPlayerNumber() > 1`)

---

## Testing

### Unit Tests
- [ ] Test: bouton cache avec 0 joueur
- [ ] Test: bouton cache avec 1 joueur
- [ ] Test: bouton visible avec 2 joueurs
- [ ] Test: bouton visible avec 3+ joueurs
- [ ] Test: toggle resume cache avec 1 joueur

### Manual Tests
- [ ] Ajouter 1 joueur → verifier que le bouton n'apparait pas
- [ ] Ajouter un 2e joueur → verifier que le bouton apparait
- [ ] Supprimer un joueur (retour a 1) → verifier que le bouton disparait

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | Claude |
