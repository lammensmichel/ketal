import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { RoomService, GameRoom } from '../../../services/room/room.service';
import { MemberService, CreateMemberData } from '../../../services/member/member.service';
import { AuthService } from '../../../services/auth/auth.service';
import { FriendService } from '../../../services/friend/friend.service';

/**
 * CreateRoomComponent - Room creation page for Ketal multiplayer
 *
 * Provides a form to create a new game room with:
 * - Room name input with validation
 * - QR code generation for invite link
 * - Copy-to-clipboard functionality
 * - Prominent display of 6-character room code
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-create-room',
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, QRCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRoomComponent {
  private readonly roomService = inject(RoomService);
  private readonly memberService = inject(MemberService);
  private readonly authService = inject(AuthService);
  private readonly friendService = inject(FriendService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Timeout ID for cleanup */
  private successTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Reactive form for room creation */
  readonly createRoomForm = new FormGroup({
    roomName: new FormControl('', [Validators.required, Validators.minLength(3)]),
  });

  /** Loading state signal */
  readonly isLoading = signal(false);

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** Success message signal (for copy feedback) */
  readonly successMessage = signal<string | null>(null);

  /** Created room data */
  readonly createdRoom = signal<GameRoom | null>(null);

  /** Computed signal for invite URL */
  readonly inviteUrl = computed(() => {
    const room = this.createdRoom();
    if (!room) {
      return '';
    }
    return `${window.location.origin}/room/join/${room.code}`;
  });

  /** Check if user is authenticated */
  readonly isAuthenticated = this.authService.isLoggedIn;

  /** Friend profiles of the current user (signal from FriendService) */
  readonly friendProfiles = this.friendService.friendProfiles;

  /** Whether the friend list is being loaded */
  readonly isFriendsLoading = signal(false);

  /** userIds of the friends the host wants to seat at the table right away */
  readonly selectedFriendIds = signal<string[]>([]);

  /**
   * Une invitation qui a échoué ne doit pas retenir l'hôte hors de sa partie : au second clic sur
   * « Entrer », on saute l'étape des amis (il pourra les inviter depuis le lobby).
   */
  private readonly friendInviteFailed = signal(false);

  /** Remaining seats for friends: the host already takes one */
  readonly remainingSeats = computed(() => {
    const room = this.createdRoom();
    const maxPlayers = room?.maxPlayers ?? 10;
    return Math.max(0, maxPlayers - 1 - this.selectedFriendIds().length);
  });

  /** Whether a friend is currently selected */
  isFriendSelected(userId: string): boolean {
    return this.selectedFriendIds().includes(userId);
  }

  /** Toggle a friend in the selection, honouring the remaining seats */
  toggleFriendSelection(userId: string): void {
    const selected = this.selectedFriendIds();
    if (selected.includes(userId)) {
      this.selectedFriendIds.set(selected.filter((id) => id !== userId));
      return;
    }
    if (this.remainingSeats() === 0) {
      this.error.set('room.errors.roomFull');
      return;
    }
    this.selectedFriendIds.set([...selected, userId]);
  }

  /**
   * Load the friend list so the host can compose the table (authenticated users only).
   *
   * On passe volontairement par FriendService.getFriends() et non par une lecture
   * directe de `friendships` : c'est la seule voie qui lit la relation DANS LES
   * DEUX SENS et filtre sur status = 'accepted'. Une demande encore `pending` ne
   * doit pas apparaitre ici — on asseoirait a la table quelqu'un qui n'a jamais
   * accepte l'amitie.
   */
  async loadFriends(): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }
    try {
      this.isFriendsLoading.set(true);
      await this.friendService.getFriends();
    } catch (err) {
      console.warn('Failed to load friends:', err);
      this.error.set('room.errors.friendsLoadFailed');
    } finally {
      this.isFriendsLoading.set(false);
    }
  }

  constructor() {
    // Cleanup timeout on destroy
    this.destroyRef.onDestroy(() => {
      if (this.successTimeoutId) {
        clearTimeout(this.successTimeoutId);
      }
    });
  }

  /**
   * Handle form submission to create a new room
   */
  async onSubmit(): Promise<void> {
    if (this.createRoomForm.invalid) {
      this.createRoomForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const { roomName } = this.createRoomForm.value;
      const room = await this.roomService.createRoom(roomName!);
      this.createdRoom.set(room);
      // La liste d'amis n'est utile qu'à partir d'ici : c'est l'écran où l'hôte compose sa table.
      await this.loadFriends();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Copy invite link to clipboard
   */
  async copyInviteLink(): Promise<void> {
    const url = this.inviteUrl();
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      this.successMessage.set('room.linkCopied');

      // Clear any existing timeout
      if (this.successTimeoutId) {
        clearTimeout(this.successTimeoutId);
      }

      // Clear success message after 2 seconds
      this.successTimeoutId = setTimeout(() => {
        this.successMessage.set(null);
        this.successTimeoutId = null;
      }, 2000);
    } catch {
      this.error.set('room.errors.copyFailed');
    }
  }

  /**
   * Enter the room as host and navigate to lobby
   */
  async enterRoom(): Promise<void> {
    const room = this.createdRoom();
    if (!room) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Get current user info
      const user = this.authService.currentUser();
      const displayName = user?.name || 'Host';
      const userId = user?.$id;

      // Check if member already exists (idempotency for authenticated users)
      let member = await this.memberService.getMemberByUserOrDevice(room.$id, userId);

      if (!member) {
        // Create host member only if it doesn't exist
        const memberData: CreateMemberData = {
          roomId: room.$id,
          userId: userId || null,
          deviceId: userId ? null : this.getDeviceId(),
          displayName,
          role: 'host',
          isOnline: true,
          totalSipsGiven: 0,
          totalSipsTaken: 0,
          totalGamesPlayed: 0,
          gameStats: {},
        };

        member = await this.memberService.createMember(memberData);
      }

      // Set as current member
      this.memberService.setCurrentMember(member);

      // Update room with host member ID if not already set
      if (!room.hostMemberId) {
        await this.roomService.updateRoom(room.$id, { hostMemberId: member.$id });
      }

      // Seat the selected friends before entering, unless a previous attempt already failed.
      if (this.selectedFriendIds().length > 0 && !this.friendInviteFailed()) {
        const failed = await this.inviteSelectedFriends(room.$id, room.maxPlayers ?? 10);
        if (failed) {
          this.friendInviteFailed.set(true);
          this.error.set('room.errors.inviteFriendsFailed');
          return;
        }
      }

      // Navigate to lobby
      await this.router.navigate(['/room', room.$id]);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a member for each selected friend so they land on their seat when they open the room.
   *
   * Le membre porte le userId de l'ami : les chemins de jointure cherchent un membre existant avant
   * d'en créer un, donc l'ami reprendra cette place sans doublon.
   *
   * @returns true if at least one invitation failed
   */
  private async inviteSelectedFriends(roomId: string, maxPlayers: number): Promise<boolean> {
    const profiles = this.friendProfiles();
    let seatedCount = 1; // l'hôte occupe déjà une place
    let failed = false;

    for (const userId of this.selectedFriendIds()) {
      if (seatedCount >= maxPlayers) {
        failed = true;
        break;
      }

      const profile = profiles.find((p) => p.userId === userId);
      const displayName = profile?.name?.trim();
      if (!displayName) {
        failed = true;
        continue;
      }

      try {
        const existing = await this.memberService.getMemberByUserOrDevice(roomId, userId);
        if (existing) {
          seatedCount += 1;
          continue;
        }

        const memberData: CreateMemberData = {
          roomId,
          userId,
          deviceId: null,
          displayName,
          role: 'player',
          isOnline: false,
          isFictional: false,
          totalSipsGiven: 0,
          totalSipsTaken: 0,
          totalGamesPlayed: 0,
          gameStats: {},
        };

        await this.memberService.createMember(memberData);
        seatedCount += 1;
      } catch (err) {
        console.warn('Failed to invite friend:', err);
        failed = true;
      }
    }

    return failed;
  }

  /**
   * Generate or retrieve device ID for guest users
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('ketal_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('ketal_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Check if a form field has errors and has been touched
   */
  hasFieldError(fieldName: 'roomName'): boolean {
    const field = this.createRoomForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a form field
   */
  getFieldError(fieldName: 'roomName'): string {
    const field = this.createRoomForm.get(fieldName);
    if (!field?.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'room.errors.nameRequired';
    }
    if (field.errors['minlength']) {
      return 'room.errors.nameTooShort';
    }
    return '';
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
    return 'room.errors.genericError';
  }
}
