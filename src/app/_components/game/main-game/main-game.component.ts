import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { GameService } from '../../../services/game/game.service';
import { GameProgressComponent } from '../../../_shared/_components/game-progress/game-progress.component';
import { PlayerCardComponent } from '../../players/player-card/player-card.component';
import { GameSummaryComponent } from '../game-summary/game-summary.component';

@Component({
  selector: 'app-main-game',
  templateUrl: './main-game.component.html',
  styleUrls: ['./main-game.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameProgressComponent, PlayerCardComponent, GameSummaryComponent],
})
export class MainGameComponent {
  readonly gameSrv = inject(GameService);

  readonly inactivePlayers = computed(() => {
    const active = this.gameSrv.activePlayer();
    if (!active) {
      return [];
    }
    return this.gameSrv.players().filter((p) => p.id !== active.id);
  });
}
