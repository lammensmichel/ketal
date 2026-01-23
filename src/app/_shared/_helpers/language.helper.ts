import { Injectable } from '@angular/core';
import { Language } from '../_models/language.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  public constructPossibleLanguages(): Language[] {
    const possibleLanguages: Language[] = [
      { name: 'Français', shortName: 'fr' },
      { name: 'English', shortName: 'en' },
      { name: 'Nederlands', shortName: 'nl' },
      { name: 'Deutsch', shortName: 'de' },
    ];

    return possibleLanguages;
  }
}
