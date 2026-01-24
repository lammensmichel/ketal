import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from './header.component';
import { GameService } from '../../../services/game/game.service';
import { LanguageService } from '../../_helpers/language.helper';
import { createMockGameService } from '../../../testing/test-helpers';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let translateService: TranslateService;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockLanguageService = jasmine.createSpyObj('LanguageService', ['constructPossibleLanguages']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockLanguageService.constructPossibleLanguages.and.returnValue([
      { name: 'Francais', shortName: 'fr' },
      { name: 'English', shortName: 'en' },
    ]);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HeaderComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor initialization', () => {
    it('should initialize languages from languageHelper', () => {
      expect(mockLanguageService.constructPossibleLanguages).toHaveBeenCalled();
      expect(component.languages).toEqual([
        { name: 'Francais', shortName: 'fr' },
        { name: 'English', shortName: 'en' },
      ]);
    });

    it('should initialize selectedLanguage', () => {
      expect(component.selectedLanguage).toBeDefined();
    });

    it('should set selectedLanguage to currentLang if available', () => {
      translateService.currentLang = 'en';
      // Re-create component to test constructor behavior
      fixture = TestBed.createComponent(HeaderComponent);
      component = fixture.componentInstance;
      expect(component.selectedLanguage).toBe('en');
    });
  });

  describe('onLanguageChange', () => {
    it('should call translate.use() with selectedLanguage when selectedLanguage is set', () => {
      spyOn(translateService, 'use');
      component.selectedLanguage = 'en';
      component.onLanguageChange();
      expect(translateService.use).toHaveBeenCalledWith('en');
    });

    it('should not call translate.use() when selectedLanguage is empty', () => {
      spyOn(translateService, 'use');
      component.selectedLanguage = '';
      component.onLanguageChange();
      expect(translateService.use).not.toHaveBeenCalled();
    });

    it('should call translate.use() with fr when selectedLanguage is fr', () => {
      spyOn(translateService, 'use');
      component.selectedLanguage = 'fr';
      component.onLanguageChange();
      expect(translateService.use).toHaveBeenCalledWith('fr');
    });
  });

  describe('restartGame', () => {
    it('should call gameSrv.resetGame()', () => {
      component.restartGame();
      expect(mockGameService.resetGame).toHaveBeenCalled();
    });

    it('should navigate to /players', () => {
      component.restartGame();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
    });
  });
});
