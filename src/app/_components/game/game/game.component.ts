import {Component, Input, OnInit} from '@angular/core';
import {Game} from 'src/app/_shared/_models/game.model';
import {GameService} from "../../../services/game/game.service";

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  public playerCount: number = 0;
  public game: Game | undefined;

  constructor(
    public gameSrv: GameService,) {
  }

  public ngOnInit(): void {
    this.playerCount = this.gameSrv.game.players.length;
    this.gameSrv.game.maxTurnCount = this.playerCount * 4;
    this.game = this.gameSrv.game;
  }





}
