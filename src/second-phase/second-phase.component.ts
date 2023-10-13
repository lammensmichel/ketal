import { Component } from '@angular/core';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';
import { PlayerHelperService } from 'src/helpers/player.helper';
import { CardType } from 'src/models/card-type.model';
import { PlayerModel } from 'src/models/player.model';

@Component({
  selector: 'app-second-phase',
  templateUrl: './second-phase.component.html',
  styleUrls: ['./second-phase.component.scss'],
})
export class secondPhaseComponent {
  public numSips: number = 1;
  public cptNumSips: number = 1;

  public youdrink: CardType[] = [];

  public takedrink: CardType[] = [];
  players: PlayerModel[] = [];

  constructor(
    public cardDeckHelperService: CardDeckHelperService,
    playerHelperService: PlayerHelperService
  ) {
    this.players = playerHelperService.players;
  }

  onNextClick() {
    let card = this.cardDeckHelperService.getRandomCard();
    card.Sips = this.cptNumSips;

    this.players.forEach((players) => {
      return players.cards.forEach((cards) => {
        cards.SipsSelected = cards.value === card.value;
        return cards;
      });
    });

    if (this.numSips % 2 == 0) {
      this.takedrink.push(card);
      this.cptNumSips++;
    } else {
      this.youdrink.push(card);
    }
    this.numSips++;
  }

  restartGame() {
    location.reload();
  }
}
