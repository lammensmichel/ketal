import {Component, HostListener} from '@angular/core';
import {CardDeckHelperService} from 'src/helpers/card-deck.helper';
import {PlayerHelperService} from 'src/helpers/player.helper';
import {CardType} from 'src/models/card-type.model';
import {PlayerModel} from 'src/models/player.model';
import {GameService} from "../app/services/game/game.service";

@Component({
  selector: 'app-second-phase',
  templateUrl: './second-phase.component.html',
  styleUrls: ['./second-phase.component.scss'],
})
export class secondPhaseComponent {
  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'B' || event.key === 'b' || event.key === 'D' || event.key === 'd') {
      // Handle 'B' or 'b' key press here
      if (this.numSips < 13) {
        this.onDisplayCard();
      }
    }
  }

  public numSips: number = 1;
  public cptNumSips: number = 1;
  public youdrink: CardType[] = [];
  public takedrink: CardType[] = [];
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
      return players.cards.forEach((cards) => {
        cards.selected = cards.value === card.value;
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
