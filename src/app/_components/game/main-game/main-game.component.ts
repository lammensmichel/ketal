import { Component, inject } from '@angular/core';
import { GameService } from '../../../services/game/game.service';
import { PlayerCardComponent } from '../../players/player-card/player-card.component';
import { GameSummaryComponent } from '../game-summary/game-summary.component';

@Component({
  selector: 'app-main-game',
  templateUrl: './main-game.component.html',
  styleUrls: ['./main-game.component.scss'],
  standalone: true,
  imports: [PlayerCardComponent, GameSummaryComponent],
})
export class MainGameComponent {
  readonly gameSrv = inject(GameService);
}
