import { computed, inject, Injectable, signal } from '@angular/core';
import { ID } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RoomService } from '../room/room.service';

/**
 * Collection ID for Ketal sessions in Appwrite
 */
const COLLECTION_KETAL_SESSIONS = 'ketal_sessions';

/**
 * Player choices during the prediction phase
 */
export interface PlayerChoices {
  color: string;
  plus_or_minus: string;
  in_out: string;
  suit: string;
}

/**
 * Represents a player in a Ketal game session
 */
export interface KetalPlayer {
  /** Member ID from the game_members collection */
  memberId: string;
  /** Player's display name */
  displayName: string;
  /** Player's order in the game (1-based) */
  order: number;
  /** Serialized card data for the player's hand */
  cards: string[];
  /** Player's choices during the prediction phase */
  choices: PlayerChoices;
  /** Total sips given to other players */
  sipsGiven: number;
  /** Total sips taken by this player */
  sipsTaken: number;
  /** Whether the player is ready to start */
  isReady: boolean;
}

/**
 * Session status values
 */
export type SessionStatus = 'waiting' | 'playing' | 'finished';

/**
 * Game phase values
 */
export type SessionPhase = 'setup' | 'dealing' | 'pyramid' | 'finished';

/**
 * Represents a Ketal game session stored in Appwrite
 */
export interface KetalSession {
  /** Appwrite document ID */
  $id: string;
  /** Room ID this session belongs to */
  roomId: string;
  /** Game identifier (always 'ketal' for this game) */
  gameId: 'ketal';
  /** Sequential game number within the room */
  gameNumber: number;
  /** Current session status */
  status: SessionStatus;
  /** Current game phase */
  phase: SessionPhase;
  /** Current turn number (1-4 in prediction phase) */
  turn: number;
  /** ID of the player whose turn it is */
  activePlayerId: string | null;
  /** Array of players in the game */
  players: KetalPlayer[];
  /** Cards drawn during the drinking phase */
  drinkingCards: string[];
  /** Cards drawn during the giving phase */
  givingCards: string[];
  /** Whether summary mode is enabled at game end */
  withSummary: boolean;
}

/**
 * Data structure for creating a new session (without Appwrite-generated $id)
 */
export type CreateKetalSessionData = Omit<KetalSession, '$id'>;

/**
 * KetalSessionService - Manages Ketal game sessions with Appwrite backend
 *
 * Provides functionality for:
 * - Creating and managing game sessions
 * - Realtime synchronization of session state
 * - Player management within sessions
 * - Game phase and turn tracking
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class KetalSessionService {
  private readonly appwrite = inject(AppwriteService);
  private readonly realtime = inject(RealtimeService);
  private readonly roomService = inject(RoomService);

  /** Active subscription ID for realtime updates */
  private _subscriptionId: string | null = null;

  /** Signal holding the current session state */
  private readonly _currentSession = signal<KetalSession | null>(null);

  /** Public readonly signal for current session state */
  readonly currentSession = this._currentSession.asReadonly();

  /** Computed signal indicating if a game is in progress */
  readonly isPlaying = computed(() => this._currentSession()?.status === 'playing');

  /** Computed signal for the current game phase */
  readonly currentPhase = computed(() => this._currentSession()?.phase ?? 'setup');

  /** Computed signal for the list of players */
  readonly players = computed(() => this._currentSession()?.players ?? []);

  /** Computed signal for the active player ID */
  readonly activePlayerId = computed(() => this._currentSession()?.activePlayerId);

  /**
   * Start a new game in a room
   *
   * Creates a new Ketal session document in Appwrite, updates the room's
   * currentSessionId, and subscribes to realtime updates.
   *
   * @param roomId - The ID of the room to start the game in
   * @param players - Array of players participating in the game
   * @param withSummary - Whether to enable summary mode at game end
   * @returns The created session
   * @throws Error if the session creation fails
   */
  async startGame(roomId: string, players: KetalPlayer[], withSummary: boolean): Promise<KetalSession> {
    try {
      // Get current room to find game number
      const currentRoom = this.roomService.currentRoom();
      const gameNumber = (currentRoom?.gamesPlayed ?? 0) + 1;

      // Create session data
      const sessionData: CreateKetalSessionData = {
        roomId,
        gameId: 'ketal',
        gameNumber,
        status: 'waiting',
        phase: 'setup',
        turn: 0,
        activePlayerId: players.length > 0 ? players[0].memberId : null,
        players,
        drinkingCards: [],
        givingCards: [],
        withSummary,
      };

      // Create session document in Appwrite
      const document = await this.appwrite.databases.createDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_SESSIONS,
        ID.unique(),
        this.serializeSessionData(sessionData)
      );

      const session = this.mapDocumentToSession(document);

      // Update room with current session ID and increment games played
      await this.roomService.updateRoom(roomId, {
        currentSessionId: session.$id,
        status: 'playing',
        gamesPlayed: gameNumber,
      });

      // Subscribe to realtime updates
      this.subscribeToSession(session.$id);

      // Update local signal
      this._currentSession.set(session);

      return session;
    } catch (error) {
      throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing session
   *
   * Updates the session document in Appwrite and the local signal.
   *
   * @param sessionId - The ID of the session to update
   * @param updates - Partial session data to update
   * @returns The updated session
   * @throws Error if the update fails
   */
  async updateSession(sessionId: string, updates: Partial<Omit<KetalSession, '$id'>>): Promise<KetalSession> {
    try {
      const serializedUpdates = this.serializeSessionUpdates(updates);

      const document = await this.appwrite.databases.updateDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_SESSIONS,
        sessionId,
        serializedUpdates
      );

      const session = this.mapDocumentToSession(document);
      this._currentSession.set(session);

      return session;
    } catch (error) {
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * End the current game
   *
   * Sets the session status to 'finished', clears the room's currentSessionId,
   * and unsubscribes from realtime updates.
   *
   * @param sessionId - The ID of the session to end
   * @throws Error if ending the game fails
   */
  async endGame(sessionId: string): Promise<void> {
    try {
      // Update session status to finished
      await this.appwrite.databases.updateDocument(this.appwrite.databaseId, COLLECTION_KETAL_SESSIONS, sessionId, {
        status: 'finished',
        phase: 'finished',
      });

      // Get the room ID from current session before clearing
      const currentSession = this._currentSession();
      const roomId = currentSession?.roomId;

      // Update room to clear current session
      if (roomId) {
        await this.roomService.updateRoom(roomId, {
          currentSessionId: null,
          status: 'idle',
        });
      }

      // Unsubscribe from realtime updates
      this.unsubscribe();

      // Clear local session
      this._currentSession.set(null);
    } catch (error) {
      throw new Error(`Failed to end game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch a session by ID
   *
   * @param sessionId - The ID of the session to fetch
   * @returns The session or null if not found
   * @throws Error if the fetch fails
   */
  async getSession(sessionId: string): Promise<KetalSession | null> {
    try {
      const document = await this.appwrite.databases.getDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_SESSIONS,
        sessionId
      );

      return this.mapDocumentToSession(document);
    } catch (error) {
      // Return null for not found (404) errors
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to realtime updates for a session
   *
   * Uses RealtimeService to listen for changes and updates the local signal.
   *
   * @param sessionId - The ID of the session to subscribe to
   */
  subscribeToSession(sessionId: string): void {
    // Unsubscribe from any existing subscription first
    this.unsubscribe();

    // Subscribe using RealtimeService
    this._subscriptionId = this.realtime.subscribeToSession(sessionId, (payload) => {
      // Map the payload to our KetalSession interface
      const session = this.mapDocumentToSession(payload as unknown as Record<string, unknown>);
      this._currentSession.set(session);
    });
  }

  /**
   * Unsubscribe from the current session's realtime updates
   */
  unsubscribe(): void {
    if (this._subscriptionId) {
      this.realtime.unsubscribe(this._subscriptionId);
      this._subscriptionId = null;
    }
  }

  /**
   * Set the current session directly
   *
   * Used for updating local state without making an API call.
   *
   * @param session - The session to set, or null to clear
   */
  setCurrentSession(session: KetalSession | null): void {
    this._currentSession.set(session);
  }

  /**
   * Serialize session data for Appwrite storage
   *
   * Converts complex objects to JSON strings for storage.
   */
  private serializeSessionData(data: CreateKetalSessionData): Record<string, unknown> {
    return {
      roomId: data.roomId,
      gameId: data.gameId,
      gameNumber: data.gameNumber,
      status: data.status,
      phase: data.phase,
      turn: data.turn,
      activePlayerId: data.activePlayerId,
      players: JSON.stringify(data.players),
      drinkingCards: JSON.stringify(data.drinkingCards),
      givingCards: JSON.stringify(data.givingCards),
      withSummary: data.withSummary,
    };
  }

  /**
   * Serialize partial session updates for Appwrite
   */
  private serializeSessionUpdates(updates: Partial<Omit<KetalSession, '$id'>>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    if (updates.roomId !== undefined) {
      serialized['roomId'] = updates.roomId;
    }
    if (updates.gameId !== undefined) {
      serialized['gameId'] = updates.gameId;
    }
    if (updates.gameNumber !== undefined) {
      serialized['gameNumber'] = updates.gameNumber;
    }
    if (updates.status !== undefined) {
      serialized['status'] = updates.status;
    }
    if (updates.phase !== undefined) {
      serialized['phase'] = updates.phase;
    }
    if (updates.turn !== undefined) {
      serialized['turn'] = updates.turn;
    }
    if (updates.activePlayerId !== undefined) {
      serialized['activePlayerId'] = updates.activePlayerId;
    }
    if (updates.players !== undefined) {
      serialized['players'] = JSON.stringify(updates.players);
    }
    if (updates.drinkingCards !== undefined) {
      serialized['drinkingCards'] = JSON.stringify(updates.drinkingCards);
    }
    if (updates.givingCards !== undefined) {
      serialized['givingCards'] = JSON.stringify(updates.givingCards);
    }
    if (updates.withSummary !== undefined) {
      serialized['withSummary'] = updates.withSummary;
    }

    return serialized;
  }

  /**
   * Map an Appwrite document to a KetalSession interface
   */
  private mapDocumentToSession(document: Record<string, unknown>): KetalSession {
    // Parse players - handle both string (from Appwrite) and array (from realtime)
    let players: KetalPlayer[] = [];
    const playersData = document['players'];
    if (typeof playersData === 'string') {
      try {
        players = JSON.parse(playersData);
      } catch {
        players = [];
      }
    } else if (Array.isArray(playersData)) {
      players = playersData;
    }

    // Parse drinkingCards
    let drinkingCards: string[] = [];
    const drinkingData = document['drinkingCards'];
    if (typeof drinkingData === 'string') {
      try {
        drinkingCards = JSON.parse(drinkingData);
      } catch {
        drinkingCards = [];
      }
    } else if (Array.isArray(drinkingData)) {
      drinkingCards = drinkingData;
    }

    // Parse givingCards
    let givingCards: string[] = [];
    const givingData = document['givingCards'];
    if (typeof givingData === 'string') {
      try {
        givingCards = JSON.parse(givingData);
      } catch {
        givingCards = [];
      }
    } else if (Array.isArray(givingData)) {
      givingCards = givingData;
    }

    return {
      $id: document['$id'] as string,
      roomId: document['roomId'] as string,
      gameId: 'ketal',
      gameNumber: (document['gameNumber'] as number) || 1,
      status: (document['status'] as SessionStatus) || 'waiting',
      phase: (document['phase'] as SessionPhase) || 'setup',
      turn: (document['turn'] as number) || 0,
      activePlayerId: (document['activePlayerId'] as string) || null,
      players,
      drinkingCards,
      givingCards,
      withSummary: (document['withSummary'] as boolean) || false,
    };
  }
}
