import { inject, Injectable, signal } from '@angular/core';
import { ID, Query } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { listAllDocuments } from '../../_shared/helpers/appwrite-pagination.helper';
import { isAppwriteException, getAppwriteMessage } from '../../_shared/helpers/appwrite-exception.helper';
import { AuthService } from '../auth/auth.service';

/**
 * Collection ID for friendships in Appwrite
 */
const COLLECTION_FRIENDSHIPS = 'friendships';

/** Collection des profils publics, source des pseudos et avatars. */
const COLLECTION_USERS = 'users';

/**
 * Statut d'une relation.
 *
 * `pending` : demande envoyee, en attente de la reponse du destinataire.
 * `accepted` : les deux personnes sont amies.
 *
 * Il n'existe volontairement pas de `declined` : cf. declineFriendRequest().
 */
export type FriendshipStatus = 'pending' | 'accepted';

export const FRIENDSHIP_PENDING: FriendshipStatus = 'pending';
export const FRIENDSHIP_ACCEPTED: FriendshipStatus = 'accepted';

/**
 * Friend interface representing a friendship document in Appwrite
 */
export interface Friendship {
  /** Appwrite document ID */
  $id: string;
  /** User who sent the request */
  ownerUserId: string;
  /** User who received the request */
  friendUserId: string;
  /** Consentement : 'pending' jusqu'a l'acceptation du destinataire */
  status: FriendshipStatus;
  /** Creation timestamp (ISO string) */
  createdAt: string;
}

/**
 * FriendProfile combined with friendship status
 */
export interface FriendProfile {
  /** Appwrite user ID */
  userId: string;
  /** Display name (nickname) */
  name: string;
  /** Avatar URL */
  avatar?: string;
  /** Whether this user is in the current user's friend list */
  isFriend: boolean;
}

/**
 * Demande recue en attente, enrichie du profil du demandeur pour que la carte
 * affiche un nom plutot qu'un identifiant.
 */
export interface FriendRequest {
  /** Identifiant du document `friendships` a mettre a jour ou supprimer */
  friendshipId: string;
  /** Auteur de la demande */
  requesterUserId: string;
  requesterName: string;
  requesterAvatar?: string;
  createdAt: string;
}

/**
 * FriendService - Manages mutual friendships with an explicit consent step.
 *
 * Le modele repose sur UNE SEULE ligne par relation, portant un `status` :
 * l'acceptation est une simple mise a jour atomique de cette ligne. Deux lignes
 * symetriques auraient introduit un etat incoherent possible (une moitie creee,
 * l'autre non) sans transaction pour s'en proteger.
 *
 * Consequence directe : toute lecture de la liste d'amis doit etre
 * BIDIRECTIONNELLE, puisque la ligne n'existe que dans le sens de la demande
 * initiale.
 */
@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private readonly appwrite = inject(AppwriteService);
  private readonly authService = inject(AuthService);

  /** Signal holding the list of accepted friendships for current user */
  private readonly _friends = signal<Friendship[]>([]);
  readonly friends = this._friends.asReadonly();

  /** Signal holding list of friend profiles (with user data) */
  private readonly _friendProfiles = signal<FriendProfile[]>([]);
  readonly friendProfiles = this._friendProfiles.asReadonly();

  /** Demandes recues en attente de reponse */
  private readonly _pendingRequests = signal<FriendRequest[]>([]);
  readonly pendingRequests = this._pendingRequests.asReadonly();

  /**
   * Get all accepted friends of the current user, in BOTH directions.
   *
   * La ligne n'existe que dans le sens de la demande : filtrer sur `ownerUserId`
   * seul faisait qu'un ami ne voyait jamais dans sa liste la personne qui l'avait
   * ajoute. C'etait un carnet d'adresses prive, pas une amitie.
   *
   * @returns Array of accepted Friendship objects involving the current user
   * @throws Error if the query fails
   */
  async getFriends(): Promise<Friendship[]> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser?.$id) {
        return [];
      }
      const currentUserId = currentUser.$id;

      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_FRIENDSHIPS,
        [
          Query.or([Query.equal('ownerUserId', currentUserId), Query.equal('friendUserId', currentUserId)]),
          Query.equal('status', FRIENDSHIP_ACCEPTED),
        ]
      );

      const friendships = response.documents.map((doc) => this.mapDocumentToFriendship(doc));
      this._friends.set(friendships);

      // Also load friend profiles
      await this.loadFriendProfiles(friendships, currentUserId);

      return friendships;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to get friends: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Liste les demandes RECUES en attente : le destinataire est l'utilisateur
   * courant, et lui seul peut y repondre.
   */
  async getPendingRequests(): Promise<FriendRequest[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      this._pendingRequests.set([]);
      return [];
    }

    try {
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_FRIENDSHIPS,
        [Query.equal('friendUserId', currentUser.$id), Query.equal('status', FRIENDSHIP_PENDING)]
      );

      const friendships = response.documents.map((doc) => this.mapDocumentToFriendship(doc));
      const profiles = await this.loadProfilesByIds(friendships.map((f) => f.ownerUserId));

      const requests: FriendRequest[] = friendships.map((friendship) => {
        const profile = profiles.get(friendship.ownerUserId);
        return {
          friendshipId: friendship.$id,
          requesterUserId: friendship.ownerUserId,
          requesterName: profile?.name || friendship.ownerUserId,
          requesterAvatar: profile?.avatar,
          createdAt: friendship.createdAt,
        };
      });

      this._pendingRequests.set(requests);
      return requests;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to get friend requests: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Accepte une demande recue : une seule mise a jour, sur la ligne existante.
   *
   * @param friendshipId - Identifiant du document `friendships`
   */
  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    // Garde d'authentification : sans session, l'ecriture echouerait cote
    // Appwrite avec une erreur bien moins parlante.
    this.requireCurrentUserId();

    let friendship: Friendship;
    try {
      const document = await this.appwrite.databases.updateDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: friendshipId,
        data: { status: FRIENDSHIP_ACCEPTED },
      });
      friendship = this.mapDocumentToFriendship(document);
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to accept friend request: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }

    this._pendingRequests.update((requests) => requests.filter((r) => r.friendshipId !== friendshipId));

    // Rechargement complet : c'est ce qui fait apparaitre le nouvel ami dans la
    // liste, profil compris.
    await this.getFriends();

    return friendship;
  }

  /**
   * Refuse une demande recue en SUPPRIMANT la ligne.
   *
   * Choix delibere, plutot qu'un statut `declined` : une ligne `declined`
   * resterait detectee comme doublon par findExistingFriendship, et la personne
   * refusee ne pourrait alors PLUS JAMAIS redemander — un refus deviendrait un
   * bannissement definitif et invisible. La suppression remet simplement les
   * deux comptes dans leur etat initial.
   *
   * @param friendshipId - Identifiant du document `friendships`
   */
  async declineFriendRequest(friendshipId: string): Promise<void> {
    this.requireCurrentUserId();

    try {
      await this.appwrite.databases.deleteDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: friendshipId,
      });
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to decline friend request: ${
          appwriteError || (error instanceof Error ? error.message : 'Unknown error')
        }`
      );
    }

    this._pendingRequests.update((requests) => requests.filter((r) => r.friendshipId !== friendshipId));
  }

  /**
   * Envoie une demande d'ami : cree UNE ligne `pending`.
   *
   * C'est le seul point de creation d'une relation, quelle que soit la voie
   * d'entree (pseudo, QR affiche, QR scanne) : le controle des doublons et
   * l'ecriture du statut ne peuvent donc pas etre oublies dans une branche.
   *
   * @param friendUserId - Destinataire de la demande
   * @throws Error si auto-ajout ou relation deja existante (cle de traduction)
   */
  async sendFriendRequest(friendUserId: string): Promise<Friendship> {
    const currentUserId = this.requireCurrentUserId();

    if (friendUserId === currentUserId) {
      throw new Error('Cannot add yourself as a friend');
    }

    const existing = await this.findExistingFriendship(currentUserId, friendUserId);
    if (existing) {
      throw new Error(this.duplicateMessageKey(existing, currentUserId));
    }

    let friendship: Friendship;
    try {
      const document = await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: ID.unique(),
        data: {
          ownerUserId: currentUserId,
          friendUserId: friendUserId,
          // Toujours ecrit explicitement : le defaut cote schema est `accepted`,
          // herite du modele d'ajout immediat. L'omettre creerait une amitie
          // sans consentement.
          status: FRIENDSHIP_PENDING,
          createdAt: new Date().toISOString(),
        },
      });
      friendship = this.mapDocumentToFriendship(document);
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 409) {
        throw new Error('friends.errorAlreadyRequested');
      }
      throw new Error(
        `Failed to add friend: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }

    // La ligne n'entre PAS dans _friends : elle est `pending`, l'ami n'est pas
    // encore un ami. Aucune notification n'est ecrite ici : le destinataire
    // decouvre la demande en lisant lui-meme `friendships` (cf.
    // NotificationService), la seule voie possible sans cle API.
    return friendship;
  }

  /**
   * Load friend profiles with their user data
   *
   * @param friendships - Accepted friendships involving the current user
   * @param currentUserId - Current user, pour savoir quel cote de la ligne lire
   */
  private async loadFriendProfiles(friendships: Friendship[], currentUserId: string): Promise<void> {
    try {
      const otherUserIds = friendships.map((f) => this.otherUserId(f, currentUserId));
      if (otherUserIds.length === 0) {
        this._friendProfiles.set([]);
        return;
      }

      const profiles = await this.loadProfilesByIds(otherUserIds);
      this._friendProfiles.set(
        otherUserIds
          .map((userId) => profiles.get(userId))
          .filter((profile): profile is FriendProfile => profile !== undefined)
      );
    } catch (error: unknown) {
      // Silently fail for profile loading - friendships are still available
      console.warn('[FriendService] Failed to load friend profiles:', error);
    }
  }

  /**
   * Resout les profils publics d'une liste d'identifiants, en une requete.
   *
   * @returns Map userId -> FriendProfile (les identifiants sans profil sont absents)
   */
  private async loadProfilesByIds(userIds: string[]): Promise<Map<string, FriendProfile>> {
    const uniqueIds = Array.from(new Set(userIds.filter((id) => !!id)));
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const queries = uniqueIds.map((id) => Query.equal('$id', id));
    const response = await listAllDocuments(
      this.appwrite.databases,
      this.appwrite.databaseId,
      COLLECTION_USERS,
      queries.length === 1 ? queries : [Query.or(queries)]
    );

    const wanted = new Set(uniqueIds);
    const profiles = new Map<string, FriendProfile>();

    for (const user of response.documents) {
      const userId = user['$id'] as string;
      if (!wanted.has(userId)) {
        continue;
      }
      const record = user as Record<string, unknown>;
      const nickname = record['nickname'] as string | null;
      const name = (record['name'] as string) || nickname || 'Unknown';

      profiles.set(userId, {
        userId,
        name,
        avatar: record['avatar'] as string | undefined,
        isFriend: true,
      });
    }

    return profiles;
  }

  /**
   * Search users by nickname (exact or prefix match)
   *
   * @param nickname - Nickname to search for
   * @returns Array of matching users (excluding current user)
   */
  async searchUsersByNickname(nickname: string): Promise<Record<string, unknown>[]> {
    if (!nickname.trim()) {
      return [];
    }

    try {
      const currentUser = this.authService.currentUser();
      const currentUserId = currentUser?.$id;

      const queries: string[] = [Query.search('nickname', nickname), Query.limit(20)];

      // Exclude current user
      if (currentUserId) {
        queries.push(Query.notEqual('$id', currentUserId));
      }

      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_USERS,
        queries
      );

      return response.documents;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to search users: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Envoie une demande d'ami a partir d'un pseudo.
   *
   * @param nickname - Nickname of the user to add
   * @returns La ligne `pending` creee
   * @throws Error if user not found, already related, or self-add
   */
  async addFriendByNickname(nickname: string): Promise<Friendship> {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      throw new Error('User not authenticated');
    }

    // Search for user by nickname
    const users = await this.searchUsersByNickname(nickname);
    if (users.length === 0) {
      throw new Error('User not found with that nickname');
    }

    // Find exact or first match
    const user = users.find((u) => (u['nickname'] as string)?.toLowerCase() === nickname.toLowerCase()) || users[0];
    const friendUserId = user['$id'] as string;

    return this.sendFriendRequest(friendUserId);
  }

  /**
   * Envoie une demande d'ami a partir d'un payload QR (contient le userId).
   *
   * @param payload - QR payload containing the userId
   * @returns La ligne `pending` creee
   * @throws Error if payload invalid, user not found, already related, or self-add
   */
  async addFriendByQr(payload: string): Promise<Friendship> {
    if (!payload || typeof payload !== 'string') {
      throw new Error('Invalid QR payload');
    }

    // QR payload is the userId
    const friendUserId = payload.trim();

    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      throw new Error('User not authenticated');
    }

    if (friendUserId === currentUser.$id) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if friend exists
    try {
      await this.appwrite.databases.getDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_USERS,
        documentId: friendUserId,
      });
    } catch (error: unknown) {
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 404) {
        throw new Error('User not found');
      }
      throw error;
    }

    return this.sendFriendRequest(friendUserId);
  }

  /**
   * Remove a friend
   *
   * @param friendUserId - ID of the friend to remove
   * @throws Error if removal fails
   */
  async removeFriend(friendUserId: string): Promise<void> {
    const currentUserId = this.requireCurrentUserId();

    // Find existing friendship, dans les deux sens
    const friendship = await this.findExistingFriendship(currentUserId, friendUserId);
    if (!friendship) {
      throw new Error('Not friends with this user');
    }

    try {
      await this.appwrite.databases.deleteDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: friendship.$id,
      });

      // Update local state
      this._friends.update((friends) => friends.filter((f) => f.$id !== friendship.$id));
      this._friendProfiles.update((profiles) => profiles.filter((p) => p.userId !== friendUserId));
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to remove friend: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Cherche une relation existante entre deux utilisateurs, DANS LES DEUX SENS
   * et quel que soit le statut.
   *
   * Sans le sens inverse, A pouvait envoyer une demande a B alors que B en avait
   * deja une en attente vers A : deux lignes pour une seule relation, et une
   * liste d'amis qui affiche deux fois la meme personne apres acceptation.
   *
   * @returns La relation existante, ou null
   */
  private async findExistingFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    try {
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_FRIENDSHIPS,
        [
          Query.or([
            Query.and([Query.equal('ownerUserId', userId1), Query.equal('friendUserId', userId2)]),
            Query.and([Query.equal('ownerUserId', userId2), Query.equal('friendUserId', userId1)]),
          ]),
        ]
      );

      if (response.documents.length > 0) {
        return this.mapDocumentToFriendship(response.documents[0]);
      }

      return null;
    } catch (error: unknown) {
      console.warn('[FriendService] Failed to check friendship:', error);
      return null;
    }
  }

  /**
   * Cle de traduction du refus de doublon.
   *
   * Le message depend du SENS de la ligne existante : quand c'est l'autre qui a
   * demande, l'utilisateur doit etre renvoye vers ses demandes recues, pas
   * simplement informe d'un echec.
   */
  private duplicateMessageKey(existing: Friendship, currentUserId: string): string {
    if (existing.status === FRIENDSHIP_ACCEPTED) {
      return 'friends.errorAlreadyFriends';
    }
    return existing.ownerUserId === currentUserId ? 'friends.errorAlreadyRequested' : 'friends.errorRequestIncoming';
  }

  /** L'autre partie de la relation, quel que soit le sens de la ligne. */
  private otherUserId(friendship: Friendship, currentUserId: string): string {
    return friendship.ownerUserId === currentUserId ? friendship.friendUserId : friendship.ownerUserId;
  }

  private requireCurrentUserId(): string {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      throw new Error('User not authenticated');
    }
    return currentUser.$id;
  }

  /**
   * Map an Appwrite document to a Friendship interface
   *
   * @param doc - The raw Appwrite document
   * @returns A properly typed Friendship object
   */
  private mapDocumentToFriendship(doc: Record<string, unknown>): Friendship {
    const rawStatus = doc['status'];
    return {
      $id: doc['$id'] as string,
      ownerUserId: doc['ownerUserId'] as string,
      friendUserId: doc['friendUserId'] as string,
      // Les lignes anterieures au consentement n'ont pas de statut : elles
      // datent de l'ajout immediat et sont donc bien des amities etablies.
      status: rawStatus === FRIENDSHIP_PENDING ? FRIENDSHIP_PENDING : FRIENDSHIP_ACCEPTED,
      createdAt: doc['createdAt'] as string,
    };
  }

  /**
   * Clear friend data from signals
   */
  clearFriends(): void {
    this._friends.set([]);
    this._friendProfiles.set([]);
    this._pendingRequests.set([]);
  }
}
