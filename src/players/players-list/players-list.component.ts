import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-players-list',
  templateUrl: './players-list.component.html',
  styleUrls: ['./players-list.component.scss'],
})
export class PlayersListComponent {
  public players: string[] = [];
  public playersForm: FormGroup; // Créez un formulaire réactif
  public allPlayersCreated: boolean = false;
  @Output() public onBeginGame: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  constructor(private fb: FormBuilder) {
    this.playersForm = this.fb.group({
      newPlayer: ['', Validators.required], // Créez un champ "nouveauJoueur" avec validation requise
    });
  }

  public addPlayer() {
    if (this.playersForm.valid) {
      this.players.push(this.playersForm.value.nouveauJoueur);
      this.playersForm.reset(); // Réinitialisez le formulaire après l'ajout
    }
  }

  public beginGame(): void {
    this.onBeginGame.emit(this.players);
  }
}
