import { Injectable } from '@angular/core';
import { Language } from '../_models/language.model';

@Injectable({providedIn: 'root'})
export class LanguageService {
  constructor() { }

  public constructPossibleLanguages(): Language[] {
        const possibleLanguages: Language[] = [
      {name: "Français", shortName: 'fr'},
      {name: "English", shortName: 'en'}
    ];

    return possibleLanguages;

  }
}
