import { computed, inject, Injectable, Optional, signal } from '@angular/core';
import { ID, Models, OAuthProvider } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { GameService } from '../game/game.service';
import { RoomService } from '../room/room.service';
import { MemberService } from '../member/member.service';
import { KetalSessionService } from '../ketal-session/ketal-session.service';
import { RealtimeService } from '../realtime/realtime.service';
import { LocalService } from '../local/local.service';

/**
 * AuthService - Authentication service for Appwrite
 *
 * Provides authentication functionality supporting both authenticated users
 * (FUG users) and anonymous sessions (guests). Uses Angular 19 patterns
 * with signals for reactive state management.
 *
 * @example
 * // Initialize on app start
 * await authService.init();
 *
 * // Get or create a session (creates anonymous if none exists)
 * const user = await authService.getOrCreateSession();
 *
 * // Login with email/password
 * await authService.loginWithEmail('user@example.com', 'password');
 *
 * // Check authentication state
 * if (authService.isLoggedIn()) {
 *   console.log('User:', authService.currentUser());
 * }
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly appwrite = inject(AppwriteService);
  private readonly roomService = inject(RoomService);
  private readonly memberService = inject(MemberService);
  private readonly ketalSessionService = inject(KetalSessionService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly localService = inject(LocalService);
  @Optional() private gameService?: GameService;

  /** Signal holding the current user, null if not authenticated */
  private readonly _currentUser = signal<Models.User<Models.Preferences> | null>(null);

  /** Public readonly signal for current user */
  readonly currentUser = this._currentUser.asReadonly();

  /** Computed signal indicating if a user is logged in */
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  /** Computed signal indicating if the current session is anonymous */
  readonly isAnonymous = computed(() => {
    const user = this._currentUser();
    return user !== null && user.email === '';
  });

  /** Signal indicating if an async operation is in progress */
  private readonly _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();

  /**
   * Initialize the auth service by checking for an existing session
   *
   * Should be called on app startup to restore any existing session.
   * If no valid session exists or Appwrite is unavailable, the user will remain null.
   * Uses a timeout to prevent blocking when backend is unreachable.
   */
  /** Cached init promise to ensure idempotent calls */
  private _initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    // Return cached promise if already initializing/initialized (idempotent)
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this._doInit();
    return this._initPromise;
  }

  private async _doInit(): Promise<void> {
    this._isLoading.set(true);
    try {
      // Add timeout to prevent blocking when Appwrite is unavailable
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth init timeout')), 5000)
      );
      const user = await Promise.race([this.appwrite.account.get(), timeoutPromise]);
      this._currentUser.set(user);
    } catch {
      // No valid session exists or Appwrite unavailable, user remains null
      this._currentUser.set(null);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sign up a new user with email and password
   *
   * Creates a new account and automatically signs them in.
   * On success, updates the currentUser signal.
   *
   * @param email - User's email address
   * @param password - User's password (min 8 characters)
   * @param name - User's display name
   * @throws Error if registration fails
   */
  async signUp(email: string, password: string, name: string): Promise<void> {
    this._isLoading.set(true);
    try {
      // Logout any existing session first (e.g., guest session)
      try {
        await this.appwrite.account.deleteSession({ sessionId: 'current' });
      } catch {
        // No session to delete, continue
      }

      // Create the account
      await this.appwrite.account.create({
        userId: ID.unique(),
        email,
        password,
        name,
      });

      // Create a session (log in the user)
      await this.appwrite.account.createEmailPasswordSession({ email, password });

      // Get user data and update state
      const user = await this.appwrite.account.get();
      this._currentUser.set(user);
    } catch (error) {
      this._currentUser.set(null);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Sign in with Google OAuth
   *
   * Redirects to Google for authentication, then back to the app.
   * The callback URL should call init() to restore the session.
   */
  signInWithGoogle(): void {
    const successUrl = window.location.origin + '/';
    const failureUrl = window.location.origin + '/login';
    this.appwrite.account.createOAuth2Session({
      provider: OAuthProvider.Google,
      success: successUrl,
      failure: failureUrl,
    });
  }

  /**
   * Login with email and password
   *
   * Creates a new session for the user with the provided credentials.
   * On success, updates the currentUser signal.
   *
   * @param email - User's email address
   * @param password - User's password
   * @throws Error if login fails (invalid credentials, network error, etc.)
   */
  async loginWithEmail(email: string, password: string): Promise<void> {
    this._isLoading.set(true);
    try {
      // Logout any existing session first (e.g., guest session)
      try {
        await this.appwrite.account.deleteSession({ sessionId: 'current' });
      } catch {
        // No session to delete, continue
      }

      await this.appwrite.account.createEmailPasswordSession({ email, password });
      const user = await this.appwrite.account.get();
      this._currentUser.set(user);
    } catch (error) {
      this._currentUser.set(null);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Lazy injector reference for GameService to break circular dependency
   */
  private getGameService(): GameService | undefined {
    return this.gameService;
  }

  /**
   * Logout the current user
   *
   * Clears all game state (GameService, room, session, members, realtime
   * subscriptions, localStorage game data), then deletes the Appwrite session
   * and resets the user signal.
   * Safe to call even if no session exists.
   */
  async logout(): Promise<void> {
    this._isLoading.set(true);
    // Cleanup game state — each step is isolated so one failure doesn't skip the rest
    try {
      this.getGameService()?.resetGame();
    } catch {
      /* non-critical */
    }
    try {
      this.roomService.setCurrentRoom(null);
    } catch {
      /* non-critical */
    }
    try {
      this.memberService.clearMembers();
    } catch {
      /* non-critical */
    }
    try {
      this.ketalSessionService.setCurrentSession(null);
    } catch {
      /* non-critical */
    }
    try {
      this.realtimeService.unsubscribeAll();
    } catch {
      /* non-critical */
    }
    try {
      this.localService.removeData('game');
      this.localService.removeData('players');
    } catch {
      /* non-critical */
    }

    // Delete the Appwrite session
    try {
      await this.appwrite.account.deleteSession({ sessionId: 'current' });
    } catch {
      // Session might already be invalid, ignore errors
    } finally {
      this._currentUser.set(null);
      this._isLoading.set(false);
    }
  }

  /**
   * Check and consume the pendingSummary flag from localStorage.
   * Returns true if the flag was set (and clears it).
   * Used after login, registration, or OAuth callback to redirect to summary.
   */
  consumePendingSummary(): boolean {
    const pending = localStorage.getItem('pendingSummary');
    if (pending === 'true') {
      localStorage.removeItem('pendingSummary');
      return true;
    }
    return false;
  }

  /**
   * Create an anonymous session
   *
   * Creates a new anonymous session for guest users.
   * If a session already exists, uses that session instead.
   * Anonymous users have an empty email string.
   *
   * @throws Error if anonymous session creation fails
   */
  async createAnonymousSession(): Promise<void> {
    this._isLoading.set(true);
    try {
      await this.appwrite.account.createAnonymousSession();
      const user = await this.appwrite.account.get();
      this._currentUser.set(user);
    } catch (error: unknown) {
      // If session already exists, try to use it
      if (error instanceof Error && error.message.includes('session is active')) {
        try {
          const user = await this.appwrite.account.get();
          this._currentUser.set(user);
          return;
        } catch {
          // Failed to get existing session
        }
      }
      this._currentUser.set(null);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get the current user or create an anonymous session
   *
   * Convenience method that:
   * 1. Returns the current user if one exists
   * 2. Tries to restore an existing session
   * 3. Creates an anonymous session if no session exists
   *
   * @returns The current user (authenticated or anonymous)
   * @throws Error if session creation fails
   */
  async getOrCreateSession(): Promise<Models.User<Models.Preferences>> {
    // Return existing user if available
    const existingUser = this._currentUser();
    if (existingUser) {
      return existingUser;
    }

    this._isLoading.set(true);
    try {
      // Try to get existing session
      const user = await this.appwrite.account.get();
      this._currentUser.set(user);
      return user;
    } catch {
      // No existing session, create anonymous
      try {
        await this.appwrite.account.createAnonymousSession();
        const user = await this.appwrite.account.get();
        this._currentUser.set(user);
        return user;
      } catch (error) {
        this._currentUser.set(null);
        throw error;
      }
    } finally {
      this._isLoading.set(false);
    }
  }
}
