---
id: players-footer-always-visible
title: Players — always-visible footer with constant height
status: completed
created: 2026-05-18T10:00:00Z
priority: medium
completed_at: 2026-05-18T15:55:26.118Z
---

# Intent: Players — always-visible footer with constant height

## Context

The players screen uses a footer that contains an action button. Currently the footer's visibility and layout depend on the number of players in the list, causing visual instability.

## Goal

Stabilise the players UI footer so it is always present with a constant height. The action button should always be visible inside the footer but disabled when there are not enough players (≤ 1).

## Users

All users navigating the players screen / player management flow.

## Problem

- **0 joueurs** → pas de footer du tout
- **1 joueur ajouté** → le footer apparaît brutalement (saut visuel)
- **+1 joueur ajouté** → le footer change de hauteur, bouton devient actif

Ce comportement crée un layout shift désagréable et une UX incohérente.

## Success Criteria

- Le footer est **toujours visible**, même avec 0 joueur.
- La **hauteur du footer reste constante** quel que soit le nombre de joueurs ou l'état du bouton.
- Le bouton est **toujours affiché** dans le footer.
- Le bouton est **disabled** quand il y a ≤ 1 joueur, **enabled** quand > 1 joueur.

## Constraints

- Angular 20 (standalone components, @if/@for/@switch).
- Respecter les conventions SCSS existantes du projet.
- Ne pas introduire de regression sur le layout général du players screen.
