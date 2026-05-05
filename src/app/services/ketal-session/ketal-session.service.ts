import { computed, inject, Injectable, signal } from '@angular/core';
import { ID, Query } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RoomService } from '../room/room.service';

/**
 * Collection IDs for Ketal in Appwrite
 */
const COLLECTION_KETAL_SESSIONS = 'ketal_sessions';
const COLLECTION_KETAL_PLAYERS = 'ketal_players';
const COLLECTION_KETAL_CARDS = 'ketal_cards';

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
 * Represents a player in a Ketal game session (in-memory model)
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
  /** Whether the player has left the session */
  hasLeft?: boolean;
}

/**
 * Session status values
 */
export type SessionStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';

/**
 * Game phase values
 */
export type SessionPhase = 'setup' | 'dealing' | 'pyramid' | 'finished';

/**
 * Represents a Ketal game session (composed from 3 Appwrite collections)
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
  /** ID of the member who terminated the session */
  terminatedBy?: string | null;
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
 * Appwrite document for ketal_players collection
 */
interface KetalPlayerDoc {
  $id: string;
  sessionId: string;
  memberId: string;
  displayName: string;
  order: number;
  cards: string;
  choices: string;
  sipsTaken: number;
  sipsGiven: number;
  isReady: boolean;
  hasLeft: boolean;
}

/**
 * Appwrite document for ketal_cards collection
 */
interface KetalCardsDoc {
  $id: string;
  sessionId: string;
  drinkingCards: string;
  givingCards: string;
}

/**
 * Internal session data (ketal_sessions collection only)
 */
interface SessionData {
  $id: string;
  roomId: string;
  gameId: 'ketal';
  gameNumber: number;
  status: SessionStatus;
  phase: SessionPhase;
  turn: number;
  activePlayerId: string | null;
  terminatedBy?: string | null;
  withSummary: boolean;
}

/**
 * KetalSessionService - Manages Ketal game sessions with Appwrite backend
 *
 * Data is split across 3 Appwrite collections:
 * - ketal_sessions: session-level state (status, phase, turn, etc.)
 * - ketal_players: per-player state (cards, choices, sips)
 * - ketal_cards: card state (drinkingCards, givingCards)
 *
 * The service composes a unified KetalSession from these 3 sources.
 */
@Injectable({
  providedIn: 'root',
})
export class KetalSessionService {
  private readonly appwrite = inject(AppwriteService);
  private readonly realtime = inject(RealtimeService);
  private readonly roomService = inject(RoomService);

  /** Internal split state */
  private readonly _sessionData = signal<SessionData | null>(null);
  private readonly _playerDocs = signal<KetalPlayerDoc[]>([]);
  private readonly _cardsDoc = signal<KetalCardsDoc | null>(null);

  /** Subscription IDs for realtime */
  private _sessionSubId: string | null = null;
  private _playersSubId: string | null = null;
  private _cardsSubId: string | null = null;

  /** External callback for realtime updates */
  private _onUpdateCallback: ((session: KetalSession) => void) | null = null;

  /** Composed readonly signal — merges 3 collections into a unified KetalSession */
  readonly currentSession = computed<KetalSession | null>(() => {
    const session = this._sessionData();
    if (!session) {
      return null;
    }
    return {
      ...session,
      players: this.getOrderedPlayers(),
      drinkingCards: this.parseJsonArray(this._cardsDoc()?.drinkingCards),
      givingCards: this.parseJsonArray(this._cardsDoc()?.givingCards),
    };
  });

  /** Computed signal indicating if a game is in progress */
  readonly isPlaying = computed(() => this._sessionData()?.status === 'playing');

  /** Computed signal for the current game phase */
  readonly currentPhase = computed(() => this._sessionData()?.phase ?? 'setup');

  /** Computed signal for the list of players */
  readonly players = computed(() => this.getOrderedPlayers());

  /** Computed signal for the active player ID */
  readonly activePlayerId = computed(() => this._sessionData()?.activePlayerId);

  /**
   * Start a new game in a room
   *
   * Creates documents across 3 collections: session, players, and cards.
   */
  async startGame(roomId: string, players: KetalPlayer[], withSummary: boolean): Promise<KetalSession> {
    try {
      const currentRoom = this.roomService.currentRoom();
      const gameNumber = (currentRoom?.gamesPlayed ?? 0) + 1;

      // 1. Create session document
      const sessionDoc = await this.appwrite.databases.createDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_SESSIONS,
        ID.unique(),
        {
          roomId,
          gameId: 'ketal',
          gameNumber,
          status: 'waiting',
          phase: 'setup',
          turn: 0,
          activePlayerId: players.length > 0 ? players[0].memberId : null,
          terminatedBy: null,
          withSummary,
        }
      );

      const sessionId = sessionDoc['$id'] as string;

      // 2. Create player documents
      const playerDocPromises = players.map((player) =>
        this.appwrite.databases.createDocument(this.appwrite.databaseId, COLLECTION_KETAL_PLAYERS, ID.unique(), {
          sessionId,
          memberId: player.memberId,
          displayName: player.displayName,
          order: player.order,
          cards: JSON.stringify(player.cards),
          choices: JSON.stringify(player.choices),
          sipsTaken: player.sipsTaken,
          sipsGiven: player.sipsGiven,
          isReady: player.isReady,
          hasLeft: player.hasLeft ?? false,
        })
      );

      const playerDocs = await Promise.all(playerDocPromises);

      // 3. Create cards document
      const cardsDoc = await this.appwrite.databases.createDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_CARDS,
        ID.unique(),
        {
          sessionId,
          drinkingCards: JSON.stringify([]),
          givingCards: JSON.stringify([]),
        }
      );

      // 4. Update room with current session ID and increment games played
      await this.roomService.updateRoom(roomId, {
        currentSessionId: sessionId,
        status: 'playing',
        gamesPlayed: gameNumber,
      });

      // 5. Update internal signals
      this._sessionData.set(this.mapRawToSessionData(sessionDoc));
      this._playerDocs.set(playerDocs.map((doc) => this.mapRawToPlayerDoc(doc)));
      this._cardsDoc.set(this.mapRawToCardsDoc(cardsDoc));

      return this.currentSession()!;
    } catch (error) {
      console.error('[KetalSessionService] startGame failed - partial docs may exist in Appwrite');
      throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an existing session
   *
   * Splits the update across the appropriate collections.
   */
  async updateSession(sessionId: string, updates: Partial<Omit<KetalSession, '$id'>>): Promise<KetalSession> {
    try {
      // 1. Session-level fields
      const sessionUpdate: Record<string, unknown> = {};
      const sessionFields: (keyof Omit<KetalSession, '$id' | 'players' | 'drinkingCards' | 'givingCards'>)[] = [
        'roomId',
        'gameId',
        'gameNumber',
        'status',
        'phase',
        'turn',
        'activePlayerId',
        'terminatedBy',
        'withSummary',
      ];

      for (const field of sessionFields) {
        if (updates[field] !== undefined) {
          sessionUpdate[field] = updates[field];
        }
      }

      if (Object.keys(sessionUpdate).length > 0) {
        const doc = await this.appwrite.databases.updateDocument(
          this.appwrite.databaseId,
          COLLECTION_KETAL_SESSIONS,
          sessionId,
          sessionUpdate
        );
        this._sessionData.set(this.mapRawToSessionData(doc));
      }

      // 2. Player updates
      if (updates.players) {
        await this.updatePlayerDocs(updates.players);
      }

      // 3. Card updates
      if (updates.drinkingCards !== undefined || updates.givingCards !== undefined) {
        await this.updateCardsDoc(updates.drinkingCards, updates.givingCards);
      }

      const session = this.currentSession();
      if (!session) {
        throw new Error('Session state is null after update');
      }
      return session;
    } catch (error) {
      throw new Error(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * End the current game
   */
  async endGame(sessionId: string): Promise<void> {
    try {
      await this.appwrite.databases.updateDocument(this.appwrite.databaseId, COLLECTION_KETAL_SESSIONS, sessionId, {
        status: 'finished',
        phase: 'finished',
      });

      const roomId = this._sessionData()?.roomId;
      if (roomId) {
        await this.roomService.updateRoom(roomId, {
          currentSessionId: null,
          status: 'idle',
        });
      }

      this.unsubscribe();

      this._sessionData.set(null);
      this._playerDocs.set([]);
      this._cardsDoc.set(null);
      this._onUpdateCallback = null;
    } catch (error) {
      throw new Error(`Failed to end game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch a session by ID (loads all 3 collections)
   */
  async getSession(sessionId: string): Promise<KetalSession | null> {
    try {
      const sessionDoc = await this.appwrite.databases.getDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_SESSIONS,
        sessionId
      );

      const playersResponse = await this.appwrite.databases.listDocuments(
        this.appwrite.databaseId,
        COLLECTION_KETAL_PLAYERS,
        [Query.equal('sessionId', sessionId), Query.orderAsc('order')]
      );

      const cardsResponse = await this.appwrite.databases.listDocuments(
        this.appwrite.databaseId,
        COLLECTION_KETAL_CARDS,
        [Query.equal('sessionId', sessionId)]
      );

      this._sessionData.set(this.mapRawToSessionData(sessionDoc));
      this._playerDocs.set(playersResponse.documents.map((d) => this.mapRawToPlayerDoc(d)));
      this._cardsDoc.set(cardsResponse.documents.length > 0 ? this.mapRawToCardsDoc(cardsResponse.documents[0]) : null);

      return this.currentSession();
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Subscribe to realtime updates for a session across all 3 collections.
   * Composes updates and notifies via callback.
   */
  subscribeToSession(sessionId: string, onUpdate?: (session: KetalSession) => void): void {
    this.unsubscribe();
    this._onUpdateCallback = onUpdate ?? null;

    // 1. Subscribe to session document
    this._sessionSubId = this.realtime.subscribeToDocument<Record<string, unknown>>(
      COLLECTION_KETAL_SESSIONS,
      sessionId,
      (payload) => {
        this._sessionData.set(this.mapRawToSessionData(payload));
        this.notifyUpdate();
      }
    );

    // 2. Subscribe to players collection (filtered by sessionId)
    this._playersSubId = this.realtime.subscribeToCollection<Record<string, unknown>>(
      COLLECTION_KETAL_PLAYERS,
      (payload) => {
        if (payload['sessionId'] === sessionId) {
          this.handlePlayerDocUpdate(payload);
          this.notifyUpdate();
        }
      }
    );

    // 3. Subscribe to cards document (if we have the doc ID)
    const cardsDoc = this._cardsDoc();
    if (cardsDoc) {
      this._cardsSubId = this.realtime.subscribeToDocument<Record<string, unknown>>(
        COLLECTION_KETAL_CARDS,
        cardsDoc.$id,
        (payload) => {
          this._cardsDoc.set(this.mapRawToCardsDoc(payload));
          this.notifyUpdate();
        }
      );
    } else {
      console.warn('[KetalSessionService] Cards subscription skipped - no cards doc available');
    }
  }

  /**
   * Unsubscribe from all realtime subscriptions
   */
  unsubscribe(): void {
    if (this._sessionSubId) {
      this.realtime.unsubscribe(this._sessionSubId);
      this._sessionSubId = null;
    }
    if (this._playersSubId) {
      this.realtime.unsubscribe(this._playersSubId);
      this._playersSubId = null;
    }
    if (this._cardsSubId) {
      this.realtime.unsubscribe(this._cardsSubId);
      this._cardsSubId = null;
    }
    this._onUpdateCallback = null;
  }

  /**
   * Set the current session directly (for local state updates)
   */
  setCurrentSession(session: KetalSession | null): void {
    if (!session) {
      this._sessionData.set(null);
      this._playerDocs.set([]);
      this._cardsDoc.set(null);
      return;
    }

    this._sessionData.set({
      $id: session.$id,
      roomId: session.roomId,
      gameId: session.gameId,
      gameNumber: session.gameNumber,
      status: session.status,
      phase: session.phase,
      turn: session.turn,
      activePlayerId: session.activePlayerId,
      terminatedBy: session.terminatedBy ?? null,
      withSummary: session.withSummary,
    });

    this._playerDocs.set(
      session.players.map((p, i) => ({
        $id: `local-player-${i}`,
        sessionId: session.$id,
        memberId: p.memberId,
        displayName: p.displayName,
        order: p.order,
        cards: JSON.stringify(p.cards),
        choices: JSON.stringify(p.choices),
        sipsTaken: p.sipsTaken,
        sipsGiven: p.sipsGiven,
        isReady: p.isReady,
        hasLeft: p.hasLeft ?? false,
      }))
    );

    this._cardsDoc.set({
      $id: `local-cards`,
      sessionId: session.$id,
      drinkingCards: JSON.stringify(session.drinkingCards),
      givingCards: JSON.stringify(session.givingCards),
    });
  }

  // ============================================================================
  // Private: Update helpers
  // ============================================================================

  private async updatePlayerDocs(players: KetalPlayer[]): Promise<void> {
    const currentDocs = this._playerDocs();

    const updatePromises = players.map((player) => {
      const existingDoc = currentDocs.find((d) => d.memberId === player.memberId);
      if (!existingDoc) {
        return Promise.resolve(null);
      }

      return this.appwrite.databases
        .updateDocument(this.appwrite.databaseId, COLLECTION_KETAL_PLAYERS, existingDoc.$id, {
          cards: JSON.stringify(player.cards),
          choices: JSON.stringify(player.choices),
          sipsTaken: player.sipsTaken,
          sipsGiven: player.sipsGiven,
          isReady: player.isReady,
        })
        .then((doc) => this.mapRawToPlayerDoc(doc));
    });

    const results = await Promise.all(updatePromises);

    this._playerDocs.set(
      currentDocs.map((doc) => {
        const updated = results.find((r) => r && r.$id === doc.$id);
        return updated || doc;
      })
    );
  }

  private async updateCardsDoc(drinkingCards?: string[], givingCards?: string[]): Promise<void> {
    const cardsDoc = this._cardsDoc();
    if (!cardsDoc) {
      return;
    }

    const update: Record<string, unknown> = {};
    if (drinkingCards !== undefined) {
      update['drinkingCards'] = JSON.stringify(drinkingCards);
    }
    if (givingCards !== undefined) {
      update['givingCards'] = JSON.stringify(givingCards);
    }

    if (Object.keys(update).length > 0) {
      const doc = await this.appwrite.databases.updateDocument(
        this.appwrite.databaseId,
        COLLECTION_KETAL_CARDS,
        cardsDoc.$id,
        update
      );
      this._cardsDoc.set(this.mapRawToCardsDoc(doc));
    }
  }

  // ============================================================================
  // Private: Realtime helpers
  // ============================================================================

  private handlePlayerDocUpdate(payload: Record<string, unknown>): void {
    const updatedDoc = this.mapRawToPlayerDoc(payload);
    const currentDocs = this._playerDocs();
    const index = currentDocs.findIndex((d) => d.$id === updatedDoc.$id);

    if (index >= 0) {
      const newDocs = [...currentDocs];
      newDocs[index] = updatedDoc;
      this._playerDocs.set(newDocs);
    } else {
      this._playerDocs.set([...currentDocs, updatedDoc]);
    }
  }

  private notifyUpdate(): void {
    const session = this.currentSession();
    if (session && this._onUpdateCallback) {
      this._onUpdateCallback(session);
    }
  }

  // ============================================================================
  // Private: Document mapping
  // ============================================================================

  private getOrderedPlayers(): KetalPlayer[] {
    return [...this._playerDocs()].sort((a, b) => a.order - b.order).map((doc) => this.mapDocToKetalPlayer(doc));
  }

  private mapRawToSessionData(doc: Record<string, unknown>): SessionData {
    return {
      $id: doc['$id'] as string,
      roomId: doc['roomId'] as string,
      gameId: 'ketal',
      gameNumber: (doc['gameNumber'] as number) ?? 1,
      status: (doc['status'] as SessionStatus) ?? 'waiting',
      phase: (doc['phase'] as SessionPhase) ?? 'setup',
      turn: (doc['turn'] as number) ?? 0,
      activePlayerId: (doc['activePlayerId'] as string) ?? null,
      terminatedBy: (doc['terminatedBy'] as string) ?? null,
      withSummary: (doc['withSummary'] as boolean) ?? false,
    };
  }

  private mapRawToPlayerDoc(doc: Record<string, unknown>): KetalPlayerDoc {
    return {
      $id: doc['$id'] as string,
      sessionId: doc['sessionId'] as string,
      memberId: doc['memberId'] as string,
      displayName: (doc['displayName'] as string) ?? '',
      order: (doc['order'] as number) ?? 1,
      cards: typeof doc['cards'] === 'string' ? doc['cards'] : JSON.stringify(doc['cards'] ?? []),
      choices: typeof doc['choices'] === 'string' ? doc['choices'] : JSON.stringify(doc['choices'] ?? {}),
      sipsTaken: (doc['sipsTaken'] as number) ?? 0,
      sipsGiven: (doc['sipsGiven'] as number) ?? 0,
      isReady: (doc['isReady'] as boolean) ?? false,
      hasLeft: (doc['hasLeft'] as boolean) ?? false,
    };
  }

  private mapRawToCardsDoc(doc: Record<string, unknown>): KetalCardsDoc {
    return {
      $id: doc['$id'] as string,
      sessionId: doc['sessionId'] as string,
      drinkingCards:
        typeof doc['drinkingCards'] === 'string' ? doc['drinkingCards'] : JSON.stringify(doc['drinkingCards'] ?? []),
      givingCards:
        typeof doc['givingCards'] === 'string' ? doc['givingCards'] : JSON.stringify(doc['givingCards'] ?? []),
    };
  }

  private mapDocToKetalPlayer(doc: KetalPlayerDoc): KetalPlayer {
    return {
      memberId: doc.memberId,
      displayName: doc.displayName,
      order: doc.order,
      cards: this.parseJsonArray(doc.cards),
      choices: this.parseJsonObject<PlayerChoices>(doc.choices, {
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: '',
      }),
      sipsTaken: doc.sipsTaken,
      sipsGiven: doc.sipsGiven,
      isReady: doc.isReady,
      hasLeft: doc.hasLeft ?? false,
    };
  }

  // ============================================================================
  // Private: JSON parsing utilities
  // ============================================================================

  private parseJsonArray(data: unknown): string[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  }

  private parseJsonObject<T>(data: unknown, defaultVal: T): T {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as T;
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return defaultVal;
      }
    }
    return defaultVal;
  }
}
