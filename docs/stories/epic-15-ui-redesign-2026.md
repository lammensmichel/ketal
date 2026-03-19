# Epic 15: UI/UX Redesign 2026

**Status**: Draft
**Priority**: High
**Target**: Q2 2026

---

## Vision

Refonte visuelle complète de Ketal pour en faire une app mobile-first moderne digne de 2026. L'app actuelle repose sur des cartes Bootstrap plates, des boutons basiques et des layouts textuels sans vie. L'objectif est de créer une expérience immersive de jeu à boire : glassmorphism, animations fluides, micro-interactions, mode sombre, gradients vibrants, animations de cartes lors du retournement, et feedbacks visuels satisfaisants.

---

## Stories

### Story 15.1: Design System & Thème ✅ Done
Définir la palette de couleurs (gradients néon, tons sombres), la typographie moderne, le système de CSS variables, et le support dark/light mode comme fondation de tout le redesign.

### Story 15.2: Refonte des Player Cards
Redesign des cartes joueurs avec avatars stylisés, compteurs de gorgées animés (bounce, shake), et affichage visuel de la main de cartes en éventail.

### Story 15.3: UI Phase 1 Prédictions
Boutons de choix animés avec effets de pression, animations de révélation de carte (flip 3D), et transitions fluides entre les tours avec indicateur de progression.

### Story 15.4: Refonte Phase 2 Distribution
Layout pyramide/escalier pour les 12 cartes, animations de retournement, distinction visuelle boire (rouge) vs donner (vert/or), et modal fun pour la distribution des gorgées.

### Story 15.5: Header de Jeu & Progression
Refonte de l'indicateur de phase avec barre de progression animée, animations des scores en temps réel, et transitions visuelles entre les phases.

### Story 15.6: UI Lobby & Rooms
Cartes de room modernes avec glassmorphism, flow d'invitation repensé, QR code stylisé, et animations d'entrée/sortie des joueurs dans le lobby.

### Story 15.7: Animations & Micro-interactions
Système d'animations cohérent : flip de cartes 3D, compteurs de gorgées qui rebondissent, confettis en fin de partie, transitions de page fluides, et feedback visuel sur chaque action.

### Story 15.8: Mobile-first Responsive
Navigation par bottom sheet, gestes swipe pour les actions, touch targets optimisés (min 48px), layouts adaptatifs, et optimisation des performances d'animation sur mobile.

---

## Dependencies

- Aucune dépendance backend, epic purement frontend
- Les stories 15.2 à 15.8 dépendent de la Story 15.1 (Design System)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Epic created | Dev |
| 2026-03-19 | 1.1 | Story 15.1 marked Done, stories 15.2, 15.3, 15.6, 15.7, 15.8 created | Dev |
