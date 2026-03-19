# Story 15.2: Refonte des Player Cards

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur de Ketal
**I want** des cartes joueurs modernes avec avatars stylisés, compteurs animés et affichage visuel de ma main
**So that** l'expérience de jeu soit visuellement immersive et que je puisse suivre l'état de chaque joueur en un coup d'oeil

---

## Context

Les cartes joueurs actuelles sont des cartes Bootstrap basiques avec du texte plat. Elles affichent le nom, les gorgées et les 4 cartes de prédiction en ligne sans mise en valeur visuelle.

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Avatar | Aucun avatar, juste le nom en texte |
| Compteurs de gorgées | Texte statique "Boire: 0 / Donner: 0" sans feedback visuel |
| Cartes de prédiction | 4 cartes alignées sans hiérarchie, pas d'effet éventail |
| Joueur actif | Pas de distinction visuelle claire du joueur en cours |
| Responsive | Layout identique sur mobile et desktop |

### Vision du redesign

Chaque carte joueur devient un mini-tableau de bord immersif : avatar généré automatiquement, compteurs qui s'animent à chaque changement, cartes en éventail comme une vraie main, et glow lumineux sur le joueur actif.

---

## Acceptance Criteria

1. **AC1**: Chaque joueur a un avatar généré via DiceBear (style "avataaars" ou "bottts") basé sur son nom, affiché en cercle avec un border utilisant les design tokens
2. **AC2**: Les compteurs de gorgées (boire/donner) s'animent avec un effet bounce/scale à chaque incrémentation, en utilisant les animation tokens du design system
3. **AC3**: Les 4 cartes de prédiction du joueur s'affichent en éventail (fan layout) avec rotation progressive et léger chevauchement
4. **AC4**: Le joueur actif est mis en valeur par un effet glow/pulse lumineux utilisant `--color-accent-primary` du design system
5. **AC5**: Sur mobile (< 768px), les cartes joueurs s'empilent verticalement en pleine largeur ; sur desktop (>= 1024px), elles s'affichent en grille 2x2 ou 3 colonnes
6. **AC6**: Les animations respectent `prefers-reduced-motion` et sont performantes (GPU-accelerated, 60fps)

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Intégration DiceBear pour les avatars
  - [ ] Installer ou utiliser l'API CDN DiceBear (`https://api.dicebear.com/7.x/avataaars/svg?seed={name}`)
  - [ ] Créer un composant ou pipe `avatar` qui génère l'URL à partir du nom du joueur
  - [ ] Afficher l'avatar en cercle (border-radius: 50%) avec border en `var(--color-accent-primary)`
  - [ ] Fallback : initiales du joueur en cas d'erreur de chargement de l'image

- [ ] **T2** (AC: 2): Compteurs de gorgées animés
  - [ ] Séparer visuellement "Boire" (couleur `--color-drink`) et "Donner" (couleur `--color-give`)
  - [ ] Implémenter l'animation bounce sur incrémentation (`@keyframes sip-bounce`)
  - [ ] Ajouter un shake léger quand le compteur atteint un seuil élevé (>= 5)
  - [ ] Transition numérique fluide entre les valeurs

- [ ] **T3** (AC: 3): Affichage en éventail des cartes de prédiction
  - [ ] Positionner les 4 cartes avec `transform: rotate()` progressif (-15deg, -5deg, 5deg, 15deg)
  - [ ] Chevauchement avec `margin-left` négatif ou positionnement absolu
  - [ ] Au hover/tap, la carte survolée se soulève légèrement (`translateY(-8px)`)
  - [ ] Cartes non encore jouées affichées face cachée

- [ ] **T4** (AC: 4): Effet glow joueur actif
  - [ ] Appliquer un `box-shadow` glow animé avec `--color-accent-primary` sur la carte du joueur actif
  - [ ] Animation pulse subtile (alternance d'opacité du glow)
  - [ ] Transition fluide quand le joueur actif change

- [ ] **T5** (AC: 5): Layout responsive
  - [ ] Mobile (< 768px) : cartes en colonne, pleine largeur, scroll vertical
  - [ ] Tablet (768px-1023px) : grille 2 colonnes
  - [ ] Desktop (>= 1024px) : grille 2x2 ou 3 colonnes selon le nombre de joueurs
  - [ ] Utiliser les mixins responsive du design system (`@include tablet`, `@include desktop`)

- [ ] **T6** (AC: 6): Performance et accessibilité
  - [ ] Utiliser `will-change: transform` sur les éléments animés
  - [ ] Respecter `prefers-reduced-motion` : désactiver animations, afficher les cartes à plat
  - [ ] Tester les performances sur mobile (pas de jank)

---

## Dev Notes

### DiceBear intégration

```typescript
// Utiliser l'API HTTP directement (pas de dépendance npm)
getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}
```

### Layout éventail CSS

```scss
.card-fan {
  display: flex;
  justify-content: center;
  position: relative;

  .fan-card {
    transition: transform var(--animation-normal) var(--ease-spring);

    &:nth-child(1) { transform: rotate(-15deg); }
    &:nth-child(2) { transform: rotate(-5deg); margin-left: -12px; }
    &:nth-child(3) { transform: rotate(5deg); margin-left: -12px; }
    &:nth-child(4) { transform: rotate(15deg); margin-left: -12px; }

    &:hover, &:focus {
      transform: translateY(-8px) rotate(0deg);
      z-index: 10;
    }
  }
}
```

### Glow joueur actif

```scss
@keyframes active-glow {
  0%, 100% { box-shadow: 0 0 15px var(--color-accent-primary); }
  50% { box-shadow: 0 0 30px var(--color-accent-primary); }
}

.player-card.active {
  animation: active-glow 2s ease-in-out infinite;
}
```

### Fichiers concernés

- `src/app/_components/players/player-card/player-card.component.ts` (refonte complète)
- `src/app/_components/players/player-card/player-card.component.html` (nouveau template)
- `src/app/_components/players/player-card/player-card.component.scss` (nouveaux styles)
- `src/app/_components/players/players-list/players-list.component.*` (layout grille responsive)
- Nouveau pipe ou service : `avatar.pipe.ts` ou `avatar.service.ts`

### Dépendances techniques

- DiceBear API (CDN, aucune dépendance npm)
- Design tokens de Story 15.1

---

## Testing

### Unit Tests
- [ ] Test: L'avatar est généré avec la bonne URL à partir du nom du joueur
- [ ] Test: Le fallback initiales s'affiche si l'image ne charge pas
- [ ] Test: Le compteur de gorgées déclenche l'animation class au changement
- [ ] Test: Le joueur actif reçoit la classe CSS `.active` avec le glow
- [ ] Test: Les 4 cartes sont rendues avec les bonnes rotations

### Visual Tests (MCP)
- [ ] Test: Avatar DiceBear s'affiche correctement dans la carte joueur
- [ ] Test: Éventail de cartes visible et bien positionné sur mobile (375px)
- [ ] Test: Éventail de cartes visible et bien positionné sur desktop (1024px)
- [ ] Test: Glow du joueur actif visible en mode sombre
- [ ] Test: Layout grille responsive sur tablette (768px)

### Manual Tests
- [ ] Ajouter un joueur et vérifier que l'avatar se génère automatiquement
- [ ] Jouer une partie et vérifier le bounce des compteurs à chaque gorgée
- [ ] Vérifier que le glow suit bien le changement de joueur actif
- [ ] Tester avec `prefers-reduced-motion: reduce` activé
- [ ] Vérifier les performances d'animation sur mobile réel

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
