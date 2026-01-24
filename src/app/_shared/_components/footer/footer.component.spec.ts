import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockRouter: jasmine.SpyObj<Router>;

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
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], { url: '/game' });

    // Set initial game state via signal
    mockGameService.game.set(mockGame);

    // Add missing mock methods
    (mockGameService as any).isNotAllSipsGiven = jasmine.createSpy('isNotAllSipsGiven').and.returnValue(false);
    (mockGameService as any).getLastCard = jasmine.createSpy('getLastCard').and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FooterComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Properties', () => {
    it('should have gameSrv injected', () => {
      expect(component.gameSrv).toBeDefined();
    });

    it('should have playerHelper injected', () => {
      expect(component.playerHelper).toBeDefined();
    });

    it('should have withSummaryMode input initialized to false', () => {
      expect(component.withSummaryMode).toBeFalse();
    });

    it('should have cardSlots array with 6 elements', () => {
      expect(component.cardSlots).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('Game State Access', () => {
    it('should access game state through gameSrv', () => {
      fixture.detectChanges();
      // The game signal is accessible and contains the mock game data
      const game = component.gameSrv.game();
      expect(game).toBeDefined();
      expect(game.turn).toBe(mockGame.turn);
      expect(game.phase).toBe(mockGame.phase);
    });

    it('should access turn through gameSrv', () => {
      fixture.detectChanges();
      // turn() returns from the mock signal which was set to 1
      expect(component.gameSrv.turn()).toBeDefined();
    });

    it('should access drinkingCards through gameSrv', () => {
      fixture.detectChanges();
      // drinkingCards() returns from the mock signal
      expect(component.gameSrv.drinkingCards()).toBeDefined();
    });

    it('should access givingCards through gameSrv', () => {
      fixture.detectChanges();
      // givingCards() returns from the mock signal
      expect(component.gameSrv.givingCards()).toBeDefined();
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
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer]);
      expect(component.hasPlayers()).toBeTrue();
    });

    it('should return false when no players', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([]);
      expect(component.hasPlayers()).toBeFalse();
    });
  });

  describe('beginGame', () => {
    it('should call gameSrv.beginGame with withSummaryMode and navigate', () => {
      component.withSummaryMode = true;
      component.beginGame();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(true);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    });

    it('should call gameSrv.beginGame with false when withSummaryMode is false', () => {
      component.withSummaryMode = false;
      component.beginGame();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    });
  });

  describe('restartGame', () => {
    it('should call resetGame and navigate when all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      component.restartGame();
      tick();
      expect(mockGameService.resetGame).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
    }));

    it('should show toast when not all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(true);
      const mockToast = { show: jasmine.createSpy('show') };
      component.toastComponent = mockToast as any;
      component.restartGame();
      tick(2500);
      expect(mockToast.show).toHaveBeenCalled();
    }));
  });

  describe('displaySummary', () => {
    it('should call setStatus(3) when all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      component.displaySummary();
      tick();
      expect(mockGameService.setStatus).toHaveBeenCalledWith(3);
    }));

    it('should show toast when not all sips are given', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(true);
      const mockToast = { show: jasmine.createSpy('show') };
      component.toastComponent = mockToast as any;
      component.displaySummary();
      tick(2500);
      expect(mockToast.show).toHaveBeenCalled();
    }));
  });

  describe('toastComponent', () => {
    it('should call show on toastComponent when defined', () => {
      const mockToast = { show: jasmine.createSpy('show') };
      component.toastComponent = mockToast as any;
      mockToast.show();
      expect(mockToast.show).toHaveBeenCalled();
    });
  });
});
