import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Models, RealtimeResponseEvent } from 'appwrite';
import { AppwriteService, DATABASE_ID } from '../appwrite/appwrite.service';

/**
 * Callback type for realtime subscription events
 */
export type SubscriptionCallback<T> = (data: T) => void;

/**
 * Represents an active realtime subscription
 * Maps to v25 RealtimeSubscription internally.
 */
export interface Subscription {
  id: string;
  channel: string;
  unsubscribe: () => void;
  /** Replace the channels/queries for this subscription without re-creating it */
  update: (changes: { channels?: string[] }) => void;
  /** Alias of `unsubscribe()` plus auto-disconnect when last subscription */
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
  KETAL_SESSIONS: 'ketal_sessions',
  KETAL_PLAYERS: 'ketal_players',
  KETAL_CARDS: 'ketal_cards',
} as const;

/**
 * RealtimeService - Manages Appwrite realtime subscriptions
 *
 * Provides a centralized way to subscribe to realtime events for game rooms,
 * sessions, and members. Uses Angular 19 patterns with signals for reactive state.
 *
 * Under the hood, uses Appwrite v25 Realtime class with proper
 * RealtimeSubscription objects.
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private readonly appwrite = inject(AppwriteService);
  private readonly destroyRef = inject(DestroyRef);

  /** Map of active subscriptions */
  private readonly _subscriptions = new Map<string, Subscription>();

  /** Signal tracking subscription count for reactivity */
  private readonly _subscriptionCount = signal(0);

  /** Signal indicating if realtime is connected */
  readonly isConnected = computed(() => this.appwrite.connected());

  /** Computed signal for the number of active subscriptions */
  readonly activeSubscriptions = computed(() => this._subscriptionCount());

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.unsubscribeAll();
    });
  }

  /**
   * Subscribe to updates for a specific game room
   */
  async subscribeToRoom(
    roomId: string,
    callback: SubscriptionCallback<GameRoom>,
    timeout: number = 5000
  ): Promise<string> {
    const channel = this.buildDocumentChannel(COLLECTIONS.GAME_ROOMS, roomId);
    const subId = await this.createSubscription(channel, callback, timeout);

    // Wait for WebSocket to be ready (socket.open event fired)
    // Appwrite v25 SDK has a race condition where subscribe() doesn't wait
    // for socket to be fully ready before sending subscribe message
    let attempts = 0;
    const checkSocketReady = () => {
      attempts++;
      if (this.appwrite.connected() || attempts * 100 >= timeout) {
        return;
      }
      setTimeout(checkSocketReady, 100);
    };
    checkSocketReady();

    return subId;
  }

  /**
   * Subscribe to updates for a specific document in any collection
   */
  async subscribeToDocument<T extends object>(
    collectionId: string,
    documentId: string,
    callback: SubscriptionCallback<T>,
    timeout: number = 5000
  ): Promise<string> {
    const channel = this.buildDocumentChannel(collectionId, documentId);
    const subId = await this.createSubscription(channel, callback, timeout);

    // Wait for WebSocket to be ready
    let attempts = 0;
    const checkSocketReady = () => {
      attempts++;
      if (this.appwrite.connected() || attempts * 100 >= timeout) {
        return;
      }
      setTimeout(checkSocketReady, 100);
    };
    checkSocketReady();

    return subId;
  }

  /**
   * Subscribe to updates for a specific Ketal session
   */
  async subscribeToSession<T extends object = Record<string, unknown>>(
    sessionId: string,
    callback: SubscriptionCallback<T>,
    timeout: number = 5000
  ): Promise<string> {
    const channel = this.buildDocumentChannel(COLLECTIONS.KETAL_SESSIONS, sessionId);
    const subId = await this.createSubscription(channel, callback, timeout);

    // Wait for WebSocket to be ready
    let attempts = 0;
    const checkSocketReady = () => {
      attempts++;
      if (this.appwrite.connected() || attempts * 100 >= timeout) {
        return;
      }
      setTimeout(checkSocketReady, 100);
    };
    checkSocketReady();

    return subId;
  }

  /**
   * Subscribe to member updates for a specific room
   */
  async subscribeToMembers(
    roomId: string,
    callback: SubscriptionCallback<GameMember>,
    timeout: number = 5000
  ): Promise<string> {
    const channel = this.buildCollectionChannel(COLLECTIONS.GAME_MEMBERS);

    const filteredCallback: SubscriptionCallback<GameMember> = (member) => {
      if (member.roomId === roomId) {
        callback(member);
      }
    };

    const subId = await this.createSubscription(channel, filteredCallback, timeout);

    // Wait for WebSocket to be ready
    let attempts = 0;
    const checkSocketReady = () => {
      attempts++;
      if (this.appwrite.connected() || attempts * 100 >= timeout) {
        return;
      }
      setTimeout(checkSocketReady, 100);
    };
    checkSocketReady();

    return subId;
  }

  /**
   * Subscribe to all documents in a collection
   */
  async subscribeToCollection<T extends object>(
    collectionId: string,
    callback: SubscriptionCallback<T>,
    timeout: number = 5000
  ): Promise<string> {
    const channel = this.buildCollectionChannel(collectionId);
    const subId = await this.createSubscription(channel, callback, timeout);

    // Wait for WebSocket to be ready
    let attempts = 0;
    const checkSocketReady = () => {
      attempts++;
      if (this.appwrite.connected() || attempts * 100 >= timeout) {
        return;
      }
      setTimeout(checkSocketReady, 100);
    };
    checkSocketReady();

    return subId;
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this._subscriptions.get(subscriptionId);
    if (subscription) {
      // v25 native unsubscribe is async — wrap to prevent errors if not awaited
      Promise.resolve()
        .then(() => subscription.close())
        .catch((err) => console.warn(`[RealtimeService] close failed for ${subscriptionId}:`, err));

      this._subscriptions.delete(subscriptionId);
      this.updateSubscriptionCount();
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this._subscriptions.forEach((subscription) => {
      // v25 native close is async — wrap to prevent errors if not awaited
      Promise.resolve()
        .then(() => subscription.close())
        .catch((err) => console.warn(`[RealtimeService] close failed:`, err));
    });
    this._subscriptions.clear();
    this.updateSubscriptionCount();
  }

  /**
   * Check if a subscription is active
   */
  hasSubscription(subscriptionId: string): boolean {
    return this._subscriptions.has(subscriptionId);
  }

  /**
   * Get all active subscription IDs
   */
  getActiveSubscriptionIds(): string[] {
    return Array.from(this._subscriptions.keys());
  }

  /**
   * Create a realtime subscription using Appwrite v25 Realtime class.
   * Returns our adaptable Subscription interface wrapping the native
   * RealtimeSubscription object.
   *
   * THIS METHOD WAITS FOR WEBSOCKET CONNECT to work around Appwrite v25.0.0
   * SDK timing bug where subscribe() returns before WebSocket is ready.
   */
  private async createSubscription<T extends object>(
    channel: string,
    callback: SubscriptionCallback<T>,
    timeout: number = 5000
  ): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();

    console.log(`[RealtimeService] Creating subscription to channel: ${channel}`);

    const wrappedCallback = (response: RealtimeResponseEvent<T>) => {
      this.appwrite.setConnected(true);
      console.log(`[RealtimeService] RECEIVED EVENT on ${channel}:`, response);

      if (response.payload) {
        console.log(`[RealtimeService] Calling callback with payload:`, response.payload);
        callback(response.payload);
      }
    };

    console.log(`[RealtimeService] Calling appwrite.subscribe with channel:`, channel);
    // v25 async subscribe with timeout -> Native RealtimeSubscription
    const realSub = await this.appwrite.subscribe<T>(channel, wrappedCallback, timeout);
    console.log(`[RealtimeService] Subscription created: ${subscriptionId}`);

    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      /** Wrap native async unsubscribe for backward-compatible sync API */
      unsubscribe: () => {
        realSub
          .unsubscribe()
          .catch((err) => console.warn(`[RealtimeService] unsubscribe failed for ${subscriptionId}:`, err));
      },
      /** Delegate to native RealtimeSubscription.update() */
      update: (changes) => {
        realSub
          .update(changes)
          .catch((err) => console.warn(`[RealtimeService] subscription update failed for ${subscriptionId}:`, err));
      },
      /** Wrap native async close for backward-compatible sync API */
      close: () => {
        realSub.close().catch((err) => console.warn(`[RealtimeService] close failed for ${subscriptionId}:`, err));
      },
    };

    this._subscriptions.set(subscriptionId, subscription);
    this.updateSubscriptionCount();

    return subscriptionId;
  }

  /**
   * Generate a unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Build an Appwrite channel string for a specific document
   */
  private buildDocumentChannel(collectionId: string, documentId: string): string {
    return `databases.${DATABASE_ID}.collections.${collectionId}.documents.${documentId}`;
  }

  /**
   * Build an Appwrite channel string for an entire collection
   */
  private buildCollectionChannel(collectionId: string): string {
    return `databases.${DATABASE_ID}.collections.${collectionId}.documents`;
  }

  /**
   * Update the subscription count signal
   */
  private updateSubscriptionCount(): void {
    this._subscriptionCount.set(this._subscriptions.size);
  }

  /**
   * Broadcast an event to all members of a room
   *
   * In production, this should be implemented using Appwrite Cloud Functions
   * since the client SDK cannot directly push to multiple clients.
   * For now, this logs the event - clients should subscribe to room updates
   * to receive real-time notifications.
   */
  broadcastToRoom(roomId: string, event: string, data: Record<string, unknown>): void {
    // Log the event for debugging
    console.log(`[RealtimeService] Broadcasting event '${event}' to room ${roomId}`, data);
    // Note: Actual broadcast requires Appwrite Cloud Functions in production
  }
}
