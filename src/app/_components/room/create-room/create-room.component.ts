import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { RoomService, GameRoom } from '../../../services/room/room.service';
import { AuthService } from '../../../services/auth/auth.service';

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
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, QRCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRoomComponent {
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
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
   * Navigate to the created room's lobby
   */
  enterRoom(): void {
    const room = this.createdRoom();
    if (room) {
      this.router.navigate(['/room', room.$id]);
    }
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
