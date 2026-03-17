# Test Session - Mode Local (2026-03-17)

## Configuration
- **Mode**: Local (localStorage, pas de room Appwrite)
- **Backend**: Appwrite running sur port 9000 (fug-backend)
- **Auth**: Session anonyme (Jouer en tant qu'invité)
- **Joueurs**: Alice, Bob
- **Résumé**: Activé (toggle ON)
- **Browser**: Chromium headless via MCP

---

## Phase 1: Prédictions

### Tour 1 - Couleur

| Joueur | Choix | Carte reçue | Résultat | Gorgées |
|--------|-------|-------------|----------|---------|
| Alice  | Rouge | 4 de coeur (rouge) | Correct | 0 |
| Bob    | Noir  | 7 de trèfle (noir) | Correct | 0 |

**UX OK** : Boutons rouge/noir clairs et explicites.
**Joueur actif** bien mis en surbrillance bleue.
**Dots de progression** : premier dot vert (validé), deuxième bleu (actif).

### Tour 2 - Plus/Moins

| Joueur | Carte ref | Choix | Carte reçue | Résultat | Gorgées attendues |
|--------|-----------|-------|-------------|----------|-------------------|
| Alice  | 4 coeur   | Plus (+) | K coeur | Correct (K > 4) | 0 |
| Bob    | 7 trèfle  | Moins (-) | K pique | Faux (K > 7) | 2 |

**BUG UX - Boutons "+" / "-"** : Trop petits et abstraits. Pas clair que ça signifie "plus haut/plus bas" par rapport à la carte précédente. → Story 14.2 créée.

**BUG POTENTIEL - Sips Bob** : Bob devrait avoir 2 gorgées après ce tour, mais le badge affiche "0" au tour suivant.

### Tour 3 - Entre/Dehors

| Joueur | Cartes ref | Choix | Carte reçue | Résultat | Gorgées |
|--------|-----------|-------|-------------|----------|---------|
| Alice  | 4 coeur, K coeur | Entre | 6 pique | Correct (4 < 6 < K) | 0 |
| Bob    | 7 trèfle, K pique | Entre | 10 trèfle | Correct (7 < 10 < K) | 0 |

**UX OK** : Les boutons avec miniatures de cartes + flèches ◄► vs ►◄ sont compréhensibles.

### Tour 4 - Couleur exacte

| Joueur | Choix | Carte reçue | Résultat | Gorgées |
|--------|-------|-------------|----------|---------|
| Alice  | Coeur (♥) | Dame de carreau (♦) | Faux | +4 |
| Bob    | Trèfle (♣) | 9 de trèfle (♣) | Correct | 0 |

**UX OK** : Les 4 icônes de couleur (♥ ♦ ♠ ♣) sont claires.

### Fin Phase 1 - Récap

| Joueur | Gorgées affichées | Gorgées attendues |
|--------|-------------------|-------------------|
| Alice  | 4 | 4 (tour 4 : +4) |
| Bob    | 0 | 2 (tour 2 : +2) |

**BUG CONFIRMÉ** : Bob affiche 0 gorgées alors qu'il devrait en avoir 2 (mauvaise prédiction Plus/Moins). Les gorgées de Bob semblent ne pas avoir été comptabilisées au tour 2.

---

## Phase 2: Distribution

### Transition Phase 1 → Phase 2
- L'affichage bascule bien vers Phase 2
- Les compteurs Boire 0/6 et Donner 0/6 apparaissent
- Les 12 cartes retournées (6 boire + 6 donner) s'affichent en bas

**BUG - Sips reset** : Alice passe de 4 gorgées à 0 en passant en Phase 2. Les gorgées de Phase 1 semblent ne pas être conservées.

### Carte 1 - Tu bois
- Carte tirée : 5 de pique
- Aucun joueur n'a de 5 → 0 gorgée pour tous
- Compteur passe à Boire 1/6

### Carte 2 - Tu donnes
- Carte tirée : 7 de carreau
- Bob a un 7 de trèfle → match de valeur
- Bob doit donner 1 gorgée

**Modal de distribution de gorgées** :
- Affiche "Bob donne 1 gorgées"
- **BUG GRAMMAIRE** : "1 gorgées" → devrait être "1 gorgée" (sans 's')
- Interface avec compteur par joueur (+/- et bouton "1" pour remplissage rapide)
- Boutons "Close" et "Save"

**Note** : Le modal en boucle a été observé dans la session précédente mais ne s'est pas reproduit dans la suite des tests. À re-tester.

### Cartes 3-12 (suite de la Phase 2)

| Étape | Carte tirée | Match ? | Action |
|-------|------------|---------|--------|
| Boire 2/6 | 6 de carreau | Alice (6 pique) | Alice +2 gorgées |
| Donner 2/6 | 2 de coeur | Non | - |
| Boire 3/6 | 2 de carreau | Non | - |
| Donner 3/6 | As de carreau | Non | - |
| Boire 4/6 | Valet de coeur | Non | - |
| Donner 4/6 | 4 de trèfle | Alice (4 coeur) | Modal: Alice donne 4 → donné à Bob |
| Boire 5/6 | 6 de trèfle | Alice (6 pique) | Alice +5 gorgées |
| Donner 5/6 | Valet de pique | Non | - |
| Boire 6/6 | 9 de pique | Bob (9 trèfle) | Bob +6 gorgées |
| Donner 6/6 | 10 de pique | Bob (10 trèfle) | Modal: Bob donne 6 → donné à Alice |

**Observation** : Les gorgées se remettent à 0 entre chaque tour de Phase 2 (pas seulement entre Phase 1 et 2).

### Résumé de fin de partie
- Alice: 18 gorgées bues, 4 données
- Bob: 12 gorgées bues, 7 données
- Bouton "Recommencer" et "Afficher le résumé" visibles
- Le résumé s'affiche correctement avec badges rouge (bu) et vert (donné)

### Screenshots sauvegardés
- `screenshots/phase2-current-state.png` - État initial Phase 2
- `screenshots/phase2-boire-2.png` - Boire 2/6
- `screenshots/phase2-donner-modal-alice.png` - Modal Alice donne 4 gorgées
- `screenshots/phase2-boire-6-complete.png` - Toutes les cartes boire révélées
- `screenshots/phase2-fin-modal-bob-donne.png` - Modal fin Bob donne 6 gorgées
- `screenshots/game-summary.png` - Écran résumé final

---

## Test Auth (connecté)

### Inscription
- **Email**: test@ketal.fr / TestPass123!
- **Résultat**: OK - compte créé dans Appwrite local, redirection vers /players
- **Screenshot**: `screenshots/register-page.png`, `screenshots/after-register-success.png`

### Login email
- **Résultat**: OK - reconnexion réussie, redirection vers /players

### Invité (anonyme)
- **Résultat**: OK - session anonyme, mode local

### Déconnexion
- **Résultat**: OK - retour au bouton "Se connecter"

### Google OAuth
- Non testable en local (pas de SMTP/OAuth configuré)

### Observations auth
- Les joueurs (Alice, Bob) persistent en localStorage entre les sessions auth
- Le flow register → auto-login → redirect /players est fluide
- Page register : grand espace blanc sous le formulaire (layout à améliorer)

---

## Partie 2 - Mode connecté (test@ketal.fr)

### Phase 1 - Sips affiché vs attendu

| Tour | Alice affiché | Alice attendu | Bob affiché | Bob attendu |
|------|--------------|---------------|-------------|-------------|
| 1 Couleur | 1 (4♠, choix rouge=faux) | 1 | 0 (A♣, choix noir=ok) | 0 |
| 2 Plus/Moins | 0 | 1 | 2 (9♥ < A, choix +=faux) | 2 |
| 3 Entre/Dehors | 3 (Q♠ dehors 4-8) | 4 (1+3) | 0 | 2 (2+0) |
| 4 Couleur exacte | 4 (2♦, choix ♠=faux) | 8 (1+0+3+4) | 4 (K♦, choix ♣=faux) | 9 (0+2+3+4) |

**Bug confirmé** : Le compteur affiche UNIQUEMENT les gorgées du tour en cours, pas le cumul. Écrase à chaque tour.

### Phase 2 - Distribution

| Étape | Carte | Match | Gorgées |
|-------|-------|-------|---------|
| Boire 1/6 | 6♣ | - | - |
| Donner 1/6 | 5♦ | - | - |
| Boire 2/6 | A♥ | Bob (A♣) | Bob +2 |
| Donner 2/6 | J♥ | - | - |
| Boire 3/6 | 10♠ | - | - |
| Donner 3/6 | 3♠ | - | - |
| Boire 4/6 | A♠ | Bob (A♣) | Bob +4 |
| Donner 4/6 | A♦ | Bob (A♣) | Modal: Bob donne 4 → Alice |
| Boire 5/6 | 9♠ | Bob (9♥) | Bob +5 |
| Donner 5/6 | 10♦ | - | - |
| Boire 6/6 | 8♦ | Alice (8♣) | Alice +6 |
| Donner 6/6 | 6♥ | - | - |

### Résumé
- Alice: 18 bues, 0 données
- Bob: 20 bues, 4 données

### Conclusion mode connecté
- Comportement identique au mode invité (normal : mode local dans les deux cas)
- Mêmes bugs sips observés
- Modal "donner" fonctionne sans boucle sur cette session
- Screenshots: `connected-game-end.png`, `connected-summary.png`

---

## Partie 3 - Sans résumé (Charlie + Diana, connecté)

- Checkbox résumé décochée avant lancement
- Phase 1 et Phase 2 jouées normalement
- Fin de partie : seul bouton "Recommencer", pas de "Afficher le résumé"
- **Test sans résumé : OK**
- Screenshot: `no-summary-game-end.png`

---

## Tests boutons et navigation

### "Arrêter la partie en cours"
- Redirige vers /players SANS confirmation, partie perdue
- **BUG-6** → Story 14.0
- Screenshot: `arreter-partie-no-confirm.png`

### Partie avec 1 joueur
- Bouton "Débuter" visible et fonctionnel avec 1 joueur
- **BUG-5** → Story 14.3
- Screenshots: `bug-one-player-can-start.png`, `solo-game-start.png`

### 0 joueurs
- Bouton "Débuter" absent → OK

---

## Test i18n (langues)

| Langue | Résultat | Screenshot |
|--------|----------|------------|
| Français | OK | - |
| English | OK | `lang-english.png` |
| Nederlands | OK | `lang-nederlands.png` |
| Deutsch | OK | `lang-deutsch.png` |

- Changement instantané, tous les textes traduits
- "Grosse Guinze Generator" reste en FR (nom de marque)
- **Test i18n : OK**

---

## Partie 4 - 3 joueurs (Charlie, Diana, Eve, connecté, sans résumé)

### Phase 1
- Tour 1 Couleur : Charlie rouge→J♠ faux +1, Diana rouge→5♦ ok, Eve noir→K♠ ok
- Tour 2 Plus/Moins : Charlie -(J)→10♣ ok, Diana +(5)→J♥ ok, Eve -(K)→2♠ ok
- Tour 3 Entre/Dehors : Charlie dehors(10-J)→3♦ ok, Diana entre(5-J)→K♣ faux +3, Eve entre(K-2)→7♠ ok
- Tour 4 Couleur exacte : Charlie ♠→6♦ faux +4, Diana ♥→A♦ faux +4, Eve ♠→7♣ faux +4

Bug sips confirmé : chaque joueur affiche uniquement les gorgées du dernier tour.

### Phase 2
- 12 tours joués
- Matchs : Charlie (3♦ match 3♣, 6♦ match 6♣), Eve (2♠ match 2♦, 7♠/7♣ match 7♥)
- Fin : Charlie 6, Diana 0, Eve 0
- Pas de modal en boucle
- Screenshots: `3players-phase1-start.png` → `3players-game-end.png`

### Observations 3 joueurs
- Layout 2+1 en grille → OK
- Cartes lisibles à cette taille
- Flow Phase 1 → Phase 2 → Fin sans problème
- Bordure bleue joueur actif bien visible

---

## Test Room (Multiplayer)

### Création de room
- `/room/create` : formulaire avec nom de room → OK
- Room créée dans Appwrite (collection `fug_game_rooms`) avec code 58A2N9
- QR code + lien de partage affichés → OK
- "ENTRER DANS LA ROOM" → redirige vers lobby → OK
- Network: POST game_rooms [201], POST game_members [201], PATCH room [200] → OK
- Screenshot: `room-create.png`, `room-created-qr.png`

### Lobby hôte
- Joueurs 1/10, Test User (Hôte) avec point vert
- "LANCER LA PARTIE" disabled + "Minimum 2 joueurs requis" → OK (contrairement au mode local !)
- Screenshot: `room-lobby.png`

### Rejoindre une room
- `/room/join/58A2N9` : code pré-rempli, pseudo "Invité" par défaut
- Player2 rejoint en contexte isolé (session anonyme auto)
- Côté Player2 : voit 2/10 joueurs, bouton "Quitter"
- Screenshot: `room-join-player2.png`, `room-player2-joined.png`

### BUG-9: Realtime ne fonctionne pas
- **Sévérité** : Bloquante
- L'hôte ne voit PAS Player2 apparaître (reste 1/10)
- Après reload : l'hôte passe à 0/10 "En attente de joueurs"
- Aucune connexion WebSocket détectée
- Aucune requête GET members après reload
- Le lobby ne re-fetch pas les données de la room au init
- Screenshot: `room-host-sees-player2.png` (bug), `room-host-after-reload.png` (pire)

### BUG-10: UX room pages
- La checkbox résumé et "Débuter la Grosse Guinze" sont visibles sur les pages room (ne devraient pas)
- Grand espace blanc entre header et formulaire create-room

---

## Edge Cases

### Validation joueurs
| Test | Résultat |
|------|----------|
| Nom vide | Bloqué (required) → OK |
| Nom espaces uniquement | Bloqué (isNullOrWhiteSpace) → OK |
| Nom très long (48 chars) | Ajouté, layout OK sur /players mais non testé en jeu |
| 0 joueurs | Bouton "Débuter" absent → OK |
| 1 joueur | Bouton visible → **BUG-5** |
| 10 joueurs | Ajout OK, mais en jeu seuls 6 visibles → **BUG-12** |

### BUG-11: Mot de passe oublié non implémenté
- Le lien "Mot de passe oublié?" sur /login pointe vers /forgot-password
- La route redirige vers / sans page de récupération
- **Sévérité** : Faible (pas critique pour la phase actuelle)

### Test Responsive

| Viewport | Résultat | Screenshot |
|----------|----------|------------|
| Desktop 1280x800 | OK | `end-game-desktop.png` |
| Mobile portrait 375x812 | Jouable, cartes petites, BUG-13 | `mobile-game-phase1.png`, `mobile-phase2.png` |
| Tablette 768x1024 | OK | `tablet-phase2.png` |
| Mobile paysage 812x375 | **Inutilisable** BUG-14 | `mobile-landscape-phase2.png` |

### BUG-14: Mode paysage mobile inutilisable
- **Sévérité** : Haute
- En landscape (812x375), les joueurs et le header Phase 2 ne sont pas visibles
- Seuls les cartes Tu bois/Tu donnes et le bouton apparaissent
- Pas de scroll possible
- Screenshot: `mobile-landscape-phase2.png`

### BUG-13: Bordure joueur coupée par footer en mobile
- **Sévérité** : Moyenne
- En mobile (375x812), la bordure basse du 3ème joueur (row 2) est écrasée par le séparateur du footer
- Manque de padding/margin entre le conteneur joueurs et le footer
- Aussi après refresh de /game, les joueurs s'affichent en mode liste sans cartes
- Screenshots: `mobile-card-cut-by-footer.png`

### BUG-12: Joueurs au-delà de 6 non visibles en jeu
- **Sévérité** : Haute
- Avec 10 joueurs, seuls Charlie à Hugo (6 premiers) sont visibles en Phase 1
- Iris, Jack, Kim, Leo sont dans le DOM mais pas affichés (overflow hidden ou max-height)
- La page ne scrolle pas pour montrer les joueurs supplémentaires
- Screenshot: `edge-10-players-game.png`, `edge-10-players-scrolled.png`

---

## Bugs trouvés

### BUG-1: Compteur de gorgées incorrect (Phase 1)
- **Sévérité**: Haute
- **Description**: Les gorgées du tour Plus/Moins ne sont pas comptabilisées pour Bob (devrait avoir +2, affiche 0)
- **Reproduction**: Joueur choisit "-", reçoit une carte plus haute → devrait ajouter 2 gorgées
- **Fichier suspect**: `game.service.ts` → `getSipsNumberForMinusChoice()`

### BUG-2: Sips reset entre phases
- **Sévérité**: Haute
- **Description**: Les gorgées accumulées en Phase 1 sont remises à 0 en Phase 2
- **Reproduction**: Accumuler des gorgées en Phase 1 → passer en Phase 2 → compteur revient à 0
- **Fichier suspect**: `game.service.ts` → passage de phase ou `saveAndNotify()` deep clone issue

### BUG-3: Modal de distribution en boucle infinie
- **Sévérité**: Bloquante
- **Description**: En mode résumé, le modal "X donne Y gorgées" se rouvre après Save. Le jeu est bloqué.
- **Reproduction**: Activer résumé → jouer jusqu'à Phase 2 → tirer une carte "Tu donnes" qui match → distribuer les gorgées → Save → modal se rouvre
- **Fichier suspect**: `player-card.component.ts` modal logic, ou `updatePlayerGivenSipsFromCard()` dans `game.service.ts`

### BUG-4: Grammaire "1 gorgées"
- **Sévérité**: Faible
- **Description**: Le modal affiche "1 gorgées" au lieu de "1 gorgée"
- **Reproduction**: Quand un joueur doit donner exactement 1 gorgée
- **Fichier**: `src/assets/i18n/fr.json` - pluralisation manquante

### BUG-5: Partie lançable avec 1 seul joueur
- **Sévérité**: Moyenne
- **Description**: Le bouton "Débuter la Grosse Guinze" apparaît avec un seul joueur. Le jeu nécessite minimum 2 joueurs.
- **Reproduction**: Ajouter 1 seul joueur → le bouton de lancement est visible et cliquable
- **Fichier**: `src/app/_shared/_components/footer/footer.component.ts` ligne 106-107 - `hasPlayers()` vérifie `length > 0` au lieu de `length > 1`
- **Story**: 14.3

### BUG-6: (réservé)

### BUG-7: Checkbox résumé pas persistée
- **Sévérité**: Faible
- **Description**: La checkbox "Activer le résumé" se réinitialise à cochée après l'arrêt d'une partie. L'état devrait persister.
- **Reproduction**: Cocher/décocher la checkbox → arrêter la partie → la checkbox revient à son état par défaut
- **Fichier**: `src/app/services/game/game.service.ts` ligne 78 - `withSummaryMode` signal initialisé à `false`, pas de persistance localStorage
- **Story**: 14.4

---

## Observations UX

### Positif
- Le flow ajout joueurs → début de partie est fluide
- Le joueur actif est clairement identifiable (bordure bleue)
- Les dots de progression (vert = fait, bleu = actif, gris = à venir) sont clairs
- Le nom du joueur actif est rappelé en bas avec son avatar
- Les boutons couleur (tour 1) et couleur exacte (tour 4) sont intuitifs
- Les boutons Entre/Dehors (tour 3) avec les miniatures de cartes sont compréhensibles
- Le toggle résumé disparaît quand il n'y a qu'un joueur (bien)

### A améliorer
- **Tour 2 "Plus/Moins"** : Boutons "+" et "-" trop abstraits → Story 14.2
- **"Arrêter la partie en cours"** efface tout sans confirmation → Story 14.0
- Pas de moyen de revenir au menu sans perdre la partie → Story 14.0
- Le résumé est accessible sans compte → Story 14.1

---

## Stories créées suite à ce test

| Story | Titre | Priorité |
|-------|-------|----------|
| 14.0 | Pause & retour menu sans perdre la partie | Haute |
| 14.1 | Conditionner le résumé à la création de compte | Moyenne |
| 14.2 | Améliorer les boutons de prédiction Phase 1 | Moyenne |
| 14.3 | Validation minimum 2 joueurs pour lancer une partie | Haute |
| 14.4 | Persistance de la checkbox résumé en localStorage | Moyenne |
