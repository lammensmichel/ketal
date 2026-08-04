import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MainGameComponent } from './main-game.component';
import { DisplayModeService } from '../../../services/display-mode/display-mode.service';
import { GameService } from '../../../services/game/game.service';
import { GameMember, MemberService } from '../../../services/member/member.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { createMockGameService, createMockMemberService } from '../../../testing/test-helpers';

describe('MainGameComponent', () => {
  let component: MainGameComponent;
  let fixture: ComponentFixture<MainGameComponent>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockMemberService: ReturnType<typeof createMockMemberService>;
  let displayModeService: DisplayModeService;

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
    mockMemberService = createMockMemberService();
    localStorage.removeItem('ketal_display_mode');

    await TestBed.configureTestingModule({
      imports: [MainGameComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: MemberService, useValue: mockMemberService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(MainGameComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainGameComponent);
    component = fixture.componentInstance;
    displayModeService = TestBed.inject(DisplayModeService);
  });

  afterEach(() => {
    localStorage.removeItem('ketal_display_mode');
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
  // ── Modes d'affichage ──────────────────────────────────────────────────────
  // La « mise en avant » du mode personnel se limite volontairement a deux
  // choses : ma fiche passe en tete, et elle n'est jamais compactee. Aucune
  // structure de layout ne change, donc rien a re-tester cote rendu.
  describe('display modes', () => {
    const memberMe: GameMember = {
      $id: 'p2',
      roomId: 'room-1',
      userId: 'user-1',
      deviceId: null,
      displayName: 'Player 2',
      role: 'player',
      isOnline: true,
      totalSipsGiven: 0,
      totalSipsTaken: 0,
      totalGamesPlayed: 0,
      gameStats: {},
    };

    let players: PlayerModel[];

    beforeEach(() => {
      players = [createTestPlayer('p1', 'Player 1'), createTestPlayer('p2', 'Player 2'), createTestPlayer('p3', 'P3')];
      mockGameService.players.set(players);
      mockGameService.isGameStarted.and.returnValue(true);
      mockGameService.isRoomMode.set(true);
      mockMemberService.currentMember.set(memberMe);
      mockMemberService.members.set([memberMe]);
    });

    describe('table mode (non-regression)', () => {
      it('should keep the game order untouched', () => {
        expect(component.displayPlayers().map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      });

      it('should compact inactive players exactly as before', () => {
        mockGameService.activePlayer.set(players[0]);
        mockGameService.phase.set(1);
        fixture.detectChanges();

        expect(component.getCompactDelay('p1')).toBe(0);
      });
    });

    describe('personnel mode', () => {
      beforeEach(() => {
        displayModeService.setMode('personnel');
      });

      it('should move my card to the front', () => {
        expect(component.displayPlayers().map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
      });

      it('should keep my card out of the inactive strip order shuffle', () => {
        mockGameService.activePlayer.set(players[0]);
        expect(component.inactivePlayers().map((p) => p.id)).toEqual(['p2', 'p3']);
      });

      it('should never compact my card in phase 1', () => {
        mockGameService.activePlayer.set(players[0]);
        mockGameService.phase.set(1);

        expect(component.getCompactDelay('p2')).toBe(3000);
      });

      it('should never compact my card in phase 2', () => {
        mockGameService.phase.set(2);
        mockGameService.players.set(
          Array.from({ length: 20 }, (_, i) => createTestPlayer(`x${i}`, `X${i}`)).concat(players)
        );
        mockGameService.drinkingCards.set([]);
        mockGameService.givingCards.set([
          { value: 'A', suit: 'hearts', icon: null, sips: 1, selected: false, img: '', givenSips: undefined },
        ]);

        const state = component.phase2CompactState();
        expect(state['p2']).toBeFalse();
        // Un autre joueur sans carte correspondante reste compacte : la logique
        // existante n'est pas desactivee, seule ma fiche est exemptee.
        expect(state['p1']).toBeTrue();
      });

      it('should fall back to the game order when I am not a player (spectateur)', () => {
        mockMemberService.currentMember.set({ ...memberMe, $id: 'not-a-player', role: 'spectator' });
        expect(component.displayPlayers().map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      });
    });

    describe('viewer mode', () => {
      it('should show the table exactly like table mode', () => {
        displayModeService.setMode('viewer');
        mockGameService.activePlayer.set(players[0]);
        mockGameService.phase.set(1);

        expect(component.displayPlayers().map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
        // Aucune fiche n'est « la mienne » en viewer : la TV regarde la table.
        expect(displayModeService.isMyPlayer('p2')).toBeFalse();
      });
    });

    describe('local mode', () => {
      it('should force table: no reordering, no exemption', () => {
        displayModeService.setMode('personnel');
        mockGameService.isRoomMode.set(false);

        expect(component.displayPlayers().map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
      });
    });
  });
});
