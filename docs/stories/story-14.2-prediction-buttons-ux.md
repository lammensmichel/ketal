# Story 14.2: Améliorer les boutons de prédiction Phase 1

**Status**: Review
**Epic**: Epic 14: UX Polish
**Priority**: Medium
**Depends On**: -

---

## Story

**As a** joueur en phase de prédictions
**I want** des boutons clairs et explicites pour chaque choix
**So that** je comprenne immédiatement ce que je choisis sans avoir besoin d'explication

---

## Context

Les boutons de prédiction en Phase 1 manquent de clarté :

| Tour | Boutons actuels | Problème |
|------|----------------|----------|
| 1 - Couleur | Rectangle rouge / Rectangle noir | OK, visuel clair |
| 2 - Plus/Moins | "+" / "-" | Trop abstrait, pas clair que c'est "plus haut/plus bas" par rapport à la carte précédente |
| 3 - Entre/Dehors | Deux miniatures de cartes avec flèches | Assez clair grâce aux flèches ◄► vs ►◄ |
| 4 - Couleur de carte | Icônes des 4 couleurs | OK |

Le tour 2 "Plus/Moins" est le plus problématique : les boutons "+" et "-" sont petits, sans contexte, et ne rappellent pas la carte de référence.

---

## Acceptance Criteria

1. **AC1**: Le bouton "+" est remplacé par un label "Plus haut" avec une flèche vers le haut (↑)
2. **AC2**: Le bouton "-" est remplacé par un label "Plus bas" avec une flèche vers le bas (↓)
3. **AC3**: La carte de référence (carte précédente du joueur) est affichée à côté des boutons pour rappeler le contexte
4. **AC4**: Les boutons sont assez grands pour être facilement cliquables sur mobile (min 48px touch target)
5. **AC5**: Le style reste cohérent avec les autres boutons de choix (couleur, in/out, suit)

---

## Tasks / Subtasks

- [x] **T1** (AC: 1, 2, 4): Modifier les boutons Plus/Moins dans le footer
  - [x] Remplacer "+" par "Plus haut ↑" ou une flèche montante avec texte
  - [x] Remplacer "-" par "Plus bas ↓" ou une flèche descendante avec texte
  - [x] S'assurer d'un touch target minimum de 48x48px
  - [x] Ajouter un style hover/active feedback

- [x] **T2** (AC: 3): Afficher la carte de référence
  - [x] Montrer la miniature de la dernière carte du joueur actif à côté des boutons
  - [x] Ajouter un texte contextuel : "Par rapport à ton [valeur] de [couleur]"

- [x] **T3** (AC: 5): Harmoniser le style des boutons sur les 4 tours
  - [x] Vérifier que tous les boutons de choix ont un style cohérent
  - [x] Taille, padding, border-radius uniformes

---

## Dev Notes

### Code actuel (footer.component.html)

Le tour 2 affiche deux boutons avec juste "+" et "-" comme contenu.

### Proposition visuelle

```
Tour 2 actuel :         Tour 2 proposé :
┌─────┐  ┌─────┐       ┌──────────────┐  ┌──────────────┐
│  +  │  │  -  │       │  ↑ Plus haut │  │  ↓ Plus bas  │
└─────┘  └─────┘       └──────────────┘  └──────────────┘

                        Par rapport à ton 4 ♥
```

### Fichiers concernés

- `src/app/_shared/_components/footer/footer.component.html` (modifier boutons tour 2)
- `src/app/_shared/_components/footer/footer.component.scss` (styles boutons)
- `src/assets/i18n/fr.json` (traductions "Plus haut", "Plus bas")
- `src/assets/i18n/en.json` (traductions "Higher", "Lower")

---

## Testing

### Unit Tests
- [x] Test: Les boutons affichent "Plus haut" et "Plus bas"
- [x] Test: La carte de référence est affichée au tour 2

### Visual Tests (MCP)
- [x] Test: Boutons assez grands sur mobile (viewport 375px)
- [x] Test: Style cohérent entre les 4 tours

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Story created | Claude |
