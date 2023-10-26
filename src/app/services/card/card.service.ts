import { Injectable } from '@angular/core';
import { CardType } from 'src/app/_shared/_models/card-type.model';
import { CardValueEnum } from 'src/app/_shared/_models/enums/card_value.enum';


@Injectable({
  providedIn: 'root'
})
export class CardService {

  /**
   *
   * @param card
   * @returns {number}
   */
  getCardValue(card: CardType) {
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
}
