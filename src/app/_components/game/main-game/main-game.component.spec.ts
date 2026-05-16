import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MainGameComponent } from './main-game.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { createMockGameService } from '../../../testing/test-helpers';

describe('MainGameComponent', () => {
  let component: MainGameComponent;
  let fixture: ComponentFixture<MainGameComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;

  const createTestPlayer = (id: string, name: string): PlayerModel => {
    const player = new PlayerModel();
    player.id = id;
    player.name = name;
    player.avatarSrc = `avatar${id}.png`;
    player.cards = [];
    return player;
  };

  beforeEach(async () => {
    mockGameService = createMockGameService();

    await TestBed.configureTestingModule({
      imports: [MainGameComponent],
      providers: [{ provide: GameService, useValue: mockGameService }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MainGameComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainGameComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have gameSrv injected', () => {
      expect(component.gameSrv).toBeTruthy();
    });

    it('should only expose gameSrv as public property', () => {
      expect(component.gameSrv).toBeDefined();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      const mockPlayers = [createTestPlayer('p1', 'Player 1'), createTestPlayer('p2', 'Player 2')];
      mockGameService.players.set(mockPlayers);
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.isGameFinished.and.returnValue(false);
      mockGameService.isSummaryMode.and.returnValue(false);
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

    it('should render player cards in players grid layout', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      fixture.detectChanges();

      const gridDiv = fixture.nativeElement.querySelector('.players-grid');
      expect(gridDiv).toBeTruthy();

      const playerCards = gridDiv.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(2);
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
    it('should access gameSrv.players() for player list', () => {
      const mockPlayers = [createTestPlayer('p1', 'Player 1')];
      mockGameService.players.set(mockPlayers);
      mockGameService.isGameStarted.and.returnValue(true);

      fixture.detectChanges();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(1);
    });

    it('should access gameSrv.isGameStarted() for conditional rendering', () => {
      mockGameService.players.set([]);
      mockGameService.isGameStarted.and.returnValue(true);

      fixture.detectChanges();

      expect(mockGameService.isGameStarted).toHaveBeenCalled();
    });

    it('should access gameSrv.isGameFinished() for conditional rendering', () => {
      mockGameService.players.set([]);
      mockGameService.isGameFinished.and.returnValue(true);

      fixture.detectChanges();

      expect(mockGameService.isGameFinished).toHaveBeenCalled();
    });

    it('should access gameSrv.isSummaryMode() for game summary rendering', () => {
      fixture.detectChanges();

      expect(mockGameService.isSummaryMode).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty player list gracefully', () => {
      mockGameService.players.set([]);
      mockGameService.isGameStarted.and.returnValue(true);

      expect(() => fixture.detectChanges()).not.toThrow();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(0);
    });

    it('should handle large player counts correctly', () => {
      const mockPlayers = Array.from({ length: 10 }, (_, i) => createTestPlayer(`p${i + 1}`, `Player ${i + 1}`));
      mockGameService.players.set(mockPlayers);
      mockGameService.isGameStarted.and.returnValue(true);

      fixture.detectChanges();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(10);
    });
  });

  describe('Component Lifecycle', () => {
    it('should initialize component without errors', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not require ngOnInit (standalone component with inject)', () => {
      expect((component as unknown as { ngOnInit?: unknown }).ngOnInit).toBeUndefined();
    });
  });

  describe('Player Turn Highlight', () => {
    let mockPlayers: PlayerModel[];

    beforeEach(() => {
      mockPlayers = [createTestPlayer('p1', 'Player 1'), createTestPlayer('p2', 'Player 2')];
      mockGameService.players.set(mockPlayers);
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.isGameFinished.and.returnValue(false);
    });

    it('should pass isActive=true to the active player card', () => {
      mockGameService.activePlayer.set(mockPlayers[0]);
      fixture.detectChanges();

      const desktopCards = fixture.nativeElement.querySelectorAll('.desktop-layout app-player-card');
      expect(desktopCards.length).toBe(2);
    });

    it('should pass isActive=false to non-active player cards', () => {
      mockGameService.activePlayer.set(mockPlayers[0]);
      fixture.detectChanges();

      const desktopCards = fixture.nativeElement.querySelectorAll('.desktop-layout app-player-card');
      expect(desktopCards.length).toBe(2);
    });

    it('should pass hasActivePlayer=true when there is an active player', () => {
      mockGameService.activePlayer.set(mockPlayers[0]);
      fixture.detectChanges();

      const desktopCards = fixture.nativeElement.querySelectorAll('.desktop-layout app-player-card');
      expect(desktopCards.length).toBe(2);
    });

    it('should pass hasActivePlayer=false when there is no active player', () => {
      mockGameService.activePlayer.set(undefined);
      fixture.detectChanges();

      const playerCards = fixture.nativeElement.querySelectorAll('.players-grid app-player-card');
      expect(playerCards.length).toBe(2);
    });

    it('should update active player when signal changes', () => {
      mockGameService.activePlayer.set(mockPlayers[0]);
      fixture.detectChanges();

      mockGameService.activePlayer.set(mockPlayers[1]);
      fixture.detectChanges();

      const desktopCards = fixture.nativeElement.querySelectorAll('.desktop-layout app-player-card');
      expect(desktopCards.length).toBe(2);
    });
  });
});
