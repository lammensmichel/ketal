import { Component, Input, OnInit } from '@angular/core';
import { CardType } from '../../_models/card-type.model';

@Component({
  selector: 'app-playing-card',
  templateUrl: './playing-card.component.html',
  styleUrls: ['./playing-card.component.scss']
})
export class PlayingCardComponent implements OnInit {
  @Input() card: CardType | undefined;

  public suit: string = '';

  constructor() {

  }

  ngOnInit(): void {
    if (this.card) {
      this.suit = this.card.suit || '';
    }
  }


}

