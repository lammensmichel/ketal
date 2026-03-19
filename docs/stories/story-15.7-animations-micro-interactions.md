# Story 15.7: Animations & Micro-interactions

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: Medium
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur de Ketal
**I want** des animations cohérentes et des micro-interactions satisfaisantes sur toute l'application
**So that** chaque interaction se sente fluide, réactive et ludique

---

## Context

L'application actuelle n'a quasiment aucune animation : les pages changent instantanément, les boutons n'ont pas de feedback visuel, les toasts apparaissent/disparaissent sans transition, et les états de chargement sont basiques ou inexistants.

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Transitions de page | Changement instantané sans animation |
| Boutons | Aucun feedback hover/press (sauf le défaut Bootstrap) |
| Toasts | Apparition/disparition brutale |
| États de chargement | Spinner basique ou absent |
| Fin de partie | Aucune célébration, juste un affichage de résultats |
| Cohérence | Aucun système d'animation partagé |

### Vision du redesign

Un système d'animations cohérent basé sur les tokens du design system, qui donne vie à chaque interaction : transitions de page fluides, feedback haptique sur les boutons, toasts stylisés, loaders élégants, et célébrations en fin de partie.

---

## Acceptance Criteria

1. **AC1**: Un système d'animations cohérent est en place, utilisant exclusivement les timing tokens du design system (`--animation-fast`, `--animation-normal`, `--animation-slow`) et les easing functions (`--ease-default`, `--ease-bounce`, `--ease-spring`)
2. **AC2**: Les transitions entre les pages sont animées avec un fade+slide fluide via Angular route animations
3. **AC3**: Les boutons ont un feedback visuel au hover (scale up, glow subtil) et au press (scale down) sur tous les écrans
4. **AC4**: Les notifications toast s'animent en slide-in depuis le haut et slide-out avec fade
5. **AC5**: Les états de chargement utilisent un skeleton loader ou un spinner stylisé cohérent avec le thème
6. **AC6**: Une animation de célébration (confettis ou particules) se joue en fin de partie sur l'écran de résumé
7. **AC7**: Toutes les animations respectent `prefers-reduced-motion: reduce` et sont GPU-accelerated

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Système d'animations partagé
  - [ ] Créer un fichier `src/_animations.scss` avec les keyframes réutilisables
  - [ ] Définir les animations communes : fade-in, fade-out, slide-up, slide-down, bounce, shake, pulse
  - [ ] Créer des classes utilitaires : `.animate-fade-in`, `.animate-slide-up`, `.animate-bounce`
  - [ ] Toutes les durées et easings via les tokens CSS du design system
  - [ ] Importer dans `styles.scss`

- [ ] **T2** (AC: 2): Transitions de page Angular
  - [ ] Configurer Angular route animations dans `app.config.ts` ou `app.component.ts`
  - [ ] Animation de sortie : fade-out + translateY(-10px)
  - [ ] Animation d'entrée : fade-in + translateY(10px) → translateY(0)
  - [ ] Durée : `--animation-normal` (300ms)
  - [ ] Tester sur les routes principales : home → players → game → summary

- [ ] **T3** (AC: 3): Feedback boutons hover/press
  - [ ] Créer un mixin ou classe globale pour le feedback bouton
  - [ ] Hover : `transform: scale(1.02)`, `box-shadow` subtil
  - [ ] Press/active : `transform: scale(0.97)`
  - [ ] Transition : `var(--animation-fast)` avec `var(--ease-spring)`
  - [ ] Appliquer sur tous les boutons d'action principaux (CTA, choix de jeu, navigation)

- [ ] **T4** (AC: 4): Animations des toasts
  - [ ] Slide-in depuis le haut : `translateY(-100%) → translateY(0)` avec `var(--ease-spring)`
  - [ ] Auto-dismiss avec slide-out : `translateY(0) → translateY(-100%)` + fade
  - [ ] Stacking : si plusieurs toasts, les empiler avec un gap
  - [ ] Variantes visuelles selon le type : success (vert), error (rouge), info (bleu), warning (orange)

- [ ] **T5** (AC: 5): Skeleton loaders et spinners
  - [ ] Créer un composant ou directive skeleton loader avec animation shimmer
  - [ ] Animation shimmer : gradient qui se déplace de gauche à droite
  - [ ] Spinner stylisé avec les couleurs du thème (remplacer le spinner Bootstrap)
  - [ ] Appliquer le skeleton sur les zones de chargement : liste de joueurs, lobby, chargement de room

- [ ] **T6** (AC: 6): Célébration de fin de partie
  - [ ] Intégrer une bibliothèque légère de confettis (canvas-confetti, ~3kb gzipped)
  - [ ] Déclencher les confettis sur l'écran de résumé (`game-summary.component`)
  - [ ] Durée : 2-3 secondes, puis disparition naturelle
  - [ ] Optionnel : animation de classement des joueurs (slide-in séquentiel)

- [ ] **T7** (AC: 7): Accessibilité et performance
  - [ ] `@media (prefers-reduced-motion: reduce)` : désactiver toutes les animations ajoutées
  - [ ] Skeleton loaders : afficher un fond statique au lieu du shimmer
  - [ ] Confettis : ne pas lancer en mode reduced-motion
  - [ ] Toutes les animations via `transform` et `opacity` uniquement (GPU composited)
  - [ ] Tester les performances sur mobile (DevTools CPU throttle 4x)

---

## Dev Notes

### Fichier _animations.scss

```scss
// src/_animations.scss

// ===== Keyframes réutilisables =====

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// ===== Utility classes =====

.animate-fade-in {
  animation: fadeIn var(--animation-normal) var(--ease-default) forwards;
}

.animate-slide-up {
  animation: slideUp var(--animation-normal) var(--ease-spring) forwards;
}

.animate-bounce {
  animation: bounce var(--animation-normal) var(--ease-bounce);
}

.animate-shake {
  animation: shake var(--animation-fast) ease-in-out;
}
```

### Angular route animations

```typescript
// app.animations.ts
import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ], { optional: true }),
    ]),
  ]),
]);
```

### Toast animation

```scss
.toast-container {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.toast {
  animation: slideDown var(--animation-normal) var(--ease-spring) forwards;

  &.dismissing {
    animation: fadeOut var(--animation-fast) var(--ease-default) forwards;
  }
}
```

### Skeleton loader

```scss
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 25%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
```

### Fichiers concernés

- `src/_animations.scss` (NEW — keyframes et utility classes)
- `src/styles.scss` (MODIFIED — import _animations.scss)
- `src/app/app.component.ts` (route animations)
- `src/app/_shared/_components/toast/toast.component.*` (animations toast)
- `src/app/_components/game/game-summary/game-summary.component.*` (confettis)
- Tous les boutons CTA de l'application (feedback hover/press)
- Nouveau composant potentiel : `skeleton-loader.component.ts`

### Dépendances techniques

- Design tokens de Story 15.1
- `canvas-confetti` (npm, ~3kb gzipped) pour les effets de célébration
- Angular Animations module (`@angular/animations`)

---

## Testing

### Unit Tests
- [ ] Test: Les classes utilitaires d'animation sont disponibles globalement
- [ ] Test: Les route animations se déclenchent au changement de route
- [ ] Test: Le toast s'anime en slide-in et slide-out
- [ ] Test: Le skeleton loader affiche l'animation shimmer
- [ ] Test: Les confettis se déclenchent sur le composant game-summary

### Visual Tests (MCP)
- [ ] Test: Transition de page fluide entre /home et /players
- [ ] Test: Feedback visuel au hover sur un bouton CTA
- [ ] Test: Toast notification animé en mode sombre
- [ ] Test: Skeleton loader visible pendant le chargement
- [ ] Test: Confettis visibles sur l'écran de résumé

### Manual Tests
- [ ] Naviguer entre toutes les pages et vérifier les transitions
- [ ] Hover et cliquer sur les boutons, vérifier le feedback scale
- [ ] Déclencher un toast et vérifier l'animation d'entrée/sortie
- [ ] Terminer une partie et vérifier les confettis
- [ ] Tester avec `prefers-reduced-motion: reduce` activé (aucune animation)
- [ ] Vérifier les performances sur mobile réel (pas de jank, 60fps)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
