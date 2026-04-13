import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
  let mockGameService: ReturnType<typeof createMockGameService>;
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

    // Mock the game object with test players via signal
    mockGameService.game.set({
      players: testPlayers,
      maxTurnCount: 4,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: undefined,
      status: 1,
      summary: false,
    });

    // Set the players signal to testPlayers (the mock now exposes players as WritableSignal)
    mockGameService.players.set(testPlayers);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), PlayerGivenSipsSelectionComponent],
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
      expect(component.tempSips).toEqual({});
      expect(component.sipsToGive).toBe(0);
      expect(component.givenPlayer).toEqual(new PlayerModel());
      expect(component.currentCard).toBeUndefined();
    });

    it('should get players from gameSrv.players signal', () => {
      expect(component.players.length).toBe(3);
      expect(component.players).toEqual(testPlayers);
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
      // Initialize tempSips for players
      component.players.forEach((p) => {
        component.tempSips[p.id] = 0;
      });
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
      // Initialize tempSips for players
      component.players.forEach((p) => {
        component.tempSips[p.id] = 0;
      });
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

  describe('closeModal() resets sips', () => {
    beforeEach(() => {
      component.players.forEach((p) => {
        component.tempSips[p.id] = 0;
      });
    });

    it('should reset all tempSips to 0 on close', () => {
      const player1 = component.players[0];
      const player2 = component.players[1];
      const player3 = component.players[2];
      component.tempSips[player1.id] = 5;
      component.tempSips[player2.id] = 3;
      component.tempSips[player3.id] = 2;
      component.sipsToGive = 10;

      component.closeModal();

      expect(component.tempSips[player1.id]).toBe(0);
      expect(component.tempSips[player2.id]).toBe(0);
      expect(component.tempSips[player3.id]).toBe(0);
    });

    it('should reset sipsToGive to 0 on close', () => {
      component.sipsToGive = 15;
      component.closeModal();

      expect(component.sipsToGive).toBe(0);
    });
  });

  describe('closeModal() method', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Initialize tempSips for players
      component.players.forEach((p) => {
        component.tempSips[p.id] = 0;
      });
    });

    it('should close the modal (modalOpen flips to false)', () => {
      // The component uses an Angular `@if (modalOpen)` to mount/unmount the
      // modal markup instead of toggling display: none on a fixed DOM node, so
      // we assert the boolean state rather than inspecting computed styles.
      component.modalOpen = true;

      component.closeModal();

      expect(component.modalOpen).toBeFalse();
    });

    it('should reset sips when closing modal', () => {
      const player = component.players[0];
      component.tempSips[player.id] = 5;
      component.sipsToGive = 10;

      component.closeModal();

      expect(component.tempSips[player.id]).toBe(0);
      expect(component.sipsToGive).toBe(0);
    });
  });

  describe('openModal() method', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(5);
    });

    it('should set givenPlayer to the provided player', () => {
      component.openModal(testPlayers[0]);

      expect(component.givenPlayer).toEqual(testPlayers[0]);
    });

    it('should set sipsToGive by calling playerHelper.getTotalGivenSips', () => {
      // The component reads pending sips from `getTotalGivenSips(player)` (sums
      // each card's pending givenSips) — not from the older `getSipCnt(game, player)`.
      component.openModal(testPlayers[0]);

      expect(mockPlayerHelperService.getTotalGivenSips).toHaveBeenCalledWith(testPlayers[0]);
      expect(component.sipsToGive).toBe(5);
    });

    it('should open the modal (modalOpen flips to true)', () => {
      // The component uses `@if (modalOpen)` to mount the modal markup; we
      // assert the boolean state rather than inspecting display: flex/none.
      component.modalOpen = false;

      component.openModal(testPlayers[0]);

      expect(component.modalOpen).toBeTrue();
    });

    it('should initialize tempSips for all players to 0', () => {
      component.openModal(testPlayers[0]);

      component.players.forEach((p) => {
        expect(component.tempSips[p.id]).toBe(0);
      });
    });
  });

  describe('save() method', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Initialize tempSips for players
      component.players.forEach((p) => {
        component.tempSips[p.id] = 0;
      });
    });

    it('should show toast if sipsToGive is not 0', () => {
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;
      component.sipsToGive = 5;

      component.save();

      expect(toastComponent.show).toHaveBeenCalled();
    });

    it('should not save if sipsToGive is not 0', () => {
      component.sipsToGive = 3;
      component.givenPlayer = testPlayers[0];
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;

      component.save();

      expect(toastComponent.show).toHaveBeenCalled();
      expect(mockGameService.addPlayerSip).not.toHaveBeenCalled();
    });

    it('should call addPlayerSip for each player with sips > 0', () => {
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
      component.sipsToGive = 0;
      component.tempSips['player-1'] = 0;
      component.tempSips['player-2'] = 0;
      component.tempSips['player-3'] = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(mockGameService.addPlayerSip).not.toHaveBeenCalled();
    });

    it('should update givenPlayer card givenSips to 0', () => {
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

    it('should call closeModal after successful save', () => {
      spyOn(component, 'closeModal');
      component.sipsToGive = 0;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(component.closeModal).toHaveBeenCalled();
    });

    it('should not call closeModal if save is prevented by toast', () => {
      spyOn(component, 'closeModal');
      const toastComponent = jasmine.createSpyObj('ToastComponent', ['show']);
      component.toastComponent = toastComponent;
      component.sipsToGive = 2;
      component.givenPlayer = testPlayers[0];

      component.save();

      expect(component.closeModal).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockPlayerHelperService.getTotalGivenSips.and.returnValue(10);
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
  });
});
