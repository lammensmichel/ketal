import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { GameService } from './services/game/game.service';
import { PlayerHelperService } from './_shared/_helpers/player.helper';
import { LocalService } from './services/local/local.service';
import { CardService } from './services/card/card.service';
import { CardDeckHelperService } from './_shared/_helpers/card-deck.helper';
import {
  createMockGameService,
  createMockPlayerHelperService,
  createMockLocalService,
  createMockCardService,
  createMockCardDeckHelperService,
} from './testing/test-helpers';
import { Game } from './_shared/_models/game.model';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['getBrowserLang', 'setDefaultLang', 'use']);
    mockTranslateService.getBrowserLang.and.returnValue('en');

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, TranslateModule.forRoot()],
      declarations: [AppComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: TranslateService, useValue: mockTranslateService },
        LocalService,
        CardService,
        CardDeckHelperService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the app component', () => {
      expect(component).toBeTruthy();
    });

    it('should have withSummaryMode signal initialized', () => {
      expect(component.withSummaryMode).toBeDefined();
      expect(typeof component.withSummaryMode).toBe('function');
    });

    it('should inject required services', () => {
      expect(component.gameSrv).toBeTruthy();
      expect(component.translate).toBeTruthy();
      expect(component.playerSrv).toBeTruthy();
    });

    it('should have OnPush change detection strategy', () => {
      const metadata = (AppComponent as any).__annotations__[0];
      expect(metadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });
  });

  describe('Constructor', () => {
    it('should set default language from browser or environment', () => {
      expect(mockTranslateService.setDefaultLang).toHaveBeenCalledWith('en');
      expect(mockTranslateService.use).toHaveBeenCalledWith('en');
    });
  });

  describe('withSummaryMode computed signal', () => {
    it('should return false when game is null', () => {
      mockGameService.gameSignal.set(null);
      mockGameService.withSummaryMode.set(false);

      fixture.detectChanges();

      expect(component.withSummaryMode()).toBe(false);
    });

    it('should return signal value when player count is 1 or less', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      mockGameService.withSummaryMode.set(true);

      fixture.detectChanges();

      expect(component.withSummaryMode()).toBe(true);
    });

    it('should return true when game.summary is true and player count > 1', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.gameSignal.set({
        players: [],
        turn: 1,
        phase: 1,
        maxTurnCount: 4,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: true,
      } as Game);
      mockGameService.withSummaryMode.set(false);

      fixture.detectChanges();

      expect(component.withSummaryMode()).toBe(true);
    });
  });

  describe('onSummaryModeCheckChange', () => {
    it('should set withSummaryMode signal to true when checkbox is checked', () => {
      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      component.onSummaryModeCheckChange(event);

      expect(mockGameService.withSummaryMode()).toBe(true);
    });

    it('should set withSummaryMode signal to false when checkbox is unchecked', () => {
      mockGameService.withSummaryMode.set(true);

      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = false;
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      component.onSummaryModeCheckChange(event);

      expect(mockGameService.withSummaryMode()).toBe(false);
    });

    it('should handle rapid checkbox changes', () => {
      const event = new Event('change');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      Object.defineProperty(event, 'target', { value: checkbox, enumerable: true });

      checkbox.checked = true;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(true);

      checkbox.checked = false;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(false);

      checkbox.checked = true;
      component.onSummaryModeCheckChange(event);
      expect(mockGameService.withSummaryMode()).toBe(true);
    });
  });

  describe('Change Detection with OnPush and Signals', () => {
    it('should use OnPush change detection strategy', () => {
      const componentMetadata = (AppComponent as any).__annotations__[0];
      expect(componentMetadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });

    it('should update withSummaryMode when signal changes', () => {
      mockGameService.withSummaryMode.set(false);
      fixture.detectChanges();
      expect(component.withSummaryMode()).toBe(false);

      mockGameService.withSummaryMode.set(true);
      fixture.detectChanges();
      expect(component.withSummaryMode()).toBe(true);
    });
  });
});
