import { computed, Injectable, signal } from '@angular/core';

/**
 * Interface representing a guest's identity
 */
export interface GuestIdentity {
  /** Unique device identifier (UUID v4) stored in localStorage */
  deviceId: string;
  /** User-chosen display name */
  displayName: string;
  /** ISO date string of when the identity was created */
  createdAt: string;
}

/**
 * GuestService - Manages anonymous guest identity for Ketal multiplayer
 *
 * Provides device identification and display name management for guests
 * who join game rooms without a FUG account.
 *
 * Uses Angular 19 patterns with signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class GuestService {
  private readonly STORAGE_KEY = 'ketal_guest_identity';
  private readonly DEFAULT_DISPLAY_NAME = 'Invité';

  /** Signal holding the current guest identity */
  private readonly _guestIdentity = signal<GuestIdentity | null>(null);

  /** Public readonly signal for guest identity */
  readonly guestIdentity = this._guestIdentity.asReadonly();

  /** Computed signal for device ID - creates one if not exists */
  readonly deviceId = computed(() => this._guestIdentity()?.deviceId ?? this.getOrCreateDeviceId());

  /** Computed signal for display name - returns default if not set */
  readonly displayName = computed(() => this._guestIdentity()?.displayName ?? this.DEFAULT_DISPLAY_NAME);

  /** Computed signal to check if guest has a custom display name */
  readonly hasCustomName = computed(() => {
    const identity = this._guestIdentity();
    return identity !== null && identity.displayName !== this.DEFAULT_DISPLAY_NAME;
  });

  constructor() {
    this.init();
  }

  /**
   * Initialize the service by loading identity from localStorage
   */
  init(): void {
    const stored = this.loadFromStorage();
    if (stored) {
      this._guestIdentity.set(stored);
    }
  }

  /**
   * Get existing device ID or create a new one
   */
  getOrCreateDeviceId(): string {
    const existing = this._guestIdentity();
    if (existing?.deviceId) {
      return existing.deviceId;
    }

    const stored = this.loadFromStorage();
    if (stored?.deviceId) {
      this._guestIdentity.set(stored);
      return stored.deviceId;
    }

    const newIdentity: GuestIdentity = {
      deviceId: this.generateDeviceId(),
      displayName: this.DEFAULT_DISPLAY_NAME,
      createdAt: new Date().toISOString(),
    };

    this._guestIdentity.set(newIdentity);
    this.saveToStorage();

    return newIdentity.deviceId;
  }

  /**
   * Set the guest's display name
   */
  setDisplayName(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const current = this._guestIdentity();
    if (current) {
      this._guestIdentity.set({
        ...current,
        displayName: trimmedName,
      });
    } else {
      this._guestIdentity.set({
        deviceId: this.generateDeviceId(),
        displayName: trimmedName,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveToStorage();
  }

  /**
   * Clear the guest identity from memory and localStorage
   */
  clearIdentity(): void {
    this._guestIdentity.set(null);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Save current identity to localStorage
   */
  private saveToStorage(): void {
    const identity = this._guestIdentity();
    if (!identity) {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(identity));
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Load identity from localStorage
   */
  private loadFromStorage(): GuestIdentity | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as GuestIdentity;

      if (!parsed.deviceId || !parsed.displayName || !parsed.createdAt) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Generate a UUID v4 device ID
   */
  private generateDeviceId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
