# Chrome DevTools MCP - Guide de configuration

Ce guide explique comment connecter Claude Code au navigateur Chrome de Windows via le protocole Chrome DevTools.

## Prérequis

- Chrome/Chromium installé sur Windows
- Accès SSH au serveur de développement
- Claude Code avec le MCP chrome-devtools configuré

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WINDOWS                                 │
│  ┌─────────────┐                                                │
│  │   Chrome    │◄── localhost:9222                              │
│  │  (debug)    │                                                │
│  └─────────────┘                                                │
│         ▲                                                       │
│         │ Tunnel SSH (-R)                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
┌─────────┼───────────────────────────────────────────────────────┐
│         ▼                           SERVEUR                     │
│   localhost:9222                                                │
│         ▲                                                       │
│         │                                                       │
│  ┌──────┴──────┐      ┌─────────────────┐                       │
│  │ Chrome MCP  │◄────►│   Claude Code   │                       │
│  └─────────────┘      └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Étapes de configuration

### 1. Lancer Chrome en mode debug (Windows)

Ouvrir PowerShell et exécuter :

```powershell
C:\chromium\chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=C:\temp\chrome-debug
```

**Options expliquées :**
- `--remote-debugging-port=9222` : Active le protocole DevTools sur le port 9222
- `--remote-allow-origins=*` : Autorise les connexions depuis n'importe quelle origine (nécessaire pour le tunnel)
- `--user-data-dir=C:\temp\chrome-debug` : Utilise un profil séparé pour le debug

### 2. Créer le tunnel SSH (Windows)

Dans un **nouveau terminal PowerShell**, créer le tunnel :

```powershell
ssh -4 -R 9222:localhost:9222 knabo@136.243.92.253
```

**Options expliquées :**
- `-4` : Force l'utilisation d'IPv4 (important, sinon le tunnel ne fonctionne pas)
- `-R 9222:localhost:9222` : Reverse tunnel - le port 9222 du serveur est redirigé vers localhost:9222 de Windows

**Laisser ce terminal ouvert** pendant toute la session de développement.

### 3. Vérifier la connexion (Serveur)

Sur le serveur, tester que Chrome est accessible :

```bash
curl -s http://localhost:9222/json/version
```

Réponse attendue :
```json
{
   "Browser": "Chrome/146.0.7652.0",
   "Protocol-Version": "1.3",
   ...
}
```

## Utilisation avec Claude Code

Une fois le tunnel établi, Claude Code peut utiliser les outils MCP :

| Outil | Description |
|-------|-------------|
| `list_pages` | Lister les pages ouvertes dans Chrome |
| `select_page` | Sélectionner une page comme contexte |
| `navigate_page` | Naviguer vers une URL |
| `take_screenshot` | Capture d'écran de la page |
| `take_snapshot` | Snapshot textuel (arbre a11y) |
| `click` | Cliquer sur un élément |
| `fill` | Remplir un champ de formulaire |
| `list_console_messages` | Voir les messages console |
| `list_network_requests` | Voir les requêtes réseau |

## Dépannage

### Le tunnel ne fonctionne pas

1. Vérifier que Chrome écoute sur le port 9222 (Windows) :
   ```powershell
   netstat -an | findstr 9222
   ```

2. Vérifier que le tunnel est actif sur le serveur :
   ```bash
   ss -tlnp | grep 9222
   ```

3. S'assurer d'utiliser `-4` dans la commande SSH

### Erreur "Empty reply from server"

Chrome refuse les connexions distantes. Relancer Chrome avec `--remote-allow-origins=*`.

### VSCode change le port automatiquement

Ne pas utiliser le port forwarding VSCode. Utiliser le tunnel SSH manuel à la place.

## Raccourci Windows (optionnel)

Créer un raccourci sur le bureau avec :
- Cible : `C:\chromium\chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=C:\temp\chrome-debug`
- Nom : "Chrome Debug"
