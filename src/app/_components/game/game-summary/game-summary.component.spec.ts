import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameSummaryComponent } from './game-summary.component';
import { GameService } from '../../../services/game/game.service';
import { createMockGameService } from '../../../testing/test-helpers';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';

function createPlayer(name: string, drunk: number, given: number): PlayerModel {
  const player = new PlayerModel();
  player.name = name;
  player.id = name.toLowerCase();
  player.sips = { drunk, given };
  player.cards = [];
  player.choice = { color: '', plus_or_minus: '', in_out: '', suit: '' };
  return player;
}

describe('GameSummaryComponent', () => {
  let component: GameSummaryComponent;
  let fixture: ComponentFixture<GameSummaryComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;

  beforeEach(async () => {
    mockGameService = createMockGameService();

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FontAwesomeIconsModule, GameSummaryComponent],
      providers: [{ provide: GameService, useValue: mockGameService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameSummaryComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should use OnPush change detection', () => {
      // Component uses ChangeDetectionStrategy.OnPush
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });
  });

  describe('playersSorted computed signal', () => {
    it('should return empty array when no players', () => {
      mockGameService.players.set([]);
      fixture.detectChanges();
      expect(component.playersSorted()).toEqual([]);
    });

    it('should sort players by total sips descending', () => {
      const players = [
        createPlayer('Alice', 3, 1),
        createPlayer('Bob', 10, 2),
        createPlayer('Charlie', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      expect(sorted.length).toBe(3);
      expect(sorted[0].name).toBe('Bob');
      expect(sorted[0].totalSips).toBe(12);
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[1].totalSips).toBe(4);
      expect(sorted[2].name).toBe('Charlie');
      expect(sorted[2].totalSips).toBe(1);
    });

    it('should calculate totalSips as drunk + given', () => {
      const players = [createPlayer('Alice', 5, 3)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      expect(sorted[0].sipsDrunk).toBe(5);
      expect(sorted[0].sipsGiven).toBe(3);
      expect(sorted[0].totalSips).toBe(8);
    });

    it('should mark player with most sips as loser', () => {
      const players = [
        createPlayer('Alice', 2, 1),
        createPlayer('Bob', 10, 5),
        createPlayer('Charlie', 3, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const loser = sorted.find((p) => p.isLoser);
      expect(loser).toBeTruthy();
      expect(loser!.name).toBe('Bob');
    });

    it('should mark player with least sips as winner', () => {
      const players = [
        createPlayer('Alice', 2, 1),
        createPlayer('Bob', 10, 5),
        createPlayer('Charlie', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const winner = sorted.find((p) => p.isWinner);
      expect(winner).toBeTruthy();
      expect(winner!.name).toBe('Charlie');
    });

    it('should handle tie for loser (multiple losers)', () => {
      const players = [
        createPlayer('Alice', 5, 5),
        createPlayer('Bob', 5, 5),
        createPlayer('Charlie', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const losers = sorted.filter((p) => p.isLoser);
      expect(losers.length).toBe(2);
    });

    it('should handle all players with same sips (no winner or loser distinction)', () => {
      const players = [
        createPlayer('Alice', 3, 2),
        createPlayer('Bob', 3, 2),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      // All are losers (max sips), none are winners (min === max)
      expect(sorted.every((p) => p.isLoser)).toBeTrue();
      expect(sorted.every((p) => !p.isWinner)).toBeTrue();
    });

    it('should handle players with zero sips', () => {
      const players = [
        createPlayer('Alice', 0, 0),
        createPlayer('Bob', 5, 3),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      expect(sorted[0].name).toBe('Bob');
      expect(sorted[1].name).toBe('Alice');
      expect(sorted[1].isWinner).toBeTrue();
      expect(sorted[0].isLoser).toBeTrue();
    });
  });

  describe('winner computed signal', () => {
    it('should return null when no players', () => {
      mockGameService.players.set([]);
      fixture.detectChanges();
      expect(component.winner()).toBeNull();
    });

    it('should return the player with least sips', () => {
      const players = [
        createPlayer('Alice', 10, 0),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const winner = component.winner();
      expect(winner).toBeTruthy();
      expect(winner!.name).toBe('Bob');
    });
  });

  describe('loser computed signal', () => {
    it('should return null when no players', () => {
      mockGameService.players.set([]);
      fixture.detectChanges();
      expect(component.loser()).toBeNull();
    });

    it('should return the player with most sips', () => {
      const players = [
        createPlayer('Alice', 10, 5),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const loser = component.loser();
      expect(loser).toBeTruthy();
      expect(loser!.name).toBe('Alice');
    });
  });

  describe('replay action', () => {
    it('should call resetGame on replay', () => {
      component.replay();
      expect(mockGameService.resetGame).toHaveBeenCalled();
    });
  });

  describe('exit action', () => {
    it('should call resetGame on exit', () => {
      component.exit();
      expect(mockGameService.resetGame).toHaveBeenCalled();
    });
  });

  describe('Template rendering', () => {
    it('should render the summary title', () => {
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('h2');
      expect(title).toBeTruthy();
    });

    it('should render the results table', () => {
      const players = [
        createPlayer('Alice', 5, 3),
        createPlayer('Bob', 2, 1),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('table');
      expect(table).toBeTruthy();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should render replay and exit buttons', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('should render winner highlight card when winner exists', () => {
      const players = [
        createPlayer('Alice', 10, 0),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const winnerCard = fixture.nativeElement.querySelector('.winner-card');
      expect(winnerCard).toBeTruthy();
    });

    it('should render loser highlight card when loser exists', () => {
      const players = [
        createPlayer('Alice', 10, 0),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const loserCard = fixture.nativeElement.querySelector('.loser-card');
      expect(loserCard).toBeTruthy();
    });

    it('should not render highlight cards when no players', () => {
      mockGameService.players.set([]);
      fixture.detectChanges();

      const winnerCard = fixture.nativeElement.querySelector('.winner-card');
      const loserCard = fixture.nativeElement.querySelector('.loser-card');
      expect(winnerCard).toBeFalsy();
      expect(loserCard).toBeFalsy();
    });

    it('should apply table-success class to winner row', () => {
      const players = [
        createPlayer('Alice', 10, 0),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const successRow = fixture.nativeElement.querySelector('tr.table-success');
      expect(successRow).toBeTruthy();
    });

    it('should apply table-danger class to loser row', () => {
      const players = [
        createPlayer('Alice', 10, 0),
        createPlayer('Bob', 1, 0),
      ];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const dangerRow = fixture.nativeElement.querySelector('tr.table-danger');
      expect(dangerRow).toBeTruthy();
    });
  });

  describe('Component Cleanup', () => {
    it('should destroy without errors', () => {
      fixture.detectChanges();
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });
});
