import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { GameService } from './services/game/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ketal';

  constructor(
    public gameSrv: GameService,
    private translate: TranslateService
  ) {
    const defaultLang = environment.defaultLanguage;
    translate.setDefaultLang(defaultLang);
    translate.use(defaultLang);
  }
}
