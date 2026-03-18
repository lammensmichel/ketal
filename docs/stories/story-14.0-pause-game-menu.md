# Story 14.0: Pause & retour menu sans perdre la partie

**Status**: Done
**Epic**: Epic 14: Account & Monetization Gate
**Priority**: High
**Depends On**: -

---

## Story

**As a** joueur en pleine partie
**I want** pouvoir quitter vers le menu principal sans perdre ma partie en cours
**So that** je puisse créer un compte, changer de page ou faire une pause, puis reprendre là où j'en étais

---

## Context

Actuellement, le seul moyen de quitter une partie est le bouton "Arrêter la partie en cours" dans le header, qui appelle `resetGame()` et **efface tout** : sips, cartes, choix, phase → retour à zéro sur `/players`.

C'est un prérequis pour la story 14.1 (gate résumé/compte) : quand on propose à un joueur anonyme de créer un compte en fin de partie, il doit pouvoir aller sur `/register` sans perdre ses données de jeu.

### Comportement actuel
```
Header: "Arrêter la partie en cours"
  → resetGame() : RAZ complète (sips=0, cards=[], status=0)
  → navigate('/players')
  → Partie perdue définitivement
```

### Comportement cible
```
Header: "Arrêter la partie en cours" → RENOMMÉ "Quitter la partie"
  → Confirmation dialog : "Quitter définitivement ?"
    ├── "Quitter" → resetGame() (comportement actuel)
    └── "Annuler" → reste dans le jeu

Header (nouveau): "Menu" ou icône retour
  → navigate('/players') SANS resetGame()
  → La partie reste en localStorage/signal
  → Bandeau "Partie en cours" sur /players pour reprendre

Footer (sur /players quand partie en cours):
  → "Reprendre la partie" → navigate('/game')
```

---

## Acceptance Criteria

1. **AC1**: Un bouton "Menu" (ou icône home) permet de retourner au menu `/players` sans effacer la partie
2. **AC2**: La partie en cours est conservée en mémoire (signal `_game`) et localStorage
3. **AC3**: Sur la page `/players`, un bandeau/bouton "Reprendre la partie" permet de revenir au jeu
4. **AC4**: Le bouton "Arrêter la partie" demande une confirmation avant de tout effacer
5. **AC5**: Naviguer vers `/login` ou `/register` pendant une partie ne la supprime pas

---

## Tasks / Subtasks

- [x] **T1** (AC: 1, 2): Ajouter un bouton retour menu dans le header
  - [x] Nouvelle icône/bouton "Menu" à côté de "Arrêter la partie"
  - [x] Navigue vers `/players` sans appeler `resetGame()`
  - [x] La partie reste dans le signal `_game` et localStorage

- [x] **T2** (AC: 4): Ajouter une confirmation sur "Arrêter la partie"
  - [x] Renommer en "Quitter la partie" (plus clair)
  - [x] Dialog de confirmation avant `resetGame()`
  - [x] "Annuler" → retour au jeu

- [x] **T3** (AC: 3): Bandeau "Partie en cours" sur `/players`
  - [x] Détecter `gameSrv.isGameStarted() || gameSrv.isGameFinished()`
  - [x] Afficher un bandeau en haut : "Partie en cours - Reprendre"
  - [x] Click → `router.navigate(['/game'])`

- [x] **T4** (AC: 5): S'assurer que les routes auth ne suppriment pas la partie
  - [x] Vérifier que `navigateAfterLogin()` dans LoginComponent respecte la partie en cours
  - [x] Vérifier que RegisterComponent ne fait pas de `resetGame()`

---

## Dev Notes

### Header actuel (header.component.ts)
```typescript
restartGame(): void {
  this.gameSrv.resetGame();  // ← EFFACE TOUT
  this.router.navigate(['/players']);
}
```

### Nouveau flow proposé
```typescript
// Retour menu (conserve la partie)
goToMenu(): void {
  this.router.navigate(['/players']);
}

// Quitter définitivement (avec confirmation)
quitGame(): void {
  // La confirmation sera gérée côté template (dialog)
  this.gameSrv.resetGame();
  this.router.navigate(['/players']);
}
```

### Fichiers concernés

- `src/app/_shared/_components/header/header.component.ts` (modifier)
- `src/app/_shared/_components/header/header.component.html` (modifier)
- `src/app/_shared/_components/footer/footer.component.html` (bandeau reprise)
- `src/app/_components/players/players-list/players-list.component.html` (bandeau reprise)
- `src/assets/i18n/fr.json` (traductions)

---

## Testing

### Unit Tests
- [ ] Test: "Menu" navigue vers `/players` sans appeler `resetGame()`
- [ ] Test: "Quitter la partie" appelle `resetGame()` après confirmation
- [ ] Test: Bandeau "Reprendre" affiché quand partie en cours
- [ ] Test: Bandeau non affiché quand pas de partie
- [ ] Test: Navigation vers `/login` ne supprime pas la partie

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | Claude |
| 2026-03-19 | 2.0 | Implemented pause/resume game, PR #44 | Dev |
