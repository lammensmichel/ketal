import { Injectable, signal } from '@angular/core';
import { Account, Client, Databases, Realtime, RealtimeResponseEvent, RealtimeSubscription } from 'appwrite';
import { environment } from '../../../environments/environment';

/**
 * Database ID for the FUG backend
 */
export const DATABASE_ID = 'fug';

/**
 * AppwriteService - thin wrapper around the Appwrite Web SDK (v24.2.0, server 1.9.0).
 *
 * Exposes the Client, Account, Databases and Realtime singletons used across the app.
 * Realtime connection state is mirrored into a Signal for reactive consumers.
 */
@Injectable({
  providedIn: 'root',
})
export class AppwriteService {
  private readonly _client: Client;
  private readonly _account: Account;
  private readonly _databases: Databases;
  private readonly _realtime: Realtime;

  private readonly _initialized = signal<boolean>(false);
  readonly initialized = this._initialized.asReadonly();

  private readonly _connected = signal<boolean>(false);
  readonly connected = this._connected.asReadonly();

  constructor() {
    this._client = new Client()
      .setEndpoint(environment.appwrite.endpoint)
      .setEndpointRealtime(environment.appwrite.endpointRealtime)
      .setProject(environment.appwrite.projectId);

    this._account = new Account(this._client);
    this._databases = new Databases(this._client);
    this._realtime = new Realtime(this._client);

    this._realtime.onOpen(() => this._connected.set(true));
    this._realtime.onClose(() => this._connected.set(false));
    this._realtime.onError((error, statusCode) => {
      console.error('[AppwriteService] Realtime error:', error, 'statusCode:', statusCode);
    });

    this._initialized.set(true);
  }

  get client(): Client {
    return this._client;
  }

  get account(): Account {
    return this._account;
  }

  get databases(): Databases {
    return this._databases;
  }

  get realtime(): Realtime {
    return this._realtime;
  }

  get databaseId(): string {
    return DATABASE_ID;
  }

  /**
   * Subscribe to one or more realtime channels.
   *
   * Channel format (Appwrite 1.9.x):
   *   tablesdb.<DB_ID>.tables.<TABLE_ID>.rows[.<ROW_ID>][.<EVENT>]
   *
   * The SDK manages the WebSocket lifecycle internally: subscribe() awaits the
   * 'open' event before sending the subscribe message, so no client-side wait
   * is needed.
   */
  subscribe<T extends object>(
    channels: string | string[],
    callback: (response: RealtimeResponseEvent<T>) => void
  ): Promise<RealtimeSubscription> {
    return Array.isArray(channels)
      ? this._realtime.subscribe<T>(channels, callback)
      : this._realtime.subscribe<T>(channels, callback);
  }
}
