import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GameService } from '../../../services/game/game.service';
import { PlayerModel } from '../../../_shared/_models/player.model';

export interface PlayerSummary {
  name: string;
  sipsDrunk: number;
  sipsGiven: number;
  totalSips: number;
  isWinner: boolean;
  isLoser: boolean;
}

@Component({
  selector: 'app-game-summary',
  templateUrl: './game-summary.component.html',
  styleUrls: ['./game-summary.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, FontAwesomeModule],
})
export class GameSummaryComponent {
  private readonly gameSrv = inject(GameService);

  readonly playersSorted = computed<PlayerSummary[]>(() => {
    const players = this.gameSrv.players();
    if (!players || players.length === 0) {
      return [];
    }

    const summaries = players.map((player: PlayerModel) => ({
      name: player.name,
      sipsDrunk: player.sips['drunk'] || 0,
      sipsGiven: player.sips['given'] || 0,
      totalSips: (player.sips['drunk'] || 0) + (player.sips['given'] || 0),
      isWinner: false,
      isLoser: false,
    }));

    // Sort by total sips descending (most sips = loser = top of list)
    summaries.sort((a, b) => b.totalSips - a.totalSips);

    if (summaries.length > 0) {
      const maxSips = summaries[0].totalSips;
      const minSips = summaries[summaries.length - 1].totalSips;

      // Mark all players with max sips as losers
      summaries.forEach((s) => {
        if (s.totalSips === maxSips) {
          s.isLoser = true;
        }
      });

      // Mark all players with min sips as winners (only if different from max)
      if (minSips !== maxSips) {
        summaries.forEach((s) => {
          if (s.totalSips === minSips) {
            s.isWinner = true;
          }
        });
      }
    }

    return summaries;
  });

  readonly winner = computed<PlayerSummary | null>(() => {
    const sorted = this.playersSorted();
    return sorted.find((p) => p.isWinner) ?? null;
  });

  readonly loser = computed<PlayerSummary | null>(() => {
    const sorted = this.playersSorted();
    return sorted.find((p) => p.isLoser) ?? null;
  });

  replay(): void {
    this.gameSrv.resetGame();
  }

  exit(): void {
    this.gameSrv.resetGame();
  }
}
