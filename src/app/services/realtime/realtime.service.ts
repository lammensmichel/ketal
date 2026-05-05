import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Models, RealtimeResponseEvent } from 'appwrite';
import { AppwriteService, DATABASE_ID } from '../appwrite/appwrite.service';

/**
 * Callback type for realtime subscription events
 */
export type SubscriptionCallback<T> = (data: T) => void;

/**
 * Represents an active realtime subscription
 */
export interface Subscription {
  id: string;
  channel: string;
  unsubscribe: () => void;
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
  subscribeToRoom(roomId: string, callback: SubscriptionCallback<GameRoom>): string {
    const channel = this.buildDocumentChannel(COLLECTIONS.GAME_ROOMS, roomId);
    return this.createSubscription<GameRoom>(channel, callback);
  }

  /**
   * Subscribe to updates for a specific document in any collection
   */
  subscribeToDocument<T extends object>(
    collectionId: string,
    documentId: string,
    callback: SubscriptionCallback<T>
  ): string {
    const channel = this.buildDocumentChannel(collectionId, documentId);
    return this.createSubscription<T>(channel, callback);
  }

  /**
   * Subscribe to updates for a specific Ketal session
   */
  subscribeToSession<T extends object = Record<string, unknown>>(
    sessionId: string,
    callback: SubscriptionCallback<T>
  ): string {
    const channel = this.buildDocumentChannel(COLLECTIONS.KETAL_SESSIONS, sessionId);
    return this.createSubscription<T>(channel, callback);
  }

  /**
   * Subscribe to member updates for a specific room
   */
  subscribeToMembers(roomId: string, callback: SubscriptionCallback<GameMember>): string {
    const channel = this.buildCollectionChannel(COLLECTIONS.GAME_MEMBERS);

    const filteredCallback: SubscriptionCallback<GameMember> = (member) => {
      if (member.roomId === roomId) {
        callback(member);
      }
    };

    return this.createSubscription<GameMember>(channel, filteredCallback);
  }

  /**
   * Subscribe to all documents in a collection
   */
  subscribeToCollection<T extends object>(collectionId: string, callback: SubscriptionCallback<T>): string {
    const channel = this.buildCollectionChannel(collectionId);
    return this.createSubscription<T>(channel, callback);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this._subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this._subscriptions.delete(subscriptionId);
      this.updateSubscriptionCount();
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this._subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
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
   * Create a realtime subscription
   */
  private createSubscription<T extends object>(channel: string, callback: SubscriptionCallback<T>): string {
    const subscriptionId = this.generateSubscriptionId();

    const wrappedCallback = (response: RealtimeResponseEvent<T>) => {
      this.appwrite.setConnected(true);

      if (response.payload) {
        callback(response.payload);
      }
    };

    const unsubscribe = this.appwrite.subscribe<T>(channel, wrappedCallback);

    const subscription: Subscription = {
      id: subscriptionId,
      channel,
      unsubscribe,
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
   *
   * @param roomId - The room ID to broadcast to
   * @param event - The event name (e.g., 'room_renamed', 'member_left')
   * @param data - Event-specific payload data
   */
  broadcastToRoom(roomId: string, event: string, data: Record<string, unknown>): void {
    // Log the event for debugging
    console.log(`[RealtimeService] Broadcasting event '${event}' to room ${roomId}`, data);
    // Note: Actual broadcast requires Appwrite Cloud Functions in production
  }
}
