import {Component, OnInit} from '@angular/core';
import {GameService} from "../app/services/game/game.service";
import {Game} from "../models/game.model";
import {PlayerModel} from "../models/player.model";
import {CardType} from "../models/card-type.model";
import {CardService} from "../app/services/card/card.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {

  public playerCount: number = 0;
  public game: Game | undefined;


  constructor(
    public gameSrv: GameService,
    public cardSrv: CardService) {
  }

  public ngOnInit(): void {
    this.playerCount = this.gameSrv.game.players.length;
    this.gameSrv.game.maxTurnCount = this.playerCount * 4;
    this.game = this.gameSrv.game;
  }

  displaySwallow(player: PlayerModel) {
    const currentIndex = this.gameSrv.game.players.findIndex(player => player.id === this.game?.activePlayer?.id);
    const previousPlayer = currentIndex === 0 ? this.gameSrv.game.players[this.gameSrv.game.players.length - 1] : this.gameSrv.game.players[currentIndex - 1];

    if (this.gameSrv.game.phase === 1) {
      if (this.gameSrv.game.players[currentIndex].cards.length < this.gameSrv.game.turn) {
        if (previousPlayer && player.id === previousPlayer.id) {
          return true
        }
      }
    } else {
      const drinkingCardsLength = this.gameSrv.game.drinkingCards.length,
        givingCardsLength = this.gameSrv.game.givingCards.length;

      if(drinkingCardsLength === 0 && givingCardsLength === 0 ) {
        return player === this.gameSrv.game.players[this.gameSrv.game.players.length-1];
      }

        // return this.gameSrv.game.drinkingCards.length < 0
      return true;
    }
    return false;
  }

  getSwallowCnt(player: PlayerModel) {
    if (this.gameSrv.game.phase === 1) {
      if (player.cards.length > 0) {
        return player.cards[player.cards.length - 1].swallow;
      } else {
        return 0;
      }
    } else {
      const drinkingCardsLength = this.gameSrv.game.drinkingCards.length,
        givingCardsLength = this.gameSrv.game.givingCards.length;

      let cntNbSwallow = 0;

      if(drinkingCardsLength === 0 && givingCardsLength === 0 ){
       return     player.cards[3].swallow;
      }


      if (drinkingCardsLength > givingCardsLength) {
        player.cards.forEach((card: CardType) => {
          if (this.cardSrv.getCardValue(card) === this.cardSrv.getCardValue(this.gameSrv.game.drinkingCards[drinkingCardsLength - 1])) {
            cntNbSwallow += drinkingCardsLength;
          }
        })
      }

      if (drinkingCardsLength == givingCardsLength) {
        player.cards.forEach((card: CardType) => {
          if (this.cardSrv.getCardValue(card) === this.cardSrv.getCardValue(this.gameSrv.game.givingCards[drinkingCardsLength - 1])) {
            cntNbSwallow -= givingCardsLength;
          }
        })
      }
      console.log(cntNbSwallow);
      return cntNbSwallow;
    }
  }

}
