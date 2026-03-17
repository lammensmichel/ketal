import { Component, inject, computed, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { GameService } from '../../../services/game/game.service';
import { UserMenuComponent } from '../user-menu/user-menu.component';

/** Routes where game controls should be hidden */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [TranslateModule, FontAwesomeIconsModule, UserMenuComponent],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly gameSrv = inject(GameService);

  /** Whether the quit confirmation dialog is visible */
  readonly showQuitConfirm = signal(false);

  /** Current URL path as a signal */
  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Whether current route is an auth page */
  readonly isAuthPage = computed(() => {
    const path = this.currentPath();
    return AUTH_ROUTES.some((route) => path.startsWith(route));
  });

  /** Whether we are currently on the game page */
  readonly isGamePage = computed(() => {
    const path = this.currentPath();
    return path.startsWith('/game');
  });

  /** Whether a game is in progress (started or finished but not reset) */
  readonly hasGameInProgress = computed(() => {
    return this.gameSrv.isGameStarted() || this.gameSrv.isGameFinished();
  });

  /** Navigate to menu without resetting the game */
  goToMenu(): void {
    this.router.navigate(['/players']);
  }

  /** Show quit confirmation dialog */
  showQuitConfirmation(): void {
    this.showQuitConfirm.set(true);
  }

  /** Cancel quit and dismiss confirmation dialog */
  cancelQuit(): void {
    this.showQuitConfirm.set(false);
  }

  /** Confirm quit: reset game and navigate to players */
  confirmQuit(): void {
    this.showQuitConfirm.set(false);
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }

  /** @deprecated Use goToMenu() or showQuitConfirmation() instead */
  restartGame(): void {
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }
}
