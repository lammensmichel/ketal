import { TestBed } from '@angular/core/testing';
import { CardDeckHelperService } from './card-deck.helper';
import { LocalService } from '../../services/local/local.service';
import { PlayerHelperService } from './player.helper';
import { CardType } from '../_models/card-type.model';
import { CardValueEnum } from '../_models/enums/card_value.enum';
import { SuitsEnum } from '../_models/enums/suits.enum';

describe('CardDeckHelperService', () => {
  let service: CardDeckHelperService;
  let mockLocalService: jasmine.SpyObj<LocalService>;
  let mockPlayerHelperService: jasmine.SpyObj<PlayerHelperService>;
  let mockStorage: { [key: string]: string };

  const expectedSuits = Object.values(SuitsEnum);
  const expectedValues = Object.values(CardValueEnum);

  beforeEach(() => {
    mockStorage = {};

    mockLocalService = jasmine.createSpyObj('LocalService', ['getData', 'saveData']);
    mockLocalService.getData.and.callFake((key: string) => mockStorage[key] || null);
    mockLocalService.saveData.and.callFake((key: string, value: string) => {
      mockStorage[key] = value;
    });

    mockPlayerHelperService = jasmine.createSpyObj('PlayerHelperService', [], {
      players: [],
    });

    TestBed.configureTestingModule({
      providers: [
        CardDeckHelperService,
        { provide: LocalService, useValue: mockLocalService },
        { provide: PlayerHelperService, useValue: mockPlayerHelperService },
      ],
    });

    service = TestBed.inject(CardDeckHelperService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have correct possible suits', () => {
      expect(service.possibleSuits).toEqual(expectedSuits);
      expect(service.possibleSuits).toContain('hearts');
      expect(service.possibleSuits).toContain('diams');
      expect(service.possibleSuits).toContain('spades');
      expect(service.possibleSuits).toContain('clubs');
    });

    it('should have correct possible values (A-K)', () => {
      expect(service.possibleValues).toEqual(expectedValues);
      expect(service.possibleValues).toContain('A');
      expect(service.possibleValues).toContain('2');
      expect(service.possibleValues).toContain('3');
      expect(service.possibleValues).toContain('4');
      expect(service.possibleValues).toContain('5');
      expect(service.possibleValues).toContain('6');
      expect(service.possibleValues).toContain('7');
      expect(service.possibleValues).toContain('8');
      expect(service.possibleValues).toContain('9');
      expect(service.possibleValues).toContain('10');
      expect(service.possibleValues).toContain('J');
      expect(service.possibleValues).toContain('Q');
      expect(service.possibleValues).toContain('K');
    });

    it('should have 13 possible card values', () => {
      expect(service.possibleValues.length).toBe(13);
    });

    it('should have 4 possible suits', () => {
      expect(service.possibleSuits.length).toBe(4);
    });

    it('should initialize with empty deck when no session data exists', () => {
      expect(service.createdCardDeck).toEqual([]);
    });

    it('should initialize with stored deck when session data exists', () => {
      const storedDeck: CardType[] = [
        {
          suit: 'hearts',
          icon: '&hearts;',
          sips: 0,
          selected: false,
          value: 'A',
          img: 'assets/images/cards/svg/A_hearts.svg',
          givenSips: undefined,
        },
      ];
      mockStorage['cardDeck'] = JSON.stringify(storedDeck);

      // Re-create the service to trigger constructor with stored data
      service = new CardDeckHelperService(mockLocalService, mockPlayerHelperService);

      expect(service.createdCardDeck.length).toBe(1);
      expect(service.createdCardDeck[0].value).toBe('A');
      expect(service.createdCardDeck[0].suit).toBe('hearts');
    });
  });

  describe('constructOneDeck', () => {
    it('should add 52 cards to the provided deck array', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      expect(deck.length).toBe(52);
    });

    it('should create cards with correct structure', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      const card = deck[0];
      expect(card).toBeDefined();
      expect(card.suit).toBeDefined();
      expect(card.icon).toBeDefined();
      expect(card.sips).toBe(0);
      expect(card.selected).toBe(false);
      expect(card.value).toBeDefined();
      expect(card.img).toBeDefined();
      expect(card.givenSips).toBeUndefined();
    });

    it('should create cards with correct icon format', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      const heartsCard = deck.find((card) => card.suit === 'hearts');
      expect(heartsCard?.icon).toBe('&hearts;');

      const spadesCard = deck.find((card) => card.suit === 'spades');
      expect(spadesCard?.icon).toBe('&spades;');
    });

    it('should create cards with correct image path format', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      const aceOfHearts = deck.find((card) => card.suit === 'hearts' && card.value === 'A');
      expect(aceOfHearts?.img).toBe('assets/images/cards/svg/A_hearts.svg');

      const kingOfSpades = deck.find((card) => card.suit === 'spades' && card.value === 'K');
      expect(kingOfSpades?.img).toBe('assets/images/cards/svg/K_spades.svg');
    });

    it('should contain all 13 values for each suit', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      for (const suit of expectedSuits) {
        const cardsOfSuit = deck.filter((card) => card.suit === suit);
        expect(cardsOfSuit.length).toBe(13);

        const valuesOfSuit = cardsOfSuit.map((card) => card.value);
        for (const value of expectedValues) {
          expect(valuesOfSuit).toContain(value);
        }
      }
    });

    it('should contain all 4 suits for each value', () => {
      const deck: CardType[] = [];
      service.constructOneDeck(deck);

      for (const value of expectedValues) {
        const cardsOfValue = deck.filter((card) => card.value === value);
        expect(cardsOfValue.length).toBe(4);

        const suitsOfValue = cardsOfValue.map((card) => card.suit);
        for (const suit of expectedSuits) {
          expect(suitsOfValue).toContain(suit);
        }
      }
    });
  });

  describe('constructDeck', () => {
    it('should create a deck with 52 cards when 10 or fewer players', () => {
      const deck = service.constructDeck();

      expect(deck.length).toBe(52);
    });

    it('should create a deck with 104 cards when more than 10 players', () => {
      // Override the players array to have more than 10 players
      Object.defineProperty(mockPlayerHelperService, 'players', {
        value: new Array(11).fill({}),
        writable: true,
      });

      const deck = service.constructDeck();

      expect(deck.length).toBe(104);
    });

    it('should reset cards before constructing a new deck', () => {
      // First construct a deck
      service.constructDeck();

      // Then construct another deck
      const newDeck = service.constructDeck();

      // Should still be 52, not 104
      expect(newDeck.length).toBe(52);
    });

    it('should save the deck to local storage', () => {
      service.constructDeck();

      expect(mockLocalService.saveData).toHaveBeenCalledWith('cardDeck', jasmine.any(String));
      const savedDeck = JSON.parse(mockStorage['cardDeck']);
      expect(savedDeck.length).toBe(52);
    });

    it('should return the constructed deck', () => {
      const deck = service.constructDeck();

      expect(deck).toBeDefined();
      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBe(52);
    });

    it('should contain all hearts cards', () => {
      const deck = service.constructDeck();
      const heartsCards = deck.filter((card) => card.suit === 'hearts');

      expect(heartsCards.length).toBe(13);
    });

    it('should contain all diamonds (diams) cards', () => {
      const deck = service.constructDeck();
      const diamsCards = deck.filter((card) => card.suit === 'diams');

      expect(diamsCards.length).toBe(13);
    });

    it('should contain all spades cards', () => {
      const deck = service.constructDeck();
      const spadesCards = deck.filter((card) => card.suit === 'spades');

      expect(spadesCards.length).toBe(13);
    });

    it('should contain all clubs cards', () => {
      const deck = service.constructDeck();
      const clubsCards = deck.filter((card) => card.suit === 'clubs');

      expect(clubsCards.length).toBe(13);
    });

    it('should have unique cards (no duplicates in a single deck)', () => {
      const deck = service.constructDeck();

      const cardKeys = deck.map((card) => `${card.value}_${card.suit}`);
      const uniqueKeys = new Set(cardKeys);

      expect(uniqueKeys.size).toBe(52);
    });
  });

  describe('getRandomCard', () => {
    beforeEach(() => {
      service.constructDeck();
    });

    it('should return a card object', () => {
      const card = service.getRandomCard();

      expect(card).toBeDefined();
      expect(card.suit).toBeDefined();
      expect(card.value).toBeDefined();
    });

    it('should remove the card from the deck after getting it', () => {
      const initialDeck = JSON.parse(mockStorage['cardDeck']);
      const initialLength = initialDeck.length;

      service.getRandomCard();

      const updatedDeck = JSON.parse(mockStorage['cardDeck']);
      expect(updatedDeck.length).toBe(initialLength - 1);
    });

    it('should reduce deck size by 1 for each call', () => {
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(52);

      service.getRandomCard();
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(51);

      service.getRandomCard();
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(50);

      service.getRandomCard();
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(49);
    });

    it('should save the updated deck to local storage', () => {
      const saveCallCountBefore = mockLocalService.saveData.calls.count();

      service.getRandomCard();

      expect(mockLocalService.saveData.calls.count()).toBeGreaterThan(saveCallCountBefore);
    });

    it('should return cards from the deck', () => {
      const initialDeck: CardType[] = JSON.parse(mockStorage['cardDeck']);
      const card = service.getRandomCard();

      const cardExistsInOriginalDeck = initialDeck.some((c) => c.value === card.value && c.suit === card.suit);
      expect(cardExistsInOriginalDeck).toBe(true);
    });

    it('should not have the returned card in the deck anymore', () => {
      const card = service.getRandomCard();
      const updatedDeck: CardType[] = JSON.parse(mockStorage['cardDeck']);

      const cardStillInDeck = updatedDeck.some((c) => c.value === card.value && c.suit === card.suit);
      expect(cardStillInDeck).toBe(false);
    });

    it('should be able to draw all 52 cards', () => {
      const drawnCards: CardType[] = [];

      for (let i = 0; i < 52; i++) {
        drawnCards.push(service.getRandomCard());
      }

      expect(drawnCards.length).toBe(52);

      const remainingDeck = JSON.parse(mockStorage['cardDeck']);
      expect(remainingDeck.length).toBe(0);
    });

    it('should draw all unique cards when exhausting the deck', () => {
      const drawnCards: CardType[] = [];

      for (let i = 0; i < 52; i++) {
        drawnCards.push(service.getRandomCard());
      }

      const cardKeys = drawnCards.map((card) => `${card.value}_${card.suit}`);
      const uniqueKeys = new Set(cardKeys);

      expect(uniqueKeys.size).toBe(52);
    });
  });

  describe('getRandomCard - Edge Cases (Empty Deck)', () => {
    it('should return undefined when deck is empty', () => {
      // Set up an empty deck
      mockStorage['cardDeck'] = JSON.stringify([]);

      const card = service.getRandomCard();

      expect(card).toBeUndefined();
    });

    it('should handle empty deck without throwing an error', () => {
      mockStorage['cardDeck'] = JSON.stringify([]);

      expect(() => service.getRandomCard()).not.toThrow();
    });

    it('should return undefined after all cards have been drawn', () => {
      service.constructDeck();

      // Draw all 52 cards
      for (let i = 0; i < 52; i++) {
        service.getRandomCard();
      }

      // Try to draw one more
      const card = service.getRandomCard();
      expect(card).toBeUndefined();
    });
  });

  describe('resetCards', () => {
    it('should clear the createdCardDeck array', () => {
      service.constructDeck();
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(52);

      service.resetCards();

      expect(service.createdCardDeck).toEqual([]);
    });

    it('should save empty deck to local storage', () => {
      service.constructDeck();

      service.resetCards();

      const savedDeck = JSON.parse(mockStorage['cardDeck']);
      expect(savedDeck).toEqual([]);
    });
  });

  describe('Deck Structure Verification', () => {
    let deck: CardType[];

    beforeEach(() => {
      deck = service.constructDeck();
    });

    it('should have exactly one Ace of Hearts', () => {
      const aceOfHearts = deck.filter((card) => card.value === 'A' && card.suit === 'hearts');
      expect(aceOfHearts.length).toBe(1);
    });

    it('should have exactly one King of Spades', () => {
      const kingOfSpades = deck.filter((card) => card.value === 'K' && card.suit === 'spades');
      expect(kingOfSpades.length).toBe(1);
    });

    it('should have exactly one Queen of Diamonds (diams)', () => {
      const queenOfDiams = deck.filter((card) => card.value === 'Q' && card.suit === 'diams');
      expect(queenOfDiams.length).toBe(1);
    });

    it('should have exactly one Jack of Clubs', () => {
      const jackOfClubs = deck.filter((card) => card.value === 'J' && card.suit === 'clubs');
      expect(jackOfClubs.length).toBe(1);
    });

    it('should have all face cards (J, Q, K) for all suits', () => {
      const faceValues = ['J', 'Q', 'K'];

      for (const value of faceValues) {
        for (const suit of expectedSuits) {
          const card = deck.find((c) => c.value === value && c.suit === suit);
          expect(card).toBeDefined();
        }
      }
    });

    it('should have all number cards (2-10) for all suits', () => {
      const numberValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

      for (const value of numberValues) {
        for (const suit of expectedSuits) {
          const card = deck.find((c) => c.value === value && c.suit === suit);
          expect(card).toBeDefined();
        }
      }
    });

    it('should have all Aces for all suits', () => {
      for (const suit of expectedSuits) {
        const ace = deck.find((c) => c.value === 'A' && c.suit === suit);
        expect(ace).toBeDefined();
      }
    });

    it('all cards should have sips initialized to 0', () => {
      const allZeroSips = deck.every((card) => card.sips === 0);
      expect(allZeroSips).toBe(true);
    });

    it('all cards should have selected initialized to false', () => {
      const allNotSelected = deck.every((card) => card.selected === false);
      expect(allNotSelected).toBe(true);
    });

    it('all cards should have givenSips initialized to undefined', () => {
      const allUndefinedGivenSips = deck.every((card) => card.givenSips === undefined);
      expect(allUndefinedGivenSips).toBe(true);
    });
  });

  describe('Cards Removed After getRandomCard Calls', () => {
    beforeEach(() => {
      service.constructDeck();
    });

    it('should have 51 cards after drawing 1 card', () => {
      service.getRandomCard();

      const deck = JSON.parse(mockStorage['cardDeck']);
      expect(deck.length).toBe(51);
    });

    it('should have 42 cards after drawing 10 cards', () => {
      for (let i = 0; i < 10; i++) {
        service.getRandomCard();
      }

      const deck = JSON.parse(mockStorage['cardDeck']);
      expect(deck.length).toBe(42);
    });

    it('should have 26 cards after drawing half the deck', () => {
      for (let i = 0; i < 26; i++) {
        service.getRandomCard();
      }

      const deck = JSON.parse(mockStorage['cardDeck']);
      expect(deck.length).toBe(26);
    });

    it('should have 0 cards after drawing all 52 cards', () => {
      for (let i = 0; i < 52; i++) {
        service.getRandomCard();
      }

      const deck = JSON.parse(mockStorage['cardDeck']);
      expect(deck.length).toBe(0);
    });

    it('drawn cards should not be found in remaining deck', () => {
      const drawnCards: CardType[] = [];

      // Draw 10 cards
      for (let i = 0; i < 10; i++) {
        drawnCards.push(service.getRandomCard());
      }

      const remainingDeck: CardType[] = JSON.parse(mockStorage['cardDeck']);

      // Verify none of the drawn cards are in the remaining deck
      for (const drawnCard of drawnCards) {
        const foundInDeck = remainingDeck.some((c) => c.value === drawnCard.value && c.suit === drawnCard.suit);
        expect(foundInDeck).toBe(false);
      }
    });
  });

  describe('getDeck (via LocalService)', () => {
    it('should persist deck state across multiple operations', () => {
      // Construct deck
      service.constructDeck();
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(52);

      // Draw some cards
      service.getRandomCard();
      service.getRandomCard();
      service.getRandomCard();

      // Verify persistence
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(49);
    });

    it('should allow reconstructing deck after partial use', () => {
      // Construct and partially use deck
      service.constructDeck();
      service.getRandomCard();
      service.getRandomCard();

      // Reconstruct
      service.constructDeck();

      // Should be back to 52
      expect(JSON.parse(mockStorage['cardDeck']).length).toBe(52);
    });
  });

  describe('Double Deck (>10 players)', () => {
    beforeEach(() => {
      // Set up 11 players
      Object.defineProperty(mockPlayerHelperService, 'players', {
        value: new Array(11).fill({}),
        writable: true,
      });
    });

    it('should create 104 cards for double deck', () => {
      const deck = service.constructDeck();
      expect(deck.length).toBe(104);
    });

    it('should have exactly 2 of each card in double deck', () => {
      const deck = service.constructDeck();

      for (const suit of expectedSuits) {
        for (const value of expectedValues) {
          const matchingCards = deck.filter((c) => c.value === value && c.suit === suit);
          expect(matchingCards.length).toBe(2);
        }
      }
    });

    it('should have 26 cards of each suit in double deck', () => {
      const deck = service.constructDeck();

      for (const suit of expectedSuits) {
        const cardsOfSuit = deck.filter((c) => c.suit === suit);
        expect(cardsOfSuit.length).toBe(26);
      }
    });

    it('should have 8 cards of each value in double deck', () => {
      const deck = service.constructDeck();

      for (const value of expectedValues) {
        const cardsOfValue = deck.filter((c) => c.value === value);
        expect(cardsOfValue.length).toBe(8);
      }
    });
  });
});
