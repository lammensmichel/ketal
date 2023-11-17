import { Component, OnInit } from '@angular/core';
import { Game } from 'src/app/_shared/_models/game.model';
import { PlayerModel } from 'src/app/_shared/_models/player.model';
import { CardService } from "../../../services/card/card.service";
import { GameService } from "../../../services/game/game.service";

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

  getSwallowCnt(player: PlayerModel, absolute: boolean = false) {
    const { activePlayer, drinkingCards, givingCards, phase, players } = this.gameSrv.game;
    const currentIndex = players.findIndex(player => player.id === activePlayer?.id);
    const previousPlayer = currentIndex === 0 ? players[players.length - 1] : players[currentIndex - 1];
    const maybeAbs = absolute ? Math.abs : (v: number) => v;
    if (phase === 1) {
      // Should be 0 for player who is not the previous player
      if (player.id !== previousPlayer.id) {
        return 0;
      }
      return maybeAbs(-(player.cards.at(-1)?.swallow ?? 0));
    } else {
      if ( player.id === previousPlayer.id && drinkingCards.length === 0  &&  givingCards.length === 0) {
        return maybeAbs(-(player.cards.at(-1)?.swallow ?? 0));
      }
    }

    let cntNbSwallow = 0;
    const isOdd = (drinkingCards.length + givingCards.length) % 2 === 1;
    for (const card of player.cards) {
      const playerCardValue = this.cardSrv.getCardValue(card);
      const lastCardValue = isOdd ? this.cardSrv.getCardValue(drinkingCards.at(-1)!) : this.cardSrv.getCardValue(givingCards.at(-1)!);
      if (playerCardValue === lastCardValue) {
        cntNbSwallow += drinkingCards.length * (isOdd ? -1 : 1);
      }
    }

    return maybeAbs(cntNbSwallow);
  }
}
