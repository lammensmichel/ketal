import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RoomService, GameRoomWithMemberCount } from '../../services/room/room.service';
import { AuthService } from '../../services/auth/auth.service';
import { GameService } from '../../services/game/game.service';
import { RoomTileComponent } from '../room/room-tile/room-tile.component';

/**
 * HomeComponent - Home screen for authenticated (non-anonymous) users.
 *
 * Displays:
 * - Welcome header with user's name
 * - Recent rooms carousel (max 3 rooms, sorted by updatedAt desc)
 * - CTA buttons: "Créer une partie" (partie rapide locale), "Jouer entre amis"
 *   (room multijoueur via /room/create), "Rejoindre une partie"
 *
 * Uses Angular 19 patterns: standalone, signals, inject(), OnPush, destroyRef.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [TranslateModule, RouterModule, RoomTileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly roomService = inject(RoomService);
  private readonly authService = inject(AuthService);
  private readonly gameSrv = inject(GameService);
  private readonly destroyRef = inject(DestroyRef);

  /** Loading state for room data */
  readonly isLoading = signal(false);

  /** Error message signal */
  readonly errorMsg = signal<string | null>(null);

  /** User display name for greeting */
  readonly userName = signal<string>('');

  /** Recent rooms (max 3) */
  readonly recentRooms = signal<GameRoomWithMemberCount[]>([]);

  /** Number of rooms to show in carousel */
  readonly MAX_ROOMS = 3;

  /** Flag to prevent double-click during room creation */
  private isCreatingRoom = false;

  /**
   * Component initialization
   */
  async ngOnInit(): Promise<void> {
    try {
      // Initialize auth service first
      await this.authService.init();

      // Set user name for greeting
      const currentUser = this.authService.currentUser();
      if (currentUser) {
        this.userName.set(currentUser.name || currentUser.email.split('@')[0] || 'Invité');
      }

      // Load recent rooms
      await this.loadRecentRooms();
    } catch (err) {
      console.error('Failed to initialize home component:', err);
      this.errorMsg.set('home.errors.loadFailed');
    }
  }

  /**
   * Load recent rooms from the server
   */
  private async loadRecentRooms(): Promise<void> {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      const rooms = await this.roomService.getMyRooms(this.MAX_ROOMS, true);
      this.recentRooms.set(rooms);
    } catch (err) {
      console.error('Failed to load recent rooms:', err);
      this.errorMsg.set('home.errors.loadFailed');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a game room and navigate to /players
   */
  async createGame(): Promise<void> {
    // Prevent double-click
    if (this.isCreatingRoom) {
      return;
    }
    this.isCreatingRoom = true;
    try {
      // Remise a neuf AVANT de creer la room. createSoloRoom() reutilise
      // volontairement une room solo idle existante pour ne pas les accumuler,
      // mais l'etat de jeu restait celui de la partie precedente : le statut
      // n'etant plus 0, isNewGame() etait faux, la liste affichee venait de
      // l'ancienne partie au lieu de la liste locale editable, et les controles
      // d'ajout disparaissaient. On tombait donc sur une partie deja existante
      // sans pouvoir changer les joueurs.
      this.gameSrv.prepareNewGame();
      await this.roomService.createSoloRoom();
      await this.router.navigate(['/players']);
    } catch (err) {
      console.error('Failed to create game:', err);
      this.errorMsg.set('home.errors.createFailed');
    } finally {
      this.isCreatingRoom = false;
    }
  }

  /**
   * Partie entre amis : on delegue a /room/create.
   *
   * Volontairement SANS createSoloRoom() : l'hote doit d'abord nommer la partie,
   * puis choisir les amis a asseoir a la table. Creer la room ici priverait
   * l'ecran de creation de son formulaire et de son selecteur d'amis — le seul
   * endroit de l'application ou une room multijoueur peut etre composee.
   */
  async createFriendsGame(): Promise<void> {
    await this.router.navigate(['/room/create']);
  }

  /**
   * Role de l'utilisateur dans cette room.
   *
   * Le template passait 'player' en dur, si bien qu'un hote n'etait jamais
   * reconnu comme tel sur l'accueil. `myRole` est calcule par room dans
   * RoomService.getMyRooms(), a partir de l'enregistrement membre de cette room.
   */
  getRoomRole(room: GameRoomWithMemberCount): 'host' | 'player' {
    return room.myRole === 'host' ? 'host' : 'player';
  }

  /**
   * Navigate to join room page
   */
  async joinGame(): Promise<void> {
    await this.router.navigate(['/room/join']);
  }

  /**
   * Navigate to rooms list page
   */
  async goToRooms(): Promise<void> {
    await this.router.navigate(['/rooms']);
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
