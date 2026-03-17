# Story 14.6: Side Menu (Drawer) pour gagner de la place en hauteur

**Status**: Draft
**Epic**: Epic 14: UX Polish
**Priority**: High

---

## Story

**As a** player on a mobile device
**I want** a compact header with a hamburger menu that opens a side drawer
**So that** the game area has more vertical space and navigation is grouped in one place

---

## Context

Le header actuel prend 3 lignes verticales :
1. Bouton "Se connecter" (coin droit)
2. Titre "Ketal"
3. Boutons "Menu" + "Nouvelle partie" (quand une partie est en cours)

Sur mobile (375px de haut), cet espace est précieux. Un side menu (drawer) à droite permettrait de réduire le header à une seule ligne : titre à gauche, icône hamburger à droite.

### Éléments à regrouper dans le side menu
- **Menu** (retour à /players sans perdre la partie) — visible quand partie en cours
- **Quitter la partie** — visible quand partie en cours
- **Se connecter / Se déconnecter** — toujours visible
- **Choix de langue** — toujours visible

### Layout cible
```
┌──────────────────────────────┐
│  KETAL                    ☰  │  ← Header compact (1 ligne)
├──────────────────────────────┤
│                              │
│   Phase 2: Distribution      │  ← Plus d'espace vertical pour le jeu
│   ...                        │
└──────────────────────────────┘

Quand ☰ cliqué :
                    ┌──────────┐
                    │ Menu     │
                    │ Quitter  │
                    │ ──────── │
                    │ Connexion│
                    │ Langue   │
                    └──────────┘
```

---

## Acceptance Criteria

1. **AC1**: Header réduit à 1 ligne (titre + hamburger icon)
2. **AC2**: Side menu s'ouvre à droite au clic sur le hamburger
3. **AC3**: Side menu contient : Menu, Quitter, Se connecter/déconnecter, Sélecteur de langue
4. **AC4**: Side menu se ferme au clic sur le backdrop ou sur un item
5. **AC5**: "Menu" et "Quitter" visibles uniquement quand une partie est en cours
6. **AC6**: Le dialog de confirmation "Quitter" fonctionne toujours
7. **AC7**: Responsive : fonctionne sur mobile, tablette et desktop

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1): Refactorer le header compact
  - [ ] Réduire le header à une seule ligne : titre à gauche, bouton hamburger à droite
  - [ ] Supprimer les boutons "Menu" et "Nouvelle partie" du header
  - [ ] Supprimer le composant user-menu du header

- [ ] **T2** (AC: 2, 4): Créer le composant SideMenuComponent
  - [ ] Créer `src/app/_shared/_components/side-menu/side-menu.component.ts`
  - [ ] Drawer qui slide depuis la droite avec backdrop semi-transparent
  - [ ] Animation CSS d'ouverture/fermeture (transform translateX)
  - [ ] Se ferme au clic sur le backdrop
  - [ ] Se ferme au clic sur un item du menu
  - [ ] Signal `isOpen` pour gérer l'état

- [ ] **T3** (AC: 3, 5): Contenu du side menu
  - [ ] Item "Menu" (🏠) — appelle `goToMenu()`, visible si partie en cours
  - [ ] Item "Quitter" — appelle `showQuitConfirmation()`, visible si partie en cours
  - [ ] Séparateur
  - [ ] Item "Se connecter" / "Se déconnecter" — selon l'état auth
  - [ ] Sélecteur de langue (dropdown ou liste)

- [ ] **T4** (AC: 6): Conserver la confirmation de quit
  - [ ] Le dialog de confirmation reste dans le header ou est déplacé dans le side menu
  - [ ] Le flow quit → confirm → reset fonctionne identiquement

- [ ] **T5** (AC: 7): Responsive
  - [ ] Tester sur 375px, 768px, 1280px
  - [ ] Le drawer ne dépasse pas 280px de large
  - [ ] Le backdrop couvre tout l'écran

---

## Dev Notes

### Fichiers à modifier
- `src/app/_shared/_components/header/header.component.ts` — Simplifier, ajouter hamburger
- `src/app/_shared/_components/header/header.component.html` — Réduire à 1 ligne
- `src/app/_shared/_components/header/header.component.scss` — Styles compact

### Fichiers à créer
- `src/app/_shared/_components/side-menu/side-menu.component.ts`
- `src/app/_shared/_components/side-menu/side-menu.component.html`
- `src/app/_shared/_components/side-menu/side-menu.component.scss`
- `src/app/_shared/_components/side-menu/side-menu.component.spec.ts`

### Fichiers potentiellement impactés
- `src/app/_shared/_components/user-menu/` — Logique auth à réutiliser dans le side menu
- `src/app/app.component.html` — Intégrer le side menu

### Patterns Angular 19
- Standalone component
- Signals pour l'état open/close
- inject() pour les services
- @if/@for control flow

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | - |
