import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PlayerModel} from "../../../_shared/_models/player.model";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";
import {GameService} from "../../../services/game/game.service";

@Component({
  selector: 'app-player-list-player',
  templateUrl: './player-list-player.component.html',
  styleUrls: ['./player-list-player.component.scss']
})
export class PlayerListPlayerComponent implements OnInit {
  @Input() player: PlayerModel | undefined;



  constructor(public playerHelper: PlayerHelperService,
              public gameSrv: GameService,) {
  }


  public deletePlayer(player: PlayerModel) {
    this.playerHelper.deletePlayer(player);
    if(this.playerHelper.getPlayerNumber() <= 1) {
      this.gameSrv.setWithSummaryMode(false);
    }
  }

  ngOnInit(): void {
  }


}
