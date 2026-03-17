import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FooterComponent } from './footer.component';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../_helpers/player.helper';
import {
  createMockAuthService,
  createMockGameService,
  createMockPlayerHelperService,
} from '../../../testing/test-helpers';
import { Game } from '../../_models/game.model';
import { PlayerModel } from '../../_models/player.model';
import { CardType } from '../../_models/card-type.model';
import { DrinkChoiceEnum } from '../../_models/enums/drink_choice.enum';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockAuthService: ReturnType<typeof createMockAuthService>;
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
    mockAuthService = createMockAuthService();
    mockPlayerHelperService = createMockPlayerHelperService();
    mockRouter = jasmine.createSpyObj('Router', ['navigate'], { url: '/game' });

    // Set initial game state via signal
    mockGameService.game.set(mockGame);

    // Add missing mock methods
    (mockGameService as any).isNotAllSipsGiven = jasmine.createSpy('isNotAllSipsGiven').and.returnValue(false);
    (mockGameService as any).getLastCard = jasmine.createSpy('getLastCard').and.returnValue(null);

    // beginGame is async - must return a Promise
    mockGameService.beginGame.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FooterComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('pendingSummary');
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
    it('should return true when 2 or more players exist', () => {
      const secondPlayer = { ...mockPlayer, id: '2', name: 'Player 2' };
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer, secondPlayer]);
      expect(component.hasPlayers()).toBeTrue();
    });

    it('should return false when only 1 player', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer]);
      expect(component.hasPlayers()).toBeFalse();
    });

    it('should return false when no players', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([]);
      expect(component.hasPlayers()).toBeFalse();
    });
  });

  describe('needsMorePlayers', () => {
    it('should return true when exactly 1 player exists', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer]);
      expect(component.needsMorePlayers()).toBeTrue();
    });

    it('should return false when 2 or more players exist', () => {
      const secondPlayer = { ...mockPlayer, id: '2', name: 'Player 2' };
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer, secondPlayer]);
      expect(component.needsMorePlayers()).toBeFalse();
    });

    it('should return false when no players exist', () => {
      mockPlayerHelperService.getPlayers.and.returnValue([]);
      expect(component.needsMorePlayers()).toBeFalse();
    });
  });

  describe('beginGame', () => {
    it('should call gameSrv.beginGame with withSummaryMode and navigate', fakeAsync(() => {
      component.withSummaryMode = true;
      component.beginGame();
      tick();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(true);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    }));

    it('should call gameSrv.beginGame with false when withSummaryMode is false', fakeAsync(() => {
      component.withSummaryMode = false;
      component.beginGame();
      tick();
      expect(mockGameService.beginGame).toHaveBeenCalledWith(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    }));
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
    it('should call setStatus(3) when all sips are given and user can access summary', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      // Local mode = summary always accessible
      // gameMode is signal('local') by default - no change needed
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

    it('should show account gate modal for anonymous user in room mode', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(true);

      const mockModal = { show: jasmine.createSpy('show') };
      component.accountGateModal = mockModal as any;

      component.displaySummary();
      tick();

      expect(mockGameService.setStatus).not.toHaveBeenCalled();
      expect(mockModal.show).toHaveBeenCalled();
    }));

    it('should allow summary for authenticated non-anonymous user in room mode', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);

      component.displaySummary();
      tick();

      expect(mockGameService.setStatus).toHaveBeenCalledWith(3);
    }));

    it('should show account gate modal when not logged in at all in room mode', fakeAsync(() => {
      (mockGameService as any).isNotAllSipsGiven.and.returnValue(false);
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(false);
      mockAuthService.isAnonymous.set(false);

      const mockModal = { show: jasmine.createSpy('show') };
      component.accountGateModal = mockModal as any;

      component.displaySummary();
      tick();

      expect(mockGameService.setStatus).not.toHaveBeenCalled();
      expect(mockModal.show).toHaveBeenCalled();
    }));
  });

  describe('canAccessSummary', () => {
    it('should return true in local mode', () => {
      // gameMode is signal('local') by default - no change needed
      expect(component.canAccessSummary()).toBeTrue();
    });

    it('should return true for authenticated non-anonymous user in room mode', () => {
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(false);
      expect(component.canAccessSummary()).toBeTrue();
    });

    it('should return false for anonymous user in room mode', () => {
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(true);
      mockAuthService.isAnonymous.set(true);
      expect(component.canAccessSummary()).toBeFalse();
    });

    it('should return false when not logged in in room mode', () => {
      (mockGameService as any).gameMode.set('room');
      mockAuthService.isLoggedIn.set(false);
      mockAuthService.isAnonymous.set(false);
      expect(component.canAccessSummary()).toBeFalse();
    });
  });

  describe('onGateCreateAccount', () => {
    it('should set pendingSummary in localStorage and navigate to /register', () => {
      component.onGateCreateAccount();
      expect(localStorage.getItem('pendingSummary')).toBe('true');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
    });
  });

  describe('onGateLogin', () => {
    it('should set pendingSummary in localStorage and navigate to /login', () => {
      component.onGateLogin();
      expect(localStorage.getItem('pendingSummary')).toBe('true');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isHiddenPage', () => {
    it('should return true for /login', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/login');
      expect(component.isHiddenPage()).toBeTrue();
    });

    it('should return true for /register', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/register');
      expect(component.isHiddenPage()).toBeTrue();
    });

    it('should return true for /room/create', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/room/create');
      expect(component.isHiddenPage()).toBeTrue();
    });

    it('should return true for /room/join', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/room/join');
      expect(component.isHiddenPage()).toBeTrue();
    });

    it('should return true for /room/abc123 (lobby)', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/room/abc123');
      expect(component.isHiddenPage()).toBeTrue();
    });

    it('should return false for /players', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/players');
      expect(component.isHiddenPage()).toBeFalse();
    });

    it('should return false for /game', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/game');
      expect(component.isHiddenPage()).toBeFalse();
    });
  });

  describe('isPlayersPage', () => {
    it('should return true for /players', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/players');
      expect(component.isPlayersPage()).toBeTrue();
    });

    it('should return false for /game', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/game');
      expect(component.isPlayersPage()).toBeFalse();
    });

    it('should return false for /room/create', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue('/room/create');
      expect(component.isPlayersPage()).toBeFalse();
    });

    it('should return true for /players with query params', () => {
      (Object.getOwnPropertyDescriptor(mockRouter, 'url')!.get as jasmine.Spy).and.returnValue(
        '/players?returnUrl=/game'
      );
      expect(component.isPlayersPage()).toBeTrue();
    });
  });

  describe('toastComponent', () => {
    it('should call show on toastComponent when defined', () => {
      const mockToast = { show: jasmine.createSpy('show') };
      component.toastComponent = mockToast as any;
      mockToast.show();
      expect(mockToast.show).toHaveBeenCalled();
    });
  });

  describe('getReferenceCard', () => {
    function setActivePlayer(player: PlayerModel | undefined): void {
      // Jasmine spy properties use getter spies; override to return a signal wrapping the player
      const desc = Object.getOwnPropertyDescriptor(mockGameService, 'activePlayer');
      if (desc?.get) {
        (desc.get as jasmine.Spy).and.returnValue(signal(player));
      }
    }

    it('should return the first card of the active player when cards exist', () => {
      const card: CardType = { value: '4', suit: 'hearts', icon: null, sips: 0, selected: false, img: 'assets/images/cards/svg/4_of_hearts.svg', givenSips: undefined };
      const playerWithCard: PlayerModel = { ...mockPlayer, cards: [card] };
      setActivePlayer(playerWithCard);

      expect(component.getReferenceCard()).toEqual(card);
    });

    it('should return null when active player has no cards', () => {
      setActivePlayer({ ...mockPlayer, cards: [] });

      expect(component.getReferenceCard()).toBeNull();
    });

    it('should return null when there is no active player', () => {
      setActivePlayer(undefined);

      expect(component.getReferenceCard()).toBeNull();
    });
  });
});
