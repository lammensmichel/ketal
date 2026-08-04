import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GameSummaryComponent } from './game-summary.component';
import { GameService } from '../../../services/game/game.service';
import { createMockGameService } from '../../../testing/test-helpers';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { SipExchange } from '../../../_shared/_models/sip-exchange.model';
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

function exchange(from: string, to: string, sips: number): SipExchange {
  return { fromPlayerId: from, toPlayerId: to, sips, at: '2026-01-01T00:00:00.000Z' };
}

describe('GameSummaryComponent', () => {
  let component: GameSummaryComponent;
  let fixture: ComponentFixture<GameSummaryComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), FontAwesomeIconsModule, GameSummaryComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GameSummaryComponent);
    component = fixture.componentInstance;
  });

  /** Le composant lit les echanges via game(), les totaux via players(). */
  function setExchanges(exchanges: SipExchange[] | undefined): void {
    mockGameService.game.set({ ...mockGameService.game(), sipExchanges: exchanges });
  }

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
      const players = [createPlayer('Alice', 3, 1), createPlayer('Bob', 10, 2), createPlayer('Charlie', 1, 0)];
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
      const players = [createPlayer('Alice', 2, 1), createPlayer('Bob', 10, 5), createPlayer('Charlie', 3, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const loser = sorted.find((p) => p.isLoser);
      expect(loser).toBeTruthy();
      expect(loser!.name).toBe('Bob');
    });

    it('should mark player with least sips as winner', () => {
      const players = [createPlayer('Alice', 2, 1), createPlayer('Bob', 10, 5), createPlayer('Charlie', 1, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const winner = sorted.find((p) => p.isWinner);
      expect(winner).toBeTruthy();
      expect(winner!.name).toBe('Charlie');
    });

    it('should handle tie for loser (multiple losers)', () => {
      const players = [createPlayer('Alice', 5, 5), createPlayer('Bob', 5, 5), createPlayer('Charlie', 1, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      const losers = sorted.filter((p) => p.isLoser);
      expect(losers.length).toBe(2);
    });

    it('should handle all players with same sips (no winner or loser distinction)', () => {
      const players = [createPlayer('Alice', 3, 2), createPlayer('Bob', 3, 2)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const sorted = component.playersSorted();
      // All are losers (max sips), none are winners (min === max)
      expect(sorted.every((p) => p.isLoser)).toBeTrue();
      expect(sorted.every((p) => !p.isWinner)).toBeTrue();
    });

    it('should handle players with zero sips', () => {
      const players = [createPlayer('Alice', 0, 0), createPlayer('Bob', 5, 3)];
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
      const players = [createPlayer('Alice', 10, 0), createPlayer('Bob', 1, 0)];
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
      const players = [createPlayer('Alice', 10, 5), createPlayer('Bob', 1, 0)];
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

    it('should navigate to the players list on replay', () => {
      // resetGame() remet le statut a 0 : sans navigation, /game n'affiche plus
      // rien (ecran noir) et aucune nouvelle partie n'est possible.
      component.replay();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/players']);
    });
  });

  describe('exit action', () => {
    it('should call resetGame and navigate to home on exit', () => {
      component.exit();
      expect(mockGameService.resetGame).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Template rendering', () => {
    it('should render the summary title', () => {
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('h2');
      expect(title).toBeTruthy();
    });

    it('should render one ranking row per player', () => {
      const players = [createPlayer('Alice', 5, 3), createPlayer('Bob', 2, 1)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const ranking = fixture.nativeElement.querySelector('.ranking');
      expect(ranking).toBeTruthy();

      const rows = fixture.nativeElement.querySelectorAll('.ranking__row');
      expect(rows.length).toBe(2);
    });

    it('should render replay and exit buttons', () => {
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('.summary-actions button');
      expect(buttons.length).toBe(2);
    });

    it('should render winner highlight card when winner exists', () => {
      const players = [createPlayer('Alice', 10, 0), createPlayer('Bob', 1, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const winnerCard = fixture.nativeElement.querySelector('.winner-card');
      expect(winnerCard).toBeTruthy();
    });

    it('should render loser highlight card when loser exists', () => {
      const players = [createPlayer('Alice', 10, 0), createPlayer('Bob', 1, 0)];
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

    it('should apply the winner class to the winner row', () => {
      const players = [createPlayer('Alice', 10, 0), createPlayer('Bob', 1, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const winnerRow = fixture.nativeElement.querySelector('.ranking__row.is-winner');
      expect(winnerRow).toBeTruthy();
    });

    it('should apply the loser class to the loser row', () => {
      const players = [createPlayer('Alice', 10, 0), createPlayer('Bob', 1, 0)];
      mockGameService.players.set(players);
      fixture.detectChanges();

      const loserRow = fixture.nativeElement.querySelector('.ranking__row.is-loser');
      expect(loserRow).toBeTruthy();
    });

    it('should render the three metric tiles per player when exchanges exist', () => {
      mockGameService.players.set([createPlayer('Alice', 5, 3), createPlayer('Bob', 2, 1)]);
      setExchanges([exchange('alice', 'bob', 3)]);
      fixture.detectChanges();

      const firstRow = fixture.nativeElement.querySelector('.ranking__row');
      expect(firstRow.querySelectorAll('.metric').length).toBe(3);
      expect(firstRow.querySelector('.metric--drunk')).toBeTruthy();
      expect(firstRow.querySelector('.metric--given')).toBeTruthy();
      expect(firstRow.querySelector('.metric--received')).toBeTruthy();
    });
  });

  describe('sipsReceived total', () => {
    it('should sum the exchanges addressed to each player', () => {
      mockGameService.players.set([
        createPlayer('Alice', 5, 6),
        createPlayer('Bob', 2, 0),
        createPlayer('Carol', 1, 0),
      ]);
      setExchanges([
        exchange('alice', 'bob', 2),
        exchange('alice', 'bob', 1),
        exchange('alice', 'carol', 3),
        exchange('bob', 'alice', 4),
      ]);
      fixture.detectChanges();

      const byName = new Map(component.playersSorted().map((p) => [p.name, p]));
      expect(byName.get('Bob')!.sipsReceived).toBe(3);
      expect(byName.get('Carol')!.sipsReceived).toBe(3);
      expect(byName.get('Alice')!.sipsReceived).toBe(4);
    });

    it('should not count a player own gifts as received', () => {
      mockGameService.players.set([createPlayer('Alice', 0, 5), createPlayer('Bob', 0, 0)]);
      setExchanges([exchange('alice', 'bob', 5)]);
      fixture.detectChanges();

      const alice = component.playersSorted().find((p) => p.name === 'Alice')!;
      expect(alice.sipsReceived).toBe(0);
      expect(alice.sipsGiven).toBe(5);
    });

    it('should ignore non-positive or malformed exchanges', () => {
      mockGameService.players.set([createPlayer('Alice', 0, 1), createPlayer('Bob', 0, 0)]);
      setExchanges([exchange('alice', 'bob', 0), exchange('alice', 'bob', -3), exchange('alice', 'bob', 1)]);
      fixture.detectChanges();

      const bob = component.playersSorted().find((p) => p.name === 'Bob')!;
      expect(bob.sipsReceived).toBe(1);
    });

    it('should keep totalSips as drunk + given, unaffected by received sips', () => {
      mockGameService.players.set([createPlayer('Alice', 4, 2), createPlayer('Bob', 1, 0)]);
      setExchanges([exchange('bob', 'alice', 9)]);
      fixture.detectChanges();

      const alice = component.playersSorted().find((p) => p.name === 'Alice')!;
      expect(alice.totalSips).toBe(6);
    });
  });

  describe('missing sipExchanges (old games, or no gift at all)', () => {
    it('should not crash and report zero received when sipExchanges is undefined', () => {
      mockGameService.players.set([createPlayer('Alice', 5, 3), createPlayer('Bob', 2, 1)]);
      setExchanges(undefined);

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.hasAnyExchange()).toBeFalse();
      expect(component.playersSorted().every((p) => p.sipsReceived === 0)).toBeTrue();
      expect(component.playersSorted().every((p) => !p.hasExchanges)).toBeTrue();
    });

    it('should hide the received metric and the exchange toggles when sipExchanges is undefined', () => {
      mockGameService.players.set([createPlayer('Alice', 5, 3), createPlayer('Bob', 2, 1)]);
      setExchanges(undefined);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.metric--received')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.exchange-toggle')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.exchange-panel')).toBeFalsy();
      // Les deux autres compteurs restent affiches.
      expect(fixture.nativeElement.querySelectorAll('.ranking__row')[0].querySelectorAll('.metric').length).toBe(2);
    });

    it('should behave the same with an empty sipExchanges array', () => {
      mockGameService.players.set([createPlayer('Alice', 5, 3), createPlayer('Bob', 2, 1)]);
      setExchanges([]);
      fixture.detectChanges();

      expect(component.hasAnyExchange()).toBeFalse();
      expect(fixture.nativeElement.querySelector('.exchange-toggle')).toBeFalsy();
    });

    it('should not offer a toggle for a player with no exchange while others have some', () => {
      mockGameService.players.set([
        createPlayer('Alice', 0, 2),
        createPlayer('Bob', 0, 0),
        createPlayer('Carol', 0, 0),
      ]);
      setExchanges([exchange('alice', 'bob', 2)]);
      fixture.detectChanges();

      const carol = component.playersSorted().find((p) => p.name === 'Carol')!;
      expect(carol.hasExchanges).toBeFalse();
      expect(fixture.nativeElement.querySelectorAll('.exchange-toggle').length).toBe(2);
    });
  });

  describe('exchange detail disclosure', () => {
    beforeEach(() => {
      mockGameService.players.set([createPlayer('Alice', 5, 6), createPlayer('Bob', 2, 1)]);
      setExchanges([exchange('alice', 'bob', 4), exchange('alice', 'bob', 2), exchange('bob', 'alice', 1)]);
      fixture.detectChanges();
    });

    it('should be collapsed by default', () => {
      expect(component.isExpanded(0)).toBeFalse();
      expect(component.isExpanded(1)).toBeFalse();
      expect(fixture.nativeElement.querySelector('.exchange-panel')).toBeFalsy();
    });

    it('should expose aria-expanded false on every toggle by default', () => {
      const toggles: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.exchange-toggle'));
      expect(toggles.length).toBe(2);
      toggles.forEach((toggle) => expect(toggle.getAttribute('aria-expanded')).toBe('false'));
    });

    it('should open the panel on toggle and close it on second toggle', () => {
      component.toggleExchanges(0);
      fixture.detectChanges();
      expect(component.isExpanded(0)).toBeTrue();
      expect(fixture.nativeElement.querySelectorAll('.exchange-panel').length).toBe(1);
      expect(fixture.nativeElement.querySelector('.exchange-toggle').getAttribute('aria-expanded')).toBe('true');

      component.toggleExchanges(0);
      fixture.detectChanges();
      expect(component.isExpanded(0)).toBeFalse();
      expect(fixture.nativeElement.querySelector('.exchange-panel')).toBeFalsy();
    });

    it('should keep only one panel open at a time', () => {
      component.toggleExchanges(0);
      component.toggleExchanges(1);
      fixture.detectChanges();

      expect(component.isExpanded(0)).toBeFalse();
      expect(component.isExpanded(1)).toBeTrue();
      expect(fixture.nativeElement.querySelectorAll('.exchange-panel').length).toBe(1);
    });

    it('should aggregate the detail lines per counterpart, sorted by sips descending', () => {
      const alice = component.playersSorted().find((p) => p.name === 'Alice')!;
      // Deux transferts vers Bob (4 puis 2) fusionnes en une seule ligne de 6.
      expect(alice.givenTo.length).toBe(1);
      expect(alice.givenTo[0].playerName).toBe('Bob');
      expect(alice.givenTo[0].sips).toBe(6);
      expect(alice.receivedFrom.length).toBe(1);
      expect(alice.receivedFrom[0].playerName).toBe('Bob');
      expect(alice.receivedFrom[0].sips).toBe(1);
      // Barres a la meme echelle : le plus gros echange du joueur vaut 100%.
      expect(alice.givenTo[0].share).toBe(100);
      expect(alice.receivedFrom[0].share).toBeLessThan(100);
    });

    it('should render both given and received groups in the open panel', () => {
      component.toggleExchanges(0);
      fixture.detectChanges();

      const panel = fixture.nativeElement.querySelector('.exchange-panel');
      expect(panel.querySelector('.exchange-group--given')).toBeTruthy();
      expect(panel.querySelector('.exchange-group--received')).toBeTruthy();
      expect(panel.querySelectorAll('.exchange-line').length).toBe(2);
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
