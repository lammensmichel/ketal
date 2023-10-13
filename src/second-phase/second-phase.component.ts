import { Component } from '@angular/core';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';

@Component({
  selector: 'app-second-phase',
  templateUrl: './second-phase.component.html',
  styleUrls: ['./second-phase.component.scss'],
})
export class secondPhaseComponent {
  public numSips: number = 1;

  public youdrink: any[] = [];

  public takedrink: any[] = [];

  constructor(public cardDeckHelperService: CardDeckHelperService) {
    cardDeckHelperService.construcDesck();
  }

  onNextClick() {
    if (this.numSips % 2 == 0) {
      this.takedrink.push(this.cardDeckHelperService.getRandomCard());
    } else {
      this.youdrink.push(this.cardDeckHelperService.getRandomCard());
    }
    this.numSips++;
  }
}
