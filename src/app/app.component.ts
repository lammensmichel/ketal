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
   */
  readonly canShowSummary = computed(() => {
    return this.isPlayersPage()
      && this.authService.isLoggedIn()
      && !this.authService.isAnonymous();
  });

  constructor() {
    const defaultLang = this.translate.getBrowserLang() ?? environment.defaultLanguage;
    this.translate.setDefaultLang(defaultLang);
    this.translate.use(defaultLang);

    this.withSummaryMode = computed(() => {
      const summaryMode = this.gameSrv.withSummaryMode();
      const gameSummary = this.gameSrv.summary();
      return this.playerSrv.getPlayerNumber() > 1 ? summaryMode || gameSummary : summaryMode;
    });
  }

  /**
   * On init, check for active room + session to resume.
   * If found, restore game state and navigate to /game.
   */
  async ngOnInit(): Promise<void> {
    try {
      await this.authService.init();

      if (this.authService.isLoggedIn()) {
        const activeSession = await this.soloRoomService.checkActiveSession();
        if (activeSession) {
          await this.gameSrv.handleReconnection(activeSession.$id);
          await this.router.navigate(['/game']);
        }
      }
    } catch {
      // Auth init or session check failed, continue normally
    }
  }

  onSummaryModeCheckChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.gameSrv.withSummaryMode.set(checkbox.checked);
  }
}
