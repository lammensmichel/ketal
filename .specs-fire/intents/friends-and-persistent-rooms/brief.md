---
id: friends-and-persistent-rooms
title: Amis & rooms persistantes
status: in_progress
created: 2026-05-30
---

# Intent: Amis & rooms persistantes

## Goal

Permettre à un utilisateur connecté de retrouver les rooms qu'il crée (room
persistante, reprise et rejouable), et introduire un service d'amis pour
référencer de vrais joueurs enregistrés (FUG users) dans les parties — tout en
conservant l'ajout de joueurs non enregistrés (invités libres). La sélection des
joueurs sur `/players` doit permettre de choisir des amis (dont soi-même) en plus
des invités libres.

## Users

- **Utilisateur connecté (non anonyme)** : crée des rooms persistantes, gère des
  amis, référence de vrais joueurs, suit ses parties dans le temps.
- **Utilisateur anonyme (solo)** : crée une room solo éphémère/locale (comportement
  actuel conservé, room non listée dans `/rooms`).
- **Invités non enregistrés** : ajoutés à la volée par leur nom (comme aujourd'hui).

## Problem

Un utilisateur connecté qui clique « Créer une partie » crée bien une room en base
(collection Appwrite `game_rooms`, mode `solo`) via
`home.createGame()` → `RoomService.createSoloRoom()` → `createRoom()`, **mais elle
n'apparaît jamais dans `/rooms` ni dans le carrousel « parties récentes »**.

Cause racine : `RoomService.getMyRooms()` (room.service.ts:286) liste les rooms via
les **member records** de l'utilisateur (`MemberService.getMembersByUserId`). Or
`createRoom()` insère le document avec `hostMemberId: ''` et **ne crée aucun
`game_members`** pour l'hôte (la création du member hôte n'existe que dans le flux
multijoueur `create-room.component.ts › enterRoom()` et `join-room`). La room est
donc « orpheline » : présente en DB, invisible pour l'utilisateur. Effet
secondaire : une nouvelle room `Solo-{timestamp}` est créée à **chaque** clic (spam).

Au-delà du bug, il n'existe aucune notion d'« amis » : impossible de référencer de
vrais joueurs d'une partie à l'autre ni de suivre leurs stats.

## Success Criteria

- Une room créée par un utilisateur connecté apparaît immédiatement dans `/rooms`
  et dans le carrousel « parties récentes » de l'accueil.
- L'utilisateur peut reprendre une room existante et y rejouer des parties.
- Pas de prolifération de rooms solo orphelines (réutilisation ou nettoyage).
- Comportement solo anonyme inchangé (room éphémère, non listée).
- Une collection `friendships` permet d'ajouter/retirer des amis (FUG users).
- Un écran de gestion des amis est accessible aux utilisateurs connectés.
- Sur `/players`, on peut sélectionner des amis (dont soi-même) ET ajouter des
  invités libres dans la même partie ; les amis sont liés via `game_members.userId`,
  les invités via `game_members.deviceId`/nom.
- i18n (fr/en/de/nl), responsive, accessible ; aucune régression multijoueur ou
  des specs existantes.

## Constraints

- Backend partagé **fug-backend** (Appwrite + MariaDB) ; nouvelle collection
  `friendships` + permissions (chaque user lit/écrit les siennes).
- Modèle `GameMember` existant réutilisé : `userId` (ami enregistré) vs `deviceId`
  (invité), `role: 'host'|'player'|'spectator'`.
- `createSoloRoom()` est appelé en arrière-plan (`solo-room.service.ts:51`) et dans
  `players-list.toggleInvite()` → la création du member hôte doit être **idempotente**.
- Angular 19, standalone + signals + OnPush ; ngx-translate ; couverture tests 80%.
- Réutiliser les patterns existants (`enterRoom()` pour le member hôte, tiles
  `app-player-list-player` pour la liste de joueurs).

## Notes

### Décisions tranchées (PO, 2026-05-30)
1. **Room = conteneur persistant de participants.** Une room sert à reprendre/rejouer
   des parties plus tard avec les mêmes participants, sans recréer une room à chaque
   fois. → Ne pas spammer une room par clic : réutiliser/reprendre une room existante.
2. **Amitié = favoris unilatéraux** (pas d'acceptation mutuelle).
3. **Recherche d'amis par QR code + pseudo (nickname).** → nécessite une **migration
   backend (fug-backend)** pour ajouter `nickname` à la table user.
4. **Stats agrégées par `userId`** à travers les rooms.

### Découpage pressenti (work items)
- **WI-1 [quick win, prérequis]** : la room créée par un connecté apparaît dans
  `/rooms` (création idempotente du member `host` + `hostMemberId`, + anti-spam).
- **WI-2** : modèle & service d'amis (`friendships` Appwrite + `FriendService`).
- **WI-3** : écran de gestion des amis (entrée side-menu « Mes amis »).
- **WI-4** : sélection d'amis + soi-même dans `/players` (+ layout dédié).

### Proposition de layout (WI-4) — mobile-first
```
┌──────────────────────────────────────────────┐
│  Mise en place de la partie                    │
├──────────────────────────────────────────────┤
│  Amis                       [ + Ajouter un ami]│
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │  Moi ✓ │ │ Léa  ✓ │ │  Tom   │ │ + + +  │  │ ← chips toggle (✓ = sélectionné)
│  └────────┘ └────────┘ └────────┘ └────────┘  │
├──────────────────────────────────────────────┤
│  Invité libre (non enregistré)                 │
│  [♂][♀][⚧]  [ Nom du joueur…       ] [Ajouter] │ ← formulaire existant inchangé
├──────────────────────────────────────────────┤
│  Joueurs de la partie (4)                      │
│  • Moi (ami)        • Léa (ami)                 │
│  • Kévin (invité)   • Sarah (invité)            │ ← tiles existantes
└──────────────────────────────────────────────┘
        [  Débuter la Grosse Guinze  ]   (footer)
```
Principes : « Moi » épinglé en tête (désélectionnable) ; amis = chips toggle liés par
`userId` ; bloc invité libre inchangé (rétrocompatibilité) ; section Amis masquée pour
les anonymes.

### Référence diagnostic
Voir `implementation/pending/2026-05-30-footer-button-and-side-menu-icon-fixes.md`
(session liée). Backend : Appwrite/MariaDB (pas MongoDB).
