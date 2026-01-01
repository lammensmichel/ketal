import { Component, computed, Signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { PlayerHelperService } from './_shared/_helpers/player.helper';
import { GameService } from './services/game/game.service';
import { HeaderComponent } from './_shared/_components/header/header.component';
import { FooterComponent } from './_shared/_components/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterOutlet, TranslateModule, HeaderComponent, FooterComponent],
})
export class AppComponent {
  readonly gameSrv = inject(GameService);
  readonly translate = inject(TranslateService);
  readonly playerSrv = inject(PlayerHelperService);

  readonly withSummaryMode: Signal<boolean>;

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

  onSummaryModeCheckChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.gameSrv.withSummaryMode.set(checkbox.checked);
  }
}
