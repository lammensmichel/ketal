import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlayersListComponent } from './players-list.component';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { GameService } from '../../../services/game/game.service';
import { LocalService } from '../../../services/local/local.service';
import { PlayerModel } from '../../../_shared/_models/player.model';
import {
  createMockPlayerHelperService,
  createMockGameService,
  createMockLocalService,
} from '../../../testing/test-helpers';

describe('PlayersListComponent', () => {
  let component: PlayersListComponent;
  let fixture: ComponentFixture<PlayersListComponent>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockGameService: ReturnType<typeof createMockGameService>;
  let mockLocalService: jasmine.SpyObj<LocalService>;
  let translateService: TranslateService;

  const mockPlayer: PlayerModel = {
    id: '1',
    name: 'Test Player',
    cards: [],
    avatarSrc: '',
    choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
    sips: { drunk: 0, given: 0 },
  };

  beforeEach(async () => {
    mockPlayerHelperService = createMockPlayerHelperService();
    mockGameService = createMockGameService();
    mockLocalService = createMockLocalService();

    // Setup mock game object with players
    mockGameService.game.set({
      players: [mockPlayer],
      turn: 1,
      phase: 1,
      maxTurnCount: 4,
      drinkingCards: [],
      givingCards: [],
      activePlayer: undefined,
      status: 0,
      summary: false,
    });

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), ReactiveFormsModule, MatDialogModule, PlayersListComponent],
      providers: [
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: GameService, useValue: mockGameService },
        { provide: LocalService, useValue: mockLocalService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayersListComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize playersForm with newPlayer control', () => {
      expect(component.playersForm).toBeDefined();
      expect(component.playersForm.get('newPlayer')).toBeDefined();
    });

    it('should load players from localStorage if available', () => {
      const storedPlayers = JSON.stringify([mockPlayer]);
      mockLocalService.getData.and.returnValue(storedPlayers);

      // Re-create component to test constructor
      fixture = TestBed.createComponent(PlayersListComponent);
      component = fixture.componentInstance;

      expect(mockLocalService.getData).toHaveBeenCalledWith('players');
    });

    it('should handle null localStorage data', () => {
      mockLocalService.getData.and.returnValue(null);

      // Re-create component to test constructor
      fixture = TestBed.createComponent(PlayersListComponent);
      component = fixture.componentInstance;

      expect(component.playersForm).toBeDefined();
    });
  });

  describe('Component initialization', () => {
    it('should have playersForm defined after initialization', () => {
      expect(component.playersForm).toBeDefined();
    });
  });

  describe('addPlayer', () => {
    it('should not add player if max player number is reached', () => {
      mockPlayerHelperService.isMaxPlayerNumberNotReached.and.returnValue(false);
      component.playersForm.controls['newPlayer'].setValue('New Player');
      component.addPlayer();
      expect(mockPlayerHelperService.addPlayer).not.toHaveBeenCalled();
    });

    it('should add player if form is valid and max not reached', () => {
      mockPlayerHelperService.isMaxPlayerNumberNotReached.and.returnValue(true);
      component.playersForm.controls['newPlayer'].setValue('New Player');
      component.addPlayer();
      expect(mockPlayerHelperService.addPlayer).toHaveBeenCalledWith('New Player');
    });

    it('should reset form after adding player', () => {
      mockPlayerHelperService.isMaxPlayerNumberNotReached.and.returnValue(true);
      component.playersForm.controls['newPlayer'].setValue('New Player');
      component.addPlayer();
      expect(component.playersForm.controls['newPlayer'].value).toBeNull();
    });

    it('should not add player if form is invalid (empty)', () => {
      mockPlayerHelperService.isMaxPlayerNumberNotReached.and.returnValue(true);
      component.playersForm.controls['newPlayer'].setValue('');
      component.addPlayer();
      expect(mockPlayerHelperService.addPlayer).not.toHaveBeenCalled();
    });

    it('should not add player if name is whitespace only', () => {
      mockPlayerHelperService.isMaxPlayerNumberNotReached.and.returnValue(true);
      component.playersForm.controls['newPlayer'].setValue('   ');
      component.addPlayer();
      expect(mockPlayerHelperService.addPlayer).not.toHaveBeenCalled();
    });
  });

  describe('getPlayers', () => {
    it('should return players from playerHelper when game is new', () => {
      mockGameService.isNewGame.and.returnValue(true);
      mockPlayerHelperService.getPlayers.and.returnValue([mockPlayer]);
      const result = component.getPlayers();
      expect(mockPlayerHelperService.getPlayers).toHaveBeenCalled();
      expect(result).toEqual([mockPlayer]);
    });

    it('should return players from game when game is started', () => {
      mockGameService.isNewGame.and.returnValue(false);
      const gamePlayers = [mockPlayer, { ...mockPlayer, id: '2', name: 'Player 2' }];
      // Set up the players signal on the mock service
      // The component calls gameSrv.players() when game is not new
      (mockGameService.players as any).set(gamePlayers);
      const result = component.getPlayers();
      expect(result).toEqual(gamePlayers);
    });
  });

  describe('getNewPlayerInputPlaceholder', () => {
    it('should call translate.instant with correct key', () => {
      spyOn(translateService, 'instant').and.returnValue('Player Name');
      const result = component.getNewPlayerInputPlaceholder();
      expect(translateService.instant).toHaveBeenCalledWith('Label_PlaceHolder_PlayerName');
      expect(result).toBe('Player Name');
    });
  });

  describe('newPlayer getter', () => {
    it('should return the newPlayer form control', () => {
      const control = component.newPlayer;
      expect(control).toBe(component.playersForm.get('newPlayer'));
    });
  });

  describe('form validation', () => {
    it('should mark form as invalid when newPlayer is empty', () => {
      component.playersForm.controls['newPlayer'].setValue('');
      expect(component.playersForm.valid).toBeFalse();
    });

    it('should mark form as valid when newPlayer has value', () => {
      component.playersForm.controls['newPlayer'].setValue('Test');
      expect(component.playersForm.valid).toBeTrue();
    });

    it('should require newPlayer field', () => {
      const control = component.playersForm.controls['newPlayer'];
      expect(control.hasError('required')).toBeTrue();
    });
  });

  describe('allPlayersCreated', () => {
    it('should be initialized to false', () => {
      expect(component.allPlayersCreated).toBeFalse();
    });

    it('should be able to be set to true', () => {
      component.allPlayersCreated = true;
      expect(component.allPlayersCreated).toBeTrue();
    });
  });

  describe('beginGame EventEmitter', () => {
    it('should be defined', () => {
      expect(component.beginGame).toBeDefined();
    });

    it('should emit when called', () => {
      spyOn(component.beginGame, 'emit');
      component.beginGame.emit();
      expect(component.beginGame.emit).toHaveBeenCalled();
    });
  });
});
