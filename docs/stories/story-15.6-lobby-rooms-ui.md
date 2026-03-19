# Story 15.6: UI Lobby & Rooms

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueur qui crée ou rejoint une partie en ligne
**I want** un lobby moderne avec des cartes de room stylisées, un QR code bien visible et des animations d'entrée de joueurs
**So that** l'attente dans le lobby soit agréable et que l'invitation de joueurs soit intuitive

---

## Context

Le lobby actuel est fonctionnel mais utilise des composants Bootstrap standards sans personnalité visuelle. Les cartes de room sont plates, le QR code est petit et peu visible, et il n'y a pas de feedback visuel quand un joueur rejoint.

### Problèmes identifiés

| Élément | Problème actuel |
|---------|----------------|
| Cartes de room | Cards Bootstrap basiques, pas de distinction visuelle |
| QR code | Petit, pas mis en avant, nécessite de chercher |
| Entrée de joueurs | Pas d'animation quand un joueur rejoint le lobby |
| Statut de room | Texte brut "En attente", "En cours", etc. |
| Layout lobby | Layout desktop appliqué tel quel sur mobile |

### Vision du redesign

Le lobby doit être un espace d'attente vivant : cartes de room avec effet glassmorphism, QR code proéminent et facile à scanner, animations satisfaisantes quand un joueur arrive, et indicateurs de statut colorés.

---

## Acceptance Criteria

1. **AC1**: Les cartes de room utilisent un effet glassmorphism (backdrop-filter: blur, fond semi-transparent) avec les design tokens
2. **AC2**: Le QR code est affiché de manière proéminente (grande taille, fond contrasté) avec un bouton de partage à côté
3. **AC3**: Quand un joueur rejoint le lobby, une animation d'entrée (slide-in + fade) est jouée sur sa carte joueur
4. **AC4**: Le statut de chaque room est indiqué par un badge coloré : "En attente" (jaune/ambre), "En cours" (vert), "Terminée" (gris)
5. **AC5**: Le layout du lobby est responsive : pleine largeur sur mobile avec scroll vertical, grille sur desktop
6. **AC6**: Les animations respectent `prefers-reduced-motion` et sont performantes

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Glassmorphism sur les cartes de room
  - [ ] Appliquer `backdrop-filter: blur(12px)` avec `background: rgba(var(--color-bg-surface-rgb), 0.6)`
  - [ ] Border subtile semi-transparente (`border: 1px solid rgba(255, 255, 255, 0.1)`)
  - [ ] Shadow douce pour la profondeur (`var(--shadow-lg)`)
  - [ ] Effet hover : augmenter légèrement le blur et la luminosité
  - [ ] Fallback pour navigateurs sans support `backdrop-filter` (background solide)

- [ ] **T2** (AC: 2): Mise en avant du QR code
  - [ ] Agrandir le QR code (min 200x200px sur mobile, 250x250px sur desktop)
  - [ ] Fond blanc avec padding pour assurer la lisibilité du scan
  - [ ] Bouton "Copier le lien" à côté du QR code avec icône clipboard
  - [ ] Bouton "Partager" utilisant Web Share API sur mobile (navigator.share)
  - [ ] Animation subtile d'apparition du QR code (fade-in + scale)

- [ ] **T3** (AC: 3): Animation d'entrée des joueurs
  - [ ] Animation slide-in depuis le bas + fade-in quand un joueur rejoint
  - [ ] Son/vibration optionnel (Vibration API) sur mobile
  - [ ] Toast notification discret "X a rejoint la partie"
  - [ ] Animation staggered si plusieurs joueurs rejoignent en même temps

- [ ] **T4** (AC: 4): Badges de statut de room
  - [ ] Badge "En attente" : fond `--color-warning` avec icône hourglass
  - [ ] Badge "En cours" : fond `--color-success` avec icône play
  - [ ] Badge "Terminée" : fond `--color-text-muted` avec icône check
  - [ ] Pulse animation subtile sur le badge "En attente" pour indiquer l'activité

- [ ] **T5** (AC: 5): Layout responsive du lobby
  - [ ] Mobile (< 768px) : liste verticale, cartes pleine largeur, QR code centré au-dessus
  - [ ] Tablet (768px-1023px) : grille 2 colonnes pour les joueurs, QR code en header
  - [ ] Desktop (>= 1024px) : layout 2 colonnes (QR code + infos à gauche, joueurs à droite)
  - [ ] Utiliser les mixins responsive du design system

- [ ] **T6** (AC: 6): Performance et accessibilité
  - [ ] Respecter `prefers-reduced-motion` pour les animations d'entrée
  - [ ] Fallback pour `backdrop-filter` (Safari < 9, Firefox ancien)
  - [ ] ARIA labels sur les badges de statut
  - [ ] Tester les performances de blur sur mobile

---

## Dev Notes

### Glassmorphism CSS

```scss
.room-card {
  background: rgba(var(--color-bg-surface-rgb), 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-6);
  transition: all var(--animation-normal) var(--ease-default);

  &:hover {
    backdrop-filter: blur(16px);
    box-shadow: var(--shadow-glow);
  }

  // Fallback pour navigateurs sans backdrop-filter
  @supports not (backdrop-filter: blur(12px)) {
    background: var(--color-bg-surface);
  }
}
```

### Animation d'entrée joueur

```scss
@keyframes playerJoin {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.player-joining {
  animation: playerJoin var(--animation-normal) var(--ease-spring) forwards;
}
```

### Badge de statut

```scss
.room-status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);

  &.waiting {
    background: rgba(var(--color-warning-rgb), 0.2);
    color: var(--color-warning);
    animation: pulse 2s ease-in-out infinite;
  }

  &.playing {
    background: rgba(var(--color-success-rgb), 0.2);
    color: var(--color-success);
  }

  &.finished {
    background: rgba(var(--color-text-muted-rgb), 0.2);
    color: var(--color-text-muted);
  }
}
```

### Fichiers concernés

- `src/app/_components/room/lobby/lobby.component.*` (layout, glassmorphism, animations)
- `src/app/_components/room/join-room/join-room.component.*` (UI rejoindre)
- `src/app/_components/home/home.component.*` (cartes de room sur la home)
- `src/app/_shared/_components/toast/toast.component.*` (toast notification joueur rejoint)

### Dépendances techniques

- Design tokens de Story 15.1
- QRCodeComponent existant (déjà utilisé)
- Web Share API (progressive enhancement, fallback clipboard)

---

## Testing

### Unit Tests
- [ ] Test: La carte de room applique les classes glassmorphism
- [ ] Test: Le QR code est généré avec le bon lien de room
- [ ] Test: Le bouton copier copie le lien dans le clipboard
- [ ] Test: Le badge affiche le bon statut et la bonne couleur
- [ ] Test: L'animation d'entrée s'applique quand un nouveau joueur est ajouté

### Visual Tests (MCP)
- [ ] Test: Glassmorphism visible sur les cartes de room en mode sombre
- [ ] Test: QR code lisible et scannable sur mobile (375px)
- [ ] Test: Badges de statut visibles avec les bonnes couleurs
- [ ] Test: Layout responsive correct sur tablette (768px)
- [ ] Test: Layout responsive correct sur desktop (1024px)

### Manual Tests
- [ ] Scanner le QR code depuis un autre appareil et vérifier la jointure
- [ ] Utiliser le bouton de partage sur mobile (Web Share API)
- [ ] Vérifier l'animation d'entrée en temps réel quand un joueur rejoint
- [ ] Tester avec `prefers-reduced-motion: reduce` activé
- [ ] Vérifier les performances du blur sur mobile réel

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
