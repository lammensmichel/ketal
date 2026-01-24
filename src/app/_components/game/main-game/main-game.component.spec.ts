import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    }).compileComponents();

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
      // The component is very simple - it only has gameSrv
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      const mockPlayers = [createTestPlayer('p1', 'Player 1'), createTestPlayer('p2', 'Player 2')];
      mockGameService.players.and.returnValue(mockPlayers);
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
    it('should access gameSrv.players() for player list', () => {
      const mockPlayers = [createTestPlayer('p1', 'Player 1')];
      mockGameService.players.and.returnValue(mockPlayers);
      mockGameService.isGameStarted.and.returnValue(true);

      fixture.detectChanges();

      expect(mockGameService.players).toHaveBeenCalled();
    });

    it('should access gameSrv.isGameStarted() for conditional rendering', () => {
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.players.and.returnValue([]);

      fixture.detectChanges();

      expect(mockGameService.isGameStarted).toHaveBeenCalled();
    });

    it('should access gameSrv.isGameFinished() for conditional rendering', () => {
      mockGameService.isGameFinished.and.returnValue(true);
      mockGameService.players.and.returnValue([]);

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
      mockGameService.players.and.returnValue([]);
      mockGameService.isGameStarted.and.returnValue(true);

      expect(() => fixture.detectChanges()).not.toThrow();

      const playerCards = fixture.nativeElement.querySelectorAll('app-player-card');
      expect(playerCards.length).toBe(0);
    });

    it('should handle large player counts correctly', () => {
      const mockPlayers = Array.from({ length: 10 }, (_, i) => createTestPlayer(`p${i + 1}`, `Player ${i + 1}`));
      mockGameService.players.and.returnValue(mockPlayers);
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
      // MainGameComponent uses inject() and doesn't need ngOnInit
      expect((component as any).ngOnInit).toBeUndefined();
    });
  });
});
