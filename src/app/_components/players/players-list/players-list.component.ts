import { Component, EventEmitter, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {PlayerHelperService} from 'src/app/_shared/_helpers/player.helper';
import {PlayerModel} from 'src/app/_shared/_models/player.model';
import {LocalService} from 'src/app/services/local/local.service';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {

  public playersForm: FormGroup;
  public allPlayersCreated: boolean = false;
  @Output() public onBeginGame: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    public playerHelper: PlayerHelperService,
    public localService: LocalService,
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

  public addPlayer() {
    if(!this.playerHelper.isMaxPlayerNumberNotReached() ) return;
    if (this.playersForm.valid) {
      this.playerHelper.addPlayer(this.playersForm.value.newPlayer);
      this.localService.saveData(
        'players',
        JSON.stringify(this.playerHelper.players)
      );
      this.playersForm.reset();
    }
  }

  public getPlayers(): PlayerModel[] {
    return this.playerHelper.players;
  }

  public beginGame(): void {
    this.onBeginGame.emit();
  }

  public hasPlayers(): boolean {
    return this.playerHelper?.players?.length > 0;
  }

  get newPlayer() {
    return this.playersForm.get('newPlayer');
  }


}
