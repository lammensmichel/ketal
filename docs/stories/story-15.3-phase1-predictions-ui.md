# Story 15.3: UI Phase 1 Prédictions

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur en phase de prédiction (Phase 1)
**I want** des boutons de choix animés, des révélations de cartes en flip 3D et des transitions fluides entre les tours
**So that** la phase de prédiction soit engageante et ludique au lieu d'être une simple sélection de boutons

---

## Context

La Phase 1 actuelle est fonctionnelle mais visuellement terne. Les boutons de choix sont des boutons Bootstrap standards, il n'y a pas d'animation de révélation de carte, et le passage d'un tour à l'autre est instantané sans transition.

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Boutons de choix | Boutons Bootstrap basiques, aucun feedback visuel à la sélection |
| Révélation de carte | La carte apparaît instantanément, pas de suspense |
| Transitions entre tours | Passage abrupt d'un tour au suivant |
| Stepper de progression | Indicateur de tour basique sans style |
| Touch targets | Boutons parfois trop petits sur mobile |

### Vision du redesign

La phase de prédiction doit créer du suspense : boutons qui réagissent au toucher avec des effets visuels, carte qui se retourne en 3D après la prédiction, et transitions fluides entre chaque tour pour rythmer le jeu.

### Les 4 tours de prédiction

1. **Couleur** : Rouge ou Noir
2. **Plus ou Moins** : Plus haut ou plus bas que la carte précédente
3. **Intérieur ou Extérieur** : Entre les 2 premières cartes ou en dehors
4. **Couleur de carte** : Pique, Coeur, Carreau, Trèfle

---

## Acceptance Criteria

1. **AC1**: Les boutons de choix s'animent à la sélection (scale up + changement de couleur/glow) avec un feedback visuel immédiat utilisant les design tokens
2. **AC2**: Après la prédiction, la carte se révèle avec une animation flip 3D (CSS transform rotateY, 300-400ms)
3. **AC3**: Les transitions entre les tours (1→2→3→4) sont animées avec un slide ou fade fluide
4. **AC4**: Le stepper de progression est redesigné avec les design tokens : étape active en glow, étapes complétées marquées, étapes futures grisées
5. **AC5**: Tous les touch targets font au minimum 48px de hauteur/largeur sur mobile pour respecter les guidelines d'accessibilité
6. **AC6**: Les animations respectent `prefers-reduced-motion` et sont performantes (GPU-accelerated, 60fps)

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Boutons de choix animés
  - [ ] Tour 1 (Couleur) : deux boutons rouge/noir avec icônes de couleur, animation scale+glow à la sélection
  - [ ] Tour 2 (Plus/Moins) : boutons avec flèches haut/bas, animation directionnelle
  - [ ] Tour 3 (In/Out) : boutons avec icônes représentant intérieur/extérieur
  - [ ] Tour 4 (Couleur carte) : 4 boutons avec icônes des couleurs (♠ ♥ ♦ ♣), glow de la couleur correspondante
  - [ ] État sélectionné : border glow + scale(1.05) + couleur d'accentuation
  - [ ] État désactivé après sélection : les non-sélectionnés fade out

- [ ] **T2** (AC: 2): Animation flip 3D de révélation
  - [ ] Implémenter le flip 3D CSS (`perspective`, `rotateY(180deg)`, `backface-visibility`)
  - [ ] Dos de carte stylisé (gradient, motif) côté face cachée
  - [ ] Face de la carte avec la valeur et la couleur côté révélé
  - [ ] Timing : flip déclenché après la sélection du choix, durée 300-400ms
  - [ ] Résultat : indication visuelle correct (vert/glow) ou incorrect (rouge/shake)

- [ ] **T3** (AC: 3): Transitions entre les tours
  - [ ] Animation slide-out du tour actuel (vers la gauche) et slide-in du tour suivant (depuis la droite)
  - [ ] Alternative : fade-out/fade-in avec léger translateY
  - [ ] Délai de transition suffisant pour voir le résultat du flip avant de passer au tour suivant (~1s)
  - [ ] Animation de transition entre Phase 1 et Phase 2

- [ ] **T4** (AC: 4): Redesign du stepper de progression
  - [ ] 4 étapes visuelles représentant les 4 tours
  - [ ] Étape active : glow avec `--color-accent-primary`, icône du type de tour
  - [ ] Étapes complétées : checkmark, couleur `--color-success`
  - [ ] Étapes futures : grisées avec `--color-text-muted`
  - [ ] Ligne de connexion entre les étapes avec progression animée
  - [ ] Labels sous les étapes : "Couleur", "±", "In/Out", "Couleur"

- [ ] **T5** (AC: 5): Touch targets mobile
  - [ ] Tous les boutons de choix : min-height et min-width de 48px
  - [ ] Espacement suffisant entre les boutons (min 8px gap)
  - [ ] Zone de tap élargie via padding sans changer la taille visuelle si nécessaire
  - [ ] Tester sur viewports mobile (375px, 390px, 414px)

- [ ] **T6** (AC: 6): Performance et accessibilité
  - [ ] Utiliser `will-change: transform` et `transform` pour les animations GPU
  - [ ] Respecter `prefers-reduced-motion` : désactiver les animations, afficher les cartes directement
  - [ ] ARIA labels sur les boutons de choix pour l'accessibilité
  - [ ] Tester les performances sur mobile (60fps)

---

## Dev Notes

### Bouton de choix animé

```scss
.choice-btn {
  min-height: 48px;
  min-width: 48px;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
  border: 2px solid transparent;
  transition: all var(--animation-normal) var(--ease-spring);
  cursor: pointer;

  &:active {
    transform: scale(0.95);
  }

  &.selected {
    border-color: var(--color-accent-primary);
    box-shadow: 0 0 20px rgba(var(--color-accent-primary-rgb), 0.4);
    transform: scale(1.05);
  }

  &.not-selected {
    opacity: 0.4;
    pointer-events: none;
  }
}
```

### Animation flip 3D

```scss
.prediction-card {
  perspective: 1000px;
  width: 120px;
  height: 168px;

  .card-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform var(--animation-normal) var(--ease-in-out);
    transform-style: preserve-3d;

    &.revealed {
      transform: rotateY(180deg);
    }
  }

  .card-front, .card-back {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    border-radius: var(--radius-md);
  }

  .card-back {
    background: linear-gradient(135deg, var(--color-bg-elevated), var(--color-accent-primary));
  }

  .card-front {
    transform: rotateY(180deg);
    background: var(--color-bg-surface);
  }
}
```

### Transition entre tours

```scss
.turn-container {
  &.slide-out {
    animation: slideOut var(--animation-normal) var(--ease-in-out) forwards;
  }

  &.slide-in {
    animation: slideIn var(--animation-normal) var(--ease-in-out) forwards;
  }
}

@keyframes slideOut {
  to { transform: translateX(-100%); opacity: 0; }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

### Fichiers concernés

- `src/app/_components/game/game.component.html` (template Phase 1)
- `src/app/_components/game/game.component.scss` (styles boutons, animations)
- `src/app/_components/game/game.component.ts` (logique animation, état des tours)
- `src/app/_shared/_components/playing-card/playing-card.component.*` (animation flip)
- `src/app/_shared/_components/header/header.component.*` (stepper de progression)

### Dépendances techniques

- Design tokens de Story 15.1
- Aucune librairie externe (CSS animations natives)

---

## Testing

### Unit Tests
- [ ] Test: Les boutons de choix rendent les bonnes options pour chaque tour
- [ ] Test: La sélection d'un bouton applique la classe `.selected` et fade les autres
- [ ] Test: L'animation flip toggle la classe `.revealed` après sélection
- [ ] Test: Le stepper marque les tours complétés et highlight le tour actif
- [ ] Test: Les touch targets ont une taille minimale de 48px

### Visual Tests (MCP)
- [ ] Test: Boutons de choix du tour 1 (rouge/noir) sur mobile (375px)
- [ ] Test: Boutons de choix du tour 4 (4 couleurs) sur mobile (375px)
- [ ] Test: Animation flip visible sur la carte de prédiction
- [ ] Test: Stepper de progression avec étapes colorées
- [ ] Test: Transition entre tour 1 et tour 2 fluide

### Manual Tests
- [ ] Jouer les 4 tours de prédiction et vérifier chaque animation
- [ ] Vérifier le timing du flip (300-400ms, pas trop rapide, pas trop lent)
- [ ] Tester avec `prefers-reduced-motion: reduce` activé
- [ ] Vérifier les touch targets sur mobile réel (pas de misclick)
- [ ] Vérifier la transition Phase 1 → Phase 2

---

## Already Implemented in Story 15.2

The following items from this story were already implemented as part of Story 15.2 (Player Cards Redesign):

- **Prediction buttons redesigned**: gradient red/black for color, arrow buttons for higher/lower, card-based buttons for in/out, suit symbol buttons
- **Prediction panel uses dark theme** (`--color-bg-elevated`) matching player cards
- **Reference card shown in dashed callout** for higher/lower turn
- **Mobile: avatar hidden in prediction panel** (redundant with active player card above)
- **Mobile: prediction panel goes edge-to-edge** without border-radius

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
