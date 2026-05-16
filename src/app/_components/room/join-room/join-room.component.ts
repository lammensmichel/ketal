import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoomService, GameRoom } from '../../../services/room/room.service';
import { AuthService } from '../../../services/auth/auth.service';
import { GuestService } from '../../../services/guest/guest.service';
import { MemberService, CreateMemberData } from '../../../services/member/member.service';

/**
 * JoinRoomComponent - Join an existing game room by code
 *
 * Allows users to join a game room by entering a 6-character room code.
 * Supports URL-based joins via route parameter.
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-join-room',
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinRoomComponent implements OnInit {
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly guestService = inject(GuestService);
  private readonly memberService = inject(MemberService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Reactive form for room code and display name */
  readonly joinForm = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
      Validators.pattern(/^[A-Z0-9]+$/),
    ]),
    displayName: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]),
  });

  /** Loading state signal */
  readonly isLoading = signal(false);

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** Whether user is authenticated (has FUG account) */
  readonly isAuthenticated = this.authService.isLoggedIn;

  /** Whether current session is anonymous */
  readonly isAnonymous = this.authService.isAnonymous;

  ngOnInit(): void {
    // Pre-fill display name from AuthService if authenticated
    const currentUser = this.authService.currentUser();
    if (currentUser && currentUser.name) {
      this.joinForm.patchValue({ displayName: currentUser.name });
    } else {
      // Fall back to guest display name if available
      const guestName = this.guestService.displayName();
      if (guestName && guestName !== 'Invite') {
        this.joinForm.patchValue({ displayName: guestName });
      }
    }

    // Handle URL-based joins (route param for code)
    const codeFromUrl = this.route.snapshot.paramMap.get('code');
    if (codeFromUrl) {
      this.joinForm.patchValue({ code: codeFromUrl.toUpperCase() });
    }
  }

  /**
   * Handle input for room code - auto-format to uppercase
   */
  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.joinForm.patchValue({ code: value });
    input.value = value;
  }

  /**
   * Handle form submission to join room
   */
  async onSubmit(): Promise<void> {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched();
      return;
    }

    this.error.set(null);
    this.isLoading.set(true);

    try {
      const { code, displayName } = this.joinForm.value;
      const normalizedCode = code!.toUpperCase();

      // Try to find the room
      const room = await this.roomService.getRoomByCode(normalizedCode);

      if (!room) {
        this.error.set('room.errors.notFound');
        this.isLoading.set(false);
        return;
      }

      // Check if user is already a member of this room
      const currentUser = this.authService.currentUser();
      const deviceId = this.guestService.getOrCreateDeviceId();
      const existingMember = await this.memberService.getMemberByUserOrDevice(room.$id, currentUser?.$id, deviceId);

      if (existingMember) {
        // User already in room - set as current and navigate
        this.memberService.setCurrentMember(existingMember);
        this.roomService.setCurrentRoom(room);
        await this.navigateToRoom(room);
        return;
      }

      // Create new member
      await this.createMemberAndJoin(room, displayName!);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a new member and join the room
   */
  private async createMemberAndJoin(room: GameRoom, displayName: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    const isGuest = !currentUser || this.authService.isAnonymous();

    // Save display name to guest service if guest
    if (isGuest) {
      this.guestService.setDisplayName(displayName);
    }

    const memberData: CreateMemberData = {
      roomId: room.$id,
      userId: isGuest ? null : currentUser!.$id,
      deviceId: isGuest ? this.guestService.getOrCreateDeviceId() : null,
      displayName: displayName.trim(),
      role: 'player',
      isOnline: true,
      totalSipsGiven: 0,
      totalSipsTaken: 0,
      totalGamesPlayed: 0,
      gameStats: {},
    };

    const member = await this.memberService.createMember(memberData);
    this.memberService.setCurrentMember(member);
    this.roomService.setCurrentRoom(room);

    await this.navigateToRoom(room);
  }

  /**
   * Navigate to the room lobby/game
   */
  private async navigateToRoom(room: GameRoom): Promise<void> {
    await this.router.navigate(['/room', room.$id]);
  }

  /**
   * Check if a form field has errors and has been touched
   */
  hasFieldError(fieldName: 'code' | 'displayName'): boolean {
    const field = this.joinForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  /**
   * Get error message for a form field
   */
  getFieldError(fieldName: 'code' | 'displayName'): string {
    const field = this.joinForm.get(fieldName);
    if (!field?.errors) {
      return '';
    }

    if (field.errors['required']) {
      return fieldName === 'code' ? 'room.errors.codeRequired' : 'room.errors.displayNameRequired';
    }
    if (field.errors['minlength']) {
      return fieldName === 'code' ? 'room.errors.codeLength' : 'room.errors.displayNameTooShort';
    }
    if (field.errors['maxlength']) {
      return fieldName === 'code' ? 'room.errors.codeLength' : 'room.errors.displayNameTooLong';
    }
    if (field.errors['pattern']) {
      return 'room.errors.codeInvalid';
    }
    return '';
  }

  /**
   * Extract error message from caught error
   */
  private getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      // Check for specific error messages
      if (err.message.includes('not found')) {
        return 'room.errors.notFound';
      }
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return 'room.errors.genericError';
  }
}
