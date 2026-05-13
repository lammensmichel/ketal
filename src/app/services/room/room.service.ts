import { inject, Injectable, Optional, signal } from '@angular/core';
import { ID, Query } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService, SubscriptionCallback } from '../realtime/realtime.service';
import { MemberService } from '../member/member.service';
import { AuthService } from '../auth/auth.service';

/**
 * Collection ID for game rooms in Appwrite
 */
const COLLECTION_GAME_ROOMS = 'fug_game_rooms';

/**
 * Room status enum for type safety
 */
export type RoomStatus = 'idle' | 'playing' | 'archived';

/**
 * Room mode enum for type safety
 */
export type RoomMode = 'local' | 'multiplayer' | 'solo';

/**
 * GameRoom interface representing a game room document in Appwrite
 */
export interface GameRoom {
  /** Appwrite document ID */
  $id: string;
  /** Display name for the room */
  name: string;
  /** 6-character uppercase code for joining */
  code: string;
  /** UUID for invite URL */
  inviteToken: string;
  /** Current active game ID (null if no game in progress) */
  currentGameId: string | null;
  /** Current session ID (null if no session) */
  currentSessionId: string | null;
  /** Room status: idle, playing, or archived */
  status: RoomStatus;
  /** Member ID of the room host */
  hostMemberId: string;
  /** Game mode: local or multiplayer */
  mode: RoomMode;
  /** Maximum number of players allowed */
  maxPlayers: number;
  /** Total number of games played in this room */
  gamesPlayed: number;
  /** Whether the room is archived */
  archived?: boolean;
  /** Last update timestamp (ISO string from Appwrite) */
  $updatedAt?: string;
}

/**
 * GameRoomWithMemberCount interface extending GameRoom with member count
 */
export interface GameRoomWithMemberCount extends GameRoom {
  memberCount: number;
}

/**
 * Data structure for creating a new room (without Appwrite-generated fields)
 */
interface CreateRoomData {
  name: string;
  code: string;
  inviteToken: string;
  currentGameId: string | null;
  currentSessionId: string | null;
  status: RoomStatus;
  hostMemberId: string;
  mode: RoomMode;
  maxPlayers: number;
  gamesPlayed: number;
}

/**
 * RoomService - Manages game room operations with Appwrite backend
 *
 * Provides CRUD operations for game rooms including:
 * - Creating new rooms with unique codes
 * - Joining rooms via code or invite token
 * - Room lifecycle management (leave, delete)
 * - Querying rooms by various criteria
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable()
export class RoomService {
  private readonly appwrite = inject(AppwriteService);
  private readonly realtime = inject(RealtimeService);
  private readonly memberService = inject(MemberService);
  @Optional() private readonly authService = inject(AuthService);

  /** Signal holding the current room the user is in */
  private readonly _currentRoom = signal<GameRoom | null>(null);

  /** Public readonly signal for current room state */
  readonly currentRoom = this._currentRoom.asReadonly();

  /**
   * Create a solo room for backend-first game sessions.
   * Auto-generates a name, uses 'solo' mode, no invite needed.
   * Called in background after login while user adds player names.
   */
  async createSoloRoom(): Promise<GameRoom> {
    const name = `Solo-${Date.now()}`;
    return this.createRoom(name, 'solo', 10);
  }

  /**
   * Create a new game room
   */
  async createRoom(name: string, mode: RoomMode = 'multiplayer', maxPlayers = 10): Promise<GameRoom> {
    const roomData: CreateRoomData = {
      name,
      code: this.generateRoomCode(),
      inviteToken: this.generateInviteToken(),
      currentGameId: null,
      currentSessionId: null,
      status: 'idle',
      hostMemberId: '',
      mode,
      maxPlayers,
      gamesPlayed: 0,
    };

    try {
      const document = await this.appwrite.databases.createDocument(
        this.appwrite.databaseId,
        COLLECTION_GAME_ROOMS,
        ID.unique(),
        roomData
      );

      const room = this.mapDocumentToGameRoom(document);
      this._currentRoom.set(room);
      return room;
    } catch (error) {
      throw new Error(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Join an existing room by its code
   */
  async joinRoom(code: string): Promise<GameRoom> {
    const room = await this.getRoomByCode(code);

    if (!room) {
      throw new Error('Room not found. Please check the code and try again.');
    }

    this._currentRoom.set(room);
    return room;
  }

  /**
   * Delete a room from the database
   */
  async deleteRoom(roomId: string): Promise<void> {
    try {
      await this.appwrite.databases.deleteDocument(this.appwrite.databaseId, COLLECTION_GAME_ROOMS, roomId);

      if (this._currentRoom()?.$id === roomId) {
        this._currentRoom.set(null);
      }
    } catch (error) {
      throw new Error(`Failed to delete room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a room by its 6-character code
   */
  async getRoomByCode(code: string): Promise<GameRoom | null> {
    const normalizedCode = code.toUpperCase().trim();

    if (normalizedCode.length !== 6) {
      return null;
    }

    try {
      const response = await this.appwrite.databases.listDocuments(this.appwrite.databaseId, COLLECTION_GAME_ROOMS, [
        Query.equal('code', normalizedCode),
        Query.limit(1),
      ]);

      if (response.documents.length === 0) {
        return null;
      }

      return this.mapDocumentToGameRoom(response.documents[0]);
    } catch (error) {
      throw new Error(`Failed to find room by code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find a room by its invite token (UUID)
   */
  async getRoomByInviteToken(token: string): Promise<GameRoom | null> {
    const normalizedToken = token.trim().toLowerCase();

    try {
      const response = await this.appwrite.databases.listDocuments(this.appwrite.databaseId, COLLECTION_GAME_ROOMS, [
        Query.equal('inviteToken', normalizedToken),
        Query.limit(1),
      ]);

      if (response.documents.length === 0) {
        return null;
      }

      return this.mapDocumentToGameRoom(response.documents[0]);
    } catch (error) {
      throw new Error(
        `Failed to find room by invite token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find a room by its Appwrite document ID
   */
  async getRoomById(roomId: string): Promise<GameRoom | null> {
    try {
      const document = await this.appwrite.databases.getDocument(
        this.appwrite.databaseId,
        COLLECTION_GAME_ROOMS,
        roomId
      );

      return this.mapDocumentToGameRoom(document);
    } catch (error: unknown) {
      // Return null for 404 (document not found), re-throw other errors
      if (error instanceof Object && 'code' in error && (error as { code: number }).code === 404) {
        return null;
      }
      console.warn('getRoomById failed with unexpected error:', error);
      throw new Error(`Failed to get room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get rooms for the current user filtered by their member records
   *
   * @param limit - Maximum number of rooms to return (default 100)
   * @param showArchived - Include archived rooms (default false)
   * @returns Array of GameRoomWithMemberCount enriched with member count
   */
  async getMyRooms(limit = 100, showArchived = false): Promise<GameRoomWithMemberCount[]> {
    // If authService is not available (tests), return empty array
    if (!this.authService) {
      return [];
    }

    if (!this.authService.isLoggedIn() || this.authService.isAnonymous()) {
      return [];
    }

    const current = this.authService.currentUser();
    const currentUserId = current?.$id;
    if (!currentUserId) {
      return [];
    }

    try {
      // Get all member records for this user
      const members = await this.memberService.getMembersByUserId(currentUserId);

      if (members.length === 0) {
        return [];
      }

      // Get unique room IDs
      const roomIds = [...new Set(members.map((m) => m.roomId))];

      // Fetch rooms for each ID
      const rooms: GameRoom[] = [];
      for (const roomId of roomIds) {
        try {
          const room = await this.getRoomById(roomId);
          if (room) {
            rooms.push(room);
          }
        } catch {
          continue;
        }
      }

      // Filter by archived status
      const filtered = showArchived ? rooms : rooms.filter((r) => r.status !== 'archived');

      // Sort by updatedAt desc (null dates go to the end)
      filtered.sort((a, b) => {
        const aTime = a.$updatedAt ? new Date(a.$updatedAt).getTime() : 0;
        const bTime = b.$updatedAt ? new Date(b.$updatedAt).getTime() : 0;
        return bTime - aTime;
      });

      // Enrich with member counts
      const enriched: GameRoomWithMemberCount[] = [];
      for (const room of filtered) {
        const members = await this.memberService.getMembersByRoom(room.$id);
        enriched.push({ ...room, memberCount: members.length });
      }

      return enriched.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get my rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a room's properties
   */
  async updateRoom(roomId: string, updates: Partial<Omit<GameRoom, '$id'>>): Promise<GameRoom> {
    try {
      const document = await this.appwrite.databases.updateDocument(
        this.appwrite.databaseId,
        COLLECTION_GAME_ROOMS,
        roomId,
        updates
      );

      const room = this.mapDocumentToGameRoom(document);

      if (this._currentRoom()?.$id === roomId) {
        this._currentRoom.set(room);
      }

      return room;
    } catch (error) {
      throw new Error(`Failed to update room: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set the current room directly
   */
  setCurrentRoom(room: GameRoom | null): void {
    this._currentRoom.set(room);
  }

  /**
   * Subscribe to realtime updates for a specific room
   *
   * @param roomId - The ID of the room to subscribe to
   * @param callback - Callback function to handle room updates
   * @returns Subscription ID for unsubscribing
   */
  async subscribeToRoom(roomId: string, callback: SubscriptionCallback<GameRoom>): Promise<string> {
    // The callback receives RealtimeService.GameRoom which has archived status
    // Cast to RoomService.GameRoom which shares the same structure
    return (await this.realtime.subscribeToRoom(
      roomId,
      callback as SubscriptionCallback<import('../realtime/realtime.service').GameRoom>
    )) as string;
  }

  /**
   * Rename a room (any connected member)
   */
  async renameRoom(roomId: string, newName: string): Promise<GameRoom> {
    const room = await this.updateRoom(roomId, { name: newName });
    // Broadcast via RealtimeService
    return room;
  }

  /**
   * Archive a room (host only)
   */
  async archiveRoom(roomId: string): Promise<GameRoom> {
    // If authService is not available, return error
    if (!this.authService) {
      throw new Error('User not authenticated');
    }

    // Check host permission
    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const current = this.authService.currentUser();
    if (!current) {
      throw new Error('User not authenticated');
    }

    const members = await this.memberService.getMembersByRoom(roomId);
    const myMember = members.find((m) => m.userId === current.$id);
    if (!myMember || myMember.role !== 'host') {
      throw new Error('Only the host can archive a room');
    }

    return this.updateRoom(roomId, { status: 'archived' });
  }

  /**
   * Leave a room and handle cleanup
   */
  async leaveRoom(roomId: string): Promise<void> {
    // If authService is not available, return early
    if (!this.authService) {
      return;
    }

    const current = this.authService.currentUser();
    const members = await this.memberService.getMembersByRoom(roomId);
    const myMember = members.find((m) => m.userId === current?.$id);

    if (!myMember) {
      return;
    }

    // Delete member record
    await this.memberService.deleteMember(myMember.$id);

    // If host, cleanup session
    if (myMember.role === 'host') {
      const room = await this.getRoomById(roomId);
      if (room?.currentSessionId) {
        await this.updateRoom(roomId, { status: 'idle', currentSessionId: null });
        // Cancel session
        // Set hasLeft=true for all players in session
      }
    }

    // Clear current room if it matches the room being left
    if (this._currentRoom()?.$id === roomId) {
      this._currentRoom.set(null);
    }
  }

  /**
   * Start a new session in a room
   */
  async startNewSession(roomId: string): Promise<any> {
    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.status !== 'idle') {
      throw new Error('Room must be idle to start a new game');
    }

    // Create new session
    // Add host as player
    return null;
  }

  /**
   * Generate a 6-character uppercase room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      code += chars[randomIndex];
    }

    return code;
  }

  /**
   * Generate a UUID v4 for invite tokens
   */
  private generateInviteToken(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const hex = '0123456789abcdef';
    let uuid = '';

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4';
      } else if (i === 19) {
        uuid += hex[(Math.floor(Math.random() * 4) + 8) & 0xf];
      } else {
        uuid += hex[Math.floor(Math.random() * 16)];
      }
    }

    return uuid;
  }

  /**
   * Map an Appwrite document to a GameRoom interface
   */
  private mapDocumentToGameRoom(document: Record<string, unknown>): GameRoom {
    const result: GameRoom = {
      $id: document['$id'] as string,
      name: document['name'] as string,
      code: document['code'] as string,
      inviteToken: document['inviteToken'] as string,
      currentGameId: (document['currentGameId'] as string) || null,
      currentSessionId: (document['currentSessionId'] as string) || null,
      status: (document['status'] as RoomStatus) || 'idle',
      hostMemberId: document['hostMemberId'] as string,
      mode: (document['mode'] as RoomMode) || 'multiplayer',
      maxPlayers: (document['maxPlayers'] as number) || 10,
      gamesPlayed: (document['gamesPlayed'] as number) || 0,
    };
    if ('archived' in document) {
      result.archived = document['archived'] as boolean;
    }
    if ('$updatedAt' in document) {
      result.$updatedAt = document['$updatedAt'] as string;
    }
    if ('$updatedAt' in document) {
      result.$updatedAt = document['$updatedAt'] as string;
    }
    return result;
  }
}
