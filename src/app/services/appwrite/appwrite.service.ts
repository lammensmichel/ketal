import { Injectable, signal } from '@angular/core';
import { Client, Account, Databases, Realtime, RealtimeSubscription, RealtimeResponseEvent } from 'appwrite';
import { environment } from '../../../environments/environment';

/**
 * Database ID for the FUG backend
 */
export const DATABASE_ID = 'fug';

/**
 * AppwriteService - Core service for Appwrite SDK initialization
 *
 * Provides access to Appwrite Client, Account, Databases, and Realtime functionality.
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class AppwriteService {
  private readonly _client: Client;
  private readonly _account: Account;
  private readonly _databases: Databases;

  /** Singleton Realtime instance for subscribing to channels (v25) */
  private readonly _realtime: Realtime;

  /** Signal indicating if the service is initialized */
  private readonly _initialized = signal<boolean>(false);
  readonly initialized = this._initialized.asReadonly();

  /** Signal for connection status */
  private readonly _connected = signal<boolean>(false);
  readonly connected = this._connected.asReadonly();

  constructor() {
    // Initialize Appwrite Client
    this._client = new Client().setEndpoint(environment.appwrite.endpoint).setProject(environment.appwrite.projectId);

    // Initialize services
    this._account = new Account(this._client);
    this._databases = new Databases(this._client);
    this._realtime = new Realtime(this._client);

    // Add error handler for Realtime WebSocket issues
    this._realtime.onError((error: any, statusCode) => {
      console.error('[AppwriteService] Realtime error:', error, 'StatusCode:', statusCode);
    });

    this._initialized.set(true);
  }

  /**
   * Get the Appwrite Client instance
   */
  get client(): Client {
    return this._client;
  }

  /**
   * Get the Appwrite Account service
   */
  get account(): Account {
    return this._account;
  }

  /**
   * Get the Appwrite Databases service
   */
  get databases(): Databases {
    return this._databases;
  }

  /**
   * Get the database ID
   */
  get databaseId(): string {
    return DATABASE_ID;
  }

  /**
   * Wait for Realtime connection to be established
   * Workaround for Appwrite v25.0.0 SDK timing bug where subscribe() returns
   * before the WebSocket is fully connected and ready to receive messages.
   *
   * The bug: WebSocket opens but server closes with "Missing channels" before
   * client can send subscribe message due to race in createSocket() + subscribe()
   * not waiting for socket.readyState === OPEN
   */
  async waitForRealtimeConnection(timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    // The Realtime class has a _socket property but it's not exposed publicly
    // We'll use a workaround: try to subscribe and see if we get a response
    // Or check if the underlying socket exists and is open

    while (Date.now() - startTime < timeout) {
      // Check if we're connected by checking internal state
      // Since we can't access private properties, we'll use a sentinel callback
      // that fires when connection is established

      // Try to get socket state via the connectionId
      // If _connectionId is set and socket is open, we're ready
      try {
        // Use a quick test - try to get the socket state
        const hasSocket = (this._realtime as any)._socket !== undefined;
        if (hasSocket) {
          const socketReadyState = (this._realtime as any)._socket?.readyState;
          // WebSocket.OPEN = 1
          if (socketReadyState === 1) {
            return true;
          }
        }
      } catch (e) {
        // Ignore errors, just continue waiting
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return false;
  }

  /**
   * Subscribe to realtime events for a specific channel(s).
   * Uses Appwrite v25 {@link Realtime} class, returning a Promise<RealtimeSubscription>.
   * The subscription's `unsubscribe()` and `close()` methods are async.
   *
   * THIS METHOD WAITS FOR WEBSOCKET CONNECT BEFORE RETURNING to work around
   * Appwrite v25.0.0 SDK timing bug where subscribe() returns before WebSocket
   * is ready to receive messages.
   *
   * @param channels - Array of channels to subscribe to
   * @param callback - Callback function to handle realtime events
   * @param timeout - Maximum time to wait for WebSocket connection (default: 5000ms)
   * @returns A promise resolving to a {@link RealtimeSubscription} object with
   *          `unsubscribe()`, `close()`, and `update()` methods.
   *
   * @example
   * // Subscribe to a collection
   * const sub = await appwriteService.subscribe(
   *   [`databases.${DATABASE_ID}.collections.ketal_rooms.documents`],
   *   (response) => console.log(response)
   * );
   *
   * // Later, unsubscribe
   * await sub.unsubscribe();
   */
  async subscribe<T extends object>(
    channels: string | string[],
    callback: (response: RealtimeResponseEvent<T>) => void,
    timeout: number = 5000
  ): Promise<RealtimeSubscription> {
    const channelList = Array.isArray(channels) ? channels : [channels];

    // Subscribe first to trigger WebSocket connection
    const subscription = await this._realtime.subscribe(channelList, callback);

    // Workaround: Wait for WebSocket to be ready before returning
    // The SDK bug causes subscription to be returned before WebSocket can send
    // subscribe message to server, resulting in "Missing channels" error
    const connected = await this.waitForRealtimeConnection(timeout);

    if (!connected) {
      console.warn('[AppwriteService] waitForRealtimeConnection timed out - subscription may not be fully established');
    }

    return subscription;
  }

  /**
   * Set connection status
   * Used internally to track realtime connection state
   */
  setConnected(status: boolean): void {
    this._connected.set(status);
  }
}
