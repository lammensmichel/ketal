# Story 15.4: Refonte Phase 2 Distribution

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur en phase de distribution (Phase 2)
**I want** une interface de jeu immersive avec un layout pyramide, des animations de cartes et des feedbacks visuels fun
**So that** la phase de distribution soit excitante et ressemble à un vrai jeu de cartes à boire entre amis

---

## Context

La Phase 2 actuelle est fonctionnelle mais visuellement plate et sans énergie de jeu :

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Header "Phase 2: Distribution" | Texte plat, compteurs "Boire 0/6 / Donner 0/6" ressemblent à un tableau Excel |
| 12 cartes en bas | Alignées en ligne plate (6 "Tu bois" + 6 "Tu donnes"), aucune hiérarchie visuelle, pas de sensation de pyramide |
| Bouton "Tu bois" / "Tu donnes" | Simple texte sans distinction visuelle ni excitation |
| Modal de distribution ("Bob donne 1 gorgées") | Fonctionnel mais moche, popup basique sans fun |
| Cartes des joueurs | 4 cartes côte à côte sans différenciation visuelle, pas de mise en avant des matchs |
| Révélation des cartes | Pas d'animation de retournement, la carte apparaît simplement |

### Vision du redesign

La Phase 2 doit ressembler à une vraie table de jeu de cartes à boire, avec une pyramide centrale, des animations de retournement, et des réactions visuelles à chaque match.

---

## Acceptance Criteria

1. **AC1**: Les 12 cartes sont disposées en layout pyramide/escalier (ex: rangées de 1-2-3-3-2-1 ou 6+6 en escalier) au lieu d'une ligne plate
2. **AC2**: Chaque carte se retourne avec une animation 3D flip (CSS transform) lors de la révélation
3. **AC3**: Les cartes "Tu bois" ont un tint/glow rouge distinct et les cartes "Tu donnes" ont un tint/glow vert/or
4. **AC4**: Le compteur de gorgées s'anime (bounce/shake) à chaque ajout de gorgée
5. **AC5**: La modal de distribution des gorgées est redesignée avec un UX quick-tap (sélection rapide du joueur cible)
6. **AC6**: Quand un joueur matche une carte, un feedback visuel clair montre quelle carte a matché (highlight, pulse, connexion visuelle)
7. **AC7**: Les cartes sont thumb-reachable sur mobile (zone basse de l'écran, touch targets min 48px)
8. **AC8**: Les animations sont performantes (GPU-accelerated, 60fps) et respectent `prefers-reduced-motion`

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 7): Layout pyramide des cartes
  - [ ] Concevoir le layout pyramide CSS Grid/Flexbox pour les 12 cartes
  - [ ] Rangée du haut : cartes plus petites, rangée du bas : cartes plus grandes (hiérarchie visuelle)
  - [ ] Séparer visuellement la zone "Tu bois" (haut, teinté rouge) et "Tu donnes" (bas, teinté vert/or)
  - [ ] Adapter le layout pour mobile (cartes empilées, scroll ou swipe si nécessaire)
  - [ ] Positionner les cartes dans la zone thumb-reachable (moitié basse de l'écran)

- [ ] **T2** (AC: 2): Animation de retournement des cartes
  - [ ] Implémenter le flip 3D CSS (`transform: rotateY(180deg)`, `perspective`, `backface-visibility`)
  - [ ] Dos de carte stylisé (motif, gradient, logo Ketal)
  - [ ] Animation de retournement fluide (300-400ms, ease-in-out)
  - [ ] Ajouter un léger delay entre les cartes si plusieurs sont révélées

- [ ] **T3** (AC: 3): Distinction visuelle boire vs donner
  - [ ] Cartes "Tu bois" : border/glow rouge, background-tint rouge subtil, icône verre
  - [ ] Cartes "Tu donnes" : border/glow vert/or, background-tint doré, icône main qui donne
  - [ ] Animation de transition quand la carte passe de face cachée à révélée avec la bonne couleur
  - [ ] Labels "Tu bois" / "Tu donnes" stylisés avec les couleurs correspondantes

- [ ] **T4** (AC: 4): Compteur de gorgées animé
  - [ ] Animation bounce/scale quand le compteur incrémente (`@keyframes bounce`)
  - [ ] Shake léger sur le compteur quand beaucoup de gorgées d'un coup
  - [ ] Transition numérique fluide (compteur qui défile)
  - [ ] Couleur du compteur qui change selon le nombre (vert → orange → rouge)

- [ ] **T5** (AC: 5): Refonte modal de distribution
  - [ ] Redesign de la modal avec glassmorphism (backdrop-filter: blur)
  - [ ] Quick-tap : afficher les avatars des joueurs en cercle/grille pour sélection rapide
  - [ ] Animation d'envoi de gorgée (icône verre qui vole vers le joueur sélectionné)
  - [ ] Compteur de gorgées restantes à distribuer bien visible
  - [ ] Feedback haptique (vibration) sur mobile via Vibration API
  - [ ] Bouton de confirmation stylisé avec animation de validation

- [ ] **T6** (AC: 6): Feedback visuel de match
  - [ ] Highlight/pulse sur la carte du joueur qui matche
  - [ ] Ligne de connexion visuelle ou flash entre la carte pyramide et la carte joueur
  - [ ] Animation de célébration légère (particules, glow) sur un match
  - [ ] Afficher clairement le nom du joueur et la carte qui a matché

- [ ] **T7** (AC: 8): Performance et accessibilité des animations
  - [ ] Utiliser `will-change` et `transform` pour les animations GPU
  - [ ] Respecter `prefers-reduced-motion` : désactiver les animations, afficher les cartes directement
  - [ ] Tester les performances sur mobile bas de gamme (throttle CPU dans DevTools)
  - [ ] S'assurer que toutes les animations sont en 60fps

---

## Dev Notes

### Layout pyramide proposé

```
        Phase "Tu bois"                    Phase "Tu donnes"
     (teinté rouge/sombre)              (teinté vert/or)

         ┌──────┐                           ┌──────┐
         │  🂠  │                           │  🂠  │
         └──────┘                           └──────┘
       ┌──────┐ ┌──────┐               ┌──────┐ ┌──────┐
       │  🂠  │ │  🂠  │               │  🂠  │ │  🂠  │
       └──────┘ └──────┘               └──────┘ └──────┘
    ┌──────┐ ┌──────┐ ┌──────┐     ┌──────┐ ┌──────┐ ┌──────┐
    │  🂠  │ │  🂠  │ │  🂠  │     │  🂠  │ │  🂠  │ │  🂠  │
    └──────┘ └──────┘ └──────┘     └──────┘ └──────┘ └──────┘
```

### Animation flip CSS

```scss
.card-container {
  perspective: 1000px;

  .card-inner {
    transition: transform 0.4s ease-in-out;
    transform-style: preserve-3d;

    &.flipped {
      transform: rotateY(180deg);
    }
  }

  .card-front, .card-back {
    backface-visibility: hidden;
    position: absolute;
  }

  .card-front {
    transform: rotateY(180deg);
  }
}
```

### Compteur animé

```scss
@keyframes sip-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

.sip-counter.incrementing {
  animation: sip-bounce 0.3s ease-in-out;
}

@keyframes sip-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### Modal quick-tap

```
┌──────────────────────────────────┐
│  🍺 Distribue 3 gorgées !       │
│                                  │
│    👤 Alice    👤 Bob            │
│      [+1]       [+1]            │
│                                  │
│    👤 Charlie  👤 Diana          │
│      [+1]       [+1]            │
│                                  │
│  Restant: 1 gorgée              │
│                                  │
│         [ ✓ Confirmer ]          │
└──────────────────────────────────┘
```

### Fichiers concernés

- `src/app/_components/game/game.component.html` (layout principal Phase 2)
- `src/app/_components/game/game.component.scss` (styles pyramide, animations)
- `src/app/_components/game/game.component.ts` (logique d'animation, état flip)
- `src/app/_shared/_components/playing-card/playing-card.component.*` (animation flip)
- `src/app/_shared/_components/footer/footer.component.*` (boutons boire/donner)
- `src/app/_components/players/player-card/player-card.component.*` (feedback match)
- Nouveau composant potentiel : `sip-distribution-modal.component.*`

### Dépendances techniques

- Aucune librairie externe requise (CSS animations natives)
- Optionnel : bibliothèque de particules légère pour les effets de célébration (tsparticles, canvas-confetti)

---

## Testing

### Unit Tests
- [ ] Test: Le layout pyramide rend les 12 cartes correctement
- [ ] Test: L'animation flip toggle la classe `flipped` sur la carte
- [ ] Test: Le compteur de gorgées s'incrémente avec l'animation
- [ ] Test: La modal affiche tous les joueurs sauf le joueur actif
- [ ] Test: La distribution de gorgées ne dépasse pas le total alloué

### Visual Tests (MCP)
- [ ] Test: Layout pyramide correct sur mobile (375px)
- [ ] Test: Layout pyramide correct sur tablette (768px)
- [ ] Test: Distinction visuelle rouge/vert entre boire et donner
- [ ] Test: Animation de flip visible et fluide
- [ ] Test: Modal de distribution lisible et utilisable sur petit écran

### Manual Tests
- [ ] Retourner une carte et vérifier l'animation 3D flip
- [ ] Distribuer des gorgées et vérifier le bounce du compteur
- [ ] Tester avec `prefers-reduced-motion: reduce` activé
- [ ] Vérifier les performances sur mobile réel (pas de jank)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | Claude |
