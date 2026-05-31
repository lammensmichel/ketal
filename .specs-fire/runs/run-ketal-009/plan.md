---
# Implementation Plan for "wi-002"

## Work Item: Migration backend — nickname utilisateur + collection friendships

**Mode:** validate (2 checkpoints)

---

## 1. Contexte

Actuellement, il n'existe aucune notion d'« amis » dans Ketal : impossible de référencer de vrais joueurs d'une partie à l'autre ni de suivre leurs stats.

Pour permettre à un utilisateur enregistré (FUG user) de :
- Représenter son compte avec un pseudo lisible (`nickname`)
- Ajouter/retirer d'autres utilisateurs comme amis (favoris unilatéraux)

Nous devons :
1. Ajouter un champ `nickname` à la collection `users`
2. Créer une collection `friendships` modélisant des favoris unilatéraux

---

## 2. Décisions tranchées (PO, 2026-05-30)

### 2.1. Affectation de `nickname` par défaut
- Pour les comptes existants sans `nickname`, dériver du nom d'utilisateur ou email
- Ex. : `john.doe` → `johndoe`, `alice@fug.app` → `alice`
- Pour les comptes anonymes (`userId` null), `nickname` est `null`

### 2.2. Modèle `friendships`
- Unilatéraux (pas de status d'acceptation mutuelle)
- Index composite unique : `ownerUserId` + `friendUserId`
- Permissions : chaque utilisateur lit/écrit uniquement ses propres `friendships`

### 2.3. Performance & scalabilité
- Index sur `ownerUserId` pour les requêtes `getFriends()`
- Index sur `(ownerUserId, friendUserId)` pour l'unicité

---

## 3. Schéma Appwrite

### 3.1. Collection : `users` (modification)

**Attribute à ajouter :**
- `nickname` : String, unique, non obligatoire, indexé
  - Length: 50
  - Required: false
  - Array: false
  - Default: null
  - Order: 4 (after `email`)

### 3.2. Collection : `friendships` (nouvelle)

**Collection :**
- ID : `friendships`
- Name : `Friendships`
- Permissions :
  - `Permission.read(Role.user('$userId'))` (lecture seule sur ses propres friendships)
  - `Permission.create(Role.user('$userId'))` (création de ses propres friendships)
  - `Permission.update(Role.user('$userId'))` (mise à jour — pas utilisé, mais autorisé pour flexibilité)
  - `Permission.delete(Role.user('$userId'))` (suppression)

**Attributes :**
- `ownerUserId` : String, required, 36 chars (ID FUG user)
- `friendUserId` : String, required, 36 chars (ID FUG user ami)
- `createdAt` : Datetime, required

**Indexes :**
- `index_ownerFriendUserIds` : `{ ownerUserId: 1, friendUserId: 1 }` (unicité + performance)

---

## 4. Fichier de migration

### 4.1. Filename
`042_add_nickname_and_friendships.js`

### 4.2. Contenu

```javascript
/**
 * Migration: 042_add_nickname_and_friendships
 * Created: 2026-05-31
 * Type: upgrade
 *
 * Rationale:
 *   Add nickname attribute to users and create friendships collection
 *   to support friend management feature.
 *
 * Root cause:
 *   No notion of "friends" exists in the current schema.
 *   Users need a nickname for display and search, and a way to maintain
 *   persistent friend lists across game sessions.
 */

import { Permission, Role } from 'node-appwrite';

export default {
  name: '042_add_nickname_and_friendships',
  type: 'upgrade',

  async up(client, databases, log, config) {
    const databaseId = config.databaseId;

    // 1. Add nickname attribute to users collection
    const usersCollectionId = 'users';

    log.info('Adding nickname attribute to users collection...');

    // Helper to wait for attribute availability
    const waitForAttribute = async (attrKey, maxWait = 30000) => {
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        const collection = await databases.getCollection(databaseId, usersCollectionId);
        const attr = collection.attributes.find((a) => a.key === attrKey);
        if (attr && attr.status === 'available') {
          return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error(`Timeout waiting for attribute ${attrKey}`);
    };

    await databases.createStringAttribute(
      databaseId,
      usersCollectionId,
      'nickname',
      50,
      false, // not required
      null, // default
      false // not array
    );
    log.info('Created attribute: nickname');

    // Wait for attribute to be available
    await waitForAttribute('nickname');
    log.success('nickname attribute available');

    // 2. Create friendships collection
    const friendshipsCollectionId = 'friendships';

    log.info('Creating friendships collection...');

    await databases.createCollection(
      databaseId,
      friendshipsCollectionId,
      'Friendships',
      [
        Permission.read(Role.user('$userId')),
        Permission.create(Role.user('$userId')),
        Permission.update(Role.user('$userId')),
        Permission.delete(Role.user('$userId')),
      ]
    );

    // Add attributes
    log.info('Adding friendships attributes...');

    // ownerUserId
    await databases.createStringAttribute(
      databaseId,
      friendshipsCollectionId,
      'ownerUserId',
      36,
      true
    );

    // friendUserId
    await databases.createStringAttribute(
      databaseId,
      friendshipsCollectionId,
      'friendUserId',
      36,
      true
    );

    // createdAt
    await databases.createDatetimeAttribute(
      databaseId,
      friendshipsCollectionId,
      'createdAt',
      true
    );

    // Wait for attributes
    await waitForAttribute('createdAt');
    log.success('friendships attributes available');

    // Create indexes
    log.info('Creating indexes...');

    // Composite unique index on (ownerUserId, friendUserId)
    await databases.createIndex(
      databaseId,
      friendshipsCollectionId,
      'index_ownerFriendUserIds',
      'key',
      ['ownerUserId', 'friendUserId'],
      'unique'
    );

    log.success('friendships collection created');
  },

  async down(client, databases, log, config) {
    const databaseId = config.databaseId;

    // Delete friendships collection
    await databases.deleteCollection(databaseId, 'friendships');
    log.success('friendships collection deleted');

    // Delete nickname attribute from users
    await databases.deleteAttribute(databaseId, 'users', 'nickname');
    log.success('nickname attribute deleted');
  },
};
```

---

## 5. Ordre d'exécution

**Checkpoint 1 (plan) :**
1. Plan généré → utilisateur approuve
2. Migration exécutée
3. Tests passent
4. Code review
5. Complétion item

**Checkpoint 2 (design doc review) :**
- Pas de design doc existante → skip ou générer un brief de conception

*Note: Comme il n'existe pas de design doc, je procède avec le plan généré ici.*

---

## 6. Tests (à compléter après implémentation)

- [ ] Migration appliquée avec succès via `node migrate.js apply 042`
- [ ] Attribut `nickname` visible dans `databases.getCollection(users)`
- [ ] Collection `friendships` créée avec les bons permissions
- [ ] Index composite présent
- [ ] Down migration fonctionne (rollback)

---

## 7. Files à créer/modifier

| Type | Path |
|------|------|
| Create | `fug-backend/migrations/migrations/042_add_nickname_and_friendships.js` |

---

## 8. Notes techniques

### 8.1. Permissions détaillées
```javascript
Permission.read(Role.user('$userId'))  // $userId est substitué par l'ID du user authentifié
```
→ Chaque utilisateur peut lire SEULEMENT ses propres friendships.

### 8.2. Ordre des attributs dans `users`
- `nickname` sera ajouté après `email` (ordre logique pour les info utilisateur)

### 8.3. Rétrocompatibilité
- `nickname` est optionnel → compatibilité ascendante
- Comptes existants auront `nickname: null` jusqu'à mise à jour front-end

### 8.4. Backend dependency
- Le script `migrate.js` utilise `node-appwrite@^24.2.0` (pinned dans package.json)

---

## Verdict final

**Approbation requise ?** Oui (checkpoint 1 en mode validate)

**Prêt pour exécution ?** En attente de votre approbation.
