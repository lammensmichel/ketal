import {Component, Input} from '@angular/core';
import {PlayerModel} from "../../../_shared/_models/player.model";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";

@Component({
  selector: 'app-player-list-player',
  templateUrl: './player-list-player.component.html',
  styleUrls: ['./player-list-player.component.scss']
})
export class PlayerListPlayerComponent {
  @Input() player: PlayerModel | undefined;

  constructor(public playerHelper: PlayerHelperService) {
  }


  public deletePlayer(player: PlayerModel) {
    this.playerHelper.deletePlayer(player);
  }
}
