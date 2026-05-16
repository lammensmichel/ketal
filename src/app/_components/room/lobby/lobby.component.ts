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
import { RoomStatusBadgeComponent, RoomDisplayStatus } from './room-status-badge/room-status-badge.component';

/** Maximum number of subscription retry attempts */
const MAX_SUBSCRIPTION_RETRIES = 3;

/** Delay between retry attempts in milliseconds */
const SUBSCRIPTION_RETRY_DELAY_MS = 2000;

/** Bail out of the pendingReload retry loop after this many consecutive load errors. */
const MAX_LOAD_ERROR_RETRIES = 3;

/** How long a newly-joined id keeps the `.is-new` class (matches slide-in animation). */
const NEW_JOINER_ANIMATION_MS = 450;

/** Debounce window for window-resize → qrSize recomputes. */
const RESIZE_DEBOUNCE_MS = 150;

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
  imports: [CommonModule, TranslateModule, QRCodeComponent, RoomStatusBadgeComponent],
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

  /** Timer ID for retry timeout, cleared on destroy */
  private retryTimerId: ReturnType<typeof setTimeout> | null = null;

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

  /** Responsive QR size in px (mobile 220, tablet 260, desktop 280+) */
  readonly qrSize = signal<number>(this.computeInitialQrSize());

  private computeInitialQrSize(): number {
    if (typeof window === 'undefined') {
      return 240;
    }
    const w = window.innerWidth;
    if (w >= 1024) {
      return 280;
    }
    if (w >= 768) {
      return 260;
    }
    return 220;
  }

  /** Debounce timer for resize events so we don't thrash the QR canvas while the user drags. */
  private resizeDebounceTimerId: ReturnType<typeof setTimeout> | null = null;

  private readonly resizeListener = (): void => {
    if (this.resizeDebounceTimerId) {
      clearTimeout(this.resizeDebounceTimerId);
    }
    this.resizeDebounceTimerId = setTimeout(() => {
      this.resizeDebounceTimerId = null;
      this.qrSize.set(this.computeInitialQrSize());
    }, RESIZE_DEBOUNCE_MS);
  };

  /** Transient feedback message after copy/share actions (cleared after 2s) */
  readonly feedback = signal<string | null>(null);

  /** Timer for feedback message auto-clear */
  private feedbackTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Display name of the currently-shown joiner toast (cleared after 3s) */
  readonly joinedToast = signal<string | null>(null);

  /** Timer for joined toast auto-clear */
  private joinedToastTimerId: ReturnType<typeof setTimeout> | null = null;

  /** Pending joiner names when multiple joins land during a single toast lifetime */
  private joinedToastQueue: string[] = [];

  /** Snapshot of known member ids; used to detect new joiners on realtime updates */
  private knownMemberIds = new Set<string>();

  /** Writable signal tracking which member ids should render with the `.is-new` animation class. */
  private readonly newlyJoinedIds = signal<Set<string>>(new Set());

  /** Pending per-id clear timers so we drop the `.is-new` flag once the animation plays out. */
  private readonly newlyJoinedTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /** Member ids observed via realtime *before* the initial seed completed — replayed post-seed. */
  private pendingJoinerIds = new Set<string>();

  /** True once the first loadRoomMembers call has seeded knownMemberIds. */
  private initialLoadComplete = false;

  /** Re-entrant reload flag: if a realtime event arrives while loading, queue one retry. */
  private pendingReload = false;

  /** Consecutive failures in `loadRoomMembers`; bail out of pendingReload once we hit the cap. */
  private consecutiveLoadErrors = 0;

  /** Badge status: 'finished' from session, 'playing' from room, else 'waiting'. */
  readonly displayStatus = computed<RoomDisplayStatus>(() => {
    const session = this.ketalSessionService.currentSession();
    if (session?.status === 'finished') {
      return 'finished';
    }
    const room = this.currentRoom();
    if (room?.status === 'playing') {
      return 'playing';
    }
    return 'waiting';
  });

  /** Whether a member id is currently flagged as newly joined (template hook for animation scoping). */
  isNewlyJoined(memberId: string): boolean {
    return this.newlyJoinedIds().has(memberId);
  }

  /** Toggle QR code display */
  toggleQrCode(): void {
    this.showQrCode.update((v) => !v);
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeListener, { passive: true });
    }
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
   * Load members for the current room and sync `knownMemberIds`.
   * Join detection happens at the realtime-payload layer, not here, so this stays idempotent.
   */
  private async loadRoomMembers(showLoading = true): Promise<void> {
    const room = this.currentRoom();
    if (!room) {
      return;
    }

    let errored = false;
    try {
      this.isMembersLoading = true;
      if (showLoading) {
        this.isLoading.set(true);
      }
      await this.memberService.getMembersByRoom(room.$id);

      const currentMembers = this.members();
      this.knownMemberIds = new Set(currentMembers.map((m) => m.$id));

      // On the very first successful seed, replay any joiner events buffered during initial load.
      if (!this.initialLoadComplete) {
        this.initialLoadComplete = true;
        this.replayPendingJoiners();
      }
      this.consecutiveLoadErrors = 0;
    } catch (err) {
      errored = true;
      this.consecutiveLoadErrors += 1;
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isMembersLoading = false;
      if (showLoading) {
        this.isLoading.set(false);
      }
      // Drain a pending realtime event, but only if we haven't hit the error cap.
      if (this.pendingReload) {
        this.pendingReload = false;
        if (!errored && this.consecutiveLoadErrors < MAX_LOAD_ERROR_RETRIES) {
          void this.loadRoomMembers(false);
        }
      }
    }
  }

  /** Replay joiner-toast + animation for any $id captured by realtime before the initial seed. */
  private replayPendingJoiners(): void {
    if (this.pendingJoinerIds.size === 0) {
      return;
    }
    const myMemberId = this.currentMember()?.$id;
    const membersById = new Map(this.members().map((m) => [m.$id, m]));
    for (const id of this.pendingJoinerIds) {
      if (id === myMemberId) {
        continue;
      }
      const member = membersById.get(id);
      if (member) {
        this.announceJoiner(member);
      }
    }
    this.pendingJoinerIds.clear();
  }

  /** Enqueue toast + mark `.is-new` for animation; callers should have already vetted "not me". */
  private announceJoiner(member: { $id: string; displayName: string }): void {
    this.enqueueJoinedToast(member.displayName);
    this.markNewlyJoined(member.$id);
  }

  /** Flag an id as newly-joined, then clear the flag after the animation window. */
  private markNewlyJoined(memberId: string): void {
    const prev = this.newlyJoinedTimers.get(memberId);
    if (prev) {
      clearTimeout(prev);
    }
    this.newlyJoinedIds.update((set) => new Set(set).add(memberId));
    const timerId = setTimeout(() => {
      this.newlyJoinedTimers.delete(memberId);
      this.newlyJoinedIds.update((set) => {
        if (!set.has(memberId)) {
          return set;
        }
        const next = new Set(set);
        next.delete(memberId);
        return next;
      });
    }, NEW_JOINER_ANIMATION_MS);
    this.newlyJoinedTimers.set(memberId, timerId);
  }

  /** Queue a joiner name; processed sequentially so back-to-back joins each get ~3s on-screen */
  private enqueueJoinedToast(displayName: string): void {
    this.joinedToastQueue.push(displayName);
    if (!this.joinedToast()) {
      this.dequeueJoinedToast();
    }
  }

  /** Pop next queued name into the visible toast slot; schedules recursion on timeout */
  private dequeueJoinedToast(): void {
    const next = this.joinedToastQueue.shift();
    if (!next) {
      this.joinedToast.set(null);
      this.joinedToastTimerId = null;
      return;
    }
    this.joinedToast.set(next);
    if (this.joinedToastTimerId) {
      clearTimeout(this.joinedToastTimerId);
    }
    this.joinedToastTimerId = setTimeout(() => {
      this.joinedToastTimerId = null;
      this.dequeueJoinedToast();
    }, 3000);
  }

  /**
   * Subscribe to realtime member updates for the current room.
   * Includes retry logic for transient subscription failures.
   */
  private async subscribeToMemberUpdates(): Promise<void> {
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
      const sub = await this.realtimeService.subscribeToMembers(room.$id, (member: RealtimeGameMember) => {
        this.subscriptionRetryCount = 0;
        this.handleRealtimeMemberEvent(member);
      });
      this.memberSubscriptionId = sub;
      // Reset retry counter on successful subscription creation
      this.subscriptionRetryCount = 0;
    } catch (err) {
      console.warn('Realtime subscribeToMembers failed:', err);
      this.retrySubscription();
    }
  }

  /**
   * Payload-driven join detection: realtime events carry the member doc directly, so we can classify
   * it as a new joiner the moment it arrives (no race with the reload).
   */
  private handleRealtimeMemberEvent(member: RealtimeGameMember): void {
    const myMemberId = this.currentMember()?.$id;

    if (!this.initialLoadComplete) {
      // Buffer until the initial seed so we don't treat every existing member as a newcomer.
      if (member.$id !== myMemberId) {
        this.pendingJoinerIds.add(member.$id);
      }
    } else if (member.$id !== myMemberId && !this.knownMemberIds.has(member.$id)) {
      // Add to knownMemberIds immediately so a second event for the same id doesn't double-announce.
      this.knownMemberIds.add(member.$id);
      this.announceJoiner(member);
    }

    if (this.isMembersLoading) {
      this.pendingReload = true;
      return;
    }
    void this.loadRoomMembers(false);
  }

  /**
   * Retry realtime subscription with linear backoff
   */
  private retrySubscription(): void {
    if (this.subscriptionRetryCount >= MAX_SUBSCRIPTION_RETRIES) {
      console.warn(`Realtime subscription failed after ${MAX_SUBSCRIPTION_RETRIES} attempts`);
      return;
    }

    this.subscriptionRetryCount++;
    const delay = SUBSCRIPTION_RETRY_DELAY_MS * this.subscriptionRetryCount;

    this.retryTimerId = setTimeout(() => {
      this.retryTimerId = null;
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
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.resizeListener);
      }
      if (this.retryTimerId) {
        clearTimeout(this.retryTimerId);
        this.retryTimerId = null;
      }
      if (this.feedbackTimerId) {
        clearTimeout(this.feedbackTimerId);
        this.feedbackTimerId = null;
      }
      if (this.joinedToastTimerId) {
        clearTimeout(this.joinedToastTimerId);
        this.joinedToastTimerId = null;
      }
      if (this.resizeDebounceTimerId) {
        clearTimeout(this.resizeDebounceTimerId);
        this.resizeDebounceTimerId = null;
      }
      for (const timer of this.newlyJoinedTimers.values()) {
        clearTimeout(timer);
      }
      this.newlyJoinedTimers.clear();
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
      await this.ketalSessionService.startGame(room.$id, gamePlayers, true, room.gamesPlayed);

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

    const room = this.currentRoom();
    if (!room) {
      console.error('No current room to leave');
      return;
    }

    try {
      this.isLoading.set(true);
      this.error.set(null);

      // Delete member from room
      await this.memberService.deleteMember(member.$id);

      // Clear room state
      await this.roomService.leaveRoom(room.$id);

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
      this.showFeedback('lobby.codeCopied');
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      this.showFeedback('lobby.copyError');
    }
  }

  /**
   * Share invite via Web Share API when available, otherwise copy link to clipboard.
   */
  async shareInvite(): Promise<void> {
    const url = this.inviteUrl();
    if (!url) {
      return;
    }
    const room = this.currentRoom();
    // Use || not ?? so empty-string room names also fall back to the product name.
    const title = room?.name || 'Ketal';
    const shareData = { title, text: title, url };

    const canNativeShare =
      typeof navigator.share === 'function' &&
      (typeof navigator.canShare !== 'function' || navigator.canShare(shareData));

    if (canNativeShare) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.warn('navigator.share failed, falling back to clipboard:', err);
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      this.showFeedback('lobby.linkCopied');
    } catch (err) {
      console.warn('Clipboard fallback failed:', err);
      this.showFeedback('lobby.shareError');
    }
  }

  /** Display a transient feedback message (auto-clears after 2s) */
  private showFeedback(messageKey: string): void {
    this.feedback.set(messageKey);
    if (this.feedbackTimerId) {
      clearTimeout(this.feedbackTimerId);
    }
    this.feedbackTimerId = setTimeout(() => {
      this.feedback.set(null);
      this.feedbackTimerId = null;
    }, 2000);
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
