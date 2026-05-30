# Fix : bouton « Commencer » absent sur /players + menu hamburger cassé

**Date** : 2026-05-30
**Branche** : feature/fug-backend-integration

## Requête initiale

Deux symptômes signalés :
1. Le footer n'affiche pas le bouton « Commencer le jeu » sur `/players`.
2. Le bouton hamburger du menu latéral ne répond plus (le menu ne s'ouvre pas).

Diagnostic demandé via MCP Chrome (Chrome Mac, `localhost:9225`), puis correction.
Contexte : une IA précédente avait enchaîné de nombreux commits « fix(footer) » sans résoudre le problème (thrashing).

## Diagnostic (via MCP Chrome, app en cours d'exécution)

- **Erreurs console rouges** : uniquement
  `ERROR Error: Could not find icon with iconName=folder and prefix=fas in the icon library.`
  (répétée à chaque cycle de détection de changement). **Aucun cycle DI** — hypothèse initiale infirmée.
- **Menu hamburger** : le `<nav class="side-menu-drawer">` (toujours dans le DOM) reste à
  `translateX(280px)` (hors écran), sans classe `.open`, après le clic. L'erreur de rendu de
  l'icône `folder` interrompait le cycle de détection de changement et empêchait l'application
  du binding `[class.open]` → le drawer ne glissait jamais.
- **Bouton « Commencer »** : `.footer-wrapper` ne contenait que l'ancre `<!--container-->` du
  `@if (!isHiddenPage())`. Le bundle servi par `ng serve` était **obsolète** par rapport au code
  sur disque (les `console.log('[DEBUG footer]…')` commités ne se déclenchaient jamais). Le code
  sur disque était correct ; il fallait forcer une recompilation propre.
- **Bonus** : l'item de menu affichait la clé brute `menu.myRooms` (traduction manquante).

## Corrections appliquées

1. **`src/app/font-awesome.module.ts`** : ajout de `faFolder` (import + `addIcons`).
   → cause directe du menu cassé et du spam d'erreurs console. C'était un vrai bug du code HEAD :
   `side-menu.component.html:38` utilise `['fas','folder']` mais l'icône n'était enregistrée nulle part.

2. **`src/app/_shared/_components/footer/footer.component.ts`** : suppression des `console.log`
   de debug laissés par l'IA précédente (dans `isPlayersPage()`, `hasPlayers()`, `beginGame()`)
   et des méthodes mortes `logFooterDebug()`, `logActivePlayerDebug()`, `logSetupButtonDebug()`
   (non référencées dans le template ni les specs). Effet de bord : force la recompilation du footer.

3. **`src/assets/i18n/{fr,en,de,nl}.json`** : ajout de la clé `menu.myRooms`
   (« Mes parties » / « My games » / « Meine Spiele » / « Mijn spellen »).

## Vérification

- ✅ Validé en direct dans le navigateur (MCP Chrome) :
  - Menu hamburger : drawer `translateX(0)`, classe `open`, dans le viewport, backdrop présent.
  - `/players` : bouton « Débuter la Grosse Guinze » présent, visible, activé (3 joueurs).
  - Item de menu : « Mes parties » au lieu de `menu.myRooms`.
  - Plus aucune erreur console.
- ✅ Tests unitaires : footer 53/53, side-menu 17/17, header 3/3.
  (La suite complète est instable dans ce conteneur — échecs préexistants dans `member.service.spec`,
  sans rapport avec ces changements.)

## Note

Le footer fonctionnait déjà au niveau du code (correctif commité en `7d8d33a`) ; le navigateur
exécutait un bundle obsolète. La vraie correction de code restante était l'icône `faFolder`.
Le nettoyage des logs de debug remet le composant dans un état propre.
