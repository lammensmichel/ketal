import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { AppwriteService } from '../../../services/appwrite/appwrite.service';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { LanguageService } from '../../_helpers/language.helper';
import { Language } from '../../_models/language.model';

/** Routes where game controls should be hidden */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, FontAwesomeIconsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenuComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly appwrite = inject(AppwriteService);
  private readonly authService = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly languageService = inject(LanguageService);
  readonly gameSrv = inject(GameService);

  /** Whether the side menu is open */
  readonly isOpen = signal(false);

  /** Whether the quit confirmation dialog is visible */
  readonly showQuitConfirm = signal(false);

  /** Available languages for selection */
  readonly languages: Language[];

  /** Currently selected language code */
  selectedLanguage: string;

  /** Current user from AuthService */
  readonly isLoggedIn = this.authService.isLoggedIn;

  /** Whether the current session is anonymous (guest) */
  readonly isAnonymous = this.authService.isAnonymous;

  /** Loading state from AuthService */
  readonly isLoading = this.authService.isLoading;

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

  /** Whether a game is in progress (started or finished but not reset) */
  readonly hasGameInProgress = computed(() => {
    return this.gameSrv.isGameStarted() || this.gameSrv.isGameFinished();
  });

  constructor() {
    this.languages = this.languageService.constructPossibleLanguages();
    const browserLang = this.translate.getBrowserLang() ?? 'fr';
    this.selectedLanguage = this.translate.currentLang || this.translate.getDefaultLang() || browserLang;

    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  /** Toggle the side menu open/closed */
  toggleMenu(): void {
    this.isOpen.update((open) => !open);
    document.body.style.overflow = this.isOpen() ? 'hidden' : '';
  }

  /** Open the side menu */
  openMenu(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  /** Close the side menu */
  closeMenu(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
  }

  /** Navigate to menu without resetting the game */
  goToMenu(): void {
    this.closeMenu();
    this.router.navigate(['/players']);
  }

  /** Navigate to my rooms page */
  goToRooms(): void {
    this.closeMenu();
    this.router.navigate(['/rooms']);
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
    this.closeMenu();
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }

  /** Navigate to login page */
  navigateToLogin(): void {
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  /** Navigate to login to connect an account (anonymous users only, preserves game data) */
  async connectToAccount(): Promise<void> {
    this.closeMenu();
    try {
      await this.appwrite.account.deleteSession('current');
    } catch {
      // Session might already be invalid, continue
    }
    await this.router.navigate(['/login']);
  }

  /** Quit the game entirely: full logout with game cleanup (anonymous users only) */
  async quitGame(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }

  /** Logout the current user */
  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    await this.router.navigate(['/']);
  }

  /** Handle language change from the selector */
  onLanguageChange(): void {
    if (this.selectedLanguage) {
      this.translate.use(this.selectedLanguage);
    }
  }

  /** Dismiss side menu or quit dialog on Escape key */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showQuitConfirm()) {
      this.cancelQuit();
    } else if (this.isOpen()) {
      this.closeMenu();
    }
  }
}
