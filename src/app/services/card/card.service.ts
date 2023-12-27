import {Injectable} from '@angular/core';
import {CardType} from 'src/app/_shared/_models/card-type.model';
import {CardValueEnum} from 'src/app/_shared/_models/enums/card_value.enum';
import {PlayerModel} from "../../_shared/_models/player.model";
import {LocalService} from "../local/local.service";
import {Game} from "../../_shared/_models/game.model";
import {BehaviorSubject} from "rxjs";
import {GameService} from "../game/game.service";


@Injectable({
  providedIn: 'root'
})
export class CardService {


  constructor(public gameSrv: GameService) {
  }

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
  //
  // addGivenSips(player: PlayerModel, card: CardType, nbSips: number) {
  //   const plyr = this.gameSrv.game.players.find((playerSelected: PlayerModel) => playerSelected.id === player.id);
  //
  //   plyr?.cards.forEach((cardSelected: CardType) => {
  //    if(cardSelected === card) {
  //      cardSelected.givenSips = nbSips;
  //    }
  //   }
  //
  //
  // }
}
