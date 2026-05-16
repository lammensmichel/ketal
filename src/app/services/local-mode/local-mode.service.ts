import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { GameMember, MemberService } from '../member/member.service';
import { GameRoom, RoomService } from '../room/room.service';
import { KetalPlayer, KetalSession } from '../ketal-session/ketal-session.service';

/**
 * LocalStorage keys for local mode data
 */
const STORAGE_KEYS = {
  ROOMS: 'ketal_local_rooms',
  MEMBERS: 'ketal_local_members',
  SESSIONS: 'ketal_local_sessions',
} as const;

/**
 * LocalModeService - Manages offline/local mode operations
 *
 * Provides functionality for:
 * - Detecting online/offline status
 * - Managing game rooms, members, and sessions locally
 * - Mirroring Appwrite data structures in localStorage
 * - Migrating local data to cloud when online
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalModeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly roomService = inject(RoomService);
  private readonly memberService = inject(MemberService);

  /** Signal tracking browser online status */
  private readonly _isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  /** Signal tracking whether user explicitly chose local mode */
  private readonly _isLocalMode = signal<boolean>(false);

  /** Signal holding the list of local rooms */
  private readonly _localRooms = signal<GameRoom[]>([]);

  /** Public readonly signal for online status */
  readonly isOnline = this._isOnline.asReadonly();

  /** Public readonly signal for local mode preference */
  readonly isLocalMode = this._isLocalMode.asReadonly();

  /** Public readonly signal for local rooms */
  readonly localRooms = this._localRooms.asReadonly();

  /** Computed signal indicating if operating in local mode (either by choice or offline) */
  readonly shouldUseLocalMode = computed(() => this._isLocalMode() || !this._isOnline());

  constructor() {
    this.initializeOnlineListeners();
    this.loadLocalRooms();
  }

  // ============================================================================
  // ONLINE STATUS DETECTION
  // ============================================================================

  /**
   * Initialize online/offline event listeners
   *
   * Sets up event listeners for browser online/offline events
   * and registers cleanup with DestroyRef.
   */
  private initializeOnlineListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => this._isOnline.set(true);
    const handleOffline = () => this._isOnline.set(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register cleanup with DestroyRef
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  /**
   * Set local mode preference
   *
   * @param enabled - Whether to enable local mode
   */
  setLocalMode(enabled: boolean): void {
    this._isLocalMode.set(enabled);
  }

  // ============================================================================
  // LOCAL ROOM MANAGEMENT
  // ============================================================================

  /**
   * Create a new room locally
   *
   * @param name - Display name for the room
   * @returns The created GameRoom
   */
  createLocalRoom(name: string): GameRoom {
    const room: GameRoom = {
      $id: this.generateLocalId(),
      name,
      code: this.generateRoomCode(),
      inviteToken: this.generateLocalId(),
      currentGameId: null,
      currentSessionId: null,
      status: 'idle',
      hostMemberId: '',
      mode: 'local',
      maxPlayers: 10,
      gamesPlayed: 0,
      archived: false,
    };

    const rooms = this.readFromStorage<GameRoom[]>(STORAGE_KEYS.ROOMS) ?? [];
    rooms.push(room);
    this.writeToStorage(STORAGE_KEYS.ROOMS, rooms);

    this._localRooms.update((current) => [...current, room]);

    return room;
  }

  /**
   * Get a local room by ID
   *
   * @param roomId - The room ID to look up
   * @returns The room or null if not found
   */
  getLocalRoom(roomId: string): GameRoom | null {
    const rooms = this.readFromStorage<GameRoom[]>(STORAGE_KEYS.ROOMS) ?? [];
    return rooms.find((r) => r.$id === roomId) ?? null;
  }

  /**
   * Update a local room's properties
   *
   * @param roomId - The room ID to update
   * @param updates - Partial room data to update
   * @returns The updated room
   * @throws Error if room not found
   */
  updateLocalRoom(roomId: string, updates: Partial<Omit<GameRoom, '$id'>>): GameRoom {
    const rooms = this.readFromStorage<GameRoom[]>(STORAGE_KEYS.ROOMS) ?? [];
    const index = rooms.findIndex((r) => r.$id === roomId);

    if (index === -1) {
      throw new Error(`Local room not found: ${roomId}`);
    }

    const updatedRoom: GameRoom = { ...rooms[index], ...updates };
    rooms[index] = updatedRoom;
    this.writeToStorage(STORAGE_KEYS.ROOMS, rooms);

    this._localRooms.update((current) => current.map((r) => (r.$id === roomId ? updatedRoom : r)));

    return updatedRoom;
  }

  /**
   * Delete a local room
   *
   * Also removes all associated members and sessions.
   *
   * @param roomId - The room ID to delete
   */
  deleteLocalRoom(roomId: string): void {
    // Remove room
    const rooms = this.readFromStorage<GameRoom[]>(STORAGE_KEYS.ROOMS) ?? [];
    const filteredRooms = rooms.filter((r) => r.$id !== roomId);
    this.writeToStorage(STORAGE_KEYS.ROOMS, filteredRooms);

    // Remove associated members
    const members = this.readFromStorage<GameMember[]>(STORAGE_KEYS.MEMBERS) ?? [];
    const filteredMembers = members.filter((m) => m.roomId !== roomId);
    this.writeToStorage(STORAGE_KEYS.MEMBERS, filteredMembers);

    // Remove associated sessions
    const sessions = this.readFromStorage<KetalSession[]>(STORAGE_KEYS.SESSIONS) ?? [];
    const filteredSessions = sessions.filter((s) => s.roomId !== roomId);
    this.writeToStorage(STORAGE_KEYS.SESSIONS, filteredSessions);

    this._localRooms.update((current) => current.filter((r) => r.$id !== roomId));
  }

  /**
   * Load local rooms from storage into the signal
   */
  private loadLocalRooms(): void {
    const rooms = this.readFromStorage<GameRoom[]>(STORAGE_KEYS.ROOMS) ?? [];
    this._localRooms.set(rooms);
  }

  // ============================================================================
  // LOCAL MEMBER MANAGEMENT
  // ============================================================================

  /**
   * Add a member to a local room
   *
   * @param roomId - The room ID to add the member to
   * @param displayName - The display name for the member
   * @returns The created GameMember
   */
  addLocalMember(roomId: string, displayName: string): GameMember {
    const member: GameMember = {
      $id: this.generateLocalId(),
      roomId,
      userId: null,
      deviceId: this.getOrCreateDeviceId(),
      displayName,
      role: 'player',
      isOnline: true,
      totalSipsGiven: 0,
      totalSipsTaken: 0,
      totalGamesPlayed: 0,
      gameStats: {},
    };

    const members = this.readFromStorage<GameMember[]>(STORAGE_KEYS.MEMBERS) ?? [];
    members.push(member);
    this.writeToStorage(STORAGE_KEYS.MEMBERS, members);

    return member;
  }

  /**
   * Get all members in a local room
   *
   * @param roomId - The room ID to get members for
   * @returns Array of GameMember objects
   */
  getLocalMembers(roomId: string): GameMember[] {
    const members = this.readFromStorage<GameMember[]>(STORAGE_KEYS.MEMBERS) ?? [];
    return members.filter((m) => m.roomId === roomId);
  }

  /**
   * Update a local member's properties
   *
   * @param memberId - The member ID to update
   * @param updates - Partial member data to update
   * @returns The updated member
   * @throws Error if member not found
   */
  updateLocalMember(memberId: string, updates: Partial<Omit<GameMember, '$id'>>): GameMember {
    const members = this.readFromStorage<GameMember[]>(STORAGE_KEYS.MEMBERS) ?? [];
    const index = members.findIndex((m) => m.$id === memberId);

    if (index === -1) {
      throw new Error(`Local member not found: ${memberId}`);
    }

    const updatedMember: GameMember = { ...members[index], ...updates };
    members[index] = updatedMember;
    this.writeToStorage(STORAGE_KEYS.MEMBERS, members);

    return updatedMember;
  }

  /**
   * Remove a local member
   *
   * @param memberId - The member ID to remove
   */
  removeLocalMember(memberId: string): void {
    const members = this.readFromStorage<GameMember[]>(STORAGE_KEYS.MEMBERS) ?? [];
    const filteredMembers = members.filter((m) => m.$id !== memberId);
    this.writeToStorage(STORAGE_KEYS.MEMBERS, filteredMembers);
  }

  // ============================================================================
  // LOCAL SESSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new local game session
   *
   * @param roomId - The room ID for the session
   * @param players - Array of players participating in the game
   * @returns The created KetalSession
   */
  createLocalSession(roomId: string, players: KetalPlayer[]): KetalSession {
    const room = this.getLocalRoom(roomId);
    const gameNumber = (room?.gamesPlayed ?? 0) + 1;

    const session: KetalSession = {
      $id: this.generateLocalId(),
      roomId,
      gameId: 'ketal',
      gameNumber,
      status: 'waiting',
      phase: 'setup',
      turn: 0,
      activePlayerId: players.length > 0 ? players[0].memberId : null,
      terminatedBy: null,
      players,
      drinkingCards: [],
      givingCards: [],
      withSummary: false,
    };

    const sessions = this.readFromStorage<KetalSession[]>(STORAGE_KEYS.SESSIONS) ?? [];
    sessions.push(session);
    this.writeToStorage(STORAGE_KEYS.SESSIONS, sessions);

    // Update room with session ID and increment games played
    if (room) {
      this.updateLocalRoom(roomId, {
        currentSessionId: session.$id,
        status: 'playing',
        gamesPlayed: gameNumber,
      });
    }

    return session;
  }

  /**
   * Get a local session by ID
   *
   * @param sessionId - The session ID to look up
   * @returns The session or null if not found
   */
  getLocalSession(sessionId: string): KetalSession | null {
    const sessions = this.readFromStorage<KetalSession[]>(STORAGE_KEYS.SESSIONS) ?? [];
    return sessions.find((s) => s.$id === sessionId) ?? null;
  }

  /**
   * Update a local session's properties
   *
   * @param sessionId - The session ID to update
   * @param updates - Partial session data to update
   * @returns The updated session
   * @throws Error if session not found
   */
  updateLocalSession(sessionId: string, updates: Partial<Omit<KetalSession, '$id'>>): KetalSession {
    const sessions = this.readFromStorage<KetalSession[]>(STORAGE_KEYS.SESSIONS) ?? [];
    const index = sessions.findIndex((s) => s.$id === sessionId);

    if (index === -1) {
      throw new Error(`Local session not found: ${sessionId}`);
    }

    const updatedSession: KetalSession = { ...sessions[index], ...updates };
    sessions[index] = updatedSession;
    this.writeToStorage(STORAGE_KEYS.SESSIONS, sessions);

    return updatedSession;
  }

  /**
   * Get the current session for a room
   *
   * @param roomId - The room ID to get the session for
   * @returns The current session or null if none active
   */
  getLocalSessionByRoom(roomId: string): KetalSession | null {
    const room = this.getLocalRoom(roomId);
    if (!room?.currentSessionId) {
      return null;
    }
    return this.getLocalSession(room.currentSessionId);
  }

  // ============================================================================
  // MIGRATION TO CLOUD
  // ============================================================================

  /**
   * Migrate a local room to the cloud (Appwrite)
   *
   * Creates the room and all its members in Appwrite,
   * then deletes the local data on success.
   *
   * @param roomId - The local room ID to migrate
   * @returns The created cloud GameRoom
   * @throws Error if migration fails or already online room
   */
  async migrateRoomToCloud(roomId: string): Promise<GameRoom> {
    if (!this._isOnline()) {
      throw new Error('Cannot migrate to cloud while offline');
    }

    const localRoom = this.getLocalRoom(roomId);
    if (!localRoom) {
      throw new Error(`Local room not found: ${roomId}`);
    }

    // Create cloud room
    const cloudRoom = await this.roomService.createRoom(localRoom.name, 'multiplayer', localRoom.maxPlayers);

    // Migrate members
    const localMembers = this.getLocalMembers(roomId);
    for (const localMember of localMembers) {
      await this.memberService.createMember({
        roomId: cloudRoom.$id,
        userId: localMember.userId,
        deviceId: localMember.deviceId,
        displayName: localMember.displayName,
        role: localMember.role,
        isOnline: true,
        totalSipsGiven: localMember.totalSipsGiven,
        totalSipsTaken: localMember.totalSipsTaken,
        totalGamesPlayed: localMember.totalGamesPlayed,
        gameStats: localMember.gameStats,
      });
    }

    // Delete local data after successful migration
    this.deleteLocalRoom(roomId);

    return cloudRoom;
  }

  // ============================================================================
  // HELPER UTILITIES
  // ============================================================================

  /**
   * Generate a UUID v4 for local documents
   *
   * @returns A UUID v4 string
   */
  generateLocalId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback UUID v4 generation
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
   * Generate a 6-character uppercase room code
   *
   * @returns A 6-character alphanumeric code
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
   * Get or create a device ID for guest identification
   *
   * @returns The device ID
   */
  private getOrCreateDeviceId(): string {
    const key = 'ketal_device_id';
    let deviceId = localStorage.getItem(key);

    if (!deviceId) {
      deviceId = this.generateLocalId();
      localStorage.setItem(key, deviceId);
    }

    return deviceId;
  }

  /**
   * Read data from localStorage with JSON parsing
   *
   * @param key - The storage key to read
   * @returns The parsed data or null if not found/invalid
   */
  private readFromStorage<T>(key: string): T | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const data = localStorage.getItem(key);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Write data to localStorage with JSON serialization
   *
   * @param key - The storage key to write
   * @param value - The value to serialize and store
   */
  private writeToStorage<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to write to localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
