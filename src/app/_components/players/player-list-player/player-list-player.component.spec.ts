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
  let mockGameService: ReturnType<typeof createMockGameService>;

  beforeEach(async () => {
    mockPlayerHelperService = createMockPlayerHelperService();
    mockGameService = createMockGameService();

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PlayerListPlayerComponent],
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

    it('should initialize with undefined player', () => {
      expect(component.player).toBeUndefined();
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

    it('should handle player with all properties set', () => {
      const testPlayer = new PlayerModel();
      testPlayer.id = 'full-player-id';
      testPlayer.name = 'Full Player';
      testPlayer.cards = [];
      testPlayer.avatarSrc = 'avatar.png';
      testPlayer.choice = { color: 'red', plus_or_minus: '', in_out: '', suit: '' };
      testPlayer.sips = { drunk: 5, given: 3 };

      component.player = testPlayer;

      expect(component.player?.id).toBe('full-player-id');
      expect(component.player?.name).toBe('Full Player');
      expect(component.player?.cards).toEqual([]);
      expect(component.player?.avatarSrc).toBe('avatar.png');
      expect(component.player?.choice['color']).toBe('red');
      expect(component.player?.sips['drunk']).toBe(5);
    });
  });

  describe('deletePlayer', () => {
    it('should call playerHelper.deletePlayer with the provided player', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Delete Me';
      testPlayer.id = 'delete-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);

      component.deletePlayer(testPlayer);

      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(testPlayer);
    });

    it('should set withSummaryMode to false when player count is 1 or less after deletion', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Last Player';
      testPlayer.id = 'last-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      mockGameService.withSummaryMode.set(true);

      component.deletePlayer(testPlayer);

      expect(mockGameService.withSummaryMode()).toBe(false);
    });

    it('should set withSummaryMode to false when player count becomes 0 after deletion', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Only Player';
      testPlayer.id = 'only-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(0);
      mockGameService.withSummaryMode.set(true);

      component.deletePlayer(testPlayer);

      expect(mockGameService.withSummaryMode()).toBe(false);
    });

    it('should not change withSummaryMode when player count is greater than 1', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'One of Many';
      testPlayer.id = 'many-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(3);
      mockGameService.withSummaryMode.set(true);

      component.deletePlayer(testPlayer);

      expect(mockGameService.withSummaryMode()).toBe(true);
    });

    it('should handle deleting different players', () => {
      const player1 = new PlayerModel();
      player1.name = 'Player 1';
      player1.id = 'id-1';

      const player2 = new PlayerModel();
      player2.name = 'Player 2';
      player2.id = 'id-2';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);

      component.deletePlayer(player1);
      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(player1);

      component.deletePlayer(player2);
      expect(mockPlayerHelperService.deletePlayer).toHaveBeenCalledWith(player2);
    });

    it('should handle deletion boundary case at exactly 1 player', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Boundary Player';
      testPlayer.id = 'boundary-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(1);
      mockGameService.withSummaryMode.set(true);

      component.deletePlayer(testPlayer);

      expect(mockGameService.withSummaryMode()).toBe(false);
    });

    it('should handle deletion boundary case at exactly 2 players', () => {
      const testPlayer = new PlayerModel();
      testPlayer.name = 'Second Player';
      testPlayer.id = 'second-id';

      mockPlayerHelperService.getPlayerNumber.and.returnValue(2);
      mockGameService.withSummaryMode.set(true);

      component.deletePlayer(testPlayer);

      // With 2 players remaining, withSummaryMode should not be changed
      expect(mockGameService.withSummaryMode()).toBe(true);
    });
  });
});
