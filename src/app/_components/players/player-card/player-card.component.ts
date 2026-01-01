import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { takeUntil } from "rxjs";
import { SafeUnsubscribe } from 'src/app/_shared/_helpers/safe-unsubscribe.helper';
import { PlayerHelperService } from "../../../_shared/_helpers/player.helper";
import { PlayerModel } from "../../../_shared/_models/player.model";
import { GameService } from "../../../services/game/game.service";
import { PlayerGivenSipsSelectionComponent } from "../player-given-sips-selection/player-given-sips-selection.component";
@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss']
})

export class PlayerCardComponent extends SafeUnsubscribe implements OnInit {
  @ViewChild(PlayerGivenSipsSelectionComponent) PlayerGivenSipsSelectionComponent: PlayerGivenSipsSelectionComponent | undefined;

  @Input() player: PlayerModel = new PlayerModel();

  constructor(
    public playerSrv: PlayerHelperService,
    public gameSrv: GameService) {
      super();
  }


  public ngOnInit(): void {
    this.gameSrv.openSipGiveModalEvent$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe( (player: PlayerModel) => {
      if (this.player.id === player.id) {
        this.onpenPlayerGivenSipsSelectionModal(player);
      }
    });
  }

  public getSipCount(player: PlayerModel, absolute: boolean = false) {
    if (player) {
      return this.playerSrv.getSipCnt(this.gameSrv.game, player, absolute);
    } else {
      return 0;
    }

  }

  public onpenPlayerGivenSipsSelectionModal(player: PlayerModel) {
    // Do not open modal if player number is 1
    if (this.playerSrv.getPlayerNumber() === 1 || !this.gameSrv.isSummaryActivated()) return;

    const totalGivenSips = this.playerSrv.getTotalGivenSips(player);

    if (this.getSipCount(player) > 0 && totalGivenSips > 0) {
      this.PlayerGivenSipsSelectionComponent?.openModal(player);
    }
  }
}
