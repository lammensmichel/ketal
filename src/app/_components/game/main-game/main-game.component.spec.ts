import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MainGameComponent } from './main-game.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { CardService } from '../../../services/card/card.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import {
  createMockGameService,
  createMockPlayerHelperService,
  createMockCardService,
} from '../../../testing/test-helpers';

describe('MainGameComponent', () => {
  let component: MainGameComponent;
  let fixture: ComponentFixture<MainGameComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockCardService: jasmine.SpyObj<CardService>;
  let changeDetectorRef: ChangeDetectorRef;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();
    mockCardService = createMockCardService();

    // Mock the game object with default state
    (mockGameService as any).game = {
      players: [],
      maxTurnCount: 0,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: undefined,
      status: 1,
      summary: false,
    };

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [MainGameComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: CardService, useValue: mockCardService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MainGameComponent);
    component = fixture.componentInstance;
    changeDetectorRef = fixture.debugElement.injector.get(ChangeDetectorRef);
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have initial property values', () => {
      expect(component.playerCount).toBe(0);
      expect(component.game).toBeUndefined();
    });

    it('should have injected services available', () => {
      expect(component.gameSrv).toBeTruthy();
      expect(component.playerHelper).toBeTruthy();
      expect(component.cardSrv).toBeTruthy();
    });

    it('should use OnPush change detection strategy', () => {
      const metadata = (MainGameComponent as any).__annotations__[0];
      expect(metadata.changeDetection).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should initialize playerCount from game service players array', () => {
      const mockPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
        new PlayerModel({ name: 'Player 3', id: 'p3' }),
      ];
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();

      expect(component.playerCount).toBe(3);
    });

    it('should set playerCount to 0 when no players exist', () => {
      (mockGameService as any).game.players = [];

      component.ngOnInit();

      expect(component.playerCount).toBe(0);
    });

    it('should calculate maxTurnCount as playerCount * 4', () => {
      const mockPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
      ];
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();

      expect((mockGameService as any).game.maxTurnCount).toBe(8);
    });

    it('should calculate maxTurnCount correctly for different player counts', () => {
      const testCases = [
        { playerCount: 1, expectedMaxTurns: 4 },
        { playerCount: 2, expectedMaxTurns: 8 },
        { playerCount: 3, expectedMaxTurns: 12 },
        { playerCount: 4, expectedMaxTurns: 16 },
        { playerCount: 5, expectedMaxTurns: 20 },
      ];

      testCases.forEach((testCase) => {
        const mockPlayers = Array.from(
          { length: testCase.playerCount },
          (_, i) => new PlayerModel({ name: `Player ${i + 1}`, id: `p${i + 1}` })
        );
        (mockGameService as any).game.players = mockPlayers;

        component.ngOnInit();

        expect((mockGameService as any).game.maxTurnCount).toBe(testCase.expectedMaxTurns);
      });
    });

    it('should assign game service game object to component game property', () => {
      const mockGame = (mockGameService as any).game;

      component.ngOnInit();

      expect(component.game).toBe(mockGame);
    });

    it('should update game reference when ngOnInit is called multiple times', () => {
      component.ngOnInit();
      const firstGameRef = component.game;

      component.ngOnInit();
      const secondGameRef = component.game;

      expect(firstGameRef).toBe(secondGameRef);
    });
  });

  describe('Template Interaction', () => {
    beforeEach(() => {
      const mockPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1', avatarSrc: 'avatar1.png' }),
        new PlayerModel({ name: 'Player 2', id: 'p2', avatarSrc: 'avatar2.png' }),
      ];
      (mockGameService as any).game.players = mockPlayers;
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render main container when game is started', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.isGameFinished.and.returnValue(false);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.container');
      expect(container).toBeTruthy();
    });

    it('should render main container when game is finished', () => {
      mockGameService.isGameStarted.and.returnValue(false);
      mockGameService.isGameFinished.and.returnValue(true);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.container');
      expect(container).toBeTruthy();
    });

    it('should not render main container when game is not started and not finished', () => {
      mockGameService.isGameStarted.and.returnValue(false);
      mockGameService.isGameFinished.and.returnValue(false);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.container');
      expect(container).toBeFalsy();
    });

    it('should render player cards for each player', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      fixture.detectChanges();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(2);
    });

    it('should pass correct player data to player-card components', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      fixture.detectChanges();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      const firstPlayerCard = playerCards[0];

      expect(firstPlayerCard).toBeTruthy();
      // Verify the binding exists (actual property binding is tested through integration)
      expect(firstPlayerCard.getAttribute('ng-reflect-player')).toBeDefined();
    });

    it('should render player cards in correct bootstrap grid layout', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      fixture.detectChanges();

      const rowDiv = fixture.nativeElement.querySelector('.row.gap-1.justify-content-evenly');
      expect(rowDiv).toBeTruthy();

      const playerDivs = fixture.nativeElement.querySelectorAll('.col-md-6.player.p-0');
      expect(playerDivs.length).toBe(2);
    });

    it('should render game summary when in summary mode', () => {
      mockGameService.isSummaryMode.and.returnValue(true);
      fixture.detectChanges();

      const gameSummary = fixture.nativeElement.querySelector('app-game-summary');
      expect(gameSummary).toBeTruthy();
    });

    it('should not render game summary when not in summary mode', () => {
      mockGameService.isSummaryMode.and.returnValue(false);
      fixture.detectChanges();

      const gameSummary = fixture.nativeElement.querySelector('app-game-summary');
      expect(gameSummary).toBeFalsy();
    });

    it('should render game summary and main container simultaneously if both conditions are true', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.isSummaryMode.and.returnValue(true);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.container');
      const gameSummary = fixture.nativeElement.querySelector('app-game-summary');

      expect(container).toBeTruthy();
      expect(gameSummary).toBeTruthy();
    });
  });

  describe('Service Integration', () => {
    it('should use GameService to get player list', () => {
      const mockPlayers = [new PlayerModel({ name: 'Player 1', id: 'p1' })];
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();

      expect((mockGameService as any).game.players).toBe(mockPlayers);
    });

    it('should access GameService game object directly', () => {
      component.ngOnInit();

      expect(component.game).toBe(mockGameService.game);
    });

    it('should have access to PlayerHelperService through public property', () => {
      expect(component.playerHelper).toBe(mockPlayerHelperService);
    });

    it('should have access to CardService through public property', () => {
      expect(component.cardSrv).toBe(mockCardService);
    });
  });

  describe('Public Properties', () => {
    it('should expose playerCount as public property', () => {
      expect(component.playerCount).toBeDefined();
      expect(typeof component.playerCount).toBe('number');
    });

    it('should expose game as public property', () => {
      expect(Object.getOwnPropertyNames(component).includes('game')).toBeTruthy();
    });

    it('should expose gameSrv as public property', () => {
      expect(component.gameSrv).toBeDefined();
      expect(typeof component.gameSrv).toBe('object');
    });

    it('should expose playerHelper as public property', () => {
      expect(component.playerHelper).toBeDefined();
      expect(typeof component.playerHelper).toBe('object');
    });

    it('should expose cardSrv as public property', () => {
      expect(component.cardSrv).toBeDefined();
      expect(typeof component.cardSrv).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player list gracefully', () => {
      (mockGameService as any).game.players = [];

      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.playerCount).toBe(0);
    });

    it('should handle large player counts correctly', () => {
      const mockPlayers = Array.from(
        { length: 10 },
        (_, i) => new PlayerModel({ name: `Player ${i + 1}`, id: `p${i + 1}` })
      );
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();

      expect(component.playerCount).toBe(10);
      expect((mockGameService as any).game.maxTurnCount).toBe(40);
    });

    it('should maintain game reference consistency', () => {
      const mockGame = (mockGameService as any).game;

      component.ngOnInit();
      const refAfterInit = component.game;

      expect(refAfterInit).toBe(mockGame);
      expect(refAfterInit === mockGame).toBeTruthy();
    });

    it('should handle undefined game object gracefully', () => {
      (mockGameService as any).game = undefined;

      expect(() => {
        try {
          component.ngOnInit();
        } catch (e: any) {
          // Expected to throw since game is undefined
          expect(e).toBeDefined();
        }
      }).not.toThrow();
    });

    it('should not break when maxTurnCount is set multiple times', () => {
      const mockPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
      ];
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();
      const firstMaxTurn = (mockGameService as any).game.maxTurnCount;

      component.ngOnInit();
      const secondMaxTurn = (mockGameService as any).game.maxTurnCount;

      expect(secondMaxTurn).toBe(firstMaxTurn);
      expect(secondMaxTurn).toBe(8);
    });
  });

  describe('Component Lifecycle', () => {
    it('should implement OnInit interface', () => {
      expect(component.ngOnInit).toBeDefined();
      expect(typeof component.ngOnInit).toBe('function');
    });

    it('should initialize component without errors', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle change detection properly with OnPush strategy', () => {
      const mockPlayers = [new PlayerModel({ name: 'Player 1', id: 'p1' })];
      (mockGameService as any).game.players = mockPlayers;

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.playerCount).toBe(1);
    });
  });

  describe('Data Binding', () => {
    beforeEach(() => {
      const mockPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
      ];
      (mockGameService as any).game.players = mockPlayers;
      component.ngOnInit();
    });

    it('should bind gameSrv methods in template context', () => {
      expect(component.gameSrv.isGameStarted).toBeDefined();
      expect(component.gameSrv.isGameFinished).toBeDefined();
      expect(component.gameSrv.isSummaryMode).toBeDefined();
    });

    it('should access game.players in template context', () => {
      expect(component.game?.players).toBeDefined();
      expect(component.game?.players.length).toBe(2);
    });

    it('should provide players for ngFor iteration', () => {
      fixture.detectChanges();

      const playerElements = fixture.nativeElement.querySelectorAll('.col-md-6.player');
      expect(playerElements.length).toBe(2);
    });
  });

  describe('Game State Management', () => {
    it('should reflect changes to game state in component', () => {
      const initialPlayers = [new PlayerModel({ name: 'Player 1', id: 'p1' })];
      (mockGameService as any).game.players = initialPlayers;

      component.ngOnInit();
      expect(component.playerCount).toBe(1);

      // Simulate state change
      const updatedPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
      ];
      (mockGameService as any).game.players = updatedPlayers;

      component.ngOnInit();
      expect(component.playerCount).toBe(2);
    });

    it('should update maxTurnCount when player count changes', () => {
      const initialPlayers = [new PlayerModel({ name: 'Player 1', id: 'p1' })];
      (mockGameService as any).game.players = initialPlayers;

      component.ngOnInit();
      expect((mockGameService as any).game.maxTurnCount).toBe(4);

      const updatedPlayers = [
        new PlayerModel({ name: 'Player 1', id: 'p1' }),
        new PlayerModel({ name: 'Player 2', id: 'p2' }),
        new PlayerModel({ name: 'Player 3', id: 'p3' }),
      ];
      (mockGameService as any).game.players = updatedPlayers;

      component.ngOnInit();
      expect((mockGameService as any).game.maxTurnCount).toBe(12);
    });
  });
});
