import { Component, HostListener } from '@angular/core';
import { CardDeckHelperService } from 'src/app/_shared/_helpers/card-deck.helper';
import { PlayerHelperService } from 'src/app/_shared/_helpers/player.helper';
import { CardType } from 'src/app/_shared/_models/card-type.model';
import { PlayerModel } from 'src/app/_shared/_models/player.model';
import { GameService } from "../../services/game/game.service";

@Component({
  selector: 'app-second-phase',
  templateUrl: './second-phase.component.html',
  styleUrls: ['./second-phase.component.scss'],
})
export class secondPhaseComponent {
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'B' || event.key === 'b' || event.key === 'D' || event.key === 'd') {
      if (this.numSips < 13) {
        this.onDisplayCard();
      }
    }
  }

  public numSips: number = 1;
  public cptNumSips: number = 1;
  public youDrink: CardType[] = [];
  public takeDrink: CardType[] = [];
  public players: PlayerModel[] = [];

  constructor(
    public cardDeckHelperService: CardDeckHelperService,
    playerHelperService: PlayerHelperService,
    public gameSrv: GameService
  ) {
    this.players = playerHelperService.players;
  }

  onDisplayCard() {
    let card: CardType = this.cardDeckHelperService.getRandomCard();
    card.swallow = this.cptNumSips;

    this.players.forEach((players) => {
      return players.cards.forEach((cards: CardType) => {
        cards.selected = cards.value === card.value;
        return cards;
      });
    });

    if (this.numSips % 2 == 0) {
      this.takeDrink.push(card);
      this.cptNumSips++;
    } else {
      this.youDrink.push(card);
    }
    this.numSips++;
  }

  restartGame() {
    location.reload();
  }
}
