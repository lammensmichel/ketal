import { inject, Injectable, signal } from '@angular/core';
import { ID, Query } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { listAllDocuments } from '../../_shared/helpers/appwrite-pagination.helper';
import { isAppwriteException, getAppwriteMessage } from '../../_shared/helpers/appwrite-exception.helper';

/**
 * Collection ID for game members in Appwrite
 */
const COLLECTION_GAME_MEMBERS = 'fug_game_members';

/**
 * Member role type for type safety
 */
export type MemberRole = 'host' | 'player' | 'spectator';

/**
 * Stats for a specific game
 */
export interface GameStats {
  /** Number of sips given to other players */
  sipsGiven: number;
  /** Number of sips taken by this player */
  sipsTaken: number;
  /** Number of games played */
  gamesPlayed: number;
}

/**
 * GameMember interface representing a member document in Appwrite
 */
export interface GameMember {
  /** Appwrite document ID */
  $id: string;
  /** Room ID this member belongs to */
  roomId: string;
  /** FUG user ID (null for guests) */
  userId: string | null;
  /** Guest device ID (null for authenticated users) */
  deviceId: string | null;
  /** Display name shown in the game */
  displayName: string;
  /** Member role: host, player, or spectator */
  role: MemberRole;
  /** Whether the member is currently online */
  isOnline: boolean;
  /** Total sips given across all games */
  totalSipsGiven: number;
  /** Total sips taken across all games */
  totalSipsTaken: number;
  /** Total number of games played */
  totalGamesPlayed: number;
  /** Last seen timestamp (ISO string) */
  lastSeenAt?: string;
  /** Per-game statistics keyed by game ID */
  gameStats: {
    [gameId: string]: GameStats;
  };
}

/**
 * Data structure for creating a new member (without Appwrite-generated fields)
 */
export type CreateMemberData = Omit<GameMember, '$id'>;

/**
 * MemberService - Manages game room member operations with Appwrite backend
 *
 * Provides CRUD operations for game members including:
 * - Creating and deleting members
 * - Querying members by room, user, or device
 * - Managing member stats (sips given/taken, games played)
 * - Tracking online status
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly appwrite = inject(AppwriteService);

  /** Signal holding the list of members in the current room */
  private readonly _members = signal<GameMember[]>([]);

  /** Public readonly signal for members list */
  readonly members = this._members.asReadonly();

  /** Signal holding the current user's member record */
  private readonly _currentMember = signal<GameMember | null>(null);

  /** Public readonly signal for current member */
  readonly currentMember = this._currentMember.asReadonly();

  /**
   * Create a new member in a game room
   *
   * @param data - Member data without the Appwrite document ID
   * @returns The created GameMember with its assigned ID
   * @throws Error if the member creation fails
   */
  async createMember(data: CreateMemberData): Promise<GameMember> {
    try {
      // Prepare data for Appwrite - convert gameStats to JSON string for storage
      const documentData = {
        ...data,
        gameStats: JSON.stringify(data.gameStats),
      };

      const document = await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_GAME_MEMBERS,
        documentId: ID.unique(),
        data: documentData,
      });

      const member = this.mapDocumentToMember(document);

      // Add to members signal
      this._members.update((members) => [...members, member]);

      return member;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      const errorCode = isAppwriteException(error) ? error.code : null;
      if (errorCode === 400) {
        throw new Error(`Failed to create member: ${appwriteError || 'Invalid member data'}`);
      }
      if (errorCode === 409) {
        throw new Error(`Failed to create member: ${appwriteError || 'Member already exists'}`);
      }
      throw new Error(`Failed to create member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all members in a specific room
   *
   * @param roomId - The room ID to query members for
   * @returns Array of GameMember objects
   * @throws Error if the query fails
   */
  async getMembersByRoom(roomId: string): Promise<GameMember[]> {
    try {
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_GAME_MEMBERS,
        [Query.equal('roomId', roomId)]
      );

      const members = response.documents.map((doc) => this.mapDocumentToMember(doc));

      // Update members signal
      this._members.set(members);

      return members;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to get members for room: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Find a member by user ID or device ID in a specific room
   *
   * Used to check if a user/guest has already joined a room.
   *
   * @param roomId - The room ID to search in
   * @param userId - Optional FUG user ID to search for
   * @param deviceId - Optional guest device ID to search for
   * @returns The found GameMember or null if not found
   * @throws Error if the query fails
   */
  async getMemberByUserOrDevice(roomId: string, userId?: string, deviceId?: string): Promise<GameMember | null> {
    if (!userId && !deviceId) {
      return null;
    }

    try {
      // Build queries based on provided identifiers
      const queries = [Query.equal('roomId', roomId), Query.limit(1)];

      // Try to find by userId first if provided
      if (userId) {
        const userResponse = await this.appwrite.databases.listDocuments({
          databaseId: this.appwrite.databaseId,
          collectionId: COLLECTION_GAME_MEMBERS,
          queries: [...queries, Query.equal('userId', userId)],
        });

        if (userResponse.documents.length > 0) {
          return this.mapDocumentToMember(userResponse.documents[0]);
        }
      }

      // Try to find by deviceId if provided and userId search failed
      if (deviceId) {
        const deviceResponse = await this.appwrite.databases.listDocuments({
          databaseId: this.appwrite.databaseId,
          collectionId: COLLECTION_GAME_MEMBERS,
          queries: [...queries, Query.equal('deviceId', deviceId)],
        });

        if (deviceResponse.documents.length > 0) {
          return this.mapDocumentToMember(deviceResponse.documents[0]);
        }
      }

      return null;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to find member: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Update a member's properties
   *
   * @param memberId - The Appwrite document ID of the member
   * @param updates - Partial member data to update
   * @returns The updated GameMember
   * @throws Error if the update fails
   */
  async updateMember(memberId: string, updates: Partial<Omit<GameMember, '$id'>>): Promise<GameMember> {
    try {
      // Handle gameStats serialization if present
      const documentUpdates = { ...updates } as Record<string, unknown>;
      if (updates.gameStats) {
        documentUpdates['gameStats'] = JSON.stringify(updates.gameStats);
      }

      const document = await this.appwrite.databases.updateDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_GAME_MEMBERS,
        documentId: memberId,
        data: documentUpdates,
      });

      const member = this.mapDocumentToMember(document);

      // Update in members signal
      this._members.update((members) => members.map((m) => (m.$id === memberId ? member : m)));

      // Update current member if it's the same
      if (this._currentMember()?.$id === memberId) {
        this._currentMember.set(member);
      }

      return member;
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to update member: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Update a member's game statistics
   *
   * Merges the provided stats into the member's gameStats for the specified game
   * and updates the total counters accordingly.
   *
   * @param memberId - The Appwrite document ID of the member
   * @param gameId - The game identifier (e.g., 'ketal')
   * @param stats - The stats to merge for this game
   * @throws Error if the update fails
   */
  async updateMemberStats(memberId: string, gameId: string, stats: GameStats): Promise<void> {
    try {
      // Get current member data
      const document = await this.appwrite.databases.getDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_GAME_MEMBERS,
        documentId: memberId,
      });

      const currentMember = this.mapDocumentToMember(document);

      // Get previous stats for this game (if any)
      const previousStats = currentMember.gameStats[gameId] || {
        sipsGiven: 0,
        sipsTaken: 0,
        gamesPlayed: 0,
      };

      // Calculate deltas
      const deltaGiven = stats.sipsGiven - previousStats.sipsGiven;
      const deltaTaken = stats.sipsTaken - previousStats.sipsTaken;
      const deltaGames = stats.gamesPlayed - previousStats.gamesPlayed;

      // Merge stats into gameStats
      const updatedGameStats = {
        ...currentMember.gameStats,
        [gameId]: stats,
      };

      // Update totals
      const updates = {
        gameStats: updatedGameStats,
        totalSipsGiven: currentMember.totalSipsGiven + deltaGiven,
        totalSipsTaken: currentMember.totalSipsTaken + deltaTaken,
        totalGamesPlayed: currentMember.totalGamesPlayed + deltaGames,
      };

      await this.updateMember(memberId, updates);
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to update member stats: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Delete a member from the database
   *
   * @param memberId - The Appwrite document ID of the member to delete
   * @throws Error if the deletion fails
   */
  async deleteMember(memberId: string): Promise<void> {
    try {
      await this.appwrite.databases.deleteDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_GAME_MEMBERS,
        documentId: memberId,
      });

      // Remove from members signal
      this._members.update((members) => members.filter((m) => m.$id !== memberId));

      // Clear current member if it's the same
      if (this._currentMember()?.$id === memberId) {
        this._currentMember.set(null);
      }
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to delete member: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Update a member's online status
   *
   * @param memberId - The Appwrite document ID of the member
   * @param isOnline - Whether the member is online
   * @throws Error if the update fails
   */
  async setOnlineStatus(memberId: string, isOnline: boolean): Promise<void> {
    try {
      await this.updateMember(memberId, { isOnline });
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to set online status: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Get all members for a specific userId (across all rooms)
   */
  async getMembersByUserId(userId: string): Promise<GameMember[]> {
    try {
      const response = await listAllDocuments(
        this.appwrite.databases,
        this.appwrite.databaseId,
        COLLECTION_GAME_MEMBERS,
        [Query.equal('userId', userId)]
      );
      return response.documents.map((doc) => this.mapDocumentToMember(doc));
    } catch (error: unknown) {
      const appwriteError = getAppwriteMessage(error);
      throw new Error(
        `Failed to get members by userId: ${appwriteError || (error instanceof Error ? error.message : 'Unknown error')}`
      );
    }
  }

  /**
   * Update current member's online status
   */
  async updateRoom(_role: string): Promise<void> {
    const current = this._currentMember();
    if (!current) {
      return;
    }

    await this.updateMember(current.$id, {
      isOnline: true,
      lastSeenAt: new Date().toISOString(),
    });
  }

  /**
   * Set the current member directly
   *
   * @param member - The member to set as current, or null to clear
   */
  setCurrentMember(member: GameMember | null): void {
    this._currentMember.set(member);
  }

  /**
   * Clear all members from the signal
   *
   * Useful when leaving a room or resetting state.
   */
  clearMembers(): void {
    this._members.set([]);
    this._currentMember.set(null);
  }

  /**
   * Map an Appwrite document to a GameMember interface
   *
   * Handles JSON parsing of the gameStats field.
   *
   * @param doc - The raw Appwrite document
   * @returns A properly typed GameMember object
   */
  private mapDocumentToMember(doc: Record<string, unknown>): GameMember {
    // Parse gameStats from JSON string if stored as string
    let gameStats: { [gameId: string]: GameStats } = {};
    const rawGameStats = doc['gameStats'];

    if (typeof rawGameStats === 'string') {
      try {
        gameStats = JSON.parse(rawGameStats);
      } catch {
        gameStats = {};
      }
    } else if (rawGameStats && typeof rawGameStats === 'object') {
      gameStats = rawGameStats as { [gameId: string]: GameStats };
    }

    return {
      $id: doc['$id'] as string,
      roomId: doc['roomId'] as string,
      userId: (doc['userId'] as string) || null,
      deviceId: (doc['deviceId'] as string) || null,
      displayName: doc['displayName'] as string,
      role: (doc['role'] as MemberRole) || 'player',
      isOnline: (doc['isOnline'] as boolean) ?? false,
      totalSipsGiven: (doc['totalSipsGiven'] as number) || 0,
      totalSipsTaken: (doc['totalSipsTaken'] as number) || 0,
      totalGamesPlayed: (doc['totalGamesPlayed'] as number) || 0,
      gameStats,
    };
  }
}
