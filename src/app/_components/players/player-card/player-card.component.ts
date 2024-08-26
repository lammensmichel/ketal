import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PlayerModel} from "../../../_shared/_models/player.model";
import {PlayerGivenSipsSelectionComponent} from "../player-given-sips-selection/player-given-sips-selection.component";
import {GameService} from "../../../services/game/game.service";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss']
})


export class PlayerCardComponent implements OnInit, OnDestroy {
  @ViewChild(PlayerGivenSipsSelectionComponent) PlayerGivenSipsSelectionComponent: PlayerGivenSipsSelectionComponent | undefined;

  @Input() player: PlayerModel = new PlayerModel();

  private openGivenSipModalSub: Subscription = new Subscription();

  constructor(
    public playerSrv: PlayerHelperService,
    public gameSrv: GameService) {
  }


  ngOnInit(): void {
    this.openGivenSipModalSub = this.gameSrv.openSipGiveModalEvent$.subscribe( (player) => {
      if (this.player.id === player.id) {
        this.onpenPlayerGivenSipsSelectionModal(player);
      }
    });
  }

  getSipCnt(player: PlayerModel, absolute: boolean = false) {
    if (player) {
      return this.playerSrv.getSipCnt(this.gameSrv.game, player, absolute);
    } else {
      return 0;
    }

  }

  onpenPlayerGivenSipsSelectionModal(player: PlayerModel) {
    // Do not open modal if player number is 1
    if (this.playerSrv.getPlayerNumber() === 1 || !this.gameSrv.isSummaryActivated()) return;

    const totalGivenSips = this.playerSrv.getTotalGivenSips(player);

    if (this.getSipCnt(player) > 0 && totalGivenSips > 0) {
      this.PlayerGivenSipsSelectionComponent?.openModal(player);
    }
  }

  ngOnDestroy(): void {
    if (this.openGivenSipModalSub) this.openGivenSipModalSub.unsubscribe();
  }


}
