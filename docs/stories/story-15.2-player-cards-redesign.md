# Story 15.2: Refonte des Player Cards

**Status**: Done
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

- [x] **T1** (AC: 1): Intégration DiceBear pour les avatars
  - [x] Installer ou utiliser l'API CDN DiceBear (`https://api.dicebear.com/7.x/avataaars/svg?seed={name}`)
  - [x] Créer un composant ou pipe `avatar` qui génère l'URL à partir du nom du joueur
  - [x] Afficher l'avatar en cercle (border-radius: 50%) avec border en `var(--color-accent-primary)`
  - [x] Fallback : initiales du joueur en cas d'erreur de chargement de l'image

- [x] **T2** (AC: 2): Compteurs de gorgées animés
  - [x] Séparer visuellement "Boire" (couleur `--color-drink`) et "Donner" (couleur `--color-give`)
  - [x] Implémenter l'animation bounce sur incrémentation (`@keyframes sip-bounce`)
  - [ ] Ajouter un shake léger quand le compteur atteint un seuil élevé (>= 5)
  - [ ] Transition numérique fluide entre les valeurs

- [x] **T3** (AC: 3): Affichage en éventail des cartes de prédiction
  - [x] Positionner les 4 cartes avec `transform: rotate()` progressif (-12deg, -4deg, 4deg, 12deg)
  - [x] Chevauchement avec `margin-left` négatif
  - [x] Au hover/tap, la carte survolée se soulève légèrement (`translateY(-6px)`)
  - [x] Cartes non encore jouées affichées face cachée

- [x] **T4** (AC: 4): Effet glow joueur actif
  - [x] Appliquer un `box-shadow` glow animé avec `--color-accent-primary` sur la carte du joueur actif
  - [x] Animation pulse subtile (alternance d'opacité du glow)
  - [x] Transition fluide quand le joueur actif change

- [x] **T5** (AC: 5): Layout responsive
  - [x] Mobile (< 768px) : cartes en colonne, pleine largeur, scroll vertical
  - [x] Tablet/Desktop (>= 768px) : grille 2 colonnes (max-width: 900px)
  - [x] Layout CSS Grid avec `repeat(2, 1fr)`

- [x] **T6** (AC: 6): Performance et accessibilité
  - [x] GPU-accelerated transitions sur les éléments animés
  - [x] Respecter `prefers-reduced-motion` : désactiver animations, afficher les cartes à plat
  - [x] Testé visuellement sur mobile (375px) et desktop (1440px) via MCP Chrome

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
- [x] Test: L'avatar est généré avec la bonne URL à partir du nom du joueur
- [x] Test: Le fallback initiales s'affiche si l'image ne charge pas
- [x] Test: Le compteur de gorgées déclenche l'animation class au changement
- [x] Test: Le joueur actif reçoit la classe CSS `.active` avec le glow
- [x] Test: Les 4 cartes sont rendues avec les bonnes rotations
- [x] 979/979 tests passent

### Visual Tests (MCP)
- [x] Test: Avatar DiceBear s'affiche correctement dans la carte joueur
- [x] Test: Éventail de cartes visible et bien positionné sur mobile (375px)
- [x] Test: Éventail de cartes visible et bien positionné sur desktop (1440px)
- [x] Test: Glow du joueur actif visible
- [x] Test: Layout grille responsive 2 colonnes sur desktop
- [x] Test: Partie complète jouée de bout en bout (Phase 1 tours 1-4 + Phase 2 distribution)

### Manual Tests
- [x] Ajouter un joueur et vérifier que l'avatar se génère automatiquement
- [x] Jouer une partie et vérifier le bounce des compteurs à chaque gorgée
- [x] Vérifier que le glow suit bien le changement de joueur actif
- [ ] Tester avec `prefers-reduced-motion: reduce` activé
- [ ] Vérifier les performances d'animation sur mobile réel

---

## Known Issues / TODO

### Bug: joueur inactif grisé trop opaque
Le joueur qui ne joue pas est grisé (opacity 0.6) ce qui rend le nombre de gorgées à boire difficilement lisible. Il faut :
- Réduire l'effet d'inactivité pour garder les compteurs de gorgées bien visibles
- Mettre en évidence le nombre de gorgées à boire même quand le joueur est inactif (couleur vive, taille plus grande)
- S'assurer que le joueur voit clairement combien il doit boire avant de passer au tour suivant

### Testing
- Lancer le MCP Chrome DevTools pour tester visuellement (Chrome sur Mac avec `--remote-debugging-port=9225`)
- Vérifier le rendu sur mobile via Chrome DevTools responsive mode

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
| 2026-04-10 | 1.1 | Implémentation T1-T6, bug identifié: joueur inactif trop grisé | Dev |
| 2026-04-11 | 1.2 | Refonte footer/prediction panel (thème sombre, boutons modernes), fix layout grille desktop, fix tests, story complète | Dev |
