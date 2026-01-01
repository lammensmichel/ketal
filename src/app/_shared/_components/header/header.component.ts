import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../_helpers/language.helper';
import { GameService } from '../../../services/game/game.service';
import { Language } from '../../_models/language.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public selectedLanguage: string;
  public languages: Language[];

  constructor(
    private translate: TranslateService,
    public gameSrv: GameService,
    public languageHelper: LanguageService
  ) {
    this.languages = this.languageHelper.constructPossibleLanguages();
    const browserLang = translate.getBrowserLang() ?? 'fr';
    this.selectedLanguage = translate.currentLang || translate.getDefaultLang() || browserLang;
  }

  restartGame() {
    this.gameSrv.resetGame();
    this.gameSrv.game.status = 0;
  }

  public onLanguageChange() {
    if (this.selectedLanguage) {
      this.translate.use(this.selectedLanguage);
    }
  }
}
