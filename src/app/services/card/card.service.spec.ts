import { TestBed } from '@angular/core/testing';
import { CardService } from './card.service';
import { CardType } from 'src/app/_shared/_models/card-type.model';
import { CardValueEnum } from 'src/app/_shared/_models/enums/card_value.enum';
import { SuitsEnum } from 'src/app/_shared/_models/enums/suits.enum';

describe('CardService', () => {
  let service: CardService;

  // Helper function to create mock cards
  const createMockCard = (value: string | null, suit: string | null): CardType => ({
    value,
    suit,
    icon: null,
    sips: 0,
    selected: false,
    img: null,
    givenSips: undefined,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardService],
    });
    service = TestBed.inject(CardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCardValue', () => {
    it('should return 14 for Ace', () => {
      const card = createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(14);
    });

    it('should return 11 for Jack', () => {
      const card = createMockCard(CardValueEnum.Jack, SuitsEnum.Spades);
      expect(service.getCardValue(card)).toBe(11);
    });

    it('should return 12 for Queen', () => {
      const card = createMockCard(CardValueEnum.Queen, SuitsEnum.Diams);
      expect(service.getCardValue(card)).toBe(12);
    });

    it('should return 13 for King', () => {
      const card = createMockCard(CardValueEnum.King, SuitsEnum.Clubs);
      expect(service.getCardValue(card)).toBe(13);
    });

    it('should return 2 for Two', () => {
      const card = createMockCard(CardValueEnum.Two, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(2);
    });

    it('should return 3 for Three', () => {
      const card = createMockCard(CardValueEnum.Three, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(3);
    });

    it('should return 4 for Four', () => {
      const card = createMockCard(CardValueEnum.Four, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(4);
    });

    it('should return 5 for Five', () => {
      const card = createMockCard(CardValueEnum.FIve, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(5);
    });

    it('should return 6 for Six', () => {
      const card = createMockCard(CardValueEnum.Six, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(6);
    });

    it('should return 7 for Seven', () => {
      const card = createMockCard(CardValueEnum.Seven, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(7);
    });

    it('should return 8 for Eight', () => {
      const card = createMockCard(CardValueEnum.Eight, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(8);
    });

    it('should return 9 for Nine', () => {
      const card = createMockCard(CardValueEnum.Nine, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(9);
    });

    it('should return 10 for Ten', () => {
      const card = createMockCard(CardValueEnum.Ten, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(10);
    });

    it('should return 0 for card with null value', () => {
      const card = createMockCard(null, SuitsEnum.Hearts);
      expect(service.getCardValue(card)).toBe(0);
    });

    it('should return 0 for undefined card', () => {
      expect(service.getCardValue(undefined as unknown as CardType)).toBe(0);
    });

    it('should return 0 for null card', () => {
      expect(service.getCardValue(null as unknown as CardType)).toBe(0);
    });
  });

  describe('isRedCard', () => {
    it('should return true for Hearts', () => {
      const card = createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts);
      expect(service.isRedCard(card)).toBe(true);
    });

    it('should return true for Diamonds (Diams)', () => {
      const card = createMockCard(CardValueEnum.King, SuitsEnum.Diams);
      expect(service.isRedCard(card)).toBe(true);
    });

    it('should return false for Spades', () => {
      const card = createMockCard(CardValueEnum.Queen, SuitsEnum.Spades);
      expect(service.isRedCard(card)).toBe(false);
    });

    it('should return false for Clubs', () => {
      const card = createMockCard(CardValueEnum.Jack, SuitsEnum.Clubs);
      expect(service.isRedCard(card)).toBe(false);
    });

    it('should return false for card with null suit', () => {
      const card = createMockCard(CardValueEnum.Ace, null);
      expect(service.isRedCard(card)).toBe(false);
    });
  });

  describe('isBlackCard', () => {
    it('should return true for Spades', () => {
      const card = createMockCard(CardValueEnum.Ace, SuitsEnum.Spades);
      expect(service.isBlackCard(card)).toBe(true);
    });

    it('should return true for Clubs', () => {
      const card = createMockCard(CardValueEnum.King, SuitsEnum.Clubs);
      expect(service.isBlackCard(card)).toBe(true);
    });

    it('should return false for Hearts', () => {
      const card = createMockCard(CardValueEnum.Queen, SuitsEnum.Hearts);
      expect(service.isBlackCard(card)).toBe(false);
    });

    it('should return false for Diamonds (Diams)', () => {
      const card = createMockCard(CardValueEnum.Jack, SuitsEnum.Diams);
      expect(service.isBlackCard(card)).toBe(false);
    });

    it('should return false for card with null suit', () => {
      const card = createMockCard(CardValueEnum.Ace, null);
      expect(service.isBlackCard(card)).toBe(false);
    });
  });

  describe('lowerOrUpperCard', () => {
    it('should return -1 when first card is lower than second', () => {
      const card1 = createMockCard(CardValueEnum.Two, SuitsEnum.Hearts);
      const card2 = createMockCard(CardValueEnum.King, SuitsEnum.Spades);
      expect(service.lowerOrUpperCard(card1, card2)).toBe(-1);
    });

    it('should return 1 when first card is higher than second', () => {
      const card1 = createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts);
      const card2 = createMockCard(CardValueEnum.Two, SuitsEnum.Spades);
      expect(service.lowerOrUpperCard(card1, card2)).toBe(1);
    });

    it('should return 0 when both cards have same value', () => {
      const card1 = createMockCard(CardValueEnum.Queen, SuitsEnum.Hearts);
      const card2 = createMockCard(CardValueEnum.Queen, SuitsEnum.Spades);
      expect(service.lowerOrUpperCard(card1, card2)).toBe(0);
    });

    it('should correctly compare Jack (11) and Ten (10)', () => {
      const jack = createMockCard(CardValueEnum.Jack, SuitsEnum.Hearts);
      const ten = createMockCard(CardValueEnum.Ten, SuitsEnum.Spades);
      expect(service.lowerOrUpperCard(jack, ten)).toBe(1);
      expect(service.lowerOrUpperCard(ten, jack)).toBe(-1);
    });

    it('should correctly compare face cards', () => {
      const jack = createMockCard(CardValueEnum.Jack, SuitsEnum.Hearts);
      const queen = createMockCard(CardValueEnum.Queen, SuitsEnum.Spades);
      const king = createMockCard(CardValueEnum.King, SuitsEnum.Diams);
      const ace = createMockCard(CardValueEnum.Ace, SuitsEnum.Clubs);

      expect(service.lowerOrUpperCard(jack, queen)).toBe(-1);
      expect(service.lowerOrUpperCard(queen, king)).toBe(-1);
      expect(service.lowerOrUpperCard(king, ace)).toBe(-1);
      expect(service.lowerOrUpperCard(ace, jack)).toBe(1);
    });
  });

  describe('lowestCard', () => {
    it('should return the lowest card from an array', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.King, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Two, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Queen, SuitsEnum.Diams),
      ];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Two);
    });

    it('should return the only card when array has single element', () => {
      const cards: CardType[] = [createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts)];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Ace);
    });

    it('should return first card when all cards have same value', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Seven, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Seven, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Seven, SuitsEnum.Diams),
      ];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Seven);
      expect(result.suit).toBe(SuitsEnum.Hearts);
    });

    it('should handle array with all face cards', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.King, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Jack, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Queen, SuitsEnum.Diams),
        createMockCard(CardValueEnum.Ace, SuitsEnum.Clubs),
      ];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Jack);
    });

    it('should return Two (lowest possible) when present', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Two, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Ten, SuitsEnum.Diams),
      ];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Two);
    });

    it('should return undefined for empty array', () => {
      const cards: CardType[] = [];
      const result = service.lowestCard(cards);
      expect(result).toBeUndefined();
    });

    it('should handle mixed number and face cards', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Three, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Jack, SuitsEnum.Spades),
        createMockCard(CardValueEnum.FIve, SuitsEnum.Diams),
        createMockCard(CardValueEnum.Nine, SuitsEnum.Clubs),
      ];
      const result = service.lowestCard(cards);
      expect(result.value).toBe(CardValueEnum.Three);
    });
  });

  describe('greatestCard', () => {
    it('should return the greatest card from an array', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.King, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Two, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Queen, SuitsEnum.Diams),
      ];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.King);
    });

    it('should return the only card when array has single element', () => {
      const cards: CardType[] = [createMockCard(CardValueEnum.Two, SuitsEnum.Hearts)];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.Two);
    });

    it('should return first card when all cards have same value', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Seven, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Seven, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Seven, SuitsEnum.Diams),
      ];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.Seven);
      expect(result.suit).toBe(SuitsEnum.Hearts);
    });

    it('should handle array with all face cards', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.King, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Jack, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Queen, SuitsEnum.Diams),
        createMockCard(CardValueEnum.Ace, SuitsEnum.Clubs),
      ];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.Ace);
    });

    it('should return Ace (highest possible) when present', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Two, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Ten, SuitsEnum.Diams),
      ];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.Ace);
    });

    it('should return undefined for empty array', () => {
      const cards: CardType[] = [];
      const result = service.greatestCard(cards);
      expect(result).toBeUndefined();
    });

    it('should handle mixed number and face cards', () => {
      const cards: CardType[] = [
        createMockCard(CardValueEnum.Three, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Jack, SuitsEnum.Spades),
        createMockCard(CardValueEnum.FIve, SuitsEnum.Diams),
        createMockCard(CardValueEnum.Nine, SuitsEnum.Clubs),
      ];
      const result = service.greatestCard(cards);
      expect(result.value).toBe(CardValueEnum.Jack);
    });

    it('should find greatest when Ace is at different positions', () => {
      // Ace at beginning
      let cards: CardType[] = [
        createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Two, SuitsEnum.Spades),
        createMockCard(CardValueEnum.King, SuitsEnum.Diams),
      ];
      expect(service.greatestCard(cards).value).toBe(CardValueEnum.Ace);

      // Ace in middle
      cards = [
        createMockCard(CardValueEnum.Two, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.Ace, SuitsEnum.Spades),
        createMockCard(CardValueEnum.King, SuitsEnum.Diams),
      ];
      expect(service.greatestCard(cards).value).toBe(CardValueEnum.Ace);

      // Ace at end
      cards = [
        createMockCard(CardValueEnum.Two, SuitsEnum.Hearts),
        createMockCard(CardValueEnum.King, SuitsEnum.Spades),
        createMockCard(CardValueEnum.Ace, SuitsEnum.Diams),
      ];
      expect(service.greatestCard(cards).value).toBe(CardValueEnum.Ace);
    });
  });

  describe('isRedCard and isBlackCard consistency', () => {
    it('should be mutually exclusive for all suits', () => {
      const suits = [SuitsEnum.Hearts, SuitsEnum.Diams, SuitsEnum.Spades, SuitsEnum.Clubs];

      suits.forEach((suit) => {
        const card = createMockCard(CardValueEnum.Ace, suit);
        const isRed = service.isRedCard(card);
        const isBlack = service.isBlackCard(card);

        // A card should be either red or black, never both or neither
        expect(isRed !== isBlack).toBe(true);
      });
    });

    it('should correctly categorize all suits', () => {
      const heartsCard = createMockCard(CardValueEnum.Ace, SuitsEnum.Hearts);
      const diamsCard = createMockCard(CardValueEnum.Ace, SuitsEnum.Diams);
      const spadesCard = createMockCard(CardValueEnum.Ace, SuitsEnum.Spades);
      const clubsCard = createMockCard(CardValueEnum.Ace, SuitsEnum.Clubs);

      // Red cards
      expect(service.isRedCard(heartsCard)).toBe(true);
      expect(service.isBlackCard(heartsCard)).toBe(false);
      expect(service.isRedCard(diamsCard)).toBe(true);
      expect(service.isBlackCard(diamsCard)).toBe(false);

      // Black cards
      expect(service.isRedCard(spadesCard)).toBe(false);
      expect(service.isBlackCard(spadesCard)).toBe(true);
      expect(service.isRedCard(clubsCard)).toBe(false);
      expect(service.isBlackCard(clubsCard)).toBe(true);
    });
  });

  describe('card value ordering', () => {
    it('should maintain correct order: 2 < 3 < ... < 10 < J < Q < K < A', () => {
      const allValues = [
        CardValueEnum.Two,
        CardValueEnum.Three,
        CardValueEnum.Four,
        CardValueEnum.FIve,
        CardValueEnum.Six,
        CardValueEnum.Seven,
        CardValueEnum.Eight,
        CardValueEnum.Nine,
        CardValueEnum.Ten,
        CardValueEnum.Jack,
        CardValueEnum.Queen,
        CardValueEnum.King,
        CardValueEnum.Ace,
      ];

      for (let i = 0; i < allValues.length - 1; i++) {
        const lowerCard = createMockCard(allValues[i], SuitsEnum.Hearts);
        const higherCard = createMockCard(allValues[i + 1], SuitsEnum.Hearts);

        expect(service.getCardValue(lowerCard)).toBeLessThan(service.getCardValue(higherCard));
        expect(service.lowerOrUpperCard(lowerCard, higherCard)).toBe(-1);
        expect(service.lowerOrUpperCard(higherCard, lowerCard)).toBe(1);
      }
    });
  });
});
