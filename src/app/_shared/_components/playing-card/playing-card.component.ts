import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  /** When true, card starts face-down and flips when `flipped` becomes true */
  @Input() faceDown = false;
  /** Whether the face-down card has been flipped to reveal its face */
  @Input() flipped = false;
  /** Glow color for Phase 2 distinction: 'red' (drink), 'green' (give), 'none' */
  @Input() glowColor: 'red' | 'green' | 'none' = 'none';
  /** Whether this card can be tapped (next card in pyramid) */
  @Input() tappable = false;
  /** Emitted when a tappable card is tapped */
  @Output() cardTapped = new EventEmitter<void>();

  onCardClick(): void {
    if (this.tappable) {
      this.cardTapped.emit();
    }
  }
}
