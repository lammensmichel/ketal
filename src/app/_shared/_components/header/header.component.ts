import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { String } from 'typescript-string-operations';
import { LanguageService } from '../../_helpers/language.helper';
import { Language } from '../../_models/language.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  public languageForm: FormGroup;
  /**
   *
   */
  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    public languageHelper: LanguageService) {
    this.languageForm = this.formBuilder.group({
      selectedLanguage: [translate.getBrowserLang() ?? 'en']
    });
  }

  public getPossibleLanguages(): Language[] {
    return this.languageHelper.constructPossibleLanguages();
  }

  public onLanguageChange() {
    const selectedLanguage: string = this.languageForm.get('selectedLanguage')?.value;

    if(!String.isNullOrWhiteSpace(selectedLanguage)){
      this.translate.use(selectedLanguage);
    }
  }
}
