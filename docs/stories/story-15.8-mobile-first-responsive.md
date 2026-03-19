# Story 15.8: Mobile-first Responsive

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur de Ketal sur mobile, tablette ou TV
**I want** une expérience optimisée pour chaque taille d'écran avec des interactions tactiles natives
**So that** le jeu soit confortable à jouer quel que soit l'appareil utilisé

---

## Context

L'application est actuellement développée avec Bootstrap responsive, mais sans optimisation spécifique pour les interactions mobiles (pas de bottom sheets, pas de swipe, touch targets parfois trop petits) ni pour les grands écrans (TV, écrans larges).

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Modals | Centrage desktop, pas de bottom sheet sur mobile |
| Interactions cartes | Click uniquement, pas de gestes swipe |
| Touch targets | Certains boutons et liens < 48px |
| Performance mobile | Animations non optimisées, jank possible |
| Grand écran / TV | Layout ne s'adapte pas, trop de whitespace |

### Vision du redesign

Une approche mobile-first complète : bottom sheets pour les modals sur mobile, gestes swipe pour les interactions de cartes, touch targets conformes aux guidelines, performance optimisée pour les appareils bas de gamme, et un layout spécifique pour les écrans TV/larges.

---

## Acceptance Criteria

1. **AC1**: Les modals/dialogs s'affichent en bottom sheet (glissant depuis le bas) sur mobile (< 768px) et en dialog centré sur desktop
2. **AC2**: Les interactions de cartes supportent le swipe (gauche/droite pour les choix, haut pour valider) en plus du tap
3. **AC3**: Tous les éléments interactifs (boutons, liens, cartes cliquables) ont un touch target minimum de 48x48px avec un espacement de 8px entre eux
4. **AC4**: L'application maintient 60fps sur les appareils mobiles pendant les animations et transitions
5. **AC5**: Un layout spécifique TV/grand écran (>= 1440px) est disponible avec des éléments agrandis, plus d'espace, et une lisibilité optimisée pour la distance

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Bottom sheet pattern sur mobile
  - [ ] Créer un composant `BottomSheetComponent` réutilisable
  - [ ] Animation slide-up depuis le bas avec handle de drag en haut
  - [ ] Swipe-down pour fermer (gesture recognition)
  - [ ] Backdrop semi-transparent cliquable pour fermer
  - [ ] Sur desktop (>= 768px) : rendu en dialog centré classique
  - [ ] Appliquer aux modals existantes : distribution de gorgées, paramètres, confirmation

- [ ] **T2** (AC: 2): Gestes swipe pour les cartes
  - [ ] Implémenter le gesture recognition via Touch API (`touchstart`, `touchmove`, `touchend`)
  - [ ] Swipe gauche/droite sur les boutons de choix (Phase 1) pour sélectionner
  - [ ] Feedback visuel pendant le swipe (card tilt, opacity change)
  - [ ] Seuil de swipe : 50px minimum pour valider le geste
  - [ ] Fallback : le tap reste fonctionnel (le swipe est un bonus)

- [ ] **T3** (AC: 3): Audit et correction des touch targets
  - [ ] Auditer tous les éléments interactifs de l'application
  - [ ] Corriger les éléments < 48px : boutons, liens de navigation, icônes cliquables
  - [ ] Ajouter un espacement de 8px minimum entre les éléments interactifs
  - [ ] Utiliser du padding plutôt que des dimensions fixes pour les touch targets
  - [ ] Documenter les corrections dans un tableau de suivi

- [ ] **T4** (AC: 4): Optimisation des performances mobile
  - [ ] Auditer les animations existantes avec DevTools Performance
  - [ ] Remplacer les animations non-composited par `transform` + `opacity`
  - [ ] Ajouter `will-change` uniquement sur les éléments activement animés
  - [ ] Réduire le nombre de repaints : éviter les changements de `width`, `height`, `top`, `left`
  - [ ] Lazy loading des images (avatars DiceBear) avec `loading="lazy"`
  - [ ] Tester avec CPU throttle 4x dans DevTools

- [ ] **T5** (AC: 5): Layout TV / grand écran
  - [ ] Breakpoint TV : `@include wide` (>= 1440px)
  - [ ] Cartes joueurs agrandies (scale 1.2x-1.5x)
  - [ ] Tailles de police augmentées pour la lisibilité à distance
  - [ ] Layout centré avec max-width pour éviter l'étirement excessif
  - [ ] Cartes de jeu plus grandes et plus espacées
  - [ ] Tester sur viewport 1920x1080 (TV Full HD)

---

## Dev Notes

### Bottom sheet component

```typescript
@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="bottom-sheet-backdrop" (click)="close()"></div>
      <div class="bottom-sheet" [class.desktop]="isDesktop()">
        <div class="bottom-sheet-handle" (touchstart)="onDragStart($event)"></div>
        <ng-content></ng-content>
      </div>
    }
  `,
})
export class BottomSheetComponent {
  isOpen = input.required<boolean>();
  closed = output<void>();
  isDesktop = computed(() => window.innerWidth >= 768);
}
```

### Bottom sheet CSS

```scss
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-4);
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp var(--animation-normal) var(--ease-spring) forwards;

  .bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: var(--color-text-muted);
    border-radius: var(--radius-full);
    margin: 0 auto var(--space-4);
  }

  &.desktop {
    position: fixed;
    bottom: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: var(--radius-lg);
    max-width: 500px;
    max-height: 80vh;
    animation: fadeIn var(--animation-normal) var(--ease-default) forwards;
  }
}

.bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}
```

### Swipe gesture detection

```typescript
private startX = 0;
private startY = 0;
private readonly SWIPE_THRESHOLD = 50;

onTouchStart(event: TouchEvent) {
  this.startX = event.touches[0].clientX;
  this.startY = event.touches[0].clientY;
}

onTouchEnd(event: TouchEvent) {
  const deltaX = event.changedTouches[0].clientX - this.startX;
  const deltaY = event.changedTouches[0].clientY - this.startY;

  if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) this.onSwipeRight();
    else this.onSwipeLeft();
  }
}
```

### Touch target audit template

```scss
// Mixin global pour les touch targets
@mixin touch-target {
  min-height: 48px;
  min-width: 48px;
  padding: var(--space-2) var(--space-3);
}

// Appliquer sur tous les éléments interactifs
button, a, [role="button"], .clickable {
  @include touch-target;
}
```

### TV layout adjustments

```scss
@include wide {
  :root {
    --font-size-base: 1.125rem;
    --font-size-lg: 1.375rem;
    --font-size-xl: 1.625rem;
    --font-size-2xl: 2.25rem;
    --font-size-3xl: 3.25rem;
  }

  .game-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-8);
  }

  .player-card {
    transform: scale(1.2);
    margin: var(--space-6);
  }

  .playing-card {
    width: 140px;
    height: 196px;
  }
}
```

### Fichiers concernés

- Nouveau composant : `src/app/_shared/_components/bottom-sheet/bottom-sheet.component.ts`
- `src/app/_components/game/game.component.*` (swipe gestures, touch targets)
- `src/app/_components/players/player-card/player-card.component.*` (touch targets, TV scaling)
- `src/app/_shared/_components/playing-card/playing-card.component.*` (touch targets, TV scaling)
- `src/styles.scss` (global touch target mixin, TV breakpoint overrides)
- `src/_design-tokens.scss` (TV font size overrides si nécessaire)
- Tous les composants avec des modals (migration vers bottom sheet)

### Dépendances techniques

- Design tokens de Story 15.1
- Touch API native (aucune librairie externe)
- Pas de dépendance HammerJS (trop lourd, utilisation de Touch API native)

---

## Testing

### Unit Tests
- [ ] Test: Le bottom sheet s'ouvre et se ferme correctement
- [ ] Test: Le bottom sheet rend en mode dialog sur desktop
- [ ] Test: Le swipe gesture détecte la direction correctement
- [ ] Test: Le seuil de swipe (50px) est respecté
- [ ] Test: Les touch targets ont une taille minimum de 48x48px

### Visual Tests (MCP)
- [ ] Test: Bottom sheet s'affiche depuis le bas sur mobile (375px)
- [ ] Test: Dialog centré sur desktop (1024px)
- [ ] Test: Touch targets visibles et suffisamment espacés sur mobile
- [ ] Test: Layout TV correct sur grand écran (1440px)
- [ ] Test: Cartes joueurs agrandies sur TV

### Manual Tests
- [ ] Swipe down pour fermer un bottom sheet sur mobile
- [ ] Swipe gauche/droite sur les boutons de choix en Phase 1
- [ ] Vérifier qu'aucun élément interactif n'est < 48px sur mobile
- [ ] Tester les performances d'animation sur mobile réel (60fps)
- [ ] Afficher l'app sur un écran TV et vérifier la lisibilité
- [ ] Tester avec `prefers-reduced-motion: reduce` activé

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
