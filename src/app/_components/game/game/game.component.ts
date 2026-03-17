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
    const maybeAbs = absolute ? Math.abs : (v: number) => v;

    // Accumulate total sips from all cards assigned to this player
    let totalSwallow = 0;
    for (const card of player.cards) {
      totalSwallow += card.swallow ?? 0;
    }

    const { drinkingCards, givingCards, phase } = this.gameSrv.game;

    // In phase 2, also count sips from matching cards in the current pyramid round
    if (phase === 2 && (drinkingCards.length > 0 || givingCards.length > 0)) {
      const isOdd = (drinkingCards.length + givingCards.length) % 2 === 1;
      const lastCard = isOdd ? drinkingCards.at(-1) : givingCards.at(-1);
      if (lastCard) {
        const lastCardValue = this.cardSrv.getCardValue(lastCard);
        for (const card of player.cards) {
          const playerCardValue = this.cardSrv.getCardValue(card);
          if (playerCardValue === lastCardValue) {
            totalSwallow += (drinkingCards.length + givingCards.length) * (isOdd ? -1 : 1);
          }
        }
      }
    }

    return maybeAbs(totalSwallow);
  }
}
