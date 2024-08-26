import {Injectable} from '@angular/core';
import {CardType} from 'src/app/_shared/_models/card-type.model';
import {CardValueEnum} from 'src/app/_shared/_models/enums/card_value.enum';
import {SuitsEnum} from "../../_shared/_models/enums/suits.enum";


@Injectable({
  providedIn: 'root'
})
export class CardService {


  constructor() {
  }

  /**
   *
   * @param card
   * @returns {number}
   */
  getCardValue(card: CardType): number {
    let value = 0;

    if (card?.value) {
      switch (card.value) {
        case CardValueEnum.Ace:
          value = 14;
          break;
        case CardValueEnum.Jack:
          value = 11;
          break;
        case CardValueEnum.Queen:
          value = 12;
          break;
        case CardValueEnum.King:
          value = 13;
          break;
        default:
          value = parseInt(card.value);
      }
    }

    return value;
  }

  /**
   * Compare two cards
   * @param card1
   * @param card2
   * @returns {number} -1 if card1 < card2, 0 if card1 === card2, 1 if card1 > card2
   */
  lowerOrUpperCard(card1: CardType, card2: CardType): number {
    let lnRet: number = -2;
    switch (true) {
      case this.getCardValue(card1) === this.getCardValue(card2):
        lnRet =  0;
        break;
      case this.getCardValue(card1) < this.getCardValue(card2):
        lnRet =  -1;
        break;
      case this.getCardValue(card1) > this.getCardValue(card2):
        lnRet =  1;
        break;
    }
    return lnRet;
  }

  lowestCard(cards: Array<CardType>): CardType {
    let lowestCard: CardType = cards[0];
    for (const card of cards) {
      if (this.lowerOrUpperCard(card, lowestCard) === -1) {
        lowestCard = card;
      }
    }
    return lowestCard;
  }

  greatestCard(cards: Array<CardType>): CardType {
    let greatestCard: CardType = cards[0];
    for (const card of cards) {
      if (this.lowerOrUpperCard(card, greatestCard) === 1) {
        greatestCard = card;
      }
    }
    return greatestCard;
  }

  isRedCard(card: CardType): boolean {
    return card.suit === SuitsEnum.Diams || card.suit === SuitsEnum.Hearts;
  }

  isBlackCard(card: CardType): boolean {
    return card.suit === SuitsEnum.Spades || card.suit === SuitsEnum.Clubs;
  }

}
