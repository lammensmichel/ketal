import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { LocalService } from '../local/local.service';
import { CardService } from '../card/card.service';
import { PlayerHelperService } from '../../_shared/_helpers/player.helper';
import { CardDeckHelperService } from '../../_shared/_helpers/card-deck.helper';
import {
  createMockLocalService,
  createMockCardService,
  createMockPlayerHelperService,
  createMockCardDeckHelperService,
} from '../../testing/test-helpers';
import { Game } from '../../_shared/_models/game.model';
import { PlayerModel } from '../../_shared/_models/player.model';
import { CardType } from '../../_shared/_models/card-type.model';
import { ColorsEnum } from '../../_shared/_models/enums/color.enum';
import { PlusOrMinusEnum } from '../../_shared/_models/enums/plus_minus.enum';
import { InAndOutEnum } from '../../_shared/_models/enums/in_out.enum';
import { DrinkChoiceEnum } from '../../_shared/_models/enums/drink_choice.enum';

// ============================================================================
// Test Data Factories
// ============================================================================

/**
 * Creates a mock card with default values
 */
function createMockCard(overrides: Partial<CardType> = {}): CardType {
  return {
    value: '5',
    suit: 'hearts',
    icon: 'heart',
    sips: 0,
    selected: false,
    img: 'card-image.png',
    givenSips: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock player with default values
 */
function createMockPlayer(overrides: Partial<PlayerModel> = {}): PlayerModel {
  const player = new PlayerModel();
  player.id = 'player-1';
  player.name = 'Test Player';
  player.avatarSrc = 'avatar.png';
  player.cards = [];
  player.choice = {
    color: '',
    plus_or_minus: '',
    in_out: '',
    suit: '',
  };
  player.sips = {
    drunk: 0,
    given: 0,
  };

  return { ...player, ...overrides } as PlayerModel;
}

/**
 * Creates a mock game with default values
 */
function createMockGame(overrides: Partial<Game> = {}): Game {
  return {
    players: [createMockPlayer()],
    turn: 1,
    maxTurnCount: 4,
    phase: 1,
    drinkingCards: [],
    givingCards: [],
    activePlayer: undefined,
    status: 0,
    summary: false,
    ...overrides,
  };
}

describe('GameService', () => {
  let service: GameService;
  let mockLocalService: jasmine.SpyObj<LocalService>;
  let mockCardService: jasmine.SpyObj<CardService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockCardDeckHelperService: jasmine.SpyObj<CardDeckHelperService>;

  beforeEach(() => {
    mockLocalService = createMockLocalService();
    mockCardService = createMockCardService();
    mockPlayerHelperService = createMockPlayerHelperService();
    mockCardDeckHelperService = createMockCardDeckHelperService();

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: LocalService, useValue: mockLocalService },
        { provide: CardService, useValue: mockCardService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
        { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
      ],
    });
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================================================
  // Constructor and Initialization Tests
  // ==========================================================================
  describe('Constructor and Initialization', () => {
    it('should initialize gameSignal from local storage on construction', () => {
      const mockGame = createMockGame();
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

      // Re-create service to trigger constructor
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
        ],
      });
      const newService = TestBed.inject(GameService);

      expect(newService.gameSignal).toBeDefined();
      expect(newService.gameSignal()).toEqual(mockGame);
    });

    it('should handle null game data from local storage', () => {
      mockLocalService.getData.and.returnValue(null);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GameService,
          { provide: LocalService, useValue: mockLocalService },
          { provide: CardService, useValue: mockCardService },
          { provide: PlayerHelperService, useValue: mockPlayerHelperService },
          { provide: CardDeckHelperService, useValue: mockCardDeckHelperService },
        ],
      });
      const newService = TestBed.inject(GameService);

      expect(newService.gameSignal).toBeDefined();
      expect(newService.gameSignal()).toBeNull();
    });
  });

  // ==========================================================================
  // Game State Management Tests (get/set game, refreshSession)
  // ==========================================================================
  describe('Game State Management', () => {
    describe('game getter', () => {
      it('should return game from local storage when _game is undefined', () => {
        const mockGame = createMockGame();
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        const result = service.game;

        expect(mockLocalService.getData).toHaveBeenCalledWith('game');
        // Compare individual properties since JSON.parse converts undefined to null
        expect(result.players).toEqual(mockGame.players);
        expect(result.turn).toBe(mockGame.turn);
        expect(result.status).toBe(mockGame.status);
        expect(result.phase).toBe(mockGame.phase);
      });

      it('should return cached game when already loaded', () => {
        const mockGame = createMockGame();
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));

        // First access
        const _firstAccess = service.game;
        // Second access - should use cache
        const result = service.game;

        // Compare individual properties since JSON.parse converts undefined to null
        expect(result.players).toEqual(mockGame.players);
        expect(result.turn).toBe(mockGame.turn);
        expect(result.status).toBe(mockGame.status);
      });
    });

    describe('game setter', () => {
      it('should save game to local storage when game is defined', () => {
        const mockGame = createMockGame();

        service.game = mockGame;

        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', JSON.stringify(mockGame));
      });

      it('should update gameSignal when game is set', () => {
        const mockGame = createMockGame();

        service.game = mockGame;

        expect(service.gameSignal()).toEqual(mockGame);
      });

      it('should remove game from local storage when game is undefined', () => {
        service.game = undefined;

        expect(mockLocalService.removeData).toHaveBeenCalledWith('game');
      });
    });

    describe('refreshSession', () => {
      it('should save game to local storage and emit on gameSubject', () => {
        const mockGame = createMockGame();
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;
        mockLocalService.saveData.calls.reset();

        service.refreshSession();

        expect(mockLocalService.saveData).toHaveBeenCalledWith('game', JSON.stringify(mockGame));
      });
    });

    describe('setCardChoice', () => {
      it('should set the card choice for the active player', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.setCardChoice('color', 'red', 'player-1');

        expect(service.game.players[0].choice['color']).toBe('red');
        expect(service.game.activePlayer).toEqual(player);
      });

      it('should not change anything if player not found', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.setCardChoice('color', 'red', 'non-existent-player');

        expect(service.game.players[0].choice['color']).toBe('');
      });
    });
  });

  // ==========================================================================
  // Game Status Methods Tests
  // ==========================================================================
  describe('Game Status Methods', () => {
    describe('getGameStatus', () => {
      it('should return 0 when game is not defined', () => {
        mockLocalService.getData.and.returnValue(null);

        const result = service.getGameStatus();

        expect(result).toBe(0);
      });

      it('should return game status when game is defined', () => {
        const mockGame = createMockGame({ status: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const result = service.getGameStatus();

        expect(result).toBe(2);
      });
    });

    describe('isNewGame', () => {
      it('should return true when status is 0', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNewGame()).toBe(true);
      });

      it('should return false when status is not 0', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNewGame()).toBe(false);
      });
    });

    describe('isGameStarted', () => {
      it('should return true when status is 1', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGameStarted()).toBe(true);
      });

      it('should return false when status is not 1', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGameStarted()).toBe(false);
      });
    });

    describe('isGameFinished', () => {
      it('should return true when status is 2', () => {
        const mockGame = createMockGame({ status: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGameFinished()).toBe(true);
      });

      it('should return false when status is not 2', () => {
        const mockGame = createMockGame({ status: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGameFinished()).toBe(false);
      });
    });

    describe('isSummaryMode', () => {
      it('should return true when summary is activated and status is 3', () => {
        const mockGame = createMockGame({ status: 3, summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isSummaryMode()).toBe(true);
      });

      it('should return false when summary is not activated', () => {
        const mockGame = createMockGame({ status: 3, summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isSummaryMode()).toBe(false);
      });

      it('should return false when status is not 3', () => {
        const mockGame = createMockGame({ status: 1, summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isSummaryMode()).toBe(false);
      });
    });

    describe('isSummaryActivated', () => {
      it('should return true when game summary is true', () => {
        const mockGame = createMockGame({ summary: true });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isSummaryActivated()).toBe(true);
      });

      it('should return false when game summary is false', () => {
        const mockGame = createMockGame({ summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isSummaryActivated()).toBe(false);
      });
    });

    describe('setStatus', () => {
      it('should set the game status and refresh session', () => {
        const mockGame = createMockGame({ status: 0 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.setStatus(2);

        expect(service.game.status).toBe(2);
      });
    });

    describe('withSummaryMode', () => {
      it('should return signal with initial value false', () => {
        expect(service.withSummaryMode()).toBe(false);
      });

      it('should update value when set is called', () => {
        expect(service.withSummaryMode()).toBe(false);

        service.withSummaryMode.set(true);

        expect(service.withSummaryMode()).toBe(true);
      });

      it('should support update method', () => {
        expect(service.withSummaryMode()).toBe(false);

        service.withSummaryMode.update((v) => !v);

        expect(service.withSummaryMode()).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Player Sips Calculation Methods Tests
  // ==========================================================================
  describe('Player Sips Calculation Methods', () => {
    describe('getSipsNumberForColorChoice (via assignSipsForFirstTurn)', () => {
      it('should return 1 sip when player chose red but card is black', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Red, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'spades' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isBlackCard.and.returnValue(true);
        mockCardService.isRedCard.and.returnValue(false);

        service.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(1);
        expect(service.game.players[0].sips['drunk']).toBe(1);
      });

      it('should return 1 sip when player chose black but card is red', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Black, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Black);
        mockCardService.isBlackCard.and.returnValue(false);
        mockCardService.isRedCard.and.returnValue(true);

        service.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(1);
      });

      it('should return 0 sips when player chose correctly', () => {
        const player = createMockPlayer({
          id: 'player-1',
          choice: { color: ColorsEnum.Red, plus_or_minus: '', in_out: '', suit: '' },
        });
        const card = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 1 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
        mockCardService.isBlackCard.and.returnValue(false);
        mockCardService.isRedCard.and.returnValue(true);

        service.assignSipsForFirstTurn(card, 'player-1');

        expect(card.sips).toBe(0);
      });
    });

    describe('getSipsNumberForMinusChoice (via assignSipsForFirstTurn turn 2)', () => {
      it('should return 4 sips when new card value equals previous card value', () => {
        const previousCard = createMockCard({ value: '5' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(5, 5); // previous = 5, new = 5

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(4);
      });

      it('should return 2 sips when player chose plus but new card is lower', () => {
        const previousCard = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '3' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(7, 3); // previous = 7, new = 3

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(2);
      });

      it('should return 2 sips when player chose minus but new card is higher', () => {
        const previousCard = createMockCard({ value: '3' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Minus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Minus);
        mockCardService.getCardValue.and.returnValues(3, 7); // previous = 3, new = 7

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(2);
      });

      it('should return 0 sips when player chose correctly', () => {
        const previousCard = createMockCard({ value: '3' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [previousCard],
          choice: { color: 'red', plus_or_minus: PlusOrMinusEnum.Plus, in_out: '', suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(PlusOrMinusEnum.Plus);
        mockCardService.getCardValue.and.returnValues(3, 7); // previous = 3, new = 7

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });
    });

    describe('getSipsNumberForInAndOutChoice (via assignSipsForFirstTurn turn 3)', () => {
      it('should return 6 sips when new card value equals lowest card value', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '3' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(6);
      });

      it('should return 6 sips when new card value equals highest card value', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '7' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(6);
      });

      it('should return 0 sips when player chose in and new card is between', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '5') {
            return 5;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });

      it('should return 3 sips when player chose in but new card is outside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.In, suit: '' },
        });
        const newCard = createMockCard({ value: '9' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.In);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '9') {
            return 9;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(3);
      });

      it('should return 0 sips when player chose out and new card is outside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.Out, suit: '' },
        });
        const newCard = createMockCard({ value: '9' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.Out);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '9') {
            return 9;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });

      it('should return 3 sips when player chose out but new card is inside', () => {
        const card1 = createMockCard({ value: '3' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: InAndOutEnum.Out, suit: '' },
        });
        const newCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({ players: [player], turn: 3 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue(InAndOutEnum.Out);
        mockCardService.lowestCard.and.returnValue(card1);
        mockCardService.greatestCard.and.returnValue(card2);
        mockCardService.getCardValue.and.callFake((card: CardType) => {
          if (card.value === '3') {
            return 3;
          }
          if (card.value === '7') {
            return 7;
          }
          if (card.value === '5') {
            return 5;
          }
          return 0;
        });

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(3);
      });
    });

    describe('getSipsNumberForSuitChoice (via assignSipsForFirstTurn turn 4)', () => {
      it('should return 4 sips when player chose wrong suit', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [createMockCard(), createMockCard(), createMockCard()],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
        });
        const newCard = createMockCard({ suit: 'spades' });
        const mockGame = createMockGame({ players: [player], turn: 4 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(4);
      });

      it('should return 0 sips when player chose correct suit', () => {
        const player = createMockPlayer({
          id: 'player-1',
          cards: [createMockCard(), createMockCard(), createMockCard()],
          choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
        });
        const newCard = createMockCard({ suit: 'hearts' });
        const mockGame = createMockGame({ players: [player], turn: 4 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

        service.assignSipsForFirstTurn(newCard, 'player-1');

        expect(newCard.sips).toBe(0);
      });
    });
  });

  // ==========================================================================
  // assignSipsForFirstTurn Tests
  // ==========================================================================
  describe('assignSipsForFirstTurn', () => {
    it('should return early if player not found', () => {
      const mockGame = createMockGame({ players: [], turn: 1 });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const card = createMockCard();
      service.assignSipsForFirstTurn(card, 'non-existent-player');

      expect(card.sips).toBe(0); // Unchanged
    });

    it('should not assign sips for turns other than 1-4', () => {
      const player = createMockPlayer({ id: 'player-1' });
      const mockGame = createMockGame({ players: [player], turn: 5 });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const card = createMockCard();
      service.assignSipsForFirstTurn(card, 'player-1');

      // Card sips should remain undefined for turn 5 (no assignment happens)
      expect(card.sips).toBe(0);
    });
  });

  // ==========================================================================
  // addPlayerSip Tests
  // ==========================================================================
  describe('addPlayerSip', () => {
    it('should add drunk sips when player has less than 4 cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.addPlayerSip(player, 3);

      expect(service.game.players[0].sips['drunk']).toBe(3);
    });

    it('should add drunk sips when drink=true and player has 4+ cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.addPlayerSip(player, 3, true);

      expect(service.game.players[0].sips['drunk']).toBe(3);
    });

    it('should add given sips when drink=false and player has 4+ cards', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.addPlayerSip(player, 3, false);

      expect(service.game.players[0].sips['given']).toBe(3);
    });

    it('should not add sips when sipNbr is 0', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard()],
        sips: { drunk: 5, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.addPlayerSip(player, 0);

      expect(service.game.players[0].sips['drunk']).toBe(5); // Unchanged
    });

    it('should not add sips when player not found', () => {
      const player = createMockPlayer({ id: 'player-1' });
      const unknownPlayer = createMockPlayer({ id: 'unknown' });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.addPlayerSip(unknownPlayer, 3);

      expect(service.game.players[0].sips['drunk']).toBe(0);
    });

    it('should refresh session after adding sips', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        sips: { drunk: 0, given: 0 },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;
      mockLocalService.saveData.calls.reset();

      service.addPlayerSip(player, 3);

      expect(mockLocalService.saveData).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // pickCard Tests
  // ==========================================================================
  describe('pickCard', () => {
    it('should not pick card when game is undefined', () => {
      mockLocalService.getData.and.returnValue(null);

      service.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
    });

    it('should not pick card when activePlayer is undefined', () => {
      const mockGame = createMockGame({ activePlayer: undefined });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
    });

    it('should pick a card and add it to active player', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({ players: [player], activePlayer: player, turn: 1 });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard({ value: '5', suit: 'hearts' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue(ColorsEnum.Red);
      mockCardService.isBlackCard.and.returnValue(false);
      mockCardService.isRedCard.and.returnValue(true);

      service.pickCard();

      expect(mockCardDeckHelperService.getRandomCard).toHaveBeenCalled();
      expect(service.game.players[0].cards.length).toBe(1);
    });

    it('should move to next player after picking card', () => {
      const player1 = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const player2 = createMockPlayer({
        id: 'player-2',
        cards: [],
        choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player1, player2],
        activePlayer: player1,
        turn: 1,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      service.pickCard();

      expect(service.game.activePlayer?.id).toBe('player-2');
    });

    it('should set activePlayer to undefined when last player picks', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 1,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      service.pickCard();

      expect(service.game.activePlayer).toBeUndefined();
    });

    it('should increment turn when all players made choices', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [],
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 1,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      service.pickCard();

      expect(service.game.turn).toBe(2);
    });

    it('should set phase to 2 when turn exceeds 4', () => {
      const player = createMockPlayer({
        id: 'player-1',
        cards: [createMockCard(), createMockCard(), createMockCard()],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
      });
      const mockGame = createMockGame({
        players: [player],
        activePlayer: player,
        turn: 4,
        phase: 1,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);
      mockPlayerHelperService.getPlayerChoice.and.returnValue('hearts');

      service.pickCard();

      expect(service.game.phase).toBe(2);
    });
  });

  // ==========================================================================
  // displayNewCard (Phase 2) Tests
  // ==========================================================================
  describe('displayNewCard', () => {
    it('should return early if game is undefined', () => {
      mockLocalService.getData.and.returnValue(null);

      const result = service.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should return early if 6 giving cards already exist', () => {
      const mockGame = createMockGame({
        givingCards: [
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
        ],
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const result = service.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should display a new card and deselect all previous cards', () => {
      const existingCard = createMockCard({ selected: true });
      const mockGame = createMockGame({
        givingCards: [],
        drinkingCards: [],
        players: [createMockPlayer({ cards: [existingCard] })],
        summary: false,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard({ value: '7' });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      service.displayNewCard();

      expect(existingCard.selected).toBe(false);
    });

    it('should return early if not all sips given in summary mode', () => {
      const cardWithGivenSips = createMockCard({ givenSips: 2 });
      const player = createMockPlayer({ cards: [cardWithGivenSips] });
      const mockGame = createMockGame({
        givingCards: [],
        drinkingCards: [createMockCard()],
        players: [player],
        summary: true,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const result = service.displayNewCard();

      expect(result).toBeUndefined();
    });

    it('should set game status to 2 when 6 giving cards are reached', () => {
      const mockGame = createMockGame({
        givingCards: [createMockCard(), createMockCard(), createMockCard(), createMockCard(), createMockCard()],
        drinkingCards: [
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
          createMockCard(),
        ],
        players: [createMockPlayer()],
        summary: false,
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard();
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      service.displayNewCard();

      expect(service.game.status).toBe(2);
    });

    it('should mark new card as selected', () => {
      const mockGame = createMockGame({
        givingCards: [],
        drinkingCards: [],
        players: [createMockPlayer()],
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      const newCard = createMockCard({ selected: false });
      mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

      const result = service.displayNewCard();

      expect(result?.selected).toBe(true);
    });
  });

  // ==========================================================================
  // beginGame Tests
  // ==========================================================================
  describe('beginGame', () => {
    it('should construct deck and initialize game', () => {
      const players = [createMockPlayer({ id: 'player-1' }), createMockPlayer({ id: 'player-2' })];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(mockCardDeckHelperService.constructDeck).toHaveBeenCalled();
      expect(service.game.turn).toBe(1);
      expect(service.game.phase).toBe(1);
      expect(service.game.status).toBe(1);
    });

    it('should set maxTurnCount to players.length * 4', () => {
      const players = [
        createMockPlayer({ id: 'player-1' }),
        createMockPlayer({ id: 'player-2' }),
        createMockPlayer({ id: 'player-3' }),
      ];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game.maxTurnCount).toBe(12);
    });

    it('should set first player as active player', () => {
      const players = [createMockPlayer({ id: 'player-1' }), createMockPlayer({ id: 'player-2' })];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game.activePlayer?.id).toBe('player-1');
    });

    it('should initialize empty drinkingCards and givingCards arrays', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game.drinkingCards).toEqual([]);
      expect(service.game.givingCards).toEqual([]);
    });

    it('should set summary mode to false by default', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame();

      expect(service.game.summary).toBe(false);
    });

    it('should set summary mode to true when passed as parameter', () => {
      const players = [createMockPlayer()];
      mockLocalService.getData.and.returnValue(JSON.stringify(players));

      service.beginGame(true);

      expect(service.game.summary).toBe(true);
    });
  });

  // ==========================================================================
  // resetGame Tests
  // ==========================================================================
  describe('resetGame', () => {
    it('should reset game status to 0', () => {
      const mockGame = createMockGame({ status: 2 });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(service.game.status).toBe(0);
    });

    it('should reset givingCards and drinkingCards to empty arrays', () => {
      const mockGame = createMockGame({
        givingCards: [createMockCard()],
        drinkingCards: [createMockCard()],
      });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(service.game.givingCards).toEqual([]);
      expect(service.game.drinkingCards).toEqual([]);
    });

    it('should reset phase and turn to 0', () => {
      const mockGame = createMockGame({ phase: 2, turn: 4 });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(service.game.phase).toBe(0);
      expect(service.game.turn).toBe(0);
    });

    it('should reset activePlayer to undefined', () => {
      const player = createMockPlayer();
      const mockGame = createMockGame({ activePlayer: player });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(service.game.activePlayer).toBeUndefined();
    });

    it('should reset all players sips, cards, and choices', () => {
      const player = createMockPlayer({
        sips: { drunk: 10, given: 5 },
        cards: [createMockCard()],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'in', suit: 'hearts' },
      });
      const mockGame = createMockGame({ players: [player] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(service.game.players[0].sips).toEqual({ drunk: 0, given: 0 });
      expect(service.game.players[0].cards).toEqual([]);
      expect(service.game.players[0].choice).toEqual({
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: '',
      });
    });

    it('should save players to storage after reset', () => {
      const mockGame = createMockGame({ players: [createMockPlayer()] });
      mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
      service.game = mockGame;

      service.resetGame();

      expect(mockPlayerHelperService.savePlayerToStorage).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // isChoiceUndefinedOrWhiteSpace Tests
  // ==========================================================================
  describe('isChoiceUndefinedOrWhiteSpace', () => {
    it('should return true for empty string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('')).toBe(true);
    });

    it('should return true for whitespace only string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('   ')).toBe(true);
    });

    it('should return true for null', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(null as unknown as string)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(undefined as unknown as string)).toBe(true);
    });

    it('should return false for valid string', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace('red')).toBe(false);
    });

    it('should return false for string with spaces but also content', () => {
      expect(service.isChoiceUndefinedOrWhiteSpace(' red ')).toBe(false);
    });
  });

  // ==========================================================================
  // Additional Methods Tests
  // ==========================================================================
  describe('Additional Methods', () => {
    describe('addDrinkingCard', () => {
      it('should add card to drinkingCards array', () => {
        const mockGame = createMockGame({ drinkingCards: [] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const card = createMockCard();
        service.addDrinkingCard(card);

        expect(service.game.drinkingCards.length).toBe(1);
        expect(service.game.drinkingCards[0]).toBe(card);
      });
    });

    describe('addGivingCard', () => {
      it('should add card to givingCards array', () => {
        const mockGame = createMockGame({ givingCards: [] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const card = createMockCard();
        service.addGivingCard(card);

        expect(service.game.givingCards.length).toBe(1);
        expect(service.game.givingCards[0]).toBe(card);
      });
    });

    describe('addCardToPlayer', () => {
      it('should add card to player cards array', () => {
        const player = createMockPlayer({ id: 'player-1', cards: [] });
        const mockGame = createMockGame({ players: [player], activePlayer: player });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const card = createMockCard();
        service.addCardToPlayer(card, 'player-1');

        expect(service.game.players[0].cards.length).toBe(1);
      });

      it('should not add card if player not found', () => {
        const player = createMockPlayer({ id: 'player-1', cards: [] });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const card = createMockCard();
        service.addCardToPlayer(card, 'unknown-player');

        expect(service.game.players[0].cards.length).toBe(0);
      });
    });

    describe('addTurn', () => {
      it('should increment turn by 1', () => {
        const mockGame = createMockGame({ turn: 2 });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.addTurn();

        expect(service.game.turn).toBe(3);
      });
    });

    describe('getLastCard', () => {
      it('should return last giving card when givingCards >= drinkingCards', () => {
        const givingCard = createMockCard({ value: 'K' });
        const drinkingCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({
          givingCards: [givingCard],
          drinkingCards: [drinkingCard],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const result = service.getLastCard();

        expect(result).toBe(givingCard);
      });

      it('should return last drinking card when drinkingCards > givingCards', () => {
        const givingCard = createMockCard({ value: 'K' });
        const drinkingCard = createMockCard({ value: '5' });
        const mockGame = createMockGame({
          givingCards: [],
          drinkingCards: [drinkingCard],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const result = service.getLastCard();

        expect(result).toBe(drinkingCard);
      });
    });

    describe('isGivingCard', () => {
      it('should return true when drinkingCards > givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard()],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGivingCard()).toBe(true);
      });

      it('should return false when drinkingCards <= givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard()],
          givingCards: [createMockCard()],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isGivingCard()).toBe(false);
      });
    });

    describe('getSipsNumber', () => {
      it('should return 1 when both arrays are empty', () => {
        const mockGame = createMockGame({
          drinkingCards: [],
          givingCards: [],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.getSipsNumber()).toBe(1);
      });

      it('should return 1 when only drinkingCards has elements', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard()],
          givingCards: [],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.getSipsNumber()).toBe(1);
      });

      it('should return drinkingCards.length + 1 when lengths are equal', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard(), createMockCard()],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.getSipsNumber()).toBe(3);
      });

      it('should return givingCards.length + 1 when drinkingCards > givingCards', () => {
        const mockGame = createMockGame({
          drinkingCards: [createMockCard(), createMockCard(), createMockCard()],
          givingCards: [createMockCard(), createMockCard()],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.getSipsNumber()).toBe(3);
      });
    });

    describe('isNotAllSipsGiven', () => {
      it('should return false when summary is not activated', () => {
        const mockGame = createMockGame({ summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNotAllSipsGiven()).toBe(false);
      });

      it('should return false when drinkingCards is empty', () => {
        const mockGame = createMockGame({ summary: true, drinkingCards: [] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNotAllSipsGiven()).toBe(false);
      });

      it('should return true when there are remaining sips to give', () => {
        const cardWithGivenSips = createMockCard({ givenSips: 2 });
        const player = createMockPlayer({ cards: [cardWithGivenSips] });
        const mockGame = createMockGame({
          summary: true,
          drinkingCards: [createMockCard()],
          players: [player],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNotAllSipsGiven()).toBe(true);
      });

      it('should return false when all sips are given', () => {
        const cardWithNoGivenSips = createMockCard({ givenSips: 0 });
        const player = createMockPlayer({ cards: [cardWithNoGivenSips] });
        const mockGame = createMockGame({
          summary: true,
          drinkingCards: [createMockCard()],
          players: [player],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        expect(service.isNotAllSipsGiven()).toBe(false);
      });
    });

    describe('updatePlayerGivenSipsFromCard', () => {
      it('should update givenSips on matching card', () => {
        const card = createMockCard({ value: '5', suit: 'hearts', givenSips: 0 });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.updatePlayerGivenSipsFromCard(player, card, 3);

        expect(service.game.players[0].cards[0].givenSips).toBe(3);
      });

      it('should not update if player not found', () => {
        const card = createMockCard({ value: '5', suit: 'hearts' });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const unknownPlayer = createMockPlayer({ id: 'unknown' });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.updatePlayerGivenSipsFromCard(unknownPlayer, card, 3);

        expect(service.game.players[0].cards[0].givenSips).toBeUndefined();
      });

      it('should not update if card not found', () => {
        const card = createMockCard({ value: '5', suit: 'hearts' });
        const differentCard = createMockCard({ value: 'K', suit: 'spades' });
        const player = createMockPlayer({ id: 'player-1', cards: [card] });
        const mockGame = createMockGame({ players: [player] });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.updatePlayerGivenSipsFromCard(player, differentCard, 3);

        expect(service.game.players[0].cards[0].givenSips).toBeUndefined();
      });
    });

    describe('setChoiceAndPickCard', () => {
      it('should set choice and pick card when game and activePlayer exist', () => {
        const player = createMockPlayer({ id: 'player-1' });
        const mockGame = createMockGame({
          players: [player],
          activePlayer: player,
          turn: 1,
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const newCard = createMockCard();
        mockCardDeckHelperService.getRandomCard.and.returnValue(newCard);

        service.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(service.game.players[0].choice['color']).toBe('red');
        expect(mockCardDeckHelperService.getRandomCard).toHaveBeenCalled();
      });

      it('should not do anything when game is undefined', () => {
        mockLocalService.getData.and.returnValue(null);

        service.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
      });

      it('should not do anything when activePlayer is undefined', () => {
        const mockGame = createMockGame({ activePlayer: undefined });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        service.setChoiceAndPickCard(DrinkChoiceEnum.Color, 'red');

        expect(mockCardDeckHelperService.getRandomCard).not.toHaveBeenCalled();
      });
    });

    describe('selectCardOnPlayer', () => {
      it('should select cards with matching value on all players', () => {
        const card1 = createMockCard({ value: '5', selected: false });
        const card2 = createMockCard({ value: '7', selected: false });
        const player = createMockPlayer({ cards: [card1, card2] });
        const mockGame = createMockGame({ players: [player], summary: false });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const currentCard = createMockCard({ value: '5' });
        service.selectCardOnPlayer(2, currentCard);

        expect(service.game.players[0].cards[0].selected).toBe(true);
        expect(service.game.players[0].cards[1].selected).toBe(false);
      });

      it('should set givenSips when summary is activated and isGivingCard', () => {
        const card = createMockCard({ value: '5', selected: false, givenSips: undefined });
        const player = createMockPlayer({ cards: [card] });
        const mockGame = createMockGame({
          players: [player],
          summary: true,
          drinkingCards: [createMockCard(), createMockCard()],
          givingCards: [createMockCard()],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const currentCard = createMockCard({ value: '5' });
        service.selectCardOnPlayer(3, currentCard);

        expect(service.game.players[0].cards[0].givenSips).toBe(3);
      });
    });

    describe('addSips', () => {
      it('should add sips to players with matching card value', () => {
        const card1 = createMockCard({ value: '5' });
        const card2 = createMockCard({ value: '7' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          sips: { drunk: 0, given: 0 },
        });
        const mockGame = createMockGame({
          players: [player],
          drinkingCards: [],
          givingCards: [],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const matchingCard = createMockCard({ value: '5' });
        service.addSips(matchingCard, 2);

        expect(service.game.players[0].sips['drunk']).toBe(2);
      });

      it('should add sips multiple times for multiple matching cards', () => {
        const card1 = createMockCard({ value: '5' });
        const card2 = createMockCard({ value: '5' });
        const player = createMockPlayer({
          id: 'player-1',
          cards: [card1, card2],
          sips: { drunk: 0, given: 0 },
        });
        const mockGame = createMockGame({
          players: [player],
          drinkingCards: [],
          givingCards: [],
        });
        mockLocalService.getData.and.returnValue(JSON.stringify(mockGame));
        service.game = mockGame;

        const matchingCard = createMockCard({ value: '5' });
        service.addSips(matchingCard, 2);

        expect(service.game.players[0].sips['drunk']).toBe(4);
      });
    });

    describe('openSipGiveModal', () => {
      it('should emit player on openSipGiveModalEvent$', (done) => {
        const player = createMockPlayer({ id: 'player-1' });

        service.openSipGiveModalEvent$.subscribe((emittedPlayer) => {
          expect(emittedPlayer).toEqual(player);
          done();
        });

        service.openSipGiveModal(player);
      });
    });
  });
});
