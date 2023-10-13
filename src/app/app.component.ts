import { Component } from '@angular/core';
import { CardDeckHelperService } from 'src/helpers/card-deck.helper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ketal';
  public displayPlayerChoice: boolean = true;
  public displaySecondPhase: boolean = false;

  constructor(public cardDeckHelperService: CardDeckHelperService) {
    cardDeckHelperService.construcDesck();
  }

  public beginGame(): void {
    this.cardDeckHelperService.construcDesck();

    this.displayPlayerChoice = !this.displayPlayerChoice;
  }

  beginSecondPhase() {
    this.displaySecondPhase = !this.displaySecondPhase;
  }
}
