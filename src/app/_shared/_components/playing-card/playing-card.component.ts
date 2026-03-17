import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardType } from '../../_models/card-type.model';

@Component({
  selector: 'app-playing-card',
  templateUrl: './playing-card.component.html',
  styleUrls: ['./playing-card.component.scss'],
  standalone: true,
  imports: [NgClass],
})
export class PlayingCardComponent {
  @Input() card: CardType | undefined;
  @Input() leftOverlap = false;
}
