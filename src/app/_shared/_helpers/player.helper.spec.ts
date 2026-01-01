import { TestBed } from '@angular/core/testing';
import { PlayerHelperService } from './player.helper';
import { LocalService } from '../../services/local/local.service';
import { CardService } from '../../services/card/card.service';
import { PlayerModel, PlayerChoice } from '../_models/player.model';
import { CardType } from '../_models/card-type.model';
import { Game } from '../_models/game.model';

describe('PlayerHelperService', () => {
  let service: PlayerHelperService;
  let localServiceSpy: jasmine.SpyObj<LocalService>;
  let cardServiceSpy: jasmine.SpyObj<CardService>;

  // Mock player factory
  const createMockPlayer = (overrides: Partial<PlayerModel> = {}): PlayerModel => {
    const player = new PlayerModel();
    player.id = overrides.id || 'test-uuid-123';
    player.name = overrides.name || 'Test Player';
    player.avatarSrc = overrides.avatarSrc || 'https://api.dicebear.com/7.x/avataaars/svg?seed=test-uuid-123';
    player.cards = overrides.cards || [];
    player.choice = overrides.choice || {
      color: '',
      plus_or_minus: '',
      in_out: '',
      suit: '',
    };
    player.sips = overrides.sips || { drunk: 0, given: 0 };
    return player;
  };

  // Mock card factory
  const createMockCard = (overrides: Partial<CardType> = {}): CardType => {
    return {
      value: overrides.value !== undefined ? overrides.value : '5',
      suit: overrides.suit !== undefined ? overrides.suit : 'hearts',
      icon: overrides.icon !== undefined ? overrides.icon : null,
      sips: overrides.sips !== undefined ? overrides.sips : 0,
      selected: overrides.selected !== undefined ? overrides.selected : false,
      img: overrides.img !== undefined ? overrides.img : null,
      givenSips: overrides.givenSips,
    };
  };

  // Mock game factory
  const createMockGame = (overrides: Partial<Game> = {}): Game => {
    return {
      players: overrides.players || [],
      turn: overrides.turn !== undefined ? overrides.turn : 0,
      maxTurnCount: overrides.maxTurnCount !== undefined ? overrides.maxTurnCount : 4,
      phase: overrides.phase !== undefined ? overrides.phase : 1,
      drinkingCards: overrides.drinkingCards || [],
      givingCards: overrides.givingCards || [],
      activePlayer: overrides.activePlayer,
      status: overrides.status !== undefined ? overrides.status : 0,
      summary: overrides.summary !== undefined ? overrides.summary : false,
    };
  };

  beforeEach(() => {
    const localSpy = jasmine.createSpyObj('LocalService', ['saveData', 'getData', 'removeData', 'clearData']);
    const cardSpy = jasmine.createSpyObj('CardService', ['getCardValue']);

    TestBed.configureTestingModule({
      providers: [
        PlayerHelperService,
        { provide: LocalService, useValue: localSpy },
        { provide: CardService, useValue: cardSpy },
      ],
    });

    service = TestBed.inject(PlayerHelperService);
    localServiceSpy = TestBed.inject(LocalService) as jasmine.SpyObj<LocalService>;
    cardServiceSpy = TestBed.inject(CardService) as jasmine.SpyObj<CardService>;
  });

  afterEach(() => {
    // Reset players array after each test
    service.players = [];
  });

  describe('Constructor initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty players array', () => {
      expect(service.players).toEqual([]);
    });

    it('should have localService injected', () => {
      expect(service.localService).toBeTruthy();
    });

    it('should have cardSrv injected', () => {
      expect(service.cardSrv).toBeTruthy();
    });
  });

  describe('addPlayer', () => {
    it('should add a player with correct name', () => {
      service.addPlayer('John');

      expect(service.players.length).toBe(1);
      expect(service.players[0].name).toBe('John');
    });

    it('should generate a UUID for the player id', () => {
      service.addPlayer('Jane');

      expect(service.players[0].id).toBeDefined();
      expect(service.players[0].id.length).toBeGreaterThan(0);
      // UUID v4 format check (8-4-4-4-12 format)
      expect(service.players[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should initialize player with empty cards array', () => {
      service.addPlayer('Alice');

      expect(service.players[0].cards).toEqual([]);
      expect(Array.isArray(service.players[0].cards)).toBe(true);
    });

    it('should initialize player with empty choice object', () => {
      service.addPlayer('Bob');

      expect(service.players[0].choice).toEqual({
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: '',
      });
    });

    it('should generate avatar URL using player id', () => {
      service.addPlayer('Charlie');

      const playerId = service.players[0].id;
      expect(service.players[0].avatarSrc).toBe(`https://api.dicebear.com/7.x/avataaars/svg?seed=${playerId}`);
    });

    it('should call savePlayerToStorage after adding player', () => {
      service.addPlayer('Dave');

      expect(localServiceSpy.saveData).toHaveBeenCalledWith('players', jasmine.any(String));
    });

    it('should add multiple players correctly', () => {
      service.addPlayer('Player1');
      service.addPlayer('Player2');
      service.addPlayer('Player3');

      expect(service.players.length).toBe(3);
      expect(service.players[0].name).toBe('Player1');
      expect(service.players[1].name).toBe('Player2');
      expect(service.players[2].name).toBe('Player3');
    });

    it('should generate unique IDs for each player', () => {
      service.addPlayer('Player1');
      service.addPlayer('Player2');

      expect(service.players[0].id).not.toBe(service.players[1].id);
    });
  });

  describe('deletePlayer', () => {
    it('should remove a player by id', () => {
      const player1 = createMockPlayer({ id: 'id-1', name: 'Player1' });
      const player2 = createMockPlayer({ id: 'id-2', name: 'Player2' });
      service.players = [player1, player2];

      service.deletePlayer(player1);

      expect(service.players.length).toBe(1);
      expect(service.players[0].id).toBe('id-2');
    });

    it('should call savePlayerToStorage after deleting', () => {
      const player = createMockPlayer({ id: 'id-1' });
      service.players = [player];

      service.deletePlayer(player);

      expect(localServiceSpy.saveData).toHaveBeenCalledWith('players', jasmine.any(String));
    });

    it('should not affect other players when deleting', () => {
      const player1 = createMockPlayer({ id: 'id-1', name: 'Player1' });
      const player2 = createMockPlayer({ id: 'id-2', name: 'Player2' });
      const player3 = createMockPlayer({ id: 'id-3', name: 'Player3' });
      service.players = [player1, player2, player3];

      service.deletePlayer(player2);

      expect(service.players.length).toBe(2);
      expect(service.players.find((p) => p.name === 'Player1')).toBeTruthy();
      expect(service.players.find((p) => p.name === 'Player3')).toBeTruthy();
      expect(service.players.find((p) => p.name === 'Player2')).toBeFalsy();
    });

    it('should handle deleting the only player', () => {
      const player = createMockPlayer({ id: 'id-1' });
      service.players = [player];

      service.deletePlayer(player);

      expect(service.players.length).toBe(0);
    });

    it('should handle deleting non-existent player gracefully', () => {
      const player1 = createMockPlayer({ id: 'id-1' });
      const player2 = createMockPlayer({ id: 'non-existent' });
      service.players = [player1];

      service.deletePlayer(player2);

      expect(service.players.length).toBe(1);
      expect(service.players[0].id).toBe('id-1');
    });
  });

  describe('savePlayerToStorage', () => {
    it('should save players to local storage', () => {
      const players = [createMockPlayer({ id: 'id-1' })];

      service.savePlayerToStorage(players);

      expect(localServiceSpy.saveData).toHaveBeenCalledWith('players', JSON.stringify(players));
    });

    it('should save empty array when no players', () => {
      service.savePlayerToStorage([]);

      expect(localServiceSpy.saveData).toHaveBeenCalledWith('players', '[]');
    });

    it('should serialize multiple players correctly', () => {
      const players = [
        createMockPlayer({ id: 'id-1', name: 'Player1' }),
        createMockPlayer({ id: 'id-2', name: 'Player2' }),
      ];

      service.savePlayerToStorage(players);

      expect(localServiceSpy.saveData).toHaveBeenCalledWith('players', JSON.stringify(players));
    });
  });

  describe('getPlayers', () => {
    it('should return players from service array when not empty', () => {
      const player = createMockPlayer({ id: 'id-1' });
      service.players = [player];

      const result = service.getPlayers();

      expect(result).toEqual([player]);
    });

    it('should load players from storage when service array is empty', () => {
      const storedPlayers = [createMockPlayer({ id: 'stored-id' })];
      localServiceSpy.getData.and.returnValue(JSON.stringify(storedPlayers));

      const result = service.getPlayers();

      expect(localServiceSpy.getData).toHaveBeenCalledWith('players');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('stored-id');
    });

    it('should return empty array when no players in storage and service array is empty', () => {
      localServiceSpy.getData.and.returnValue(null);

      const result = service.getPlayers();

      expect(result).toEqual([]);
    });

    it('should not call storage when service array has players', () => {
      const player = createMockPlayer({ id: 'id-1' });
      service.players = [player];

      service.getPlayers();

      expect(localServiceSpy.getData).not.toHaveBeenCalled();
    });
  });

  describe('getPlayerNumber', () => {
    it('should return 0 when no players', () => {
      service.players = [];
      localServiceSpy.getData.and.returnValue(null);

      expect(service.getPlayerNumber()).toBe(0);
    });

    it('should return correct count for service array players', () => {
      service.players = [
        createMockPlayer({ id: 'id-1' }),
        createMockPlayer({ id: 'id-2' }),
        createMockPlayer({ id: 'id-3' }),
      ];

      expect(service.getPlayerNumber()).toBe(3);
    });

    it('should return correct count from storage when service array is empty', () => {
      const storedPlayers = [createMockPlayer({ id: 'id-1' }), createMockPlayer({ id: 'id-2' })];
      localServiceSpy.getData.and.returnValue(JSON.stringify(storedPlayers));

      expect(service.getPlayerNumber()).toBe(2);
    });
  });

  describe('isMaxPlayerNumberNotReached', () => {
    it('should return true when no players', () => {
      service.players = [];
      localServiceSpy.getData.and.returnValue(null);

      expect(service.isMaxPlayerNumberNotReached()).toBe(true);
    });

    it('should return true when less than 23 players', () => {
      service.players = Array(10)
        .fill(null)
        .map((_, i) => createMockPlayer({ id: `id-${i}` }));

      expect(service.isMaxPlayerNumberNotReached()).toBe(true);
    });

    it('should return true when 22 players (one below max)', () => {
      service.players = Array(22)
        .fill(null)
        .map((_, i) => createMockPlayer({ id: `id-${i}` }));

      expect(service.isMaxPlayerNumberNotReached()).toBe(true);
    });

    it('should return false when 23 players (at max)', () => {
      service.players = Array(23)
        .fill(null)
        .map((_, i) => createMockPlayer({ id: `id-${i}` }));

      expect(service.isMaxPlayerNumberNotReached()).toBe(false);
    });

    it('should return false when more than 23 players', () => {
      service.players = Array(25)
        .fill(null)
        .map((_, i) => createMockPlayer({ id: `id-${i}` }));

      expect(service.isMaxPlayerNumberNotReached()).toBe(false);
    });
  });

  describe('getPlayerCardListValues', () => {
    it('should return empty array for player with no cards', () => {
      const player = createMockPlayer({ cards: [] });

      const result = service.getPlayerCardListValues(player);

      expect(result).toEqual([]);
    });

    it('should return card values for player with cards', () => {
      const player = createMockPlayer({
        cards: [createMockCard({ value: '5' }), createMockCard({ value: 'K' }), createMockCard({ value: '10' })],
      });

      const result = service.getPlayerCardListValues(player);

      expect(result).toEqual(['5', 'K', '10']);
    });

    it('should filter out null values', () => {
      const player = createMockPlayer({
        cards: [createMockCard({ value: '5' }), createMockCard({ value: null }), createMockCard({ value: 'A' })],
      });

      const result = service.getPlayerCardListValues(player);

      expect(result).toEqual(['5', 'A']);
    });
  });

  describe('getPlayerChoice', () => {
    it('should return color choice', () => {
      const player = createMockPlayer({
        choice: { color: 'red', plus_or_minus: '', in_out: '', suit: '' },
      });

      const result = service.getPlayerChoice(player, 'color');

      expect(result).toBe('red');
    });

    it('should return plus_or_minus choice', () => {
      const player = createMockPlayer({
        choice: { color: '', plus_or_minus: 'plus', in_out: '', suit: '' },
      });

      const result = service.getPlayerChoice(player, 'plus_or_minus');

      expect(result).toBe('plus');
    });

    it('should return in_out choice', () => {
      const player = createMockPlayer({
        choice: { color: '', plus_or_minus: '', in_out: 'in', suit: '' },
      });

      const result = service.getPlayerChoice(player, 'in_out');

      expect(result).toBe('in');
    });

    it('should return suit choice', () => {
      const player = createMockPlayer({
        choice: { color: '', plus_or_minus: '', in_out: '', suit: 'hearts' },
      });

      const result = service.getPlayerChoice(player, 'suit');

      expect(result).toBe('hearts');
    });

    it('should return empty string for empty choice', () => {
      const player = createMockPlayer({
        choice: { color: '', plus_or_minus: '', in_out: '', suit: '' },
      });

      const result = service.getPlayerChoice(player, 'color');

      expect(result).toBe('');
    });
  });

  describe('getTotalGivenSips', () => {
    it('should return 0 for player with no cards', () => {
      const player = createMockPlayer({ cards: [] });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(0);
    });

    it('should return 0 for player with cards having no given sips', () => {
      const player = createMockPlayer({
        cards: [createMockCard({ givenSips: 0 }), createMockCard({ givenSips: 0 })],
      });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(0);
    });

    it('should sum positive given sips', () => {
      const player = createMockPlayer({
        cards: [createMockCard({ givenSips: 2 }), createMockCard({ givenSips: 3 }), createMockCard({ givenSips: 5 })],
      });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(10);
    });

    it('should ignore negative given sips', () => {
      const player = createMockPlayer({
        cards: [createMockCard({ givenSips: 2 }), createMockCard({ givenSips: -3 }), createMockCard({ givenSips: 5 })],
      });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(7);
    });

    it('should ignore undefined given sips', () => {
      const player = createMockPlayer({
        cards: [
          createMockCard({ givenSips: 2 }),
          createMockCard({ givenSips: undefined }),
          createMockCard({ givenSips: 3 }),
        ],
      });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(5);
    });

    it('should handle mixed givenSips values', () => {
      const player = createMockPlayer({
        cards: [
          createMockCard({ givenSips: 0 }),
          createMockCard({ givenSips: 5 }),
          createMockCard({ givenSips: undefined }),
          createMockCard({ givenSips: -2 }),
          createMockCard({ givenSips: 10 }),
        ],
      });

      const result = service.getTotalGivenSips(player);

      expect(result).toBe(15);
    });
  });

  describe('getSipCnt', () => {
    let player1: PlayerModel;
    let player2: PlayerModel;
    let player3: PlayerModel;

    beforeEach(() => {
      player1 = createMockPlayer({ id: 'player-1', name: 'Player1' });
      player2 = createMockPlayer({ id: 'player-2', name: 'Player2' });
      player3 = createMockPlayer({ id: 'player-3', name: 'Player3' });
    });

    describe('Phase 1 behavior', () => {
      it('should return 0 for non-previous player in phase 1', () => {
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 1,
        });

        const result = service.getSipCnt(game, player3);

        expect(result).toBe(0);
      });

      it('should return negative sips for previous player in phase 1', () => {
        player1.cards = [createMockCard({ sips: 3 })];
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 1,
        });

        const result = service.getSipCnt(game, player1);

        expect(result).toBe(-3);
      });

      it('should return absolute sips when absolute is true in phase 1', () => {
        player1.cards = [createMockCard({ sips: 3 })];
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 1,
        });

        const result = service.getSipCnt(game, player1, true);

        expect(result).toBe(3);
      });

      it('should return 0 when previous player has no cards in phase 1', () => {
        player1.cards = [];
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 1,
        });

        const result = service.getSipCnt(game, player1);

        expect(result).toBe(0);
      });

      it('should handle wrap-around for first player active (previous is last player)', () => {
        player3.cards = [createMockCard({ sips: 5 })];
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player1,
          phase: 1,
        });

        const result = service.getSipCnt(game, player3);

        expect(result).toBe(-5);
      });
    });

    describe('Phase 2+ behavior', () => {
      it('should return sips for previous player when no drinking/giving cards', () => {
        player1.cards = [createMockCard({ sips: 4 })];
        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: [],
          givingCards: [],
        });

        const result = service.getSipCnt(game, player1);

        expect(result).toBe(-4);
      });

      it('should calculate sips based on matching card values with odd total cards', () => {
        const drinkingCard = createMockCard({ value: '5' });
        player1.cards = [createMockCard({ value: '5' })];
        cardServiceSpy.getCardValue.and.callFake((card: CardType) => {
          return card.value === '5' ? 5 : 0;
        });

        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: [drinkingCard],
          givingCards: [],
        });

        const result = service.getSipCnt(game, player1);

        // Odd cards (1), so negative multiplier: 1 * -1 = -1
        expect(result).toBe(-1);
      });

      it('should calculate sips based on matching card values with even total cards', () => {
        const drinkingCard = createMockCard({ value: '7' });
        const givingCard = createMockCard({ value: '7' });
        player1.cards = [createMockCard({ value: '7' })];
        cardServiceSpy.getCardValue.and.callFake((card: CardType) => {
          return card.value === '7' ? 7 : 0;
        });

        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: [drinkingCard],
          givingCards: [givingCard],
        });

        const result = service.getSipCnt(game, player1);

        // Even cards (2), positive multiplier: 1 * 1 = 1
        expect(result).toBe(1);
      });

      it('should return 0 when no matching cards', () => {
        const drinkingCard = createMockCard({ value: '5' });
        player1.cards = [createMockCard({ value: '10' })];
        cardServiceSpy.getCardValue.and.callFake((card: CardType) => {
          return card.value === '5' ? 5 : 10;
        });

        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: [drinkingCard],
          givingCards: [],
        });

        const result = service.getSipCnt(game, player1);

        expect(result).toBe(0);
      });

      it('should multiply sips by number of drinking cards', () => {
        const drinkingCards = [
          createMockCard({ value: '5' }),
          createMockCard({ value: '6' }),
          createMockCard({ value: '5' }),
        ];
        player1.cards = [createMockCard({ value: '5' }), createMockCard({ value: '5' })];
        cardServiceSpy.getCardValue.and.callFake((card: CardType) => {
          return card.value === '5' ? 5 : 6;
        });

        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: drinkingCards,
          givingCards: [],
        });

        const result = service.getSipCnt(game, player1);

        // Odd (3), check last drinking card which is '5', player has 2 matching cards
        // 2 * 3 * -1 = -6
        expect(result).toBe(-6);
      });

      it('should return absolute value when absolute is true in phase 2', () => {
        const drinkingCard = createMockCard({ value: '5' });
        player1.cards = [createMockCard({ value: '5' })];
        cardServiceSpy.getCardValue.and.callFake((card: CardType) => {
          return card.value === '5' ? 5 : 0;
        });

        const game = createMockGame({
          players: [player1, player2, player3],
          activePlayer: player2,
          phase: 2,
          drinkingCards: [drinkingCard],
          givingCards: [],
        });

        const result = service.getSipCnt(game, player1, true);

        expect(result).toBe(1);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in player names', () => {
      service.addPlayer("O'Connor");
      expect(service.players[0].name).toBe("O'Connor");

      service.addPlayer('Player <script>');
      expect(service.players[1].name).toBe('Player <script>');
    });

    it('should handle empty string player name', () => {
      service.addPlayer('');
      expect(service.players[0].name).toBe('');
    });

    it('should handle unicode characters in player names', () => {
      service.addPlayer('Player \u{1F600}');
      expect(service.players[0].name).toBe('Player \u{1F600}');
    });

    it('should correctly parse players from storage with complex data', () => {
      const complexPlayer = createMockPlayer({
        id: 'complex-id',
        name: 'Complex Player',
        cards: [createMockCard({ value: 'K', suit: 'hearts', sips: 5, givenSips: 3 })],
        choice: { color: 'red', plus_or_minus: 'plus', in_out: 'out', suit: 'spades' },
      });
      localServiceSpy.getData.and.returnValue(JSON.stringify([complexPlayer]));

      const result = service.getPlayers();

      expect(result[0].id).toBe('complex-id');
      expect(result[0].name).toBe('Complex Player');
      expect(result[0].cards.length).toBe(1);
      expect(result[0].choice['color']).toBe('red');
    });
  });
});
