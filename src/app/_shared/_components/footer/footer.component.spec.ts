import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { FooterComponent } from './footer.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../_helpers/player.helper';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';
import { Game } from '../../_models/game.model';
import { PlayerModel } from '../../_models/player.model';
import { DrinkChoiceEnum } from '../../_models/enums/drink_choice.enum';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;

  const mockPlayer: PlayerModel = {
    id: '1',
    name: 'Test Player',
    cards: [],
    avatarSrc: '',
    choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
    sips: { drunk: 0, given: 0 },
  };

  const mockGame: Game = {
    players: [mockPlayer],
    turn: 1,
    maxTurnCount: 4,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: mockPlayer,
    status: 1,
    summary: false,
  };

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    // Set initial game state via signal
    mockGameService.gameSignal.set(mockGame);

    // Mock game object
    (mockGameService as any).game = { ...mockGame };

    // Add missing mock methods
    (mockGameService as any).isNotAllSipsGiven = jasmine.createSpy('isNotAllSipsGiven').and.returnValue(false);
    (mockGameService as any).getLastCard = jasmine.createSpy('getLastCard').and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FooterComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Computed Signals', () => {
    it('should have game computed signal', () => {
      expect(component.game).toBeDefined();
      expect(typeof component.game).toBe('function');
    });

    it('should have activeTurn computed signal', () => {
      expect(component.activeTurn).toBeDefined();
      expect(typeof component.activeTurn).toBe('function');
    });

    it('should have drinkingCards computed signal', () => {
      expect(component.drinkingCards).toBeDefined();
      expect(typeof component.drinkingCards).toBe('function');
    });

    it('should have givingCards computed signal', () => {
      expect(component.givingCards).toBeDefined();
      expect(typeof component.givingCards).toBe('function');
    });

    it('should return game from gameSignal', () => {
      fixture.detectChanges();
      expect(component.game()).toEqual(mockGame);
    });

    it('should return activeTurn from game', () => {
      fixture.detectChanges();
      expect(component.activeTurn()).toBe(1);
    });

    it('should set activePlayer to first player if not set', () => {
      const gameWithoutActivePlayer = { ...mockGame, activePlayer: undefined };
      mockGameService.gameSignal.set(gameWithoutActivePlayer);

      fixture.detectChanges();

      expect(component.game()?.activePlayer).toEqual(mockPlayer);
    });

    it('should update when gameSignal changes', () => {
      fixture.detectChanges();
      expect(component.activeTurn()).toBe(1);

      mockGameService.gameSignal.set({ ...mockGame, turn: 3 });
      fixture.detectChanges();

      expect(component.activeTurn()).toBe(3);
    });

    it('should update drinkingCards and givingCards from game', () => {
      const testCards = [
        { value: '5', suit: 'hearts', icon: 'heart', sips: 1, selected: false, img: 'test.png', givenSips: 0 },
      ];
      mockGameService.gameSignal.set({ ...mockGame, drinkingCards: testCards, givingCards: testCards });

      fixture.detectChanges();

      expect(component.drinkingCards()).toEqual(testCards);
      expect(component.givingCards()).toEqual(testCards);
    });
  });

  describe('chooseColor', () => {
    it('should call setChoiceAndPickCard with Color enum and selected color', () => {
      component.chooseColor('red');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.Color, 'red');
    });

    it('should call setChoiceAndPickCard with black color', () => {
      component.chooseColor('black');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.Color, 'black');
    });
  });

  describe('plusOrMinus', () => {
    it('should call setChoiceAndPickCard with PlusOrMinus enum', () => {
      component.plusOrMinus('plus');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.PlusOrMinus, 'plus');
    });

    it('should call setChoiceAndPickCard with minus selection', () => {
      component.plusOrMinus('minus');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.PlusOrMinus, 'minus');
    });
  });

  describe('inOut', () => {
    it('should call setChoiceAndPickCard with InAndOut enum', () => {
      component.inOut('in');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.InAndOut, 'in');
    });

    it('should call setChoiceAndPickCard with out selection', () => {
      component.inOut('out');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.InAndOut, 'out');
    });
  });

  describe('chooseSuit', () => {
    it('should call setChoiceAndPickCard with Suit enum', () => {
      component.chooseSuit('hearts');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.Suit, 'hearts');
    });

    it('should call setChoiceAndPickCard with spades', () => {
      component.chooseSuit('spades');
      expect(mockGameService.setChoiceAndPickCard).toHaveBeenCalledWith(DrinkChoiceEnum.Suit, 'spades');
    });
  });

  describe('hasPlayers', () => {
    it('should return true when players exist', () => {
      (mockPlayerHelperService as any).players = [mockPlayer];
      expect(component.hasPlayers()).toBeTrue();
    });

    it('should return false when no players', () => {
      (mockPlayerHelperService as any).players = [];
      expect(component.hasPlayers()).toBeFalse();
    });
  });

  describe('beginGame', () => {
    it('should call gameSrv.beginGame with withSummaryMode', () => {
      component.withSummaryMode = true;
      component.beginGame();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(true);
    });

    it('should call gameSrv.beginGame with false when withSummaryMode is false', () => {
      component.withSummaryMode = false;
      component.beginGame();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(false);
    });
  });

  describe('delay', () => {
    it('should return a promise that resolves after specified ms', fakeAsync(() => {
      let resolved = false;
      component.delay(100).then(() => {
        resolved = true;
      });
      expect(resolved).toBeFalse();
      tick(100);
      expect(resolved).toBeTrue();
    }));
  });

  describe('restartGame', () => {
    beforeEach(() => {
      mockGameService.game = { status: 1 } as any;
    });

    it('should call resetGame and set status to 0 when all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      component.restartGame();
      tick();
      expect(mockGameService.resetGame).toHaveBeenCalled();
      expect(mockGameService.game.status).toBe(0);
    }));

    it('should display toast when not all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(true);
      const toastSpy = spyOn(component, 'displayNotAllSipsGivenToast');
      component.restartGame();
      tick(2500);
      expect(toastSpy).toHaveBeenCalled();
    }));
  });

  describe('displaySummary', () => {
    it('should call setStatus(3) when all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      component.displaySummary();
      tick();
      expect(mockGameService.setStatus).toHaveBeenCalledWith(3);
    }));

    it('should display toast when not all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(true);
      const toastSpy = spyOn(component, 'displayNotAllSipsGivenToast');
      component.displaySummary();
      tick(2500);
      expect(toastSpy).toHaveBeenCalled();
    }));
  });

  describe('displayNotAllSipsGivenToast', () => {
    it('should call show on toastComponent when defined', () => {
      const mockToast = { show: jasmine.createSpy('show') };
      component.toastComponent = mockToast as any;
      component.displayNotAllSipsGivenToast();
      expect(mockToast.show).toHaveBeenCalled();
    });

    it('should not throw when toastComponent is undefined', () => {
      component.toastComponent = undefined;
      expect(() => component.displayNotAllSipsGivenToast()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when called', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
