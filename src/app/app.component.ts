import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {environment} from 'src/environments/environment';
import {GameService} from './services/game/game.service';
import {PlayerHelperService} from "./_shared/_helpers/player.helper";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ketal';

  withSummaryMode: boolean = false;
  withSummaryModeSub: Subscription = new Subscription();

  constructor(
    public gameSrv: GameService,
    public translate: TranslateService,
    public playerSrv: PlayerHelperService
  ) {
      const defaultLang = translate.getBrowserLang() ?? environment.defaultLanguage;
    translate.setDefaultLang(defaultLang);
    translate.use(defaultLang);
  }

  onSummaryModeCheckChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.withSummaryMode = checkbox.checked;
  }

  ngOnInit(): void {

    this.withSummaryModeSub = this.gameSrv.withSummaryMode.subscribe((withSummaryMode) => {
      this.withSummaryMode = withSummaryMode;
    });

    if (this.gameSrv.game) {
      this.withSummaryMode = this.playerSrv.getPlayerNumber() <= 1 ? false : this.gameSrv.game.summary;
    } else {
      this.withSummaryMode = false;
    }
  }

  ngOnDestroy(): void {
    this.withSummaryModeSub.unsubscribe();
  }

}
