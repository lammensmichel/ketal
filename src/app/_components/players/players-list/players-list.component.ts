import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {PlayerHelperService} from 'src/app/_shared/_helpers/player.helper';
import {PlayerModel} from 'src/app/_shared/_models/player.model';
import {LocalService} from 'src/app/services/local/local.service';
import {GameService} from "../../../services/game/game.service";
import {String} from 'typescript-string-operations';
import {MatDialog} from '@angular/material/dialog';


@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent implements OnInit {

  public playersForm: FormGroup;
  public allPlayersCreated: boolean = false;
  @Output() public onBeginGame: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    public playerHelper: PlayerHelperService,
    public localService: LocalService,
    public gameSrv: GameService,
    public translate: TranslateService,
    public dialog: MatDialog
  ) {
    const localPlayer = JSON.parse(
      this.localService.getData('players') as string
    );
    if (localPlayer) {
      this.playerHelper.players = localPlayer;
    }
    this.playersForm = this.fb.group({
      newPlayer: ['', Validators.required],
    });
  }

  ngOnInit(): void {
  }

  public addPlayer() {
    if (!this.playerHelper.isMaxPlayerNumberNotReached()) {
      return;
    }

    if (this.playersForm.valid && !String.isNullOrWhiteSpace(this.playersForm.controls['newPlayer'].value)) {
      this.playerHelper.addPlayer(this.playersForm.value.newPlayer);
      this.playersForm.reset();
    }
  }

  public getPlayers(): PlayerModel[] {
    return this.gameSrv.isNewGame() ?  this.playerHelper.getPlayers() : this.gameSrv.game.players;
  }


  public getNewPlayerInputPlaceholder(): string {
    return this.translate.instant('Label_PlaceHolder_PlayerName');
  }

  get newPlayer() {
    return this.playersForm.get('newPlayer');
  }

}
