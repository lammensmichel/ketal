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

/**
 * Friend interface representing a friendship document in Appwrite
 */
export interface Friendship {
  /** Appwrite document ID */
  $id: string;
  /** User who added the friend */
  ownerUserId: string;
  /** User who was added as a friend */
  friendUserId: string;
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
 * FriendService - Manages friend relationships (favorites/unilateral follows)
 *
 * Provides CRUD operations for friendships:
 * - List all friends of current user
 * - Add friend by nickname
 * - Add friend via QR payload (userId)
 * - Remove friend
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class FriendService {
  private readonly appwrite = inject(AppwriteService);
  private readonly authService = inject(AuthService);

  /** Signal holding the list of friends for current user */
  private readonly _friends = signal<Friendship[]>([]);
  readonly friends = this._friends.asReadonly();

  /** Signal holding list of friend profiles (with user data) */
  private readonly _friendProfiles = signal<FriendProfile[]>([]);
  readonly friendProfiles = this._friendProfiles.asReadonly();

  /**
   * Get all friends of the current user
   *
   * @returns Array of Friendship objects ( friendships where current user is ownerUserId )
   * @throws Error if the query fails
   */
  async getFriends(): Promise<Friendship[]> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser?.$id) {
        return [];
      }

      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_FRIENDSHIPS,
        [Query.equal('ownerUserId', currentUser.$id)]
      );

      const friendships = response.documents.map((doc) => this.mapDocumentToFriendship(doc));
      this._friends.set(friendships);

      // Also load friend profiles
      await this.loadFriendProfiles(friendships);

      return friendships;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to get friends: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Load friend profiles with their user data
   *
   * @param friendships - Array of friendship documents
   */
  private async loadFriendProfiles(friendships: Friendship[]): Promise<void> {
    try {
      const friendUserIds = friendships.map((f) => f.friendUserId);
      if (friendUserIds.length === 0) {
        this._friendProfiles.set([]);
        return;
      }

      // Query users by ID
      const queries = friendUserIds.map((id) => Query.equal('$id', id));
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        'users',
        queries.length === 1 ? queries : [Query.or(queries)]
      );

      const friendsMap = new Map(friendships.map((f) => [f.friendUserId, f]));
      const profiles: FriendProfile[] = [];

      for (const user of response.documents) {
        const userId = user['$id'] as string;
        const nickname = (user as Record<string, unknown>)['nickname'] as string | null;
        const name = ((user as Record<string, unknown>)['name'] as string) || nickname || 'Unknown';
        const avatar = (user as Record<string, unknown>)['avatar'] as string | undefined;

        profiles.push({
          userId,
          name,
          avatar,
          isFriend: friendsMap.has(userId),
        });
      }

      this._friendProfiles.set(profiles);
    } catch (error: unknown) {
      // Silently fail for profile loading - friendships are still available
      console.warn('[FriendService] Failed to load friend profiles:', error);
    }
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

      const response = await listAllDocuments(this.appwrite.databases, this.appwrite.databaseId, 'users', queries);

      return response.documents;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to search users: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Add a friend by their nickname
   *
   * @param nickname - Nickname of the user to add
   * @returns The created Friendship document
   * @throws Error if user not found, already friends, or self-add
   */
  async addFriendByNickname(nickname: string): Promise<Friendship> {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      throw new Error('User not authenticated');
    }

    const currentUserId = currentUser.$id;

    // Search for user by nickname
    const users = await this.searchUsersByNickname(nickname);
    if (users.length === 0) {
      throw new Error('User not found with that nickname');
    }

    // Find exact or first match
    const user = users.find((u) => (u['nickname'] as string)?.toLowerCase() === nickname.toLowerCase()) || users[0];
    const friendUserId = user['$id'] as string;

    // Check for self-add
    if (friendUserId === currentUserId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if already friends
    const existing = await this.findExistingFriendship(currentUserId, friendUserId);
    if (existing) {
      throw new Error('Already friends with this user');
    }

    // Create friendship document
    try {
      const document = await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: ID.unique(),
        data: {
          ownerUserId: currentUserId,
          friendUserId: friendUserId,
          createdAt: new Date().toISOString(),
        },
      });

      const friendship = this.mapDocumentToFriendship(document);

      // Update local state
      this._friends.update((friends) => [...friends, friendship]);

      return friendship;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 409) {
        throw new Error('Already friends with this user');
      }
      throw new Error(
        `Failed to add friend: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Add a friend via QR payload (contains userId)
   *
   * @param payload - QR payload containing the userId
   * @returns The created Friendship document
   * @throws Error if payload invalid, user not found, already friends, or self-add
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

    const currentUserId = currentUser.$id;

    // Check for self-add
    if (friendUserId === currentUserId) {
      throw new Error('Cannot add yourself as a friend');
    }

    // Check if friend exists
    try {
      await this.appwrite.databases.getDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: 'users',
        documentId: friendUserId,
      });
    } catch (error: unknown) {
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 404) {
        throw new Error('User not found');
      }
      throw error;
    }

    // Check if already friends
    const existing = await this.findExistingFriendship(currentUserId, friendUserId);
    if (existing) {
      throw new Error('Already friends with this user');
    }

    // Create friendship document
    try {
      const document = await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_FRIENDSHIPS,
        documentId: ID.unique(),
        data: {
          ownerUserId: currentUserId,
          friendUserId: friendUserId,
          createdAt: new Date().toISOString(),
        },
      });

      const friendship = this.mapDocumentToFriendship(document);

      // Update local state
      this._friends.update((friends) => [...friends, friendship]);

      return friendship;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 409) {
        throw new Error('Already friends with this user');
      }
      throw new Error(
        `Failed to add friend: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Remove a friend
   *
   * @param friendUserId - ID of the friend to remove
   * @throws Error if removal fails
   */
  async removeFriend(friendUserId: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.$id) {
      throw new Error('User not authenticated');
    }

    const currentUserId = currentUser.$id;

    // Find existing friendship
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
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to remove friend: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Check if two users are already friends
   *
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns The existing friendship document or null
   */
  private async findExistingFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    try {
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_FRIENDSHIPS,
        [Query.equal('ownerUserId', userId1), Query.equal('friendUserId', userId2)]
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
   * Map an Appwrite document to a Friendship interface
   *
   * @param doc - The raw Appwrite document
   * @returns A properly typed Friendship object
   */
  private mapDocumentToFriendship(doc: Record<string, unknown>): Friendship {
    return {
      $id: doc['$id'] as string,
      ownerUserId: doc['ownerUserId'] as string,
      friendUserId: doc['friendUserId'] as string,
      createdAt: doc['createdAt'] as string,
    };
  }

  /**
   * Clear friend data from signals
   */
  clearFriends(): void {
    this._friends.set([]);
    this._friendProfiles.set([]);
  }
}
