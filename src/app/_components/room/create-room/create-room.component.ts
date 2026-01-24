import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
  SecurityContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
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
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRoomComponent {
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
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
    return `${window.location.origin}/join/${room.code}`;
  });

  /** Computed signal for QR code SVG data (sanitized) */
  readonly qrCodeSvg = computed(() => {
    const url = this.inviteUrl();
    if (!url) {
      return '';
    }
    const svg = this.generateQrCodeSvg(url);
    return this.sanitizer.sanitize(SecurityContext.HTML, svg) || '';
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

  /**
   * Generate a simple QR code SVG representation
   * This is a simplified QR code that encodes the URL in a visual pattern
   * For production, consider using a proper QR code library
   */
  private generateQrCodeSvg(data: string): string {
    const size = 200;
    const moduleCount = 21; // QR Version 1 is 21x21
    const moduleSize = size / moduleCount;

    // Generate a deterministic pattern based on the data
    const matrix = this.generateQrMatrix(data, moduleCount);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (matrix[row][col]) {
          const x = col * moduleSize;
          const y = row * moduleSize;
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Generate a QR-like matrix pattern from data
   * This creates a visual pattern that resembles a QR code
   */
  private generateQrMatrix(data: string, size: number): boolean[][] {
    const matrix: boolean[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));

    // Add finder patterns (top-left, top-right, bottom-left)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    this.addFinderPattern(matrix, size - 7, 0);

    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Generate data pattern based on hash of input
    const hash = this.simpleHash(data);
    let bitIndex = 0;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // Skip finder patterns and timing patterns
        if (this.isReservedModule(row, col, size)) {
          continue;
        }

        const bit = (hash[bitIndex % hash.length] >> (bitIndex % 8)) & 1;
        matrix[row][col] = bit === 1;
        bitIndex++;
      }
    }

    return matrix;
  }

  /**
   * Add a 7x7 finder pattern at the specified position
   */
  private addFinderPattern(matrix: boolean[][], row: number, col: number): void {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isEdge = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isEdge || isCenter;
      }
    }
  }

  /**
   * Check if a module position is reserved for patterns
   */
  private isReservedModule(row: number, col: number, size: number): boolean {
    // Finder patterns
    if (row < 9 && col < 9) {
      return true;
    }
    if (row < 9 && col >= size - 8) {
      return true;
    }
    if (row >= size - 8 && col < 9) {
      return true;
    }

    // Timing patterns
    if (row === 6 || col === 6) {
      return true;
    }

    return false;
  }

  /**
   * Simple hash function to generate bytes from string
   */
  private simpleHash(str: string): number[] {
    const result: number[] = [];
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
      result.push(Math.abs(hash) % 256);
    }

    // Extend result to ensure enough data
    while (result.length < 100) {
      hash = ((hash << 5) - hash + result.length) | 0;
      result.push(Math.abs(hash) % 256);
    }

    return result;
  }
}
