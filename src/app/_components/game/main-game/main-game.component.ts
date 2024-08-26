import {Component, OnInit} from '@angular/core';
import {Game} from "../../../_shared/_models/game.model";
import {GameService} from "../../../services/game/game.service";
import {CardService} from "../../../services/card/card.service";
import {PlayerHelperService} from "../../../_shared/_helpers/player.helper";

@Component({
  selector: 'app-main-game',
  templateUrl: './main-game.component.html',
  styleUrls: ['./main-game.component.scss']
})
export class MainGameComponent implements OnInit{
  public playerCount: number = 0;
  public game: Game | undefined;

  constructor(
    public gameSrv: GameService,
    public playerHelper: PlayerHelperService,
    public cardSrv: CardService) {
  }

  public ngOnInit(): void {
    this.playerCount = this.gameSrv.game.players.length;
    this.gameSrv.game.maxTurnCount = this.playerCount * 4;
    this.game = this.gameSrv.game;
  }



}
