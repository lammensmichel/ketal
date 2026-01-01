import { Component, EventEmitter, inject, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlayerHelperService } from 'src/app/_shared/_helpers/player.helper';
import { PlayerModel } from 'src/app/_shared/_models/player.model';
import { LocalService } from 'src/app/services/local/local.service';
import { isNullOrWhiteSpace } from 'src/app/_shared/_helpers/string.helper';
import { GameService } from '../../../services/game/game.service';
import { PlayerListPlayerComponent } from '../player-list-player/player-list-player.component';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
  standalone: true,
  imports: [NgClass, ReactiveFormsModule, TranslateModule, PlayerListPlayerComponent],
})
export class PlayersListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly localService = inject(LocalService);
  readonly playerHelper = inject(PlayerHelperService);
  readonly gameSrv = inject(GameService);
  readonly translate = inject(TranslateService);

  readonly playersForm: FormGroup;
  allPlayersCreated = false;
  @Output() readonly beginGame = new EventEmitter<void>();

  constructor() {
    const localPlayer = JSON.parse(this.localService.getData('players') as string);
    if (localPlayer) {
      this.playerHelper.players = localPlayer;
    }
    this.playersForm = this.fb.group({
      newPlayer: ['', Validators.required],
    });
  }

  public addPlayer() {
    if (!this.playerHelper.isMaxPlayerNumberNotReached()) {
      return;
    }

    if (this.playersForm.valid && !isNullOrWhiteSpace(this.playersForm.controls['newPlayer'].value)) {
      this.playerHelper.addPlayer(this.playersForm.value.newPlayer);
      this.playersForm.reset();
    }
  }

  public getPlayers(): PlayerModel[] {
    return this.gameSrv.isNewGame() ? this.playerHelper.getPlayers() : this.gameSrv.players();
  }

  public getNewPlayerInputPlaceholder(): string {
    return this.translate.instant('Label_PlaceHolder_PlayerName');
  }

  get newPlayer() {
    return this.playersForm.get('newPlayer');
  }
}
