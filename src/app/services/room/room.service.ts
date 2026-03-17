import { inject, Injectable, signal } from '@angular/core';
import { ID, Query } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService, SubscriptionCallback } from '../realtime/realtime.service';

/**
 * Collection ID for game rooms in Appwrite
 */
const COLLECTION_GAME_ROOMS = 'fug_game_rooms';

/**
 * Room status enum for type safety
 */
export type RoomStatus = 'idle' | 'playing';

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
  /** Room status: idle or playing */
  status: RoomStatus;
  /** Member ID of the room host */
  hostMemberId: string;
  /** Game mode: local or multiplayer */
  mode: RoomMode;
  /** Maximum number of players allowed */
  maxPlayers: number;
  /** Total number of games played in this room */
  gamesPlayed: number;
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
@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private readonly appwrite = inject(AppwriteService);
  private readonly realtime = inject(RealtimeService);

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
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    this._currentRoom.set(null);
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
   * Get all rooms
   */
  async getMyRooms(): Promise<GameRoom[]> {
    try {
      const response = await this.appwrite.databases.listDocuments(this.appwrite.databaseId, COLLECTION_GAME_ROOMS, [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ]);

      return response.documents.map((doc) => this.mapDocumentToGameRoom(doc));
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  subscribeToRoom(roomId: string, callback: SubscriptionCallback<GameRoom>): string {
    return this.realtime.subscribeToRoom(roomId, callback);
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
    return {
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
  }
}
