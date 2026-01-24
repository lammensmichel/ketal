# Chrome DevTools MCP Setup

## Date: 2026-01-24

## Statut: TERMINÉ

---

## Ce qui a été fait

### 1. Tests corrigés
- **697 tests passent** (tous les tests unitaires)
- Karma configuré pour ChromeHeadlessNoSandbox (serveur SSH)
- Fichiers modifiés:
  - `karma.conf.js` - ajout ChromeHeadlessNoSandbox
  - `src/app/app.component.spec.ts` - fix OnPush + signals + stub components
  - `src/app/_shared/_components/toast/toast.component.spec.ts` - fix ViewChild

### 2. Chrome DevTools MCP installé
- Commande: `claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest --browserUrl=http://localhost:9222`
- Config dans `~/.claude.json`

---

## Prochaines étapes (à reprendre)

### 1. Lancer le tunnel SSH (PowerShell Windows)
```powershell
ssh -R 9222:localhost:9222 knabo@adresse-serveur
```

### 2. Vérifier la connexion (sur le serveur)
```bash
curl http://localhost:9222/json/version
```
Doit retourner les infos de Chrome.

### 3. Relancer Claude
```bash
claude
```

### 4. Tester les outils MCP
Une fois Claude relancé, les outils disponibles:
- `mcp__chrome-devtools__list_pages` - lister les pages ouvertes
- `mcp__chrome-devtools__navigate_page` - naviguer vers une URL
- `mcp__chrome-devtools__take_screenshot` - capture d'écran
- `mcp__chrome-devtools__list_console_messages` - erreurs console
- `mcp__chrome-devtools__list_network_requests` - requêtes réseau

---

## Configuration Chrome (Windows)

Raccourci créé avec:
```
C:\chromium\chrome.exe --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

---

---

## Solution finale (FONCTIONNEL)

### 1. Lancer Chrome sur Windows
```powershell
C:\chromium\chrome.exe --remote-debugging-port=9222 --remote-allow-origins=* --user-data-dir=C:\temp\chrome-debug
```

### 2. Tunnel SSH (PowerShell Windows)
**Important:** Utiliser `-4` pour forcer IPv4
```powershell
ssh -4 -R 9222:localhost:9222 knabo@136.243.92.253
```

### 3. Vérifier la connexion (serveur)
```bash
curl -s http://localhost:9222/json/version
```

### 4. Outils MCP disponibles
- `mcp__chrome-devtools__list_pages` - lister les pages
- `mcp__chrome-devtools__navigate_page` - naviguer
- `mcp__chrome-devtools__take_screenshot` - capture d'écran
- `mcp__chrome-devtools__take_snapshot` - snapshot a11y (texte)
- `mcp__chrome-devtools__list_console_messages` - erreurs console
- `mcp__chrome-devtools__list_network_requests` - requêtes réseau
- `mcp__chrome-devtools__click` - cliquer sur un élément
- `mcp__chrome-devtools__fill` - remplir un champ

---

## Rappel commandes utiles

```bash
# Lancer les tests
npm test

# Lancer l'app Angular
npm start
# -> http://localhost:4200
```
