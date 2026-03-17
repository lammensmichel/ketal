import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { RoomService } from '../../../services/room/room.service';
import { MemberService, GameMember, MemberRole } from '../../../services/member/member.service';
import { RealtimeService, GameMember as RealtimeGameMember } from '../../../services/realtime/realtime.service';
import { AuthService } from '../../../services/auth/auth.service';
import { GuestService } from '../../../services/guest/guest.service';
import { KetalSessionService, KetalPlayer } from '../../../services/ketal-session/ketal-session.service';

/** Maximum number of subscription retry attempts */
const MAX_SUBSCRIPTION_RETRIES = 3;

/** Delay between retry attempts in milliseconds */
const SUBSCRIPTION_RETRY_DELAY_MS = 2000;

/**
 * LobbyComponent - Room lobby for waiting players before game start
 *
 * Features:
 * - Display room name and join code
 * - List all members with role and online status
 * - Role management (host only)
 * - Start game button (host only, min 2 players required)
 * - Leave room functionality for non-hosts
 * - Realtime member updates via Appwrite
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush, DestroyRef.
 */
@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, QRCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LobbyComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly roomService = inject(RoomService);
  private readonly memberService = inject(MemberService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly ketalSessionService = inject(KetalSessionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Subscription ID for member realtime updates */
  private memberSubscriptionId: string | null = null;

  /** Guard flag to prevent concurrent member loads */
  private isMembersLoading = false;

  /** Current retry attempt count for realtime subscription */
  private subscriptionRetryCount = 0;

  /** Loading state for async operations */
  readonly isLoading = signal(false);

  /** Whether realtime WebSocket is connected */
  readonly isConnected = this.realtimeService.isConnected;

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** Current room from RoomService */
  readonly currentRoom = this.roomService.currentRoom;

  /** All members in the room from MemberService */
  readonly members = this.memberService.members;

  /** Current user's member record */
  readonly currentMember = this.memberService.currentMember;

  /** Whether current user is the host */
  readonly isHost = computed(() => {
    const member = this.currentMember();
    return member?.role === 'host';
  });

  /** Players count (excluding spectators) */
  readonly playerCount = computed(() => {
    return this.members().filter((m) => m.role === 'player' || m.role === 'host').length;
  });

  /** Maximum players allowed */
  readonly maxPlayers = computed(() => {
    return this.currentRoom()?.maxPlayers ?? 10;
  });

  /** Whether game can be started (host + min 2 players) */
  readonly canStartGame = computed(() => {
    return this.isHost() && this.playerCount() >= 2;
  });

  /** Sorted members list: host first, then players, then spectators */
  readonly sortedMembers = computed(() => {
    const membersList = this.members();
    return [...membersList].sort((a, b) => {
      const roleOrder = { host: 0, player: 1, spectator: 2 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
  });

  /** Computed signal for invite URL */
  readonly inviteUrl = computed(() => {
    const room = this.currentRoom();
    if (!room) {
      return '';
    }
    return `${window.location.origin}/room/join/${room.code}`;
  });

  /** Toggle QR code visibility */
  readonly showQrCode = signal(false);

  /** Toggle QR code display */
  toggleQrCode(): void {
    this.showQrCode.update((v) => !v);
  }

  ngOnInit(): void {
    this.initializeLobby();
    this.registerCleanup();
  }

  /**
   * Initialize lobby: restore room/member state from route param if needed,
   * then load members and subscribe to realtime updates.
   */
  private async initializeLobby(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      // If currentRoom is null (e.g. after page reload), restore from route param
      if (!this.currentRoom()) {
        const roomId = this.route.snapshot.paramMap.get('id');
        if (!roomId) {
          await this.router.navigate(['/']);
          return;
        }

        const room = await this.roomService.getRoomById(roomId);
        if (!room) {
          this.error.set('lobby.errors.roomNotFound');
          await this.router.navigate(['/']);
          return;
        }

        this.roomService.setCurrentRoom(room);
      }

      // Recover member identity if currentMember is null
      if (!this.currentMember()) {
        await this.recoverMemberIdentity();
      }

      // Subscribe to realtime member updates BEFORE loading to avoid missing events
      this.subscribeToMemberUpdates();

      // Load room members
      await this.loadRoomMembers();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Recover the current user's member record in this room
   * by matching userId or deviceId against existing members.
   */
  private async recoverMemberIdentity(): Promise<void> {
    const room = this.currentRoom();
    if (!room) {
      return;
    }

    const currentUser = this.authService.currentUser();
    const deviceId = this.guestService.getOrCreateDeviceId();

    const existingMember = await this.memberService.getMemberByUserOrDevice(room.$id, currentUser?.$id, deviceId);

    if (!existingMember) {
      console.warn('No member found, redirecting to join');
      this.router.navigate(['/room/join', room.code]);
      return;
    }

    this.memberService.setCurrentMember(existingMember);

    // Mark as online
    try {
      await this.memberService.updateMember(existingMember.$id, { isOnline: true });
    } catch (err) {
      console.warn('Failed to update online status (non-critical):', err);
    }
  }

  /**
   * Load all members for the current room
   * @param showLoading - Whether to set isLoading signal (false for realtime-triggered reloads to avoid UI flicker)
   */
  private async loadRoomMembers(showLoading = true): Promise<void> {
    const room = this.currentRoom();
    if (!room) {
      return;
    }

    try {
      this.isMembersLoading = true;
      if (showLoading) {
        this.isLoading.set(true);
      }
      await this.memberService.getMembersByRoom(room.$id);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isMembersLoading = false;
      if (showLoading) {
        this.isLoading.set(false);
      }
    }
  }

  /**
   * Subscribe to realtime member updates for the current room.
   * Includes retry logic for transient subscription failures.
   */
  private subscribeToMemberUpdates(): void {
    const room = this.currentRoom();
    if (!room) {
      return;
    }

    // Avoid duplicate subscriptions
    if (this.memberSubscriptionId) {
      console.warn('subscribeToMemberUpdates: subscription already active, skipping duplicate');
      return;
    }

    try {
      this.memberSubscriptionId = this.realtimeService.subscribeToMembers(room.$id, (_member: RealtimeGameMember) => {
        // Skip if already loading to prevent UI flicker
        if (this.isMembersLoading) {
          return;
        }
        // Reset retry counter on successful event reception
        this.subscriptionRetryCount = 0;
        // Refresh members list without UI flicker on realtime updates
        this.loadRoomMembers(false);
      });
      // Reset retry counter on successful subscription creation
      this.subscriptionRetryCount = 0;
    } catch (err) {
      console.warn('Realtime subscription failed:', err);
      this.retrySubscription();
    }
  }

  /**
   * Retry realtime subscription with exponential backoff
   */
  private retrySubscription(): void {
    if (this.subscriptionRetryCount >= MAX_SUBSCRIPTION_RETRIES) {
      console.warn(`Realtime subscription failed after ${MAX_SUBSCRIPTION_RETRIES} attempts`);
      return;
    }

    this.subscriptionRetryCount++;
    const delay = SUBSCRIPTION_RETRY_DELAY_MS * this.subscriptionRetryCount;

    setTimeout(() => {
      // Clear failed subscription state before retrying
      this.memberSubscriptionId = null;
      this.subscribeToMemberUpdates();
    }, delay);
  }

  /**
   * Register cleanup on component destroy
   */
  private registerCleanup(): void {
    this.destroyRef.onDestroy(() => {
      if (this.memberSubscriptionId) {
        this.realtimeService.unsubscribe(this.memberSubscriptionId);
        this.memberSubscriptionId = null;
      }
    });
  }

  /**
   * Get role icon for display
   */
  getRoleIcon(role: MemberRole): string {
    const icons: Record<MemberRole, string> = {
      host: 'crown',
      player: 'gamepad',
      spectator: 'eye',
    };
    return icons[role];
  }

  /**
   * Get role label translation key
   */
  getRoleLabel(role: MemberRole): string {
    const labels: Record<MemberRole, string> = {
      host: 'lobby.role.host',
      player: 'lobby.role.player',
      spectator: 'lobby.role.spectator',
    };
    return labels[role];
  }

  /**
   * Toggle member role (host only)
   * Cycles: player -> spectator -> player
   */
  async toggleMemberRole(member: GameMember): Promise<void> {
    if (!this.isHost() || member.role === 'host') {
      return;
    }

    const newRole: MemberRole = member.role === 'player' ? 'spectator' : 'player';

    try {
      this.isLoading.set(true);
      this.error.set(null);
      await this.memberService.updateMember(member.$id, { role: newRole });
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Start the game (host only)
   */
  async startGame(): Promise<void> {
    if (!this.canStartGame()) {
      return;
    }

    const room = this.currentRoom();
    if (!room) {
      return;
    }

    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Get only players (not spectators) for the game
      const gamePlayers = this.members()
        .filter((m) => m.role === 'player' || m.role === 'host')
        .map(
          (m, index): KetalPlayer => ({
            memberId: m.$id,
            displayName: m.displayName,
            order: index + 1,
            cards: [],
            choices: {
              color: '',
              plus_or_minus: '',
              in_out: '',
              suit: '',
            },
            sipsGiven: 0,
            sipsTaken: 0,
            isReady: false,
          })
        );

      // Start the game session
      await this.ketalSessionService.startGame(room.$id, gamePlayers, true);

      // Navigate to game view
      await this.router.navigate(['/game']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    const member = this.currentMember();
    if (!member || member.role === 'host') {
      return;
    }

    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Delete member from room
      await this.memberService.deleteMember(member.$id);

      // Clear room state
      await this.roomService.leaveRoom();

      // Navigate to home
      await this.router.navigate(['/']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Copy room code to clipboard
   */
  async copyRoomCode(): Promise<void> {
    const room = this.currentRoom();
    if (!room) {
      return;
    }

    try {
      await navigator.clipboard.writeText(room.code);
      // Could add a toast notification here
    } catch {
      // Fallback for browsers without clipboard API
      console.warn('Could not copy to clipboard');
    }
  }

  /**
   * Extract error message from caught error
   */
  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'lobby.errors.generic';
  }
}
