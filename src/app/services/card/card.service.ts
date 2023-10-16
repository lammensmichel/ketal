import {Injectable} from '@angular/core';
import {CardType} from "../../../models/card-type.model";

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
  getCardValue(card: CardType) {
    let value = 0;
    if (card) {
      if (card.value) {
        switch (true) {
          case card.value === 'A' :
            value = 14;
            break;
          case (parseInt(card.value, 10) >= 2) && (parseInt(card.value, 10) <= 10):
            value = parseInt(card.value);
            break;
          case card.value === 'J' :
            value = 11;
            break;
          case card.value === 'Q' :
            value = 12;
            break;
          case card.value === 'K' :
            value = 13;
            break;
        }
      }
    }
    return value;

  }
}
