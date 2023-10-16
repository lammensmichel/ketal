import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PlayerHelperService } from 'src/helpers/player.helper';
import { LocalService } from 'src/app/services/local/local.service';
import { PlayerModel } from 'src/models/player.model';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
  public playersForm: FormGroup; // Créez un formulaire réactif
  public allPlayersCreated: boolean = false;
  @Output() public onBeginGame: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private fb: FormBuilder,
    public playerHelper: PlayerHelperService,
    public localService: LocalService
  ) {
    const localPlayer = JSON.parse(
      this.localService.getData('players') as string
    );
    if (localPlayer) {
      this.playerHelper.players = localPlayer;
    }
    this.playersForm = this.fb.group({
      newPlayer: ['', Validators.required], // Créez un champ "newPlayer" avec validation requise
    });
  }

  public addPlayer() {
    if (this.playersForm.valid) {
      this.playerHelper.addPlayer(this.playersForm.value.newPlayer);
      this.localService.saveData(
        'players',
        JSON.stringify(this.playerHelper.players)
      );
      this.playersForm.reset(); // Réinitialisez le formulaire après l'ajout
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

  public deletePlayer(player: PlayerModel) {
    this.playerHelper.players = this.playerHelper.players.filter(
      (playerSelected) => playerSelected.name !== player.name
    );

    this.localService.saveData(
      'players',
      JSON.stringify(this.playerHelper.players)
    );
  }

  get newPlayer() {
    return this.playersForm.get('newPlayer');
  }
}
