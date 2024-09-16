import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from "rxjs";
import { environment } from 'src/environments/environment';
import { PlayerHelperService } from "./_shared/_helpers/player.helper";
import { SafeUnsubscribe } from './_shared/_helpers/safe-unsubscribe.helper';
import { GameService } from './services/game/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent extends SafeUnsubscribe implements OnInit {
  withSummaryMode: boolean = false;

  constructor(
    public gameSrv: GameService,
    public translate: TranslateService,
    public playerSrv: PlayerHelperService
  ) {
    super();
    const defaultLang = translate.getBrowserLang() ?? environment.defaultLanguage;
    translate.setDefaultLang(defaultLang);
    translate.use(defaultLang);
  }

  onSummaryModeCheckChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.withSummaryMode = checkbox.checked;
  }

  ngOnInit(): void {
    this.gameSrv.withSummaryMode
    .pipe(takeUntil(this.ngUnsubscribe))
    .subscribe((withSummaryMode: boolean) => {
      this.withSummaryMode = withSummaryMode;
    });

    if (this.gameSrv.game) {
      this.withSummaryMode = this.playerSrv.getPlayerNumber() <= 1 ? false : this.gameSrv.game.summary;
    } else {
      this.withSummaryMode = false;
    }
  }

}
