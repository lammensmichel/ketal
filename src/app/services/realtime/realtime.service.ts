import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Channel, RealtimeResponseEvent, RealtimeSubscription } from 'appwrite';
import { AppwriteService, DATABASE_ID } from '../appwrite/appwrite.service';

/**
 * Callback type for realtime subscription events
 */
export type SubscriptionCallback<T> = (data: T) => void;

/**
 * Represents an active realtime subscription managed by RealtimeService.
 * Wraps the SDK RealtimeSubscription so callers can keep a sync API.
 */
export interface Subscription {
  id: string;
  channel: string;
  /** Tear down this subscription (closes the WebSocket when it's the last one). */
  close: () => void;
}

/**
 * GameRoom model matching Appwrite fug_game_rooms collection
 */
export interface GameRoom {
  $id: string;
  name: string;
  code: string;
  inviteToken: string;
  currentGameId: string | null;
  currentSessionId: string | null;
  status: 'idle' | 'playing' | 'archived';
  hostMemberId: string;
  mode: 'local' | 'multiplayer' | 'solo';
  maxPlayers: number;
  gamesPlayed: number;
  archived?: boolean;
}

/**
 * GameMember model matching Appwrite fug_game_members collection
 */
export interface GameMember {
  $id: string;
  roomId: string;
  userId: string | null;
  deviceId: string | null;
  displayName: string;
  role: 'host' | 'player' | 'spectator';
  isOnline: boolean;
}

/**
 * Collection IDs used in Appwrite
 */
const COLLECTIONS = {
  GAME_ROOMS: 'fug_game_rooms',
  GAME_MEMBERS: 'fug_game_members',
  // Prefixe `fug_` comme cote KetalSessionService : c'est le seul identifiant
  // qui existe dans le schema. Avec 'ketal_sessions' le canal realtime pointait
  // sur une collection inexistante, donc aucune mise a jour de session
  // n'arrivait jamais aux autres appareils.
  KETAL_SESSIONS: 'fug_ketal_sessions',
  KETAL_PLAYERS: 'ketal_players',
  KETAL_CARDS: 'ketal_cards',
} as const;

/**
 * RealtimeService - Manages Appwrite realtime subscriptions.
 *
 * Channels are built using the Appwrite Channel builder (v24+):
 *   Channel.tablesdb(<DB_ID>).table(<TABLE_ID>).row(<ROW_ID>)
 *
 * Uses the Appwrite Channel class to generate proper channel strings.
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private readonly appwrite = inject(AppwriteService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _subscriptions = new Map<string, Subscription>();
  private readonly _subscriptionCount = signal(0);

  readonly isConnected = computed(() => this.appwrite.connected());
  readonly activeSubscriptions = computed(() => this._subscriptionCount());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unsubscribeAll();
    });
  }

  /**
   * Subscribe to updates for a specific game room
   */
  async subscribeToRoom(roomId: string, callback: SubscriptionCallback<GameRoom>): Promise<string> {
    return this.createSubscription(this.buildDocumentChannel(COLLECTIONS.GAME_ROOMS, roomId), callback);
  }

  /**
   * Subscribe to updates for a specific document in any collection
   */
  async subscribeToDocument<T extends object>(
    collectionId: string,
    documentId: string,
    callback: SubscriptionCallback<T>
  ): Promise<string> {
    return this.createSubscription(this.buildDocumentChannel(collectionId, documentId), callback);
  }

  /**
   * Subscribe to updates for a specific Ketal session
   */
  async subscribeToSession<T extends object = Record<string, unknown>>(
    sessionId: string,
    callback: SubscriptionCallback<T>
  ): Promise<string> {
    return this.createSubscription(this.buildDocumentChannel(COLLECTIONS.KETAL_SESSIONS, sessionId), callback);
  }

  /**
   * Subscribe to member updates for a specific room
   */
  async subscribeToMembers(roomId: string, callback: SubscriptionCallback<GameMember>): Promise<string> {
    const channel = this.buildCollectionChannel(COLLECTIONS.GAME_MEMBERS);
    const filtered: SubscriptionCallback<GameMember> = (member) => {
      if (member.roomId === roomId) {
        callback(member);
      }
    };
    return this.createSubscription(channel, filtered);
  }

  /**
   * Subscribe to all documents in a collection
   */
  async subscribeToCollection<T extends object>(
    collectionId: string,
    callback: SubscriptionCallback<T>
  ): Promise<string> {
    return this.createSubscription(this.buildCollectionChannel(collectionId), callback);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this._subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.close();
      this._subscriptions.delete(subscriptionId);
      this.updateSubscriptionCount();
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this._subscriptions.forEach((subscription) => subscription.close());
    this._subscriptions.clear();
    this.updateSubscriptionCount();
  }

  hasSubscription(subscriptionId: string): boolean {
    return this._subscriptions.has(subscriptionId);
  }

  getActiveSubscriptionIds(): string[] {
    return Array.from(this._subscriptions.keys());
  }

  /**
   * Create a realtime subscription on the given channel, wrapping the native
   * v25 RealtimeSubscription so the rest of the app sees a sync API.
   */
  private async createSubscription<T extends object>(
    channel: string,
    callback: SubscriptionCallback<T>
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    const wrappedCallback = (response: RealtimeResponseEvent<T>) => {
      if (response.payload) {
        callback(response.payload);
      }
    };

    const realSub: RealtimeSubscription = await this.appwrite.subscribe<T>(channel, wrappedCallback);

    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      close: () => {
        realSub
          .close()
          .catch((err: unknown) => console.warn(`[RealtimeService] close failed for ${subscriptionId}:`, err));
      },
    };

    this._subscriptions.set(subscriptionId, subscription);
    this.updateSubscriptionCount();

    return subscriptionId;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /** Channel for a single row, using Appwrite Channel builder */
  private buildDocumentChannel(collectionId: string, documentId: string): string {
    return Channel.tablesdb(DATABASE_ID).table(collectionId).row(documentId).toString();
  }

  /** Channel for an entire table, using Appwrite Channel builder */
  private buildCollectionChannel(collectionId: string): string {
    return Channel.tablesdb(DATABASE_ID).table(collectionId).row().toString();
  }

  private updateSubscriptionCount(): void {
    this._subscriptionCount.set(this._subscriptions.size);
  }

  /**
   * Broadcast an event to all members of a room.
   *
   * Real fan-out requires an Appwrite Cloud Function; this method is a
   * placeholder that logs the intended event.
   */
  broadcastToRoom(roomId: string, event: string, data: Record<string, unknown>): void {
    console.log(`[RealtimeService] Broadcasting event '${event}' to room ${roomId}`, data);
  }
}
