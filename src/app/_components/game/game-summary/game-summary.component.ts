import { Component } from '@angular/core';
import { PlayersListComponent } from '../../players/players-list/players-list.component';

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary.component.html',
  styleUrls: ['./game-summary.component.scss'],
  standalone: true,
  imports: [PlayersListComponent],
})
export class GameSummaryComponent {}
