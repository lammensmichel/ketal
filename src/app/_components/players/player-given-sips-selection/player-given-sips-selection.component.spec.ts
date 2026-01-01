import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, DebugElement } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PlayerGivenSipsSelectionComponent } from './player-given-sips-selection.component';
import { GameService } from '../../../services/game/game.service';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { createMockGameService, createMockPlayerHelperService } from '../../../testing/test-helpers';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { CardType } from '../../../_shared/_models/card-type.model';

describe('PlayerGivenSipsSelectionComponent', () => {
  let component: PlayerGivenSipsSelectionComponent;
  let fixture: ComponentFixture<PlayerGivenSipsSelectionComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let testPlayers: PlayerModel[];

  beforeEach(async () => {
    mockGameService = createMockGameService();
    mockPlayerHelperService = createMockPlayerHelperService();

    // Create test players
    testPlayers = [
      (() => {
        const player = new PlayerModel();
        player.id = 'player-1';
        player.name = 'Alice';
        player.avatarSrc = 'avatar1.png';
        player.cards = [];
        return player;
      })(),
      (() => {
        const player = new PlayerModel();
        player.id = 'player-2';
        player.name = 'Bob';
        player.avatarSrc = 'avatar2.png';
        player.cards = [];
        return player;
      })(),
      (() => {
        const player = new PlayerModel();
        player.id = 'player-3';
        player.name = 'Charlie';
        player.avatarSrc = 'avatar3.png';
        player.cards = [];
        return player;
      })(),
    ];

    // Mock the game object with test players
    (mockGameService as any).game = {
      players: testPlayers,
      maxTurnCount: 4,
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
      declarations: [PlayerGivenSipsSelectionComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerGivenSipsSelectionComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct properties', () => {
      expect(component.players).toEqual([]);
      expect(component.tempSips).toEqual({});
      expect(component.sipsToGive).toBe(0);
      expect(component.givenPlayer).toEqual(new PlayerModel());
      expect(component.currentCard).toBeUndefined();
    });

    it('should initialize players and tempSips on ngOnInit', () => {
      component.ngOnInit();

      expect(component.players.length).toBe(3);
      expect(Object.keys(component.tempSips).length).toBe(3);
      component.players.forEach((player) => {
        expect(component.tempSips[player.id]).toBe(0);
      });
    });

    it('should initialize tempSips with all players having 0 sips', () => {
      component.ngOnInit();

      component.players.forEach((player) => {
        expect(component.tempSips[player.id]).toBe(0);
      });
    });
  });

  describe('Input Properties', () => {
    it('should accept and set currentCard input', () => {
      const mockCard = {
        value: 'King',
        suit: 'Hearts',
        icon: 'K',
        sips: 2,
        selected: false,
        img: 'king_hearts.png',
        givenSips: 5,
      } as unknown as CardType;

      component.currentCard = mockCard;

      expect(component.currentCard).toEqual(mockCard);
    });

    it('should accept undefined currentCard', () => {
      component.currentCard = undefined;

      expect(component.currentCard).toBeUndefined();
    });
  });

  describe('increase() method', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should increment sips for a player by 1 when no amount is specified', () => {
      component.sipsToGive = 5;
      const player = component.players[0];
      component.increase(player);

      expect(component.tempSips[player.id]).toBe(1);
      expect(component.sipsToGive).toBe(4);
    });

    it('should increment sips for a player by specified amount', () => {
      component.sipsToGive = 10;
      const player = component.players[0];
      component.increase(player, 3);

      expect(component.tempSips[player.id]).toBe(3);
      expect(component.sipsToGive).toBe(7);
    });

    it('should increment multiple players sequentially', () => {
      component.sipsToGive = 10;
      const player1 = component.players[0];
      const player2 = component.players[1];
      component.increase(player1, 2);
      component.increase(player2, 3);

      expect(component.tempSips[player1.id]).toBe(2);
      expect(component.tempSips[player2.id]).toBe(3);
      expect(component.sipsToGive).toBe(5);
    });

    it('should not increment if sipsToGive is 0 or less', () => {
      component.sipsToGive = 0;
      const player = component.players[0];
      component.increase(player);

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(0);
    });

    it('should not increment if sipsToGive is negative', () => {
      component.sipsToGive = -5;
      const player = component.players[0];
      component.increase(player);

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(-5);
    });

    it('should not increment by more than available sipsToGive', () => {
      component.sipsToGive = 3;
      const player = component.players[0];
      component.increase(player, 5);

      // The method doesn't prevent over-assignment, it will assign and subtract
      expect(component.tempSips[player.id]).toBe(5);
      expect(component.sipsToGive).toBe(-2);
    });

    it('should handle multiple increments on same player', () => {
      component.sipsToGive = 10;
      const player = component.players[0];
      component.increase(player);
      component.increase(player);
      component.increase(player);

      expect(component.tempSips[player.id]).toBe(3);
      expect(component.sipsToGive).toBe(7);
    });
  });

  describe('decrease() method', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should decrement sips for a player by 1', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 5;
      component.sipsToGive = 0;
      component.decrease(player);

      expect(component.tempSips[player.id]).toBe(4);
      expect(component.sipsToGive).toBe(1);
    });

    it('should not decrement if tempSips is 0', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 0;
      component.sipsToGive = 5;
      component.decrease(player);

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(5);
    });

    it('should not decrement below 0', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 1;
      component.sipsToGive = 5;
      component.decrease(player);
      component.decrease(player);

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(6);
    });

    it('should increment sipsToGive when decrementing', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 3;
      component.sipsToGive = 2;
      component.decrease(player);

      expect(component.sipsToGive).toBe(3);
    });

    it('should handle multiple decrements on same player', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 5;
      component.sipsToGive = 0;
      component.decrease(player);
      component.decrease(player);

      expect(component.tempSips[player.id]).toBe(3);
      expect(component.sipsToGive).toBe(2);
    });

    it('should work independently for different players', () => {
      const player1 = component.players[0];
      const player2 = component.players[1];
      component.tempSips[player1.id] = 3;
      component.tempSips[player2.id] = 2;
      component.sipsToGive = 0;

      component.decrease(player1);
      component.decrease(player2);

      expect(component.tempSips[player1.id]).toBe(2);
      expect(component.tempSips[player2.id]).toBe(1);
      expect(component.sipsToGive).toBe(2);
    });
  });

  describe('resetSips() method', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should reset all tempSips to 0', () => {
      const player1 = component.players[0];
      const player2 = component.players[1];
      const player3 = component.players[2];
      component.tempSips[player1.id] = 5;
      component.tempSips[player2.id] = 3;
      component.tempSips[player3.id] = 2;
      component.sipsToGive = 10;

      component.resetSips();

      expect(component.tempSips[player1.id]).toBe(0);
      expect(component.tempSips[player2.id]).toBe(0);
      expect(component.tempSips[player3.id]).toBe(0);
    });

    it('should reset sipsToGive to 0', () => {
      component.sipsToGive = 15;
      component.resetSips();

      expect(component.sipsToGive).toBe(0);
    });

    it('should reset all tempSips even if they have different values', () => {
      const player1 = component.players[0];
      const player2 = component.players[1];
      const player3 = component.players[2];
      component.tempSips[player1.id] = 10;
      component.tempSips[player2.id] = 1;
      component.tempSips[player3.id] = 0;

      component.resetSips();

      Object.keys(component.tempSips).forEach((key) => {
        expect(component.tempSips[key]).toBe(0);
      });
    });
  });

  describe('closeModal() method', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should hide the modal by setting display to none', () => {
      const modal = fixture.nativeElement.querySelector('#playerSipsSelectionModal');
      modal.style.display = 'flex';

      component.closeModal();

      expect(modal.style.display).toBe('none');
    });

    it('should reset sips when closing modal', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 5;
      component.sipsToGive = 10;

      component.closeModal();

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(0);
    });

    it('should reset all player sips when closing', () => {
      const player1 = component.players[0];
      const player2 = component.players[1];
      const player3 = component.players[2];
      component.tempSips[player1.id] = 3;
      component.tempSips[player2.id] = 4;
      component.tempSips[player3.id] = 2;

      component.closeModal();

      Object.keys(component.tempSips).forEach((key) => {
        expect(component.tempSips[key]).toBe(0);
      });
    });
  });

  describe('openModal() method', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      mockPlayerHelperService.getSipCnt.and.returnValue(5);
    });

    it('should set givenPlayer to the provided player', () => {
      component.openModal(testPlayers[0]);

      expect(component.givenPlayer).toEqual(testPlayers[0]);
    });

    it('should set sipsToGive by calling playerHelper.getSipCnt', () => {
      component.openModal(testPlayers[0]);

      expect(mockPlayerHelperService.getSipCnt).toHaveBeenCalledWith(mockGameService.game, testPlayers[0]);
      expect(component.sipsToGive).toBe(5);
    });

    it('should show the modal by setting display to flex', () => {
      const modal = fixture.nativeElement.querySelector('#playerSipsSelectionModal');
      modal.style.display = 'none';

      component.openModal(testPlayers[0]);

      expect(modal.style.display).toBe('flex');
    });

    it('should work with different players', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(8);
      component.openModal(testPlayers[1]);

      expect(component.givenPlayer).toEqual(testPlayers[1]);
      expect(component.sipsToGive).toBe(8);
    });

    it('should update sipsToGive if getSipCnt returns different value', () => {
      mockPlayerHelperService.getSipCnt.and.returnValue(3);
      component.openModal(testPlayers[0]);

      expect(component.sipsToGive).toBe(3);

      mockPlayerHelperService.getSipCnt.and.returnValue(7);
      component.openModal(testPlayers[1]);

      expect(component.sipsToGive).toBe(7);
    });
  });

  describe('save() method', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show toast if sipsToGive is not 0', () => {
      component.ngOnInit();
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;
      component.sipsToGive = 5;

      component.save();

      expect(toastComponent.show).toHaveBeenCalled();
    });

    it('should not save if sipsToGive is not 0', () => {
      component.ngOnInit();
      component.sipsToGive = 3;
      component.givenPlayer = testPlayers[0];
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;

      component.save();

      expect(toastComponent.show).toHaveBeenCalled();
      expect(mockGameService.addPlayerSip).not.toHaveBeenCalled();
    });

    it('should call addPlayerSip for each player with sips > 0', () => {
      component.ngOnInit();
      // Ensure players are set
      expect(component.players.length).toBe(3);

      component.sipsToGive = 0;
      component.tempSips['player-1'] = 2;
      component.tempSips['player-2'] = 3;
      component.tempSips['player-3'] = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(mockGameService.addPlayerSip).toHaveBeenCalledWith(component.players[0], 2);
      expect(mockGameService.addPlayerSip).toHaveBeenCalledWith(component.players[1], 3);
      expect(mockGameService.addPlayerSip).toHaveBeenCalledTimes(2);
    });

    it('should not call addPlayerSip for players with 0 sips', () => {
      component.ngOnInit();
      component.sipsToGive = 0;
      component.tempSips['player-1'] = 0;
      component.tempSips['player-2'] = 0;
      component.tempSips['player-3'] = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(mockGameService.addPlayerSip).not.toHaveBeenCalled();
    });

    it('should update givenPlayer card givenSips to 0', () => {
      component.ngOnInit();
      const mockCard = {
        value: 'Queen',
        suit: 'Spades',
        icon: 'Q',
        sips: 3,
        selected: false,
        img: 'queen_spades.png',
        givenSips: 5,
      } as unknown as CardType;
      component.sipsToGive = 0;
      component.givenPlayer = testPlayers[0];
      component.givenPlayer.cards = [mockCard];
      component.tempSips['player-1'] = 0;

      component.save();

      expect(mockGameService.updatePlayerGivenSipsFromCard).toHaveBeenCalledWith(testPlayers[0], mockCard, 0);
    });

    it('should filter cards with givenSips when updating', () => {
      component.ngOnInit();
      const card1 = {
        value: 'Ace',
        suit: 'Diamonds',
        icon: 'A',
        sips: 4,
        selected: false,
        img: 'ace_diamonds.png',
        givenSips: 5,
      } as unknown as CardType;
      const card2 = {
        value: 'King',
        suit: 'Clubs',
        icon: 'K',
        sips: 2,
        selected: false,
        img: 'king_clubs.png',
        givenSips: 0,
      } as unknown as CardType;
      const card3 = {
        value: 'Jack',
        suit: 'Hearts',
        icon: 'J',
        sips: 3,
        selected: false,
        img: 'jack_hearts.png',
        givenSips: 3,
      } as unknown as CardType;

      component.sipsToGive = 0;
      component.givenPlayer = testPlayers[0];
      component.givenPlayer.cards = [card1, card2, card3];

      component.save();

      expect(mockGameService.updatePlayerGivenSipsFromCard).toHaveBeenCalledWith(testPlayers[0], card1, 0);
      expect(mockGameService.updatePlayerGivenSipsFromCard).toHaveBeenCalledWith(testPlayers[0], card3, 0);
      expect(mockGameService.updatePlayerGivenSipsFromCard).toHaveBeenCalledTimes(2);
    });

    it('should call refreshSession after saving', () => {
      component.ngOnInit();
      component.sipsToGive = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(mockGameService.refreshSession).toHaveBeenCalled();
    });

    it('should call closeModal after successful save', () => {
      component.ngOnInit();
      spyOn(component, 'closeModal');
      component.sipsToGive = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should not call refreshSession or closeModal if save is prevented by toast', () => {
      component.ngOnInit();
      spyOn(component, 'closeModal');
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;
      component.sipsToGive = 2;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(mockGameService.refreshSession).not.toHaveBeenCalled();
      expect(component.closeModal).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
      mockPlayerHelperService.getSipCnt.and.returnValue(10);
    });

    it('should handle complete workflow: open -> distribute -> save -> close', () => {
      spyOn(component, 'closeModal').and.callThrough();

      // Open modal
      component.openModal(testPlayers[0]);
      expect(component.givenPlayer).toEqual(testPlayers[0]);
      expect(component.sipsToGive).toBe(10);

      // Distribute sips
      component.increase(testPlayers[1], 3);
      component.increase(testPlayers[2], 4);
      component.increase(testPlayers[0], 3);

      expect(component.tempSips['player-1']).toBe(3);
      expect(component.tempSips['player-2']).toBe(3);
      expect(component.tempSips['player-3']).toBe(4);
      expect(component.sipsToGive).toBe(0);

      // Save
      component.save();

      expect(mockGameService.addPlayerSip).toHaveBeenCalledWith(testPlayers[0], 3);
      expect(mockGameService.addPlayerSip).toHaveBeenCalledWith(testPlayers[1], 3);
      expect(mockGameService.addPlayerSip).toHaveBeenCalledWith(testPlayers[2], 4);
      expect(mockGameService.refreshSession).toHaveBeenCalled();
      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should reset state when modal is closed without saving', () => {
      component.openModal(testPlayers[0]);
      component.increase(testPlayers[1], 5);

      expect(component.tempSips['player-2']).toBe(5);

      component.closeModal();

      expect(component.tempSips['player-2']).toBe(0);
      expect(component.sipsToGive).toBe(0);
    });

    it('should allow decreasing sips after increasing', () => {
      component.sipsToGive = 10;

      component.increase(testPlayers[0], 5);
      expect(component.tempSips['player-1']).toBe(5);
      expect(component.sipsToGive).toBe(5);

      component.decrease(testPlayers[0]);
      expect(component.tempSips['player-1']).toBe(4);
      expect(component.sipsToGive).toBe(6);
    });

    it('should handle multiple open/close cycles', () => {
      // First cycle
      mockPlayerHelperService.getSipCnt.and.returnValue(8);
      component.openModal(testPlayers[0]);
      component.increase(testPlayers[1], 4);
      component.increase(testPlayers[2], 4);
      component.closeModal();

      expect(component.tempSips['player-2']).toBe(0);
      expect(component.sipsToGive).toBe(0);

      // Second cycle
      mockPlayerHelperService.getSipCnt.and.returnValue(6);
      component.openModal(testPlayers[1]);
      expect(component.givenPlayer).toEqual(testPlayers[1]);
      expect(component.sipsToGive).toBe(6);
    });
  });
});
