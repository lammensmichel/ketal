import {Injectable} from '@angular/core';
import {CardType} from "../../../models/card-type.model";

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
    if (card) {
      if (card.value) {
        switch (card.value) {
          case 'A' :
            value = 14;
            break;
          case 'J' :
            value = 11;
            break;
          case  'Q' :
            value = 12;
            break;
          case  'K' :
            value = 13;
            break;
          default:
            value = parseInt(card.value);
        }
      }
    }

    return value;
  }
}
