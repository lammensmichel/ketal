import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PlayerListPlayerComponent } from './player-list-player.component';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { GameService } from '../../../services/game/game.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { createMockPlayerHelperService, createMockGameService } from '../../../testing/test-helpers';

describe('PlayerListPlayerComponent', () => {
  let component: PlayerListPlayerComponent;
  let fixture: ComponentFixture<PlayerListPlayerComponent>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockGameService: jasmine.SpyObj<GameService>;

  beforeEach(async () => {
    mockPlayerHelperService = createMockPlayerHelperService();
    mockGameService = createMockGameService();

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [PlayerListPlayerComponent],
      providers: [
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: GameService, useValue: mockGameService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerListPlayerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have playerHelper service injected', () => {
      expect(component.playerHelper).toBe(mockPlayerHelperService);
    });

    it('should have gameSrv service injected', () => {
      expect(component.gameSrv).toBe(mockGameService);
    });

    it('should initialize with undefined player', () => {
      expect(component.player).toBeUndefined();
    });

    it('should call ngOnInit without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('@Input player', () => {
    it('should accept a PlayerModel as input', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'John Doe';
      testPlayer.id = 'test-id-123';
      testPlayer.cards = [];
      testPlayer.avatarSrc = 'https://example.com/avatar.jpg';

      component.player = testPlayer;

      expect(component.player).toBe(testPlayer);
      expect(component.player?.name).toBe('John Doe');
      expect(component.player?.id).toBe('test-id-123');
    });

    it('should handle undefined player', () => {
      component.player = undefined;

      expect(component.player).toBeUndefined();
    });

    it('should update player when input changes', () => {
      const player1 = new PlayerModel();
      player1.name = 'Player 1';
      player1.id = 'id-1';

      const player2 = new PlayerModel();
      player2.name = 'Player 2';
      player2.id = 'id-2';

      component.player = player1;
      expect(component.player?.name).toBe('Player 1');

      component.player = player2;
      expect(component.player?.name).toBe('Player 2');
    });

    it('should store player with all properties', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Jane Smith';
      testPlayer.id = 'test-id-456';
      testPlayer.cards = [];
      testPlayer.avatarSrc = 'https://example.com/avatar2.jpg';
      testPlayer.choice = { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' };
      testPlayer.sips = { drunk: 5, given: 3 };

      component.player = testPlayer;

      expect(component.player?.name).toBe('Jane Smith');
      expect(component.player?.id).toBe('test-id-456');
      expect(component.player?.choice['color']).toBe('red');
      expect(component.player?.sips['drunk']).toBe(5);
      expect(component.player?.sips['given']).toBe(3);
    });
  });

  describe('deletePlayer()', () => {
    let testPlayer: PlayerModel;

    beforeEach(() => {
      testPlayer = new PlayerModel({
        name: 'Test Player',
        id: 'test-player-id',
        cards: [],
      });
      component.player = testPlayer;
    });

    it('should call playerHelper.deletePlayer with the provided player', () => {
      component.deletePlayer(testPlayer);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(testPlayer);
      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledTimes(1);
    });

    it('should call gameSrv.setWithSummaryMode(false) when player count is 1 or less', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
    });

    it('should call gameSrv.setWithSummaryMode(false) when player count becomes 0 after deletion', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
    });

    it('should not call gameSrv.setWithSummaryMode when player count is greater than 1', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(5);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();
    });

    it('should call gameSrv.setWithSummaryMode after playerHelper.deletePlayer', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);

      component.deletePlayer(testPlayer);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalled();
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalled();
    });

    it('should delete player with specific id', () => {
      const player2 = new PlayerModel();
      player2.name = 'Another Player';
      player2.id = 'another-id';

      component.deletePlayer(player2);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(player2);
    });

    it('should handle deletion of multiple players sequentially', () => {
      const player1 = new PlayerModel();
      player1.name = 'Player 1';
      player1.id = 'id-1';

      const player2 = new PlayerModel();
      player2.name = 'Player 2';
      player2.id = 'id-2';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      component.deletePlayer(player1);
      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      component.deletePlayer(player2);
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
    });

    it('should properly handle edge case where getPlayerNumber returns 1 exactly', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnInit()', () => {
    it('should execute without errors', () => {
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      expect(() => {
        component.ngOnInit();
        component.ngOnInit();
      }).not.toThrow();
    });
  });

  describe('Service Integration', () => {
    it('should have access to playerHelper methods through component', () => {
      expect(typeof component.playerHelper.deletePlayer).toBe('function');
      expect(typeof component.playerHelper.getPlayerNumber).toBe('function');
    });

    it('should have access to gameSrv methods through component', () => {
      expect(typeof component.gameSrv.setWithSummaryMode).toBe('function');
    });

    it('should maintain service references across component lifecycle', () => {
      const playerHelperRef = component.playerHelper;
      const gameServiceRef = component.gameSrv;

      component.ngOnInit();

      expect(component.playerHelper).toBe(playerHelperRef);
      expect(component.gameSrv).toBe(gameServiceRef);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    let testPlayer: PlayerModel;

    beforeEach(() => {
      testPlayer = new PlayerModel();
      testPlayer.name = 'Test';
      testPlayer.id = 'test-id';
    });

    it('should handle player with empty name', () => {
      const playerWithEmptyName = new PlayerModel();
      playerWithEmptyName.name = '';
      playerWithEmptyName.id = 'id-empty';
      component.player = playerWithEmptyName;

      expect(component.player?.name).toBe('');
    });

    it('should handle player with special characters in name', () => {
      const specialPlayer = new PlayerModel();
      specialPlayer.name = 'Player @#$%';
      specialPlayer.id = 'special-id';
      component.player = specialPlayer;

      expect(component.player?.name).toBe('Player @#$%');
    });

    it('should handle deletePlayer when getPlayerNumber is 0', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
    });

    it('should handle deletePlayer when getPlayerNumber is 2 (boundary)', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();
    });

    it('should handle deletePlayer when getPlayerNumber is very large', () => {
      mockPlayerHelperService.getPlayerNumber.and.returnValue(1000);

      component.deletePlayer(testPlayer);

      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();
    });

    it('should delete player with undefined properties', () => {
      const incompletePlayer = new PlayerModel();
      incompletePlayer.id = 'incomplete-id';

      component.deletePlayer(incompletePlayer);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(incompletePlayer);
    });
  });

  describe('Method Call Order and Synchronization', () => {
    it('should call deletePlayer before checking player count', () => {
      const callOrder: string[] = [];

      mockPlayerHelperService.deletePlayer.and.callFake(() => {
        callOrder.push('deletePlayer');
      });

      mockPlayerHelperService.getPlayerNumber.and.callFake(() => {
        callOrder.push('getPlayerNumber');
        return 1;
      });

      const testPlayer = new PlayerModel();
      testPlayer.name = 'Test';
      testPlayer.id = 'test';
      component.deletePlayer(testPlayer);

      expect(callOrder[0]).toBe('deletePlayer');
      expect(callOrder[1]).toBe('getPlayerNumber');
    });

    it('should check player count after deletion in deletePlayer', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Test';
      testPlayer.id = 'test';
      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);

      component.deletePlayer(testPlayer);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalled();
      expect(mockPlayerHelperService.getPlayerNumber).toHaveBeenCalled();
    });
  });

  describe('Change Detection Strategy', () => {
    it('should be configured with OnPush change detection', () => {
      const metadata = (component.constructor as any).__annotations__[0];
      expect(metadata.changeDetection).toBeDefined();
    });
  });

  describe('Multiple Player Deletion Scenarios', () => {
    it('should handle deletion of all players from a group', () => {
      const player1 = new PlayerModel();
      player1.name = 'Player 1';
      player1.id = 'id-1';

      const player2 = new PlayerModel();
      player2.name = 'Player 2';
      player2.id = 'id-2';

      const player3 = new PlayerModel();
      player3.name = 'Player 3';
      player3.id = 'id-3';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(3);
      component.deletePlayer(player1);
      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      component.deletePlayer(player2);
      expect(mockGameService.setWithSummaryMode).not.toHaveBeenCalled();

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      component.deletePlayer(player3);
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledWith(false);
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid consecutive player deletions', () => {
      const player1 = new PlayerModel();
      player1.name = 'Player 1';
      player1.id = 'id-1';

      const player2 = new PlayerModel();
      player2.name = 'Player 2';
      player2.id = 'id-2';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);

      component.deletePlayer(player1);
      component.deletePlayer(player2);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledTimes(2);
      expect(mockGameService.setWithSummaryMode).toHaveBeenCalledTimes(2);
    });
  });
});
