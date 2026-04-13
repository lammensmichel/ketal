import { inject, Injectable, signal } from '@angular/core';
import { GameRoom, RoomService } from '../room/room.service';
import { KetalSession, KetalSessionService } from '../ketal-session/ketal-session.service';

/**
 * SoloRoomService - Manages background solo room creation for backend-first sessions
 *
 * After login (any method), a solo room is auto-created in the background while
 * the user adds player names. When "Debuter la Grosse Guinze" is clicked,
 * the room Promise is awaited to create a KetalSession.
 *
 * Uses Angular 19 patterns: injectable, signals, inject().
 */
@Injectable({
  providedIn: 'root',
})
export class SoloRoomService {
  private readonly roomService = inject(RoomService);
  private readonly ketalSessionService = inject(KetalSessionService);

  /** Promise for the background solo room creation */
  private _roomPromise: Promise<GameRoom | null> | null = null;

  /** Signal indicating if room creation failed (triggers local mode fallback) */
  private readonly _localModeFallback = signal(false);

  /** Public readonly signal for local mode fallback state */
  readonly localModeFallback = this._localModeFallback.asReadonly();

  /** Signal indicating if background room creation is in progress */
  private readonly _isCreating = signal(false);

  /** Public readonly signal for creation state */
  readonly isCreating = this._isCreating.asReadonly();

  /**
   * Start background solo room creation.
   * Stores the Promise so it can be awaited later when the game begins.
   * If creation fails, sets localModeFallback flag.
   */
  startBackgroundRoomCreation(): void {
    // Don't create if already in progress or if a room already exists
    if (this._roomPromise || this.roomService.currentRoom()) {
      return;
    }

    this._localModeFallback.set(false);
    this._isCreating.set(true);

    this._roomPromise = this.roomService
      .createSoloRoom()
      .then((room) => {
        this._isCreating.set(false);
        return room;
      })
      .catch((error) => {
        console.warn('[SoloRoomService] Background room creation failed, falling back to local mode:', error);
        this._localModeFallback.set(true);
        this._isCreating.set(false);
        this._roomPromise = null; // Allow retry
        return null; // Swallow error to avoid unhandled promise rejection
      });
  }

  /**
   * Await the background room creation Promise.
   * Returns the room if successful, null if failed (local mode fallback).
   */
  async awaitRoom(): Promise<GameRoom | null> {
    if (this._localModeFallback()) {
      return null;
    }

    if (!this._roomPromise) {
      // No room creation was started; check if room already exists
      const existingRoom = this.roomService.currentRoom();
      if (existingRoom) {
        return existingRoom;
      }
      return null;
    }

    try {
      return await this._roomPromise;
    } catch {
      return null;
    }
  }

  /**
   * Check if there is an active session to resume.
   * Returns the session if found, null otherwise.
   */
  async checkActiveSession(): Promise<KetalSession | null> {
    const currentSession = this.ketalSessionService.currentSession();
    if (currentSession && currentSession.status !== 'finished') {
      return currentSession;
    }

    // Check if current room has an active session
    const room = this.roomService.currentRoom();
    if (room?.currentSessionId) {
      try {
        const session = await this.ketalSessionService.getSession(room.currentSessionId);
        if (session && session.status !== 'finished') {
          this.ketalSessionService.setCurrentSession(session);
          return session;
        }
      } catch {
        // Session not found, continue
      }
    }

    return null;
  }

  /**
   * Reset the solo room service state.
   * Called when game ends or user leaves.
   */
  reset(): void {
    this._roomPromise = null;
    this._localModeFallback.set(false);
    this._isCreating.set(false);
  }
}
