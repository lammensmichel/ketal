# AGENTS.md — Ketal Project Agent Instructions

## Start Restart Angular via Official Script

Use `/workspaces/src/ketal/start-angular.sh` to start or restart Angular in the dev container. This script handles process cleanup correctly — no manual `pkill -f "ng serve"` is needed.

```bash
# Start (killing any existing server)
bash /workspaces/src/ketal/start-angular.sh

# Verify it's running and accessible on localhost:4200
curl -sf http://localhost:4200 | head -c 200
```

After restarting, wait ~15 seconds for the dev server to stabilize before running tests or E2E scenarios.

## Project Context
- Angular 19 application
- Backend: Appwrite
- Card game "La Grosse Quinze"

## Code Standards
- TypeScript strict mode
- Angular standalone components preferred
- SCSS for styling
- Follow existing component patterns and naming conventions

## Project Structure
- `src/app/_components/` — Feature components
- `src/app/_shared/` — Shared components, helpers, models
- `src/app/services/` — Application services
- `src/environments/` — Environment configs

## Testing

### Dedicated Test User for Appwrite Integration Tests

All integration specs (files ending in `.integration.spec.ts`) **MUST** authenticate as the dedicated test user before performing any Appwrite database operations. Anonymous sessions lack permissions on game-related collections and will cause 401 failures during teardown.

```typescript
const TEST_USER_EMAIL = 'test+integration@fug.app';
const TEST_USER_PASSWORD = 'K3tal-Test!2026';

// In beforeAll():
await appwriteService.account.createEmailPasswordSession({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

// In afterAll() (optional cleanup):
appwriteService.account.deleteSession({ sessionId: 'current' });
```

This user is provisioned by fug-backend migration `040_create_test_user.js` with full CRUD permissions on all collections. It is **persistent** — do not create ephemeral users in individual specs unless required.

### Unit Tests (Jasmine + Karma)

```bash
# Run all tests
npm test

# With explicit Chromium binary inside the dev container
CHROME_BIN=/usr/bin/chromium npm test -- --no-progress --browsers=ChromeHeadlessNoSandbox

# Watch mode (with --poll equivalent — file changes are polled by Angular dev server)
npx ng test --watch=true --browsers=ChromeHeadlessNoSandbox
```

> **[Chromium binary name]** The container has `chromium` (not `chrome`). Karma looks for a binary named `chrome` by default. Set `CHROME_BIN=/usr/bin/chromium` if tests fail with "No binary for Chrome browser".
>
> **[headless no-sandbox]** Tests in Docker **must** use `--no-sandbox --disable-dev-shm-usage --headless=new`. A custom launcher `ChromeHeadlessNoSandbox` is defined in `karma.conf.js`. Never use `browsers: ['Chrome']` — it overrides the custom launcher with the default Chrome (which crashes as root). Make sure only one `browsers:` key exists in `karma.conf.js` (a duplicate `['Chrome']` would silently override).

### E2E Tests
Use Chrome MCP tools for automated browser automation. The host Mac Chrome (debugged on port `9225`) is used — see `AGENTS.md` section "Chrome Remote Debug".

## Linting & Formatting
- ESLint + Prettier
- `npm run lint:fix` — fix lint issues
- `npm run format` — format code

## Appwrite — Règles Absolues

> Ces règles existent parce que des sous-agents ont déjà écrasé des permissions de collections en production locale et cassé toute l'app. Lis-les avant de toucher à Appwrite.

### 1. Toujours consulter la documentation officielle

Dès que tu touches au SDK Appwrite (création de document, requête, permission, fonction cloud, realtime, storage…), **consulte la doc en ligne avant de coder** :

- **Web (Angular/TS)** : <https://appwrite.io/docs/references/cloud/client-web> (méthodes côté client)
- **Server (Node)** : <https://appwrite.io/docs/references/cloud/server-nodejs> (migrations, scripts)
- **Permissions** : <https://appwrite.io/docs/advanced/platform/permissions>
- **Realtime** : <https://appwrite.io/docs/apis/realtime>

**Interdit** : inventer une signature, un helper, ou un endpoint sans l'avoir vérifié dans la doc. Si tu n'es pas sûr, fetch la page (WebFetch) avant d'écrire le code. Les hallucinations historiques à éviter :

- `database.deleteGrant()` n'existe pas
- `client.call('patch', ...)` n'est pas une API publique — utilise `databases.updateCollection(...)`
- `_metadata` collection magique : n'existe pas en Appwrite cloud
- `Utopia\Database` : namespace serveur interne, jamais à utiliser depuis un client

### 2. Permissions — Ne JAMAIS écraser sans merger

`databases.updateCollection(databaseId, collectionId, name, permissions)` **remplace intégralement** l'array de permissions existant. Avant tout appel :

1. **Lis l'état actuel** : `await databases.getCollection(databaseId, collectionId)` → récupère `.permissions`
2. **Merge** : combine l'array existant avec tes nouvelles permissions, sans dupliquer
3. **Garde-fou** : si l'array existant est vide alors que tu t'attendais à des valeurs, **STOP** — c'est probablement un bug d'une migration précédente, ne masque pas en réécrivant tout

```javascript
// ✅ Bon pattern (merge + garde-fou)
const collection = await databases.getCollection(databaseId, collId);
const existing = Array.isArray(collection.permissions) ? collection.permissions : [];
if (existing.length === 0) {
  log.warn(`${collId}: empty permissions — investigate before overwriting`);
  return;
}
const merged = [...existing, ...newPerms.filter(p => !existing.includes(p))];
await databases.updateCollection(databaseId, collId, collection.name, merged);
```

### 3. Syntaxe des permissions — uniquement les helpers

Toujours utiliser les helpers `Permission` et `Role` du SDK :

```javascript
import { Permission, Role } from 'node-appwrite';

Permission.read(Role.any())              // lecture publique
Permission.read(Role.users())            // utilisateurs authentifiés (pluriel)
Permission.read(Role.guests())           // sessions anonymes (pluriel)
Permission.read(Role.user(userId))       // user spécifique avec son ID
Permission.create(Role.team(teamId))     // membres d'une team
```

**Inventions interdites** :
- `"create(\"user:\")"` ou `"create(\"guest:\")"` → **invalides** (manque l'ID, mauvaise forme)
- `"read(\"authenticated\")"` → n'existe pas, c'est `Role.users()`
- Strings construites à la main → utilise les helpers, point.

### 4. Object-form params pour tous les appels v17+

Le SDK Appwrite v17+ (et `node-appwrite` v24+) attend des **objets paramètres**, jamais des arguments positionnels :

```typescript
// ✅ Correct
await account.createEmailPasswordSession({ email, password });
await databases.listDocuments({ databaseId, collectionId, queries: [...] });

// ❌ Incorrect (ancien SDK, casse en runtime)
await account.createEmailPasswordSession(email, password);
```

### 5. Ne pas downgrader le SDK

`node-appwrite` est **pinné à `^24.2.0`**. Ne propose pas v25 (compat serveur cassée à la date d'écriture). Vérifie sur npm si tu hésites.

## Création de Migration Appwrite

Les migrations vivent dans `fug-backend/migrations/migrations/`. Avant d'en créer une nouvelle :

### Étape 0 — Diagnostic empirique OBLIGATOIRE (via MCP Appwrite)

Avant d'écrire la moindre ligne de migration "corrective", **vérifie l'état réel via le serveur MCP Appwrite** (configuré dans `opencode.json` sous le nom `appwrite`).

**Préférer le MCP** plutôt que d'écrire un script Node bricolé. Le MCP expose 2 outils :

- `appwrite_search_tools` — cherche dans le catalogue
- `appwrite_call_tool` — exécute l'opération trouvée

**IMPORTANT** : ce MCP utilise l'API **`TablesDB`** d'Appwrite (la nouvelle nomenclature), pas l'ancienne API `Databases`. Les noms sont donc :

| Concept ancien | Concept nouveau (utilisé ici) |
|---|---|
| `databases.listCollections` | `tables_db_list_tables` |
| `databases.getCollection` | `tables_db_get_table` |
| `databases.updateCollection` | `tables_db_update_table` |
| `databases.listDocuments` | `tables_db_list_rows` |
| `databases.createDocument` | `tables_db_create_row` |
| "collection" | **"table"** |
| "document" | **"row"** |
| `collectionId` | **`tableId`** |

Workflow type :

1. `appwrite_call_tool("tables_db_list_tables", { databaseId: "fug" })` → liste toutes les tables
2. `appwrite_call_tool("tables_db_get_table", { databaseId: "fug", tableId: "fug_game_rooms" })` → permissions complètes
3. `appwrite_call_tool("tables_db_update_table", { databaseId: "fug", tableId: "fug_game_rooms", name: "...", permissions: [...] })` → applique le fix

> ⚠️ **Note technique** : le MCP officiel tronque les sorties > 800 chars en preview + URI de resource (`appwrite://operator/results/...`). opencode ne sait pas lire ces URIs (cf. issue `anomalyco/opencode#15535`). Notre config utilise donc un **wrapper** (`/workspaces/src/bin/appwrite-mcp-no-truncate.py`) qui désactive cette troncature. Si tu vois "Full result stored at appwrite://..." dans une réponse, c'est que le wrapper n'a pas été chargé → redémarre opencode.

**Fallback REST** si le MCP ne répond pas :

```bash
APPWRITE_KEY=$(grep ^APPWRITE_API_KEY /workspaces/src/fug-backend/migrations/environments/.env.development | cut -d= -f2)

curl -s "http://127.0.0.1/v1/databases/fug/collections/<collection_id>" \
  -H "X-Appwrite-Project: fug" \
  -H "X-Appwrite-Key: $APPWRITE_KEY" | jq '.permissions, .documentSecurity'
```

**Ne devine pas l'état actuel.** Lis-le.

### Étape 1 — Identifier la cause root

Si une migration précédente a introduit le bug, **corrige-la** plutôt que d'empiler une migration corrective qui masque le problème. Les migrations "fix" sont autorisées seulement si :

1. La cause root est documentée dans le commentaire de tête de la migration
2. La migration buggée a été corrigée elle aussi (pour les nouveaux environnements)
3. La `down()` ne ré-introduit pas le bug

### Étape 2 — Squelette d'une migration

```javascript
/**
 * Migration: NNN_short_description
 * Created: YYYY-MM-DD
 * Type: upgrade
 *
 * Rationale:
 *   <pourquoi cette migration existe — bug fixé, feature ajoutée, etc.>
 *
 * Root cause (si fix):
 *   <référence à la migration buggée + ligne précise>
 */

import { Permission, Role } from 'node-appwrite';

export default {
  name: 'NNN_short_description',
  type: 'upgrade',

  async up(client, databases, log, config) {
    const databaseId = config.databaseId;
    // 1. Read existing state
    // 2. Compute merged/target state
    // 3. Apply via SDK helper (databases.updateCollection / createAttribute / etc.)
    // 4. Log success / warn / skip — never throw on "already in target state"
  },

  async down(client, databases, log, config) {
    // Restore the state that existed BEFORE this migration ran.
    // If reverting would re-introduce a bug, throw with an explicit message
    // instead of silently re-breaking the database.
  },
};
```

### Étape 3 — Tester

```bash
cd /workspaces/src/fug-backend/migrations
node migrate.js apply <NNN>     # appliquer
node migrate.js status          # vérifier
node migrate.js rollback <NNN>  # tester la down()
node migrate.js apply <NNN>     # re-appliquer pour valider l'idempotence
```

**Idempotence** : une migration doit pouvoir être ré-appliquée sans casser quoi que ce soit (idéalement no-op si déjà appliquée).

### Étape 4 — Noms de collections corrects

Les collections Ketal ont **toutes le préfixe `fug_`** (l'infra est partagée FUG/Ketal) :

- `fug_game_rooms`
- `fug_game_members`
- `fug_ketal_sessions`

**Ne pas utiliser** `ketal_sessions` (sans préfixe), `game_rooms` (sans préfixe), etc. Vérifie dans la migration de création (`029_*`, `030_*`, `031_*`) si tu hésites.
