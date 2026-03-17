import { Component, inject, Input } from '@angular/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { GameService } from '../../../services/game/game.service';

@Component({
  selector: 'app-player-list-player',
  templateUrl: './player-list-player.component.html',
  styleUrls: ['./player-list-player.component.scss'],
  standalone: true,
  imports: [FontAwesomeIconsModule],
})
export class PlayerListPlayerComponent {
  private readonly playerHelper = inject(PlayerHelperService);
  protected readonly gameSrv = inject(GameService);

  @Input() player: PlayerModel | undefined;

  deletePlayer(player: PlayerModel): void {
    this.playerHelper.deletePlayer(player);
    if (this.playerHelper.getPlayerNumber() <= 1) {
      this.gameSrv.withSummaryMode.set(false);
    }
  }
}
