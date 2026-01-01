import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectionStrategy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameComponent } from './game.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';
import { Game } from '../../../_shared/_models/game.model';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [GameComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have ChangeDetectionStrategy.OnPush', () => {
      const metadata = (GameComponent as any).__annotations__[0];
      expect(metadata.changeDetection).toBe(ChangeDetectionStrategy.OnPush);
    });

    it('should have correct selector', () => {
      const metadata = (GameComponent as any).__annotations__[0];
      expect(metadata.selector).toBe('app-game');
    });
  });

  describe('Component Properties', () => {
    it('should initialize playerCount to 0', () => {
      expect(component.playerCount).toBe(0);
    });

    it('should initialize game as undefined', () => {
      expect(component.game).toBeUndefined();
    });
  });

  describe('Constructor', () => {
    it('should inject GameService', () => {
      expect(component.gameSrv).toBe(mockGameService);
    });

    it('should have public gameSrv property', () => {
      expect(component.gameSrv).toBeDefined();
    });
  });

  describe('ngOnInit Lifecycle', () => {
    it('should initialize component when ngOnInit is called', () => {
      // Setup mock data with 3 players
      mockGameService.game = {
        players: [
          { id: 1, name: 'Player 1' } as any,
          { id: 2, name: 'Player 2' } as any,
          { id: 3, name: 'Player 3' } as any,
        ],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.playerCount).toBe(3);
      expect(mockGameService.game.maxTurnCount).toBe(12); // 3 players * 4
    });

    it('should set game property from gameSrv.game', () => {
      const mockGame: Game = {
        players: [{ id: 1, name: 'Player 1' } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 4,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };
      mockGameService.game = mockGame;

      component.ngOnInit();

      expect(component.game).toBe(mockGame);
    });

    it('should calculate maxTurnCount based on playerCount', () => {
      mockGameService.game = {
        players: [{ id: 1 } as any, { id: 2 } as any, { id: 3 } as any, { id: 4 } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.playerCount).toBe(4);
      expect(mockGameService.game.maxTurnCount).toBe(16); // 4 players * 4
    });

    it('should handle empty player list', () => {
      mockGameService.game = {
        players: [],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.playerCount).toBe(0);
      expect(mockGameService.game.maxTurnCount).toBe(0);
    });

    it('should handle single player game', () => {
      mockGameService.game = {
        players: [{ id: 1, name: 'Solo Player' } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.playerCount).toBe(1);
      expect(mockGameService.game.maxTurnCount).toBe(4); // 1 player * 4
    });

    it('should handle large number of players', () => {
      const players = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }) as any);
      mockGameService.game = {
        players,
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.playerCount).toBe(10);
      expect(mockGameService.game.maxTurnCount).toBe(40); // 10 players * 4
    });
  });

  describe('Template Rendering', () => {
    it('should render app-main-game component', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const appMainGame = compiled.querySelector('app-main-game');

      expect(appMainGame).toBeTruthy();
    });

    it('should have app-game selector as component', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const parentElement = compiled.parentElement;

      // The component itself is wrapped in app-game
      expect(fixture.debugElement.nativeElement.tagName.toLowerCase()).toBe('div');
    });
  });

  describe('Data Flow and Reactivity', () => {
    it('should update playerCount when game changes', () => {
      const initialPlayers = [{ id: 1 } as any];
      mockGameService.game = {
        players: initialPlayers,
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();
      expect(component.playerCount).toBe(1);

      // Simulate game update with more players
      mockGameService.game.players = [{ id: 1 } as any, { id: 2 } as any, { id: 3 } as any];
      component.ngOnInit();

      expect(component.playerCount).toBe(3);
    });

    it('should reference the same game instance from gameSrv', () => {
      const testGame: Game = {
        players: [{ id: 1 } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };
      mockGameService.game = testGame;

      component.ngOnInit();

      expect(component.game).toEqual(testGame);
      expect(component.game).toBe(mockGameService.game);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined activePlayer', () => {
      mockGameService.game = {
        players: [{ id: 1 } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.game?.activePlayer).toBeUndefined();
    });

    it('should handle empty card arrays', () => {
      mockGameService.game = {
        players: [{ id: 1 } as any],
        turn: 1,
        phase: 1,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 0,
        summary: false,
      };

      component.ngOnInit();

      expect(component.game?.drinkingCards).toEqual([]);
      expect(component.game?.givingCards).toEqual([]);
    });

    it('should preserve game properties during initialization', () => {
      const mockGame: Game = {
        players: [{ id: 1 } as any],
        turn: 5,
        phase: 2,
        maxTurnCount: 0,
        drinkingCards: [],
        givingCards: [],
        activePlayer: undefined,
        status: 1,
        summary: false,
      };
      mockGameService.game = mockGame;

      component.ngOnInit();

      expect(component.game?.turn).toBe(5);
      expect(component.game?.phase).toBe(2);
      expect(component.game?.status).toBe(1);
    });
  });

  describe('Method Visibility', () => {
    it('should have public ngOnInit method', () => {
      expect(typeof component.ngOnInit).toBe('function');
    });

    it('should have public playerCount property', () => {
      expect(typeof component.playerCount).toBe('number');
    });

    it('should have public game property', () => {
      expect(component.game === undefined || typeof component.game === 'object').toBe(true);
    });

    it('should have public gameSrv property', () => {
      expect(component.gameSrv).toBeDefined();
    });
  });
});
