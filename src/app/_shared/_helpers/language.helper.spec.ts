import { TestBed } from '@angular/core/testing';

import { LanguageService } from './language.helper';
import { Language } from '../_models/language.model';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructPossibleLanguages', () => {
    it('should return an array of languages', () => {
      const languages = service.constructPossibleLanguages();

      expect(languages).toBeTruthy();
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should return a non-empty array', () => {
      const languages = service.constructPossibleLanguages();

      expect(languages.length).toBeGreaterThan(0);
    });

    it('should return exactly 4 languages', () => {
      const languages = service.constructPossibleLanguages();

      expect(languages.length).toBe(4);
    });

    it('should have each language with name property', () => {
      const languages = service.constructPossibleLanguages();

      languages.forEach((language: Language) => {
        expect(language.name).toBeDefined();
        expect(typeof language.name).toBe('string');
        expect(language.name.length).toBeGreaterThan(0);
      });
    });

    it('should have each language with shortName property', () => {
      const languages = service.constructPossibleLanguages();

      languages.forEach((language: Language) => {
        expect(language.shortName).toBeDefined();
        expect(typeof language.shortName).toBe('string');
        expect(language.shortName.length).toBeGreaterThan(0);
      });
    });

    it('should include French language', () => {
      const languages = service.constructPossibleLanguages();

      const french = languages.find((lang) => lang.shortName === 'fr');

      expect(french).toBeDefined();
      expect(french?.name).toBe('Français');
    });

    it('should include English language', () => {
      const languages = service.constructPossibleLanguages();

      const english = languages.find((lang) => lang.shortName === 'en');

      expect(english).toBeDefined();
      expect(english?.name).toBe('English');
    });

    it('should include Dutch language', () => {
      const languages = service.constructPossibleLanguages();

      const dutch = languages.find((lang) => lang.shortName === 'nl');

      expect(dutch).toBeDefined();
      expect(dutch?.name).toBe('Nederlands');
    });

    it('should include German language', () => {
      const languages = service.constructPossibleLanguages();

      const german = languages.find((lang) => lang.shortName === 'de');

      expect(german).toBeDefined();
      expect(german?.name).toBe('Deutsch');
    });

    it('should return a new array on each call', () => {
      const languages1 = service.constructPossibleLanguages();
      const languages2 = service.constructPossibleLanguages();

      expect(languages1).not.toBe(languages2);
      expect(languages1).toEqual(languages2);
    });

    it('should return languages conforming to Language interface', () => {
      const languages = service.constructPossibleLanguages();

      languages.forEach((language: Language) => {
        expect(Object.keys(language)).toContain('name');
        expect(Object.keys(language)).toContain('shortName');
      });
    });

    it('should have unique shortNames', () => {
      const languages = service.constructPossibleLanguages();

      const shortNames = languages.map((lang) => lang.shortName);
      const uniqueShortNames = [...new Set(shortNames)];

      expect(shortNames.length).toBe(uniqueShortNames.length);
    });
  });
});
