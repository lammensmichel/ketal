# Theming audit — dark mode propagation + header + tokens

Date: 2026-04-13
Origine : items hors-scope identifiés pendant Story 15.6 (lobby UI).

## Contexte

Story 15.6 a introduit `body { background-color: var(--color-bg-primary); }` dans `src/styles.scss` pour que le glassmorphism des cartes lobby/home affiche un fond cohérent. Pendant les vérifications visuelles (MCP chrome-remote light/dark/mobile), trois bugs de theming global ont été observés — hors scope du lobby, à traiter séparément.

## Items à corriger

### 1. `<app-header>` fond blanc en dark mode
- **Fichier** : `src/app/_shared/_components/header/header.component.scss`
- **Symptôme** : le header conserve un fond blanc alors que le body est sombre (`[data-theme="dark"]`), créant une bande blanche contrastante en haut de page.
- **Fix attendu** : remplacer le background hardcodé par `var(--color-bg-surface)` (ou équivalent token) et vérifier que les textes/icônes utilisent `var(--color-text-primary)`.

### 2. `--shadow-glow` token incomplet
- **Fichier** : `src/_design-tokens.scss` (ligne ~156)
- **Symptôme** : déclaration `--shadow-glow: 0 0 0.5rem 0.25rem;` sans couleur — invalide, aucun consommateur ne peut l'utiliser.
- **Fix attendu** : compléter avec une couleur (ex. `rgba(var(--color-accent-primary-rgb), 0.4)`) ou supprimer si inutilisé. Grep `--shadow-glow` avant suppression.

### 3. `data-theme` hardcodé "dark" dans `index.html`
- **Fichier** : `src/index.html`
- **Symptôme** : l'attribut `data-theme="dark"` est écrit en dur sur `<html>`, ce qui force le mode sombre indépendamment de la préférence OS ou d'un toggle utilisateur.
- **Fix attendu** :
  - Retirer l'attribut hardcodé
  - Initialiser `data-theme` côté JS au bootstrap selon `prefers-color-scheme` + éventuel override localStorage
  - Vérifier qu'un toggle thème (s'il existe ou à créer) met à jour `documentElement.dataset.theme`

## Vérif suggérée (par item)
- Screenshots avant/après via MCP chrome-remote dans les 2 modes
- `prefers-color-scheme` émulé via DevTools pour tester init
- `npm run lint` + `npm test`

## Notes

Chacun de ces items peut être une story dédiée ou regroupé en une story "Theming polish" selon l'appréciation du PM. Impact visuel modéré, pas bloquant pour Story 15.6.
