# UI Fixes and Auth Routing Improvements

**Date**: 2026-01-24
**Status**: Terminé

## Contexte

Session de debug et corrections UI sur l'application Ketal.

## Corrections effectuées

### 1. Modal z-index (DONE)
- **Fichier**: `src/app/_components/players/player-given-sips-selection/player-given-sips-selection.component.scss`
- **Problème**: Les cartes des joueurs apparaissaient au-dessus de la modal de distribution de gorgées
- **Fix**: Ajout de `z-index: 5000` sur la classe `.modal`

### 2. Cacher le checkbox "Activer le résumé" sur les pages auth (DONE)
- **Fichiers**:
  - `src/app/app.component.ts` - Ajout de `isAuthPage()` utilisant `window.location.pathname`
  - `src/app/app.component.html` - Ajout condition `!isAuthPage()`
- **Problème**: Le checkbox était visible sur la page login
- **Fix**: Vérifie si la route est `/login`, `/register`, ou `/forgot-password`

### 3. Cacher le bouton "Se connecter" sur les pages auth (DONE)
- **Fichiers**:
  - `src/app/_shared/_components/user-menu/user-menu.component.ts` - Signal réactif `isAuthPage` avec `toSignal` et `NavigationEnd`
  - `src/app/_shared/_components/user-menu/user-menu.component.html` - Logique conditionnelle corrigée
- **Problème**: Le bouton "Se connecter" était visible même sur la page login
- **Fix**:
  - Utilise un signal réactif qui écoute les événements de navigation
  - Logique template: `@if (isLoggedIn())` → menu utilisateur, `@else if (!isAuthPage())` → bouton login, sinon rien

### 4. Scrollbar sur la page login (DONE)
- **Fichier**: `src/app/_components/auth/login/login.component.scss`
- **Problème**: Une scrollbar apparaissait sur la page login
- **Fix**: Changé `.login-container` de `min-height: calc(100vh - 120px)` à `align-items: flex-start` sans min-height

### 5. Page de login comme page par défaut (DONE)
- **Fichier**: `src/app/app-routing.module.ts`
- **Problème**: La route `/` redirige vers `/players` au lieu de `/login`
- **Fix**: Changé `{ path: '', redirectTo: 'login', pathMatch: 'full' }`

### 6. Comportement bizarre du bouton "Se connecter" (RÉSOLU)
- **Observation initiale**: Quand on cliquait sur "Se connecter" depuis `/players`, un "?" apparaissait
- **Cause**: La logique template `@else` affichait le menu utilisateur (avec "?") même sans utilisateur connecté sur les pages auth
- **Fix**: Corrigé la logique pour n'afficher rien si non connecté ET sur page auth

## Tests effectués

1. [x] Vérifier que la page login est la page par défaut - ✅
2. [x] Vérifier que le bouton "Se connecter" n'apparaît pas sur /login - ✅
3. [x] Vérifier que le bouton "Se connecter" apparaît sur /players - ✅
4. [x] Vérifier que le clic sur "Se connecter" navigue vers /login et le bouton disparaît - ✅
5. [x] Vérifier qu'il n'y a pas de scrollbar sur la page login - ✅

## Fichiers modifiés cette session

- `src/app/_components/players/player-given-sips-selection/player-given-sips-selection.component.scss`
- `src/app/app.component.ts`
- `src/app/app.component.html`
- `src/app/_shared/_components/user-menu/user-menu.component.ts`
- `src/app/_shared/_components/user-menu/user-menu.component.html`
- `src/app/_components/auth/login/login.component.scss`
- `src/app/app-routing.module.ts`
