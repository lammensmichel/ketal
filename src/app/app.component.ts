import { Component, computed, OnInit, Signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { PlayerHelperService } from './_shared/_helpers/player.helper';
import { AuthService } from './services/auth/auth.service';
import { GameService } from './services/game/game.service';
import { SoloRoomService } from './services/solo-room/solo-room.service';
import { HeaderComponent } from './_shared/_components/header/header.component';
import { FooterComponent } from './_shared/_components/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterOutlet, TranslateModule, HeaderComponent, FooterComponent],
})
export class AppComponent implements OnInit {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly gameSrv = inject(GameService);
  readonly translate = inject(TranslateService);
  readonly playerSrv = inject(PlayerHelperService);
  private readonly soloRoomService = inject(SoloRoomService);

  readonly withSummaryMode: Signal<boolean>;

  /** Check if current route is the players page (where local game UI should be visible) */
  isPlayersPage(): boolean {
    return this.router.url.split('?')[0] === '/players';
  }

  /**
   * Determines if the summary checkbox should be visible.
   * Visible for connected (non-anonymous) users on the /players page.
   * Designed to be extended later with subscription checks.
   *
   * Note: This is a method (not a computed signal) because isPlayersPage()
   * depends on router.url which is not a signal. A computed would cache the
   * result and not re-evaluate on route changes.
   */
  canShowSummary(): boolean {
    return this.isPlayersPage() && this.authService.isLoggedIn() && !this.authService.isAnonymous();
  }

  constructor() {
    const defaultLang = this.translate.getBrowserLang() ?? environment.defaultLanguage;
    this.translate.setDefaultLang(defaultLang);
    this.translate.use(defaultLang);

    this.withSummaryMode = computed(() => {
      // Anonymous/logged-out users have no summary checkbox and must not get summary features
      // (the withSummaryMode signal persists in localStorage and can leak across auth states).
      if (!this.authService.isLoggedIn() || this.authService.isAnonymous()) {
        return false;
      }
      const summaryMode = this.gameSrv.withSummaryMode();
      const gameSummary = this.gameSrv.summary();
      return this.playerSrv.getPlayerNumber() > 1 ? summaryMode || gameSummary : summaryMode;
    });
  }

  /**
   * On init, check for active room + session to resume.
   * Routes user based on auth state:
   * - Active session → /game
   * - Anonymous → /players
   * - Logged in, no active session → /home
   */
  async ngOnInit(): Promise<void> {
    try {
      await this.authService.init();

      if (this.authService.isAnonymous()) {
        this.gameSrv.clearPersistedSummary();
      }

      // Check for active session first
      if (this.authService.isLoggedIn()) {
        const activeSession = await this.soloRoomService.checkActiveSession();
        if (activeSession) {
          await this.gameSrv.handleReconnection(activeSession.$id);
          await this.router.navigate(['/game']);
          return;
        }
      }

      // No active session: route based on auth state
      // Si on est déjà sur /rooms, ne pas rediriger
      if (this.router.url !== '/rooms' && this.authService.isLoggedIn()) {
        await this.router.navigate(['/rooms']);
      } else if (this.authService.isAnonymous()) {
        await this.router.navigate(['/players']);
      }
    } catch {
      // Auth init failed, continue normally
    }
  }

  onSummaryModeCheckChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.gameSrv.withSummaryMode.set(checkbox.checked);
  }
}
