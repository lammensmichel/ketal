import { Injectable, signal } from '@angular/core';
import { Client, Account, Databases, RealtimeResponseEvent } from 'appwrite';
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
   * Subscribe to realtime events for a specific channel
   *
   * @param channels - Array of channels to subscribe to
   * @param callback - Callback function to handle realtime events
   * @returns Unsubscribe function
   *
   * @example
   * // Subscribe to a collection
   * const unsubscribe = appwriteService.subscribe(
   *   [`databases.${DATABASE_ID}.collections.ketal_rooms.documents`],
   *   (response) => console.log(response)
   * );
   *
   * // Later, unsubscribe
   * unsubscribe();
   */
  subscribe<T extends object>(
    channels: string | string[],
    callback: (response: RealtimeResponseEvent<T>) => void
  ): () => void {
    return this._client.subscribe(channels, callback);
  }

  /**
   * Set connection status
   * Used internally to track realtime connection state
   */
  setConnected(status: boolean): void {
    this._connected.set(status);
  }
}
