# Story 14.1: Conditionner le résumé à la création de compte

**Status**: Review
**Epic**: Epic 14: Account & Monetization Gate
**Priority**: Medium
**Depends On**: Story 14.0

---

## Story

**As a** joueur invité (anonyme) qui vient de finir une partie
**I want** qu'on me propose de créer un compte pour voir le résumé de la partie
**So that** je sois incité à m'inscrire pour accéder aux stats et au résumé

---

## Context

Actuellement, le résumé (summary) est un toggle optionnel activable avant la partie, accessible à tous sans condition. L'objectif est de conditionner l'accès au résumé à la possession d'un compte (non-anonyme). Le résumé pourrait devenir une feature payante plus tard, donc l'architecture doit prévoir un système de gating extensible (compte gratuit → abonnement).

### Flow actuel (fin de partie)
```
Game finished (status 2)
       │
       ├── "Recommencer" → resetGame() → /players
       └── "Afficher résumé" → setStatus(3) → GameSummaryComponent
```

### Flow cible
```
Game finished (status 2)
       │
       ├── "Recommencer" → resetGame() → /players
       └── "Afficher résumé"
              │
              ├── [Compte existant] → setStatus(3) → GameSummaryComponent
              └── [Invité/Anonyme] → Modal "Créer un compte"
                     │
                     ├── "Créer mon compte" → /register (avec retour au résumé)
                     ├── "Se connecter" → /login (avec retour au résumé)
                     └── "Plus tard" → ferme le modal, pas de résumé
```

---

## Acceptance Criteria

1. **AC1**: Le bouton "Afficher résumé" vérifie si l'utilisateur a un compte (non-anonyme) avant d'afficher le résumé
2. **AC2**: Si l'utilisateur est anonyme, un modal s'affiche proposant de créer un compte ou de se connecter
3. **AC3**: Après inscription/connexion, l'utilisateur est redirigé vers le résumé de sa partie
4. **AC4**: Le toggle "Mode résumé" avant la partie reste visible pour tous (teaser), mais l'accès effectif est gated
5. **AC5**: En mode local (sans backend), le résumé reste accessible sans compte (fallback offline)

---

## Tasks / Subtasks

- [x] **T1** (AC: 1): Modifier `displaySummary()` dans FooterComponent
  - [x] Vérifier `authService.isAnonymous()` avant d'afficher le résumé
  - [x] Si non-anonyme : comportement actuel (setStatus 3)
  - [x] Si anonyme : ouvrir le modal de création de compte

- [x] **T2** (AC: 2): Créer le composant `AccountGateModalComponent`
  - [x] Modal avec message incitatif ("Crée ton compte pour voir ton résumé !")
  - [x] Bouton "Créer mon compte" → navigation vers `/register`
  - [x] Bouton "Se connecter" → navigation vers `/login`
  - [x] Bouton "Plus tard" → ferme le modal
  - [x] Design cohérent avec le style Ketal existant

- [x] **T3** (AC: 3): Gérer le retour post-inscription vers le résumé
  - [x] Stocker un flag `pendingSummary` dans localStorage ou un signal
  - [x] Après login/register, si `pendingSummary` est true → naviguer vers `/game` et `setStatus(3)`
  - [x] Nettoyer le flag après utilisation

- [x] **T4** (AC: 4): Adapter le toggle résumé
  - [x] Garder le toggle visible pour tous (effet teaser)
  - [ ] Optionnel : ajouter un petit badge/icône "compte requis" à côté du toggle

- [x] **T5** (AC: 5): Gérer le mode local/offline
  - [x] Si `gameMode() === 'local'` ET pas de connexion backend : résumé accessible sans compte
  - [x] Le gate ne s'applique que quand le backend est disponible

---

## Dev Notes

### Détection utilisateur anonyme

```typescript
// AuthService a déjà ce computed :
readonly isAnonymous = computed(() => {
  const user = this._currentUser();
  return user !== null && user.email === '';
});

// Cas à gérer :
// - isAnonymous() === true → gate
// - isLoggedIn() === false → gate (pas de session du tout)
// - isLoggedIn() && !isAnonymous() → accès OK
```

### Architecture extensible pour monétisation future

```typescript
// Aujourd'hui :
canAccessSummary(): boolean {
  return this.authService.isLoggedIn() && !this.authService.isAnonymous();
}

// Demain (payant) :
canAccessSummary(): boolean {
  return this.subscriptionService.hasFeature('summary');
}
```

### Fichiers concernés

- `src/app/_shared/_components/footer/footer.component.ts` (modifier displaySummary)
- `src/app/_shared/_components/footer/footer.component.html` (modal trigger)
- `src/app/_components/auth/account-gate-modal/` (nouveau composant)
- `src/app/_components/auth/login/login.component.ts` (gestion retour post-login)
- `src/app/_components/auth/register/register.component.ts` (gestion retour post-register)
- `src/app/services/auth/auth.service.ts` (helper canAccessSummary)

---

## Testing

### Unit Tests
- [x] Test: Utilisateur connecté (non-anonyme) → résumé affiché directement
- [x] Test: Utilisateur anonyme → modal affiché, pas de résumé
- [x] Test: Pas de session → modal affiché
- [x] Test: Post-inscription → redirection vers résumé
- [x] Test: Mode local sans backend → résumé accessible
- [x] Test: "Plus tard" → modal fermé, retour au jeu

---

## UI/UX Notes

### Modal "Créer un compte"
```
┌─────────────────────────────────────┐
│                                     │
│    🏆  Voir ton résumé de partie    │
│                                     │
│  Crée un compte gratuit pour        │
│  accéder au résumé et garder        │
│  tes stats !                        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    Créer mon compte         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │    J'ai déjà un compte      │    │
│  └─────────────────────────────┘    │
│                                     │
│         Plus tard                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | Claude |
