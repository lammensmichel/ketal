# Story 14.4: Persistance de la checkbox resume en localStorage

**Status**: Done
**Epic**: Epic 14: Account & Monetization Gate
**Priority**: Medium
**Depends On**: -

---

## Story

**As a** joueur qui active ou desactive le mode resume
**I want** que l'etat de la checkbox "Activer le resume" persiste entre les parties et les rechargements de page
**So that** je n'aie pas a la recocher a chaque nouvelle partie

---

## Context

Actuellement, la checkbox "Activer le resume" se reinitialise apres l'arret d'une partie. Le signal `withSummaryMode` dans `GameService` est initialise a `false` et n'est pas persiste en localStorage.

### Comportement actuel
```
// game.service.ts
readonly withSummaryMode = signal<boolean>(false);  // ← toujours false au demarrage

// app.component.ts - checkbox change
onSummaryModeCheckChange(event: Event): void {
  const checkbox = event.target as HTMLInputElement;
  this.gameSrv.withSummaryMode.set(checkbox.checked);  // ← en memoire seulement
}
```

Quand la partie se termine ou est arretee (`resetGame()`), le signal est soit reinitialise, soit la valeur est perdue au rechargement de page.

### Comportement cible
```
// game.service.ts
readonly withSummaryMode = signal<boolean>(
  localStorage.getItem('ketal_summary_mode') === 'true'
);

// Effet pour persister les changements
effect(() => {
  localStorage.setItem('ketal_summary_mode', String(this.withSummaryMode()));
});
```

---

## Acceptance Criteria

1. **AC1**: L'etat de la checkbox resume persiste apres l'arret d'une partie (resetGame)
2. **AC2**: L'etat de la checkbox resume persiste apres un rechargement de page (F5)
3. **AC3**: L'etat de la checkbox resume persiste entre les sessions (fermer/rouvrir le navigateur)
4. **AC4**: La valeur par defaut reste `false` si aucune preference n'est sauvegardee

---

## Tasks / Subtasks

- [x] **T1** (AC: 1, 2, 3, 4): Persister `withSummaryMode` en localStorage
  - [x] Dans `game.service.ts` : initialiser `withSummaryMode` depuis localStorage
  - [x] Ajouter un `effect()` pour sauvegarder en localStorage a chaque changement
  - [x] Utiliser la cle `ketal_summary_mode` (coherent avec les autres cles localStorage du projet)

- [x] **T2** (AC: 1): S'assurer que `resetGame()` ne reinitialise pas `withSummaryMode`
  - [x] Verifier que `resetGame()` dans `game.service.ts` ne touche pas au signal `withSummaryMode`
  - [x] Si c'est le cas, retirer le reset de ce signal

- [x] **T3**: Mettre a jour les tests unitaires
  - [x] Tester l'initialisation depuis localStorage
  - [x] Tester la persistance apres changement
  - [x] Tester la valeur par defaut sans donnee en localStorage
  - [x] Tester que `resetGame()` ne reinitialise pas la preference

---

## Dev Notes

### Fichiers concernes

- `src/app/services/game/game.service.ts` (ligne 78) - Signal `withSummaryMode` et persistance
- `src/app/services/game/game.service.spec.ts` - Tests du signal
- `src/app/app.component.ts` - Aucun changement necessaire (lit deja le signal)

### Implementation proposee

```typescript
// game.service.ts

// Initialisation avec localStorage
readonly withSummaryMode = signal<boolean>(
  localStorage.getItem('ketal_summary_mode') === 'true'
);

constructor() {
  // Persister automatiquement les changements
  effect(() => {
    localStorage.setItem('ketal_summary_mode', String(this.withSummaryMode()));
  });
}
```

### Verification resetGame()

Verifier dans `resetGame()` si `withSummaryMode` est reinitialise. Si oui, retirer cette ligne pour que la preference utilisateur soit preservee independamment de l'etat du jeu.

### Cle localStorage

Le projet utilise deja localStorage pour d'autres donnees (joueurs, partie en cours). La cle `ketal_summary_mode` suit la convention existante avec le prefixe `ketal_`.

---

## Testing

### Unit Tests
- [x] Test: `withSummaryMode` initialise a `false` sans donnee localStorage
- [x] Test: `withSummaryMode` initialise a `true` quand localStorage contient `'true'`
- [x] Test: localStorage mis a jour quand `withSummaryMode` change
- [x] Test: `resetGame()` ne reinitialise pas `withSummaryMode`
- [x] Test: checkbox reflete la valeur persistee au chargement

### Manual Tests
- [x] Cocher la checkbox → arreter la partie → verifier que la checkbox reste cochee
- [x] Cocher la checkbox → recharger la page (F5) → verifier que la checkbox reste cochee
- [x] Decocher la checkbox → recharger la page → verifier que la checkbox reste decochee

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | - |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
