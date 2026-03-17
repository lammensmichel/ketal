import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoomService } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';
import { SoloRoomService } from '../../services/solo-room/solo-room.service';

/**
 * HomeComponent - Home screen for authenticated (non-anonymous) users.
 *
 * Displays two CTA buttons:
 * - "Créer une partie" → creates a solo room, then navigates to /players
 * - "Rejoindre une partie" → navigates to /room/join
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly soloRoomService = inject(SoloRoomService);
  private readonly destroyRef = inject(DestroyRef);

  /** Loading state for room creation */
  readonly isCreating = signal(false);

  /** Error message signal */
  readonly error = signal<string | null>(null);

  /** User display name for greeting */
  readonly userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.name || '';
  });

  /**
   * Create a game room and navigate to /players
   */
  async createGame(): Promise<void> {
    if (this.isCreating()) {
      return;
    }

    this.isCreating.set(true);
    this.error.set(null);

    try {
      await this.roomService.createSoloRoom();
      await this.router.navigate(['/players']);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  /**
   * Navigate to join room page
   */
  async joinGame(): Promise<void> {
    await this.router.navigate(['/room/join']);
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
    return 'home.errors.createFailed';
  }
}
