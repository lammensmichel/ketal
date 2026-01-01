import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { LanguageService } from '../../_helpers/language.helper';
import { GameService } from '../../../services/game/game.service';
import { Language } from '../../_models/language.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslateModule, FontAwesomeIconsModule],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  readonly gameSrv = inject(GameService);
  readonly languageHelper = inject(LanguageService);

  selectedLanguage: string;
  languages: Language[];

  constructor() {
    this.languages = this.languageHelper.constructPossibleLanguages();
    const browserLang = this.translate.getBrowserLang() ?? 'fr';
    this.selectedLanguage = this.translate.currentLang || this.translate.getDefaultLang() || browserLang;
  }

  restartGame(): void {
    this.gameSrv.resetGame();
    this.router.navigate(['/players']);
  }

  public onLanguageChange() {
    if (this.selectedLanguage) {
      this.translate.use(this.selectedLanguage);
    }
  }
}
